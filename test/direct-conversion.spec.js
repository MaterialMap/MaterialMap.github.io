// @ts-check
const { test, expect } = require('@playwright/test');

test('Johnson-Cook calculator direct unit conversion', async ({ page }) => {
  // Navigate to the Johnson-Cook calculator
  await page.goto('http://localhost:8082/johnson_cook_calculator.html');
  
  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');
  
  // Set up console listener
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.text()}`);
  });
  
  // Input test values
  await page.fill('#yieldStrength', '350');
  await page.fill('#ultimateStrength', '450');
  await page.fill('#youngModulus', '210000');
  
  // Get initial values
  const initialYieldStrength = await page.inputValue('#yieldStrength');
  console.log(`Initial yield strength: ${initialYieldStrength} MPa`);
  
  // First click the units settings button to open the panel
  await page.click('.units-toggle');
  
  // Wait for the panel to appear
  await page.waitForSelector('#unitsSettings', { state: 'visible' });
  
  // Now select GPa from the dropdown
  await page.selectOption('#pressureUnit', 'GPa');
  
  // Wait for conversion to complete
  await page.waitForTimeout(1000);
  
  // Get converted values
  const convertedYieldStrength = await page.inputValue('#yieldStrength');
  console.log(`Converted yield strength: ${convertedYieldStrength} GPa`);
  
  // Check if conversion was correct (350 MPa should be 0.35 GPa)
  const expectedGPaValue = 0.35;
  const actualGPaValue = parseFloat(convertedYieldStrength);
  
  // Allow for small floating point differences
  expect(Math.abs(actualGPaValue - expectedGPaValue)).toBeLessThan(0.01);
});

test('Swift Law calculator direct unit conversion', async ({ page }) => {
  // Navigate to the Swift Law calculator
  await page.goto('http://localhost:8082/swift_law_calculator.html');
  
  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');
  
  // Set up console listener
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.text()}`);
  });
  
  // Input test values
  await page.fill('#youngModulus', '210000');
  await page.fill('#yieldStrength', '350');
  await page.fill('#tensileStrength', '450');
  
  // Get initial values
  const initialYieldStrength = await page.inputValue('#yieldStrength');
  console.log(`Initial yield strength: ${initialYieldStrength} MPa`);
  
  // First click the units settings button to open the panel
  await page.click('.units-toggle');
  
  // Wait for the panel to appear
  await page.waitForSelector('#unitsSettings', { state: 'visible' });
  
  // Now select GPa from the dropdown
  await page.selectOption('#pressureUnit', 'GPa');
  
  // Wait for conversion to complete
  await page.waitForTimeout(1000);
  
  // Get converted values
  const convertedYieldStrength = await page.inputValue('#yieldStrength');
  console.log(`Converted yield strength: ${convertedYieldStrength} GPa`);
  
  // Check if conversion was correct (350 MPa should be 0.35 GPa)
  const expectedGPaValue = 0.35;
  const actualGPaValue = parseFloat(convertedYieldStrength);
  
  // Allow for small floating point differences
  expect(Math.abs(actualGPaValue - expectedGPaValue)).toBeLessThan(0.01);
});