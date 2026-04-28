const LINE_TO_SPACING_RATIO = 0.12;
const CORNER_DOT_TO_SPACING_RATIO = 0.6;
const GRID_DOT_TO_SPACING_RATIO = 0.35; 
const HOVER_RING_GROWTH_TO_SPACING_RATIO = 0.06;
const HOVER_RING_STROKE_TO_SPACING_RATIO = 0.036;
const HOVER_HIT_TO_SPACING_RATIO = 0.072;
const DRAW_MODE_NORMAL = "normal";
const DRAW_MODE_INVERTED = "inverted";
const UI_MARGIN = 28;
const UI_CONTROL_GAP = 18;
const MODE_TOGGLE_HEIGHT = 42;
const GRID_SPACING_DIVISOR_EXTRA = 10;
const DISPLAY_SCALE = 1.5;

let gridSize = 5;
let points = [];
let connections = [];
let lastSelected = null;
let isDragging = false;
let allPaths = [];
let currentPath = null;
let fullPaths = [];
let cellSpacing = 0;
let pointSpacing = 0;
let drawMode = DRAW_MODE_INVERTED;
let exportButton;
let refreshButton;

function lineThickness() {
  return drawMode === DRAW_MODE_INVERTED ? cornerDotDiameter() : cellSpacing * LINE_TO_SPACING_RATIO;
}

function cornerDotDiameter() { return cellSpacing * CORNER_DOT_TO_SPACING_RATIO; }
function cornerDotRadius() { return cornerDotDiameter() / 2; }
function gridDotDiameter() { return cellSpacing * GRID_DOT_TO_SPACING_RATIO; }
function hoverRingGrowth() { return cellSpacing * HOVER_RING_GROWTH_TO_SPACING_RATIO; }
function hoverRingStroke() { return cellSpacing * HOVER_RING_STROKE_TO_SPACING_RATIO; }
function hoverHitRadius() { return max(pointSpacing * HOVER_HIT_TO_SPACING_RATIO, gridDotDiameter() / 2); }

function setDrawMode(mode) {
  if (mode === DRAW_MODE_NORMAL || mode === DRAW_MODE_INVERTED) drawMode = mode;
}

function positionExportButton() { if (!exportButton) return; exportButton.position(UI_MARGIN, UI_MARGIN); }
function positionRefreshButton() { if (!refreshButton) return; refreshButton.position(windowWidth - refreshButton.size().width - UI_MARGIN, UI_MARGIN + (MODE_TOGGLE_HEIGHT - refreshButton.size().height) / 2); }

