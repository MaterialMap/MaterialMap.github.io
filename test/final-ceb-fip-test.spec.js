const { test, expect } = require('@playwright/test');

test('CEB-FIP Calculator - Final Verification', async ({ page }) => {
  // Navigate to the calculator
  await page.goto('http://127.0.0.1:5500/ceb_fip_calculator.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Verify page loads correctly
  await expect(page).toHaveTitle(/CEB-FIP Model Calculator/);
  await expect(page.locator('h1')).toContainText('CEB-FIP Model Calculator');

  // Verify input fields are present and have default values
  await expect(page.locator('#fck')).toHaveValue('40');
  await expect(page.locator('#dmax')).toHaveValue('16.0');
  await expect(page.locator('#rho')).toHaveValue('2400');

  // Verify results are displayed
  await expect(page.locator('#results')).toBeVisible();
  
  // Verify specific calculated values
  const fcm = await page.textContent('#fcm');
  const fctm = await page.textContent('#fctm');
  const eci = await page.textContent('#eci');
  
  expect(fcm).toBe('48.000'); // fck + deltaF = 40 + 8 = 48
  expect(parseFloat(fctm)).toBeCloseTo(3.509, 2); // Tensile strength
  
  // Parse scientific notation correctly
  const eciValue = parseFloat(eci); // This will handle 3.627e+4 correctly
  expect(eciValue).toBeGreaterThan(30000); // Elastic modulus

  // Verify chart containers are visible
  await expect(page.locator('#chartContainer')).toBeVisible();
  await expect(page.locator('#difContainer')).toBeVisible();

  // Verify charts have content (SVG elements)
  const stressStrainSvgs = await page.locator('#cebFipChart svg').count();
  const difSvgs = await page.locator('#difChart svg').count();
  
  expect(stressStrainSvgs).toBeGreaterThan(0);
  expect(difSvgs).toBeGreaterThan(0);

  // Verify table is displayed
  await expect(page.locator('#tableContainer')).toBeVisible();
  
  // Click to expand table
  await page.locator('#tableContainer h2').click();
  await page.waitForTimeout(500);
  
  // Verify table has data
  const tableRows = await page.locator('#parametersTable tbody tr').count();
  expect(tableRows).toBeGreaterThan(0);

  // Test input changes
  await page.fill('#fck', '50');
  await page.waitForTimeout(1000);
  
  // Verify results update
  const newFcm = await page.textContent('#fcm');
  expect(newFcm).toBe('58.000'); // 50 + 8 = 58

  // Test units panel
  await page.locator('.units-toggle').click();
  await page.waitForTimeout(500);
  
  await expect(page.locator('#unitsSettings')).toBeVisible();
  
  // Change pressure unit to GPa
  await page.selectOption('#pressureUnit', 'GPa');
  await page.waitForTimeout(1000);
  
  // Verify unit labels updated
  const fcmUnit = await page.textContent('#fcmUnit');
  expect(fcmUnit).toBe('GPa');

  // Test collapsible sections
  await page.locator('#chartContainer h2').click();
  await page.waitForTimeout(500);
  
  // Verify charts are still working after collapse/expand
  const svgsAfterToggle = await page.locator('#cebFipChart svg').count();
  expect(svgsAfterToggle).toBeGreaterThan(0);

  // Take final screenshot
  await page.screenshot({ 
    path: 'test-results/ceb-fip-final.png', 
    fullPage: true 
  });

  console.log('✅ CEB-FIP Calculator is working correctly!');
  console.log('✅ Calculations are performed');
  console.log('✅ Results are displayed');
  console.log('✅ Charts are rendered');
  console.log('✅ Units conversion works');
  console.log('✅ Interactive features work');
});