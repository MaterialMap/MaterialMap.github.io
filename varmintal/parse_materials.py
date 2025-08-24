#!/usr/bin/env python3
"""
Parse materials from various LS-DYNA material files (MAT_018, MAT_024, MAT_098)
"""

import re
import sys
import os
from pathlib import Path

def parse_material_value(line):
    """Extract numeric value from material property line"""
    # Find pattern like "2.6850E-09 tonne/mm^3" or "2.6849D-09"
    match = re.search(r'(\d+\.\d+[ED][+-]?\d+|\d+\.\d+)', line)
    if match:
        value = match.group(1)
        # Convert D notation to E notation
        return value.replace('D', 'E')
    return ""

def parse_mat_018_materials(content):
    """Parse MAT_018 (Power Law Plasticity) materials"""
    materials = []
    sections = content.split('*MAT_POWER_LAW_PLASTICITY')
    
    for section in sections[1:]:  # Skip first empty section
        if not section.strip():
            continue
            
        lines = section.split('\n')
        material = {'type': 'MAT_018', 'description': 'Power Law Plasticity'}
        
        # Extract material name
        for line in lines:
            if line.startswith('$  ') and len(line.strip()) > 3:
                name_line = line.strip()[3:].strip()
                if name_line and not any(x in name_line for x in ['Power Law', 'FC Units', '---']):
                    material['name'] = name_line
                    break
        
        # Extract properties
        for line in lines:
            if 'Material density' in line:
                material['density'] = parse_material_value(line)
            elif 'Young\'s Modulus' in line:
                material['young_modulus'] = parse_material_value(line)
            elif 'Shear Modulus' in line:
                material['shear_modulus'] = parse_material_value(line)
            elif 'Bulk Modulus' in line:
                material['bulk_modulus'] = parse_material_value(line)
            elif 'Poisson\'s ratio' in line:
                material['poisson_ratio'] = parse_material_value(line)
            elif 'Yield stress at offset' in line:
                material['yield_stress'] = parse_material_value(line)
            elif 'Engineering ultimate stress' in line:
                material['ultimate_stress'] = parse_material_value(line)
            elif 'Elongation at failure' in line:
                material['elongation'] = parse_material_value(line)
            elif 'CTE.' in line:
                material['cte'] = parse_material_value(line)
        
        if material.get('name'):
            materials.append(material)
    
    return materials

def parse_mat_024_materials(content):
    """Parse MAT_024 (Piecewise Linear Plasticity) materials"""
    materials = []
    sections = content.split('*MAT_PIECEWISE_LINEAR_PLASTICITY')
    
    for section in sections[1:]:  # Skip first empty section
        if not section.strip():
            continue
            
        lines = section.split('\n')
        material = {'type': 'MAT_024', 'description': 'Piecewise Linear Plasticity'}
        
        # Extract material name
        for line in lines:
            if line.startswith('$  ') and len(line.strip()) > 3:
                name_line = line.strip()[3:].strip()
                if name_line and not any(x in name_line for x in ['Piecewise', 'tonne/mm^3', '---']):
                    material['name'] = name_line
                    break
        
        # Extract properties from data line (format: mid, ro, e, pr, sigy, etan, fail, tdel)
        for line in lines:
            if line.strip().startswith('xx,') or re.match(r'\s*\d+,', line.strip()):
                # Parse material data line
                values = [val.strip().rstrip(',') for val in line.strip().split(',')]
                if len(values) >= 5:
                    try:
                        if len(values) > 1 and values[1]:
                            material['density'] = values[1].replace('D', 'E')
                        if len(values) > 2 and values[2]:
                            material['young_modulus'] = values[2].replace('D', 'E')
                        if len(values) > 3 and values[3]:
                            material['poisson_ratio'] = values[3]
                        if len(values) > 4 and values[4]:
                            material['yield_stress'] = values[4].replace('D', 'E')
                    except (ValueError, IndexError):
                        continue
        
        if material.get('name'):
            materials.append(material)
    
    return materials

