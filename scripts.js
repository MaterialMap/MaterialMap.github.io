/**
 * Форматирует дату в формат DD/MM/YYYY
 * @param {string} dateString - строка с датой в ISO формате
 * @return {string} отформатированная дата
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
 * Загружает и отображает данные о материалах
 * Получает данные в YAML формате и инициализирует DataTable
 */
async function loadMaterials() {
    try {
        document.getElementById('loading').style.display = 'block';
        
        const response = await fetch('materials.yaml');
        const yamlText = await response.text();
        const materials = jsyaml.load(yamlText);

        // Подготовка данных для таблицы, включая ссылку в Reference
        const tableData = materials.map(material => [
            material.mat_id,
            material.mat_name,
            material.eos || '-',
            material.app.join(', '),
            `<a href="${material.url}" class="url-link" target="_blank">${material.ref}</a>`,
            formatDate(material.add)
        ]);

        // Инициализация DataTable
        $('#materials-table').DataTable({
            data: tableData,
            order: [[0, 'asc']],
            pageLength: 25,
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
    } catch (error) {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = 'Error loading materials: ' + error.message;
        errorElement.style.display = 'block';
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Запуск загрузки данных при загрузке страницы
window.addEventListener('load', loadMaterials);
