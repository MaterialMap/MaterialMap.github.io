/**
 * Main Material Application class
 */
import { CONFIG } from './utils/config.js';
import { waitForCondition } from './utils/helpers.js';
import { MaterialDictionaries } from './modules/MaterialDictionaries.js';
import { MaterialLoader } from './modules/MaterialLoader.js';
import { MaterialTable } from './components/MaterialTable.js';
import { MaterialFilters } from './components/MaterialFilters.js';
import { Navigation } from './components/Navigation.js';
import { ServiceWorkerManager } from './modules/ServiceWorkerManager.js';

export class MaterialApp {
  constructor() {
    this.materialDictionaries = new MaterialDictionaries();
    this.materialLoader = new MaterialLoader();
    this.materialTable = null;
    this.materialFilters = null;
    this.navigation = new Navigation();
    this.serviceWorkerManager = new ServiceWorkerManager();
    
    this.loadingElement = document.getElementById("loading");
    this.errorElement = document.getElementById("error-message");
  }

  /**
   * Wait for jQuery and DataTables to load
   */
  async waitForDependencies(timeout = CONFIG.TIMEOUTS.DEPENDENCIES) {
    return waitForCondition(
      () => typeof window.$ !== 'undefined' && typeof window.$.fn.DataTable !== 'undefined',
      timeout
    );
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    if (this.loadingElement) {
      this.loadingElement.classList.remove("hidden");
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.classList.add("hidden");
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (this.errorElement) {
      this.errorElement.textContent = `An error occurred: ${message}`;
    }
    console.error("Application error:", message);
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      this.showLoading();

      // Wait for dependencies to load
      await this.waitForDependencies();
      
      // Initialize navigation
      this.navigation.initialize();
      
      // Register service worker
      await this.serviceWorkerManager.register();
      
      // Load material dictionaries
      await this.materialDictionaries.load();
      
      // Load materials data
      const materials = await this.materialLoader.loadAllMaterials();
      
      // Initialize table
      this.materialTable = new MaterialTable("#materials-table", this.materialDictionaries);
      const table = await this.materialTable.initialize(materials);
      
      // Initialize filters
      this.materialFilters = new MaterialFilters(table, this.materialTable.getTableData());
      this.materialFilters.initialize();

      console.log("Material application initialized successfully");
    } catch (error) {
      this.showError(error.message);
      throw error;
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Get application state
   */
  getState() {
    return {
      materialsLoaded: this.materialLoader.isLoaded,
      dictionariesLoaded: this.materialDictionaries.isLoaded,
      serviceWorkerActive: this.serviceWorkerManager.isActive(),
      filterState: this.materialFilters ? this.materialFilters.getFilterState() : null
    };
  }

  /**
   * Reload materials data
   */
  async reloadMaterials() {
    try {
      this.showLoading();
      
      // Reset loader
      this.materialLoader = new MaterialLoader();
      
      // Load materials data
      const materials = await this.materialLoader.loadAllMaterials();
      
      // Reinitialize table
      if (this.materialTable && this.materialTable.getTable()) {
        this.materialTable.getTable().destroy();
      }
      
      this.materialTable = new MaterialTable("#materials-table", this.materialDictionaries);
      const table = await this.materialTable.initialize(materials);
      
      // Reinitialize filters
      this.materialFilters = new MaterialFilters(table, this.materialTable.getTableData());
      this.materialFilters.initialize();
      
      console.log("Materials reloaded successfully");
    } catch (error) {
      this.showError(error.message);
      throw error;
    } finally {
      this.hideLoading();
    }
  }
}