function setup() {
  createCanvas(windowWidth, windowHeight);
  createGrid();

  exportButton = createButton("export").mousePressed(exportToSVG);
  exportButton.style("font-family", "sans-serif").style("font-size", "34px").style("border", "none").style("background", "transparent").style("cursor", "pointer").style("color", "#000");
  exportButton.mouseOver(() => exportButton.style("color", "rgb(200, 200, 200)"));
  exportButton.mouseOut(() => exportButton.style("color", "#000"));

  refreshButton = createButton("").mousePressed(resetGrid);
  refreshButton.html('<svg width="44" height="44" viewBox="0 0 121 114" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50.1211 4.10156L0.000446111 9.11056L29.3987 50.0118L50.1211 4.10156ZM18.2392 27.017L14.8206 24.3075C8.10985 32.7746 3.00936 43.7427 3.00936 57.3861L7.37156 57.3861L11.7338 57.3861C11.7338 46.0794 15.9182 36.9684 21.6579 29.7265L18.2392 27.017ZM7.37156 57.3861L3.00936 57.3861C3.00936 78.1762 14.8053 92.2754 26.085 100.961C31.7371 105.313 37.365 108.397 41.5705 110.394C43.6788 111.395 45.4446 112.13 46.6976 112.619C47.3244 112.864 47.824 113.047 48.1753 113.173C48.351 113.235 48.4897 113.284 48.5887 113.317C48.6382 113.334 48.6779 113.348 48.7073 113.357C48.722 113.362 48.7341 113.366 48.7437 113.37C48.7484 113.371 48.7526 113.372 48.756 113.374C48.7578 113.374 48.7599 113.375 48.7607 113.375C48.7627 113.376 48.7645 113.376 50.1211 109.231C51.4777 105.085 51.4792 105.085 51.4805 105.086C51.4807 105.086 51.4818 105.086 51.4822 105.086C51.4831 105.086 51.4834 105.086 51.483 105.086C51.4821 105.086 51.4788 105.085 51.473 105.083C51.4613 105.079 51.4396 105.072 51.4082 105.061C51.3455 105.04 51.2441 105.005 51.1067 104.956C50.8317 104.858 50.4129 104.704 49.8708 104.492C48.7859 104.068 47.2119 103.415 45.3125 102.513C41.5024 100.704 36.4429 97.9251 31.4076 94.048C21.3126 86.275 11.7338 74.452 11.7338 57.3861L7.37156 57.3861Z" fill="currentColor"/><path d="M70.6231 109.231L92.1621 63.6977L120.825 105.117L70.6231 109.231ZM70.623 4.10156C72.1039 -0.00158841 72.1056 -0.000961372 72.1075 -0.000275203C72.1084 3.23569e-05 72.1104 0.000780037 72.1121 0.00139706C72.1156 0.00263207 72.1196 0.00410693 72.1243 0.00582259C72.1337 0.00925343 72.1457 0.0136461 72.1603 0.0190048C72.1894 0.0297221 72.2288 0.0443038 72.278 0.0627774C72.3765 0.0997228 72.5146 0.152254 72.6896 0.220597C73.0396 0.357254 73.5379 0.557304 74.1633 0.822565C75.4133 1.35277 77.1756 2.1454 79.2799 3.21541C83.4779 5.35006 89.0931 8.61702 94.7305 13.1476C105.968 22.1789 117.735 36.6237 117.735 57.3861L113.373 57.3861L109.01 57.3861C109.01 40.2926 99.4024 28.095 89.2652 19.9481C84.2152 15.8895 79.143 12.9333 75.3254 10.9921C73.422 10.0242 71.8444 9.31575 70.7566 8.85433C70.213 8.62378 69.7929 8.45538 69.5167 8.34755C69.3786 8.29365 69.2766 8.25493 69.2133 8.23118C69.1817 8.2193 69.1597 8.21118 69.1478 8.20677C69.1418 8.20457 69.1383 8.2033 69.1373 8.20296C69.1369 8.20279 69.137 8.20285 69.1378 8.20314C69.1382 8.20329 69.1393 8.20368 69.1395 8.20375C69.1408 8.2042 69.1422 8.20471 70.623 4.10156ZM113.373 57.3861L117.735 57.3861C117.735 70.7392 112.848 81.3955 106.321 89.6046L102.907 86.8898L99.4922 84.175C105.01 77.2355 109.01 68.4434 109.01 57.3861L113.373 57.3861Z" fill="currentColor"/></svg>').style("border", "none").style("background", "transparent").style("cursor", "pointer").style("color", "#000");
  refreshButton.mouseOver(() => refreshButton.style("color", "rgb(200, 200, 200)"));
  refreshButton.mouseOut(() => refreshButton.style("color", "#000"));

  positionExportButton(); positionRefreshButton();
}

function draw() {
  background(255);
  drawConnections();
  drawGrid();
  highlightDot();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resetGrid();
  positionExportButton(); positionRefreshButton();
}

function keyPressed() {
  if (key === 'r' || key === 'R') resetGrid();
  else if (key === 'e' || key === 'E') exportToSVG();
  else if (key === 'g' || key === 'G') exportGridToSVG();
}

function resetGrid() {
  createGrid();
  connections = []; allPaths = []; fullPaths = []; currentPath = null; lastSelected = null; isDragging = false;
}

function createGrid() {
  points = [];
  // Keep style sizing tied to the original spacing.
  cellSpacing = Math.floor((min(width, height) / (gridSize + 1)) * DISPLAY_SCALE);
  // Tighten only the layout positions.
  pointSpacing = Math.floor((min(width, height) / (gridSize + 1 + GRID_SPACING_DIVISOR_EXTRA)) * DISPLAY_SCALE);
  let offsetX = (width - pointSpacing * (gridSize - 1)) / 2;
  let offsetY = (height - pointSpacing * (gridSize - 1)) / 2;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      points.push({ x: offsetX + j * pointSpacing, y: offsetY + i * pointSpacing, row: i, col: j, visible: true });
    }
  }
}

