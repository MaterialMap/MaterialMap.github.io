// @ts-check
const { test, expect } = require('@playwright/test');

test('Johnson-Cook calculator units conversion', async ({ page }) => {
  // Navigate to the Johnson-Cook calculator
  await page.goto('http://localhost:8082/johnson_cook_calculator.html');
  
  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');
  
  // Enable debug mode for units handler
  await page.evaluate(() => {
    if (window.unitsHandler) {
      window.unitsHandler.setDebugMode(true);
      console.log('Debug mode enabled for UnitsHandler');
    } else {
      console.log('UnitsHandler not found');
    }
  });
  
  // Input test values
  await page.fill('#yieldStrength', '350');
  await page.fill('#ultimateStrength', '450');
  await page.fill('#youngModulus', '210000');
  await page.fill('#strainAtYield', '0.002');
  await page.fill('#strainAtUltimate', '0.2');
  await page.fill('#strainRateCoeff', '0.015');
  await page.fill('#referenceStrainRate', '1');
  
  // Get initial values
  const initialYieldStrength = await page.inputValue('#yieldStrength');
  console.log(`Initial yield strength: ${initialYieldStrength} MPa`);
  
  // First click the units settings button to open the panel
  await page.click('.units-toggle');
  
  // Wait for the panel to appear
  await page.waitForSelector('#unitsSettings', { state: 'visible' });
  
  // Add console listener to capture logs
  page.on('console', msg => {
    console.log(`BROWSER LOG: ${msg.text()}`);
  });
  
  // Now select GPa from the dropdown
  await page.selectOption('#pressureUnit', 'GPa');
  
  // Wait for conversion to complete
  await page.waitForTimeout(1000);
  
  // Check if UnitsHandler is working correctly
  const unitsHandlerStatus = await page.evaluate(() => {
    if (!window.unitsHandler) return 'UnitsHandler not found';
    if (!window.unitsHandler.initialized) return 'UnitsHandler not initialized';
    
    // Try manual conversion
    const testQuantity = window.unitsHandler.createQuantity(350, 'MPa');
    if (!testQuantity) return 'Failed to create quantity';
    
    const converted = window.unitsHandler.convert(testQuantity, 'GPa');
    if (!converted) return 'Failed to convert quantity';
    
    const value = window.unitsHandler.getValue(converted);
    return `Manual conversion test: 350 MPa -> ${value} GPa`;
  });
  
  console.log(unitsHandlerStatus);
  
  // Get converted values
  const convertedYieldStrength = await page.inputValue('#yieldStrength');
  console.log(`Converted yield strength: ${convertedYieldStrength} GPa`);
  
  // Check if conversion was correct (350 MPa should be 0.35 GPa)
  const expectedGPaValue = 0.35;
  const actualGPaValue = parseFloat(convertedYieldStrength);
  
  // Allow for small floating point differences
  expect(Math.abs(actualGPaValue - expectedGPaValue)).toBeLessThan(0.01);
  
  // Change back to MPa
  await page.selectOption('#pressureUnit', 'MPa');
  
  // Wait for conversion to complete
  await page.waitForTimeout(1000);
  
  // Get converted back values
  const reconvertedYieldStrength = await page.inputValue('#yieldStrength');
  console.log(`Reconverted yield strength: ${reconvertedYieldStrength} MPa`);
  
  // Check if conversion back was correct (0.35 GPa should be 350 MPa)
  const expectedMPaValue = 350;
  const actualMPaValue = parseFloat(reconvertedYieldStrength);
  
  // Allow for small floating point differences
  expect(Math.abs(actualMPaValue - expectedMPaValue)).toBeLessThan(1);
});