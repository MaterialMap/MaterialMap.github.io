// Universal base path calculator
function getBasePath() {
  const { origin, pathname, port } = window.location;

  // Check if the site is running via file://
  if (origin.startsWith("file://")) {
    const pathParts = pathname.split("/");
    pathParts.pop(); // Remove 'index.html' or the last segment
    return pathParts.join("/");
  }

  // Check if the site is running on localhost with a non-privileged port
  if (origin.includes("localhost") || origin.includes("127.0.0.1") || (port && parseInt(port) > 1024)) {
    return "./";
  }

  // For GitHub Pages
  const repoName = pathname.split("/")[1];
  return repoName ? `/${repoName}` : "/";
}
const basePath = getBasePath();
// Function to determine material ID and type from mat_data
function determineMaterialInfo(matData) {
  if (!matData) return { id: '-', mat: '-' };
  
  const lines = matData.split('\n');
  if (lines.length === 0) return { id: '-', mat: '-' };
  
  let firstLine = lines[0].trim();
  if (firstLine.endsWith('_TITLE')) {
    firstLine = firstLine.slice(0, -6); // Remove '_TITLE'
  }
  
  // Use material dictionaries class to find ID by material name
  const id = materialDictionaries.getMaterialId(firstLine);
  
  return {
    id: id,
    mat: firstLine
  };
}

// Function to determine EOS ID and type from eos_data
function determineEosInfo(eosData) {
  if (!eosData) return { id: '-', eos: '-' };
  
  const lines = eosData.split('\n');
  if (lines.length === 0) return { id: '-', eos: '-' };
  
  let firstLine = lines[0].trim();
  if (firstLine.endsWith('_TITLE')) {
    firstLine = firstLine.slice(0, -6); // Remove '_TITLE'
  }
  
  // Use material dictionaries class to find ID by EOS name
  const id = materialDictionaries.getEosId(firstLine);
  
  return {
    id: id,
    eos: firstLine
  };
}

// Generic function to determine material type from data
function determineAdditionalInfo(data) {
  if (!data) return null;
  
  const lines = data.split('\n');
  if (lines.length === 0) return null;
  
  let firstLine = lines[0].trim();
  if (firstLine.endsWith('_TITLE')) {
    firstLine = firstLine.slice(0, -6); // Remove '_TITLE'
  }
  
  return firstLine;
}

// Function to determine MAT_ADD type from mat_add_data (wrapper for backward compatibility)
function determineMatAddInfo(matAddData) {
  return determineAdditionalInfo(matAddData);
}

// Function to determine MAT_THERMAL type from mat_thermal_data (wrapper for backward compatibility)
function determineMatThermalInfo(matThermalData) {
  return determineAdditionalInfo(matThermalData);
}

// Material dictionaries class for better encapsulation
class MaterialDictionaries {
  constructor() {
    this.matDictionary = {};
    this.reverseDictionary = {};
    this.eosDictionary = {};
    this.reverseEosDictionary = {};
  }
  
  async load(basePath) {
    try {
      // Load material dictionary
      const matResponse = await fetch(`${basePath}/lib/mat.json`);
      if (matResponse.ok) {
        this.matDictionary = await matResponse.json();
        // Create reverse dictionary: value -> key
        this.reverseDictionary = {};
        Object.entries(this.matDictionary).forEach(([key, value]) => {
          this.reverseDictionary[value] = key;
        });
      }
      
      // Load EOS dictionary
      const eosResponse = await fetch(`${basePath}/lib/eos.json`);
      if (eosResponse.ok) {
        this.eosDictionary = await eosResponse.json();
        // Create reverse EOS dictionary: value -> key
        this.reverseEosDictionary = {};
        Object.entries(this.eosDictionary).forEach(([key, value]) => {
          this.reverseEosDictionary[value] = key;
        });
      }
    } catch (error) {
      console.warn('Failed to load dictionaries:', error);
      this.matDictionary = {};
      this.reverseDictionary = {};
      this.eosDictionary = {};
      this.reverseEosDictionary = {};
    }
  }
  
  getMaterialId(materialName) {
    return this.reverseDictionary[materialName] || '-';
  }
  
  getEosId(eosName) {
    return this.reverseEosDictionary[eosName] || '-';
  }
}

// Global instance of material dictionaries
const materialDictionaries = new MaterialDictionaries();

// Load material and EOS dictionaries (for backward compatibility)
async function loadMaterialDictionary() {
  await materialDictionaries.load(basePath);
  
  // For backward compatibility with existing code
  window.matDictionary = materialDictionaries.matDictionary;
  window.reverseDictionary = materialDictionaries.reverseDictionary;
  window.eosDictionary = materialDictionaries.eosDictionary;
  window.reverseEosDictionary = materialDictionaries.reverseEosDictionary;
}



