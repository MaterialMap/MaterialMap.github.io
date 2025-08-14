# Deshpande-Fleck Model Implementation

## Overview
Extended the Gibson-Ashby foam compression calculator to include the Deshpande-Fleck isotropic hardening model. This enhancement allows modeling of foam plateau regions with hardening behavior instead of constant stress. The page has been restructured to follow the common design pattern of other calculators in the project.

## Mathematical Model
The Deshpande-Fleck extension modifies the plateau region (Stage II) of the Gibson-Ashby model:

### Original Gibson-Ashby Model:
- **Stage I (Elastic)**: σ = E* × ε
- **Stage II (Plateau)**: σ = σ*pl (constant)
- **Stage III (Densification)**: σ = σ*pl × (1 + 5 × εrel²)

### Extended Deshpande-Fleck Model:
- **Stage I (Elastic)**: σ = E* × ε
- **Stage II (Hardening Plateau)**: σ(ε) = σ*pl × [1 + H × (ε - εy)]
- **Stage III (Densification)**: σ = σ*pl,hardened × (1 + 5 × εrel²)

Where:
- H = hardening coefficient (0 = pure plateau, >0 = hardening slope)
- εy = yield strain
- σ*pl,hardened = plateau stress at densification strain with hardening

## Implementation Details

### Files Modified:
1. **gibson_ashby_calculator.html**
   - **Complete restructure** to match common calculator design pattern
   - Added Units Panel with pressure and density unit conversion
   - Replaced sliders with numerical input fields for precise control
   - Structured layout: Disclaimer → Formulas → Units → Inputs → Results → Chart → Table
   - Added collapsible sections for chart and data table
   - Enhanced validation and error handling

2. **src/js/utils/PlotlyChartManager.js**
   - Enhanced `createGibsonAshbyChart()` function
   - Added hardening coefficient parameter
   - Updated curve name to reflect model type
   - Modified stage annotations to show hardening coefficient

### New Structure:
1. **Disclaimer Section**: Important notes about model limitations
2. **Formula Information**: Mathematical equations with clear explanations
3. **Units Panel**: Collapsible unit conversion settings
4. **Input Parameters**: Clean numerical inputs with validation
5. **Output Results**: Calculated properties display
6. **Interactive Chart**: Collapsible Plotly-based visualization
7. **Data Table**: Collapsible exportable data points

### Key Features:
- **Unified Design**: Consistent with other calculators (Johnson-Cook, Swift's Law, etc.)
- **Numerical Inputs**: Precise control via number fields instead of sliders
- **Unit Conversion**: Support for multiple pressure and density units
- **Real-time Calculation**: Debounced updates for smooth interaction
- **Collapsible Sections**: Space-efficient interface
- **Data Export**: CSV export with descriptive filename
- **Input Validation**: Automatic constraint enforcement

### Usage:
1. Select foam type (EPS, EPP, or PU)
2. Enter foam density (10-200 kg/m³) numerically
3. Set hardening coefficient H (0-10) with 0.01 precision:
   - H = 0: Pure plateau (original Gibson-Ashby)
   - H > 0: Hardening plateau (Deshpande-Fleck extension)
4. Optionally adjust units in the Units Panel
5. View results, interactive chart, and exportable data table

### References:
- Gibson, L.J., Ashby, M.F., "Cellular Solids: Structure and Properties", 2nd edition, Cambridge University Press, 1997
- Deshpande, V.S., Fleck, N.A., "Isotropic constitutive models for metallic foams", Journal of the Mechanics and Physics of Solids, 2000

## Testing
Created test file `test_deshpande_fleck.html` to verify mathematical implementation:
- Validates hardening formula at yield strain
- Tests hardening behavior beyond yield
- Confirms H=0 gives constant plateau

## Benefits:
1. **Enhanced Accuracy**: Better representation of real foam behavior
2. **Material Flexibility**: Accommodates foams with hardening characteristics
3. **Backward Compatibility**: H=0 maintains original Gibson-Ashby behavior
4. **Educational Value**: Demonstrates isotropic hardening concepts