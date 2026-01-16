const SUPPORTED = [1400, 1500, 1800, 2100, 2400, 2700, 3000, 3600];

const CONFIGS = {
  1400: { half: 4, full: 0, plain: 1, adj: 6, fixed: 1, drawers: 1, rails: 2, sheets: 2 },
  1500: { half: 2, full: 1, plain: 1, adj: 6, fixed: 1, drawers: 1, rails: 2, sheets: 2 },
  1800: { half: 2, full: 1, plain: 1, adj: 6, fixed: 1, drawers: 1, rails: 2, sheets: 2 },
  2100: { half: 4, full: 0, plain: 2, adj: 6, fixed: 1, drawers: 1, rails: 4, sheets: 3 },
  2400: { half: 4, full: 0, plain: 2, adj: 6, fixed: 1, drawers: 1, rails: 4, sheets: 3 },
  2700: { half: 4, full: 1, plain: 2, adj: 10, fixed: 2, drawers: 1, rails: 4, sheets: 3 },
  3000: { half: 6, full: 0, plain: 2, adj: 10, fixed: 2, drawers: 1, rails: 4, sheets: 3 },
  3600: { half: 6, full: 0, plain: 2, adj: 10, fixed: 2, drawers: 1, rails: 4, sheets: 3 }
};

let lastCutlist = [];

function bucketMatch(width) {
  const mids = [];
  for (let i = 0; i < SUPPORTED.length - 1; i++) mids.push((SUPPORTED[i] + SUPPORTED[i + 1]) / 2);

  if (width < mids[0]) return SUPPORTED[0];
  for (let i = 1; i < mids.length; i++) {
    if (width >= mids[i - 1] && width < mids[i]) return SUPPORTED[i];
  }
  return SUPPORTED[SUPPORTED.length - 1];
}

function addItem(list, name, qty, h, w, d, notes = "") {
  if (qty <= 0) return;
  list.push({ PartName: name, Qty: qty, Height_mm: h, Width_mm: w, Depth_mm: d, Notes: notes });
}

function renderTable(list) {
  const headers = ["PartName", "Qty", "Height_mm", "Width_mm", "Depth_mm", "Notes"];
  let html = "<table><thead><tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr></thead><tbody>";

  for (const row of list) {
    html += "<tr>" + headers.map(h => `<td>${escapeHtml(String(row[h] ?? ""))}</td>`).join("") + "</tr>";
  }

  html += "</tbody></table>";
  document.getElementById("tableWrap").innerHTML = html;
}

function escapeHtml(s) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function generate() {
  const widthEl = document.getElementById("roomWidth");
  const wallEl = document.getElementById("wallBoth");
  const infoEl = document.getElementById("matchInfo");
  const dlBtn = document.getElementById("dlBtn");

  const roomWidth = parseInt(widthEl.value, 10);
  if (!Number.isFinite(roomWidth) || roomWidth <= 0) {
    alert("Please enter a valid room width in mm.");
    return;
  }

  const wallBoth = wallEl.value === "yes";
  const matched = bucketMatch(roomWidth);
  infoEl.textContent = `Input width: ${roomWidth} mm | Matched bucket: ${matched} mm`;

  const cfg = CONFIGS[matched];
  const list = [];

  addItem(list, "Half Drill Panel", cfg.half, 1950, 447, 0, `Bucket ${matched}`);
  addItem(list, "Full Drill Panel", cfg.full, 1950, 447, 0, `Bucket ${matched}`);
  addItem(list, "Plain Panel", cfg.plain, 1950, 447, 0, `Bucket ${matched}`);

  addItem(list, "Adjustable Shelf", cfg.adj, 0, 460, 430, `Bucket ${matched}`);
  addItem(list, "Fixed Shelf", cfg.fixed, 0, 463, 430, `Bucket ${matched}`);

  addItem(list, "Drawer Set", cfg.drawers, 0, 460, 0, "3 drawers set");

  if (cfg.rails === 2) {
    addItem(list, "Hanging Rail", 1, 0, matched, 0, "Top rail");
    addItem(list, "Hanging Rail", 1, 0, matched, 0, "Bottom rail");
  } else {
    addItem(list, "Hanging Rail", 2, 0, matched, 0, "Top rails (x2)");
    addItem(list, "Hanging Rail", 2, 0, matched, 0, "Bottom rails (x2)");
  }

  addItem(list, "Sheet 1800x2400", cfg.sheets, 2400, 1800, 0, "Total sheets");

  if (wallBoth) {
    addItem(list, "Wall Side Panel - Fixed", 1, 2400, 600, 600, "Wall both sides");

    let varW = 0;
    if (roomWidth < 2400) varW = 2400 - roomWidth;
    else if (roomWidth > 2400) varW = roomWidth - 2400;

    if (varW > 0) addItem(list, "Wall Side Panel - Variable", 1, 2400, varW, 600, "Wall both sides");
  }

  const LIMIT = 2380;
  if (roomWidth <= LIMIT) {
    addItem(list, "Strip Panel 16mm x 80mm", 1, 16, roomWidth, 80, `<= ${LIMIT}`);
  } else {
    addItem(list, "Strip Panel 16mm x 80mm", 1, 16, LIMIT, 80, "Base 2380");
    addItem(list, "Strip Panel 16mm x 80mm", 1, 16, roomWidth - LIMIT, 80, "Exceeded");
  }

  lastCutlist = list;
  renderTable(list);
  dlBtn.disabled = false;
}

function downloadCSV() {
  if (!lastCutlist.length) return;

  const headers = ["PartName", "Qty", "Height_mm", "Width_mm", "Depth_mm", "Notes"];
  const lines = [headers.join(",")];

  for (const row of lastCutlist) {
    const line = headers.map(h => csvCell(row[h])).join(",");
    lines.push(line);
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "cutlist.csv";
  a.click();

  URL.revokeObjectURL(url);
}

function csvCell(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replaceAll('"', '""')}"`;
  return s;
}