// Wait for TOML parser to load with timeout
async function waitForTomlParser(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkParser = () => {
      if (typeof window.parseToml !== 'undefined') {
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error('TOML parser failed to load within the timeout period'));
        return;
      }
      
      setTimeout(checkParser, 100);
    };
    
    checkParser();
  });
}

// Load materials from specified files
async function loadMaterials() {
    try {
      // Wait for TOML parser to load with timeout
      await waitForTomlParser();
      
      // Load material dictionary first
      await loadMaterialDictionary();
      
      // Show loading indicator
      document.getElementById("loading").classList.remove("hidden");
  
      // Load file list
      const fileListResponse = await fetch(`${basePath}/dist/file-list.json`);
      if (!fileListResponse.ok) {
        throw new Error(`Failed to fetch file list. Status: ${fileListResponse.status} ${fileListResponse.statusText}`);
      }
  
      const fileListData = await fileListResponse.json();
      
      // Support both old format (array of strings) and new format (array of objects)
      let fileList;
      if (Array.isArray(fileListData)) {
        if (fileListData.length > 0 && typeof fileListData[0] === 'string') {
          // Old format: array of filenames
          fileList = fileListData;
        } else {
          // New format: array of objects with filename - extract just filenames
          fileList = fileListData.map(item => item.filename);
        }
      } else {
        throw new Error("File list format is not valid.");
      }
      
      if (fileList.length === 0) {
        throw new Error("File list is empty or not valid.");
      }
  
      // Load files in parallel using Promise.all
      const filePromises = fileList.map(async (fileName) => {
        
        try {
          const fileResponse = await fetch(`${basePath}/data/${fileName}`);
          if (!fileResponse.ok) {
            console.warn(`Failed to fetch file ${fileName}. Status: ${fileResponse.status}`);
            return [];
          }
  
          const tomlText = await fileResponse.text();
  
          // Parse TOML
          try {
            const parsedToml = window.parseToml(tomlText);
            const materialsInFile = parsedToml.material || [];
            
            if (Array.isArray(materialsInFile)) {
              return materialsInFile;
            } else {
              console.warn(`File ${fileName} does not contain a valid array of materials.`);
              return [];
            }
          } catch (tomlError) {
            console.warn(`TOML parsing error in file ${fileName}: ${tomlError.message}`);
            return [];
          }
        } catch (fileError) {
          console.error(`Error processing file ${fileName}:`, fileError);
          return [];
        }
      });
  
      // Wait for all file loading promises to resolve
      const materialsArrays = await Promise.all(filePromises);
      
      // Flatten the array of arrays into a single array of materials
      const allMaterials = materialsArrays.flat();
  
      if (allMaterials.length === 0) {
        throw new Error("No materials were successfully loaded.");
      }

    // Prepare table data
    const tableData = allMaterials.map((material) => {
      if (!material || typeof material !== "object") {
        console.warn("Invalid material format", material);
        return ["Invalid data", "-", "-", null];
      }

      // Determine material info automatically from mat_data
      const materialInfo = determineMaterialInfo(material.mat_data);
      
      // Determine MAT_ADD and MAT_THERMAL info automatically from data fields
      const matAddInfo = determineMatAddInfo(material.mat_add_data);
      const matThermalInfo = determineMatThermalInfo(material.mat_thermal_data);
      
      // Create markup for the first column
      let materialModelHTML = `
        <div><strong>ID:</strong> ${materialInfo.id}</div>
        <div>${materialInfo.mat}</div>
      `;

      // Add MAT_ADD and MAT_THERMAL only if they exist in the data
      if (matAddInfo) {materialModelHTML += `<div>${matAddInfo}</div>`}
      if (matThermalInfo) {materialModelHTML += `<div>${matThermalInfo}</div>`}

      // Get EOS info
      const eosInfo = determineEosInfo(material.eos_data);
      
      // Collect all material types for search
      const allMaterialTypes = [materialInfo.mat];
      if (matAddInfo) {
        allMaterialTypes.push(matAddInfo);
      }
      if (matThermalInfo) {
        allMaterialTypes.push(matThermalInfo);
      }
      
      // Return table rows
      return [
        materialModelHTML,
        eosInfo.eos,
        `<ul>${(material.app || [])
          .map((app) => `<li>${app}</li>`)
          .join("")}</ul>`,
        material,
        allMaterialTypes, // All material types for search (column 4)
        eosInfo.eos // Clean EOS name for search (column 5)
      ];
    });

    // Initialize DataTable
    const table = $("#materials-table").DataTable({
      data: tableData,
      columns: [
        { title: "Material Model" },
        { title: "EOS" },
        { title: "Applications" },
        { visible: false }, // Material object
        { visible: false }, // Clean material name for search
        { visible: false }  // Clean EOS name for search
      ],
      order: [[0, "asc"]], // Sort by first column (index 0) in ascending order
      pageLength: 20
    });

    // Populate filter dropdowns
    populateFilters(tableData);

    // Update table headers with counts
    updateTableHeaderCounts(tableData);

    // Setup filter event handlers
    setupFilterHandlers(table);

    // Handle clicks to expand rows
    $("#materials-table tbody").on("click", "tr", function () 
    {
      const tr = $(this);
      const row = table.row(tr);
      const material = row.data()[3]; // Material object is now in column 3

      if (!material) 
      {
        console.warn("No material data available for row:", row.data());
        return;
      }

      if (row.child.isShown()) 
      {
        row.child.hide();
        tr.removeClass("shown");
      } 
      else 
      {      
        // Create HTML elements for each data type if it exists
        const contentElements = [];
        
        // Add reference information
        const referenceHtml = material.ref
          ? `<div class="reference-block"><strong>Reference: </strong><a href="${material.url}" target="_blank">${material.ref}</a></div>`
          : `<div class="reference-block"><strong>Reference: </strong><a href="${material.url}" target="_blank">${material.url}</a></div>`;
        contentElements.push(referenceHtml);
        
        // Add material data if it exists
        if (material.mat_data) {
          contentElements.push(createCodeBlock("*MAT", material.mat_data));
        }
        
        // Add EOS data if it exists
        if (material.eos_data) {
          contentElements.push(createCodeBlock("*EOS", material.eos_data));
        }
        
        // Add MAT_ADD data if it exists
        if (material.mat_add_data) {
          contentElements.push(createCodeBlock("*MAT_ADD", material.mat_add_data));
        }
        
        // Add MAT_THERMAL data if it exists
        if (material.mat_thermal_data) {
          contentElements.push(createCodeBlock("*MAT_THERMAL", material.mat_thermal_data));
        }
        
        // Join all elements and show
        row.child(contentElements.join('')).show();
        tr.addClass("shown");
      }
    });

    console.log("Materials successfully loaded:", allMaterials);
  } 
  catch (error) 
  {
    document.getElementById("error-message").textContent = `An error occurred: ${error.message}`;
    console.error("Error details:", error);
  } 
  finally 
  {
    document.getElementById("loading").classList.add("hidden");
  }
}

