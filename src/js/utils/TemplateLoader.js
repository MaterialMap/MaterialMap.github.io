/**
 * TemplateLoader - Utility for loading HTML templates
 * Provides methods for loading and rendering templates
 */
class TemplateLoader {
    /**
     * Load a template from a file
     * @param {string} templatePath - Path to template file
     * @returns {Promise<string>} Template HTML
     */
    static async loadTemplate(templatePath) {
        try {
            const response = await fetch(templatePath);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Error loading template from ${templatePath}:`, error);
            return '';
        }
    }

    /**
     * Render a template with data
     * @param {string} template - Template HTML
     * @param {Object} data - Data to render in the template
     * @returns {string} Rendered HTML
     */
    static render(template, data = {}) {
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
    static getNestedProperty(obj, path) {
        return path.split('.').reduce((o, p) => o && o[p], obj);
    }

    /**
     * Load and render a template
     * @param {string} templatePath - Path to template file
     * @param {Object} data - Data to render in the template
     * @returns {Promise<string>} Rendered HTML
     */
    static async loadAndRender(templatePath, data = {}) {
        const template = await this.loadTemplate(templatePath);
        return this.render(template, data);
    }

    /**
     * Load and render a template to a DOM element
     * @param {string} templatePath - Path to template file
     * @param {Object} data - Data to render in the template
     * @param {string|HTMLElement} container - Container element or selector
     * @returns {Promise<void>}
     */
    static async loadAndRenderToElement(templatePath, data, container) {
        const html = await this.loadAndRender(templatePath, data);
        const element = typeof container === 'string' ? document.querySelector(container) : container;
        
        if (element) {
            element.innerHTML = html;
        } else {
            console.error(`Container "${container}" not found`);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateLoader;
} else {
    window.TemplateLoader = TemplateLoader;
}