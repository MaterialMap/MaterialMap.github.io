/**
 * Material table management and display
 */
import { CONFIG } from '../utils/config.js';
import { escapeHtml, generateId, copyToClipboard } from '../utils/helpers.js';
import { processMaterialData } from '../modules/MaterialParser.js';

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
    const referenceHtml = material.ref
      ? `<div class="reference-block"><strong>Reference: </strong><a href="${material.url}" target="_blank">${material.ref}</a></div>`
      : `<div class="reference-block"><strong>Reference: </strong><a href="${material.url}" target="_blank">${material.url}</a></div>`;
    contentElements.push(referenceHtml);
    
    // Add material data if it exists
    if (material.mat_data) {
      contentElements.push(this.createCodeBlock("*MAT", material.mat_data));
    }
    
    // Add EOS data if it exists
    if (material.eos_data) {
      contentElements.push(this.createCodeBlock("*EOS", material.eos_data));
    }
    
    // Add MAT_ADD data if it exists
    if (material.mat_add_data) {
      contentElements.push(this.createCodeBlock("*MAT_ADD", material.mat_add_data));
    }
    
    // Add MAT_THERMAL data if it exists
    if (material.mat_thermal_data) {
      contentElements.push(this.createCodeBlock("*MAT_THERMAL", material.mat_thermal_data));
    }
    
    return contentElements;
  }

  /**
   * Create a code block with header and copy button
   */
  createCodeBlock(title, content) {
    const escapedContent = escapeHtml(content);
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