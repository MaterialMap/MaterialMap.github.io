/**
 * Formats a date string to DD/MM/YYYY format.
 * @param {string} dateString - ISO date string.
 * @return {string} Formatted date.
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Formats the mat_id and mat to display in a single Material column.
 * @param {string} matId - Material ID.
 * @param {string} mat - Material name.
 * @return {string} HTML for Material column with mat_id and mat on separate lines.
 */
function formatMaterialColumn(matId, mat) {
    return `<div><strong>ID:</strong> ${matId}</div><div><strong>Name:</strong> ${mat}</div>`;
}

/**
 * Formats the app array as a list for display in the Applications column.
 * @param {Array} appList - Array of applications.
 * @return {string} HTML for applications formatted as a list.
 */
function formatApplications(appList) {
    if (!appList || appList.length === 0) return '-';
    return appList.map(app => `<div>${app}</div>`).join('');
}

/**
 * Formats mat_data as a single row for display.
 * @param {object} matData - Material data object.
 * @return {string} HTML for mat_data row.
 */
function formatMatDataRow(matData) {
    if (!matData || Object.keys(matData).length === 0) return '';
    
    let matDataHtml = `<tr><td colspan="5" style="padding: 10px; border-top: 1px solid #e2e8f0;">
        <strong>Material Data:</strong><br>`;
    for (const [key, value] of Object.entries(matData)) {
        matDataHtml += `<strong>${key}:</strong> ${value}<br>`;
    }
    matDataHtml += '</td></tr>';
    return matDataHtml;
}

/**
 * Formats eos_data as a single row for display.
 * @param {object} eosData - EOS data object.
 * @return {string} HTML for eos_data row.
 */
function formatEosDataRow(eosData) {
    if (!eosData || Object.keys(eosData).length === 0) return '';
    
    let eosDataHtml = `<tr><td colspan="5" style="padding: 10px; border-top: 1px solid #e2e8f0;">
        <strong>EOS Data:</strong><br>`;
    for (const [key, value] of Object.entries(eosData)) {
        eosDataHtml += `<strong>${key}:</strong> ${value}<br>`;
    }
    eosDataHtml += '</td></tr>';
    return eosDataHtml;
}

/**
 * Formats the reference as a single row spanning the table.
 * @param {string} url - URL of the reference.
 * @param {string} ref - Reference text.
 * @return {string} HTML for a single-row reference spanning the table width.
 */
function formatReferenceRow(url, ref) {
    return `<tr>
                <td colspan="5" style="padding: 10px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <strong>Reference:</strong> <a href="${url}" class="url-link" target="_blank">${ref}</a>
                </td>
            </tr>`;
}

/**
 * Loads and displays materials data with expandable rows for mat_data, eos_data, and reference.
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
            formatMaterialColumn(material.mat_id, material.mat), // Combine mat_id and mat in one column
            material.eos || '-',
            formatApplications(material.app), // Format applications as a list
            formatDate(material.add),
            material // Store entire material object as hidden data
        ]);

        // Initialize DataTable with row expansion
        const table = $('#materials-table').DataTable({
            data: tableData,
            columns: [
                { title: "" },
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
                    const material = row.data()[5]; // Get material object from hidden column
                    const matDataHtml = formatMatDataRow(material.mat_data);
                    const eosDataHtml = formatEosDataRow(material.eos_data);
                    const referenceHtml = formatReferenceRow(material.url, material.ref);
                    
                    // Show mat_data, eos_data, and reference each in their own row
                    const expandedRowHtml = `<table style="width: 100%;">${matDataHtml}${eosDataHtml}${referenceHtml}</table>`;
                    
                    row.child(expandedRowHtml).show();
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
window.addEventListener('load', loadMaterials);s