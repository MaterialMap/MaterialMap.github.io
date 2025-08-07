const { chromium } = require('playwright');

async function debugSite() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.error('[PAGE ERROR]:', error.message);
  });
  
  // Listen for network requests
  page.on('request', request => {
    console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
  });
  
  // Listen for network responses
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400) {
      console.error(`[RESPONSE ERROR]: ${status} ${url}`);
    } else {
      console.log(`[RESPONSE]: ${status} ${url}`);
    }
  });
  
  try {
    console.log('Navigating to http://127.0.0.1:5500/index.html');
    await page.goto('http://127.0.0.1:5500/index.html');
    
    // Wait for the page to load
    await page.waitForTimeout(5000);
    
    // Check if loading message is still visible
    const loadingVisible = await page.isVisible('#loading');
    console.log('Loading message visible:', loadingVisible);
    
    // Check if error message is visible
    const errorVisible = await page.isVisible('#error-message');
    console.log('Error message visible:', errorVisible);
    
    if (errorVisible) {
      const errorText = await page.textContent('#error-message');
      console.log('Error message text:', errorText);
    }
    
    // Check if table has data
    const tableRows = await page.locator('#materials-table tbody tr').count();
    console.log('Number of table rows:', tableRows);
    
    // Wait for user to inspect
    console.log('Browser will stay open for inspection. Press Ctrl+C to close.');
    await page.waitForTimeout(60000);
    
  } catch (error) {
    console.error('Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

debugSite();