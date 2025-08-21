/**
 * TemplateManager - Handles HTML templates for calculators and components
 * Provides methods for loading, rendering, and managing templates
 */
class TemplateManager {
    constructor() {
        this.templates = {};
        this.templateCache = new Map();
    }

    /**
     * Register a template
     * @param {string} name - Template name
     * @param {string} html - Template HTML content
     */
    registerTemplate(name, html) {
        this.templates[name] = html;
    }

    /**
     * Get a template by name
     * @param {string} name - Template name
     * @returns {string|null} Template HTML or null if not found
     */
    getTemplate(name) {
        return this.templates[name] || null;
    }

    /**
     * Render a template with data
     * @param {string} name - Template name
     * @param {Object} data - Data to render in the template
     * @returns {string} Rendered HTML
     */
    render(name, data = {}) {
        const template = this.getTemplate(name);
        if (!template) {
            console.error(`Template "${name}" not found`);
            return '';
        }

        // Simple template rendering with ${variable} syntax
        return template.replace(/\${([^}]+)}/g, (match, key) => {
            const value = this.getNestedProperty(data, key.trim());
            return value !== undefined ? value : '';
        });
    }

    /**
     * Get nested property from object using dot notation
     * @param {Object} obj - Object to get property from
     * @param {string} path - Property path (e.g., 'user.name')
     * @returns {*} Property value
     */
    getNestedProperty(obj, path) {
        return path.split('.').reduce((o, p) => o && o[p], obj);
    }

    /**
     * Load a template from a URL
     * @param {string} name - Template name
     * @param {string} url - Template URL
     * @returns {Promise<string>} Template HTML
     */
    async loadTemplate(name, url) {
        // Check cache first
        if (this.templateCache.has(url)) {
            const template = this.templateCache.get(url);
            this.registerTemplate(name, template);
            return template;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
            }
            
            const html = await response.text();
            this.templateCache.set(url, html);
            this.registerTemplate(name, html);
            return html;
        } catch (error) {
            console.error(`Error loading template "${name}" from ${url}:`, error);
            return '';
        }
    }

    /**
     * Render a template to a DOM element
     * @param {string} name - Template name
     * @param {Object} data - Data to render in the template
     * @param {string|HTMLElement} container - Container element or selector
     */
    renderToElement(name, data, container) {
        const html = this.render(name, data);
        const element = typeof container === 'string' ? document.querySelector(container) : container;
        
        if (element) {
            element.innerHTML = html;
        } else {
            console.error(`Container "${container}" not found`);
        }
    }

    /**
     * Register common calculator templates
     */
    registerCommonTemplates() {
        // Units panel template
        this.registerTemplate('unitsPanel', `
            <div class="units-panel">
                <h3>
                    <span>🔧 Units Settings</span>
                    <button class="units-toggle" onclick="calculator.toggleUnitsPanel()">Show/Hide</button>
                </h3>
                <div id="unitsSettings" class="units-grid" style="display: none;">
                    ${this.getTemplate('unitSelectors') || '<!-- Unit selectors will be inserted here -->'}
                </div>
            </div>
        `);

        // Results container template
        this.registerTemplate('resultsContainer', `
            <div class="results" id="results" style="display: none;">
                ${this.getTemplate('resultItems') || '<!-- Result items will be inserted here -->'}
            </div>
        `);

        // Chart container template
        this.registerTemplate('chartContainer', `
            <div class="container" id="chartContainer" style="display: none;">
                <h2 class="collapsible-header collapsed" onclick="calculator.toggleCollapse(this)">${this.getTemplate('chartTitle') || 'Interactive Chart'}</h2>
                <div class="collapsible-content collapsed">
                    <div class="chart-container">
                        <div id="chartSvg" style="width: 100%; height: 600px;">
                            <!-- Chart will be generated here -->
                        </div>
                    </div>
                </div>
            </div>
        `);

        // Data table template
        this.registerTemplate('dataTableContainer', `
            <div class="container" id="tableContainer" style="display: none;">
                <h2 class="collapsible-header collapsed" onclick="calculator.toggleCollapse(this)">${this.getTemplate('tableTitle') || 'Data Points'}</h2>
                <div class="collapsible-content collapsed">
                    <div class="table-header">
                        <div></div>
                        <button class="export-btn" onclick="calculator.exportToCSV('${this.getTemplate('exportFilename') || 'calculator_data.csv'}')">📊 Export CSV</button>
                    </div>
                    <div class="table-container">
                        <table id="propertiesTable">
                            <thead>
                                <tr>
                                    ${this.getTemplate('tableHeaders') || '<!-- Table headers will be inserted here -->'}
                                </tr>
                            </thead>
                            <tbody id="tableBody">
                                <!-- Table rows will be generated dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `);

        // Disclaimer template
        this.registerTemplate('disclaimer', `
            <div style="margin-bottom: 30px; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107; border: 1px solid #ffeaa7;">
                <h3 style="margin: 0 0 10px 0; color: #856404; font-size: 18px;">⚠️ Important Disclaimer</h3>
                <p style="margin: 0 0 10px 0; color: #856404; line-height: 1.6; font-size: 14px;">
                    ${this.getTemplate('disclaimerText') || '<!-- Disclaimer text will be inserted here -->'}
                </p>
                <p style="margin: 0 0 10px 0; color: #856404; line-height: 1.6; font-size: 14px;">
                    <strong>${this.getTemplate('disclaimerRefTitle') || 'Reference'}:</strong> ${this.getTemplate('disclaimerRef') || '<!-- Reference will be inserted here -->'}
                </p>
                <p style="margin: 0; color: #856404; line-height: 1.6; font-size: 14px; font-weight: 600;">
                    <strong>Note:</strong> ${this.getTemplate('disclaimerNote') || '<!-- Note will be inserted here -->'}
                </p>
            </div>
        `);

        // Formula information template
        this.registerTemplate('formulaInfo', `
            <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #3498db;">
                <h2 style="margin: 0; color: #2c3e50; font-size: 24px;">${this.getTemplate('formulaTitle') || 'Model Formula'}</h2>
                <div style="font-size: 22px; font-weight: bold; margin: 15px 0; color: #2c3e50; font-family: 'Times New Roman', serif;">
                    ${this.getTemplate('formulaEquation') || '<!-- Formula equation will be inserted here -->'}
                </div>
                <div style="font-size: 14px; color: #7f8c8d; line-height: 1.5;">
                    ${this.getTemplate('formulaDescription') || '<!-- Formula description will be inserted here -->'}
                </div>
            </div>
        `);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateManager;
} else {
    window.TemplateManager = TemplateManager;
}