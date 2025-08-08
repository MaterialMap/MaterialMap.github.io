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
          fileList = fileListData.map(filename => ({ filename, lastModified: null }));
        } else {
          // New format: array of objects with filename and lastModified
          fileList = fileListData;
        }
      } else {
        throw new Error("File list format is not valid.");
      }
      
      if (fileList.length === 0) {
        throw new Error("File list is empty or not valid.");
      }
  
      // Load files in parallel using Promise.all
      const filePromises = fileList.map(async (fileInfo) => {
        const fileName = fileInfo.filename;
        const fileLastModified = fileInfo.lastModified;
        
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
              // Add file modification date to each material
              return materialsInFile.map(material => ({
                ...material,
                fileLastModified: fileLastModified
              }));
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
        return ["Invalid data", "-", "-", "-", null];
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

      // Return table rows
      return [
        materialModelHTML,
        determineEosInfo(material.eos_data).eos,
        `<ul>${(material.app || [])
          .map((app) => `<li>${app}</li>`)
          .join("")}</ul>`,
        formatDate(material.fileLastModified || material.add),
        material,
      ];
    });

    // Initialize DataTable
    const table = $("#materials-table").DataTable({
      data: tableData,
      columns: [
        { title: "Material Model" },
        { title: "EOS" },
        { title: "Applications" },
        { title: "Added" },
        { visible: false },
      ],
      order: [[0, "asc"]], // Sort by first column (index 0) in ascending order
      pageLength: 20,
    });

    // Handle clicks to expand rows
    $("#materials-table tbody").on("click", "tr", function () 
    {
      const tr = $(this);
      const row = table.row(tr);
      const material = row.data()[4];

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

// Format date in DD.MM.YYYY format
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

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
