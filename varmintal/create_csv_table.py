#!/usr/bin/env python3
"""
Create CSV table from parsed materials
"""

import csv
from pathlib import Path
from parse_materials import parse_materials

def create_csv_table(materials, output_path):
    """Create CSV table with material properties"""
    fieldnames = [
        'Material Name',
        'Density (tonne/mm³)',
        'Young\'s Modulus (MPa)', 
        'Shear Modulus (MPa)',
        'Bulk Modulus (MPa)',
        'Poisson\'s Ratio',
        'Yield Stress (MPa)',
        'Ultimate Stress (MPa)',
        'Elongation (%)',
        'CTE (1/C)',
        'Yield Offset (%)'
    ]
    
    with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for material in materials:
            writer.writerow({
                'Material Name': material.get('name', ''),
                'Density (tonne/mm³)': material.get('density', ''),
                'Young\'s Modulus (MPa)': material.get('young_modulus', ''),
                'Shear Modulus (MPa)': material.get('shear_modulus', ''),
                'Bulk Modulus (MPa)': material.get('bulk_modulus', ''),
                'Poisson\'s Ratio': material.get('poisson_ratio', ''),
                'Yield Stress (MPa)': material.get('yield_stress', ''),
                'Ultimate Stress (MPa)': material.get('ultimate_stress', ''),
                'Elongation (%)': material.get('elongation', ''),
                'CTE (1/C)': material.get('cte', ''),
                'Yield Offset (%)': material.get('yield_offset', '')
            })

def create_markdown_table(materials, output_path):
    """Create Markdown table with first 20 materials as example"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# Material Properties Table\n\n")
        f.write(f"**Total Materials Found: {len(materials)}**\n\n")
        f.write("## Sample of First 20 Materials\n\n")
        
        # Table header
        f.write("| Material Name | Density | Young's E | Shear E | Bulk E | Poisson | Yield | Ultimate | Elongation | CTE | Y.Offset |\n")
        f.write("|---------------|---------|-----------|---------|---------|---------|-------|----------|------------|-----|----------|\n")
        
        # First 20 materials
        for i, material in enumerate(materials[:20]):
            name = material.get('name', 'Unknown')[:30] + '...' if len(material.get('name', '')) > 30 else material.get('name', 'Unknown')
            density = material.get('density', 'N/A')
            young = material.get('young_modulus', 'N/A')
            shear = material.get('shear_modulus', 'N/A')
            bulk = material.get('bulk_modulus', 'N/A')
            poisson = material.get('poisson_ratio', 'N/A')
            yield_stress = material.get('yield_stress', 'N/A')
            ultimate = material.get('ultimate_stress', 'N/A')
            elongation = material.get('elongation', 'N/A')
            cte = material.get('cte', 'N/A')
            offset = material.get('yield_offset', 'N/A')
            
            f.write(f"| {name} | {density} | {young} | {shear} | {bulk} | {poisson} | {yield_stress} | {ultimate} | {elongation} | {cte} | {offset} |\n")
        
        f.write(f"\n*... and {len(materials) - 20} more materials (see CSV file for complete list)*\n")
        
        # Summary statistics
        f.write("\n## Summary by Material Type\n\n")
        
        # Count materials by type
        aluminum_count = sum(1 for m in materials if 'ALUMINUM' in m.get('name', '').upper())
        steel_count = sum(1 for m in materials if 'STEEL' in m.get('name', '').upper())
        copper_count = sum(1 for m in materials if any(x in m.get('name', '').upper() for x in ['COPPER', 'BRASS']))
        titanium_count = sum(1 for m in materials if 'TITANIUM' in m.get('name', '').upper())
        other_count = len(materials) - aluminum_count - steel_count - copper_count - titanium_count
        
        f.write(f"- **Aluminum alloys**: {aluminum_count} materials\n")
        f.write(f"- **Steel alloys**: {steel_count} materials\n")
        f.write(f"- **Copper/Brass alloys**: {copper_count} materials\n")
        f.write(f"- **Titanium alloys**: {titanium_count} materials\n")
        f.write(f"- **Other materials**: {other_count} materials\n")
        f.write(f"- **Total**: {len(materials)} materials\n")

if __name__ == "__main__":
    file_path = Path(__file__).parent / "FMAT98Z.TXT"
    
    if not file_path.exists():
        print(f"File {file_path} not found!")
        exit(1)
    
    print("Parsing materials...")
    materials = parse_materials(file_path)
    
    print(f"Creating CSV table with {len(materials)} materials...")
    create_csv_table(materials, Path(__file__).parent / "material_properties.csv")
    
    print("Creating Markdown summary...")
    create_markdown_table(materials, Path(__file__).parent / "material_properties_summary.md")
    
    print("Files created:")
    print("- material_properties.csv (complete table)")
    print("- material_properties_summary.md (markdown summary)")