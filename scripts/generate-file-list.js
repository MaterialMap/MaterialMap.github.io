/**
 * File List Generator for Material MAP
 * 
 * This script scans the data directory and generates a JSON file with all TOML files.
 * The generated file is used by the application to load material data.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  DATA_DIR: path.join(__dirname, '..', 'data'),
  OUTPUT_FILE: path.join(__dirname, '..', 'dist', 'file-list.json'),
  FILE_EXTENSION: '.toml'
};

// Ensure the dist directory exists
if (!fs.existsSync(path.dirname(CONFIG.OUTPUT_FILE))) {
  fs.mkdirSync(path.dirname(CONFIG.OUTPUT_FILE), { recursive: true });
}

// Get all TOML files from the data directory
function getTomlFiles() {
  try {
    const files = fs.readdirSync(CONFIG.DATA_DIR);
    return files.filter(file => file.endsWith(CONFIG.FILE_EXTENSION));
  } catch (error) {
    console.error('Error reading data directory:', error);
    return [];
  }
}

// Generate the file list
function generateFileList() {
  const files = getTomlFiles();
  
  if (files.length === 0) {
    console.warn('No TOML files found in the data directory.');
    return false;
  }
  
  try {
    fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(files, null, 2));
    console.log(`File list generated successfully with ${files.length} files.`);
    return true;
  } catch (error) {
    console.error('Error writing file list:', error);
    return false;
  }
}

// Run the generator
const success = generateFileList();
process.exit(success ? 0 : 1);