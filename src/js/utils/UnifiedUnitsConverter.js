/**
 * UnifiedUnitsConverter - A comprehensive unit conversion utility for all calculators
 * 
 * This class provides a unified approach to unit conversion across all calculators,
 * supporting various physical quantities including pressure, strain, strain rate,
 * temperature, and more. It handles both simple conversions and complex unit relationships.
 * 
 * Features:
 * - Consistent API for all unit conversions
 * - Support for dimensionless quantities and percentages
 * - Fallback mechanisms when external libraries are unavailable
 * - Detailed logging for debugging
 * - Extensible design for adding new unit types
 */
class UnifiedUnitsConverter {
    /**
     * Initialize the converter with unit definitions
     */
    constructor() {
        this.initialized = false;
        this.debug = false;
        this.externalLibrary = null; // Will hold js-quantities if available
        this.unitDefinitions = this.initializeUnitDefinitions();
    }

    /**
     * Initialize unit definitions for all supported physical quantities
     * @returns {Object} Unit definitions
     */
    initializeUnitDefinitions() {
        return {
            // Pressure/stress units
            pressure: {
                baseUnit: 'Pa',
                displayUnit: 'MPa',
                units: ['Pa', 'kPa', 'MPa', 'GPa', 'psi', 'bar', 'atm'],
                displayNames: {
                    'Pa': 'Pascal (Pa)',
                    'kPa': 'Kilopascal (kPa)',
                    'MPa': 'Megapascal (MPa)',
                    'GPa': 'Gigapascal (GPa)',
                    'psi': 'Pounds per square inch (psi)',
                    'bar': 'Bar (bar)',
                    'atm': 'Atmosphere (atm)'
                },
                // Conversion factors to base unit (Pa)
                toBase: {
                    'Pa': 1,
                    'kPa': 1000,
                    'MPa': 1000000,
                    'GPa': 1000000000,
                    'psi': 6894.76,
                    'bar': 100000,
                    'atm': 101325
                }
            },
            
            // Strain units (dimensionless or percentage)
            strain: {
                baseUnit: '',
                displayUnit: '',
                units: ['', '%'],
                displayNames: {
                    '': 'Dimensionless (-)',
                    '%': 'Percent (%)'
                },
                // Special conversion functions
                convert: {
                    '->%': (value) => value * 100,
                    '%->': (value) => value / 100
                }
            },
            
            // Strain rate units
            strainRate: {
                baseUnit: '1/s',
                displayUnit: '1/s',
                units: ['1/s', '1/min'],
                displayNames: {
                    '1/s': 'Per second (s⁻¹)',
                    '1/min': 'Per minute (min⁻¹)'
                },
                // Special conversion functions
                convert: {
                    '1/s->1/min': (value) => value * 60,
                    '1/min->1/s': (value) => value / 60
                }
            },
            
            // Temperature units
            temperature: {
                baseUnit: 'K',
                displayUnit: 'C',
                units: ['K', 'C', 'F'],
                displayNames: {
                    'K': 'Kelvin (K)',
                    'C': 'Celsius (°C)',
                    'F': 'Fahrenheit (°F)'
                },
                // Special conversion functions for non-linear relationships
                toBase: {
                    'K': (value) => value,
                    'C': (value) => value + 273.15,
                    'F': (value) => (value - 32) * 5/9 + 273.15
                },
                fromBase: {
                    'K': (value) => value,
                    'C': (value) => value - 273.15,
                    'F': (value) => (value - 273.15) * 9/5 + 32
                }
            },
            
            // Length units
            length: {
                baseUnit: 'm',
                displayUnit: 'mm',
                units: ['m', 'cm', 'mm', 'in', 'ft'],
                displayNames: {
                    'm': 'Meter (m)',
                    'cm': 'Centimeter (cm)',
                    'mm': 'Millimeter (mm)',
                    'in': 'Inch (in)',
                    'ft': 'Foot (ft)'
                },
                // Conversion factors to base unit (m)
                toBase: {
                    'm': 1,
                    'cm': 0.01,
                    'mm': 0.001,
                    'in': 0.0254,
                    'ft': 0.3048
                }
            },
            
            // Density units
            density: {
                baseUnit: 'kg/m³',
                displayUnit: 'kg/m³',
                units: ['kg/m³', 'g/cm³', 'lb/ft³'],
                displayNames: {
                    'kg/m³': 'Kilogram per cubic meter (kg/m³)',
                    'g/cm³': 'Gram per cubic centimeter (g/cm³)',
                    'lb/ft³': 'Pound per cubic foot (lb/ft³)'
                },
                // Conversion factors to base unit (kg/m³)
                toBase: {
                    'kg/m³': 1,
                    'g/cm³': 1000,
                    'lb/ft³': 16.0185
                }
            }
        };
    }

