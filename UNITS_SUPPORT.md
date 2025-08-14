# Units Support Implementation

## Overview

This document describes the implementation of comprehensive units support for the Material MAP calculators using the js-quantities library. The implementation provides automatic unit conversion, validation, and a user-friendly interface for working with different measurement systems.

## Features

### Supported Physical Quantities

1. **Pressure/Stress** - Pa, kPa, MPa, GPa, psi, bar, atm
2. **Strain** - Dimensionless (-), Percent (%)
3. **Strain Rate** - Per second (s⁻¹), Per minute (min⁻¹)
4. **Modulus** - Pa, kPa, MPa, GPa, psi
5. **Temperature** - Kelvin (K), Celsius (°C), Fahrenheit (°F)

### Implementation Components

#### 1. UnitsHandler.js (`/src/js/utils/UnitsHandler.js`)
- Main class for handling unit conversions
- Integrates js-quantities library
- Provides fallback functionality
- Supports validation and formatting

#### 2. Units CSS (`/src/css/components/units.css`)
- Styling for units interface elements
- Responsive design for mobile devices
- Visual feedback for unit selections

#### 3. Modified Calculators
- **Johnson-Cook Calculator**: Full units support for stress, strain, and strain rate
- **Mooney-Rivlin Calculator**: Units support for pressure and hardness values
- **Swift's Law Calculator**: Complete units integration for all material properties

## Usage

### Basic Usage

```javascript
// Initialize the units handler
const unitsHandler = new UnitsHandler();
await unitsHandler.initialize();

// Create quantity with units
const pressure = unitsHandler.createQuantity(350, 'MPa');

// Convert units
const pressureInPsi = unitsHandler.convert(pressure, 'psi');

// Get scalar value
const value = unitsHandler.getValue(pressureInPsi);

// Format for display
const formatted = unitsHandler.format(pressureInPsi, 2);
```

### Calculator Integration

Each calculator now includes:

1. **Units Panel** - Collapsible interface for selecting measurement units
2. **Input Fields** - Enhanced with unit displays and automatic conversion
3. **Results Display** - Shows values in selected units with proper formatting

### Interface Elements

#### Units Settings Panel
```html
<div class="units-panel">
    <h3>🔧 Units Settings</h3>
    <div class="units-grid">
        <div class="unit-group">
            <label>Pressure/Stress Units:</label>
            <select id="pressureUnit">
                <option value="MPa" selected>Megapascal (MPa)</option>
                <option value="Pa">Pascal (Pa)</option>
                <!-- ... more options -->
            </select>
        </div>
    </div>
</div>
```

#### Enhanced Input Fields
```html
<div class="input-item with-units">
    <label for="yieldStrength">Yield Strength:</label>
    <div class="input-with-units">
        <input type="number" id="yieldStrength" value="350">
        <span class="unit-display" id="yieldStrengthUnit">MPa</span>
    </div>
</div>
```

## Technical Details

### Unit Conversion Strategy

1. **Base Units**: All calculations performed in base units (MPa for pressure, dimensionless for strain)
2. **Input Conversion**: User input converted from display units to base units
3. **Output Conversion**: Results converted from base units to display units
4. **Fallback Handling**: Graceful degradation when js-quantities unavailable

### Error Handling

- Validates unit compatibility
- Provides fallback for calculation errors
- Maintains functionality without external dependencies

### Performance Considerations

- Lazy loading of js-quantities library
- Cached unit conversions
- Optimized for real-time calculations

## Files Modified

### Core Implementation
- `/src/js/utils/UnitsHandler.js` - Main units handling class
- `/src/css/components/units.css` - Units interface styling

### Calculator Updates
- `johnson_cook_calculator.html` - Full units integration
- `mooney_rivlin_calculator.html` - Units support added
- `swift_law_calculator_units.html` - New version with units support

## Browser Compatibility

- Modern browsers with ES6 support
- Fallback functionality for older browsers
- CDN-based js-quantities loading for reliability

## Dependencies

### External
- `js-quantities` v1.8.0 (loaded from CDN)

### Internal
- Existing Material MAP styling system
- Navigation components

## Testing

Test the units functionality by:

1. Open any calculator in a web browser
2. Click "Units Settings" to expand the panel
3. Change units and verify automatic conversion
4. Verify calculations remain accurate across unit systems
5. Test fallback behavior by blocking CDN access

## Future Enhancements

1. **Additional Units**: Support for more specialized engineering units
2. **Unit Preferences**: Save user unit preferences in localStorage  
3. **Batch Conversion**: Convert entire result sets between unit systems
4. **Unit Validation**: Enhanced validation with error messages
5. **SI/Imperial Presets**: Quick switching between measurement systems

## Troubleshooting

### Common Issues

1. **Units not converting**: Check browser console for js-quantities loading errors
2. **Styling issues**: Verify units.css is properly loaded
3. **Calculation errors**: Ensure input values are valid numbers

### Debug Mode

Enable debug logging:
```javascript
unitsHandler.debug = true; // Enable detailed logging
```

This implementation provides a robust, user-friendly system for handling engineering units in material property calculations, making the Material MAP calculators more accessible to international users and various engineering disciplines.