function drawGrid() {
  noStroke(); fill(200);
  for (let pt of points) if (pt.visible) ellipse(pt.x, pt.y, gridDotDiameter(), gridDotDiameter());

  let corners = new Set();
  fullPaths.forEach(p => getCornerIndices(p).forEach(c => corners.add(c)));

  if (drawMode === DRAW_MODE_INVERTED) {
    fill(200); corners.forEach(i => ellipse(points[i].x, points[i].y, gridDotDiameter(), gridDotDiameter()));
  } else {
    fill(0); corners.forEach(i => ellipse(points[i].x, points[i].y, cornerDotDiameter(), cornerDotDiameter()));
  }
}

function drawConnections() {
  stroke(0); strokeCap(ROUND); strokeJoin(ROUND); strokeWeight(lineThickness());
  for (let conn of connections) line(points[conn[0]].x, points[conn[0]].y, points[conn[1]].x, points[conn[1]].y);
  if (drawMode === DRAW_MODE_INVERTED) {
    for (let path of fullPaths) {
      if (path.length === 1) point(points[path[0]].x, points[path[0]].y);
    }
  }
}


function highlightDot() {
  let h = getHoveredDot();
  if (h !== null) {
    noFill(); stroke(0); strokeWeight(hoverRingStroke());
    ellipse(points[h].x, points[h].y, cornerDotDiameter() + hoverRingGrowth(), cornerDotDiameter() + hoverRingGrowth());
  }
}

function mousePressed() {
  let i = getHoveredDot();
  if (i !== null) { isDragging = true; lastSelected = i; currentPath = [i]; fullPaths.push([i]); }
}

function mouseDragged() {
  if (!isDragging || lastSelected === null) return;
  let curr = getHoveredDot();
  if (curr !== null && curr !== lastSelected) {
    let a = points[lastSelected], b = points[curr];
    if (abs(a.col-b.col) !== 0 && abs(a.row-b.row) !== 0 && abs(a.col-b.col) !== abs(a.row-b.row)) return;
    connections.push([lastSelected, curr]);
    let between = getPointsBetween(a, b);
    between.forEach(p => p.visible = false);
    fullPaths[fullPaths.length - 1].push(...between.map(p => points.indexOf(p)).slice(1));
    lastSelected = curr;
  }
}

function mouseReleased() { isDragging = false; lastSelected = null; currentPath = null; }

function getHoveredDot() {
  for (let i = 0; i < points.length; i++) if (dist(mouseX, mouseY, points[i].x, points[i].y) < hoverHitRadius()) return i;
  return null;
}

function getPointsBetween(a, b) {
  let pts = [], rStep = Math.sign(b.row-a.row), cStep = Math.sign(b.col-a.col), steps = max(abs(b.row-a.row), abs(b.col-a.col));
  for (let i = 0; i <= steps; i++) pts.push(points.find(p => p.row === a.row+i*rStep && p.col === a.col+i*cStep));
  return pts;
}

function getCornerIndices(path) {
  let c = new Set([path[0]]);
  for (let i = 1; i < path.length - 1; i++) {
    let p = points[path[i-1]], m = points[path[i]], n = points[path[i+1]];
    if ((n.col-m.col) !== (m.col-p.col) || (n.row-m.row) !== (m.row-p.row)) c.add(path[i]);
  }
  c.add(path[path.length - 1]);
  return c;
}

function getCornerPath(path) {
  if (path.length <= 2) return path.slice();
  const cp = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    let p = points[path[i-1]], m = points[path[i]], n = points[path[i+1]];
    if ((n.col - m.col) !== (m.col - p.col) || (n.row - m.row) !== (m.row - p.row)) cp.push(path[i]);
  }
  cp.push(path[path.length - 1]);
  return cp;
}

// --- PRECISION EXPORT ---

