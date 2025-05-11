let gridStates = [];
let currentCell = null;
let currentGridIndex = null;

function updateOuterGrid() {
  const labelWidthInput = document.getElementById("labelWidth");
  const labelWidth = Math.max(100, parseInt(labelWidthInput.value) || 200);
  const outerGrid = document.getElementById("outerGrid");

  // Update Column 1 width
  outerGrid.style.gridTemplateColumns = `${labelWidth}px 1fr`;

  // Render outer grid
  outerGrid.innerHTML = "";
  gridStates.forEach((state, index) => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "outer-row";

    // Label cell (Column 1)
    const labelCell = document.createElement("div");
    labelCell.className = "label-cell";
    labelCell.innerHTML = `<input type="text" value="${state.label}" oninput="updateLabel(${index}, this.value)">`;
    rowDiv.appendChild(labelCell);

    // Content cell (Column 2)
    const contentCell = document.createElement("div");
    contentCell.className = "content-cell";
    contentCell.innerHTML = `
      <span class="delete-row" onclick="deleteRow(${index})">❌</span>
      <div class="flex gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">列数</label>
          <input type="number" min="1" value="${state.cols}" class="p-2 border border-gray-300 rounded-md grid-cols" data-index="${index}">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">行数</label>
          <input type="number" min="1" value="${state.rows}" class="p-2 border border-gray-300 rounded-md grid-rows" data-index="${index}">
        </div>
      </div>
      <div class="grid-container" id="grid-${index}"></div>
    `;
    rowDiv.appendChild(contentCell);

    outerGrid.appendChild(rowDiv);
    updateInnerGrid(index);
  });

  // Add input listeners
  document.querySelectorAll(".grid-cols, .grid-rows").forEach((input) => {
    input.addEventListener("input", () => {
      const index = parseInt(input.dataset.index);
      updateInnerGrid(index);
    });
  });
}

function updateLabel(index, value) {
  gridStates[index].label = value || `グリッド${index + 1}`;
}

function addRow() {
  gridStates.push({
    cols: 1,
    rows: 1,
    cells: [
      {
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        type: "blank",
        content: {},
        identifier: "component_1",
      },
    ],
    label: `グリッド${gridStates.length + 1}`,
  });
  updateOuterGrid();
}

function deleteRow(index) {
  gridStates.splice(index, 1);
  updateOuterGrid();
}