def parse_mat_098_materials(content):
    """Parse MAT_098 (Simplified Johnson Cook) materials"""
    materials = []
    sections = content.split('*MAT_SIMPLIFIED_JOHNSON_COOK')
    
    for section in sections[1:]:  # Skip first empty section
        if not section.strip():
            continue
            
        lines = section.split('\n')
        material = {'type': 'MAT_098', 'description': 'Simplified Johnson Cook'}
        
        # Extract material name
        for line in lines:
            if line.startswith('$  ') and len(line.strip()) > 3:
                name_line = line.strip()[3:].strip()
                if name_line and not any(x in name_line for x in ['Simplified', 'FC Units', '---']):
                    material['name'] = name_line
                    break
        
        # Extract properties
        for line in lines:
            if 'Material density' in line:
                material['density'] = parse_material_value(line)
            elif 'Young\'s Modulus' in line:
                material['young_modulus'] = parse_material_value(line)
            elif 'Shear Modulus' in line:
                material['shear_modulus'] = parse_material_value(line)
            elif 'Bulk Modulus' in line:
                material['bulk_modulus'] = parse_material_value(line)
            elif 'Poisson\'s ratio' in line:
                material['poisson_ratio'] = parse_material_value(line)
            elif 'Yield stress at offset' in line:
                material['yield_stress'] = parse_material_value(line)
            elif 'Engineering ultimate stress' in line:
                material['ultimate_stress'] = parse_material_value(line)
            elif 'Elongation at failure' in line:
                material['elongation'] = parse_material_value(line)
            elif 'CTE.' in line:
                material['cte'] = parse_material_value(line)
            elif 'Yield offset' in line:
                material['yield_offset'] = parse_material_value(line)
        
        if material.get('name'):
            materials.append(material)
    
    return materials

def parse_materials_from_file(file_path):
    """Parse materials from a single file based on its content"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return []
    
    materials = []
    
    # Determine material type and parse accordingly
    if '*MAT_POWER_LAW_PLASTICITY' in content:
        materials.extend(parse_mat_018_materials(content))
    elif '*MAT_PIECEWISE_LINEAR_PLASTICITY' in content:
        materials.extend(parse_mat_024_materials(content))
    elif '*MAT_SIMPLIFIED_JOHNSON_COOK' in content:
        materials.extend(parse_mat_098_materials(content))
    
    # Add source file info
    for material in materials:
        material['source_file'] = file_path.name
        material['source_dir'] = file_path.parent.name
    
    return materials

def parse_all_materials(base_path):
    """Parse all material files in the directory structure"""
    all_materials = []
    base_path = Path(base_path)
    
    # Find all .TXT files
    txt_files = list(base_path.glob('**/*.TXT'))
    txt_files.extend(list(base_path.glob('**/*.txt')))
    
    print(f"Found {len(txt_files)} material files to process...")
    
    for file_path in txt_files:
        print(f"Processing: {file_path.name}")
        materials = parse_materials_from_file(file_path)
        all_materials.extend(materials)
        print(f"  Found {len(materials)} materials")
    
    return all_materials

def print_summary_table(materials):
    """Print materials summary table"""
    if not materials:
        print("No materials found.")
        return
    
    print(f"\n{'='*100}")
    print("MATERIAL PROPERTIES SUMMARY")
    print(f"{'='*100}")
    print(f"Total Materials Found: {len(materials)}")
    
    # Group by type
    by_type = {}
    for material in materials:
        mat_type = material.get('type', 'Unknown')
        if mat_type not in by_type:
            by_type[mat_type] = []
        by_type[mat_type].append(material)
    
    for mat_type, mats in by_type.items():
        print(f"\n{mat_type} ({mats[0].get('description', 'Unknown')}): {len(mats)} materials")
        
        # Show first 3 examples
        for i, mat in enumerate(mats[:3]):
            print(f"  {i+1}. {mat.get('name', 'Unknown')[:60]}")
            print(f"     Density: {mat.get('density', 'N/A')}, Young's: {mat.get('young_modulus', 'N/A')}")
            print(f"     Source: {mat.get('source_file', 'N/A')}")
        
        if len(mats) > 3:
            print(f"  ... and {len(mats) - 3} more materials")

if __name__ == "__main__":
    # Parse from current directory
    base_path = Path(__file__).parent
    
    print("Parsing all material files...")
    all_materials = parse_all_materials(base_path)
    
    print_summary_table(all_materials)