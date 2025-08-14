# Input Validation Fix for Gibson-Ashby Calculator

## Problem
The input fields for Foam Density and Hardening Coefficient were being automatically overwritten with default values during real-time calculations, preventing users from typing freely.

## Root Cause
The `calculate()` function was automatically updating input field values with validated/constrained values on every input event, causing the fields to reset while users were typing.

## Solution

### 1. Removed Automatic Field Updates
**Before:**
```javascript
// Update input fields with validated values
document.getElementById('density').value = density.toFixed(1);
document.getElementById('hardeningCoeff').value = hardeningCoeff.toFixed(2);
```

**After:**
```javascript
// Validate inputs (but don't modify the input fields)
if (isNaN(density) || density < 10) density = 10;
if (density > 200) density = 200;
// ... validation logic without field updates
```

### 2. Added Blur-Based Validation
- Changed validation trigger from `oninput` to `onblur`
- Users can now type freely without interruption
- Validation occurs only when field loses focus

### 3. Enhanced User Experience
- **Visual Feedback**: Invalid inputs show red border for 1 second
- **Delayed Correction**: Auto-correction happens after visual feedback
- **Non-Intrusive**: Calculations use validated values internally without affecting input fields

### 4. Added CSS Styling
```css
.input-error {
    border-color: #e74c3c !important;
    box-shadow: 0 0 5px rgba(231, 76, 60, 0.3) !important;
}
```

## New Behavior

### Input Flow:
1. **User types** → Field updates normally
2. **User continues typing** → No interruption
3. **User clicks away (blur)** → Validation triggers
4. **If invalid** → Red border appears for 1 second
5. **After 1 second** → Value auto-corrects and calculations update

### Validation Rules:
- **Density**: 10-200 kg/m³
- **Hardening Coefficient**: 0-10
- **Invalid/NaN values**: Auto-corrected to nearest valid value

## Files Modified:
- `gibson_ashby_calculator.html`
  - Removed field updates from `calculate()`
  - Added `validateDensity()` and `validateHardeningCoeff()` functions
  - Added CSS styles for error indication
  - Changed input event handlers to use `onblur`

## Result:
✅ Users can now type freely in input fields without interruption
✅ Validation provides clear visual feedback
✅ Auto-correction is non-intrusive and delayed
✅ Calculations remain accurate with validated values