/**
 * Material dictionaries management
 */
import { BASE_PATH, CONFIG, joinPath } from '../utils/config.js';

export class MaterialDictionaries {
  constructor() {
    this.matDictionary = {};
    this.reverseDictionary = {};
    this.eosDictionary = {};
    this.reverseEosDictionary = {};
    this.matThermalDictionary = {};
    this.reverseMatThermalDictionary = {};
    this._loaded = false;
  }
  
  async load() {
    if (this._loaded) return;
    
    try {
      const [matResponse, eosResponse, matThermalResponse] = await Promise.all([
        fetch(joinPath(BASE_PATH, `${CONFIG.PATHS.LIB}/mat.json`)),
        fetch(joinPath(BASE_PATH, `${CONFIG.PATHS.LIB}/eos.json`)),
        fetch(joinPath(BASE_PATH, `${CONFIG.PATHS.LIB}/mat_thermal.json`))
      ]);

      // Load material dictionary
      if (matResponse.ok) {
        this.matDictionary = await matResponse.json();
        this.reverseDictionary = this._createReverseDictionary(this.matDictionary);
      }
      
      // Load EOS dictionary
      if (eosResponse.ok) {
        this.eosDictionary = await eosResponse.json();
        this.reverseEosDictionary = this._createReverseDictionary(this.eosDictionary);
      }
      
      // Load MAT_THERMAL dictionary
      if (matThermalResponse.ok) {
        this.matThermalDictionary = await matThermalResponse.json();
        this.reverseMatThermalDictionary = this._createReverseDictionary(this.matThermalDictionary);
      }
      
      this._loaded = true;
    } catch (error) {
      console.warn('Failed to load dictionaries:', error);
      this._initializeEmptyDictionaries();
    }
  }
  
  _createReverseDictionary(dictionary) {
    const reverse = {};
    Object.entries(dictionary).forEach(([key, value]) => {
      reverse[value] = key;
    });
    return reverse;
  }
  
  _initializeEmptyDictionaries() {
    this.matDictionary = {};
    this.reverseDictionary = {};
    this.eosDictionary = {};
    this.reverseEosDictionary = {};
    this.matThermalDictionary = {};
    this.reverseMatThermalDictionary = {};
  }
  
  getMaterialId(materialName) {
    return this.reverseDictionary[materialName] || '-';
  }
  
  getEosId(eosName) {
    return this.reverseEosDictionary[eosName] || '-';
  }
  
  getMatThermalId(matThermalName) {
    return this.reverseMatThermalDictionary[matThermalName] || '-';
  }
  
  // Getter for backward compatibility
  get isLoaded() {
    return this._loaded;
  }
}