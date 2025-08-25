/**
 * EOS JWL CSV Generator for Material MAP
 * 
 * This script scans all TOML files and extracts EOS_JWL data into a unified CSV file.
 * The generated CSV contains all EOS_JWL parameters for easy analysis and comparison.
 */

const fs = require('fs');
const path = require('path');
const TOML = require('toml');

// Configuration
const CONFIG = {
  DATA_DIR: path.join(__dirname, '..', 'data'),
  OUTPUT_FILE: path.join(__dirname, '..', 'dist', 'eos-jwl-data.csv'),
  FILE_EXTENSION: '.toml'
};

// Ensure the dist directory exists
if (!fs.existsSync(path.dirname(CONFIG.OUTPUT_FILE))) {
  fs.mkdirSync(path.dirname(CONFIG.OUTPUT_FILE), { recursive: true });
}

// CSV Headers for EOS_JWL data - simplified to only include needed fields
const CSV_HEADERS = [
  'source_file',
  'material_title',
  'a',
  'b', 
  'r1',
  'r2',
  'omeg',
  'units'
];

/**
 * Parse EOS_JWL parameters from LS-DYNA formatted text
 * @param {string} eosData - The eos_data field content
 * @returns {Object} Parsed parameters
 */
function parseEosJwlData(eosData) {
  const result = {
    eos_type: '',
    a: '',
    b: '',
    r1: '',
    r2: '',
    omeg: '',
    material_title: ''
  };

  // Extract EOS type and title
  const titleMatch = eosData.match(/\*(EOS_JWL[_A-Z]*)/);
  if (titleMatch) {
    result.eos_type = titleMatch[1];
  }

  // Extract material title (line after EOS declaration)
  const lines = eosData.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('*EOS_JWL')) {
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.startsWith('$') && !nextLine.startsWith('#')) {
          result.material_title = nextLine;
        }
      }
      break;
    }
  }

  // Find numeric data lines - these contain the actual parameters
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip comment lines, blank lines, title lines
    if (!line || line.startsWith('$') || line.startsWith('*') || line.startsWith('#')) {
      continue;
    }
    
    // Check if this line contains numeric data (starts with numbers or spaces)
    if (/^\s*\d/.test(line)) {
      const params = line.trim().split(/\s+/).filter(p => p.length > 0);
      
      // Main EOS_JWL parameters line (8 parameters: EOSID, A, B, R1, R2, OMEG, E0, V0)
      // We only need A, B, R1, R2, OMEG (parameters 1-5, skipping EOSID at index 0)
      if (params.length >= 6 && !result.a) {
        result.a = params[1] || '';     // A parameter
        result.b = params[2] || '';     // B parameter  
        result.r1 = params[3] || '';    // R1 parameter
        result.r2 = params[4] || '';    // R2 parameter
        result.omeg = params[5] || '';  // OMEG parameter
      }
    }
  }

  return result;
}

/**
 * Extract EOS_JWL data from all TOML files
 * @returns {Array} Array of EOS_JWL data objects
 */
function extractEosJwlData() {
  const eosJwlData = [];
  
  try {
    const files = fs.readdirSync(CONFIG.DATA_DIR);
    const tomlFiles = files.filter(file => file.endsWith(CONFIG.FILE_EXTENSION));
    
    console.log(`Processing ${tomlFiles.length} TOML files...`);
    
    for (const file of tomlFiles) {
      const filePath = path.join(CONFIG.DATA_DIR, file);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = TOML.parse(content);
        
        if (parsed.material && Array.isArray(parsed.material)) {
          for (const material of parsed.material) {
            if (material.eos_data && typeof material.eos_data === 'string') {
              // Check if this is specifically EOS_JWL_TITLE data (not EOS_JWL_AFTERBURN)
              if (material.eos_data.includes('*EOS_JWL_TITLE')) {
                const eosParams = parseEosJwlData(material.eos_data);
                
                // Create simplified data object with only needed fields
                const dataRow = {
                  source_file: file,
                  material_title: eosParams.material_title,
                  a: eosParams.a,
                  b: eosParams.b,
                  r1: eosParams.r1,
                  r2: eosParams.r2,
                  omeg: eosParams.omeg,
                  units: material.units || ''
                };
                
                eosJwlData.push(dataRow);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not process file ${file}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error reading data directory:', error);
    return [];
  }
  
  return eosJwlData;
}

/**
 * Convert data array to CSV format
 * @param {Array} data - Array of data objects
 * @returns {string} CSV formatted string
 */
function convertToCSV(data) {
  if (data.length === 0) {
    return CSV_HEADERS.join(',') + '\n';
  }
  
  // Escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  
  // Create CSV content
  let csv = CSV_HEADERS.join(',') + '\n';
  
  for (const row of data) {
    const csvRow = CSV_HEADERS.map(header => escapeCSV(row[header])).join(',');
    csv += csvRow + '\n';
  }
  
  return csv;
}

/**
 * Generate EOS_JWL CSV file
 */
function generateEosJwlCSV() {
  console.log('Extracting EOS_JWL data from TOML files...');
  
  const eosJwlData = extractEosJwlData();
  
  if (eosJwlData.length === 0) {
    console.warn('No EOS_JWL data found in TOML files.');
    // Still create empty CSV with headers
  }
  
  const csvContent = convertToCSV(eosJwlData);
  
  try {
    fs.writeFileSync(CONFIG.OUTPUT_FILE, csvContent, 'utf-8');
    console.log(`EOS_JWL CSV generated successfully with ${eosJwlData.length} entries.`);
    console.log(`Output file: ${CONFIG.OUTPUT_FILE}`);
    return true;
  } catch (error) {
    console.error('Error writing CSV file:', error);
    return false;
  }
}

// Run the generator
const success = generateEosJwlCSV();
process.exit(success ? 0 : 1);