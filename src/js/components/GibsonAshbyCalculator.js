/**
 * GibsonAshbyCalculator - Implementation of Gibson-Ashby & Deshpande-Fleck models for cellular foams
 * Extends BaseCalculator with specific functionality for foam material models
 */
class GibsonAshbyCalculator extends BaseCalculator {
    /**
     * Create a new Gibson-Ashby calculator instance
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        super({
            containerId: 'calculator-container',
            resultsId: 'results',
            chartId: 'chartSvg',
            tableId: 'tableBody',
            ...config
        });
        
        this.foamProperties = {
            eps: { 
                name: 'EPS (Expanded Polystyrene)', 
                C1: 0.6, 
                C3: 0.25, 
                Es: 3000, // MPa
                sigmaS: 50, // MPa 
                rhoS: 1050, // kg/m3
                color: '#3498db' 
            },
            epp: { 
                name: 'EPP (Expanded Polypropylene)', 
                C1: 0.8, 
                C3: 0.3, 
                Es: 1200, // MPa
                sigmaS: 35, // MPa
                rhoS: 900, // kg/m3
                color: '#e74c3c' 
            },
            pu: { 
                name: 'PU (Polyurethane)', 
                C1: 0.4, 
                C3: 0.2, 
                Es: 2000, // MPa
                sigmaS: 40, // MPa
                rhoS: 1200, // kg/m3
                color: '#2ecc71' 
            }
        };
        
        // Unit conversion factors
        this.unitConversions = {
            pressure: {
                'Pa': 1e-6,
                'kPa': 1e-3,
                'MPa': 1,
                'GPa': 1e3,
                'psi': 6.89476e-3
            },
            density: {
                'kg/m³': 1,
                'g/cm³': 1000,
                'lb/ft³': 16.0185
            }
        };
    }

    /**
     * Set up event listeners for inputs and controls
     */
    setupEventListeners() {
        // Input change events
        document.getElementById('foamType').addEventListener('change', () => this.scheduleCalculation());
        document.getElementById('density').addEventListener('input', () => this.scheduleCalculation());
        document.getElementById('density').addEventListener('blur', () => this.validateDensity());
        document.getElementById('hardeningCoeff').addEventListener('input', () => this.scheduleCalculation());
        document.getElementById('hardeningCoeff').addEventListener('blur', () => this.validateHardeningCoeff());
        
        // Units panel events
        document.getElementById('pressureUnit').addEventListener('change', () => this.updateUnits());
        document.getElementById('densityUnit').addEventListener('change', () => this.updateUnits());
    }

    /**
     * Validate density input
     */
    validateDensity() {
        const input = document.getElementById('density');
        this.validateNumericInput(input, 10, 200, 25);
    }

    /**
     * Validate hardening coefficient input
     */
    validateHardeningCoeff() {
        const input = document.getElementById('hardeningCoeff');
        this.validateNumericInput(input, 0, 10, 0);
    }

    /**
     * Perform calculation based on input values
     */
    calculate() {
        // Get and validate input values
        let density = parseFloat(document.getElementById('density').value);
        let hardeningCoeff = parseFloat(document.getElementById('hardeningCoeff').value);
        const foamType = document.getElementById('foamType').value;
        
        // Validate inputs (but don't modify the input fields)
        if (isNaN(density) || density < 10) density = 10;
        if (density > 200) density = 200;
        if (isNaN(hardeningCoeff) || hardeningCoeff < 0) hardeningCoeff = 0;
        if (hardeningCoeff > 10) hardeningCoeff = 10;
        
        const props = this.foamProperties[foamType];
        const relDensity = density / props.rhoS;
        
        // Gibson-Ashby model parameters
        const E_foam = props.C1 * props.Es * Math.pow(relDensity, 2); // MPa
        const sigma_pl = props.C3 * props.sigmaS * Math.pow(relDensity, 1.5); // MPa
        const energyAbsorption = sigma_pl * 60 / 100; // MJ/m³
        
        // Update results display
        document.getElementById('elasticModulus').textContent = E_foam.toFixed(1);
        document.getElementById('plateauStress').textContent = sigma_pl.toFixed(3);
        document.getElementById('energyAbsorption').textContent = energyAbsorption.toFixed(3);
        
        // Show results
        document.getElementById('results').style.display = 'block';
        document.getElementById('chartContainer').style.display = 'block';
        document.getElementById('tableContainer').style.display = 'block';
        
        // Update chart
        this.updateChart(density, foamType, hardeningCoeff);
        
        // Update data table
        this.generateDataTable(density, foamType, hardeningCoeff);
    }