function updateInnerGrid(index) {
  const state = gridStates[index];
  const colsInput = document.querySelector(`.grid-cols[data-index="${index}"]`);
  const rowsInput = document.querySelector(`.grid-rows[data-index="${index}"]`);
  const cols = Math.max(1, parseInt(colsInput.value) || 1);
  const rows = Math.max(1, parseInt(rowsInput.value) || 1);
  const grid = document.getElementById(`grid-${index}`);

  // Update grid CSS
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${rows}, 3.2em)`;

  // Preserve existing cells
  const newCells = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const existing = state.cells.find(
        (cell) => cell.row === i + 1 && cell.col === j + 1
      );
      if (existing && i < rows && j < cols) {
        newCells.push(existing);
      }
    }
  }

  // Add new blank cells
  let componentCounter = state.cells.length + 1;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (!newCells.find((cell) => cell.row === i + 1 && cell.col === j + 1)) {
        newCells.push({
          row: i + 1,
          col: j + 1,
          rowSpan: 1,
          colSpan: 1,
          type: "blank",
          content: {},
          identifier: `component_${componentCounter++}`,
        });
      }
    }
  }

  state.cols = cols;
  state.rows = rows;
  state.cells = newCells;
  renderInnerGrid(index);
}

function renderInnerGrid(index) {
  const state = gridStates[index];
  const grid = document.getElementById(`grid-${index}`);
  grid.innerHTML = "";

  state.cells.forEach((cell) => {
    const div = document.createElement("div");
    div.className = `grid-cell ${
      cell.rowSpan > 1 || cell.colSpan > 1 ? "large" : ""
    }`;
    div.style.gridRow = `${cell.row} / span ${cell.rowSpan}`;
    div.style.gridColumn = `${cell.col} / span ${cell.colSpan}`;
    div.dataset.row = cell.row;
    div.dataset.col = cell.col;
    div.dataset.gridIndex = index;

    // Controls
    const controls = document.createElement("div");
    controls.className = "cell-controls";
    controls.innerHTML = `
      <input type="number" min="1" value="${cell.rowSpan}" class="row-span">
      <input type="number" min="1" value="${cell.colSpan}" class="col-span">
    `;
    div.appendChild(controls);

    // Actions
    const actions = document.createElement("div");
    actions.className = "cell-actions";
    actions.innerHTML = `
      <span onclick="openSelectModal(${cell.row}, ${cell.col}, ${index})" class="cursor-pointer">▼</span>
      <span onclick="openCustomizeModal(${cell.row}, ${cell.col}, ${index})" class="cursor-pointer">⚙️</span>
    `;
    div.appendChild(actions);

    // Component content
    const content = document.createElement("div");
    content.className = "component-content";
    switch (cell.type) {
      case "heading":
        content.innerHTML = `<h2>${cell.content.text || "見出し"}</h2>`;
        break;
      case "label":
        content.innerHTML = `<span>${cell.content.text || "ラベル"}</span>`;
        break;
      case "text":
        content.innerHTML = `<p>${cell.content.text || "テキスト"}</p>`;
        break;
      case "input":
        content.innerHTML = `<input type="${
          cell.content.type || "text"
        }" placeholder="${cell.content.placeholder || "入力..."}" ${
          cell.content.editable === false ? "disabled" : ""
        }>`;
        break;
      case "date":
        content.innerHTML = `<input type="date" placeholder="${
          cell.content.placeholder || "日付を選択"
        }" ${cell.content.editable === false ? "disabled" : ""}>`;
        break;
      case "dropdown":
        content.innerHTML = `<select ${
          cell.content.editable === false ? "disabled" : ""
        }>${(cell.content.options || ["オプション1", "オプション2"])
          .map((opt) => `<option>${opt}</option>`)
          .join("")}</select>`;
        break;
      case "checkbox":
        content.innerHTML = `<label><input type="checkbox" ${
          cell.content.editable === false ? "disabled" : ""
        }> ${cell.content.label || "チェックボックス"}</label>`;
        break;
      case "textarea":
        content.innerHTML = `<textarea placeholder="${
          cell.content.placeholder || "テキスト..."
        }" ${cell.content.editable === false ? "disabled" : ""}></textarea>`;
        break;
      case "table":
        const rows = parseInt(cell.content.rows || 2);
        const cols = parseInt(cell.content.cols || 3);
        content.innerHTML = `<table><tr>${(
          cell.content.headers || Array(cols).fill("ヘッダー")
        )
          .map((h) => `<th>${h}</th>`)
          .join("")}</tr>${Array(rows - 1)
          .fill()
          .map(
            () =>
              `<tr>${Array(cols)
                .fill()
                .map(
                  () =>
                    `<td><input type="text" placeholder="${
                      cell.content.placeholders?.shift() || ""
                    }" ${
                      cell.content.editable === false ? "disabled" : ""
                    }></td>`
                )
                .join("")}</tr>`
          )
          .join("")}</table>`;
        break;
      case "blank":
        content.innerHTML = "<div>空白</div>";
        break;
    }
    div.appendChild(content);
    grid.appendChild(div);
  });

  // Add span input listeners
  document
    .querySelectorAll(`#grid-${index} .row-span, #grid-${index} .col-span`)
    .forEach((input) => {
      input.addEventListener("input", () => {
        const div = input.closest(".grid-cell");
        const row = parseInt(div.dataset.row);
        const col = parseInt(div.dataset.col);
        const gridIndex = parseInt(div.dataset.gridIndex);
        const cols = Math.max(
          1,
          parseInt(
            document.querySelector(`.grid-cols[data-index="${gridIndex}"]`)
              .value
          ) || 1
        );
        const rows = Math.max(
          1,
          parseInt(
            document.querySelector(`.grid-rows[data-index="${gridIndex}"]`)
              .value
          ) || 1
        );
        currentCell = gridStates[gridIndex].cells.find(
          (c) => c.row === row && c.col === col
        );
        currentCell.rowSpan = Math.max(
          1,
          parseInt(div.querySelector(".row-span").value) || 1
        );
        currentCell.colSpan = Math.max(
          1,
          parseInt(div.querySelector(".col-span").value) || 1
        );
        currentCell.rowSpan = Math.min(currentCell.rowSpan, rows - row + 1);
        currentCell.colSpan = Math.min(currentCell.colSpan, cols - col + 1);
        renderInnerGrid(gridIndex);
        currentCell = null;
      });
    });
}

function openSelectModal(row, col, gridIndex) {
  currentCell = gridStates[gridIndex].cells.find(
    (c) => c.row === row && c.col === col
  );
  currentGridIndex = gridIndex;
  document.getElementById("selectModal").style.display = "flex";
}

