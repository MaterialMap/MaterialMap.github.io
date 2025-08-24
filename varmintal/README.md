# VarmintAl

VarmintAl project containing material data and simulation files for aluminum analysis.

## Project Structure

This repository contains various material data files and simulation configurations for aluminum analysis:

### Material Data Files

- **mat18-all/**: Material 18 data files with failure models
- **mat18-all-no-failure/**: Material 18 data files without failure models
- **mat24-all/**: Material 24 data files with failure models
- **mat24-all-no-failure/**: Material 24 data files without failure models
- **mat98-all/**: Material 98 data files with failure models
- **mat98-all-no-failure/**: Material 98 data files without failure models

### Simulation Files

- **aluminum-6061-t6-mat98-run.k**: Aluminum 6061-T6 simulation using Material 98
- **pull3dspin-aluminum-6061-t6-run/**: 3D spin pull test simulations for Aluminum 6061-T6
  - `pull3dspin-run-aluminum-6061-t6-with-failure.k`: Simulation with failure model
  - `pull3dspin-run-aluminum-6061-t6-without-failure.k`: Simulation without failure model
- **mat_018-keyword-input-files/**: Material 018 keyword input files
  - `mat018.k`: Material 018 definition
  - `pull2df-RUN.k`: 2D pull test simulation

### Archive Files

The repository also contains compressed versions (.zip) of the material data directories for easy distribution.

## File Types

- `.k` files: LS-DYNA keyword input files
- `.TXT` files: Material property data files
- `.zip` files: Compressed archives of material data directories

## Usage

These files are designed for use with LS-DYNA finite element analysis software for aluminum material modeling and simulation.