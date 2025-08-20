const { test, expect } = require('@playwright/test');

test.describe('CEB-FIP Calculator', () => {
  test('should load and display curves', async ({ page }) => {
    // Navigate to the calculator
    await page.goto('http://localhost:5500/ceb_fip_calculator.html');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page title is correct
    await expect(page).toHaveTitle(/CEB-FIP Model Calculator/);
    
    // Check if main elements are present
    await expect(page.locator('h1')).toContainText('CEB-FIP Model Calculator');
    
    // Check if input fields are present
    await expect(page.locator('#fck')).toBeVisible();
    await expect(page.locator('#dmax')).toBeVisible();
    await expect(page.locator('#rho')).toBeVisible();
    await expect(page.locator('#deltaF')).toBeVisible();
    
    // Wait for calculation to complete
    await page.waitForTimeout(2000);
    
    // Check if results are displayed
    await expect(page.locator('#results')).toBeVisible();
    
    // Check if chart containers are visible
    await expect(page.locator('#chartContainer')).toBeVisible();
    await expect(page.locator('#difContainer')).toBeVisible();
    
    // Check console for errors
    const logs = [];
    page.on('console', msg => {
      logs.push({ type: msg.type(), text: msg.text() });
    });
    
    // Trigger calculation by changing input
    await page.fill('#fck', '50');
    await page.waitForTimeout(1000);
    
    // Check if Plotly charts are created
    const chartExists = await page.evaluate(() => {
      const chartDiv = document.getElementById('cebFipChart');
      return chartDiv && chartDiv.children.length > 0;
    });
    
    console.log('Chart exists:', chartExists);
    
    // Check console logs
    console.log('Console logs:', logs);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/ceb-fip-calculator.png', fullPage: true });
    
    // Check if there are any JavaScript errors
    const errors = logs.filter(log => log.type === 'error');
    if (errors.length > 0) {
      console.log('JavaScript errors found:', errors);
    }
    
    // Verify that charts are actually rendered
    const plotlyDivs = await page.locator('.plotly-graph-div').count();
    console.log('Number of Plotly divs found:', plotlyDivs);
    
    expect(plotlyDivs).toBeGreaterThan(0);
  });
  
  test('should calculate properties correctly', async ({ page }) => {
    await page.goto('http://localhost:5500/ceb_fip_calculator.html');
    await page.waitForLoadState('networkidle');
    
    // Set specific input values
    await page.fill('#fck', '40');
    await page.fill('#dmax', '16');
    await page.fill('#rho', '2400');
    
    // Wait for calculation
    await page.waitForTimeout(1000);
    
    // Check if results are calculated
    const fcm = await page.textContent('#fcm');
    const fctm = await page.textContent('#fctm');
    const eci = await page.textContent('#eci');
    
    console.log('Calculated values:', { fcm, fctm, eci });
    
    // Verify that values are not empty or default
    expect(fcm).not.toBe('-');
    expect(fctm).not.toBe('-');
    expect(eci).not.toBe('-');
    
    // Check if values are reasonable for concrete
    const fcmValue = parseFloat(fcm);
    const fctmValue = parseFloat(fctm);
    const eciValue = parseFloat(eci);
    
    expect(fcmValue).toBeGreaterThan(40); // Should be fck + deltaF
    expect(fctmValue).toBeGreaterThan(2); // Reasonable tensile strength
    expect(eciValue).toBeGreaterThan(20000); // Reasonable elastic modulus
  });
});