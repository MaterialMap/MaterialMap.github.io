/**
 * Modular Material MAP Application
 * This is the new optimized version using ES6 modules
 */

// Import all modules
import { MaterialApp } from './src/js/MaterialApp.js';

// Global app instance for backward compatibility
let materialApp = null;

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    materialApp = new MaterialApp();
    await materialApp.initialize();
    
    // Make app available globally for debugging and backward compatibility
    window.materialApp = materialApp;
    
    console.log("Material MAP application initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Material App:", error);
  }
}

// Initialize when page loads
window.addEventListener("load", initializeApp);

// Export for external use
export { materialApp, initializeApp };