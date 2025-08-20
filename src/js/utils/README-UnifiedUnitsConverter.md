# UnifiedUnitsConverter

A comprehensive unit conversion utility for all calculators in the MaterialMap project.

## Overview

The `UnifiedUnitsConverter` provides a unified approach to unit conversion across all calculators, supporting various physical quantities including pressure, strain, strain rate, temperature, and more. It handles both simple conversions and complex unit relationships.

## Features

- Consistent API for all unit conversions
- Support for dimensionless quantities and percentages
- Fallback mechanisms when external libraries are unavailable
- Detailed logging for debugging
- Extensible design for adding new unit types

## Usage

### Basic Initialization

```javascript
// Create and initialize the converter
const unitsConverter = new UnifiedUnitsConverter();
await unitsConverter.initialize();

// Enable debug mode for development (optional)
unitsConverter.setDebugMode(true);
```

### Simple Conversion

```javascript
// Convert pressure from MPa to GPa
const pressureInMPa = 350;
const pressureInGPa = unitsConverter.convert(pressureInMPa, 'MPa', 'GPa', 'pressure');
console.log(`Converted pressure: ${pressureInMPa} MPa = ${pressureInGPa} GPa`);

// Convert strain from dimensionless to percent
const strainDimensionless = 0.05;
const strainPercent = unitsConverter.convert(strainDimensionless, '', '%', 'strain');
console.log(`Converted strain: ${strainDimensionless} = ${strainPercent}%`);

// Convert temperature from Celsius to Kelvin and Fahrenheit
const tempCelsius = 25;
const tempKelvin = unitsConverter.convert(tempCelsius, 'C', 'K', 'temperature');
const tempFahrenheit = unitsConverter.convert(tempCelsius, 'C', 'F', 'temperature');
console.log(`Converted temperature: ${tempCelsius}°C = ${tempKelvin}K = ${tempFahrenheit}°F`);
```

### Converting Form Inputs

```javascript
// Store current units
let currentUnits = {
    pressure: 'MPa',
    strain: '',
    temperature: 'C'
};

// When unit selection changes
document.getElementById('pressureUnit').addEventListener('change', function() {
    const oldUnits = { ...currentUnits };
    currentUnits.pressure = this.value;
    
    // Convert all inputs with data-unit-type="pressure"
    unitsConverter.convertFormInputs(oldUnits, currentUnits, '#calculatorForm');
    
    // Update unit displays
    updateUnitDisplays();
});
```

### Calculation with Unit Conversion

```javascript
function calculate() {
    // Get values from inputs
    const youngModulus = parseFloat(document.getElementById('youngModulus').value);
    const strain = parseFloat(document.getElementById('strain').value);
    
    // Convert to base units for calculation
    const youngModulusBase = unitsConverter.convert(
        youngModulus, 
        currentUnits.pressure, 
        unitsConverter.getBaseUnit('pressure'), 
        'pressure'
    );
    
    const strainBase = unitsConverter.convert(
        strain, 
        currentUnits.strain, 
        unitsConverter.getBaseUnit('strain'), 
        'strain'
    );
    
    // Perform calculations in base units
    const stressBase = youngModulusBase * strainBase;
    
    // Convert results back to display units
    const stress = unitsConverter.convert(
        stressBase, 
        unitsConverter.getBaseUnit('pressure'), 
        currentUnits.pressure, 
        'pressure'
    );
    
    // Display formatted result
    document.getElementById('stress').textContent = 
        unitsConverter.formatValue(stress);
}
```

### Formatting Values

```javascript
// Format values with appropriate precision
const smallValue = 0.0000123;
const mediumValue = 3.14159;
const largeValue = 12345.6789;

console.log(`Formatted small value: ${unitsConverter.formatValue(smallValue)}`);
console.log(`Formatted medium value: ${unitsConverter.formatValue(mediumValue)}`);
console.log(`Formatted large value: ${unitsConverter.formatValue(largeValue)}`);

// Format with units
console.log(`Formatted with unit: ${unitsConverter.formatWithUnit(mediumValue, 'MPa')}`);
```

## Supported Unit Types

The converter supports the following physical quantities:

- **Pressure/Stress**: Pa, kPa, MPa, GPa, psi, bar, atm
- **Strain**: Dimensionless (-), Percent (%)
- **Strain Rate**: Per second (s⁻¹), Per minute (min⁻¹)
- **Temperature**: Kelvin (K), Celsius (°C), Fahrenheit (°F)
- **Length**: m, cm, mm, in, ft
- **Density**: kg/m³, g/cm³, lb/ft³

## HTML Integration

For best integration with HTML forms, add `data-unit-type` attributes to your input elements:

```html
<input type="number" id="youngModulus" data-unit-type="pressure" value="200000">
<span class="unit-display" data-unit-type="pressure">MPa</span>
```

This allows the converter to automatically handle unit conversions when units change.

## Adding New Unit Types

To add support for a new physical quantity, extend the `unitDefinitions` object in the constructor:

```javascript
// Example: Adding energy units
energy: {
    baseUnit: 'J',
    displayUnit: 'kJ',
    units: ['J', 'kJ', 'cal', 'kcal', 'BTU'],
    displayNames: {
        'J': 'Joule (J)',
        'kJ': 'Kilojoule (kJ)',
        'cal': 'Calorie (cal)',
        'kcal': 'Kilocalorie (kcal)',
        'BTU': 'British Thermal Unit (BTU)'
    },
    // Conversion factors to base unit (J)
    toBase: {
        'J': 1,
        'kJ': 1000,
        'cal': 4.184,
        'kcal': 4184,
        'BTU': 1055.06
    }
}
```

## Example

See the complete example in `/examples/units-converter-example.html` for a working demonstration of the UnifiedUnitsConverter.