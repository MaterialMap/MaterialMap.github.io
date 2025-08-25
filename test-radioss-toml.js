const fs = require('fs');
const { parse } = require('smol-toml');

try {
  const content = fs.readFileSync('./data/radioss.toml', 'utf8');
  console.log('File content length:', content.length);
  console.log('First 200 characters:');
  console.log(content.substring(0, 200));
  console.log('\n--- Parsing with smol-toml ---');
  const parsed = parse(content);
  console.log('Successfully parsed!');
  console.log('Number of materials:', parsed.material.length);
} catch (error) {
  console.error('Error parsing TOML:', error.message);
  console.error('Error details:', error);
}