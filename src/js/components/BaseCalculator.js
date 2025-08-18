/**
 * BaseCalculator - Abstract base class for all material model calculators
 * Provides common functionality and standardized interface
 */
class BaseCalculator {
    /**
     * Create a new calculator instance
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            containerId: 'calculator-container',
            resultsId: 'results',
            chartId: 'chartSvg',
            tableId: 'tableBody',
            ...config
        };
        
        this.container = document.getElementById(this.config.containerId);
        this.resultsContainer = document.getElementById(this.config.resultsId);
        this.chartContainer = document.getElementById(this.config.chartId);
        this.tableContainer = document.getElementById(this.config.tableId);
        
        this.chartManager = new PlotlyChartManager();
        this.unitsHandler = new UnitsHandler();
        
        this.calculationTimeout = null;
        this.initialized = false;
    }

    /**
     * Initialize the calculator
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Initialize units handler
            await this.unitsHandler.initialize();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Perform initial calculation
            this.scheduleCalculation();
            
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize calculator:', error);
        }
    }

    /**
     * Set up event listeners for inputs and controls
     */
    setupEventListeners() {
        // To be implemented by subclasses
        throw new Error('setupEventListeners must be implemented by subclass');
    }

    /**
     * Schedule calculation with debounce
     */
    scheduleCalculation() {
        clearTimeout(this.calculationTimeout);
        this.calculationTimeout = setTimeout(() => this.calculate(), 100);
    }

    /**
     * Perform calculation based on input values
     */
    calculate() {
        // To be implemented by subclasses
        throw new Error('calculate must be implemented by subclass');
    }

    /**
     * Update the chart with new data
     */
    updateChart() {
        // To be implemented by subclasses
        throw new Error('updateChart must be implemented by subclass');
    }

    /**
     * Generate data table with calculation results
     */
    generateDataTable() {
        // To be implemented by subclasses
        throw new Error('generateDataTable must be implemented by subclass');
    }

    /**
     * Update displayed units
     */
    updateUnits() {
        // To be implemented by subclasses
        throw new Error('updateUnits must be implemented by subclass');
    }
    
    /**
     * Convert a value between units
     * @param {number} value - Value to convert
     * @param {string} fromUnit - Source unit
     * @param {string} toUnit - Target unit
     * @returns {number} Converted value
     */
    convertValue(value, fromUnit, toUnit) {
        if (!this.unitsHandler.initialized || fromUnit === toUnit) {
            return value;
        }
        
        const quantity = this.unitsHandler.createQuantity(value, fromUnit);
        if (!quantity) return value;
        
        const converted = this.unitsHandler.convert(quantity, toUnit);
        if (!converted) return value;
        
        return this.unitsHandler.getValue(converted);
    }
    
    /**
     * Convert an input field value when units change
     * @param {string} elementId - ID of the input element
     * @param {string} fromUnit - Source unit
     * @param {string} toUnit - Target unit
     */
    convertInputField(elementId, fromUnit, toUnit) {
        if (fromUnit === toUnit) return;
        
        const input = document.getElementById(elementId);
        if (!input) return;
        
        const value = parseFloat(input.value);
        if (isNaN(value)) return;
        
        const convertedValue = this.convertValue(value, fromUnit, toUnit);
        
        // Format the value appropriately
        input.value = this.formatValue(convertedValue);
    }
    
    /**
     * Format a value with appropriate precision based on its magnitude
     * @param {number} value - The value to format
     * @returns {string} Formatted value
     */
    formatValue(value) {
        if (Math.abs(value) < 0.001 || Math.abs(value) >= 10000) {
            return value.toExponential(4);
        } else {
            // Determine appropriate precision based on magnitude
            const precision = Math.abs(value) < 0.1 ? 5 : 
                             Math.abs(value) < 1 ? 4 : 
                             Math.abs(value) < 10 ? 3 : 
                             Math.abs(value) < 100 ? 2 : 1;
            return value.toFixed(precision);
        }
    }

    /**
     * Toggle visibility of a collapsible section
     * @param {HTMLElement} header - Header element that was clicked
     */
    toggleCollapse(header) {
        const content = header.nextElementSibling;
        const isCollapsed = header.classList.contains('collapsed');
        
        if (isCollapsed) {
            header.classList.remove('collapsed');
            content.classList.remove('collapsed');
            content.style.maxHeight = content.scrollHeight + 'px';
        } else {
            header.classList.add('collapsed');
            content.classList.add('collapsed');
            content.style.maxHeight = '0';
        }
    }

    /**
     * Toggle visibility of units panel
     */
    toggleUnitsPanel() {
        const panel = document.getElementById('unitsSettings');
        panel.style.display = panel.style.display === 'none' ? 'grid' : 'none';
    }

    /**
     * Export data table to CSV
     * @param {string} filename - Output filename
     */
    exportToCSV(filename = 'calculator_data.csv') {
        const table = document.getElementById(this.config.tableId).closest('table');
        let csv = [];
        
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent);
        csv.push(headers.join(','));
        
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        rows.forEach(row => {
            const cells = Array.from(row.cells).map(cell => cell.textContent);
            csv.push(cells.join(','));
        });
        
        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Validate numeric input within range
     * @param {HTMLInputElement} input - Input element
     * @param {number} min - Minimum allowed value
     * @param {number} max - Maximum allowed value
     * @param {number} defaultValue - Default value if invalid
     * @returns {number} Validated value
     */
    validateNumericInput(input, min, max, defaultValue) {
        let value = parseFloat(input.value);
        
        // Remove any existing error classes
        input.classList.remove('input-error', 'input-warning');
        
        if (isNaN(value) || value < min) {
            input.classList.add('input-error');
            setTimeout(() => {
                input.value = min;
                input.classList.remove('input-error');
                this.scheduleCalculation();
            }, 1000);
            return min;
        } else if (value > max) {
            input.classList.add('input-error');
            setTimeout(() => {
                input.value = max;
                input.classList.remove('input-error');
                this.scheduleCalculation();
            }, 1000);
            return max;
        }
        
        return value;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseCalculator;
} else {
    window.BaseCalculator = BaseCalculator;
}