function getLinePathData(x1, y1, x2, y2, thickness) {
  const r = thickness / 2;
  const dxLine = x2 - x1;
  const dyLine = y2 - y1;
  const isDiagonal45 = Math.abs(dxLine) === Math.abs(dyLine) && dxLine !== 0;

  // Overlap helps avoid seams between adjacent segment bodies.
  // In inverted mode keep only a tiny overlap: enough to close center slicing,
  // but small enough to avoid the visible diagonal hitch.
  let overlap = drawMode === DRAW_MODE_INVERTED ? 0.35 : Math.max(1, Math.round(thickness * 0.02));
  if (isDiagonal45) overlap = Math.min(overlap, 0.02);
  let ux;
  let uy;
  let nx;
  let ny;

  if (isDiagonal45) {
    // Use exact normalized vectors for 45-degree segments to prevent per-segment
    // trig rounding drift that causes 1-3px misalignment in diagonal rectangles.
    ux = Math.sign(dxLine) / Math.SQRT2;
    uy = Math.sign(dyLine) / Math.SQRT2;
    nx = -uy;
    ny = ux;
  } else {
    const ang = Math.atan2(dyLine, dxLine);
    ux = Math.cos(ang);
    uy = Math.sin(ang);
    nx = Math.sin(ang);
    ny = -Math.cos(ang);
  }

  let sx = x1 - ux * overlap;
  let sy = y1 - uy * overlap;
  let ex = x2 + ux * overlap;
  let ey = y2 + uy * overlap;

  if (isDiagonal45) {
    // Keep diagonal centerline anchored to the exact transformed node centers.
    // This avoids tiny run recomputation drift that can create micro-kinks.
    const sgnX = Math.sign(dxLine);
    const sgnY = Math.sign(dyLine);
    sx = x1 - sgnX * overlap;
    sy = y1 - sgnY * overlap;
    ex = x2 + sgnX * overlap;
    ey = y2 + sgnY * overlap;
  }
  const offX = nx * r;
  const offY = ny * r;
  const q = (v) => {
    const n = Number(v.toFixed(8));
    return Math.abs(n) < 1e-8 ? 0 : n;
  };
  let x1a = q(sx + offX), y1a = q(sy + offY);
  let x1b = q(sx - offX), y1b = q(sy - offY);
  let x2b = q(ex - offX), y2b = q(ey - offY);
  let x2a = q(ex + offX), y2a = q(ey + offY);
  return `M${x1a} ${y1a} L${x1b} ${y1b} L${x2b} ${y2b} L${x2a} ${y2a} Z `;
}

function getCirclePathData(cx, cy, r) {
  const q = (v) => {
    const n = Number(v.toFixed(8));
    return Math.abs(n) < 1e-8 ? 0 : n;
  };
  const x = q(cx);
  const y = q(cy);
  const radius = q(Math.max(0.5, r));
  return `M${x - radius} ${y} A${radius} ${radius} 0 1 0 ${x + radius} ${y} A${radius} ${radius} 0 1 0 ${x - radius} ${y} Z `;
}

