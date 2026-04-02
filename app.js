import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DEFAULTS = {
  width: 120,
  length: 120,
  thickness: 2.4,
  pitch: 9,
  gap: 0.9,
  porosity: 0.68,
  frame: 4.2,
};

const PRESETS = {
  seedling: {
    width: 96,
    length: 96,
    thickness: 2.1,
    pitch: 7.2,
    gap: 0.75,
    porosity: 0.66,
    frame: 3.6,
  },
  herb: {
    width: 140,
    length: 110,
    thickness: 2.6,
    pitch: 9.8,
    gap: 1,
    porosity: 0.7,
    frame: 4.4,
  },
  orchid: {
    width: 84,
    length: 144,
    thickness: 3.2,
    pitch: 11.5,
    gap: 1.25,
    porosity: 0.74,
    frame: 4.8,
  },
};

const FIELD_IDS = ["width", "length", "thickness", "pitch", "gap", "porosity", "frame"];
const FIELD_PRECISION = {
  width: 0,
  length: 0,
  thickness: 2,
  pitch: 2,
  gap: 2,
  porosity: 2,
  frame: 2,
};

const state = {
  params: { ...DEFAULTS },
  currentDesign: null,
  geometry: null,
  edgeGeometry: null,
};

const dom = {
  metricsGrid: document.querySelector("#metricsGrid"),
  warningList: document.querySelector("#warningList"),
  actionStatus: document.querySelector("#actionStatus"),
  downloadBtn: document.querySelector("#downloadBtn"),
  copyLinkBtn: document.querySelector("#copyLinkBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  meshInfo: document.querySelector("#meshInfo"),
  planCanvas: document.querySelector("#planCanvas"),
  viewerMount: document.querySelector("#viewerMount"),
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 2000);
camera.position.set(130, -170, 130);

let renderer = null;
let controls = null;

const ambient = new THREE.HemisphereLight(0xf8fff4, 0x9eb3a1, 1.1);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
keyLight.position.set(110, -80, 160);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xb8ffcf, 0.5);
rimLight.position.set(-90, 120, 120);
scene.add(rimLight);

const matMesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshPhysicalMaterial({
    color: 0x4e9c62,
    roughness: 0.56,
    metalness: 0.02,
    clearcoat: 0.1,
    side: THREE.DoubleSide,
  })
);
scene.add(matMesh);

const edgeLines = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
  new THREE.LineBasicMaterial({ color: 0x1f5137, transparent: true, opacity: 0.3 })
);
scene.add(edgeLines);

const stage = new THREE.Mesh(
  new THREE.CylinderGeometry(140, 170, 8, 64),
  new THREE.MeshStandardMaterial({
    color: 0xe7efe2,
    roughness: 0.95,
    metalness: 0,
  })
);
stage.position.z = -8;
scene.add(stage);

const accentRing = new THREE.Mesh(
  new THREE.TorusGeometry(108, 0.9, 18, 120),
  new THREE.MeshStandardMaterial({
    color: 0x9bd070,
    transparent: true,
    opacity: 0.75,
    roughness: 0.6,
  })
);
accentRing.rotation.x = Math.PI / 2;
accentRing.position.z = -3.8;
scene.add(accentRing);

