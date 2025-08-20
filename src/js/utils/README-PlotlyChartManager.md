# PlotlyChartManager - Unified Chart Management

This document explains how to use the `PlotlyChartManager` class to create consistent charts across all calculators in the MaterialMap project.

## Overview

The `PlotlyChartManager` provides a unified approach to creating and styling charts using Plotly.js. It ensures that all charts across the application have consistent styling, behavior, and features.

## Key Features

- Consistent styling across all charts
- Simplified chart creation with sensible defaults
- Support for specialized chart types (stress-strain, Johnson-Cook, etc.)
- Generic plotting capability for custom chart types
- Responsive design and export functionality

## Basic Usage

### 1. Initialize the Chart Manager

```javascript
// Create a new instance of the chart manager
const chartManager = new PlotlyChartManager();
```

### 2. Create a Chart Using the Generic Method

```javascript
// Define your traces
const traces = [
    {
        x: [1, 2, 3, 4, 5],
        y: [10, 20, 15, 30, 25],
        type: 'scatter',
        mode: 'lines',
        name: 'Data Series 1'
    },
    {
        x: [1, 2, 3, 4, 5],
        y: [5, 15, 10, 20, 30],
        type: 'scatter',
        mode: 'lines',
        name: 'Data Series 2'
    }
];

// Define custom layout options
const layoutOptions = {
    title: 'My Custom Chart',
    xaxis: {
        title: 'X-Axis Label'
    },
    yaxis: {
        title: 'Y-Axis Label'
    }
};

// Create the chart
chartManager.createGenericPlot('chartContainerId', traces, layoutOptions);
```

### 3. Use Specialized Chart Methods

For specific chart types, use the dedicated methods:

```javascript
// Swift's Law chart
chartManager.createSwiftLawChart('swiftChartContainer', {
    K: 500,
    n: 0.25,
    epsilon0: 0.002
}, {
    maxStrain: 0.5,
    stressUnit: 'MPa'
});

// Johnson-Cook chart
chartManager.createJohnsonCookChart('jcChartContainer', {
    A: 200,
    B: 500,
    n: 0.25,
    C: 0.01
}, [0.001, 0.1, 10, 1000], {
    maxPlasticStrain: 0.3,
    yieldStrain: 0.002,
    referenceStrainRate: 1.0,
    stressUnit: 'MPa'
});

// Mooney-Rivlin chart
chartManager.createMooneyRivlinChart('mrChartContainer', {
    C10: 0.5,
    C01: 0.1
}, {
    maxStretch: 3.0,
    stressUnit: 'MPa'
});

// Gibson-Ashby chart
chartManager.createGibsonAshbyChart('gaChartContainer', {
    E_foam: 10,
    sigma_pl: 0.5,
    E_densification: 100,
    hardeningCoeff: 0.2
}, {
    maxStrain: 0.8,
    stressUnit: 'MPa'
});
```

## Advanced Usage

### Custom Styling

The chart manager provides default styling, but you can override any aspect:

```javascript
const customLayout = {
    title: 'Custom Styled Chart',
    plot_bgcolor: '#f0f0f0',
    paper_bgcolor: '#ffffff',
    font: {
        family: 'Arial, sans-serif',
        size: 14,
        color: '#333333'
    },
    xaxis: {
        title: 'X-Axis',
        gridcolor: '#cccccc'
    },
    yaxis: {
        title: 'Y-Axis',
        gridcolor: '#cccccc'
    }
};

chartManager.createGenericPlot('chartContainerId', traces, customLayout);
```

### Exporting Charts

```javascript
// Export chart as PNG
chartManager.exportChart('chartContainerId', 'my-chart', 'png');
```

### Responsive Design

The charts automatically resize when the window size changes. You can also manually trigger a resize:

```javascript
// Resize chart to fit container
chartManager.resizeChart('chartContainerId');
```

## Best Practices

1. **Always use the chart manager** instead of direct Plotly calls to ensure consistency
2. **Load Plotly.js before using the chart manager**
3. **Check if Plotly is loaded** before creating charts
4. **Use the generic method** for custom chart types not covered by specialized methods
5. **Maintain consistent units** across all charts in a calculator

## Troubleshooting

If charts are not displaying correctly:

1. Check if Plotly.js is loaded: `chartManager.isPlotlyLoaded()`
2. Ensure the container element exists in the DOM
3. Verify that your data is in the correct format
4. Check the browser console for any errors

## Example: Converting Custom Chart Code to Use the Chart Manager

Before:
```javascript
Plotly.newPlot('myChart', [
    {
        x: xData,
        y: yData,
        type: 'scatter',
        mode: 'lines',
        name: 'My Data',
        line: { color: 'blue', width: 2 }
    }
], {
    title: 'My Chart',
    xaxis: { title: 'X-Axis' },
    yaxis: { title: 'Y-Axis' }
}, { responsive: true });
```

After:
```javascript
chartManager.createGenericPlot('myChart', [
    {
        x: xData,
        y: yData,
        type: 'scatter',
        mode: 'lines',
        name: 'My Data',
        line: { color: 'blue', width: 2 }
    }
], {
    title: 'My Chart',
    xaxis: { title: 'X-Axis' },
    yaxis: { title: 'Y-Axis' }
});
```