// Загружаем материалы из YAML-файла
async function loadMaterials() {
  try {
    document.getElementById("loading").style.display = "block";

    // Загружаем YAML-файл
    const response = await fetch("materials.yaml");

    if (!response.ok) {
      throw new Error(`Failed to fetch the file. Status: ${response.status} ${response.statusText}`);
    }

    const yamlText = await response.text();

    // Парсим YAML
    let materials;
    try {
      materials = jsyaml.load(yamlText);
    } catch (yamlError) {
      throw new Error(`YAML parsing error: ${yamlError.message}`);
    }

    if (!Array.isArray(materials) || materials.length === 0) {
      throw new Error("YAML file does not contain a valid array of materials.");
    }

    // Формируем данные таблицы
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
        formatDate(material.add),
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
        { visible: false },
      ],
      order: [[0, "asc"]],
      pageLength: 10,
    });

    // Обработка кликов для разворачивания строк
    $("#materials-table tbody").on("click", "tr", function () {
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
        const matDataHtml = createCodeBlock("*MAT", material.mat_data);
        const eosDataHtml = createCodeBlock("*EOS", material.eos_data);
        const referenceHtml = material.ref
          ? `<div class="reference-block"><strong>Reference:</strong><a href="${material.url}" target="_blank">${material.ref}</a></div>`
          : '<div class="reference-block"><strong>Reference:</strong> No reference available</div>';

        row.child(
          `${referenceHtml}<pre>${material.mat_data || "No MAT data available"}</pre><pre>${material.eos_data || "No EOS data available"}</pre>`
        ).show();
        tr.addClass("shown");
      }
    });

    console.log("Materials successfully loaded:", materials);
  } catch (error) {
    document.getElementById("error-message").textContent = `An error occurred: ${error.message}`;
    console.error("Error details:", error);
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}

// Форматирование даты в формате DD.MM.YYYY
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Загрузка материалов при открытии страницы
window.addEventListener("load", loadMaterials);
