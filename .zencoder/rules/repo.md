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
- **admin/**: Contains Netlify CMS configuration for content management
- **.github/workflows/**: Contains GitHub Actions workflow for file list generation
- **Root files**: HTML, CSS, and JavaScript files for the static website

## Language & Runtime
**Language**: HTML, CSS, JavaScript
**Runtime**: Static website, browser-based
**Build System**: GitHub Actions workflow for file list generation
**Package Manager**: npm (for development tools)

## Dependencies
**Main Dependencies**:
- toml (v3.0.0) - TOML parsing library
- jQuery (v3.7.0) - JavaScript library
- DataTables (v1.13.7) - Table enhancement plugin
- Google Fonts (Inter, Fira Code)

**Development Dependencies**:
- @playwright/test (v1.54.2) - Testing framework
- decap-server (v3.0.0) - CMS server for local development
- playwright (v1.54.2) - Browser automation

## Build & Installation
```bash
# Install dependencies
npm install

# Run development server with CMS
npm run dev

# Generate file list manually
mkdir -p dist
node -e "
const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, 'data');
const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.toml'));
fs.writeFileSync('dist/file-list.json', JSON.stringify(files, null, 2));
"
```

## Data Structure
**TOML Format**:
- Each TOML file in the `data/` directory contains an array of material definitions using `[[material]]` syntax
- Required fields: `mat_data` (material model definition), `app` (applications), `url` (source link)
- Optional fields: `eos_data`, `mat_add_data`, `mat_thermal_data`, `ref` (citation)
- Material data is stored as multi-line strings that can be copied directly to LS-DYNA

## PWA Support
The application includes a service worker (`service-worker.js`) that enables offline functionality by caching core assets and implementing different caching strategies for HTML pages and other resources.

## Testing
**Framework**: Playwright
**Run Command**:
```bash
npm test
```

## Deployment
**Hosting**: GitHub Pages
**URL**: https://yurynovozhilov.github.io/MaterialMap
**Repository**: https://github.com/yurynovozhilov/MaterialMap

## License
Creative Commons Attribution-NonCommercial (CC BY-NC) License, allowing non-commercial copying and modification with attribution to the original project.