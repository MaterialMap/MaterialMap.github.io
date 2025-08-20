const { test, expect } = require('@playwright/test');

test.describe('Layout Fix Tests', () => {
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
    expect(computedStyle.gridTemplateColumns).toContain('minmax');
    
    // Count result items and check their layout
    const resultItems = page.locator('.result-item');
    const itemCount = await resultItems.count();
    console.log(`CEB-FIP has ${itemCount} result items`);
    
    // Check if items are actually displayed in multiple columns
    if (itemCount >= 3) {
      // Get positions of first few items to verify they're in a grid
      const positions = [];
      for (let i = 0; i < Math.min(6, itemCount); i++) {
        const box = await resultItems.nth(i).boundingBox();
        positions.push({ index: i, x: box.x, y: box.y });
      }
      
      console.log('CEB-FIP item positions:', positions);
      
      // Check if we have items in the same row (similar Y coordinates)
      const firstRowY = positions[0].y;
      const itemsInFirstRow = positions.filter(pos => Math.abs(pos.y - firstRowY) < 10);
      
      console.log(`CEB-FIP items in first row: ${itemsInFirstRow.length}`);
      
      // We expect at least 2 items in the first row for a proper grid layout
      expect(itemsInFirstRow.length).toBeGreaterThanOrEqual(2);
    }
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'test-results/ceb-fip-layout-fixed.png',
      fullPage: true 
    });
  });

  test('Gibson-Ashby calculator should display results in grid layout', async ({ page }) => {
    await page.goto('http://localhost:8000/gibson_ashby_calculator.html');
    await page.waitForLoadState('networkidle');
    
    // Fill in basic values to trigger calculation
    await page.fill('#relativeDensity', '0.1');
    await page.fill('#solidYieldStrength', '250');
    await page.fill('#solidElasticModulus', '70000');
    
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
    expect(computedStyle.gridTemplateColumns).toContain('minmax');
    
    // Count result items and check their layout
    const resultItems = page.locator('.result-item');
    const itemCount = await resultItems.count();
    console.log(`Gibson-Ashby has ${itemCount} result items`);
    
    // Check if items are actually displayed in multiple columns
    if (itemCount >= 3) {
      // Get positions of first few items to verify they're in a grid
      const positions = [];
      for (let i = 0; i < Math.min(4, itemCount); i++) {
        const box = await resultItems.nth(i).boundingBox();
        positions.push({ index: i, x: box.x, y: box.y });
      }
      
      console.log('Gibson-Ashby item positions:', positions);
      
      // Check if we have items in the same row (similar Y coordinates)
      const firstRowY = positions[0].y;
      const itemsInFirstRow = positions.filter(pos => Math.abs(pos.y - firstRowY) < 10);
      
      console.log(`Gibson-Ashby items in first row: ${itemsInFirstRow.length}`);
      
      // We expect at least 2 items in the first row for a proper grid layout
      expect(itemsInFirstRow.length).toBeGreaterThanOrEqual(2);
    }
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'test-results/gibson-ashby-layout-fixed.png',
      fullPage: true 
    });
  });

  test('CEB-FIP fracture energy selector should work correctly', async ({ page }) => {
    await page.goto('http://localhost:8000/ceb_fip_calculator.html');
    await page.waitForLoadState('networkidle');
    
    // Check initial state - dmax should be visible, gfDirect should be hidden
    await expect(page.locator('#dmaxInputGroup')).toBeVisible();
    await expect(page.locator('#gfDirectInputGroup')).toBeHidden();
    
    // Switch to direct input
    await page.selectOption('#fractureEnergyMethod', 'direct');
    
    // Check that fields switched
    await expect(page.locator('#dmaxInputGroup')).toBeHidden();
    await expect(page.locator('#gfDirectInputGroup')).toBeVisible();
    
    // Switch back to calculated
    await page.selectOption('#fractureEnergyMethod', 'calculated');
    
    // Check that fields switched back
    await expect(page.locator('#dmaxInputGroup')).toBeVisible();
    await expect(page.locator('#gfDirectInputGroup')).toBeHidden();
    
    console.log('CEB-FIP fracture energy selector works correctly');
  });
});