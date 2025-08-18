/**
 * Units Handler for Material Calculators
 * Provides unified interface for unit conversion using js-quantities
 */
class UnitsHandler {
    constructor() {
        this.Qty = null;
        this.initialized = false;
        this.debug = false; // Set to true to enable debug logging
        this.availableUnits = this.initializeAvailableUnits();
    }
    
    /**
     * Log debug information if debug mode is enabled
     * @param {string} message - Debug message
     * @param {any} data - Optional data to log
     */
    logDebug(message, data) {
        if (this.debug) {
            if (data !== undefined) {
                console.log(`[UnitsHandler] ${message}`, data);
            } else {
                console.log(`[UnitsHandler] ${message}`);
            }
        }
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
            this.logDebug(`Creating quantity: value=${value}, unit=${unit}`);
            
            // Handle null or undefined values
            if (value === null || value === undefined) {
                console.error('Cannot create quantity with null or undefined value');
                return null;
            }
            
            // Parse value to number if it's a string representing a number
            let numericValue = value;
            if (typeof value === 'string') {
                if (value.includes(' ')) {
                    // String contains both value and unit (e.g. "350 MPa")
                    return this.Qty(value);
                } else {
                    // String contains only value, parse it
                    numericValue = parseFloat(value);
                    if (isNaN(numericValue)) {
                        console.error(`Cannot parse "${value}" as a number`);
                        return null;
                    }
                }
            } else if (typeof value !== 'number') {
                console.error(`Value must be a number or string, got ${typeof value}`);
                return null;
            }
            
            // Handle dimensionless quantities
            if (!unit || unit === '' || unit === '-') {
                this.logDebug(`Creating dimensionless quantity: ${numericValue}`);
                return { 
                    value: numericValue, 
                    scalar: numericValue,
                    unit: '',
                    units: () => '',
                    toString: () => numericValue.toString()
                };
            }
            
            // Handle percentage
            if (unit === '%') {
                this.logDebug(`Creating percentage quantity: ${numericValue}%`);
                return { 
                    value: numericValue, 
                    scalar: numericValue,
                    unit: '%',
                    units: () => '%',
                    toString: () => `${numericValue}%`
                };
            }
            
            // Handle strain rate special notation
            if (unit === '1/s') {
                this.logDebug(`Creating strain rate quantity: ${numericValue} s⁻¹`);
                return { 
                    value: numericValue, 
                    scalar: numericValue,
                    unit: '1/s',
                    units: () => '1/s',
                    toString: () => `${numericValue} s⁻¹`
                };
            }
            
            if (unit === '1/min') {
                this.logDebug(`Creating strain rate quantity: ${numericValue} min⁻¹`);
                return { 
                    value: numericValue, 
                    scalar: numericValue,
                    unit: '1/min',
                    units: () => '1/min',
                    toString: () => `${numericValue} min⁻¹`
                };
            }
            
            // Check if it's a pressure unit
            const pressureUnits = ['Pa', 'kPa', 'MPa', 'GPa', 'psi', 'bar', 'atm'];
            if (pressureUnits.includes(unit)) {
                this.logDebug(`Creating pressure quantity: ${numericValue} ${unit}`);
                return {
                    value: numericValue,
                    scalar: numericValue,
                    unit: unit,
                    units: () => unit,
                    toString: () => `${numericValue} ${unit}`
                };
            }
            
            // Try using js-quantities for other units
            if (this.Qty && typeof this.Qty === 'function') {
                try {
                    const qty = this.Qty(numericValue, unit);
                    this.logDebug(`Created quantity using js-quantities: ${qty.toString()}`);
                    return qty;
                } catch (qtyError) {
                    console.error(`js-quantities error for ${numericValue} ${unit}:`, qtyError);
                    // Fall through to default handling
                }
            }
            
            // Default fallback - create a simple object
            this.logDebug(`Creating generic quantity: ${numericValue} ${unit}`);
            return {
                value: numericValue,
                scalar: numericValue,
                unit: unit,
                units: () => unit,
                toString: () => `${numericValue} ${unit}`
            };
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
            console.error('Cannot convert: UnitsHandler not initialized or quantity is null');
            return null;
        }

