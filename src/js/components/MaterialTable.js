/**
 * Material table management and display
 */
import { CONFIG } from '../utils/config.js';
import { escapeHtml, generateId, copyToClipboard } from '../utils/helpers.js';
import { processMaterialData } from '../modules/materialParser.js';

export class MaterialTable {
  constructor(tableSelector, materialDictionaries) {
    this.tableSelector = tableSelector;
    this.materialDictionaries = materialDictionaries;
    this.table = null;
    this.tableData = [];
  }

  /**
   * Initialize DataTable with materials data
   */
  async initialize(materials) {
    try {
      // Prepare table data
      this.tableData = materials
        .map(material => processMaterialData(material, this.materialDictionaries))
        .filter(data => data !== null)
        .map(data => [
          data.materialModelEosHTML,
          data.applicationsHTML,
          data.material,
          data.allMaterialTypes,
          data.eosName
        ]);

      // Initialize DataTable
      this.table = $(this.tableSelector).DataTable({
        data: this.tableData,
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

      // Setup event handlers
      this.setupEventHandlers();
      
      // Fix table column alignment
      setTimeout(() => {
        this.table.columns.adjust().draw();
      }, 100);

      return this.table;
    } catch (tableError) {
      throw new Error(`Failed to initialize DataTable: ${tableError.message}`);
    }
  }

  /**
   * Setup table event handlers
   */
  setupEventHandlers() {
    // Handle clicks to expand rows
    $(`${this.tableSelector} tbody`).on("click", "tr", (event) => {
      this.handleRowClick(event);
    });

    // Handle window resize to adjust table
    $(window).on('resize', () => {
      if (this.table) {
        this.table.columns.adjust().draw();
      }
    });

    // Handle copy button clicks
    $(document).on('click', '.copy-button', (event) => {
      this.handleCopyClick(event);
    });

    // Handle mouse events for cursor styling
    this.setupMouseEvents();
  }

  /**
   * Handle row click for expanding/collapsing details
   */
  handleRowClick(event) {
    const tr = $(event.currentTarget);
    const row = this.table.row(tr);
    const material = row.data()[2]; // Material object is in column 2

    if (!material) {
      console.warn("No material data available for row:", row.data());
      return;
    }

    if (row.child.isShown()) {
      row.child.hide();
      tr.removeClass("shown");
    } else {
      const contentElements = this.createRowContent(material);
      row.child(contentElements.join('')).show();
      tr.addClass("shown");
    }
  }

  /**
   * Create content for expanded row
   */
  createRowContent(material) {
    const contentElements = [];
    
    // Add reference information
    if (material.ref) {
      contentElements.push(`<div class="reference-block"><strong>Reference: </strong><a href="${material.url}" target="_blank">${material.ref}</a></div>`);
    }
    
    // Add comments if they exist
    if (material.comments) {
      contentElements.push(`<div class="comments-block"><strong>Comments: </strong><span class="comments-info">${escapeHtml(material.comments)}</span></div>`);
    }
    
    // Add material data if it exists
    if (material.mat_data) {
      contentElements.push(this.createCodeBlock("*MAT", material.mat_data, material));
    }
    
    // Add EOS data if it exists
    if (material.eos_data) {
      contentElements.push(this.createCodeBlock("*EOS", material.eos_data, material));
    }
    
    // Add MAT_ADD data if it exists
    if (material.mat_add_data) {
      contentElements.push(this.createCodeBlock("*MAT_ADD", material.mat_add_data, material));
    }
    
    // Add MAT_THERMAL data if it exists
    if (material.mat_thermal_data) {
      contentElements.push(this.createCodeBlock("*MAT_THERMAL", material.mat_thermal_data, material));
    }
    
    return contentElements;
  }

  /**
   * Create a code block with header and copy button
   */
  createCodeBlock(title, content, material = null) {
    // Add additional fields as comments after the second line
    const modifiedContent = this.addMetadataComments(content, material);
    const escapedContent = escapeHtml(modifiedContent);
    const id = generateId('code-block');
    
    return `
      <div class="code-container">
        <div class="code-header">
          <span class="code-title">${title}</span>
          <button class="copy-button" data-content-id="${id}">Copy</button>
        </div>
        <pre id="${id}"><code>${escapedContent}</code></pre>
      </div>`;
  }

  /**
   * Split long text into multiple lines with specified prefix
   */
  splitLongLine(prefix, text, maxLength = 78) {
    const fullLine = `${prefix} ${text}`;
    
    // If the line is not too long, return as is
    if (fullLine.length <= maxLength) {
      return [fullLine];
    }
    
    const lines = [];
    let remainingText = text;
    let isFirstLine = true;
    
    while (remainingText.length > 0) {
      const currentPrefix = isFirstLine ? prefix : '$';
      const availableSpace = maxLength - currentPrefix.length - 1; // -1 for space after prefix
      
      if (remainingText.length <= availableSpace) {
        // Remaining text fits in one line
        lines.push(`${currentPrefix} ${remainingText}`);
        break;
      }
      
      // Find the best split point
      let splitIndex = availableSpace;
      
      // Try to split by space first
      let lastSpaceIndex = remainingText.lastIndexOf(' ', splitIndex);
      if (lastSpaceIndex > 0) {
        splitIndex = lastSpaceIndex;
      } else {
        // Try to split by "/" if no space found
        let lastSlashIndex = remainingText.lastIndexOf('/', splitIndex);
        if (lastSlashIndex > 0) {
          splitIndex = lastSlashIndex + 1; // Include "/" in current line
        }
        // If no good split point found, force split at maxLength
      }
      
      const currentLine = remainingText.substring(0, splitIndex).trim();
      lines.push(`${currentPrefix} ${currentLine}`);
      
      remainingText = remainingText.substring(splitIndex).trim();
      isFirstLine = false;
    }
    
    return lines;
  }

  /**
   * Add metadata comments to LS-DYNA card content
   */
  addMetadataComments(content, material) {
    if (!material || !content) return content;
    
    const lines = content.split('\n');
    if (lines.length < 2) return content;
    
    // Check if content already contains metadata comments
    const contentStr = content.toLowerCase();
    const hasUnits = material.units && (
      contentStr.includes('$ units:') || 
      contentStr.includes('$units:') ||
      contentStr.includes('units:') ||
      contentStr.includes(material.units.toLowerCase().substring(0, Math.min(15, material.units.length)))
    );
    const hasReference = material.ref && (
      contentStr.includes('$ reference:') || 
      contentStr.includes('$reference:') || 
      contentStr.includes('reference:') ||
      contentStr.includes(material.ref.toLowerCase().substring(0, Math.min(30, material.ref.length)))
    );
    const hasUrl = material.url && (
      contentStr.includes('$ url:') || 
      contentStr.includes('$url:') || 
      contentStr.includes('url:') ||
      contentStr.includes(material.url.toLowerCase().substring(0, Math.min(25, material.url.length)))
    );
    const hasComments = material.comments && (
      contentStr.includes('$ comments:') || 
      contentStr.includes('$comments:') ||
      contentStr.includes('comments:')
    );
    
    // Find the position to insert comments (after the second non-empty line)
    let insertPosition = 1;
    let nonEmptyCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() !== '') {
        nonEmptyCount++;
        if (nonEmptyCount === 2) {
          insertPosition = i + 1;
          break;
        }
      }
    }
    
    // Prepare metadata comments (only for missing metadata)
    const metadataComments = [];
    
    if (material.units && !hasUnits) {
      const unitsLines = this.splitLongLine('$ Units:', material.units);
      metadataComments.push(...unitsLines);
    }
    
    if (material.ref && !hasReference) {
      const refLines = this.splitLongLine('$ Reference:', material.ref);
      metadataComments.push(...refLines);
    }
    
    if (material.url && !hasUrl) {
      const urlLines = this.splitLongLine('$ URL:', material.url);
      metadataComments.push(...urlLines);
    }
    
    if (material.comments && !hasComments) {
      const commentLines = this.splitLongLine('$ Comments:', material.comments);
      metadataComments.push(...commentLines);
    }
    
    // Insert metadata comments
    if (metadataComments.length > 0) {
      const beforeInsert = lines.slice(0, insertPosition);
      const afterInsert = lines.slice(insertPosition);
      
      const result = [...beforeInsert, ...metadataComments, ...afterInsert].join('\n');
      return result;
    }
    
    return content;
  }

  /**
   * Handle copy button clicks
   */
  async handleCopyClick(event) {
    const contentId = event.target.getAttribute('data-content-id');
    const content = document.getElementById(contentId).textContent;
    
    const result = await copyToClipboard(content);
    alert(result.message);
  }

  /**
   * Setup mouse events for cursor styling
   */
  setupMouseEvents() {
    const tableElement = document.querySelector(this.tableSelector);
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
  }

  /**
   * Get table data for filtering
   */
  getTableData() {
    return this.tableData;
  }

  /**
   * Get DataTable instance
   */
  getTable() {
    return this.table;
  }
}