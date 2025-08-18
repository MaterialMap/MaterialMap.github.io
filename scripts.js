// Configuration and constants
const CONFIG = {
  TIMEOUTS: {
    TOML_PARSER: 5000,
    DEPENDENCIES: 10000
  },
  PATHS: {
    DATA: '/data',
    LIB: '/lib',
    DIST: '/dist'
  },
  TABLE: {
    PAGE_LENGTH: 20,
    RESPONSIVE_PRIORITY: {
      MATERIAL: 1,
      APPLICATIONS: 2
    }
  }
};

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
    return ".";
  }

  // For GitHub Pages
  // Check if this is an organization GitHub Pages site (*.github.io)
  if (origin.includes(".github.io")) {
    // For organization sites like materialmap.github.io, the base path is "/"
    // For user/repo sites like user.github.io/repo, the base path is "/repo"
    const hostname = new URL(origin).hostname;
    const parts = hostname.split('.');
    
    // If it's an organization site (not username.github.io), use root path
    if (parts.length === 3 && parts[1] === 'github' && parts[2] === 'io') {
      // This is likely an organization site
      return "";
    }
    
    // For user sites, extract repo name from path
    const repoName = pathname.split("/")[1];
    return repoName && repoName !== "" ? `/${repoName}` : "";
  }
  
  // Default fallback
  return "";
}
const basePath = getBasePath();
console.log('Base path determined:', basePath);
// Generic function to extract first line and remove _TITLE suffix
function extractFirstLine(data) {
  if (!data) return null;
  
  const lines = data.split('\n');
  if (lines.length === 0) return null;
  
  let firstLine = lines[0].trim();
  if (firstLine.endsWith('_TITLE')) {
    firstLine = firstLine.slice(0, -6); // Remove '_TITLE'
  }
  
  return firstLine;
}

// Function to determine material ID and type from mat_data
function determineMaterialInfo(matData) {
  const material = extractFirstLine(matData);
  if (!material) return { id: '-', mat: '-' };
  
  const id = materialDictionaries.getMaterialId(material);
  return { id: id, mat: material };
}

// Function to determine EOS ID and type from eos_data
function determineEosInfo(eosData) {
  const eos = extractFirstLine(eosData);
  if (!eos) return { id: '-', eos: '-' };
  
  const id = materialDictionaries.getEosId(eos);
  return { id: id, eos: eos };
}

// Function to determine additional material info (MAT_ADD, MAT_THERMAL, etc.)
function determineAdditionalInfo(data) {
  return extractFirstLine(data);
}

// Backward compatibility aliases
const determineMatAddInfo = determineAdditionalInfo;
const determineMatThermalInfo = determineAdditionalInfo;

// Utility functions
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateId(prefix = 'code-block') {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function waitForCondition(condition, timeout = 5000, interval = 100) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error('Condition not met within timeout period'));
        return;
      }
      
      setTimeout(check, interval);
    };
    
    check();
  });
}

// Material dictionaries class for better encapsulation
class MaterialDictionaries {
  constructor() {
    this.matDictionary = {};
    this.reverseDictionary = {};
    this.eosDictionary = {};
    this.reverseEosDictionary = {};
    this.matThermalDictionary = {};
    this.reverseMatThermalDictionary = {};
    this._loaded = false;
  }
  
  async load() {
    if (this._loaded) return;
    
    try {
      const [matResponse, eosResponse, matThermalResponse] = await Promise.all([
        fetch(`${basePath}${CONFIG.PATHS.LIB}/mat.json`),
        fetch(`${basePath}${CONFIG.PATHS.LIB}/eos.json`),
        fetch(`${basePath}${CONFIG.PATHS.LIB}/mat_thermal.json`)
      ]);

      // Load material dictionary
      if (matResponse.ok) {
        this.matDictionary = await matResponse.json();
        this.reverseDictionary = this._createReverseDictionary(this.matDictionary);
      }
      
      // Load EOS dictionary
      if (eosResponse.ok) {
        this.eosDictionary = await eosResponse.json();
        this.reverseEosDictionary = this._createReverseDictionary(this.eosDictionary);
      }
      
      // Load MAT_THERMAL dictionary
      if (matThermalResponse.ok) {
        this.matThermalDictionary = await matThermalResponse.json();
        this.reverseMatThermalDictionary = this._createReverseDictionary(this.matThermalDictionary);
      }
      
      this._loaded = true;
    } catch (error) {
      console.warn('Failed to load dictionaries:', error);
      this._initializeEmptyDictionaries();
    }
  }
  
