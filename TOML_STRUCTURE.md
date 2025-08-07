# TOML Data Structure for Material MAP

This document describes the structure of TOML files used in the Material MAP project. Each TOML file contains an array of material definitions with specific fields.

## File Structure

Each TOML file should contain an array of material objects using the `[[material]]` syntax:

```toml
[[material]]
# Material definition fields here

[[material]]
# Another material definition
```

## Material Object Fields

### Required Fields

#### `mat_data` (string, required)
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

#### `app` (array, required)
List of applications or material types where this material model is used.

**Example:**
```toml
app = [
  "Steel AISI 1020",
  "Structural steel",
  "Automotive components"
]
```

#### `url` (string, required)
URL link to the original source or reference material.

**Example:**
```toml
url = "https://example.com/material-data"
```

#### `add` (string, required)
Date when the material was added to the database. Should be in ISO 8601 format.

**Example:**
```toml
add = "2024-11-29T00:00:00.000Z"
```

### Optional Fields

#### `eos_data` (string, optional)
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

**Note:** EOS ID and name are automatically extracted from this field by the application.

#### `mat_add_data` (string, optional)
Contains additional material model data (e.g., MAT_ADD definitions) as a multi-line string.

**Example:**
```toml
mat_add_data = """
*MAT_ADD_EROSION_TITLE
Erosion criteria
$--------1---------2---------3---------4---------5---------6---------7---------8
$#   addid    mxpres    mnpres      sigp      sigvm    mxeps1    mxeps2    mxeps3
       1       0.0      -1.0       0.0       0.0       0.3       0.0       0.0
"""
```

#### `mat_thermal_data` (string, optional)
Contains thermal material model data as a multi-line string.

**Example:**
```toml
mat_thermal_data = """
*MAT_THERMAL_ISOTROPIC_TITLE
Steel thermal properties
$--------1---------2---------3---------4---------5---------6---------7---------8
$#    tmid        ro        tg      tgrl        hc
       1    7.85e-6      20.0       0.0     460.0
"""
```

#### `mat_add` (string, optional)
Display name for additional material model. Used in the UI to show what type of MAT_ADD is included.

**Example:**
```toml
mat_add = "MAT_ADD_EROSION"
```

#### `mat_thermal` (string, optional)
Display name for thermal material model. Used in the UI to show what type of thermal model is included.

**Example:**
```toml
mat_thermal = "MAT_THERMAL_ISOTROPIC"
```

#### `ref` (string, optional)
Full citation or reference to the original source material.

**Example:**
```toml
ref = "Smith, J. et al. (2024). Material Properties of Steel. Journal of Materials, 15(3), 123-145."
```

## Complete Example

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
mat_add_data = """
*MAT_ADD_EROSION_TITLE
Erosion criteria
$--------1---------2---------3---------4---------5---------6---------7---------8
$#   addid    mxpres    mnpres      sigp      sigvm    mxeps1    mxeps2    mxeps3
         1       0.0      -1.0       0.0       0.0       0.3       0.0       0.0
"""
mat_add = "MAT_ADD_EROSION"
app = [
  "Steel AISI 1020",
  "Structural applications",
  "Automotive components"
]
ref = "Smith, J. et al. (2024). Material Properties of Steel. Journal of Materials, 15(3), 123-145."
add = "2024-11-29T00:00:00.000Z"
url = "https://example.com/steel-properties"

[[material]]
mat_data = """
*MAT_ELASTIC_TITLE
Aluminum 6061-T6
$ Johnson, A. (2023). Aluminum Properties Database
$--------1---------2---------3---------4---------5---------6---------7---------8
$#     mid        ro         e        pr        da        db  not used        
         2    2.70e-6     69000      0.33       0.0       0.0         0
"""
app = [
  "Aluminum 6061-T6",
  "Aerospace applications"
]
ref = "Johnson, A. (2023). Aluminum Properties Database. Materials Science Review, 8(2), 67-89."
add = "2024-11-28T00:00:00.000Z"
url = "https://example.com/aluminum-data"
```

## Data Processing Notes

1. **Automatic ID Extraction**: Material IDs are automatically extracted from the first line of `mat_data`, `eos_data`, `mat_add_data`, and `mat_thermal_data` fields.

2. **Material Name Extraction**: Material names are extracted from the first line of the respective data fields, with `_TITLE` suffix removed if present.

3. **Field Validation**: The application expects at minimum `mat_data`, `app`, `url`, and `add` fields to be present.

4. **Date Format**: Dates should be in ISO 8601 format for consistency.

5. **URL Validation**: URLs should be valid and accessible for reference purposes.

6. **Multi-line Strings**: TOML uses triple quotes (`"""`) for multi-line strings, which is perfect for LS-DYNA card definitions.

## TOML vs YAML Differences

- **Array of Tables**: TOML uses `[[material]]` syntax instead of YAML's `- material:` syntax
- **Multi-line Strings**: TOML uses `"""` instead of YAML's `|` or `>`
- **String Quoting**: TOML requires quotes around strings, YAML is more flexible
- **Arrays**: TOML uses `["item1", "item2"]` syntax instead of YAML's `- item` syntax

## Deprecated Fields

The following fields were previously used but are no longer supported:

- `mat_id` - Material ID (now extracted automatically from `mat_data`)
- `mat` - Material name (now extracted automatically from `mat_data`)

These fields should not be included in new TOML files and have been removed from existing files.