/**
 * Service Worker management
 */
import { BASE_PATH, joinPath } from '../utils/config.js';

export class ServiceWorkerManager {
  constructor() {
    this.registration = null;
  }

  /**
   * Register service worker for offline capabilities
   */
  async register() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    try {
      const serviceWorkerPath = joinPath(BASE_PATH, 'service-worker.js');
      this.registration = await navigator.serviceWorker.register(serviceWorkerPath);
      console.log('Service Worker registered with scope:', this.registration.scope);
      
      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
      });
      
      return this.registration;
    } catch (error) {
      console.log('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Unregister service worker
   */
  async unregister() {
    if (this.registration) {
      try {
        await this.registration.unregister();
        console.log('Service Worker unregistered');
      } catch (error) {
        console.error('Service Worker unregistration failed:', error);
      }
    }
  }

  /**
   * Check if service worker is active
   */
  isActive() {
    return this.registration && this.registration.active;
  }

  /**
   * Get registration
   */
  getRegistration() {
    return this.registration;
  }
}