    /**
     * Initialize the converter, loading external libraries if available
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        if (this.initialized) {
            return true;
        }

        try {
            // Try to load js-quantities for advanced unit conversions
            if (typeof window.Qty === 'undefined') {
                try {
                    await this.loadExternalLibrary();
                    this.externalLibrary = window.Qty;
                    this.log('External library (js-quantities) loaded successfully');
                } catch (error) {
                    this.log('External library could not be loaded, using built-in conversions only', error);
                }
            } else {
                this.externalLibrary = window.Qty;
                this.log('Using existing js-quantities library');
            }
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize UnifiedUnitsConverter:', error);
            return false;
        }
    }

    /**
     * Load js-quantities from CDN
     * @returns {Promise<void>}
     */
    loadExternalLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/js-quantities@1.8.0/quantities.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load js-quantities'));
            document.head.appendChild(script);
        });
    }

    /**
     * Log debug information if debug mode is enabled
     * @param {string} message - Debug message
     * @param {any} data - Optional data to log
     */
    log(message, data) {
        if (this.debug) {
            if (data !== undefined) {
                console.log(`[UnifiedUnitsConverter] ${message}`, data);
            } else {
                console.log(`[UnifiedUnitsConverter] ${message}`);
            }
        }
    }

    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether debug mode should be enabled
     */
    setDebugMode(enabled) {
        this.debug = enabled;
        this.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Convert a value from one unit to another
     * @param {number} value - Value to convert
     * @param {string} fromUnit - Source unit
     * @param {string} toUnit - Target unit
     * @param {string} quantityType - Type of physical quantity (pressure, strain, etc.)
     * @returns {number} Converted value
     */
    convert(value, fromUnit, toUnit, quantityType) {
        // Skip conversion if units are the same
        if (fromUnit === toUnit) {
            return value;
        }

        this.log(`Converting ${value} from ${fromUnit} to ${toUnit} (${quantityType})`);

        // Handle undefined or null values
        if (value === undefined || value === null || isNaN(value)) {
            console.warn(`Invalid value for conversion: ${value}`);
            return 0;
        }

        // Get unit definition for the quantity type
        const unitDef = this.unitDefinitions[quantityType];
        if (!unitDef) {
            console.warn(`Unknown quantity type: ${quantityType}`);
            return value;
        }

        // Check if units are valid for this quantity type
        if (!unitDef.units.includes(fromUnit) || !unitDef.units.includes(toUnit)) {
            console.warn(`Invalid units for ${quantityType}: ${fromUnit} -> ${toUnit}`);
            return value;
        }

        // Handle special direct conversions if available
        if (unitDef.convert) {
            const directKey = `${fromUnit}->${toUnit}`;
            if (typeof unitDef.convert[directKey] === 'function') {
                const result = unitDef.convert[directKey](value);
                this.log(`Direct conversion ${directKey}: ${value} -> ${result}`);
                return result;
            }
        }

        // Try using external library if available
        if (this.externalLibrary && typeof this.externalLibrary === 'function') {
            try {
                const qty = this.externalLibrary(`${value} ${fromUnit}`);
                const converted = qty.to(toUnit);
                const result = converted.scalar;
                this.log(`External library conversion: ${value} ${fromUnit} -> ${result} ${toUnit}`);
                return result;
            } catch (error) {
                this.log('External library conversion failed, using fallback', error);
                // Continue to fallback methods
            }
        }

        // Handle temperature conversions (non-linear)
        if (quantityType === 'temperature') {
            // Convert to base unit (K) first
            const valueInBase = unitDef.toBase[fromUnit](value);
            // Then convert from base unit to target unit
            const result = unitDef.fromBase[toUnit](valueInBase);
            this.log(`Temperature conversion: ${value} ${fromUnit} -> ${valueInBase} K -> ${result} ${toUnit}`);
            return result;
        }

        // Handle linear conversions using conversion factors
        if (unitDef.toBase) {
            // Convert to base unit first
            const valueInBase = value * unitDef.toBase[fromUnit];
            // Then convert from base unit to target unit
            const result = valueInBase / unitDef.toBase[toUnit];
            this.log(`Linear conversion: ${value} ${fromUnit} -> ${valueInBase} ${unitDef.baseUnit} -> ${result} ${toUnit}`);
            return result;
        }

        // If no conversion method worked, return original value
        console.warn(`No conversion method available for ${quantityType}: ${fromUnit} -> ${toUnit}`);
        return value;
    }

    /**
     * Get available units for a physical quantity type
     * @param {string} quantityType - Type of physical quantity
     * @returns {Array} Array of available units
     */
    getAvailableUnits(quantityType) {
        return this.unitDefinitions[quantityType]?.units || [];
    }

    /**
     * Get display name for a unit
     * @param {string} quantityType - Type of physical quantity
     * @param {string} unit - Unit string
     * @returns {string} Display name
     */
    getDisplayName(quantityType, unit) {
        return this.unitDefinitions[quantityType]?.displayNames[unit] || unit;
    }

    /**
     * Get base unit for a quantity type
     * @param {string} quantityType - Type of physical quantity
     * @returns {string} Base unit
     */
    getBaseUnit(quantityType) {
        return this.unitDefinitions[quantityType]?.baseUnit || '';
    }

    /**
     * Get default display unit for a quantity type
     * @param {string} quantityType - Type of physical quantity
     * @returns {string} Display unit
     */
    getDisplayUnit(quantityType) {
        return this.unitDefinitions[quantityType]?.displayUnit || '';
    }

    /**
     * Create HTML select element with unit options
     * @param {string} quantityType - Type of physical quantity
     * @param {string} selectedUnit - Currently selected unit
     * @param {string} id - Element ID
     * @param {Function} onChangeCallback - Callback function when selection changes
     * @returns {HTMLElement} Select element
     */
    createUnitSelector(quantityType, selectedUnit, id, onChangeCallback) {
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
        
        if (typeof onChangeCallback === 'function') {
            select.addEventListener('change', onChangeCallback);
        }
        
        return select;
    }

    /**
     * Format a value with appropriate precision based on magnitude
     * @param {number} value - Value to format
     * @param {number} precision - Default precision
     * @returns {string} Formatted value
     */
    formatValue(value, precision = 3) {
        if (value === undefined || value === null || isNaN(value)) {
            return '0';
        }
        
        // Format based on magnitude
        if (Math.abs(value) < 0.001 || Math.abs(value) >= 10000) {
            return value.toExponential(precision);
        } else {
            // Adjust precision based on magnitude
            const adjustedPrecision = 
                Math.abs(value) < 0.1 ? Math.max(precision, 4) : 
                Math.abs(value) < 1 ? Math.max(precision, 3) : 
                Math.abs(value) < 10 ? Math.max(precision - 1, 2) : 
                Math.abs(value) < 100 ? Math.max(precision - 2, 1) : 
                Math.max(precision - 3, 0);
                
            return value.toFixed(adjustedPrecision);
        }
    }

    /**
     * Format a value with its unit
     * @param {number} value - Value to format
     * @param {string} unit - Unit string
     * @param {number} precision - Default precision
     * @returns {string} Formatted value with unit
     */
    formatWithUnit(value, unit, precision = 3) {
        const formattedValue = this.formatValue(value, precision);
        return unit ? `${formattedValue} ${unit}` : formattedValue;
    }

    /**
     * Convert all input fields in a form that have data-unit-type attribute
     * @param {Object} oldUnits - Old units object {pressure: 'MPa', strain: '', ...}
     * @param {Object} newUnits - New units object {pressure: 'GPa', strain: '%', ...}
     * @param {string} formSelector - CSS selector for the form containing inputs
     */
    convertFormInputs(oldUnits, newUnits, formSelector = 'form') {
        const form = document.querySelector(formSelector);
        if (!form) {
            console.warn(`Form not found: ${formSelector}`);
            return;
        }
        
        // Find all inputs with data-unit-type attribute
        const inputs = form.querySelectorAll('input[data-unit-type]');
        
        inputs.forEach(input => {
            const quantityType = input.getAttribute('data-unit-type');
            if (!quantityType || !oldUnits[quantityType] || !newUnits[quantityType]) {
                return;
            }
            
            const value = parseFloat(input.value);
            if (isNaN(value)) {
                return;
            }
            
            const fromUnit = oldUnits[quantityType];
            const toUnit = newUnits[quantityType];
            
            if (fromUnit === toUnit) {
                return;
            }
            
            const convertedValue = this.convert(value, fromUnit, toUnit, quantityType);
            input.value = this.formatValue(convertedValue);
            
            this.log(`Converted ${input.id}: ${value} ${fromUnit} -> ${convertedValue} ${toUnit}`);
        });
    }
}

// Export for use in other modules
window.UnifiedUnitsConverter = UnifiedUnitsConverter;