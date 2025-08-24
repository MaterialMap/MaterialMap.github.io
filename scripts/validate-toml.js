/**
 * TOML Validator for Material MAP
 * 
 * This script validates all TOML files in the data directory to ensure they
 * have the correct structure and required fields.
 */

const fs = require('fs');
const path = require('path');
let toml;

// Try to load the TOML parser
try {
  toml = require('toml');
} catch (error) {
  console.error('TOML parser not found. Installing...');
  console.error('Please run: npm install toml --save-dev');
  process.exit(1);
}

// Configuration
const CONFIG = {
  DATA_DIR: path.join(__dirname, '..', 'data'),
  FILE_EXTENSION: '.toml',
  REQUIRED_FIELDS: ['app'], // Always required
  REFERENCE_FIELDS: ['ref', 'url'], // At least one must be present
  MATERIAL_DATA_FIELDS: ['mat_data', 'eos_data'], // At least one must be present
  OPTIONAL_FIELDS: ['mat_add_data', 'mat_thermal_data', 'units', 'comments']
};

// Get all TOML files from the data directory
function getTomlFiles() {
  try {
    const files = fs.readdirSync(CONFIG.DATA_DIR);
    return files
      .filter(file => file.endsWith(CONFIG.FILE_EXTENSION))
      .map(file => path.join(CONFIG.DATA_DIR, file));
  } catch (error) {
    console.error('Error reading data directory:', error);
    return [];
  }
}

// Helper function to find approximate line number of an error
function findLineNumber(content, searchText) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchText)) {
      return i + 1; // Line numbers are 1-based
    }
  }
  return null;
}

// Helper function to analyze TOML structure and find material sections
function findMaterialSections(content) {
  const lines = content.split('\n');
  const materialSections = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '[[material]]') {
      materialSections.push(i + 1); // Store 1-based line number
    }
  }
  
  return materialSections;
}

// Validate a single TOML file
function validateTomlFile(filePath) {
  const fileName = path.basename(filePath);
  const errors = [];
  let content = '';
  
  try {
    // Read the file content
    content = fs.readFileSync(filePath, 'utf8');
    
    // Try to parse the file
    const data = toml.parse(content);
    
    // Check if the file has the material array
    if (!data.material || !Array.isArray(data.material)) {
      const lineNum = findLineNumber(content, '[[material]]') || 'unknown';
      errors.push(`Missing or invalid 'material' array (expected [[material]] sections, first section at line ${lineNum})`);
      return { fileName, errors, valid: false };
    }
    
    // Find all material section line numbers
    const materialSections = findMaterialSections(content);
    
    // Validate each material entry
    data.material.forEach((material, index) => {
      const sectionLine = materialSections[index] || 'unknown';
      const materialId = `Material #${index + 1} (line ${sectionLine})`;
      
      // Check required fields
      CONFIG.REQUIRED_FIELDS.forEach(field => {
        if (!material[field]) {
          const fieldLine = findLineNumber(content, `${field} =`) || 'not found';
          errors.push(`${materialId}: Missing required field '${field}' (expected around line ${fieldLine})`);
        }
      });
      
      // Check if at least one reference field is present
      const hasReference = CONFIG.REFERENCE_FIELDS.some(field => material[field]);
      if (!hasReference) {
        errors.push(`${materialId}: Missing reference - at least one of [${CONFIG.REFERENCE_FIELDS.join(', ')}] is required`);
      }
      
      // Check if at least one material data field is present
      const hasMaterialData = CONFIG.MATERIAL_DATA_FIELDS.some(field => material[field]);
      if (!hasMaterialData) {
        errors.push(`${materialId}: Missing material data - at least one of [${CONFIG.MATERIAL_DATA_FIELDS.join(', ')}] is required`);
      }
      
      // Check if app is an array
      if (material.app && !Array.isArray(material.app)) {
        const appLine = findLineNumber(content, 'app =') || 'unknown';
        errors.push(`${materialId}: Field 'app' must be an array (line ${appLine})`);
      }
      
      // Additional validation: check for empty required fields
      CONFIG.REQUIRED_FIELDS.forEach(field => {
        if (material[field] !== undefined) {
          if (Array.isArray(material[field]) && material[field].length === 0) {
            errors.push(`${materialId}: Field '${field}' cannot be empty array`);
          } else if (typeof material[field] === 'string' && material[field].trim() === '') {
            errors.push(`${materialId}: Field '${field}' cannot be empty string`);
          }
        }
      });
    });
    
    return {
      fileName,
      errors,
      valid: errors.length === 0,
      materialCount: data.material.length
    };
    
  } catch (error) {
    // Enhanced error reporting for parsing errors
    let errorMsg = `Parsing error: ${error.message}`;
    
    // Try to extract line information from error message
    const lineMatch = error.message.match(/line (\d+)/i);
    if (lineMatch) {
      const lineNum = parseInt(lineMatch[1]);
      const lines = content.split('\n');
      if (lines[lineNum - 1]) {
        errorMsg += `\n    Problem line ${lineNum}: "${lines[lineNum - 1].trim()}"`;
        
        // Show context around the error
        const start = Math.max(0, lineNum - 3);
        const end = Math.min(lines.length, lineNum + 2);
        errorMsg += `\n    Context (lines ${start + 1}-${end}):`;
        for (let i = start; i < end; i++) {
          const marker = i === lineNum - 1 ? ' >>> ' : '     ';
          errorMsg += `\n    ${marker}${i + 1}: ${lines[i]}`;
        }
      }
    }
    
    errors.push(errorMsg);
    return { fileName, errors, valid: false, materialCount: 0 };
  }
}