  _createReverseDictionary(dictionary) {
    const reverse = {};
    Object.entries(dictionary).forEach(([key, value]) => {
      reverse[value] = key;
    });
    return reverse;
  }
  
  _initializeEmptyDictionaries() {
    this.matDictionary = {};
    this.reverseDictionary = {};
    this.eosDictionary = {};
    this.reverseEosDictionary = {};
    this.matThermalDictionary = {};
    this.reverseMatThermalDictionary = {};
  }
  
  getMaterialId(materialName) {
    return this.reverseDictionary[materialName] || '-';
  }
  
  getEosId(eosName) {
    return this.reverseEosDictionary[eosName] || '-';
  }
  
  getMatThermalId(matThermalName) {
    return this.reverseMatThermalDictionary[matThermalName] || '-';
  }
  
  get isLoaded() {
    return this._loaded;
  }
}

// Global instance of material dictionaries
const materialDictionaries = new MaterialDictionaries();

// Load material and EOS dictionaries (for backward compatibility)
async function loadMaterialDictionary() {
  await materialDictionaries.load();
  
  // For backward compatibility with existing code
  window.matDictionary = materialDictionaries.matDictionary;
  window.reverseDictionary = materialDictionaries.reverseDictionary;
  window.eosDictionary = materialDictionaries.eosDictionary;
  window.reverseEosDictionary = materialDictionaries.reverseEosDictionary;
  window.matThermalDictionary = materialDictionaries.matThermalDictionary;
  window.reverseMatThermalDictionary = materialDictionaries.reverseMatThermalDictionary;
}



