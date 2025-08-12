/**
 * Material data loading and management
 */
import { BASE_PATH, CONFIG } from '../utils/config.js';
import { waitForCondition } from '../utils/helpers.js';

export class MaterialLoader {
  constructor() {
    this.materials = [];
    this.fileList = [];
    this._loaded = false;
  }

  /**
   * Wait for TOML parser to load
   */
  async waitForTomlParser(timeout = CONFIG.TIMEOUTS.TOML_PARSER) {
    return waitForCondition(
      () => typeof window.parseToml !== 'undefined',
      timeout
    );
  }

  /**
   * Load file list from server
   */
  async loadFileList() {
    const response = await fetch(`${BASE_PATH}${CONFIG.PATHS.DIST}/file-list.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch file list. Status: ${response.status} ${response.statusText}`);
    }

    const fileListData = await response.json();
    
    // Support both old format (array of strings) and new format (array of objects)
    if (Array.isArray(fileListData)) {
      if (fileListData.length > 0 && typeof fileListData[0] === 'string') {
        // Old format: array of filenames
        this.fileList = fileListData;
      } else {
        // New format: array of objects with filename - extract just filenames
        this.fileList = fileListData.map(item => item.filename);
      }
    } else {
      throw new Error("File list format is not valid.");
    }
    
    if (this.fileList.length === 0) {
      throw new Error("File list is empty or not valid.");
    }
  }

  /**
   * Load a single TOML file
   */
  async loadSingleFile(fileName) {
    try {
      const response = await fetch(`${BASE_PATH}${CONFIG.PATHS.DATA}/${fileName}`);
      if (!response.ok) {
        console.warn(`Failed to fetch file ${fileName}. Status: ${response.status}`);
        return [];
      }

      const tomlText = await response.text();

      // Parse TOML
      try {
        const parsedToml = window.parseToml(tomlText);
        const materialsInFile = parsedToml.material || [];
        
        if (Array.isArray(materialsInFile)) {
          return materialsInFile;
        } else {
          console.warn(`File ${fileName} does not contain a valid array of materials.`);
          return [];
        }
      } catch (tomlError) {
        console.warn(`TOML parsing error in file ${fileName}: ${tomlError.message}`);
        return [];
      }
    } catch (fileError) {
      console.error(`Error processing file ${fileName}:`, fileError);
      return [];
    }
  }

  /**
   * Load all materials with parallel processing
   */
  async loadAllMaterials() {
    if (this._loaded) return this.materials;

    try {
      // Wait for TOML parser to load
      await this.waitForTomlParser();
      
      // Load file list
      await this.loadFileList();

      // Load files in parallel using Promise.all
      const filePromises = this.fileList.map(fileName => this.loadSingleFile(fileName));
      
      // Wait for all file loading promises to resolve
      const materialsArrays = await Promise.all(filePromises);
      
      // Flatten the array of arrays into a single array of materials
      this.materials = materialsArrays.flat();

      if (this.materials.length === 0) {
        throw new Error("No materials were successfully loaded.");
      }

      this._loaded = true;
      console.log("Materials successfully loaded:", this.materials.length);
      return this.materials;
    } catch (error) {
      console.error("Error loading materials:", error);
      throw error;
    }
  }

  /**
   * Get loaded materials
   */
  getMaterials() {
    return this.materials;
  }

  /**
   * Check if materials are loaded
   */
  get isLoaded() {
    return this._loaded;
  }
}