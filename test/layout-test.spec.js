const { test, expect } = require('@playwright/test');

test.describe('Calculator Layout Tests', () => {
  const calculators = [
    { name: 'Swift Law', url: 'swift_law_calculator.html' },
    { name: 'Mooney-Rivlin', url: 'mooney_rivlin_calculator.html' },
    { name: 'Johnson-Cook', url: 'johnson_cook_calculator.html' },
    { name: 'Gibson-Ashby', url: 'gibson_ashby_calculator.html' },
    { name: 'CEB-FIP', url: 'ceb_fip_calculator.html' }
  ];

  for (const calculator of calculators) {
    test(`${calculator.name} calculator should display results in grid layout`, async ({ page }) => {
      await page.goto(`http://localhost:8000/${calculator.url}`);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Trigger calculation by filling in some basic values and clicking calculate or triggering input
      if (calculator.name === 'Swift Law') {
        await page.fill('#yieldStrength', '250');
        await page.fill('#tensileStrength', '400');
        await page.fill('#elongation', '0.08');
      } else if (calculator.name === 'Mooney-Rivlin') {
        await page.fill('#c10', '0.5');
        await page.fill('#c01', '0.1');
      } else if (calculator.name === 'Johnson-Cook') {
        await page.fill('#A', '250');
        await page.fill('#B', '400');
        await page.fill('#n', '0.3');
      } else if (calculator.name === 'Gibson-Ashby') {
        await page.fill('#relativeDensity', '0.1');
        await page.fill('#solidYieldStrength', '250');
        await page.fill('#solidElasticModulus', '70000');
      } else if (calculator.name === 'CEB-FIP') {
        await page.fill('#fck', '40');
        await page.fill('#dmax', '16');
        await page.fill('#rho', '2400');
      }
      
      // Wait for results to appear
      await page.waitForSelector('.results', { state: 'visible', timeout: 5000 });
      
      // Check if results container uses CSS Grid
      const resultsContainer = page.locator('.results');
      const computedStyle = await resultsContainer.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns,
          gap: style.gap
        };
      });
      
      console.log(`${calculator.name} results container style:`, computedStyle);
      
      // Verify CSS Grid is being used
      expect(computedStyle.display).toBe('grid');
      expect(computedStyle.gridTemplateColumns).toContain('minmax');
      
      // Count result items and check their layout
      const resultItems = page.locator('.result-item');
      const itemCount = await resultItems.count();
      console.log(`${calculator.name} has ${itemCount} result items`);
      
      // Check if items are actually displayed in multiple columns
      if (itemCount >= 3) {
        // Get positions of first few items to verify they're in a grid
        const positions = [];
        for (let i = 0; i < Math.min(6, itemCount); i++) {
          const box = await resultItems.nth(i).boundingBox();
          positions.push({ index: i, x: box.x, y: box.y, width: box.width });
        }
        
        console.log(`${calculator.name} item positions:`, positions);
        
        // Check if we have items in the same row (similar Y coordinates)
        const firstRowY = positions[0].y;
        const itemsInFirstRow = positions.filter(pos => Math.abs(pos.y - firstRowY) < 10);
        
        console.log(`${calculator.name} items in first row: ${itemsInFirstRow.length}`);
        
        // We expect at least 2 items in the first row for a proper grid layout
        // (3 on wide screens, but could be 2 on narrower screens)
        expect(itemsInFirstRow.length).toBeGreaterThanOrEqual(2);
      }
      
      // Take a screenshot for visual verification
      await page.screenshot({ 
        path: `test-results/${calculator.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-layout.png`,
        fullPage: true 
      });
    });
  }

  test('CEB-FIP calculator fracture energy selector should work', async ({ page }) => {
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
    
    // Test calculation with both methods
    await page.fill('#fck', '40');
    await page.fill('#rho', '2400');
    await page.fill('#dmax', '16');
    
    // Wait for calculation and results
    await page.waitForSelector('.results', { state: 'visible', timeout: 5000 });
    
    // Get fracture energy value with calculated method
    const calculatedGf = await page.locator('#gf').textContent();
    console.log('Calculated Gf:', calculatedGf);
    
    // Switch to direct input and enter the same value
    await page.selectOption('#fractureEnergyMethod', 'direct');
    await page.fill('#gfDirect', calculatedGf);
    
    // Wait for recalculation
    await page.waitForTimeout(500);
    
    // Verify the value is the same
    const directGf = await page.locator('#gf').textContent();
    console.log('Direct Gf:', directGf);
    
    expect(directGf).toBe(calculatedGf);
  });
});