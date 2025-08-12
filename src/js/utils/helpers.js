/**
 * Utility helper functions
 */

/**
 * Escape HTML for safe display
 */
export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Copy text to clipboard with modern API
 */
export async function copyToClipboard(content) {
  try {
    await navigator.clipboard.writeText(content);
    return { success: true, message: "Copied to clipboard!" };
  } catch (err) {
    return { success: false, message: `Failed to copy: ${err.message}` };
  }
}

/**
 * Create a debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Wait for a condition to be met with timeout
 */
export function waitForCondition(condition, timeout = 5000, interval = 100) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error('Condition not met within timeout period'));
        return;
      }
      
      setTimeout(check, interval);
    };
    
    check();
  });
}

/**
 * Generate unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}