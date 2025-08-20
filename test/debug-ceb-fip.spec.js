const { test, expect } = require('@playwright/test');

test('Debug CEB-FIP Calculator', async ({ page }) => {
  // Collect console messages
  const messages = [];
  page.on('console', msg => {
    messages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Collect page errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  // Navigate to the calculator
  await page.goto('http://127.0.0.1:5500/ceb_fip_calculator.html');
  
  // Wait for page to load completely
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Check if basic elements are present
  const title = await page.textContent('h1');
  console.log('Page title:', title);

  // Check if input fields have values
  const fckValue = await page.inputValue('#fck');
  const dmaxValue = await page.inputValue('#dmax');
  const rhoValue = await page.inputValue('#rho');
  
  console.log('Input values:', { fckValue, dmaxValue, rhoValue });
  console.log('Fixed constants: deltaF = 8.0 MPa, curveArraySize = 500 points');

  // Check if results div exists and its display style
  const resultsDiv = page.locator('#results');
  const resultsVisible = await resultsDiv.isVisible();
  const resultsStyle = await resultsDiv.getAttribute('style');
  
  console.log('Results visible:', resultsVisible);
  console.log('Results style:', resultsStyle);

  // Check if chart containers exist
  const chartContainer = page.locator('#chartContainer');
  const chartVisible = await chartContainer.isVisible();
  const chartStyle = await chartContainer.getAttribute('style');
  
  console.log('Chart visible:', chartVisible);
  console.log('Chart style:', chartStyle);

  // Check if Plotly is loaded
  const plotlyLoaded = await page.evaluate(() => {
    return typeof window.Plotly !== 'undefined';
  });
  console.log('Plotly loaded:', plotlyLoaded);

  // Check if UnitsHandler is loaded
  const unitsHandlerLoaded = await page.evaluate(() => {
    return typeof window.UnitsHandler !== 'undefined';
  });
  console.log('UnitsHandler loaded:', unitsHandlerLoaded);

  // Check if currentData exists
  const currentDataExists = await page.evaluate(() => {
    return typeof window.currentData !== 'undefined' && window.currentData !== null;
  });
  console.log('CurrentData exists:', currentDataExists);

  // Manually trigger calculation
  await page.evaluate(() => {
    if (typeof window.calculate === 'function') {
      window.calculate();
    }
  });

  await page.waitForTimeout(2000);

  // Check results after manual calculation
  const resultsVisibleAfter = await resultsDiv.isVisible();
  console.log('Results visible after manual calc:', resultsVisibleAfter);

  // Check if there are any chart elements
  const plotlyDivs = await page.locator('.plotly-graph-div').count();
  console.log('Plotly divs count:', plotlyDivs);

  // Print all console messages
  console.log('\n=== Console Messages ===');
  messages.forEach(msg => {
    console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
  });

  // Print all errors
  if (errors.length > 0) {
    console.log('\n=== Page Errors ===');
    errors.forEach(error => {
      console.log(`ERROR: ${error}`);
    });
  }

  // Take a screenshot
  await page.screenshot({ 
    path: 'test-results/ceb-fip-debug.png', 
    fullPage: true 
  });

  // Check specific result values
  const fcmText = await page.textContent('#fcm');
  const fctmText = await page.textContent('#fctm');
  const eciText = await page.textContent('#eci');
  
  console.log('Result values:', { fcmText, fctmText, eciText });
});