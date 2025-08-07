# Automatic Date Implementation

## Summary

Successfully implemented automatic date calculation for Material MAP project. The `add` field has been removed from all TOML files and is now automatically calculated from the file's last modification date in Git history.

## Changes Made

### 1. GitHub Actions Workflow (`/.github/workflows/generate-file-list.yaml`)
- Modified to generate file list with modification dates
- Uses `git log -1 --format=%cI` to get last commit date for each file
- Falls back to filesystem modification time if Git history is unavailable
- New format: `[{"filename": "file.toml", "lastModified": "2025-08-07T09:51:19+02:00"}]`

### 2. JavaScript Application (`/scripts.js`)
- Updated `loadMaterials()` function to handle both old and new file-list.json formats
- Added backward compatibility for existing deployments
- Modified material processing to add `fileLastModified` property to each material
- Updated table data generation to use `material.fileLastModified || material.add`

### 3. TOML Template (`/template.toml`)
- Removed `add` field from required fields section
- Updated documentation to reflect automatic date calculation
- Added note about date handling in comments

### 4. Documentation (`/TOML_STRUCTURE.md`)
- Removed `add` field from required fields
- Updated examples to not include `add` field
- Added `add` to deprecated fields list
- Updated field validation notes

### 5. Data Files (`/data/*.toml`)
- Removed `add` field from all 16 existing TOML files
- Files now rely on Git history for date information

## Technical Implementation

### Date Calculation Logic
1. **Primary**: Git commit date (`git log -1 --format=%cI -- "filepath"`)
2. **Fallback**: Filesystem modification time (`fs.statSync().mtime`)

### Backward Compatibility
The JavaScript code supports both formats:
- **Old format**: `["file1.toml", "file2.toml"]`
- **New format**: `[{"filename": "file1.toml", "lastModified": "2025-08-07T09:51:19+02:00"}]`

### Date Display
- Raw dates are formatted as DD.MM.YYYY for display
- ISO 8601 format is maintained internally for consistency

## Benefits

1. **Simplified TOML Structure**: No need to manually specify dates
2. **Automatic Updates**: Dates update automatically when files are modified
3. **Git Integration**: Leverages Git history for accurate tracking
4. **Backward Compatibility**: Existing deployments continue to work
5. **Reduced Errors**: Eliminates manual date entry mistakes

## Testing

- Verified with existing TOML files (16 files processed)
- Tested backward compatibility with old file-list.json format
- Confirmed date formatting and display functionality
- Validated Git history integration

## Deployment Notes

- GitHub Actions will automatically generate new file-list.json format on next push
- No manual intervention required for existing deployments
- Template updated for new material submissions