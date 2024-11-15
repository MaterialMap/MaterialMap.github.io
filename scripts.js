async function loadMaterials() {
  try {
    document.getElementById("loading").style.display = "block";

    // Загружаем YAML
    const response = await fetch("materials.yaml");

    if (!response.ok) {
      throw new Error(
        `Failed to fetch the file. Status: ${response.status} ${response.statusText}`
      );
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
        { visible: false },
      ],
      order: [[0, "asc"]],
      pageLength: 10,
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
        const createCodeBlock = (title, content) => {
          if (!content) return "";
          const highlightedContent = highlightCode(content);
          return `
            <div class="code-block">
              <div class="code-header">
                <strong>${title}</strong>
                <button onclick="copyToClipboard('${encodeURIComponent(
                  content
                )}')">Copy</button>
              </div>
              <pre><code>${highlightedContent}</code></pre>
            </div>`;
        };

        const matDataHtml = createCodeBlock("*MAT", material.mat_data);
        const eosDataHtml = createCodeBlock("*EOS", material.eos_data);
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

    console.log("Materials successfully loaded:", materials);
  } catch (error) {
    document.getElementById("error-message").textContent = `An error occurred: ${error.message}`;
    console.error("Error details:", error);
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}

// Подсветка синтаксиса
function highlightCode(content) {
  const commentRegex = /^\s*\$(?!#).*/gm; // Строки с комментариями, начинающимися с $
  const specialCommentRegex = /^\s*\$#.*$/gm; // Строки с комментариями, начинающимися с $#
  const keywordRegex = /^\s*\*.+$/gm; // Строки с ключевыми словами, начинающимися с *
  return content
    .replace(commentRegex, (match) => `<span class="comment">${match}</span>`)
    .replace(
      specialCommentRegex,
      (match) => `<span class="special-comment">${match}</span>`
    )
    .replace(
      keywordRegex,
      (match) => `<strong class="keyword">${match}</strong>`
    );
}

// Копирование текста в буфер обмена
function copyToClipboard(content) {
  const decodedContent = decodeURIComponent(content);
  navigator.clipboard
    .writeText(decodedContent)
    .then(() => alert("Copied to clipboard!"))
    .catch((err) => alert("Failed to copy: " + err));
}

window.addEventListener("load", loadMaterials);
