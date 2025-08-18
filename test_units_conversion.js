/**
 * Simple unit conversion testing script
 * Run this in browser console to test conversion functions
 */

// Test pressure conversions
function testPressureConversions() {
    console.log('🧪 Testing Pressure Conversions:');
    
    // Test data: [value, fromUnit, toUnit, expectedResult]
    const testCases = [
        [1, 'MPa', 'GPa', 0.001],
        [1000, 'MPa', 'GPa', 1],
        [1, 'GPa', 'MPa', 1000],
        [1, 'MPa', 'Pa', 1000000],
        [1000000, 'Pa', 'MPa', 1],
        [145.038, 'psi', 'MPa', 1], // approximately
        [1, 'MPa', 'psi', 145.038], // approximately
    ];
    
    testCases.forEach(([value, fromUnit, toUnit, expected]) => {
        const result = convertPressure(value, fromUnit, toUnit);
        const tolerance = Math.abs(expected) * 0.01; // 1% tolerance
        const passed = Math.abs(result - expected) <= tolerance;
        
        console.log(`${passed ? '✅' : '❌'} ${value} ${fromUnit} → ${result.toFixed(6)} ${toUnit} (expected: ${expected})`);
    });
}

// Test density conversions  
function testDensityConversions() {
    console.log('\n🧪 Testing Density Conversions:');
    
    const testCases = [
        [1000, 'kg/m³', 'g/cm³', 1],
        [1, 'g/cm³', 'kg/m³', 1000],
        [62.428, 'lb/ft³', 'kg/m³', 1000], // approximately
        [1000, 'kg/m³', 'lb/ft³', 62.428], // approximately
    ];
    
    testCases.forEach(([value, fromUnit, toUnit, expected]) => {
        let result = value;
        
        // Convert to kg/m³ first
        if (fromUnit === 'g/cm³') {
            result = result * 1000;
        } else if (fromUnit === 'lb/ft³') {
            result = result * 16.0185;
        }
        
        // Convert from kg/m³ to target unit
        if (toUnit === 'g/cm³') {
            result = result / 1000;
        } else if (toUnit === 'lb/ft³') {
            result = result / 16.0185;
        }
        
        const tolerance = Math.abs(expected) * 0.01; // 1% tolerance
        const passed = Math.abs(result - expected) <= tolerance;
        
        console.log(`${passed ? '✅' : '❌'} ${value} ${fromUnit} → ${result.toFixed(3)} ${toUnit} (expected: ${expected})`);
    });
}

// Test strain conversions
function testStrainConversions() {
    console.log('\n🧪 Testing Strain Conversions:');
    
    const testCases = [
        [0.05, '', '%', 5],
        [5, '%', '', 0.05],
        [0.2, '', '%', 20],
        [25, '%', '', 0.25],
    ];
    
    testCases.forEach(([value, fromUnit, toUnit, expected]) => {
        let result = value;
        
        if (fromUnit === '' && toUnit === '%') {
            result = value * 100;
        } else if (fromUnit === '%' && toUnit === '') {
            result = value / 100;
        }
        
        const passed = Math.abs(result - expected) < 0.001;
        
        console.log(`${passed ? '✅' : '❌'} ${value} ${fromUnit || 'dimensionless'} → ${result} ${toUnit || 'dimensionless'} (expected: ${expected})`);
    });
}

// Test strain rate conversions
function testStrainRateConversions() {
    console.log('\n🧪 Testing Strain Rate Conversions:');
    
    const testCases = [
        [1, '1/s', '1/min', 60],
        [60, '1/min', '1/s', 1],
        [0.01, '1/s', '1/min', 0.6],
        [100, '1/min', '1/s', 1.667], // approximately
    ];
    
    testCases.forEach(([value, fromUnit, toUnit, expected]) => {
        let result = value;
        
        if (fromUnit === '1/s' && toUnit === '1/min') {
            result = value * 60;
        } else if (fromUnit === '1/min' && toUnit === '1/s') {
            result = value / 60;
        }
        
        const tolerance = Math.abs(expected) * 0.01; // 1% tolerance
        const passed = Math.abs(result - expected) <= tolerance;
        
        console.log(`${passed ? '✅' : '❌'} ${value} ${fromUnit} → ${result.toFixed(3)} ${toUnit} (expected: ${expected})`);
    });
}

// Generic pressure conversion function (should match the one in Gibson-Ashby calculator)
function convertPressure(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    
    // Convert to Pa first (base unit)
    let valueInPa = value;
    switch(fromUnit) {
        case 'Pa': valueInPa = value; break;
        case 'kPa': valueInPa = value * 1000; break;
        case 'MPa': valueInPa = value * 1000000; break;
        case 'GPa': valueInPa = value * 1000000000; break;
        case 'psi': valueInPa = value * 6894.76; break;
    }
    
    // Convert from Pa to target unit
    switch(toUnit) {
        case 'Pa': return valueInPa;
        case 'kPa': return valueInPa / 1000;
        case 'MPa': return valueInPa / 1000000;
        case 'GPa': return valueInPa / 1000000000;
        case 'psi': return valueInPa / 6894.76;
        default: return valueInPa / 1000000; // Default to MPa
    }
}

// Run all tests
function runAllTests() {
    console.log('🚀 Starting Units Conversion Tests\n');
    
    testPressureConversions();
    testDensityConversions();
    testStrainConversions();
    testStrainRateConversions();
    
    console.log('\n✅ All tests completed! Check results above.');
    console.log('💡 To test in actual calculators, open: http://localhost:3000/test_calculators_units.html');
}

// Export functions for browser console usage
window.testUnitsConversion = {
    runAllTests,
    testPressureConversions,
    testDensityConversions,
    testStrainConversions,
    testStrainRateConversions,
    convertPressure
};

console.log('📝 Units conversion test functions loaded!');
console.log('Run: testUnitsConversion.runAllTests() to test all conversions');