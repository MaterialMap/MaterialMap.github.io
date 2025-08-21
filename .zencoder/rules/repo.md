---
description: Repository Information Overview
alwaysApply: true
---

# Material MAP Information

## Summary
Material MAP is a non-commercial, ad-free static website project aimed at assisting engineers in finding examples of material model parameter sets for LS-DYNA, sourced from articles published under Open Access. The project provides a searchable library of material models with direct links to original open-access sources and citation information.

## Structure
- **data/**: Contains TOML files with material model data from various sources
- **dist/**: Contains generated file list used by the application
- **lib/**: Contains JSON configuration files for material models
- **src/**: Contains modular JavaScript and CSS code
- **scripts/**: Contains utility scripts for file list generation and validation
- **test/**: Contains Playwright test files
- **.github/workflows/**: Contains GitHub Actions workflow for file list generation
- **Root files**: HTML, CSS, and JavaScript files for the static website

## Language & Runtime
**Language**: HTML, CSS, JavaScript
**Runtime**: Static website, browser-based
**Build System**: GitHub Actions workflow for file list generation
**Package Manager**: npm (for development tools)

## Dependencies
**Main Dependencies**:
- smol-toml (v1.3.1) - TOML parsing library
- jQuery (v3.7.0) - JavaScript library
- DataTables (v1.13.7) - Table enhancement plugin
- Google Fonts (Inter, Fira Code)

**Development Dependencies**:
- @playwright/test (v1.54.2) - Testing framework
- eslint (v8.56.0) - Code linting
- prettier (v3.1.0) - Code formatting
- playwright (v1.54.2) - Browser automation

## Build & Installation
```bash
# Install dependencies
npm install

# Run development server
npm run serve

# Generate file list
npm run generate-file-list

# Validate TOML data
npm run validate-data

# Format code
npm run format

# Lint code
npm run lint
```

## Features
**Material Database**:
- Searchable collection of LS-DYNA material models
- Material parameters from open-access publications
- Direct links to source articles

**Material Calculators**:
- Swift's Law Calculator for metal strain hardening
- Johnson-Cook Calculator for dynamic material behavior
- Mooney-Rivlin Calculator for hyperelastic materials
- Gibson-Ashby Calculator for cellular materials

## Data Structure
**TOML Format**:
- Each TOML file in the `data/` directory contains an array of material definitions using `[[material]]` syntax
- Required fields: `mat_data` (material model definition), `app` (applications), `url` (source link)
- Optional fields: `eos_data`, `mat_add_data`, `mat_thermal_data`, `ref` (citation), `units` (unit system), `comments` (additional notes)
- Material data is stored as multi-line strings that can be copied directly to LS-DYNA
- Units field specifies the unit system used (e.g., "mm ms MPa", "in sec psi")
- Comments field provides additional information about limitations, validation data, or usage notes

## PWA Support
The application includes a service worker (`service-worker.js`) that enables offline functionality by caching core assets and implementing different caching strategies for HTML pages and other resources.

## Testing
**Framework**: Playwright
**Test Location**: `test/` directory
**Configuration**: `playwright.config.js`
**Run Command**:
```bash
npm test
```

## Deployment
**Hosting**: GitHub Pages
**URL**: https://MaterialMap.github.io/
**Repository**: https://github.com/MaterialMap/MaterialMap.github.io

## License
Creative Commons Attribution-NonCommercial (CC BY-NC) License, allowing non-commercial copying and modification with attribution to the original project.