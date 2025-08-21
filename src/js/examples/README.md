# Examples Directory

This directory contains example files and utilities that are not currently used in the main MaterialMap application but may be useful for reference or future development.

## Files

### UnifiedUnitsConverter.js
A comprehensive units conversion utility that provides conversion between different unit systems. This was developed as a more advanced alternative to the current units handling but is not currently integrated into the main application.

### UnitsConverterExample.js
Example usage and test cases for the UnifiedUnitsConverter. Shows how to implement unit conversions in calculator applications.

### TemplateLoader.js
A utility for loading and managing HTML templates dynamically. This was part of an experimental approach to template management that wasn't adopted in the final implementation.

### TemplateManager.js
A higher-level template management system that works with TemplateLoader. Provides template caching and rendering capabilities.

### CalculatorFactory.js
A factory pattern implementation for creating calculator instances. This was designed to provide a unified way to instantiate different calculator types but wasn't integrated into the current architecture.

## Usage

These files are provided for reference and can be used as starting points for:
- Advanced units conversion features
- Template-based UI generation
- Factory pattern implementations for calculators
- Learning about alternative architectural approaches

## Integration

If you want to integrate any of these utilities into the main application:

1. Move the file from `examples/` to the appropriate directory (`utils/`, `modules/`, or `components/`)
2. Update any import paths in the file
3. Add the necessary imports to files that will use the utility
4. Test thoroughly to ensure compatibility with the existing codebase

## Note

These files may not be up-to-date with the current codebase structure and may require modifications to work with the latest version of MaterialMap.