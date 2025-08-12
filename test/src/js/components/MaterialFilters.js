/**
 * Material filtering functionality
 */
import { debounce } from '../utils/helpers.js';

export class MaterialFilters {
  constructor(table, tableData) {
    this.table = table;
    this.tableData = tableData;
    this.materialFilter = document.getElementById('material-filter');
    this.eosFilter = document.getElementById('eos-filter');
    this.clearButton = document.getElementById('clear-filters');
    
    // Debounced filter function for better performance
    this.debouncedApplyFilters = debounce(() => this.applyFilters(), 300);
  }

  /**
   * Initialize filters
   */
  initialize() {
    this.populateFilters();
    this.setupEventHandlers();
  }

  /**
   * Populate filter dropdowns with unique values
   */
  populateFilters() {
    const materialSet = new Set();
    const eosSet = new Set();
    
    this.tableData.forEach(row => {
      const materialTypes = row[3]; // Array of material types (column 3)
      const eosName = row[4]; // Clean EOS name (column 4)
      
      // Add all material types to the set
      if (Array.isArray(materialTypes)) {
        materialTypes.forEach(materialName => {
          if (materialName && materialName !== '-') {
            materialSet.add(materialName);
          }
        });
      }
      
      if (eosName && eosName !== '-') {
        eosSet.add(eosName);
      }
    });
    
    // Populate material filter
    if (this.materialFilter) {
      this.populateSelectOptions(this.materialFilter, Array.from(materialSet).sort());
    }
    
    // Populate EOS filter
    if (this.eosFilter) {
      this.populateSelectOptions(this.eosFilter, Array.from(eosSet).sort());
    }
  }

  /**
   * Populate select element with options
   */
  populateSelectOptions(selectElement, options) {
    // Clear existing options except the first one (placeholder)
    while (selectElement.children.length > 1) {
      selectElement.removeChild(selectElement.lastChild);
    }
    
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      selectElement.appendChild(optionElement);
    });
  }

  /**
   * Setup filter event handlers
   */
  setupEventHandlers() {
    // Material filter change handler
    if (this.materialFilter) {
      this.materialFilter.addEventListener('change', () => {
        this.debouncedApplyFilters();
      });
    }
    
    // EOS filter change handler
    if (this.eosFilter) {
      this.eosFilter.addEventListener('change', () => {
        this.debouncedApplyFilters();
      });
    }
    
    // Clear filters button handler
    if (this.clearButton) {
      this.clearButton.addEventListener('click', () => {
        this.clearFilters();
      });
    }
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    if (this.materialFilter) {
      this.materialFilter.selectedIndex = -1;
    }
    if (this.eosFilter) {
      this.eosFilter.selectedIndex = -1;
    }
    this.applyFilters();
  }

  /**
   * Apply filters to the table
   */
  applyFilters() {
    const selectedMaterials = this.materialFilter ? 
      Array.from(this.materialFilter.selectedOptions).map(option => option.value) : [];
    const selectedEOS = this.eosFilter ? 
      Array.from(this.eosFilter.selectedOptions).map(option => option.value) : [];
    
    // Remove any existing custom search functions
    while ($.fn.dataTable.ext.search.length > 0) {
      $.fn.dataTable.ext.search.pop();
    }
    
    // Add custom search function
    $.fn.dataTable.ext.search.push((settings, data, dataIndex) => {
      // Get the raw data for this row
      const rowData = this.table.row(dataIndex).data();
      const materialTypes = rowData[3]; // Array of material types (column 3)
      const eosName = rowData[4]; // Clean EOS name (column 4)
      
      // Check material filter - if any of the material types match
      let materialMatch = selectedMaterials.length === 0;
      if (!materialMatch && Array.isArray(materialTypes)) {
        materialMatch = materialTypes.some(materialType => selectedMaterials.includes(materialType));
      }
      
      // Check EOS filter
      let eosMatch = selectedEOS.length === 0 || selectedEOS.includes(eosName);
      
      return materialMatch && eosMatch;
    });
    
    // Redraw the table
    this.table.draw();
  }

  /**
   * Get current filter state
   */
  getFilterState() {
    return {
      materials: this.materialFilter ? 
        Array.from(this.materialFilter.selectedOptions).map(option => option.value) : [],
      eos: this.eosFilter ? 
        Array.from(this.eosFilter.selectedOptions).map(option => option.value) : []
    };
  }

  /**
   * Set filter state
   */
  setFilterState(state) {
    if (this.materialFilter && state.materials) {
      Array.from(this.materialFilter.options).forEach(option => {
        option.selected = state.materials.includes(option.value);
      });
    }
    
    if (this.eosFilter && state.eos) {
      Array.from(this.eosFilter.options).forEach(option => {
        option.selected = state.eos.includes(option.value);
      });
    }
    
    this.applyFilters();
  }
}