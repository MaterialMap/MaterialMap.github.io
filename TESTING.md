# Testing Guide

This document describes how to test Material MAP in different deployment environments to catch path-related issues before deployment.

## Problem

Different deployment environments use different base paths:
- **Local development**: `./` (relative paths)
- **GitHub Pages (username.github.io)**: `/` (root domain)
- **GitHub Pages (username.github.io/repo)**: `/repo/` (subdirectory)

This can cause issues with:
- Service Worker registration
- Asset loading (CSS, JS, JSON files)
- API endpoints
- File paths

## Testing Environments

### 1. Local Development
```bash
npm run serve
# Runs on http://localhost:5500
# BASE_PATH = "./"
```

### 2. GitHub Pages Simulation
```bash
npm run serve:github-pages
# Runs on http://localhost:3001
# BASE_PATH = "/" (simulates materialmap.github.io)
```

### 3. Subdirectory Simulation
```bash
npm run serve:subdirectory
# Runs on http://localhost:3002/MaterialMap
# BASE_PATH = "/MaterialMap" (simulates username.github.io/MaterialMap)
```

## Running Tests

### Test Individual Environments
```bash
# Test local development
npm run test:local

# Test GitHub Pages simulation
npm run test:github-pages

# Test subdirectory simulation
npm run test:subdirectory
```

### Test All Environments
```bash
# Run all tests sequentially
npm run test:all-envs

# Or use the shell script
./scripts/test-all-environments.sh
```

## What Gets Tested

The `test/base-path.spec.js` file tests:

1. **Path Calculation**: Ensures BASE_PATH is calculated correctly for each environment
2. **Path Joining**: Verifies that paths don't contain double slashes (`//`)
3. **Service Worker**: Checks that service worker registers without "same-origin" errors
4. **Asset Loading**: Confirms that CSS, JS, and JSON files load correctly
5. **Application Functionality**: Verifies the app loads data and displays it

## Common Issues and Solutions

### Double Slash Problem
**Issue**: `BASE_PATH + "/file.js"` creates `"//file.js"` when BASE_PATH is `"/"`
**Solution**: Use the `joinPath()` helper function

```javascript
// ❌ Wrong
const path = `${BASE_PATH}/service-worker.js`; // Can create "//service-worker.js"

// ✅ Correct
const path = joinPath(BASE_PATH, 'service-worker.js'); // Always creates "/service-worker.js"
```

### Service Worker Scope Issues
**Issue**: Service worker fails with "Scope URL is not same-origin"
**Cause**: Usually due to double slashes in the service worker path
**Solution**: Use proper path joining

### Asset Loading Failures
**Issue**: 404 errors for CSS, JS, or JSON files
**Cause**: Incorrect path concatenation
**Solution**: Use `joinPath()` for all asset paths

## Adding New Tests

When adding new features that involve file paths:

1. Add path tests to `test/base-path.spec.js`
2. Test in all three environments
3. Ensure no double slashes in generated paths
4. Verify assets load correctly

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Test all environments
  run: ./scripts/test-all-environments.sh
```

This ensures path issues are caught before deployment to GitHub Pages.

## Debugging Path Issues

Use the browser console to debug path calculation:

```javascript
// Check current BASE_PATH
console.log('BASE_PATH:', window.location.pathname);

// Test path joining
function joinPath(basePath, path) {
  const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  if (basePath === '/') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  
  return `${cleanBasePath}/${cleanPath}`;
}

console.log('Service Worker Path:', joinPath(BASE_PATH, 'service-worker.js'));
```