// Wait for TOML parser to load with timeout
async function waitForTomlParser(timeout = CONFIG.TIMEOUTS.TOML_PARSER) {
  return waitForCondition(
    () => typeof window.parseToml !== 'undefined',
    timeout
  );
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
      const fileListUrl = `${basePath}${CONFIG.PATHS.DIST}/file-list.json`;
      console.log('Fetching file list from:', fileListUrl);
      const fileListResponse = await fetch(fileListUrl);
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
          const fileResponse = await fetch(`${basePath}${CONFIG.PATHS.DATA}/${fileName}`);
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
        return ["Invalid data", "-", null];
      }

      // Determine material info automatically from mat_data
      const materialInfo = determineMaterialInfo(material.mat_data);
      
      // Determine MAT_ADD and MAT_THERMAL info automatically from data fields
      const matAddInfo = determineMatAddInfo(material.mat_add_data);
      const matThermalInfo = determineMatThermalInfo(material.mat_thermal_data);
      
      // Get EOS info
      const eosInfo = determineEosInfo(material.eos_data);
      
      // Create combined markup for Material Model & EOS column
      let materialModelEosHTML = `
        <div><strong>Material:</strong> ${materialInfo.id} / ${materialInfo.mat}</div>
      `;

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
      
      // Add EOS info if it exists
      if (eosInfo.eos && eosInfo.eos !== '-') {
        materialModelEosHTML += `<div><strong>EOS:</strong> ${eosInfo.id} / ${eosInfo.eos}</div>`;
      }
      
      // Collect all material types for search
      const allMaterialTypes = [materialInfo.mat];
      if (matAddInfo) {
        allMaterialTypes.push(matAddInfo);
      }
      if (matThermalInfo) {
        allMaterialTypes.push(matThermalInfo);
      }
      
      // Return table rows (now with one less column)
      return [
        materialModelEosHTML,
        `<ul>${(material.app || [])
          .map((app) => `<li>${app}</li>`)
          .join("")}</ul>`,
        material,
        allMaterialTypes, // All material types for search (column 3)
        eosInfo.eos // Clean EOS name for search (column 4)
      ];
    });

    // Initialize DataTable
    let table;
    try {
      table = $("#materials-table").DataTable({
        data: tableData,
        columns: [
          { 
            responsivePriority: CONFIG.TABLE.RESPONSIVE_PRIORITY.MATERIAL,
            orderable: false,
            width: "60%"
          },
          { 
            responsivePriority: CONFIG.TABLE.RESPONSIVE_PRIORITY.APPLICATIONS,
            orderable: false,
            width: "40%"
          },
          { visible: false }, // Material object
          { visible: false }, // Clean material name for search
          { visible: false }  // Clean EOS name for search
        ],
        ordering: false, // Disable all sorting
        pageLength: CONFIG.TABLE.PAGE_LENGTH,
        responsive: true,
        scrollX: false, // Disable horizontal scrolling
        autoWidth: false,
        columnDefs: [
          { targets: [0, 1], className: "dt-head-center dt-body-left" }
        ]
      });
    } catch (tableError) {
      throw new Error(`Failed to initialize DataTable: ${tableError.message}`);
    }

    // Populate filter dropdowns
    populateFilters(tableData);

    // Setup filter event handlers
    setupFilterHandlers(table);

    // Fix table column alignment
    setTimeout(() => {
      table.columns.adjust().draw();
    }, 100);

    // Handle window resize to adjust table
    $(window).on('resize', function() {
      table.columns.adjust().draw();
    });

    // Handle clicks to expand rows
    $("#materials-table tbody").on("click", "tr", function () 
    {
      const tr = $(this);
      const row = table.row(tr);
      const material = row.data()[2]; // Material object is now in column 2

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
  const id = generateId();
  
  return `
    <div class="code-container">
      <div class="code-header">
        <span class="code-title">${title}</span>
        <button class="copy-button" data-content-id="${id}">Copy</button>
      </div>
      <pre id="${id}"><code>${escapedContent}</code></pre>
    </div>`;
}

// Copy text to clipboard with modern API
async function copyToClipboard(content) {
  try {
    await navigator.clipboard.writeText(content);
    alert("Copied to clipboard!");
  } catch (err) {
    alert(`Failed to copy: ${err.message}`);
  }
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
    const materialTypes = row[3]; // Array of material types (column 3)
    const eosName = row[4]; // Clean EOS name (column 4)
    
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

// Setup filter event handlers with debouncing
function setupFilterHandlers(table) {
  const materialFilter = document.getElementById('material-filter');
  const eosFilter = document.getElementById('eos-filter');
  const clearButton = document.getElementById('clear-filters');
  
  // Debounced filter function for better performance
  const debouncedApplyFilters = debounce(() => applyFilters(table), 300);
  
  // Material filter change handler
  if (materialFilter) {
    materialFilter.addEventListener('change', debouncedApplyFilters);
  }
  
  // EOS filter change handler
  if (eosFilter) {
    eosFilter.addEventListener('change', debouncedApplyFilters);
  }
  
  // Clear filters button handler
  if (clearButton) {
    clearButton.addEventListener('click', function() {
      if (materialFilter) materialFilter.selectedIndex = -1;
      if (eosFilter) eosFilter.selectedIndex = -1;
      applyFilters(table);
    });
  }
}

// Apply filters to the table
function applyFilters(table) {
  const materialFilter = document.getElementById('material-filter');
  const eosFilter = document.getElementById('eos-filter');
  
  const selectedMaterials = materialFilter ? 
    Array.from(materialFilter.selectedOptions).map(option => option.value) : [];
  const selectedEOS = eosFilter ? 
    Array.from(eosFilter.selectedOptions).map(option => option.value) : [];
  
  // Remove any existing custom search functions
  while ($.fn.dataTable.ext.search.length > 0) {
    $.fn.dataTable.ext.search.pop();
  }
  
  // Add custom search function
  $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
    // Get the raw data for this row
    const rowData = table.row(dataIndex).data();
    const materialTypes = rowData[3]; // Array of material types (column 3)
    const eosName = rowData[4]; // Clean EOS name (column 4)
    
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
}

// Wait for jQuery and DataTables to load
async function waitForDependencies(timeout = CONFIG.TIMEOUTS.DEPENDENCIES) {
  return waitForCondition(
    () => typeof window.$ !== 'undefined' && typeof window.$.fn.DataTable !== 'undefined',
    timeout
  );
}

// Load materials when the page opens
window.addEventListener("load", async () => {
  try {
    // Wait for dependencies to load
    await waitForDependencies();
    
    // Register service worker
    registerServiceWorker();
    
    // Load materials data
    await loadMaterials();

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
  } catch (error) {
    document.getElementById("error-message").textContent = `An error occurred while loading materials: ${error.message}`;
    console.error("Error loading dependencies or materials:", error);
  }
});
