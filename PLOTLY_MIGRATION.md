# Migration to Plotly.js - Unified Chart Styling

This document describes the migration from custom SVG charts to Plotly.js for unified chart styling across all Material MAP calculators.

## Overview

The Material MAP project has been migrated from custom SVG-based charts to Plotly.js to achieve:
- **Unified styling** across all calculators
- **Interactive features** (zoom, pan, hover, export)
- **Responsive design** that works on all devices
- **Professional appearance** with consistent color schemes
- **Better accessibility** and user experience

## Architecture

### PlotlyChartManager Class

A centralized chart management system located at `src/js/utils/PlotlyChartManager.js` provides:

- **Consistent styling** with predefined color palettes and layouts
- **Specialized chart methods** for each material model
- **Error handling** and fallback mechanisms
- **Export functionality** for charts as images
- **Responsive behavior** for different screen sizes

### Key Features

1. **Default Configuration**
   - Responsive design
   - Professional toolbar with export options
   - Consistent font family (Inter)
   - Unified color scheme

2. **Default Layout**
   - Light background with subtle grid
   - Consistent margins and padding
   - Professional legend positioning
   - Proper axis styling

3. **Color Palette**
   - 8 carefully selected colors for maximum contrast
   - Consistent across all chart types
   - Accessibility-friendly

## Migrated Calculators

### 1. Johnson-Cook Calculator (`johnson_cook_calculator.html`)

**Before**: Custom SVG with manual axis drawing and curve plotting
**After**: Interactive Plotly.js chart with multiple strain rate curves

**Key improvements**:
- Interactive legend
- Hover tooltips with precise values
- Zoom and pan functionality
- Export to PNG/SVG

**Usage**:
```javascript
chartManager.createJohnsonCookChart('chartId', parameters, strainRates, options);
```

### 2. Swift's Law Calculator (`swift_law_calculator.html`)

**Before**: Complex SVG with manual coordinate transformations
**After**: Clean Plotly.js implementation with elastic and plastic regions

**Key improvements**:
- Smooth curve rendering
- Better axis labeling
- Interactive features
- Consistent styling

**Usage**:
```javascript
chartManager.createSwiftLawChart('chartId', parameters, options);
```

### 3. Mooney-Rivlin Calculator (`mooney_rivlin_calculator.html`)

**Before**: SVG with logarithmic scaling and manual legend
**After**: Professional multi-curve chart with different deformation modes

**Key improvements**:
- Multiple deformation modes (uniaxial, biaxial, pure shear)
- Better curve differentiation
- Interactive legend
- Proper scaling

**Usage**:
```javascript
chartManager.createMooneyRivlinChart('chartId', parameters, options);
```

### 4. Gibson-Ashby Calculator (`gibson_ashby_calculator.html`)

**Before**: Static SVG with hardcoded regions and markers
**After**: Dynamic chart with annotated compression stages

**Key improvements**:
- Dynamic stage annotations
- Interactive compression curve
- Better visual separation of stages
- Responsive stage boundaries

**Usage**:
```javascript
chartManager.createGibsonAshbyChart('chartId', parameters, options);
```

## Implementation Details

### HTML Changes

Old SVG containers:
```html
<svg id="chartId" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
    <!-- Complex SVG content -->
</svg>
```

New Plotly containers:
```html
<div id="chartId" style="width: 100%; height: 600px;">
    <!-- Chart will be generated here -->
</div>
```

### JavaScript Changes

Old approach (manual SVG manipulation):
```javascript
function updateChart() {
    const svg = document.getElementById('chart');
    svg.innerHTML = '';
    // Hundreds of lines of manual SVG creation
}
```

New approach (Plotly.js):
```javascript
function updateChart() {
    if (!chartManager.isPlotlyLoaded()) return;
    
    const parameters = { /* ... */ };
    const options = { /* ... */ };
    
    chartManager.createSpecificChart('chartId', parameters, options)
        .catch(error => console.error('Chart error:', error));
}
```

### Dependencies

Added to all calculator pages:
```html
<script src="https://cdn.plot.ly/plotly-2.32.0.min.js" charset="utf-8"></script>
<script src="src/js/utils/PlotlyChartManager.js"></script>
```

## Benefits Achieved

### 1. Visual Consistency
- All charts now use the same color palette
- Consistent fonts, margins, and styling
- Professional appearance across all calculators

### 2. Interactivity
- **Zoom**: Users can zoom into specific regions
- **Pan**: Navigate around zoomed charts
- **Hover**: Precise value tooltips
- **Legend**: Toggle curve visibility
- **Export**: Save charts as high-quality images

### 3. Responsiveness
- Charts automatically resize on different screen sizes
- Mobile-friendly touch interactions
- Proper scaling on high-DPI displays

### 4. Maintainability
- Centralized chart logic in PlotlyChartManager
- Consistent error handling
- Easier to add new chart types
- Reduced code duplication

### 5. Performance
- Hardware-accelerated rendering
- Efficient data handling
- Smooth animations and interactions

## Testing

A comprehensive test page (`test_plotly_charts.html`) was created to verify:
- All chart types render correctly
- Interactive features work properly
- Error handling functions as expected
- Performance is acceptable

## Future Enhancements

The new architecture enables easy addition of:
- **Animation effects** for parameter changes
- **Data export** functionality (CSV, JSON)
- **Chart comparison** features
- **Custom themes** and color schemes
- **Advanced annotations** and markers

## Migration Checklist

- [x] Create PlotlyChartManager utility class
- [x] Migrate Johnson-Cook calculator
- [x] Migrate Swift's Law calculator  
- [x] Migrate Mooney-Rivlin calculator
- [x] Migrate Gibson-Ashby calculator
- [x] Create comprehensive test page
- [x] Update all HTML templates
- [x] Add Plotly.js CDN links
- [x] Test all interactive features
- [x] Verify responsive behavior
- [x] Document the migration process

## Conclusion

The migration to Plotly.js has successfully achieved the goal of unified chart styling while significantly improving the user experience with interactive features and professional appearance. The new architecture is more maintainable and extensible for future enhancements.