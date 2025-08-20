const { test, expect } = require('@playwright/test');

test.describe('Simple Layout Tests', () => {
  test('CEB-FIP calculator should display results in grid layout', async ({ page }) => {
    await page.goto('http://localhost:8000/ceb_fip_calculator.html');
    await page.waitForLoadState('networkidle');
    
    // Fill in basic values to trigger calculation
    await page.fill('#fck', '40');
    await page.fill('#dmax', '16');
    await page.fill('#rho', '2400');
    
    // Wait for results to appear
    await page.waitForSelector('.results', { state: 'visible', timeout: 5000 });
    
    // Check if results container uses CSS Grid
    const resultsContainer = page.locator('.results');
    const computedStyle = await resultsContainer.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        gridTemplateColumns: style.gridTemplateColumns
      };
    });
    
    console.log('CEB-FIP results container style:', computedStyle);
    
    // Verify CSS Grid is being used
    expect(computedStyle.display).toBe('grid');
    
    // Count result items
    const resultItems = page.locator('.result-item');
    const itemCount = await resultItems.count();
    console.log(`CEB-FIP has ${itemCount} result items`);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'test-results/ceb-fip-layout-final.png',
      fullPage: true 
    });
  });

  test('Gibson-Ashby calculator should display results in grid layout', async ({ page }) => {
    await page.goto('http://localhost:8000/gibson_ashby_calculator.html');
    await page.waitForLoadState('networkidle');
    
    // Fill in basic values to trigger calculation (using correct field names)
    await page.fill('#density', '25');
    await page.fill('#hardeningCoeff', '0');
    
    // Wait for results to appear
    await page.waitForSelector('.results', { state: 'visible', timeout: 5000 });
    
    // Check if results container uses CSS Grid
    const resultsContainer = page.locator('.results');
    const computedStyle = await resultsContainer.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        gridTemplateColumns: style.gridTemplateColumns
      };
    });
    
    console.log('Gibson-Ashby results container style:', computedStyle);
    
    // Verify CSS Grid is being used
    expect(computedStyle.display).toBe('grid');
    
    // Count result items
    const resultItems = page.locator('.result-item');
    const itemCount = await resultItems.count();
    console.log(`Gibson-Ashby has ${itemCount} result items`);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'test-results/gibson-ashby-layout-final.png',
      fullPage: true 
    });
  });

  test('Swift Law calculator should display results in grid layout (reference)', async ({ page }) => {
    await page.goto('http://localhost:8000/swift_law_calculator.html');
    await page.waitForLoadState('networkidle');
    
    // Fill in basic values to trigger calculation
    await page.fill('#yieldStrength', '250');
    await page.fill('#tensileStrength', '400');
    await page.fill('#elongation', '0.08');
    
    // Wait for results to appear
    await page.waitForSelector('.results', { state: 'visible', timeout: 5000 });
    
    // Check if results container uses CSS Grid
    const resultsContainer = page.locator('.results');
    const computedStyle = await resultsContainer.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        gridTemplateColumns: style.gridTemplateColumns
      };
    });
    
    console.log('Swift Law results container style:', computedStyle);
    
    // Verify CSS Grid is being used
    expect(computedStyle.display).toBe('grid');
    
    // Count result items
    const resultItems = page.locator('.result-item');
    const itemCount = await resultItems.count();
    console.log(`Swift Law has ${itemCount} result items`);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'test-results/swift-law-layout-reference.png',
      fullPage: true 
    });
  });
});