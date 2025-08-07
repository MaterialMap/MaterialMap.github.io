# Material MAP

This repository supports the **Material MAP** website, a non-commercial, ad-free project aimed at assisting engineers in finding examples of material model parameter sets for LS-DYNA, sourced from articles published under Open Access. 

The primary goal of the website is to provide engineers with a library of material models, linking directly to original open-access sources along with citation information for each reference. The project enables users to search and explore a variety of material models conveniently.

## Website Link

Visit the website: [Material MAP](https://yurynovozhilov.github.io/MaterialMap)

## About the Project

Material MAP is a static website, built to offer a reference library for material models used in LS-DYNA simulations. All site data is stored in multiple `toml` files in the `data` directory, allowing easy updates and additions. Users are welcome to contribute by creating pull requests with new references and material models or correcting existing data.

### Key Features

- **Non-commercial**: The site is entirely ad-free and provides its content for informational purposes only.
- **Open-access links**: All data references point to open-access sources, ensuring users can access original articles freely.
- **Citation Information**: Each reference includes proper citation details to give credit to the original authors.
- **User Contribution**: Contributions are encouraged, allowing users to add new material models or improve data accuracy.
- **Automatic Date Tracking**: File modification dates are automatically tracked using Git history.

## Contributing to MaterialMap

### How to Submit New Materials

#### Direct Pull Request
1. Fork the repository
2. Create a new TOML file in `/data/` folder
3. Follow the existing format (see TOML Structure below)
4. Update `/dist/file-list.json`
5. Submit a pull request

#### Requirements
- Source must be published under Open Access license
- LS-DYNA material parameters must be validated
- Reference URL must be accessible without paywall
- All required fields must be completed

#### Review Process
1. Maintainers review the pull request
2. If approved, the material is merged into the database
3. You'll be notified of the final decision

Thank you for contributing to MaterialMap! 🎉

## TOML Data Structure

This section describes the structure of TOML files used in the Material MAP project. Each TOML file contains an array of material definitions with specific fields.

### File Structure

Each TOML file should contain an array of material objects using the `[[material]]` syntax:

```toml
[[material]]
# Material definition fields here

[[material]]
# Another material definition
```

### Material Object Fields

#### Required Fields

##### `mat_data` (string, required)
Contains the LS-DYNA material model definition as a multi-line string. This field should include:
- Material model keyword (e.g., `*MAT_ELASTIC_TITLE`, `*MAT_PLASTIC_KINEMATIC_TITLE`)
- Material name/description
- Parameter definitions with proper LS-DYNA formatting
- Comments with source attribution

**Example:**
```toml
mat_data = """
*MAT_ELASTIC_TITLE
Steel AISI 1020
$ Source: Material handbook
$--------1---------2---------3---------4---------5---------6---------7---------8
$#     mid        ro         e        pr        da        db  not used        
       1    7.85e-6    200000      0.29       0.0       0.0         0
"""
```

**Note:** Material ID and name are automatically extracted from this field by the application.

##### `app` (array, required)
List of applications or material types where this material model is used.

**Example:**
```toml
app = [
  "Steel AISI 1020",
  "Structural steel",
  "Automotive components"
]
```

##### `url` (string, required)
URL link to the original source or reference material.

**Example:**
```toml
url = "https://example.com/material-data"
```

#### Optional Fields

##### `eos_data` (string, optional)
Contains the LS-DYNA equation of state definition as a multi-line string. Used when the material requires an EOS model.

**Example:**
```toml
eos_data = """
*EOS_GRUNEISEN_TITLE
Steel EOS
$--------1---------2---------3---------4---------5---------6---------7---------8
$#    eosid        c         s      gamma        a         e0        v0
       1      4569      1.49       2.17       0.0       0.0       1.0
"""
```

##### `mat_add_data` (string, optional)
Contains additional material model data (e.g., MAT_ADD definitions) as a multi-line string.

##### `mat_thermal_data` (string, optional)
Contains thermal material model data as a multi-line string.

##### `ref` (string, optional)
Full citation or reference to the original source material.

**Example:**
```toml
ref = "Smith, J. et al. (2024). Material Properties of Steel. Journal of Materials, 15(3), 123-145."
```

### Complete Example

```toml
[[material]]
mat_data = """
*MAT_PLASTIC_KINEMATIC_TITLE
Steel AISI 1020
$ Smith, J. et al. (2024). Material Properties of Steel
$--------1---------2---------3---------4---------5---------6---------7---------8
$#     mid        ro         e        pr      sigy      etan      beta      src
         1    7.85e-6    200000      0.29     250.0     1000.0       0.0       0.0
$#    srp      fs        vp
       0.0       0.0       0.0
"""
eos_data = """
*EOS_GRUNEISEN_TITLE
Steel EOS
$--------1---------2---------3---------4---------5---------6---------7---------8
$#    eosid        c         s      gamma        a         e0        v0
         1      4569      1.49       2.17       0.0       0.0       1.0
"""
app = [
  "Steel AISI 1020",
  "Structural applications",
  "Automotive components"
]
ref = "Smith, J. et al. (2024). Material Properties of Steel. Journal of Materials, 15(3), 123-145."
url = "https://example.com/steel-properties"
```

### Data Processing Notes

1. **Automatic ID Extraction**: Material IDs are automatically extracted from the first line of `mat_data`, `eos_data`, `mat_add_data`, and `mat_thermal_data` fields.

2. **Material Name Extraction**: Material names are extracted from the first line of the respective data fields, with `_TITLE` suffix removed if present.

3. **Field Validation**: The application expects at minimum `mat_data`, `app`, and `url` fields to be present.

4. **Date Handling**: The "Added" date is automatically calculated from the file's last modification date in Git history.

5. **URL Validation**: URLs should be valid and accessible for reference purposes.

6. **Multi-line Strings**: TOML uses triple quotes (`"""`) for multi-line strings, which is perfect for LS-DYNA card definitions.

## Technical Implementation

### Automatic Date Tracking
The project uses automatic date calculation for all materials. The `add` field has been removed from all TOML files and is now automatically calculated from the file's last modification date in Git history.

#### Date Calculation Logic
1. **Primary**: Git commit date (`git log -1 --format=%cI -- "filepath"`)
2. **Fallback**: Filesystem modification time (`fs.statSync().mtime`)

#### Benefits
- **Simplified TOML Structure**: No need to manually specify dates
- **Automatic Updates**: Dates update automatically when files are modified
- **Git Integration**: Leverages Git history for accurate tracking
- **Reduced Errors**: Eliminates manual date entry mistakes

### Project Structure
- **data/**: Contains TOML files with material model data from various sources
- **dist/**: Contains generated file list used by the application
- **lib/**: Contains JSON configuration files for material models
- **.github/workflows/**: Contains GitHub Actions workflow for file list generation
- **Root files**: HTML, CSS, and JavaScript files for the static website

### Dependencies
- js-yaml (v4.1.0) - YAML parsing library
- jQuery (v3.7.0) - JavaScript library
- DataTables (v1.13.7) - Table enhancement plugin
- Google Fonts (Inter, Fira Code)

### Build & Installation
```bash
# The site is built automatically via GitHub Actions
# To generate the file list manually:
mkdir -p dist
node -e "
const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, 'data');
const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.toml'));
fs.writeFileSync('dist/file-list.json', JSON.stringify(files, null, 2));
"
```

### License

This project is licensed under the [Creative Commons Attribution-NonCommercial (CC BY-NC) License](https://creativecommons.org/licenses/by-nc/4.0/). This license allows non-commercial copying and modification of the content with attribution to the original project.

---

> **Disclaimer**: All data provided on the Material MAP website is to be used at the user's own risk.