        try {
            this.logDebug(`Converting from ${JSON.stringify(quantity)} to ${targetUnit}`);
            
            // Skip conversion if units are the same
            const sourceUnit = quantity.unit || (quantity.units && typeof quantity.units === 'function' ? quantity.units() : '');
            if (sourceUnit === targetUnit) {
                this.logDebug(`Source and target units are the same (${sourceUnit}), skipping conversion`);
                return quantity;
            }

            // Handle dimensionless quantities and percentages
            if ((sourceUnit === '' || sourceUnit === '-') && (targetUnit === '%')) {
                const value = this.getValue(quantity);
                const convertedValue = value * 100;
                this.logDebug(`Converting dimensionless ${value} to percentage: ${convertedValue}%`);
                return { 
                    value: convertedValue, 
                    scalar: convertedValue,
                    unit: '%',
                    units: () => '%',
                    toString: () => `${convertedValue}%`
                };
            } else if (sourceUnit === '%' && (targetUnit === '' || targetUnit === '-')) {
                const value = this.getValue(quantity);
                const convertedValue = value / 100;
                this.logDebug(`Converting percentage ${value}% to dimensionless: ${convertedValue}`);
                return { 
                    value: convertedValue, 
                    scalar: convertedValue,
                    unit: '',
                    units: () => '',
                    toString: () => `${convertedValue}`
                };
            }

            // Handle strain rate conversion
            if (sourceUnit === '1/s' && targetUnit === '1/min') {
                const value = this.getValue(quantity);
                const convertedValue = value * 60;
                this.logDebug(`Converting strain rate ${value}/s to ${convertedValue}/min`);
                return { 
                    value: convertedValue, 
                    scalar: convertedValue,
                    unit: '1/min',
                    units: () => '1/min',
                    toString: () => `${convertedValue} min⁻¹`
                };
            } else if (sourceUnit === '1/min' && targetUnit === '1/s') {
                const value = this.getValue(quantity);
                const convertedValue = value / 60;
                this.logDebug(`Converting strain rate ${value}/min to ${convertedValue}/s`);
                return { 
                    value: convertedValue, 
                    scalar: convertedValue,
                    unit: '1/s',
                    units: () => '1/s',
                    toString: () => `${convertedValue} s⁻¹`
                };
            }

            // Handle pressure unit conversions explicitly to ensure correct scaling
            // Pressure conversion factors to base unit (Pa)
            const pressureFactors = {
                'Pa': 1,
                'kPa': 1000,
                'MPa': 1000000,
                'GPa': 1000000000,
                'psi': 6894.76,
                'bar': 100000,
                'atm': 101325
            };
            
            // Check if both units are pressure units
            if (pressureFactors[sourceUnit] && pressureFactors[targetUnit]) {
                const value = this.getValue(quantity);
                const valueInPa = value * pressureFactors[sourceUnit];
                const convertedValue = valueInPa / pressureFactors[targetUnit];
                
                this.logDebug(`Converting pressure ${value} ${sourceUnit} to ${convertedValue} ${targetUnit}`, {
                    originalValue: value,
                    sourceUnit: sourceUnit,
                    targetUnit: targetUnit,
                    valueInPa: valueInPa,
                    convertedValue: convertedValue,
                    sourceFactor: pressureFactors[sourceUnit],
                    targetFactor: pressureFactors[targetUnit]
                });
                
                // Return a properly formatted quantity object
                return {
                    value: convertedValue,
                    scalar: convertedValue,
                    unit: targetUnit,
                    units: () => targetUnit,
                    toString: () => `${convertedValue} ${targetUnit}`
                };
            }

            // Try using js-quantities for other conversions
            if (this.Qty && typeof this.Qty === 'function') {
                try {
                    const qtyValue = typeof quantity === 'object' && quantity.scalar !== undefined ? 
                        quantity.scalar : this.getValue(quantity);
                    const qtyUnit = typeof quantity === 'object' && quantity.unit !== undefined ? 
                        quantity.unit : sourceUnit;
                    
                    const qty = this.Qty(`${qtyValue} ${qtyUnit}`);
                    const converted = qty.to(targetUnit);
                    
                    this.logDebug(`Converted using js-quantities: ${qtyValue} ${qtyUnit} -> ${converted.scalar} ${targetUnit}`);
                    
                    return converted;
                } catch (qtyError) {
                    console.error('js-quantities conversion error:', qtyError);
                    // Fall through to default handling
                }
            }

            // If we got here, we couldn't convert properly
            console.warn(`Could not convert from ${sourceUnit} to ${targetUnit}, returning original quantity`);
            return quantity;
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
        if (!quantity) {
            this.logDebug('getValue called with null/undefined quantity, returning 0');
            return 0;
        }
        
        this.logDebug(`Getting value from quantity: ${JSON.stringify(quantity)}`);
        
        // Handle js-quantities objects
        if (typeof quantity.scalar !== 'undefined') {
            this.logDebug(`Using scalar property: ${quantity.scalar}`);
            return quantity.scalar;
        }
        
        // Handle our custom quantity objects
        if (typeof quantity.value !== 'undefined') {
            this.logDebug(`Using value property: ${quantity.value}`);
            return quantity.value;
        }
        
        // Handle numeric values directly
        if (typeof quantity === 'number') {
            this.logDebug(`Using direct number: ${quantity}`);
            return quantity;
        }
        
        // Try to extract value from toString() if it's available
        if (typeof quantity.toString === 'function') {
            const str = quantity.toString();
            const match = str.match(/^[\d.-]+/);
            if (match) {
                const parsed = parseFloat(match[0]);
                this.logDebug(`Extracted from toString(): ${parsed}`);
                return parsed;
            }
        }
        
        // Try to parse as float if it's a string or other type
        if (typeof quantity === 'string') {
            const parsed = parseFloat(quantity);
            this.logDebug(`Parsed from string: ${parsed}`);
            return parsed;
        }
        
        this.logDebug('Could not extract value, returning 0');
        return 0;
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
        
        // Get unit from quantity object
        let unit = '';
        if (quantity.unit) {
            unit = quantity.unit;
        } else if (quantity.units && typeof quantity.units === 'function') {
            unit = quantity.units();
        }
        
        // Format the value based on its magnitude
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
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether debug mode should be enabled
     */
    setDebugMode(enabled) {
        this.debug = enabled;
        this.logDebug(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
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