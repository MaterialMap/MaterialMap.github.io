/**
 * Main application entry point
 */
import { MaterialApp } from './MaterialApp.js';

// Global app instance
let materialApp = null;

/**
 * Initialize the application when the page loads
 */
async function initializeApp() {
  try {
    materialApp = new MaterialApp();
    await materialApp.initialize();
    
    // Make app available globally for debugging
    window.materialApp = materialApp;
    
  } catch (error) {
    console.error("Failed to initialize Material App:", error);
  }
}

// Initialize when page loads
window.addEventListener("load", initializeApp);

// Export for potential external use
export { materialApp, initializeApp };