    /**
     * Update chart with new data
     * @param {number} density - Foam density
     * @param {string} foamType - Foam type
     * @param {number} hardeningCoeff - Hardening coefficient
     */
    updateChart(density, foamType, hardeningCoeff) {
        if (!this.chartManager.isPlotlyLoaded()) {
            console.warn('Plotly.js not loaded, skipping chart update');
            return;
        }

        const props = this.foamProperties[foamType];
        const relDensity = density / props.rhoS;
        
        const E_foam = props.C1 * props.Es * Math.pow(relDensity, 2);
        const sigma_pl = props.C3 * props.sigmaS * Math.pow(relDensity, 1.5);
        
        const parameters = {
            E_foam: E_foam,
            sigma_pl: sigma_pl,
            E_densification: sigma_pl * 5,
            hardeningCoeff: hardeningCoeff
        };
        
        const options = {
            maxStrain: 0.8,
            stressUnit: document.getElementById('pressureUnit').value || 'MPa',
            title: `${props.name} - Density: ${density} ${document.getElementById('densityUnit').value || 'kg/m³'}, H: ${hardeningCoeff}`
        };

        try {
            this.chartManager.createGibsonAshbyChart('chartSvg', parameters, options)
                .catch(error => {
                    console.error('Error creating Gibson-Ashby chart:', error);
                });
        } catch (error) {
            console.error('Chart update error:', error);
        }
    }

    /**
     * Generate data table with calculation results
     * @param {number} density - Foam density
     * @param {string} foamType - Foam type
     * @param {number} hardeningCoeff - Hardening coefficient
     */
    generateDataTable(density, foamType, hardeningCoeff) {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        
        const props = this.foamProperties[foamType];
        const relDensity = density / props.rhoS;
        
        const E = props.C1 * props.Es * Math.pow(relDensity, 2);
        const sigmaPl = props.C3 * props.sigmaS * Math.pow(relDensity, 1.5);
        const epsilonD = 60;
        const epsilonY = (100 * sigmaPl) / E;
        
        // Generate data points
        let strainPoints = [];
        for (let i = 0; i <= 99; i++) {
            strainPoints.push(i);
        }
        
        if (epsilonY % 1 !== 0 && epsilonY >= 0 && epsilonY <= 99) {
            strainPoints.push(epsilonY);
        }
        if (epsilonD % 1 !== 0 && epsilonD >= 0 && epsilonD <= 99) {
            strainPoints.push(epsilonD);
        }
        
        strainPoints.sort((a, b) => a - b);
        
        strainPoints.forEach(epsilon => {
            let sigma, stage, description;
            
            if (epsilon <= epsilonY) {
                sigma = E * (epsilon / 100);
                stage = 'I';
                description = 'Elastic';
            } else if (epsilon <= epsilonD) {
                const strainIncrement = (epsilon - epsilonY) / 100;
                sigma = sigmaPl * (1 + hardeningCoeff * strainIncrement);
                stage = 'II';
                description = hardeningCoeff > 0 ? 'Plateau (Hardening)' : 'Plateau';
            } else {
                const plateauStressAtDensification = sigmaPl * (1 + hardeningCoeff * (epsilonD - epsilonY) / 100);
                const epsilonRel = (epsilon - epsilonD) / (100 - epsilonD);
                sigma = plateauStressAtDensification * (1 + 5 * Math.pow(epsilonRel, 2));
                stage = 'III';
                description = 'Densification';
            }
            
            const row = tableBody.insertRow();
            const isTransition = (Math.abs(epsilon - epsilonY) < 0.001) || (Math.abs(epsilon - epsilonD) < 0.001);
            
            if (isTransition) {
                row.style.backgroundColor = '#fff3cd';
                row.style.fontWeight = 'bold';
            }
            
            row.insertCell(0).textContent = epsilon.toFixed(epsilon % 1 === 0 ? 0 : 2);
            row.insertCell(1).textContent = sigma.toFixed(4);
            row.insertCell(2).textContent = stage;
            row.insertCell(3).textContent = description + (isTransition ? ' (Transition)' : '');
        });
    }

    /**
     * Update displayed units
     */
    updateUnits() {
        const pressureUnit = document.getElementById('pressureUnit').value;
        const densityUnit = document.getElementById('densityUnit').value;
        
        // Update unit displays
        document.getElementById('densityUnitDisplay').textContent = densityUnit;
        document.getElementById('elasticModulusUnit').textContent = pressureUnit;
        document.getElementById('plateauStressUnit').textContent = pressureUnit;
        document.getElementById('energyAbsorptionUnit').textContent = pressureUnit === 'MPa' ? 'MJ/m³' : 'J/m³';
        
        // Recalculate with new units
        this.scheduleCalculation();
    }

    /**
     * Export data to CSV
     */
    exportToCSV() {
        super.exportToCSV('gibson_ashby_deshpande_fleck_data.csv');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GibsonAshbyCalculator;
} else {
    window.GibsonAshbyCalculator = GibsonAshbyCalculator;
}