function initRenderer() {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    dom.viewerMount.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 70;
    controls.maxDistance = 520;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0, 0, 10);
  } catch (error) {
    dom.viewerMount.innerHTML = `
      <div class="viewer-fallback">
        <strong>3D プレビューを初期化できませんでした。</strong>
        <span>この環境では WebGL が使えないため、平面図と STL 出力のみ利用できます。</span>
      </div>
    `;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function formatValue(value, digits = 1) {
  return Number(value).toFixed(digits).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function toHash(params) {
  const search = new URLSearchParams();
  for (const key of FIELD_IDS) {
    search.set(key, String(roundTo(params[key], FIELD_PRECISION[key])));
  }
  return `#${search.toString()}`;
}

function fromHash() {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  if (!hash) {
    return null;
  }
  const params = new URLSearchParams(hash);
  const parsed = {};
  for (const key of FIELD_IDS) {
    const raw = params.get(key);
    if (raw == null) {
      continue;
    }
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) {
      parsed[key] = numeric;
    }
  }
  return Object.keys(parsed).length ? parsed : null;
}

function syncControls() {
  for (const key of FIELD_IDS) {
    const value = roundTo(state.params[key], FIELD_PRECISION[key]);
    document.querySelector(`#${key}Range`).value = String(value);
    document.querySelector(`#${key}Number`).value = String(value);
  }
}

function getFieldConstraints(field) {
  const range = document.querySelector(`#${field}Range`);
  return {
    min: Number(range.min),
    max: Number(range.max),
  };
}

function applyParams(partial) {
  for (const key of FIELD_IDS) {
    if (!(key in partial)) {
      continue;
    }
    const nextValue = Number(partial[key]);
    if (!Number.isFinite(nextValue)) {
      continue;
    }
    const { min, max } = getFieldConstraints(key);
    state.params[key] = clamp(nextValue, min, max);
  }
  syncControls();
  renderAll();
}

function estimateResolution(params) {
  const dominant = Math.max(params.width, params.length);
  const dimensionCap = dominant / 320;
  const featureCap = Math.min(params.gap / 3.2, params.pitch / 16, params.thickness / 2.2);
  return clamp(Math.min(0.52, featureCap), Math.max(0.24, dimensionCap), 0.52);
}

function buildEdges(span, resolution) {
  const count = Math.max(1, Math.ceil(span / resolution));
  const edges = new Float32Array(count + 1);
  for (let i = 0; i <= count; i += 1) {
    edges[i] = Math.min(i * resolution, span);
  }
  return edges;
}

function markInterval(mask, edges, start, end) {
  const clippedStart = clamp(start, 0, edges[edges.length - 1]);
  const clippedEnd = clamp(end, 0, edges[edges.length - 1]);
  if (clippedEnd <= clippedStart) {
    return;
  }
  for (let i = 0; i < mask.length; i += 1) {
    const cellStart = edges[i];
    const cellEnd = edges[i + 1];
    if (cellEnd <= clippedStart || cellStart >= clippedEnd) {
      continue;
    }
    mask[i] = 1;
  }
}

function mergeIntervals(intervals) {
  if (!intervals.length) {
    return [];
  }
  const sorted = intervals
    .map(([start, end]) => [Math.min(start, end), Math.max(start, end)])
    .sort((a, b) => a[0] - b[0]);

  const merged = [sorted[0].slice()];
  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (current[0] <= last[1] + 1e-6) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current.slice());
    }
  }
  return merged;
}

function buildAxisStructure(span, resolution, frame, pitch, gap, wall) {
  const edges = buildEdges(span, resolution);
  const mask = new Uint8Array(edges.length - 1);
  const solidIntervals = [];
  const slotIntervals = [];

  solidIntervals.push([0, frame], [span - frame, span]);

  const interior = Math.max(span - frame * 2, 0);
  const lineCount = Math.max(1, Math.floor(interior / pitch) + 1);
  const used = (lineCount - 1) * pitch;
  const start = frame + (interior - used) * 0.5;

  for (let i = 0; i < lineCount; i += 1) {
    const center = start + i * pitch;
    slotIntervals.push([center - gap * 0.5, center + gap * 0.5]);
    solidIntervals.push(
      [center - gap * 0.5 - wall, center - gap * 0.5],
      [center + gap * 0.5, center + gap * 0.5 + wall]
    );
  }

  const mergedSolid = mergeIntervals(solidIntervals);
  for (const [intervalStart, intervalEnd] of mergedSolid) {
    markInterval(mask, edges, intervalStart, intervalEnd);
  }

  let solidCount = 0;
  for (const flag of mask) {
    solidCount += flag;
  }

  return {
    edges,
    mask,
    solidIntervals: mergedSolid,
    slotIntervals,
    solidCount,
    lineCount,
  };
}

function evaluatePorosity(params, resolution, wall) {
  const x = buildAxisStructure(params.width, resolution, params.frame, params.pitch, params.gap, wall);
  const y = buildAxisStructure(params.length, resolution, params.frame, params.pitch, params.gap, wall);
  const cellCount = x.mask.length * y.mask.length;
  const solidCount = x.solidCount * y.mask.length + y.solidCount * x.mask.length - x.solidCount * y.solidCount;
  return 1 - solidCount / Math.max(1, cellCount);
}

