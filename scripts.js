/**
 * Formats mat_data and eos_data as a two-column table layout.
 * @param {object} dataObj - The data object (mat_data or eos_data).
 * @param {string} sectionName - The section name for the heading.
 * @return {string} HTML representing a two-column table of the data object.
 */
function formatDataSectionAsTable(dataObj, sectionName) {
    if (!dataObj || Object.keys(dataObj).length === 0) return ''; // Return empty string if no data

    let detailsHtml = `<div style="padding: 10px; border-top: 1px solid #e2e8f0;">
        <strong>${sectionName}:</strong>
        <table style="width: 100%; margin-top: 10px; border-collapse: collapse;">
    `;

    // Loop through data entries and add them in two columns
    const entries = Object.entries(dataObj);
    for (let i = 0; i < entries.length; i += 2) {
        detailsHtml += '<tr>';
        
        // Add first cell
        const [key1, value1] = entries[i];
        detailsHtml += `<td style="padding: 5px; border-bottom: 1px solid #e2e8f0;"><strong>${key1}:</strong> ${value1}</td>`;
        
        // Add second cell if it exists
        if (i + 1 < entries.length) {
            const [key2, value2] = entries[i + 1];
            detailsHtml += `<td style="padding: 5px; border-bottom: 1px solid #e2e8f0;"><strong>${key2}:</strong> ${value2}</td>`;
        } else {
            detailsHtml += '<td></td>'; // Empty cell if no second item
        }

        detailsHtml += '</tr>';
    }
    detailsHtml += '</table></div>';
    return detailsHtml;
}

/**
 * Loads and displays materials data with expandable rows for mat_data, eos_data, and reference.
 * Fetches YAML data and initializes DataTable.
 */
async function loadMaterials() {
    try {
        document.getElementById('loading').style.display = 'block';
        
        const response = await fetch('materials.yaml');
        const yamlText = await response.text();
        const materials = jsyaml.load(yamlText);

        // Prepare data for table
        const tableData = materials.map(material => [
            '<span class="expand-icon">▶</span>',  // Expand icon
            material.mat_id,
            material.mat,
            material.eos || '-',
            material.app.join(', '),
            formatDate(material.add),
            material // Store entire material object as hidden data
        ]);

        // Initialize DataTable with row expansion
        const table = $('#materials-table').DataTable({
            data: tableData,
            columns: [
                { title: "" },
                { title: "Material ID" },
                { title: "Material" },
                { title: "EOS" },
                { title: "Applications" },
                { title: "Added" },
                { visible: false } // Hidden column for material object storage
            ],
            order: [[1, 'asc']],
            pageLength: 10,
            responsive: true,
            language: {
                search: "Search:",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                infoEmpty: "Showing 0 to 0 of 0 entries",
                infoFiltered: "(filtered from _MAX_ total entries)",
                paginate: { first: "First", last: "Last", next: "Next", previous: "Previous" }
            }
        });

        // Row click handler for expanding additional data
        $('#materials-table tbody').on('click', 'tr', function (event) {
            if ($(event.target).hasClass('expand-icon')) {
                const tr = $(this);
                const row = table.row(tr);

                if (row.child.isShown()) {
                    row.child.hide();
                    tr.removeClass('shown');
                    tr.find('.expand-icon').text('▶');
                } else {
                    const material = row.data()[6]; // Get material object from hidden column
                    const matDataHtml = formatDataSectionAsTable(material.mat_data, 'Material Data');
                    const eosDataHtml = formatDataSectionAsTable(material.eos_data, 'EOS Data');
                    const referenceHtml = `<div style="padding: 10px; border-top: 1px solid #e2e8f0; text-align: center;">
                        <strong>Reference:</strong> <a href="${material.url}" class="url-link" target="_blank">${material.ref}</a>
                    </div>`;
                    
                    // Show mat_data and eos_data as a two-column table with reference at the bottom
                    row.child(matDataHtml + eosDataHtml + referenceHtml).show();
                    tr.addClass('shown');
                    tr.find('.expand-icon').text('▼');
                }
            }
        });
    } catch (error) {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = 'Error loading materials: ' + error.message;
        errorElement.style.display = 'block';
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Start data loading on page load
window.addEventListener('load', loadMaterials);
