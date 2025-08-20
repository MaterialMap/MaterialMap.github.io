const { test } = require('@playwright/test');

test('Take final screenshot of CEB-FIP Calculator', async ({ page }) => {
  // Navigate to the calculator
  await page.goto('http://127.0.0.1:5500/ceb_fip_calculator.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Expand all sections
  await page.locator('#chartContainer h2').click();
  await page.waitForTimeout(500);
  
  await page.locator('#difContainer h2').click();
  await page.waitForTimeout(500);
  
  await page.locator('#tableContainer h2').click();
  await page.waitForTimeout(500);

  // Take full page screenshot
  await page.screenshot({ 
    path: 'test-results/ceb-fip-final-complete.png', 
    fullPage: true 
  });

  console.log('📸 Final screenshot saved: test-results/ceb-fip-final-complete.png');
});