// Create a code block with header and copy button
function createCodeBlock(title, content) {
  const escapedContent = escapeHtml(content); // Escape HTML for safe display
  const id = `code-block-${Math.random().toString(36).substring(2, 9)}`;
  
  return `
    <div class="code-container">
      <div class="code-header">
        <span class="code-title">${title}</span>
        <button class="copy-button" data-content-id="${id}">Copy</button>
      </div>
      <pre id="${id}"><code>${escapedContent}</code></pre>
    </div>`;
}

// Escape HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Copy text to clipboard
function copyToClipboard(content) {
  navigator.clipboard
    .writeText(content)
    .then(() => alert("Copied to clipboard!"))
    .catch((err) => alert("Failed to copy: " + err));
}

// Add event listener for copy buttons
document.addEventListener('click', function(event) {
  if (event.target.classList.contains('copy-button')) {
    const contentId = event.target.getAttribute('data-content-id');
    const content = document.getElementById(contentId).textContent;
    copyToClipboard(content);
  }
});



// Register service worker for offline capabilities
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`${basePath}/service-worker.js`)
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
}

// Populate filter dropdowns with unique values
function populateFilters(tableData) {
  const materialSet = new Set();
  const eosSet = new Set();
  
  tableData.forEach(row => {
    const materialTypes = row[5]; // Array of material types
    const eosName = row[6]; // Clean EOS name
    
    // Add all material types to the set
    if (Array.isArray(materialTypes)) {
      materialTypes.forEach(materialName => {
        if (materialName && materialName !== '-') {
          materialSet.add(materialName);
        }
      });
    }
    
    if (eosName && eosName !== '-') {
      eosSet.add(eosName);
    }
  });
  
  // Populate material filter
  const materialFilter = document.getElementById('material-filter');
  const sortedMaterials = Array.from(materialSet).sort();
  sortedMaterials.forEach(material => {
    const option = document.createElement('option');
    option.value = material;
    option.textContent = material;
    materialFilter.appendChild(option);
  });
  
  // Populate EOS filter
  const eosFilter = document.getElementById('eos-filter');
  const sortedEOS = Array.from(eosSet).sort();
  sortedEOS.forEach(eos => {
    const option = document.createElement('option');
    option.value = eos;
    option.textContent = eos;
    eosFilter.appendChild(option);
  });
}

