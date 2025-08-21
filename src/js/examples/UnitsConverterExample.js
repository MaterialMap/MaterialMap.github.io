/**
 * Example usage of UnifiedUnitsConverter
 * 
 * This file demonstrates how to use the UnifiedUnitsConverter in a calculator.
 * It shows the initialization, conversion, and integration with form inputs.
 */

// Example usage in a calculator
async function initializeCalculator() {
    // Create and initialize the converter
    const unitsConverter = new UnifiedUnitsConverter();
    await unitsConverter.initialize();
    
    // Enable debug mode for development
    unitsConverter.setDebugMode(true);
    
    // Store current units
    let currentUnits = {
        pressure: 'MPa',
        strain: '',
        strainRate: '1/s',
        temperature: 'C'
    };
    
    // Example: Convert a pressure value
    const pressureInMPa = 350;
    const pressureInGPa = unitsConverter.convert(pressureInMPa, 'MPa', 'GPa', 'pressure');
    console.log(`Converted pressure: ${pressureInMPa} MPa = ${pressureInGPa} GPa`);
    
    // Example: Convert a strain value
    const strainDimensionless = 0.05;
    const strainPercent = unitsConverter.convert(strainDimensionless, '', '%', 'strain');
    console.log(`Converted strain: ${strainDimensionless} = ${strainPercent}%`);
    
    // Example: Convert a temperature value
    const tempCelsius = 25;
    const tempKelvin = unitsConverter.convert(tempCelsius, 'C', 'K', 'temperature');
    const tempFahrenheit = unitsConverter.convert(tempCelsius, 'C', 'F', 'temperature');
    console.log(`Converted temperature: ${tempCelsius}°C = ${tempKelvin}K = ${tempFahrenheit}°F`);
    
    // Example: Update units in a form when unit selection changes
    document.getElementById('pressureUnit').addEventListener('change', function() {
        const oldUnits = { ...currentUnits };
        currentUnits.pressure = this.value;
        
        // Convert all inputs with data-unit-type="pressure"
        unitsConverter.convertFormInputs(oldUnits, currentUnits, '#calculatorForm');
        
        // Update unit displays
        updateUnitDisplays();
    });
    
    // Example: Format values with appropriate precision
    const smallValue = 0.0000123;
    const mediumValue = 3.14159;
    const largeValue = 12345.6789;
    
    console.log(`Formatted small value: ${unitsConverter.formatValue(smallValue)}`);
    console.log(`Formatted medium value: ${unitsConverter.formatValue(mediumValue)}`);
    console.log(`Formatted large value: ${unitsConverter.formatValue(largeValue)}`);
    
    // Example: Format with units
    console.log(`Formatted with unit: ${unitsConverter.formatWithUnit(mediumValue, 'MPa')}`);
}

// Example: Update unit displays in the UI
function updateUnitDisplays() {
    // Update all elements with class 'unit-display' and data-unit-type attribute
    document.querySelectorAll('.unit-display[data-unit-type]').forEach(element => {
        const unitType = element.getAttribute('data-unit-type');
        const unit = currentUnits[unitType];
        
        // Special display for certain units
        if (unitType === 'strain' && unit === '') {
            element.textContent = '-';
        } else if (unitType === 'strainRate' && unit === '1/s') {
            element.textContent = 's⁻¹';
        } else if (unitType === 'strainRate' && unit === '1/min') {
            element.textContent = 'min⁻¹';
        } else {
            element.textContent = unit;
        }
    });
}

// Example: Convert input values when calculating
function calculateWithUnits() {
    // Get values from inputs and convert to base units for calculation
    const youngModulus = parseFloat(document.getElementById('youngModulus').value);
    const youngModulusBase = unitsConverter.convert(
        youngModulus, 
        currentUnits.pressure, 
        unitsConverter.getBaseUnit('pressure'), 
        'pressure'
    );
    
    const yieldStrength = parseFloat(document.getElementById('yieldStrength').value);
    const yieldStrengthBase = unitsConverter.convert(
        yieldStrength, 
        currentUnits.pressure, 
        unitsConverter.getBaseUnit('pressure'), 
        'pressure'
    );
    
    // Perform calculations in base units
    const result = performCalculation(youngModulusBase, yieldStrengthBase);
    
    // Convert results back to display units
    const displayResult = unitsConverter.convert(
        result, 
        unitsConverter.getBaseUnit('pressure'), 
        currentUnits.pressure, 
        'pressure'
    );
    
    // Display formatted result
    document.getElementById('result').textContent = 
        unitsConverter.formatWithUnit(displayResult, currentUnits.pressure);
}

// Example: Perform calculation in base units
function performCalculation(youngModulus, yieldStrength) {
    // This is just a placeholder for actual calculation logic
    return youngModulus * 0.1 + yieldStrength;
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', initializeCalculator);