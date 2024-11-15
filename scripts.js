async function loadMaterials() {
  try {
    document.getElementById("loading").style.display = "block";

    // Попытка загрузки YAML-файла
    const response = await fetch("materials.yaml");

    if (!response.ok) {
      throw new Error(
        `Failed to fetch the file. Status: ${response.status} ${response.statusText}`
      );
    }

    const yamlText = await response.text();

    // Попытка парсинга YAML
    let materials;
    try {
      materials = jsyaml.load(yamlText);
    } catch (yamlError) {
      throw new Error(`YAML parsing error: ${yamlError.message}`);
    }

    if (!Array.isArray(materials) || materials.length === 0) {
      throw new Error("YAML file does not contain a valid array of materials.");
    }

    // Формирование данных таблицы
    const tableData = materials.map(({ material }) => {
      if (!material || typeof material !== "object") {
        console.warn("Invalid material format", material);
        return ["Invalid data", "-", "-", "-", null];
      }
      return [
        `<div><strong>ID:</strong> ${material.id || "N/A"}</div>
         <div><strong>MAT:</strong> ${material.mat || "N/A"}</div>`,
        material.eos || "-",
        `<ul>${(material.app || [])
          .map((app) => `<li>${app}</li>`)
          .join("")}</ul>`,
        material.add || "N/A",
        material,
      ];
    });

    // Инициализация DataTable
    const table = $("#materials-table").DataTable({
      data: tableData,
      columns: [
        { title: "Material Model" },
        { title: "EOS" },
        { title: "Applications" },
        { title: "Added" },
        { visible: false }, // Скрытый столбец
      ],
      order: [[0, "asc"]],
      pageLength: 10,
      responsive: true,
      language: {
        search: "Search:",
        lengthMenu: "Show _MENU_ entries",
        info: "Showing _START_ to _END_ of _TOTAL_ entries",
        infoEmpty: "Showing 0 to 0 of 0 entries",
        infoFiltered: "(filtered from _MAX_ total entries)",
        paginate: { first: "First", last: "Last", next: "Next", previous: "Previous" },
      },
    });

    // Обработка кликов для разворачивания строк
    $("#materials-table tbody").on("click", "tr", function (event) {
      const tr = $(this);
      const row = table.row(tr);
      const material = row.data()[4];

      if (!material) {
        console.warn("No material data available for row:", row.data());
        return;
      }

      if (row.child.isShown()) {
        row.child.hide();
        tr.removeClass("shown");
      } else {
        const matDataHtml = `<pre>${material.mat_data || "No material data available"}</pre>`;
        const eosDataHtml = material.eos_data
          ? `<pre>${material.eos_data}</pre>`
          : "";
        const referenceHtml = material.ref
          ? `<a href="${material.url}" target="_blank">${material.ref}</a>`
          : "No reference available";

        row.child(
          `<div><strong>Reference:</strong> ${referenceHtml}</div>
           ${matDataHtml}${eosDataHtml}`
        ).show();
        tr.addClass("shown");
      }
    });

    // Лог успешной загрузки
    console.log("Materials successfully loaded:", materials);
  } catch (error) {
    // Расширенное сообщение об ошибке
    const errorElement = document.getElementById("error-message");
    errorElement.textContent = `An error occurred: ${error.message}`;
    errorElement.style.display = "block";

    // Дополнительный вывод для разработчиков
    console.error("Error details:", error);
  } finally {
    // Скрытие индикатора загрузки
    document.getElementById("loading").style.display = "none";
  }
}

// Запуск загрузки данных при загрузке страницы
window.addEventListener("load", loadMaterials);
