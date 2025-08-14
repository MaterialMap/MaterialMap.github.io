# PlotlyChartManager Usage Guide

## Overview

PlotlyChartManager is a utility class that provides unified chart creation and management for Material MAP calculators using Plotly.js.

## Quick Start

### 1. Include Dependencies

```html
<script src="https://cdn.plot.ly/plotly-2.32.0.min.js" charset="utf-8"></script>
<script src="src/js/utils/PlotlyChartManager.js"></script>
```

### 2. Initialize Manager

```javascript
let chartManager = new PlotlyChartManager();
```

### 3. Create Chart Container

```html
<div id="myChart" style="width: 100%; height: 600px;"></div>
```

### 4. Create Chart

```javascript
// Check if Plotly is loaded
if (!chartManager.isPlotlyLoaded()) {
    console.warn('Plotly.js not loaded');
    return;
}

// Create chart with error handling
chartManager.createSpecificChart('myChart', parameters, options)
    .catch(error => console.error('Chart error:', error));
```

## Available Chart Types

### Johnson-Cook Model

```javascript
const parameters = {
    A: 350,    // Yield strength (MPa)
    B: 275,    // Hardening modulus (MPa)
    n: 0.36,   // Hardening exponent
    C: 0.014   // Strain rate coefficient
};

const strainRates = [0.001, 1.0, 1000]; // s^-1

const options = {
    maxPlasticStrain: 0.25,
    yieldStrain: 0.002,
    referenceStrainRate: 1.0,
    stressUnit: 'MPa'
};

chartManager.createJohnsonCookChart('chartId', parameters, strainRates, options);
```

### Swift's Law

```javascript
const parameters = {
    K: 580,        // Strength coefficient (MPa)
    n: 0.23,       // Strain hardening exponent
    epsilon_0: 0.002  // Pre-strain
};

const options = {
    maxStrain: 0.5,
    stressUnit: 'MPa'
};

chartManager.createSwiftLawChart('chartId', parameters, options);
```

### Mooney-Rivlin Model

```javascript
const parameters = {
    C10: 0.5,  // First Mooney-Rivlin constant (MPa)
    C01: 0.1   // Second Mooney-Rivlin constant (MPa)
};

const options = {
    maxStretch: 3.0,
    stressUnit: 'MPa'
};

chartManager.createMooneyRivlinChart('chartId', parameters, options);
```

### Gibson-Ashby Foam Model

```javascript
const parameters = {
    E_foam: 15.0,           // Foam elastic modulus (MPa)
    sigma_pl: 0.25,         // Plateau stress (MPa)
    E_densification: 1.25   // Densification modulus (MPa)
};

const options = {
    maxStrain: 0.8,  // 80% strain
    stressUnit: 'MPa',
    title: 'EPS Foam - Density: 25 kg/m³'
};

chartManager.createGibsonAshbyChart('chartId', parameters, options);
```

## Utility Methods

### Check Plotly Availability

```javascript
if (chartManager.isPlotlyLoaded()) {
    // Plotly is available
}
```

### Load Plotly Dynamically

```javascript
await chartManager.loadPlotly();
```

### Export Chart

```javascript
chartManager.exportChart('chartId', 'my_chart', 'png');
```

### Resize Chart

```javascript
chartManager.resizeChart('chartId');
```

### Update Chart Data

```javascript
const newDatasets = [
    { x: [1, 2, 3], y: [1, 4, 9], name: 'New Data' }
];

chartManager.updateChart('chartId', newDatasets);
```

## Configuration Options

### Default Color Palette

The manager uses a predefined color palette:
- `#3498db` - Blue
- `#e74c3c` - Red  
- `#27ae60` - Green
- `#f39c12` - Orange
- `#9b59b6` - Purple
- `#1abc9c` - Turquoise
- `#e67e22` - Carrot
- `#34495e` - Dark blue-gray

### Default Layout Settings

- **Font**: Inter, system fonts
- **Background**: Light gray (`#f8f9fa`)
- **Grid**: Subtle gray lines
- **Legend**: Top-left with white background
- **Margins**: Optimized for readability

### Export Configuration

- **Format**: PNG, JPEG, SVG, PDF
- **Size**: 900x600 pixels
- **Scale**: 2x for high-DPI displays
- **Filename**: Customizable

## Error Handling

All chart creation methods return Promises and should be used with error handling:

```javascript
try {
    await chartManager.createJohnsonCookChart(containerId, parameters, strainRates, options);
    console.log('Chart created successfully');
} catch (error) {
    console.error('Failed to create chart:', error);
    // Handle error (show message to user, fallback, etc.)
}
```

## Best Practices

### 1. Always Check Plotly Availability

```javascript
function updateChart() {
    if (!chartManager.isPlotlyLoaded()) {
        console.warn('Plotly.js not loaded, skipping chart update');
        return;
    }
    // Create chart...
}
```

### 2. Use Proper Error Handling

```javascript
chartManager.createChart(...)
    .catch(error => {
        console.error('Chart error:', error);
        // Show user-friendly error message
    });
```

### 3. Validate Parameters

```javascript
if (isNaN(parameters.A) || parameters.A <= 0) {
    console.warn('Invalid parameter A');
    return;
}
```

### 4. Handle Responsive Behavior

```javascript
window.addEventListener('resize', () => {
    chartManager.resizeChart('chartId');
});
```

## Customization

### Custom Colors

```javascript
// Override default color palette
chartManager.colorPalette = ['#ff0000', '#00ff00', '#0000ff'];
```

### Custom Layout

```javascript
// Modify default layout
chartManager.defaultLayout.title = {
    text: 'My Custom Title',
    font: { size: 20 }
};
```

### Custom Configuration

```javascript
// Modify default config
chartManager.defaultConfig.displayModeBar = false;
```

## Troubleshooting

### Chart Not Displaying

1. Check if container exists: `document.getElementById('chartId')`
2. Verify Plotly.js is loaded: `chartManager.isPlotlyLoaded()`
3. Check browser console for errors
4. Ensure container has proper dimensions

### Performance Issues

1. Reduce number of data points for large datasets
2. Use `Plotly.restyle()` for updates instead of recreating
3. Consider data decimation for very large datasets

### Styling Issues

1. Check CSS conflicts with Plotly's default styles
2. Use `!important` sparingly
3. Verify container dimensions are set properly