/**
 * Navigation-only entry point for calculator pages
 */
import { Navigation } from './components/Navigation.js';

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const navigation = new Navigation();
  navigation.initialize();
});