let currentCell = null;
let gridState = [];

function updateGrid() {
  const colsInput = document.getElementById("cols");
  const rowsInput = document.getElementById("rows");
  const cols = Math.max(1, parseInt(colsInput.value) || 1);
  const rows = Math.max(1, parseInt(rowsInput.value) || 1);
  const grid = document.getElementById("grid");

  // Update grid CSS
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${rows}, 3.2em)`; // 50px - height of rows

  // Preserve existing components
  const newState = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const existing = gridState.find(
        (cell) => cell.row === i + 1 && cell.col === j + 1
      );
      if (existing && i < rows && j < cols) {
        newState.push(existing);
      }
    }
  }

  // Add new blank cells if needed
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (!newState.find((cell) => cell.row === i + 1 && cell.col === j + 1)) {
        newState.push({
          row: i + 1,
          col: j + 1,
          rowSpan: 1,
          colSpan: 1,
          type: "blank",
          content: {},
        });
      }
    }
  }

  gridState = newState;
  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  gridState.forEach((cell) => {
    const div = document.createElement("div");
    div.className = `grid-cell ${
      cell.rowSpan > 1 || cell.colSpan > 1 ? "large" : ""
    }`;
    div.style.gridRow = `${cell.row} / span ${cell.rowSpan}`;
    div.style.gridColumn = `${cell.col} / span ${cell.colSpan}`;
    div.dataset.row = cell.row;
    div.dataset.col = cell.col;

    // Controls
    const controls = document.createElement("div");
    controls.className = "cell-controls";
    controls.innerHTML = `
      <input type="number" min="1" max="6" value="${cell.rowSpan}" class="row-span">
      <input type="number" min="1" max="6" value="${cell.colSpan}" class="col-span">
    `;
    div.appendChild(controls);

    // Actions
    const actions = document.createElement("div");
    actions.className = "cell-actions";
    actions.innerHTML = `
      <span onclick="openSelectModal(${cell.row}, ${cell.col})" class="cursor-pointer">▼</span>
      <span onclick="openCustomizeModal(${cell.row}, ${cell.col})" class="cursor-pointer">⚙️</span>
    `;
    div.appendChild(actions);

    // Component content
    const content = document.createElement("div");
    content.className = "component-content";
    switch (cell.type) {
      case "heading":
        // content.innerHTML = `<h2>${cell.content.text || "見出し"}</h2>`;
        content.innerHTML = `<h3>${cell.content.text || "見出し"}</h3>`;
        break;
      case "input":
        content.innerHTML = `<input type="${
          cell.content.type || "text"
        }" placeholder="${cell.content.placeholder || "入力..."}">`;
        break;
      case "dropdown":
        content.innerHTML = `<select>${(
          cell.content.options || ["オプション1", "オプション2"]
        )
          .map((opt) => `<option>${opt}</option>`)
          .join("")}</select>`;
        break;
      case "checkbox":
        content.innerHTML = `<label><input type="checkbox"> ${
          cell.content.label || "チェックボックス"
        }</label>`;
        break;
      case "textarea":
        content.innerHTML = `<textarea placeholder="${
          cell.content.placeholder || "テキスト..."
        }"></textarea>`;
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
                    }"></td>`
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
  document.querySelectorAll(".row-span, .col-span").forEach((input) => {
    input.addEventListener("input", () => {
      const div = input.closest(".grid-cell");
      const row = parseInt(div.dataset.row);
      const col = parseInt(div.dataset.col);
      currentCell = gridState.find((c) => c.row === row && c.col === col);
      currentCell.rowSpan = Math.max(
        1,
        Math.min(6, parseInt(div.querySelector(".row-span").value) || 1)
      );
      currentCell.colSpan = Math.max(
        1,
        Math.min(6, parseInt(div.querySelector(".col-span").value) || 1)
      );
      renderGrid();
      currentCell = null;
    });
  });
}

function openSelectModal(row, col) {
  currentCell = gridState.find((c) => c.row === row && c.col === col);
  document.getElementById("selectModal").style.display = "flex";
}

