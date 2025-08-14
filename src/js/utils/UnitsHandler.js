/**
 * Units Handler for Material Calculators
 * Provides unified interface for unit conversion using js-quantities
 */
class UnitsHandler {
    constructor() {
        this.Qty = null;
        this.initialized = false;
        this.availableUnits = this.initializeAvailableUnits();
    }

    /**
     * Initialize js-quantities library
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        if (this.initialized) {
            return true;
        }

        try {
            // Load js-quantities from CDN if not already loaded
            if (typeof window.Qty === 'undefined') {
                await this.loadQuantitiesLibrary();
            }
            this.Qty = window.Qty;
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize js-quantities:', error);
            return false;
        }
    }

    /**
     * Load js-quantities from CDN
     * @returns {Promise<void>}
     */
    loadQuantitiesLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/js-quantities@1.8.0/quantities.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load js-quantities'));
            document.head.appendChild(script);
        });
    }

    /**
     * Initialize available units for different physical quantities
     * @returns {Object} Available units configuration
     */
    initializeAvailableUnits() {
        return {
            pressure: {
                primary: 'MPa',
                units: ['Pa', 'kPa', 'MPa', 'GPa', 'psi', 'bar', 'atm'],
                displayNames: {
                    'Pa': 'Pascal (Pa)',
                    'kPa': 'Kilopascal (kPa)',
                    'MPa': 'Megapascal (MPa)',
                    'GPa': 'Gigapascal (GPa)',
                    'psi': 'Pounds per square inch (psi)',
                    'bar': 'Bar (bar)',
                    'atm': 'Atmosphere (atm)'
                }
            },
            strain: {
                primary: '',
                units: ['', '%'],
                displayNames: {
                    '': 'Dimensionless (-)',
                    '%': 'Percent (%)'
                }
            },
            strainRate: {
                primary: '1/s',
                units: ['1/s', '1/min'],
                displayNames: {
                    '1/s': 'Per second (s⁻¹)',
                    '1/min': 'Per minute (min⁻¹)'
                }
            },
            modulus: {
                primary: 'MPa',
                units: ['Pa', 'kPa', 'MPa', 'GPa', 'psi'],
                displayNames: {
                    'Pa': 'Pascal (Pa)',
                    'kPa': 'Kilopascal (kPa)',
                    'MPa': 'Megapascal (MPa)',
                    'GPa': 'Gigapascal (GPa)',
                    'psi': 'Pounds per square inch (psi)'
                }
            },
            temperature: {
                primary: 'K',
                units: ['K', 'C', 'F'],
                displayNames: {
                    'K': 'Kelvin (K)',
                    'C': 'Celsius (°C)',
                    'F': 'Fahrenheit (°F)'
                }
            }
        };
    }

    /**
     * Create quantity with units
     * @param {number|string} value - Numerical value or string with units
     * @param {string} unit - Unit string
     * @returns {Object|null} Quantity object or null if invalid
     */
    createQuantity(value, unit) {
        if (!this.initialized) {
            console.error('UnitsHandler not initialized');
            return null;
        }

        try {
            if (typeof value === 'string') {
                return this.Qty(value);
            } else if (unit) {
                // Handle special cases for dimensionless quantities
                if (unit === '' || unit === '-') {
                    return { value: parseFloat(value), unit: '', toString: () => value.toString() };
                }
                // Handle strain rate special notation
                if (unit === '1/s') {
                    return this.Qty(parseFloat(value), 'Hz');
                }
                return this.Qty(parseFloat(value), unit);
            }
            return null;
        } catch (error) {
            console.error('Error creating quantity:', error);
            return null;
        }
    }

    /**
     * Convert quantity to different units
     * @param {Object} quantity - Quantity object
     * @param {string} targetUnit - Target unit string
     * @returns {Object|null} Converted quantity or null if failed
     */
    convert(quantity, targetUnit) {
        if (!this.initialized || !quantity) {
            return null;
        }

        try {
            // Handle dimensionless quantities
            if (quantity.unit === '' || targetUnit === '' || targetUnit === '-') {
                if (targetUnit === '%') {
                    return { value: quantity.value * 100, unit: '%' };
                } else if (quantity.unit === '%' && targetUnit === '') {
                    return { value: quantity.value / 100, unit: '' };
                }
                return quantity;
            }

            // Handle strain rate conversion
            if (targetUnit === '1/s' && quantity.units && quantity.units() === 'Hz') {
                return quantity;
            }
            if (targetUnit === '1/min' && quantity.units && quantity.units() === 'Hz') {
                return this.Qty(quantity.scalar * 60, 'Hz');
            }

            return quantity.to(targetUnit);
        } catch (error) {
            console.error('Error converting units:', error);
            return null;
        }
    }

    /**
     * Get scalar value from quantity
     * @param {Object} quantity - Quantity object
     * @returns {number} Scalar value
     */
    getValue(quantity) {
        if (!quantity) return 0;
        if (typeof quantity.scalar !== 'undefined') {
            return quantity.scalar;
        }
        if (typeof quantity.value !== 'undefined') {
            return quantity.value;
        }
        return parseFloat(quantity);
    }

    /**
     * Format quantity for display
     * @param {Object} quantity - Quantity object
     * @param {number} precision - Number of decimal places
     * @returns {string} Formatted string
     */
    format(quantity, precision = 3) {
        if (!quantity) return '0';
        
        const value = this.getValue(quantity);
        const unit = quantity.unit || (quantity.units && quantity.units()) || '';
        
        let formattedValue;
        if (Math.abs(value) < 0.001 || Math.abs(value) >= 1000) {
            formattedValue = value.toExponential(precision);
        } else {
            formattedValue = value.toFixed(precision);
        }
        
        return unit ? `${formattedValue} ${unit}` : formattedValue;
    }

    /**
     * Get available units for a physical quantity type
     * @param {string} quantityType - Type of physical quantity
     * @returns {Array} Array of available units
     */
    getAvailableUnits(quantityType) {
        return this.availableUnits[quantityType]?.units || [];
    }

    /**
     * Get display name for a unit
     * @param {string} quantityType - Type of physical quantity
     * @param {string} unit - Unit string
     * @returns {string} Display name
     */
    getDisplayName(quantityType, unit) {
        return this.availableUnits[quantityType]?.displayNames[unit] || unit;
    }

    /**
     * Get primary unit for a quantity type
     * @param {string} quantityType - Type of physical quantity
     * @returns {string} Primary unit
     */
    getPrimaryUnit(quantityType) {
        return this.availableUnits[quantityType]?.primary || '';
    }

    /**
     * Create unit selector element
     * @param {string} quantityType - Type of physical quantity
     * @param {string} selectedUnit - Currently selected unit
     * @param {string} id - Element ID
     * @returns {HTMLElement} Select element
     */
    createUnitSelector(quantityType, selectedUnit, id) {
        const select = document.createElement('select');
        select.id = id;
        select.className = 'unit-selector';
        
        const units = this.getAvailableUnits(quantityType);
        units.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit;
            option.textContent = this.getDisplayName(quantityType, unit);
            option.selected = unit === selectedUnit;
            select.appendChild(option);
        });
        
        return select;
    }

    /**
     * Validate unit for quantity type
     * @param {string} quantityType - Type of physical quantity
     * @param {string} unit - Unit to validate
     * @returns {boolean} Is valid unit
     */
    isValidUnit(quantityType, unit) {
        return this.getAvailableUnits(quantityType).includes(unit);
    }
}

// Export for use in other modules
window.UnitsHandler = UnitsHandler;