function solveWallThickness(params, resolution) {
  const minWall = 0.5;
  const maxWall = Math.max(minWall, (params.pitch - params.gap - 0.8) * 0.5);
  const lowPorosity = evaluatePorosity(params, resolution, maxWall);
  const highPorosity = evaluatePorosity(params, resolution, minWall);

  if (params.porosity >= highPorosity) {
    return { wall: minWall, targetReached: false };
  }
  if (params.porosity <= lowPorosity) {
    return { wall: maxWall, targetReached: false };
  }

  let lo = minWall;
  let hi = maxWall;
  for (let i = 0; i < 22; i += 1) {
    const mid = (lo + hi) * 0.5;
    const porosity = evaluatePorosity(params, resolution, mid);
    if (porosity > params.porosity) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return { wall: (lo + hi) * 0.5, targetReached: true };
}

function pushTriangle(positions, normals, faceNormals, a, b, c, normal) {
  positions.push(...a, ...b, ...c);
  normals.push(...normal, ...normal, ...normal);
  faceNormals.push(...normal);
}

function pushQuad(positions, normals, faceNormals, points, normal) {
  pushTriangle(positions, normals, faceNormals, points[0], points[1], points[2], normal);
  pushTriangle(positions, normals, faceNormals, points[0], points[2], points[3], normal);
}

function buildMesh(xAxis, yAxis, thickness) {
  const positions = [];
  const normals = [];
  const faceNormals = [];
  const nx = xAxis.mask.length;
  const ny = yAxis.mask.length;
  const xOffset = xAxis.edges[xAxis.edges.length - 1] * 0.5;
  const yOffset = yAxis.edges[yAxis.edges.length - 1] * 0.5;
  const zMin = -thickness * 0.5;
  const zMax = thickness * 0.5;

  const solidAt = (ix, iy) => {
    if (ix < 0 || ix >= nx || iy < 0 || iy >= ny) {
      return 0;
    }
    return xAxis.mask[ix] || yAxis.mask[iy];
  };

  for (let iy = 0; iy < ny; iy += 1) {
    let ix = 0;
    while (ix < nx) {
      while (ix < nx && !solidAt(ix, iy)) {
        ix += 1;
      }
      if (ix >= nx) {
        break;
      }
      const start = ix;
      while (ix < nx && solidAt(ix, iy)) {
        ix += 1;
      }
      const x1 = xAxis.edges[start] - xOffset;
      const x2 = xAxis.edges[ix] - xOffset;
      const y1 = yAxis.edges[iy] - yOffset;
      const y2 = yAxis.edges[iy + 1] - yOffset;
      pushQuad(
        positions,
        normals,
        faceNormals,
        [
          [x1, y1, zMax],
          [x2, y1, zMax],
          [x2, y2, zMax],
          [x1, y2, zMax],
        ],
        [0, 0, 1]
      );
      pushQuad(
        positions,
        normals,
        faceNormals,
        [
          [x1, y1, zMin],
          [x1, y2, zMin],
          [x2, y2, zMin],
          [x2, y1, zMin],
        ],
        [0, 0, -1]
      );
    }
  }

  for (let ix = 0; ix <= nx; ix += 1) {
    let iy = 0;
    while (iy < ny) {
      const left = solidAt(ix - 1, iy);
      const right = solidAt(ix, iy);
      const direction = left === right ? 0 : left ? 1 : -1;
      if (!direction) {
        iy += 1;
        continue;
      }
      const start = iy;
      iy += 1;
      while (iy < ny) {
        const nextLeft = solidAt(ix - 1, iy);
        const nextRight = solidAt(ix, iy);
        const nextDirection = nextLeft === nextRight ? 0 : nextLeft ? 1 : -1;
        if (nextDirection !== direction) {
          break;
        }
        iy += 1;
      }
      const x = xAxis.edges[ix] - xOffset;
      const y1 = yAxis.edges[start] - yOffset;
      const y2 = yAxis.edges[iy] - yOffset;
      if (direction > 0) {
        pushQuad(
          positions,
          normals,
          faceNormals,
          [
            [x, y1, zMin],
            [x, y2, zMin],
            [x, y2, zMax],
            [x, y1, zMax],
          ],
          [1, 0, 0]
        );
      } else {
        pushQuad(
          positions,
          normals,
          faceNormals,
          [
            [x, y1, zMin],
            [x, y1, zMax],
            [x, y2, zMax],
            [x, y2, zMin],
          ],
          [-1, 0, 0]
        );
      }
    }
  }

  for (let iy = 0; iy <= ny; iy += 1) {
    let ix = 0;
    while (ix < nx) {
      const bottom = solidAt(ix, iy - 1);
      const top = solidAt(ix, iy);
      const direction = bottom === top ? 0 : bottom ? 1 : -1;
      if (!direction) {
        ix += 1;
        continue;
      }
      const start = ix;
      ix += 1;
      while (ix < nx) {
        const nextBottom = solidAt(ix, iy - 1);
        const nextTop = solidAt(ix, iy);
        const nextDirection = nextBottom === nextTop ? 0 : nextBottom ? 1 : -1;
        if (nextDirection !== direction) {
          break;
        }
        ix += 1;
      }
      const y = yAxis.edges[iy] - yOffset;
      const x1 = xAxis.edges[start] - xOffset;
      const x2 = xAxis.edges[ix] - xOffset;
      if (direction > 0) {
        pushQuad(
          positions,
          normals,
          faceNormals,
          [
            [x1, y, zMin],
            [x1, y, zMax],
            [x2, y, zMax],
            [x2, y, zMin],
          ],
          [0, 1, 0]
        );
      } else {
        pushQuad(
          positions,
          normals,
          faceNormals,
          [
            [x1, y, zMin],
            [x2, y, zMin],
            [x2, y, zMax],
            [x1, y, zMax],
          ],
          [0, -1, 0]
        );
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    faceNormals: new Float32Array(faceNormals),
    triangleCount: faceNormals.length / 3,
  };
}

function buildDesign(params) {
  const normalized = { ...params };
  normalized.pitch = Math.max(normalized.pitch, normalized.gap + 1.8);
  normalized.frame = Math.min(normalized.frame, Math.min(normalized.width, normalized.length) * 0.2);

  const resolution = estimateResolution(normalized);
  const wallSolution = solveWallThickness(normalized, resolution);
  const wall = wallSolution.wall;

  const xAxis = buildAxisStructure(normalized.width, resolution, normalized.frame, normalized.pitch, normalized.gap, wall);
  const yAxis = buildAxisStructure(normalized.length, resolution, normalized.frame, normalized.pitch, normalized.gap, wall);
  const cellCount = xAxis.mask.length * yAxis.mask.length;
  const solidCount = xAxis.solidCount * yAxis.mask.length + yAxis.solidCount * xAxis.mask.length - xAxis.solidCount * yAxis.solidCount;
  const porosity = 1 - solidCount / Math.max(1, cellCount);
  const chamber = Math.max(normalized.pitch - normalized.gap - wall * 2, 0);
  const mesh = buildMesh(xAxis, yAxis, normalized.thickness);
  const solidArea = normalized.width * normalized.length * (1 - porosity);
  const volumeMm3 = solidArea * normalized.thickness;
  const massGram = volumeMm3 * 0.00124;
  const wettedPerimeter = (xAxis.lineCount * normalized.length + yAxis.lineCount * normalized.width) * 2;
  const wetIndex = wettedPerimeter / Math.max(1, normalized.width * normalized.length);

  const warnings = [];
  if (normalized.gap > 1.3) {
    warnings.push("毛細管スリットが広めです。給水を優先するなら 0.7 - 1.1 mm 側が安定しやすいです。");
  }
  if (wall < 0.55) {
    warnings.push("壁厚がかなり薄いです。0.4 mm ノズルでは積層条件を詰めないと欠けやすくなります。");
  }
  if (chamber < 1.2) {
    warnings.push("通気チャンバーが狭めです。根の酸素確保を重視するならピッチを上げるか空隙率を上げてください。");
  }
  if (normalized.thickness < 1.7) {
    warnings.push("厚みが薄く、反りや座屈が出やすい構成です。大きいサイズでは 2 mm 以上が無難です。");
  }
  if (!wallSolution.targetReached) {
    warnings.push("指定した空隙率はこのピッチとスリット径では厳しいため、壁厚を制約内で近い値に寄せています。");
  }
  if (!warnings.length) {
    warnings.push("この構成なら、毛細管と通気のバランスは比較的良好です。まずは低速で 1 枚試作すると挙動を掴みやすいです。");
  }

  return {
    params: normalized,
    resolution,
    wall,
    porosity,
    chamber,
    mesh,
    xAxis,
    yAxis,
    metrics: {
      wall,
      porosity,
      chamber,
      xChannels: xAxis.lineCount,
      yChannels: yAxis.lineCount,
      wetIndex,
      massGram,
      triangleCount: mesh.triangleCount,
    },
    warnings,
  };
}

function updateMetrics(design) {
  const metrics = [
    { label: "実壁厚", value: `${formatValue(design.metrics.wall, 2)} mm` },
    { label: "実空隙率", value: `${formatValue(design.metrics.porosity * 100, 1)} %` },
    { label: "通気チャンバー", value: `${formatValue(design.metrics.chamber, 2)} mm` },
    { label: "毛細管本数", value: `${design.metrics.xChannels} × ${design.metrics.yChannels}` },
    { label: "濡れ広がり指数", value: formatValue(design.metrics.wetIndex, 3) },
    { label: "概算質量", value: `${formatValue(design.metrics.massGram, 1)} g` },
  ];

  dom.metricsGrid.innerHTML = metrics
    .map(
      ({ label, value }) => `
        <div class="metric-card">
          <div class="label">${label}</div>
          <div class="value">${value}</div>
        </div>
      `
    )
    .join("");

  dom.warningList.innerHTML = design.warnings
    .map((warning, index) => {
      const klass = index === 0 && design.warnings.length === 1 ? "warning ok" : "warning";
      return `<div class="${klass}">${warning}</div>`;
    })
    .join("");

  dom.meshInfo.textContent = `${design.mesh.triangleCount.toLocaleString()} tris / ${formatValue(
    design.resolution,
    2
  )} mm vox`;
}

function updateGeometry(design) {
  if (state.geometry) {
    state.geometry.dispose();
  }
  if (state.edgeGeometry) {
    state.edgeGeometry.dispose();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(design.mesh.positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(design.mesh.normals, 3));
  geometry.computeBoundingSphere();
  state.geometry = geometry;
  matMesh.geometry = geometry;

  const edgeGeometry = new THREE.EdgesGeometry(geometry, 26);
  state.edgeGeometry = edgeGeometry;
  edgeLines.geometry = edgeGeometry;

  const radius = geometry.boundingSphere ? geometry.boundingSphere.radius : 80;
  if (controls) {
    controls.target.set(0, 0, 0);
    controls.minDistance = Math.max(30, radius * 0.9);
    controls.maxDistance = Math.max(240, radius * 6.5);
  }
  camera.position.set(radius * 1.35, -radius * 1.7, radius * 1.2);
  stage.scale.setScalar(Math.max(0.9, radius / 90));
  accentRing.scale.setScalar(Math.max(0.9, radius / 110));
}

function fillIntervals(ctx, intervals, span, fullSpan, scale, fillStyle, vertical) {
  ctx.fillStyle = fillStyle;
  for (const [start, end] of intervals) {
    const a = start * scale;
    const b = end * scale;
    if (vertical) {
      ctx.fillRect(a, 0, Math.max(1, b - a), fullSpan * scale);
    } else {
      ctx.fillRect(0, a, span * scale, Math.max(1, b - a));
    }
  }
}

function drawPlan(design) {
  if (!design) {
    return;
  }
  const canvas = dom.planCanvas;
  const ctx = canvas.getContext("2d");
  const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const drawWidth = Math.max(1, Math.round(cssWidth * dpr));
  const drawHeight = Math.max(1, Math.round(cssHeight * dpr));
  if (canvas.width !== drawWidth || canvas.height !== drawHeight) {
    canvas.width = drawWidth;
    canvas.height = drawHeight;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const pad = 28 * dpr;
  const scale = Math.min(
    (canvas.width - pad * 2) / design.params.width,
    (canvas.height - pad * 2) / design.params.length
  );

  ctx.save();
  ctx.translate((canvas.width - design.params.width * scale) * 0.5, (canvas.height - design.params.length * scale) * 0.5);

  ctx.fillStyle = "#d7f0d0";
  ctx.fillRect(0, 0, design.params.width * scale, design.params.length * scale);

  fillIntervals(ctx, design.xAxis.solidIntervals, design.params.length, design.params.length, scale, "#3e8b58", true);
  fillIntervals(ctx, design.yAxis.solidIntervals, design.params.width, design.params.width, scale, "#3e8b58", false);

  ctx.fillStyle = "rgba(236, 249, 231, 0.96)";
  for (const [slotStart, slotEnd] of design.xAxis.slotIntervals) {
    ctx.fillRect(slotStart * scale, 0, Math.max(1, (slotEnd - slotStart) * scale), design.params.length * scale);
  }
  for (const [slotStart, slotEnd] of design.yAxis.slotIntervals) {
    ctx.fillRect(0, slotStart * scale, design.params.width * scale, Math.max(1, (slotEnd - slotStart) * scale));
  }

  ctx.strokeStyle = "rgba(20, 50, 30, 0.35)";
  ctx.lineWidth = Math.max(1, dpr);
  ctx.strokeRect(0, 0, design.params.width * scale, design.params.length * scale);

  ctx.fillStyle = "rgba(22, 48, 32, 0.74)";
  ctx.font = `${12 * dpr}px IBM Plex Sans JP`;
  ctx.fillText(
    `${formatValue(design.params.width, 0)} × ${formatValue(design.params.length, 0)} mm`,
    8 * dpr,
    18 * dpr
  );

  ctx.restore();
}

function resizeViewer() {
  if (renderer) {
    const rect = dom.viewerMount.getBoundingClientRect();
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  }
  drawPlan(state.currentDesign);
}

function renderAll() {
  state.currentDesign = buildDesign(state.params);
  state.params = { ...state.currentDesign.params };
  syncControls();
  updateMetrics(state.currentDesign);
  updateGeometry(state.currentDesign);
  drawPlan(state.currentDesign);
  window.history.replaceState(null, "", toHash(state.params));
}

function exportStl(design) {
  const lines = ["solid capillary_mat"];
  const positions = design.mesh.positions;
  const faceNormals = design.mesh.faceNormals;

  for (let triangleIndex = 0; triangleIndex < faceNormals.length / 3; triangleIndex += 1) {
    const nx = faceNormals[triangleIndex * 3 + 0];
    const ny = faceNormals[triangleIndex * 3 + 1];
    const nz = faceNormals[triangleIndex * 3 + 2];
    lines.push(`facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}`);
    lines.push(" outer loop");
    for (let vertex = 0; vertex < 3; vertex += 1) {
      const offset = triangleIndex * 9 + vertex * 3;
      lines.push(
        `  vertex ${positions[offset + 0].toFixed(6)} ${positions[offset + 1].toFixed(6)} ${positions[offset + 2].toFixed(6)}`
      );
    }
    lines.push(" endloop");
    lines.push("endfacet");
  }

  lines.push("endsolid capillary_mat");
  return new Blob([lines.join("\n")], { type: "model/stl" });
}

function downloadCurrentStl() {
  const blob = exportStl(state.currentDesign);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const name = [
    "capillary-mat",
    `${Math.round(state.currentDesign.params.width)}x${Math.round(state.currentDesign.params.length)}`,
    `gap-${formatValue(state.currentDesign.params.gap, 2)}`,
    `void-${Math.round(state.currentDesign.metrics.porosity * 100)}`,
  ].join("-");
  anchor.href = url;
  anchor.download = `${name}.stl`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  dom.actionStatus.textContent = "STL をダウンロードしました。";
}

async function copyShareUrl() {
  const url = `${window.location.origin}${window.location.pathname}${toHash(state.params)}`;
  try {
    await navigator.clipboard.writeText(url);
    dom.actionStatus.textContent = "共有 URL をコピーしました。";
  } catch (error) {
    dom.actionStatus.textContent = "クリップボードに書き込めなかったため、URL をアドレスバーからコピーしてください。";
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (!renderer || !controls) {
    return;
  }
  controls.update();
  accentRing.rotation.z += 0.0022;
  renderer.render(scene, camera);
}

for (const field of FIELD_IDS) {
  const range = document.querySelector(`#${field}Range`);
  const number = document.querySelector(`#${field}Number`);
  const handleInput = (event) => {
    const next = Number(event.target.value);
    if (!Number.isFinite(next)) {
      return;
    }
    state.params[field] = next;
    range.value = String(next);
    number.value = String(next);
    renderAll();
  };
  range.addEventListener("input", handleInput);
  number.addEventListener("input", handleInput);
}

for (const button of document.querySelectorAll("[data-preset]")) {
  button.addEventListener("click", () => {
    applyParams(PRESETS[button.dataset.preset]);
    dom.actionStatus.textContent = `${button.textContent} preset を適用しました。`;
  });
}

dom.downloadBtn.addEventListener("click", downloadCurrentStl);
dom.copyLinkBtn.addEventListener("click", copyShareUrl);
dom.resetBtn.addEventListener("click", () => {
  applyParams(DEFAULTS);
  dom.actionStatus.textContent = "既定値に戻しました。";
});

window.addEventListener("resize", resizeViewer);

const initialFromHash = fromHash();
if (initialFromHash) {
  state.params = { ...state.params, ...initialFromHash };
}
initRenderer();
syncControls();
renderAll();
resizeViewer();
animate();