// Update table headers with counts
function updateTableHeaderCounts(tableData) {
  let materialRecords = 0;
  let eosRecords = 0;
  let totalRecords = tableData.length;
  
  console.log(`Total records in database: ${totalRecords}`);
  
  tableData.forEach((row, index) => {
    const material = row[4]; // Material object
    
    // Count material records (each row is one material record)
    if (material && material.mat_data) {
      materialRecords++;
    }
    
    // Count EOS records
    if (material && material.eos_data) {
      eosRecords++;
    }
  });
  
  console.log(`Material records: ${materialRecords}, EOS records: ${eosRecords}`);
  
  // Update Material Model header - show total records
  const materialHeader = document.querySelector('#materials-table thead th:first-child');
  if (materialHeader) {
    materialHeader.innerHTML = `Material Model <span class="header-count">(${totalRecords})</span>`;
  }
  
  // Update EOS header
  const eosHeader = document.querySelector('#materials-table thead th:nth-child(2)');
  if (eosHeader) {
    eosHeader.innerHTML = `EOS <span class="header-count">(${eosRecords})</span>`;
  }
}

// Setup filter event handlers
function setupFilterHandlers(table) {
  const materialFilter = document.getElementById('material-filter');
  const eosFilter = document.getElementById('eos-filter');
  const clearButton = document.getElementById('clear-filters');
  
  // Material filter change handler
  materialFilter.addEventListener('change', function() {
    updateFilterCounts();
    applyFilters(table);
  });
  
  // EOS filter change handler
  eosFilter.addEventListener('change', function() {
    updateFilterCounts();
    applyFilters(table);
  });
  
  // Clear filters button handler
  clearButton.addEventListener('click', function() {
    materialFilter.selectedIndex = -1;
    eosFilter.selectedIndex = -1;
    updateFilterCounts();
    applyFilters(table);
  });
  
  // Initial count update
  updateFilterCounts();
}

// Update filter counts
function updateFilterCounts() {
  const materialFilter = document.getElementById('material-filter');
  const eosFilter = document.getElementById('eos-filter');
  const materialCount = document.getElementById('material-count');
  const eosCount = document.getElementById('eos-count');
  
  const selectedMaterials = materialFilter.selectedOptions.length;
  const selectedEOS = eosFilter.selectedOptions.length;
  
  materialCount.textContent = selectedMaterials > 0 ? `(${selectedMaterials} selected)` : '';
  eosCount.textContent = selectedEOS > 0 ? `(${selectedEOS} selected)` : '';
}

// Apply filters to the table
function applyFilters(table) {
  const materialFilter = document.getElementById('material-filter');
  const eosFilter = document.getElementById('eos-filter');
  
  const selectedMaterials = Array.from(materialFilter.selectedOptions).map(option => option.value);
  const selectedEOS = Array.from(eosFilter.selectedOptions).map(option => option.value);
  
  // Custom search function
  $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
    // Get the raw data for this row
    const rowData = table.row(dataIndex).data();
    const materialTypes = rowData[5]; // Array of material types
    const eosName = rowData[6]; // Clean EOS name
    
    // Check material filter - if any of the material types match
    let materialMatch = selectedMaterials.length === 0;
    if (!materialMatch && Array.isArray(materialTypes)) {
      materialMatch = materialTypes.some(materialType => selectedMaterials.includes(materialType));
    }
    
    // Check EOS filter
    let eosMatch = selectedEOS.length === 0 || selectedEOS.includes(eosName);
    
    return materialMatch && eosMatch;
  });
  
  // Redraw the table
  table.draw();
  
  // Remove the custom search function to avoid conflicts
  $.fn.dataTable.ext.search.pop();
}

// Load materials when the page opens
window.addEventListener("load", () => {
  // Register service worker
  registerServiceWorker();
  
  // Load materials data
  loadMaterials();

  // Change cursor appearance when hovering over table rows
  const tableElement = document.getElementById("materials-table");
  if (tableElement) {
    tableElement.addEventListener("mouseenter", (event) => {
      if (event.target && event.target.closest("tr")) {
        event.target.closest("tr").style.cursor = "pointer";
      }
    }, true);

    tableElement.addEventListener("mouseleave", (event) => {
      if (event.target && event.target.closest("tr")) {
        event.target.closest("tr").style.cursor = "default";
      }
    }, true);
  }
});
