const { test, expect } = require('@playwright/test');

test('Check CEB-FIP Charts Creation', async ({ page }) => {
  // Navigate to the calculator
  await page.goto('http://127.0.0.1:5500/ceb_fip_calculator.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Check if chart divs exist
  const cebFipChartDiv = page.locator('#cebFipChart');
  const difChartDiv = page.locator('#difChart');
  
  const cebFipExists = await cebFipChartDiv.count();
  const difExists = await difChartDiv.count();
  
  console.log('Chart divs exist:', { cebFipExists, difExists });

  // Check if Plotly.newPlot was called
  const plotlyCallsInfo = await page.evaluate(() => {
    // Override Plotly.newPlot to track calls
    let plotlyCalls = [];
    const originalNewPlot = window.Plotly.newPlot;
    
    window.Plotly.newPlot = function(div, data, layout, config) {
      plotlyCalls.push({
        div: typeof div === 'string' ? div : div.id,
        dataLength: data ? data.length : 0,
        hasLayout: !!layout,
        hasConfig: !!config
      });
      return originalNewPlot.call(this, div, data, layout, config);
    };
    
    // Trigger calculation
    if (typeof window.calculate === 'function') {
      window.calculate();
    }
    
    // Wait a bit for async operations
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          plotlyCalls: plotlyCalls,
          currentDataExists: typeof window.currentData !== 'undefined' && window.currentData !== null,
          currentDataKeys: window.currentData ? Object.keys(window.currentData) : []
        });
      }, 2000);
    });
  });

  console.log('Plotly calls info:', plotlyCallsInfo);

  // Check if chart elements were actually created
  await page.waitForTimeout(1000);
  
  const plotlyDivs = await page.locator('.plotly-graph-div').count();
  const svgElements = await page.locator('#cebFipChart svg').count();
  const difSvgElements = await page.locator('#difChart svg').count();
  
  console.log('Chart elements:', { plotlyDivs, svgElements, difSvgElements });

  // Check chart container styles
  const chartContainerStyle = await page.locator('#chartContainer').getAttribute('style');
  const difContainerStyle = await page.locator('#difContainer').getAttribute('style');
  
  console.log('Container styles:', { chartContainerStyle, difContainerStyle });

  // Check if collapsible headers work
  const chartHeader = page.locator('#chartContainer h2');
  const difHeader = page.locator('#difContainer h2');
  
  const chartHeaderExists = await chartHeader.count();
  const difHeaderExists = await difHeader.count();
  
  console.log('Headers exist:', { chartHeaderExists, difHeaderExists });

  // Try clicking headers to expand
  if (chartHeaderExists > 0) {
    await chartHeader.click();
    await page.waitForTimeout(500);
  }
  
  if (difHeaderExists > 0) {
    await difHeader.click();
    await page.waitForTimeout(500);
  }

  // Check again after clicking
  const plotlyDivsAfterClick = await page.locator('.plotly-graph-div').count();
  const svgAfterClick = await page.locator('#cebFipChart svg').count();
  const difSvgAfterClick = await page.locator('#difChart svg').count();
  
  console.log('After clicking headers:', { plotlyDivsAfterClick, svgAfterClick, difSvgAfterClick });

  // Check if chart content divs have content
  const cebFipContent = await page.locator('#cebFipChart').innerHTML();
  const difContent = await page.locator('#difChart').innerHTML();
  
  console.log('Chart content lengths:', { 
    cebFipContentLength: cebFipContent.length,
    difContentLength: difContent.length 
  });

  // Take screenshot
  await page.screenshot({ 
    path: 'test-results/charts-check.png', 
    fullPage: true 
  });

  // Manual check of Plotly functionality
  const manualPlotlyTest = await page.evaluate(() => {
    try {
      const testDiv = document.createElement('div');
      testDiv.id = 'test-plot';
      testDiv.style.width = '400px';
      testDiv.style.height = '300px';
      document.body.appendChild(testDiv);
      
      const testData = [{
        x: [1, 2, 3, 4],
        y: [10, 11, 12, 13],
        type: 'scatter'
      }];
      
      const testLayout = {
        title: 'Test Plot'
      };
      
      return window.Plotly.newPlot('test-plot', testData, testLayout)
        .then(() => {
          const hasPlotlyDiv = document.querySelector('#test-plot .plotly-graph-div') !== null;
          document.body.removeChild(testDiv);
          return { success: true, hasPlotlyDiv };
        })
        .catch(error => {
          document.body.removeChild(testDiv);
          return { success: false, error: error.message };
        });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  console.log('Manual Plotly test:', manualPlotlyTest);
});