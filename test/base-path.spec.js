import { test, expect } from '@playwright/test';

test.describe('BASE_PATH Configuration', () => {
  test('should correctly calculate BASE_PATH for different environments', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Get the calculated BASE_PATH and test path joining
    const pathInfo = await page.evaluate(() => {
      const { origin, pathname, port } = window.location;
      
      // Replicate the updated getBasePath function
      function getBasePath() {
        if (origin.startsWith("file://")) {
          const pathParts = pathname.split("/");
          pathParts.pop();
          return pathParts.join("/");
        }
        if (origin.includes("localhost") || origin.includes("127.0.0.1") || (port && parseInt(port) > 1024)) {
          // For GitHub Pages simulation (port 3001), use root path
          if (port === "3001") {
            return "/";
          }
          // For subdirectory simulation (port 3002), extract repo name from path
          if (port === "3002") {
            const repoName = pathname.split("/")[1];
            return repoName ? `/${repoName}` : "/";
          }
          // For local development (port 5500 or others), use relative path
          return "./";
        }
        const repoName = pathname.split("/")[1];
        return repoName ? `/${repoName}` : "/";
      }
      
      // Test the joinPath function
      function joinPath(basePath, path) {
        const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        
        if (basePath === '/') {
          return path.startsWith('/') ? path : `/${path}`;
        }
        
        return `${cleanBasePath}/${cleanPath}`;
      }
      
      const basePath = getBasePath();
      
      return {
        origin,
        pathname,
        port,
        basePath,
        serviceWorkerPath: joinPath(basePath, 'service-worker.js'),
        libPath: joinPath(basePath, '/lib/mat.json'),
        dataPath: joinPath(basePath, '/data/test.toml'),
        // Test the old problematic concatenation (should have double slash)
        oldProblematicPath: `${basePath}/service-worker.js`,
        oldHasDoubleSlash: `${basePath}/service-worker.js`.includes('//'),
        // Test that joinPath fixes the issue
        joinPathWorks: !joinPath(basePath, 'service-worker.js').includes('//')
      };
    });
    
    console.log('Path info:', pathInfo);
    
    // Assertions
    expect(pathInfo.joinPathWorks).toBe(true);
    expect(pathInfo.serviceWorkerPath).not.toContain('//');
    expect(pathInfo.libPath).not.toContain('//');
    expect(pathInfo.dataPath).not.toContain('//');
    
    // Test that paths are accessible
    const serviceWorkerResponse = await page.request.get(pathInfo.serviceWorkerPath);
    expect(serviceWorkerResponse.status()).toBe(200);
    
    const libResponse = await page.request.get(pathInfo.libPath);
    expect(libResponse.status()).toBe(200);
  });
  
  test('should register service worker without errors', async ({ page }) => {
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for service worker registration
    await page.waitForTimeout(2000);
    
    // Check that there are no service worker related errors
    const serviceWorkerErrors = errors.filter(error => 
      error.includes('ServiceWorker') || 
      error.includes('same-origin') ||
      error.includes('Scope URL')
    );
    
    expect(serviceWorkerErrors).toHaveLength(0);
  });
  
  test('should load material data without path issues', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check that the table has data (meaning paths worked correctly)
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
    
    // Check that there are no error alerts
    const errorAlert = page.locator('[role="alert"]');
    if (await errorAlert.count() > 0) {
      const errorText = await errorAlert.textContent();
      expect(errorText).not.toContain('same-origin');
      expect(errorText).not.toContain('ServiceWorker');
    }
  });
});