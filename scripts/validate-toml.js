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

// Validate a single TOML file
function validateTomlFile(filePath) {
  const fileName = path.basename(filePath);
  const errors = [];
  
  try {
    // Read and parse the file
    const content = fs.readFileSync(filePath, 'utf8');
    const data = toml.parse(content);
    
    // Check if the file has the material array
    if (!data.material || !Array.isArray(data.material)) {
      errors.push(`Missing or invalid 'material' array`);
      return { fileName, errors, valid: false };
    }
    
    // Validate each material entry
    data.material.forEach((material, index) => {
      // Check required fields
      CONFIG.REQUIRED_FIELDS.forEach(field => {
        if (!material[field]) {
          errors.push(`Material #${index + 1}: Missing required field '${field}'`);
        }
      });
      
      // Check if at least one reference field is present
      const hasReference = CONFIG.REFERENCE_FIELDS.some(field => material[field]);
      if (!hasReference) {
        errors.push(`Material #${index + 1}: Missing reference - at least one of [${CONFIG.REFERENCE_FIELDS.join(', ')}] is required`);
      }
      
      // Check if at least one material data field is present
      const hasMaterialData = CONFIG.MATERIAL_DATA_FIELDS.some(field => material[field]);
      if (!hasMaterialData) {
        errors.push(`Material #${index + 1}: Missing material data - at least one of [${CONFIG.MATERIAL_DATA_FIELDS.join(', ')}] is required`);
      }
      
      // Check if app is an array
      if (material.app && !Array.isArray(material.app)) {
        errors.push(`Material #${index + 1}: Field 'app' must be an array`);
      }
    });
    
    return {
      fileName,
      errors,
      valid: errors.length === 0
    };
  } catch (error) {
    errors.push(`Parsing error: ${error.message}`);
    return { fileName, errors, valid: false };
  }
}

// Validate all TOML files
function validateAllFiles() {
  const files = getTomlFiles();
  
  if (files.length === 0) {
    console.warn('No TOML files found in the data directory.');
    return true;
  }
  
  console.log(`Validating ${files.length} TOML files...`);
  
  const results = files.map(validateTomlFile);
  const validFiles = results.filter(result => result.valid);
  const invalidFiles = results.filter(result => !result.valid);
  
  console.log(`\nValidation complete: ${validFiles.length} valid, ${invalidFiles.length} invalid`);
  
  if (invalidFiles.length > 0) {
    console.log('\nInvalid files:');
    invalidFiles.forEach(result => {
      console.log(`\n${result.fileName}:`);
      result.errors.forEach(error => console.log(`  - ${error}`));
    });
    return false;
  }
  
  return true;
}

// Run the validator
const success = validateAllFiles();
process.exit(success ? 0 : 1);