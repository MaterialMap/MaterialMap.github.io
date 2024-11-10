// Закрытие меню-бутерброда после нажатия на ссылку
document.querySelectorAll(".menu a").forEach((link) => {
  link.addEventListener("click", () => {
    document.getElementById("menu-toggle").checked = false;
  });
});

/**
 * Форматирует строку даты в формат DD/MM/YYYY.
 * @param {string} dateString - Дата в формате ISO.
 * @return {string} Форматированная дата.
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Форматирует столбец с ID и названием материала.
 * @param {string} matId - ID материала.
 * @param {string} mat - Название материала.
 * @return {string} HTML-код для отображения.
 */
function formatMaterialColumn(matId, mat) {
  return `<div><strong>ID:</strong> ${matId}</div><div><strong>Name:</strong> ${mat}</div>`;
}

/**
 * Форматирует список применений для отображения в столбце.
 * @param {Array} appList - Массив применений.
 * @return {string} HTML для отображения списка.
 */
function formatApplications(appList) {
  if (!appList || appList.length === 0) return "-";
  return appList.map((app) => `<div>${app}</div>`).join("");
}

/**
 * Форматирует строку с данными материала для отображения.
 * @param {object} matData - Объект с данными материала.
 * @return {string} HTML для отображения данных.
 */
function formatMatDataRow(matData) {
  if (!matData || Object.keys(matData).length === 0) return "";

  let matDataHtml = `<tr><td colspan="5" style="padding: 10px; border-top: 1px solid #e2e8f0;">
        <strong>Material Data:</strong><br>`;
  for (const [key, value] of Object.entries(matData)) {
    matDataHtml += `<strong>${key}:</strong> ${value}<br>`;
  }
  matDataHtml += "</td></tr>";
  return matDataHtml;
}

/**
 * Форматирует строку данных EOS для отображения.
 * @param {object} eosData - Объект с данными EOS.
 * @return {string} HTML для отображения EOS.
 */
function formatEosDataRow(eosData) {
  if (!eosData || Object.keys(eosData).length === 0) return "";

  let eosDataHtml = `<tr><td colspan="5" style="padding: 10px; border-top: 1px solid #e2e8f0;">
        <strong>EOS Data:</strong><br>`;
  for (const [key, value] of Object.entries(eosData)) {
    eosDataHtml += `<strong>${key}:</strong> ${value}<br>`;
  }
  eosDataHtml += "</td></tr>";
  return eosDataHtml;
}

/**
 * Форматирует ссылку на источник для отображения.
 * @param {string} url - URL источника.
 * @param {string} ref - Текст ссылки.
 * @return {string} HTML для отображения ссылки.
 */
function formatReferenceRow(url, ref) {
  return `<tr>
                <td colspan="5" style="padding: 10px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <strong>Reference:</strong> <a href="${url}" class="url-link" target="_blank">${ref}</a>
                </td>
            </tr>`;
}

/**
 * Загружает и отображает данные материалов с возможностью расширения строк для mat_data, eos_data и reference.
 */
async function loadMaterials() {
  try {
    document.getElementById("loading").style.display = "block";

    const response = await fetch("materials.yaml");
    const yamlText = await response.text();
    const materials = jsyaml.load(yamlText);

    // Подготовка данных для таблицы
    const tableData = materials.map((material) => [
      '<span class="expand-icon">▶</span>', // Иконка для раскрытия
      formatMaterialColumn(material.mat_id, material.mat), // Объединение mat_id и mat в один столбец
      material.eos || "-",
      formatApplications(material.app), // Форматирование списка применений
      formatDate(material.add),
      material, // Сохранение объекта материала в скрытом столбце
    ]);

    // Инициализация DataTable с возможностью раскрытия строк
    const table = $("#materials-table").DataTable({
      data: tableData,
      columns: [
        { title: "" },
        { title: "Material" },
        { title: "EOS" },
        { title: "Applications" },
        { title: "Added" },
        { visible: false }, // Скрытый столбец для хранения объекта материала
      ],
      order: [[1, "asc"]],
      pageLength: 10,
      responsive: true,
      language: {
        search: "Search:",
        lengthMenu: "Show _MENU_ entries",
        info: "Showing _START_ to _END_ of _TOTAL_ entries",
        infoEmpty: "Showing 0 to 0 of 0 entries",
        infoFiltered: "(filtered from _MAX_ total entries)",
        paginate: {
          first: "First",
          last: "Last",
          next: "Next",
          previous: "Previous",
        },
      },
    });

    // Обработчик для раскрытия дополнительных данных при клике на строку
    $("#materials-table tbody").on("click", "tr", function (event) {
      if ($(event.target).hasClass("expand-icon")) {
        const tr = $(this);
        const row = table.row(tr);

        if (row.child.isShown()) {
          row.child.hide();
          tr.removeClass("shown");
          tr.find(".expand-icon").text("▶");
        } else {
          const material = row.data()[5]; // Получение объекта материала из скрытого столбца
          const matDataHtml = formatMatDataRow(material.mat_data);
          const eosDataHtml = formatEosDataRow(material.eos_data);
          const referenceHtml = formatReferenceRow(material.url, material.ref);

          // Показ mat_data, eos_data и reference в отдельных строках
          const expandedRowHtml = `<table style="width: 100%;">${matDataHtml}${eosDataHtml}${referenceHtml}</table>`;

          row.child(expandedRowHtml).show();
          tr.addClass("shown");
          tr.find(".expand-icon").text("▼");
        }
      }
    });
  } catch (error) {
    const errorElement = document.getElementById("error-message");
    errorElement.textContent = "Error loading materials: " + error.message;
    errorElement.style.display = "block";
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}

// Начало загрузки данных при загрузке страницы
window.addEventListener("load", loadMaterials);