async function exportToSVG() {
  let xs = points.map(p => p.x), ys = points.map(p => p.y);
  let minX = Math.min(...xs), maxX = Math.max(...xs);
  let minY = Math.min(...ys), maxY = Math.max(...ys);

  // VISUAL CORRECTION: Account for the radius that bleeds past the dot centers
  // Total Target = 800. Grid Span = Target - (CornerDotDiameter)
  const targetTotalSize = 800;
  const visualBleed = (maxY - minY) > 0 ? (cornerDotDiameter() / (maxY - minY)) : 0;
  const correctedScale = targetTotalSize / ((maxY - minY) * (1 + visualBleed));
  
  const SCALE = correctedScale;
  // Exact half bleed (no Math.round): rounding here often makes ink extend past 800
  // by ~1px while the viewBox is still 0..800, so apps report a non-square bbox.
  const PADDING = (SCALE * cornerDotDiameter()) / 2;

  const tx = (v) => (v - minX) * SCALE + PADDING;
  const ty = (v) => (v - minY) * SCALE + PADDING;
  const ts = (v) => v * SCALE;

  let inkPaths = [], holePaths = [];
  const thick = Math.max(0.5, ts(lineThickness()));
  const cornerRadius = thick / 2;
  const normalCornerRadius = ts(cornerDotDiameter() / 2);
  const pathNodeRadius = drawMode === DRAW_MODE_NORMAL ? normalCornerRadius : cornerRadius;
  const invertedHoleRadius = ts(gridDotDiameter() / 2);

  if (drawMode === DRAW_MODE_INVERTED) {
    fullPaths.forEach(path => {
      if (path.length === 1) {
        const p = points[path[0]];
        inkPaths.push(getCirclePathData(tx(p.x), ty(p.y), cornerRadius));
        return;
      }
      let corners = getCornerIndices(path);
      let cornerPath = getCornerPath(path);
      for (let i = 0; i < cornerPath.length - 1; i++) {
        let a = points[cornerPath[i]], b = points[cornerPath[i+1]];
        inkPaths.push(getLinePathData(tx(a.x), ty(a.y), tx(b.x), ty(b.y), thick));
        if (corners.has(cornerPath[i])) {
          inkPaths.push(getCirclePathData(tx(a.x), ty(a.y), pathNodeRadius));
        }
        if (corners.has(cornerPath[i+1])) {
          inkPaths.push(getCirclePathData(tx(b.x), ty(b.y), pathNodeRadius));
        }
      }
    });
  } else {
    fullPaths.forEach(path => {
      let corners = getCornerIndices(path);
      let cornerPath = getCornerPath(path);
      for (let i = 0; i < cornerPath.length - 1; i++) {
        let a = points[cornerPath[i]], b = points[cornerPath[i+1]];
        inkPaths.push(getLinePathData(tx(a.x), ty(a.y), tx(b.x), ty(b.y), thick));
        if (corners.has(cornerPath[i])) {
          inkPaths.push(getCirclePathData(tx(a.x), ty(a.y), pathNodeRadius));
        }
        if (corners.has(cornerPath[i+1])) {
          inkPaths.push(getCirclePathData(tx(b.x), ty(b.y), pathNodeRadius));
        }
      }
    });
  }

  if (drawMode === DRAW_MODE_INVERTED) {
    let allC = new Set();
    fullPaths.forEach(p => getCornerIndices(p).forEach(c => allC.add(c)));
    allC.forEach(i => {
      holePaths.push(getCirclePathData(tx(points[i].x), ty(points[i].y), invertedHoleRadius));
    });
  }

  // The final bounds will be exactly 800x800
  const finalDim = targetTotalSize;
  const inkMarkup = inkPaths.map(d => `<path d="${d}" fill="black" fill-rule="nonzero" />`).join("");
  const holesMarkup = holePaths.map(d => `<path d="${d}" fill="red" fill-rule="nonzero" />`).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${finalDim}px" height="${finalDim}px" viewBox="0 -${finalDim} ${finalDim} ${finalDim}">
    <g transform="translate(0 -${finalDim})">
      <g id="ink">
        ${inkMarkup}
      </g>
      <g id="holes">
        ${holesMarkup}
      </g>
    </g>
  </svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `glyph.svg`; link.click();
  URL.revokeObjectURL(url);
}

async function exportGridToSVG() {
  if (!points.length) return;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const targetTotalSize = 800;
  const spanY = (maxY - minY);
  const bleed = spanY > 0 ? (gridDotDiameter() / spanY) : 0;
  const SCALE = targetTotalSize / (spanY * (1 + bleed));
  const PADDING = (SCALE * gridDotDiameter()) / 2;

  const tx = (v) => (v - minX) * SCALE + PADDING;
  const ty = (v) => (v - minY) * SCALE + PADDING;
  const ts = (v) => v * SCALE;

  const r = Math.max(0.5, ts(gridDotDiameter() / 2));
  const circlesMarkup = points
    .map(p => `<circle cx="${Number(tx(p.x).toFixed(8))}" cy="${Number(ty(p.y).toFixed(8))}" r="${Number(r.toFixed(8))}" />`)
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${targetTotalSize}px" height="${targetTotalSize}px" viewBox="0 0 ${targetTotalSize} ${targetTotalSize}">
    <g fill="rgb(200, 200, 200)">
      ${circlesMarkup}
    </g>
  </svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `grid-${gridSize}x${gridSize}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}