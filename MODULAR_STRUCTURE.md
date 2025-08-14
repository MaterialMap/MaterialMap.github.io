# Modular Code Structure for Material MAP

This document outlines the new modular code structure for the Material MAP project, which separates JavaScript from HTML, creates templates and classes for unifying the design of calculators and curve builders.

## Overview

The new structure follows these principles:

1. **Separation of Concerns**: HTML, CSS, and JavaScript are separated into different files
2. **Modularity**: Code is organized into reusable modules and components
3. **Inheritance**: Common functionality is implemented in base classes
4. **Templates**: HTML templates are used for consistent UI across calculators
5. **Factory Pattern**: A factory class creates calculator instances

## Directory Structure

```
/src
  /js
    /components
      BaseCalculator.js         # Abstract base class for all calculators
      CalculatorFactory.js      # Factory for creating calculator instances
      GibsonAshbyCalculator.js  # Specific calculator implementation
      ...
    /utils
      PlotlyChartManager.js     # Chart creation and management
      TemplateLoader.js         # HTML template loading utility
      TemplateManager.js        # Template management and rendering
      UnitsHandler.js           # Units conversion and management
      ...
  /templates
    calculator-base.html        # Base template for all calculators
    gibson-ashby-calculator.html # Specific calculator template
    ...
  /css
    /components
      units.css                 # CSS for units panel
      ...
    /base
      ...
```

## How It Works

### 1. Base Calculator Class

The `BaseCalculator` class provides common functionality for all calculators:

- Initialization and setup
- Event handling
- Input validation
- Unit conversion
- Chart and table management

```javascript
class BaseCalculator {
    constructor(config = {}) {
        // Initialize properties
    }
    
    async initialize() {
        // Set up calculator
    }
    
    // Common methods for all calculators
    scheduleCalculation() { ... }
    toggleCollapse(header) { ... }
    exportToCSV(filename) { ... }
    // ...
}
```

### 2. Specific Calculator Implementations

Each calculator extends the base class and implements specific functionality:

```javascript
class GibsonAshbyCalculator extends BaseCalculator {
    constructor(config = {}) {
        super(config);
        // Initialize specific properties
    }
    
    // Implement required methods
    calculate() { ... }
    updateChart() { ... }
    generateDataTable() { ... }
    // ...
}
```

### 3. HTML Templates

Templates are used to define the HTML structure of calculators:

```html
<!-- Base template with placeholders -->
<div class="container" id="calculator-container">
    <h1>${title}</h1>
    
    <!-- Disclaimer -->
    <div class="disclaimer">
        ${disclaimerText}
    </div>
    
    <!-- Formula Information -->
    <div class="formula-info">
        ${formula}
    </div>
    
    <!-- Units Panel -->
    <div class="units-panel">
        ${unitSelectors}
    </div>
    
    <!-- Input Parameters -->
    <div class="inputs">
        ${inputs}
    </div>
    
    <!-- Output Results -->
    <div class="results">
        ${results}
    </div>
</div>
```

### 4. Calculator Factory

The `CalculatorFactory` creates calculator instances based on type:

```javascript
// Create a calculator
const calculator = await CalculatorFactory.createCalculator('gibson-ashby', {
    container: '#calculator-root'
});
```

## How to Use

### Creating a New Calculator

1. Create a new calculator class that extends `BaseCalculator`
2. Create a template for the calculator
3. Register the calculator in `CalculatorFactory`
4. Create an HTML file that uses the factory to create the calculator

### Example HTML File

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculator</title>
    <link rel="stylesheet" href="unified-styles.css">
    <link rel="stylesheet" href="src/css/components/units.css">
</head>
<body>
    <!-- Navigation Menu -->
    <nav class="nav-menu">
        <!-- Navigation links -->
    </nav>
    
    <!-- Calculator content will be loaded here -->
    <div id="calculator-root"></div>

    <!-- Load dependencies -->
    <script src="https://cdn.plot.ly/plotly-2.32.0.min.js"></script>
    
    <!-- Load utility classes -->
    <script src="src/js/utils/PlotlyChartManager.js"></script>
    <script src="src/js/utils/UnitsHandler.js"></script>
    <script src="src/js/utils/TemplateLoader.js"></script>
    
    <!-- Load calculator components -->
    <script src="src/js/components/BaseCalculator.js"></script>
    <script src="src/js/components/YourCalculator.js"></script>
    <script src="src/js/components/CalculatorFactory.js"></script>
    
    <!-- Initialize calculator -->
    <script>
        document.addEventListener('DOMContentLoaded', async function() {
            try {
                // Create calculator using factory
                window.calculator = await CalculatorFactory.createCalculator('your-calculator-type', {
                    container: '#calculator-root'
                });
            } catch (error) {
                console.error('Error initializing calculator:', error);
            }
        });
    </script>
</body>
</html>
```

## Benefits

1. **Maintainability**: Easier to maintain and update code
2. **Reusability**: Common functionality is implemented once and reused
3. **Consistency**: All calculators have a consistent look and feel
4. **Extensibility**: Easy to add new calculators or features
5. **Testing**: Easier to test individual components

## Migration Plan

1. Create the new structure and base classes
2. Implement one calculator (Gibson-Ashby) using the new structure
3. Test the new implementation
4. Gradually migrate other calculators to the new structure
5. Update the main HTML files to use the new structure