function openCustomizeModal(row, col) {
  currentCell = gridState.find((c) => c.row === row && c.col === col);
  const form = document.getElementById("customizeForm");
  form.innerHTML = "";
  const type = currentCell.type;

  if (type === "heading") {
    form.innerHTML = `<input id="customText" type="text" value="${
      currentCell.content.text || ""
    }" class="p-2 border rounded w-full" placeholder="見出しテキスト">`;
  } else if (type === "input") {
    form.innerHTML = `
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
      </select>
    `;
  } else if (type === "dropdown") {
    form.innerHTML = `<textarea id="customOptions" class="p-2 border rounded w-full" placeholder="オプション（1行に1つ）">${(
      currentCell.content.options || []
    ).join("\n")}</textarea>`;
  } else if (type === "checkbox") {
    form.innerHTML = `<input id="customLabel" type="text" value="${
      currentCell.content.label || ""
    }" class="p-2 border rounded w-full" placeholder="ラベル">`;
  } else if (type === "textarea") {
    form.innerHTML = `<input id="customPlaceholder" type="text" value="${
      currentCell.content.placeholder || ""
    }" class="p-2 border rounded w-full" placeholder="プレースホルダー">`;
  } else if (type === "table") {
    form.innerHTML = `
      <input id="customRows" type="number" min="1" value="${
        currentCell.content.rows || 2
      }" class="p-2 border rounded w-full mb-2" placeholder="行数">
      <input id="customCols" type="number" min="1" value="${
        currentCell.content.cols || 3
      }" class="p-2 border rounded w-full mb-2" placeholder="列数">
      <textarea id="customHeaders" class="p-2 border rounded w-full mb-2" placeholder="ヘッダー（1行に1つ）">${(
        currentCell.content.headers || []
      ).join("\n")}</textarea>
      <textarea id="customPlaceholders" class="p-2 border rounded w-full" placeholder="プレースホルダー（1行に1つ）">${(
        currentCell.content.placeholders || []
      ).join("\n")}</textarea>
    `;
  }
  document.getElementById("customizeModal").style.display = "flex";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
  currentCell = null;
}

function applyComponent() {
  if (!currentCell) return;
  const type = document.getElementById("componentType").value;
  currentCell.type = type;
  currentCell.content = {};
  renderGrid();
  closeModal("selectModal");
}

function applyCustomization() {
  if (!currentCell) return;
  const type = currentCell.type;
  if (type === "heading") {
    currentCell.content.text = document.getElementById("customText").value;
  } else if (type === "input") {
    currentCell.content.placeholder =
      document.getElementById("customPlaceholder").value;
    currentCell.content.type = document.getElementById("customType").value;
  } else if (type === "dropdown") {
    currentCell.content.options = document
      .getElementById("customOptions")
      .value.split("\n")
      .filter((opt) => opt.trim());
  } else if (type === "checkbox") {
    currentCell.content.label = document.getElementById("customLabel").value;
  } else if (type === "textarea") {
    currentCell.content.placeholder =
      document.getElementById("customPlaceholder").value;
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
  }
  renderGrid();
  closeModal("customizeModal");
}

function saveLayout() {
  try {
    // Track occupied cells
    const occupied = new Set();
    gridState.forEach((cell) => {
      for (let i = cell.row; i < cell.row + cell.rowSpan; i++) {
        for (let j = cell.col; j < cell.col + cell.colSpan; j++) {
          occupied.add(`${i}-${j}`);
        }
      }
    });

    // Filter out overlapped cells
    const visibleCells = gridState.filter((cell) => {
      const primaryCell =
        occupied.has(`${cell.row}-${cell.col}`) &&
        gridState.find((c) => c.row === cell.row && c.col === cell.col) ===
          cell;
      return primaryCell;
    });

    // Generate JSON
    const json = {
      data_tables: visibleCells.map((cell) => ({
        見出し: cell.content.text || `表 ${cell.row}-${cell.col}`,
        表: {
          識別子: `table_${cell.row}_${cell.col}`,
          列:
            cell.type === "table"
              ? (cell.content.headers || []).map((h, i) => ({
                  名前: `col_${i}`,
                  ラベル: h,
                  タイプ: "テキスト",
                  編集可能: true,
                }))
              : [
                  {
                    名前: "データ",
                    ラベル: "データ",
                    タイプ:
                      cell.type === "dropdown" ? "ドロップダウン" : cell.type,
                    編集可能: true,
                  },
                ],
          行:
            cell.type === "table"
              ? Array(parseInt(cell.content.rows || 2))
                  .fill()
                  .map((_, i) =>
                    Array(cell.content.headers?.length || 3).fill({
                      値: i === 0 ? `例）データ` : "",
                    })
                  )
              : [
                  [
                    {
                      値:
                        cell.content.text ||
                        cell.content.placeholder ||
                        cell.content.label ||
                        "例）データ",
                    },
                  ],
                ],
        },
        ノート: {
          タイプ: "テキストエリア",
          名前: `ノート_${cell.row}_${cell.col}`,
          ラベル: "ノート",
          値: "",
          編集可能: true,
        },
      })),
      アクション: [
        {
          タイプ: "ボタン",
          名前: "提出",
          ラベル: "完了",
          アクション: "提出_フォーム",
        },
      ],
    };

    // Download JSON
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
document.getElementById("cols").addEventListener("input", updateGrid);
document.getElementById("rows").addEventListener("input", updateGrid);
document.getElementById("save").addEventListener("click", saveLayout);
updateGrid();