function openCustomizeModal(row, col, gridIndex) {
  currentCell = gridStates[gridIndex].cells.find(
    (c) => c.row === row && c.col === col
  );
  currentGridIndex = gridIndex;
  const form = document.getElementById("customizeForm");
  form.innerHTML = `
    <input id="customIdentifier" type="text" value="${currentCell.identifier}" class="p-2 border rounded w-full mb-2" placeholder="識別子 (例: product_info)">
  `;
  const type = currentCell.type;

  if (type === "heading" || type === "label" || type === "text") {
    form.innerHTML += `<input id="customText" type="text" value="${
      currentCell.content.text || ""
    }" class="p-2 border rounded w-full mb-2" placeholder="${
      type === "heading"
        ? "見出しテキスト"
        : type === "label"
        ? "ラベルテキスト"
        : "テキスト"
    }">`;
  } else if (type === "input" || type === "date") {
    form.innerHTML += `
      <input id="customPlaceholder" type="text" value="${
        currentCell.content.placeholder || ""
      }" class="p-2 border rounded w-full mb-2" placeholder="プレースホルダー">
      <select id="customType" class="p-2 border rounded w-full mb-2">
        <option value="text" ${
          currentCell.content.type === "text" ? "selected" : ""
        }>テキスト</option>
        <option value="number" ${
          currentCell.content.type === "number" ? "selected" : ""
        }>数値</option>
        ${type === "date" ? `<option value="date" selected>日付</option>` : ""}
      </select>
      <label class="flex items-center mb-2"><input type="checkbox" id="customEditable" class="mr-2" ${
        currentCell.content.editable !== false ? "checked" : ""
      }> 編集可能</label>
    `;
  } else if (type === "dropdown") {
    form.innerHTML += `
      <textarea id="customOptions" class="p-2 border rounded w-full mb-2" placeholder="オプション（1行に1つ）">${(
        currentCell.content.options || []
      ).join("\n")}</textarea>
      <label class="flex items-center mb-2"><input type="checkbox" id="customEditable" class="mr-2" ${
        currentCell.content.editable !== false ? "checked" : ""
      }> 編集可能</label>
    `;
  } else if (type === "checkbox") {
    form.innerHTML += `
      <input id="customLabel" type="text" value="${
        currentCell.content.label || ""
      }" class="p-2 border rounded w-full mb-2" placeholder="ラベル">
      <label class="flex items-center mb-2"><input type="checkbox" id="customEditable" class="mr-2" ${
        currentCell.content.editable !== false ? "checked" : ""
      }> 編集可能</label>
    `;
  } else if (type === "textarea") {
    form.innerHTML += `
      <input id="customPlaceholder" type="text" value="${
        currentCell.content.placeholder || ""
      }" class="p-2 border rounded w-full mb-2" placeholder="プレースホルダー">
      <label class="flex items-center mb-2"><input type="checkbox" id="customEditable" class="mr-2" ${
        currentCell.content.editable !== false ? "checked" : ""
      }> 編集可能</label>
    `;
  } else if (type === "table") {
    form.innerHTML += `
      <input id="customRows" type="number" min="1" value="${
        currentCell.content.rows || 2
      }" class="p-2 border rounded w-full mb-2" placeholder="行数">
      <input id="customCols" type="number" min="1" value="${
        currentCell.content.cols || 3
      }" class="p-2 border rounded w-full mb-2" placeholder="列数">
      <textarea id="customHeaders" class="p-2 border rounded w-full mb-2" placeholder="ヘッダー（1行に1つ）">${(
        currentCell.content.headers || []
      ).join("\n")}</textarea>
      <textarea id="customPlaceholders" class="p-2 border rounded w-full mb-2" placeholder="プレースホルダー（1行に1つ）">${(
        currentCell.content.placeholders || []
      ).join("\n")}</textarea>
      <label class="flex items-center mb-2"><input type="checkbox" id="customEditable" class="mr-2" ${
        currentCell.content.editable !== false ? "checked" : ""
      }> 編集可能</label>
    `;
  }
  document.getElementById("customizeModal").style.display = "flex";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
  currentCell = null;
  currentGridIndex = null;
}

function applyComponent() {
  if (!currentCell) return;
  const type = document.getElementById("componentType").value;
  currentCell.type = type;
  currentCell.content = {};
  currentCell.identifier = `component_${
    gridStates[currentGridIndex].cells.filter((c) => c.type === type).length + 1
  }`;
  renderInnerGrid(currentGridIndex);
  closeModal("selectModal");
}

