async function loadMaterials() {
  try {
    document.getElementById("loading").style.display = "block";

    const response = await fetch("materials.yaml");
    const yamlText = await response.text();
    const materials = jsyaml.load(yamlText);

    const tableData = materials.map(({ material }) => [
      `<div><strong>ID:</strong> ${material.id}</div>
       <div><strong>MAT:</strong> ${material.mat}</div>`,
      material.eos || "-",
      `<ul>${material.app.map((app) => `<li>${app}</li>`).join("")}</ul>`,
      material.add,
      material
    ]);

    const table = $("#materials-table").DataTable({
      data: tableData,
      columns: [
        { title: "Material Model" },
        { title: "EOS" },
        { title: "Applications" },
        { title: "Added" },
        { visible: false }
      ]
    });

    $("#materials-table tbody").on("click", "tr", function (event) {
      const tr = $(this);
      const row = table.row(tr);
      const material = row.data()[4];

      const matDataHtml = `<pre>${material.mat_data}</pre>`;
      const eosDataHtml = material.eos_data ? `<pre>${material.eos_data}</pre>` : "";
      const referenceHtml = `<a href="${material.url}" target="_blank">${material.ref}</a>`;

      if (row.child.isShown()) {
        row.child.hide();
        tr.removeClass("shown");
      } else {
        row.child(
          `<div><strong>Reference:</strong> ${referenceHtml}</div>
           ${matDataHtml}${eosDataHtml}`
        ).show();
        tr.addClass("shown");
      }
    });
  } catch (error) {
    document.getElementById("error-message").textContent = "Error loading data";
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}

window.addEventListener("load", loadMaterials);
