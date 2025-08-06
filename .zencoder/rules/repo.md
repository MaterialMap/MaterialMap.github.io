---
description: Repository Information Overview
alwaysApply: true
---

# Material MAP Information

## Summary
Material MAP is a non-commercial, ad-free static website project aimed at assisting engineers in finding examples of material model parameter sets for LS-DYNA, sourced from articles published under Open Access. The project provides a searchable library of material models with direct links to original open-access sources and citation information.

## Structure
- **data/**: Contains YAML files with material model data from various sources
- **dist/**: Contains generated file list used by the application
- **lib/**: Contains JSON configuration files for material models
- **.github/workflows/**: Contains GitHub Actions workflow for file list generation
- **Root files**: HTML, CSS, and JavaScript files for the static website

## Language & Runtime
**Language**: HTML, CSS, JavaScript
**Runtime**: Static website, browser-based
**Build System**: GitHub Actions workflow for file list generation
**Package Manager**: None (uses CDN-hosted dependencies)

## Dependencies
**Main Dependencies**:
- js-yaml (v4.1.0) - YAML parsing library
- jQuery (v3.7.0) - JavaScript library
- DataTables (v1.13.7) - Table enhancement plugin
- Google Fonts (Inter, Fira Code)

## Build & Installation
```bash
# The site is built automatically via GitHub Actions
# To generate the file list manually:
mkdir -p dist
node -e "
const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, 'data');
const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.yaml'));
fs.writeFileSync('dist/file-list.json', JSON.stringify(files, null, 2));
"
```

## Data Structure
**YAML Format**:
- Each YAML file in the `data/` directory contains an array of material definitions
- Material entries include: ID, material type, material data, applications, references, and URLs
- Material data is stored as formatted text blocks that can be copied directly to LS-DYNA

## Deployment
**Hosting**: GitHub Pages
**URL**: https://yurynovozhilov.github.io/MaterialMap
**Repository**: https://github.com/yurynovozhilov/MaterialMap

## License
Creative Commons Attribution-NonCommercial (CC BY-NC) License, allowing non-commercial copying and modification with attribution to the original project.