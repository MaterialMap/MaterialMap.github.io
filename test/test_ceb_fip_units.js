const { test, expect } = require('@playwright/test');

test('CEB-FIP Calculator units conversion', async ({ page }) => {
  // Navigate to the CEB-FIP calculator
  await page.goto('http://127.0.0.1:5500/ceb_fip_calculator.html');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Show units panel
  await page.click('button.units-toggle');
  
  // Wait for units panel to be visible
  await page.waitForSelector('#unitsSettings', { state: 'visible' });
  
  // Get initial values
  const initialFck = await page.inputValue('#fck');
  const initialRho = await page.inputValue('#rho');
  const initialDmax = await page.inputValue('#dmax');
  
  console.log(`Initial values: fck=${initialFck}, rho=${initialRho}, dmax=${initialDmax}`);
  
  // Change pressure unit from MPa to GPa
  await page.selectOption('#pressureUnit', 'GPa');
  
  // Wait a bit for conversion
  await page.waitForTimeout(500);
  
  // Check if fck value was converted
  const convertedFck = await page.inputValue('#fck');
  console.log(`After pressure unit change: fck=${convertedFck}`);
  
  // The value should be converted from MPa to GPa (divided by 1000)
  const expectedFckInGPa = parseFloat(initialFck) / 1000;
  expect(Math.abs(parseFloat(convertedFck) - expectedFckInGPa)).toBeLessThan(0.001);
  
  // Change density unit from kg/m³ to g/cm³
  await page.selectOption('#densityUnit', 'g/cm³');
  
  // Wait a bit for conversion
  await page.waitForTimeout(500);
  
  // Check if rho value was converted
  const convertedRho = await page.inputValue('#rho');
  console.log(`After density unit change: rho=${convertedRho}`);
  
  // The value should be converted from kg/m³ to g/cm³ (divided by 1000)
  const expectedRhoInGCm3 = parseFloat(initialRho) / 1000;
  expect(Math.abs(parseFloat(convertedRho) - expectedRhoInGCm3)).toBeLessThan(0.001);
  
  // Change length unit from mm to cm
  await page.selectOption('#lengthUnit', 'cm');
  
  // Wait a bit for conversion
  await page.waitForTimeout(500);
  
  // Check if dmax value was converted
  const convertedDmax = await page.inputValue('#dmax');
  console.log(`After length unit change: dmax=${convertedDmax}`);
  
  // The value should be converted from mm to cm (divided by 10)
  const expectedDmaxInCm = parseFloat(initialDmax) / 10;
  expect(Math.abs(parseFloat(convertedDmax) - expectedDmaxInCm)).toBeLessThan(0.001);
  
  // Check that unit displays are updated correctly
  const fckUnitDisplay = await page.textContent('#fckUnit');
  const rhoUnitDisplay = await page.textContent('#rhoUnit');
  const dmaxUnitDisplay = await page.textContent('#dmaxUnit');
  
  expect(fckUnitDisplay).toBe('GPa');
  expect(rhoUnitDisplay).toBe('g/cm³');
  expect(dmaxUnitDisplay).toBe('cm');
  
  console.log('All unit conversions working correctly!');
});