function applyCustomization() {
  if (!currentCell) return;
  const type = currentCell.type;
  currentCell.identifier =
    document.getElementById("customIdentifier").value || currentCell.identifier;
  if (type === "heading" || type === "label" || type === "text") {
    currentCell.content.text = document.getElementById("customText").value;
  } else if (type === "input" || type === "date") {
    currentCell.content.placeholder =
      document.getElementById("customPlaceholder").value;
    currentCell.content.type = document.getElementById("customType").value;
    currentCell.content.editable =
      document.getElementById("customEditable").checked;
  } else if (type === "dropdown") {
    currentCell.content.options = document
      .getElementById("customOptions")
      .value.split("\n")
      .filter((opt) => opt.trim());
    currentCell.content.editable =
      document.getElementById("customEditable").checked;
  } else if (type === "checkbox") {
    currentCell.content.label = document.getElementById("customLabel").value;
    currentCell.content.editable =
      document.getElementById("customEditable").checked;
  } else if (type === "textarea") {
    currentCell.content.placeholder =
      document.getElementById("customPlaceholder").value;
    currentCell.content.editable =
      document.getElementById("customEditable").checked;
  } else if (type === "table") {
    currentCell.content.rows = document.getElementById("customRows").value;
    currentCell.content.cols = document.getElementById("customCols").value;
    currentCell.content.headers = document
      .getElementById("customHeaders")
      .value.split("\n")
      .filter((h) => h.trim());
    currentCell.content.placeholders = document
      .getElementById("customPlaceholders")
      .value.split("\n")
      .filter((p) => p.trim());
    currentCell.content.editable =
      document.getElementById("customEditable").checked;
  }
  renderInnerGrid(currentGridIndex);
  closeModal("customizeModal");
}

function saveLayout() {
  try {
    const json = {
      data_tables: gridStates.flatMap((state, gridIndex) => {
        // Track occupied cells and their primary cells
        const occupied = new Map();
        state.cells.forEach((cell) => {
          for (let i = cell.row; i < cell.row + cell.rowSpan; i++) {
            for (let j = cell.col; j < cell.col + cell.colSpan; j++) {
              const key = `${i}-${j}`;
              if (
                !occupied.has(key) ||
                cell.rowSpan * cell.colSpan >
                  occupied.get(key).rowSpan * occupied.get(key).colSpan
              ) {
                occupied.set(key, cell);
              }
            }
          }
        });

        // Filter out overlapped cells
        const visibleCells = state.cells.filter((cell) => {
          for (let i = cell.row; i < cell.row + cell.rowSpan; i++) {
            for (let j = cell.col; j < cell.col + cell.colSpan; j++) {
              if (occupied.get(`${i}-${j}`) === cell) {
                return true;
              }
            }
          }
          return false;
        });

        return visibleCells.map((cell) => ({
          見出し: state.label,
          コンポーネント: {
            タイプ: cell.type,
            識別子: cell.identifier,
            グリッド: {
              row: cell.row,
              col: cell.col,
              rowSpan: cell.rowSpan,
              colSpan: cell.colSpan,
            },
            ...(cell.type === "table"
              ? {
                  列: (cell.content.headers || []).map((h, i) => ({
                    名前: `col_${i}`,
                    ラベル: h,
                    タイプ: "テキスト",
                    編集可能: cell.content.editable !== false,
                  })),
                  行: Array(parseInt(cell.content.rows || 2))
                    .fill()
                    .map((_, i) =>
                      Array(cell.content.headers?.length || 3).fill({
                        値: i === 0 ? `例）データ` : "",
                      })
                    ),
                }
              : {
                  値:
                    cell.content.text ||
                    cell.content.placeholder ||
                    cell.content.label ||
                    "例）データ",
                  編集可能: cell.content.editable !== false,
                  ...(cell.type === "dropdown"
                    ? { オプション: cell.content.options || [] }
                    : {}),
                }),
          },
          ノート: {
            タイプ: "テキストエリア",
            名前: `ノート_${cell.identifier}`,
            ラベル: "ノート",
            値: "",
            編集可能: true,
          },
        }));
      }),
      アクション: [
        {
          タイプ: "ボタン",
          名前: "提出",
          ラベル: "完了",
          アクション: "提出_フォーム",
        },
      ],
    };

    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to save layout:", error);
    alert("テンプレートの保存に失敗しました。コンソールを確認してください。");
  }
}

// Initialize grid and listeners
document
  .getElementById("labelWidth")
  .addEventListener("input", updateOuterGrid);
document.getElementById("addRow").addEventListener("click", addRow);
document.getElementById("save").addEventListener("click", saveLayout);
addRow();
