/**
 * PlotlyChartManager - Unified chart management using Plotly.js
 * Provides consistent styling and functionality across all calculators
 */
class PlotlyChartManager {
    constructor() {
        this.defaultConfig = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d'],
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png',
                filename: 'material_curve',
                height: 600,
                width: 900,
                scale: 2
            }
        };

        this.defaultLayout = {
            font: {
                family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                size: 12,
                color: '#2c3e50'
            },
            plot_bgcolor: '#f8f9fa',
            paper_bgcolor: '#ffffff',
            margin: {
                l: 80,
                r: 100,
                t: 60,
                b: 80
            },
            showlegend: true,
            legend: {
                x: 0.02,
                y: 0.98,
                bgcolor: 'rgba(255,255,255,0.8)',
                bordercolor: '#dee2e6',
                borderwidth: 1
            },
            xaxis: {
                showgrid: true,
                gridcolor: '#dee2e6',
                gridwidth: 1,
                zeroline: true,
                zerolinecolor: '#adb5bd',
                zerolinewidth: 2,
                linecolor: '#333333',
                linewidth: 2,
                tickfont: {
                    size: 11,
                    color: '#333333'
                },
                titlefont: {
                    size: 14,
                    color: '#333333'
                }
            },
            yaxis: {
                showgrid: true,
                gridcolor: '#dee2e6',
                gridwidth: 1,
                zeroline: true,
                zerolinecolor: '#adb5bd',
                zerolinewidth: 2,
                linecolor: '#333333',
                linewidth: 2,
                tickfont: {
                    size: 11,
                    color: '#333333'
                },
                titlefont: {
                    size: 14,
                    color: '#333333'
                }
            }
        };

        this.colorPalette = [
            '#3498db', // Blue
            '#e74c3c', // Red
            '#27ae60', // Green
            '#f39c12', // Orange
            '#9b59b6', // Purple
            '#1abc9c', // Turquoise
            '#e67e22', // Carrot
            '#34495e'  // Dark blue-gray
        ];
    }

    /**
     * Create a stress-strain curve chart
     * @param {string} containerId - ID of the container element
     * @param {Array} datasets - Array of dataset objects with {x, y, name, strainRate} properties
     * @param {Object} options - Chart options
     */
    createStressStrainChart(containerId, datasets, options = {}) {
        const traces = datasets.map((dataset, index) => ({
            x: dataset.x,
            y: dataset.y,
            type: 'scatter',
            mode: 'lines',
            name: dataset.name || `Curve ${index + 1}`,
            line: {
                color: this.colorPalette[index % this.colorPalette.length],
                width: 2.5
            },
            hovertemplate: `<b>${dataset.name || `Curve ${index + 1}`}</b><br>` +
                          `Strain: %{x:.4f}<br>` +
                          `Stress: %{y:.2f} ${options.stressUnit || 'MPa'}<br>` +
                          `<extra></extra>`
        }));

        const layout = {
            ...this.defaultLayout,
            title: {
                text: options.title || 'Stress-Strain Curves',
                font: {
                    size: 16,
                    color: '#2c3e50'
                }
            },
            xaxis: {
                ...this.defaultLayout.xaxis,
                title: {
                    text: options.xAxisTitle || 'Strain [-]',
                    font: this.defaultLayout.xaxis.titlefont
                }
            },
            yaxis: {
                ...this.defaultLayout.yaxis,
                title: {
                    text: options.yAxisTitle || `Stress [${options.stressUnit || 'MPa'}]`,
                    font: this.defaultLayout.yaxis.titlefont
                }
            }
        };

        return Plotly.newPlot(containerId, traces, layout, this.defaultConfig);
    }

    /**
     * Create a Johnson-Cook model chart with multiple strain rates
     * @param {string} containerId - ID of the container element
     * @param {Object} parameters - Johnson-Cook parameters {A, B, n, C}
     * @param {Array} strainRates - Array of strain rates to plot
     * @param {Object} options - Chart options
     */
    createJohnsonCookChart(containerId, parameters, strainRates, options = {}) {
        const maxPlasticStrain = options.maxPlasticStrain || 0.25;
        const epsilonY = options.yieldStrain || 0.002;
        const numPoints = 200;

        const datasets = strainRates.map((rate, index) => {
            const x = [];
            const y = [];
            
            for (let i = 0; i <= numPoints; i++) {
                const plasticStrain = (maxPlasticStrain * i) / numPoints;
                const totalStrain = epsilonY + plasticStrain;
                const strainRateFactor = 1 + parameters.C * Math.log(rate / (options.referenceStrainRate || 1.0));
                const stress = parameters.A + parameters.B * Math.pow(plasticStrain, parameters.n) * strainRateFactor;
                
                x.push(plasticStrain);
                y.push(stress);
            }

            return {
                x: x,
                y: y,
                name: `ε̇ = ${rate} s⁻¹`,
                strainRate: rate
            };
        });

        return this.createStressStrainChart(containerId, datasets, {
            ...options,
            title: 'Johnson-Cook Model: Stress-Strain Curves for Different Strain Rates',
            xAxisTitle: 'Plastic Strain εᵖ [-]',
            yAxisTitle: `Stress [${options.stressUnit || 'MPa'}]`
        });
    }

    /**
     * Create a Swift's Law chart
     * @param {string} containerId - ID of the container element
     * @param {Object} parameters - Swift's Law parameters {K, n, epsilon0}
     * @param {Object} options - Chart options
     */
    createSwiftLawChart(containerId, parameters, options = {}) {
        const maxStrain = options.maxStrain || 0.5;
        const numPoints = 200;
        
        const x = [];
        const y = [];
        
        for (let i = 0; i <= numPoints; i++) {
            const strain = (maxStrain * i) / numPoints;
            const stress = parameters.K * Math.pow(parameters.epsilon0 + strain, parameters.n);
            
            x.push(strain);
            y.push(stress);
        }

        const datasets = [{
            x: x,
            y: y,
            name: "Swift's Law Curve"
        }];

        return this.createStressStrainChart(containerId, datasets, {
            ...options,
            title: "Swift's Law: Stress-Strain Curve",
            xAxisTitle: 'True Strain [-]',
            yAxisTitle: `True Stress [${options.stressUnit || 'MPa'}]`
        });
    }

    /**
     * Create a Mooney-Rivlin chart
     * @param {string} containerId - ID of the container element
     * @param {Object} parameters - Mooney-Rivlin parameters {C10, C01}
     * @param {Object} options - Chart options
     */
    createMooneyRivlinChart(containerId, parameters, options = {}) {
        const maxStretch = options.maxStretch || 3.0;
        const numPoints = 200;
        
        // Uniaxial tension
        const uniaxialX = [];
        const uniaxialY = [];
        
        // Biaxial tension
        const biaxialX = [];
        const biaxialY = [];
        
        // Pure shear
        const shearX = [];
        const shearY = [];
        
        for (let i = 1; i <= numPoints; i++) {
            const lambda = 1 + ((maxStretch - 1) * i) / numPoints;
            
            // Uniaxial tension: λ₁ = λ, λ₂ = λ₃ = 1/√λ
            const lambda2_uni = 1 / Math.sqrt(lambda);
            const I1_uni = lambda * lambda + 2 * lambda2_uni * lambda2_uni;
            const I2_uni = 2 * lambda * lambda2_uni + lambda2_uni * lambda2_uni * lambda2_uni * lambda2_uni;
            const stress_uni = 2 * (lambda - lambda2_uni * lambda2_uni) * (parameters.C10 + parameters.C01 * lambda2_uni * lambda2_uni);
            
            uniaxialX.push(lambda - 1);
            uniaxialY.push(stress_uni);
            
            // Biaxial tension: λ₁ = λ₂ = λ, λ₃ = 1/λ²
            const lambda3_bi = 1 / (lambda * lambda);
            const stress_bi = 2 * (lambda - lambda3_bi) * (parameters.C10 + parameters.C01 * lambda);
            
            biaxialX.push(lambda - 1);
            biaxialY.push(stress_bi);
            
            // Pure shear: λ₁ = λ, λ₂ = 1, λ₃ = 1/λ
            const lambda3_shear = 1 / lambda;
            const stress_shear = 2 * (lambda - lambda3_shear) * (parameters.C10 + parameters.C01);
            
            shearX.push(lambda - 1);
            shearY.push(stress_shear);
        }

        const datasets = [
            {
                x: uniaxialX,
                y: uniaxialY,
                name: 'Uniaxial Tension'
            },
            {
                x: biaxialX,
                y: biaxialY,
                name: 'Biaxial Tension'
            },
            {
                x: shearX,
                y: shearY,
                name: 'Pure Shear'
            }
        ];

        return this.createStressStrainChart(containerId, datasets, {
            ...options,
            title: 'Mooney-Rivlin Model: Stress-Strain Curves',
            xAxisTitle: 'Engineering Strain [-]',
            yAxisTitle: `Engineering Stress [${options.stressUnit || 'MPa'}]`
        });
    }

    /**
     * Create a Gibson-Ashby foam compression chart with Deshpande-Fleck hardening
     * @param {string} containerId - ID of the container element
     * @param {Object} parameters - Gibson-Ashby parameters {E_foam, sigma_pl, E_densification, hardeningCoeff}
     * @param {Object} options - Chart options
     */
    createGibsonAshbyChart(containerId, parameters, options = {}) {
        const maxStrain = options.maxStrain || 0.8; // 80% strain
        const numPoints = 200;
        const hardeningCoeff = parameters.hardeningCoeff || 0;
        
        // Calculate yield strain for continuous transition: ε_y = σ_pl/E_foam
        const yieldStrain = parameters.sigma_pl / parameters.E_foam; // in decimal form
        const densificationStrain = 0.6; // 60% strain in decimal form
        
        const x = [];
        const y = [];
        
        // Gibson-Ashby three-stage compression model with Deshpande-Fleck hardening
        for (let i = 0; i <= numPoints; i++) {
            const strain = (maxStrain * i) / numPoints;
            let stress;
            
            if (strain <= yieldStrain) {
                // Stage I: Elastic deformation
                stress = parameters.E_foam * strain;
            } else if (strain <= densificationStrain) {
                // Stage II: Plateau with Deshpande-Fleck hardening: σ(ε) = σ_pl[1 + H(ε - ε_y)]
                const strainIncrement = strain - yieldStrain;
                stress = parameters.sigma_pl * (1 + hardeningCoeff * strainIncrement);
            } else {
                // Stage III: Densification - exponential rise from hardened plateau stress
                const plateauStressAtDensification = parameters.sigma_pl * (1 + hardeningCoeff * (densificationStrain - yieldStrain));
                const epsilonRel = (strain - densificationStrain) / (maxStrain - densificationStrain);
                stress = plateauStressAtDensification * (1 + 5 * Math.pow(epsilonRel, 2));
            }
            
            x.push(strain * 100); // Convert to percentage
            y.push(stress);
        }

        const curveName = hardeningCoeff > 0 ? 
            `Gibson-Ashby + Deshpande-Fleck (H=${hardeningCoeff.toFixed(1)})` : 
            'Gibson-Ashby Compression Curve';

        const datasets = [{
            x: x,
            y: y,
            name: curveName
        }];

        // Add stage annotations
        const layout = {
            ...this.defaultLayout,
            title: {
                text: options.title || 'Gibson-Ashby Foam Compression Model',
                font: {
                    size: 16,
                    color: '#2c3e50'
                }
            },
            xaxis: {
                ...this.defaultLayout.xaxis,
                title: {
                    text: 'Strain [%]',
                    font: this.defaultLayout.xaxis.titlefont
                }
            },
            yaxis: {
                ...this.defaultLayout.yaxis,
                title: {
                    text: `Stress [${options.stressUnit || 'MPa'}]`,
                    font: this.defaultLayout.yaxis.titlefont
                }
            },
            shapes: [
                // Stage I region
                {
                    type: 'rect',
                    xref: 'x',
                    yref: 'paper',
                    x0: 0,
                    y0: 0,
                    x1: yieldStrain * 100,
                    y1: 1,
                    fillcolor: 'rgba(85, 163, 255, 0.1)',
                    line: {
                        color: 'rgba(85, 163, 255, 0.3)',
                        width: 1,
                        dash: 'dash'
                    }
                },
                // Stage II region
                {
                    type: 'rect',
                    xref: 'x',
                    yref: 'paper',
                    x0: yieldStrain * 100,
                    y0: 0,
                    x1: densificationStrain * 100,
                    y1: 1,
                    fillcolor: 'rgba(255, 167, 38, 0.1)',
                    line: {
                        color: 'rgba(255, 167, 38, 0.3)',
                        width: 1,
                        dash: 'dash'
                    }
                },
                // Stage III region
                {
                    type: 'rect',
                    xref: 'x',
                    yref: 'paper',
                    x0: densificationStrain * 100,
                    y0: 0,
                    x1: maxStrain * 100,
                    y1: 1,
                    fillcolor: 'rgba(239, 83, 80, 0.1)',
                    line: {
                        color: 'rgba(239, 83, 80, 0.3)',
                        width: 1,
                        dash: 'dash'
                    }
                }
            ],
            annotations: [
                {
                    x: (yieldStrain * 100) / 2,
                    y: 1,
                    xref: 'x',
                    yref: 'paper',
                    text: 'I: Elastic',
                    showarrow: false,
                    font: {
                        color: '#003d82',
                        size: 12
                    },
                    bgcolor: 'rgba(255,255,255,0.8)',
                    bordercolor: '#003d82',
                    borderwidth: 1
                },
                {
                    x: (yieldStrain * 100 + densificationStrain * 100) / 2,
                    y: 1,
                    xref: 'x',
                    yref: 'paper',
                    text: hardeningCoeff > 0 ? `II: Plateau (H=${hardeningCoeff.toFixed(1)})` : 'II: Plateau',
                    showarrow: false,
                    font: {
                        color: '#ef6c00',
                        size: 12
                    },
                    bgcolor: 'rgba(255,255,255,0.8)',
                    bordercolor: '#ef6c00',
                    borderwidth: 1
                },
                {
                    x: (densificationStrain * 100 + maxStrain * 100) / 2,
                    y: 1,
                    xref: 'x',
                    yref: 'paper',
                    text: 'III: Densification',
                    showarrow: false,
                    font: {
                        color: '#c62828',
                        size: 12
                    },
                    bgcolor: 'rgba(255,255,255,0.8)',
                    bordercolor: '#c62828',
                    borderwidth: 1
                }
            ]
        };

        const traces = datasets.map((dataset, index) => ({
            x: dataset.x,
            y: dataset.y,
            type: 'scatter',
            mode: 'lines',
            name: dataset.name || `Curve ${index + 1}`,
            line: {
                color: this.colorPalette[index % this.colorPalette.length],
                width: 3
            },
            hovertemplate: `<b>${dataset.name || `Curve ${index + 1}`}</b><br>` +
                          `Strain: %{x:.1f}%<br>` +
                          `Stress: %{y:.3f} ${options.stressUnit || 'MPa'}<br>` +
                          `<extra></extra>`
        }));

        return Plotly.newPlot(containerId, traces, layout, this.defaultConfig);
    }

    /**
     * Update chart with new data
     * @param {string} containerId - ID of the container element
     * @param {Array} datasets - New dataset array
     * @param {Object} options - Chart options
     */
    updateChart(containerId, datasets, options = {}) {
        const traces = datasets.map((dataset, index) => ({
            x: [dataset.x],
            y: [dataset.y],
            name: [dataset.name || `Curve ${index + 1}`],
            line: {
                color: [this.colorPalette[index % this.colorPalette.length]]
            }
        }));

        return Plotly.restyle(containerId, traces);
    }

    /**
     * Export chart as image
     * @param {string} containerId - ID of the container element
     * @param {string} filename - Output filename
     * @param {string} format - Image format (png, jpeg, svg, pdf)
     */
    exportChart(containerId, filename = 'chart', format = 'png') {
        return Plotly.downloadImage(containerId, {
            format: format,
            width: 900,
            height: 600,
            filename: filename,
            scale: 2
        });
    }

    /**
     * Resize chart to fit container
     * @param {string} containerId - ID of the container element
     */
    resizeChart(containerId) {
        return Plotly.Plots.resize(containerId);
    }

    /**
     * Check if Plotly.js is loaded
     * @returns {boolean} True if Plotly is available
     */
    isPlotlyLoaded() {
        return typeof Plotly !== 'undefined';
    }

    /**
     * Load Plotly.js from CDN if not already loaded
     * @returns {Promise} Promise that resolves when Plotly is loaded
     */
    async loadPlotly() {
        if (this.isPlotlyLoaded()) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.plot.ly/plotly-2.32.0.min.js';
            script.charset = 'utf-8';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Plotly.js'));
            document.head.appendChild(script);
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlotlyChartManager;
}