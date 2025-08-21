/**
 * CalculatorFactory - Factory for creating calculator instances
 * Provides a unified interface for creating and initializing calculators
 */
class CalculatorFactory {
    /**
     * Available calculator types
     * @type {Object}
     */
    static calculatorTypes = {
        'gibson-ashby': {
            class: GibsonAshbyCalculator,
            template: 'src/templates/gibson-ashby-calculator.html',
            title: 'Gibson-Ashby & Deshpande-Fleck Models for Cellular Foams'
        },
        'johnson-cook': {
            class: null, // To be implemented
            template: 'src/templates/johnson-cook-calculator.html',
            title: 'Johnson-Cook Model Simplified Parameters Calculator'
        },
        'swift-law': {
            class: null, // To be implemented
            template: 'src/templates/swift-law-calculator.html',
            title: "Swift's Law Calculator for Metal Plasticity"
        },
        'mooney-rivlin': {
            class: null, // To be implemented
            template: 'src/templates/mooney-rivlin-calculator.html',
            title: 'Mooney-Rivlin Hyperelastic Model Calculator'
        }
    };

    /**
     * Create a calculator instance
     * @param {string} type - Calculator type
     * @param {Object} config - Configuration options
     * @returns {Promise<BaseCalculator>} Calculator instance
     */
    static async createCalculator(type, config = {}) {
        const calculatorInfo = this.calculatorTypes[type];
        if (!calculatorInfo) {
            throw new Error(`Unknown calculator type: ${type}`);
        }

        if (!calculatorInfo.class) {
            throw new Error(`Calculator implementation not available for type: ${type}`);
        }

        try {
            // Load template
            await TemplateLoader.loadAndRenderToElement(
                calculatorInfo.template,
                {},
                config.container || '#calculator-root'
            );
            
            // Create calculator instance
            const calculator = new calculatorInfo.class(config);
            
            // Initialize calculator
            await calculator.initialize();
            
            return calculator;
        } catch (error) {
            console.error(`Error creating calculator of type ${type}:`, error);
            throw error;
        }
    }

    /**
     * Get available calculator types
     * @returns {Array<string>} Array of calculator type names
     */
    static getAvailableTypes() {
        return Object.keys(this.calculatorTypes);
    }

    /**
     * Get calculator info by type
     * @param {string} type - Calculator type
     * @returns {Object|null} Calculator info or null if not found
     */
    static getCalculatorInfo(type) {
        return this.calculatorTypes[type] || null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalculatorFactory;
} else {
    window.CalculatorFactory = CalculatorFactory;
}