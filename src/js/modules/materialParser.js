/**
 * Material data parsing and processing
 */

/**
 * Determine material ID and type from mat_data
 */
export function determineMaterialInfo(matData) {
  if (!matData) return { id: '-', mat: '-' };
  
  const lines = matData.split('\n');
  if (lines.length === 0) return { id: '-', mat: '-' };
  
  let firstLine = lines[0].trim();
  if (firstLine.endsWith('_TITLE')) {
    firstLine = firstLine.slice(0, -6); // Remove '_TITLE'
  }
  
  return {
    id: firstLine, // Will be resolved by MaterialDictionaries
    mat: firstLine
  };
}

/**
 * Determine EOS ID and type from eos_data
 */
export function determineEosInfo(eosData) {
  if (!eosData) return { id: '-', eos: '-' };
  
  const lines = eosData.split('\n');
  if (lines.length === 0) return { id: '-', eos: '-' };
  
  let firstLine = lines[0].trim();
  if (firstLine.endsWith('_TITLE')) {
    firstLine = firstLine.slice(0, -6); // Remove '_TITLE'
  }
  
  return {
    id: firstLine, // Will be resolved by MaterialDictionaries
    eos: firstLine
  };
}

/**
 * Generic function to determine material type from data
 */
export function determineAdditionalInfo(data) {
  if (!data) return null;
  
  const lines = data.split('\n');
  if (lines.length === 0) return null;
  
  let firstLine = lines[0].trim();
  if (firstLine.endsWith('_TITLE')) {
    firstLine = firstLine.slice(0, -6); // Remove '_TITLE'
  }
  
  return firstLine;
}

/**
 * Process material data for table display
 */
export function processMaterialData(material, materialDictionaries) {
  if (!material || typeof material !== "object") {
    console.warn("Invalid material format", material);
    return null;
  }

  // Determine material info automatically from mat_data
  const materialInfo = determineMaterialInfo(material.mat_data);
  materialInfo.id = materialDictionaries.getMaterialId(materialInfo.mat);
  
  // Determine MAT_ADD and MAT_THERMAL info automatically from data fields
  const matAddInfo = determineAdditionalInfo(material.mat_add_data);
  const matThermalInfo = determineAdditionalInfo(material.mat_thermal_data);
  
  // Get EOS info
  const eosInfo = determineEosInfo(material.eos_data);
  eosInfo.id = materialDictionaries.getEosId(eosInfo.eos);
  
  // Create combined markup for Material Model & EOS column
  let materialModelEosHTML = '';

  // Add Material info only if mat_data exists
  if (material.mat_data && materialInfo.mat !== '-') {
    materialModelEosHTML += `<div><strong>Material:</strong> ${materialInfo.id} / ${materialInfo.mat}</div>`;
    
    // Add Additional properties (MAT_ADD only) if they exist in the data
    if (matAddInfo) {
      materialModelEosHTML += `<div><strong>Additional properties:</strong> ${matAddInfo}</div>`;
    }
    
    // Add Thermal properties (MAT_THERMAL) separately if they exist
    if (matThermalInfo) {
      // Get thermal ID from dictionaries
      const thermalId = materialDictionaries.getMatThermalId(matThermalInfo);
      materialModelEosHTML += `<div><strong>Thermal properties:</strong></div><div><pre><code>${thermalId} / ${matThermalInfo}</code></pre></div>`;
    }
  }
  
  // Add EOS info if it exists
  if (eosInfo.eos && eosInfo.eos !== '-') {
    materialModelEosHTML += `<div><strong>EOS:</strong> ${eosInfo.id} / ${eosInfo.eos}</div>`;
  }
  
  // Collect all material types for search (excluding EOS)
  const allMaterialTypes = [];
  
  // Add material type if it exists
  if (materialInfo.mat && materialInfo.mat !== '-') {
    allMaterialTypes.push(materialInfo.mat);
  }
  
  // Note: EOS is excluded from material types as it has its own filter
  
  if (matAddInfo) {
    allMaterialTypes.push(matAddInfo);
  }
  if (matThermalInfo) {
    allMaterialTypes.push(matThermalInfo);
  }
  
  return {
    materialModelEosHTML,
    applicationsHTML: `<ul>${(material.app || [])
      .map((app) => `<li>${app}</li>`)
      .join("")}</ul>`,
    material,
    allMaterialTypes,
    eosName: eosInfo.eos
  };
}