// Validate all TOML files
function validateAllFiles() {
  const files = getTomlFiles();
  
  if (files.length === 0) {
    console.warn('No TOML files found in the data directory.');
    return true;
  }
  
  console.log(`🔍 Validating ${files.length} TOML files...`);
  console.log('━'.repeat(60));
  
  const results = files.map(validateTomlFile);
  const validFiles = results.filter(result => result.valid);
  const invalidFiles = results.filter(result => !result.valid);
  
  // Calculate total materials
  const totalMaterials = results.reduce((sum, result) => sum + (result.materialCount || 0), 0);
  
  console.log('━'.repeat(60));
  console.log(`📊 Validation Summary:`);
  console.log(`   Files: ${validFiles.length} valid, ${invalidFiles.length} invalid (${files.length} total)`);
  console.log(`   Materials: ${totalMaterials} total across all files`);
  
  // Show valid files summary
  if (validFiles.length > 0) {
    console.log(`\n✅ Valid files (${validFiles.length}):`);
    validFiles.forEach(result => {
      const materialText = result.materialCount === 1 ? 'material' : 'materials';
      console.log(`   ${result.fileName} - ${result.materialCount} ${materialText}`);
    });
  }
  
  // Show invalid files with detailed errors
  if (invalidFiles.length > 0) {
    console.log(`\n❌ Invalid files (${invalidFiles.length}):`);
    console.log('━'.repeat(60));
    
    invalidFiles.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.fileName}:`);
      result.errors.forEach(error => {
        const lines = error.split('\n');
        console.log(`   🚫 ${lines[0]}`);
        // Print additional context lines with indentation
        if (lines.length > 1) {
          lines.slice(1).forEach(line => {
            console.log(`      ${line}`);
          });
        }
      });
      
      if (result.materialCount > 0) {
        const materialText = result.materialCount === 1 ? 'material' : 'materials';
        console.log(`   ℹ️  File contains ${result.materialCount} ${materialText}`);
      }
    });
    
    console.log('\n━'.repeat(60));
    console.log('💡 Quick fixes:');
    console.log('   • Check TOML syntax with online validators');
    console.log('   • Ensure all [[material]] sections have required fields');
    console.log('   • Use npm run validate-data for local testing');
    console.log('━'.repeat(60));
    
    return false;
  }
  
  console.log('\n🎉 All TOML files are valid!');
  return true;
}

// Run the validator
const success = validateAllFiles();
process.exit(success ? 0 : 1);