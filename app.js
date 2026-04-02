import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const MAT_FIELDS = [
  { key: "width", label: "幅", unit: "mm", min: 60, max: 220, step: 2, precision: 0 },
  { key: "length", label: "長さ", unit: "mm", min: 60, max: 220, step: 2, precision: 0 },
  { key: "thickness", label: "厚み", unit: "mm", min: 1.6, max: 8, step: 0.1, precision: 2 },
  {
    key: "capillary",
    label: "毛細管の空隙幅",
    unit: "mm",
    min: 0.4,
    max: 2.4,
    step: 0.05,
    precision: 2,
    help: "水を引き上げる細い列の内幅です。狭いほど毛細力は上がります。",
  },
  {
    key: "wall",
    label: "毛細管の壁厚",
    unit: "mm",
    min: 0.35,
    max: 2.2,
    step: 0.05,
    precision: 2,
    help: "空隙列の左右を囲う樹脂厚です。剛性と目詰まり耐性に効きます。",
  },
  {
    key: "xSpacing",
    label: "縦列の外壁クリアランス",
    unit: "mm",
    min: 0.6,
    max: 16,
    step: 0.1,
    precision: 2,
    help: "隣り合う縦列の外壁どうしの最短距離です。中心間距離ではなく、通気空間の実クリアランスを指定します。",
  },
  {
    key: "ySpacing",
    label: "横列の外壁クリアランス",
    unit: "mm",
    min: 0.6,
    max: 16,
    step: 0.1,
    precision: 2,
    help: "隣り合う横列の外壁どうしの最短距離です。Y 方向の密度を実クリアランス基準で決めます。",
  },
  { key: "frame", label: "外周フレーム幅", unit: "mm", min: 2, max: 12, step: 0.2, precision: 2 },
  {
    key: "dimple",
    label: "交点をディンプル状に凹ませる",
    type: "toggle",
    help: "交差部の上面を浅く凹ませて、播種位置のガイドにします。",
  },
  {
    key: "dimpleDepth",
    label: "ディンプル深さ",
    unit: "mm",
    min: 0.1,
    max: 1.2,
    step: 0.05,
    precision: 2,
    dependsOn: "dimple",
  },
];

const SPONGE_FIELDS = [
  { key: "width", label: "幅", unit: "mm", min: 60, max: 220, step: 2, precision: 0 },
  { key: "length", label: "長さ", unit: "mm", min: 60, max: 220, step: 2, precision: 0 },
  { key: "thickness", label: "厚み", unit: "mm", min: 4, max: 18, step: 0.2, precision: 2 },
  { key: "frame", label: "外周フレーム幅", unit: "mm", min: 2, max: 12, step: 0.2, precision: 2 },
  {
    key: "pore",
    label: "スポンジ胞の開口",
    unit: "mm",
    min: 2.5,
    max: 12,
    step: 0.1,
    precision: 2,
    help: "層状ラティスの開口です。大きいほど通気が増えます。",
  },
  {
    key: "rib",
    label: "層ラティスのリブ厚",
    unit: "mm",
    min: 0.45,
    max: 1.8,
    step: 0.05,
    precision: 2,
    help: "各層を構成する樹脂リブの太さです。",
  },
  {
    key: "layers",
    label: "積層レイヤー数",
    unit: "count",
    min: 2,
    max: 7,
    step: 1,
    precision: 0,
    help: "水平ラティス層の枚数です。多いほど 3D スポンジ感が増します。",
  },
  {
    key: "stagger",
    label: "層ごとのオフセット率",
    unit: "ratio",
    min: 0,
    max: 0.9,
    step: 0.05,
    precision: 2,
    help: "上下層をずらして、水と空気の経路に蛇行を作ります。",
  },
  {
    key: "wickWidth",
    label: "縦ウィック径",
    unit: "mm",
    min: 0.45,
    max: 2.2,
    step: 0.05,
    precision: 2,
    help: "下から上へ水を引き上げる縦方向の柱径です。",
  },
  {
    key: "wickPitch",
    label: "縦ウィック間隔",
    unit: "mm",
    min: 6,
    max: 26,
    step: 0.2,
    precision: 2,
    help: "縦ウィック柱の密度です。",
  },
];

const MODELS = {
  mat: {
    id: "mat",
    label: "Capillary Mat",
    shortLabel: "平面マット",
    eyebrow: "Realtime Preview",
    title: "毛細管の内幅・壁厚・縦横密度を直接設計",
    lead:
      "空隙列の幅を毛細管として決め、その周囲の壁厚と縦横の配置密度を別々に指定します。交点ディンプルを入れると、播種位置を形状側で持てます。",
    paramHint: "毛細管幅・壁厚・X/Y 密度を直接指定",
    planTitle: "Top View",
    planSubtitle: "毛細管列とディンプル配置",
    noteSummary: "平面マット設計メモ",
    noteCopy: [
      "このモードは、細い毛細管列を縦横に組み合わせた平面マットです。列の内幅を先に決め、その外側に壁厚を付け、さらに隣列の外壁どうしのクリアランスを X/Y 別に指定します。",
      "列の距離を広げると酸素が入りやすくなり、詰まりにも強くなりますが、マット全域へ水が回る速度は落ちます。逆に密度を上げると広がりは速い代わりに空気室が減ります。",
      "交点ディンプルは、交差する壁の上面だけを浅く落とした播種ポケットです。種を置きやすいですが、深くしすぎると上面の厚みが減るので 0.3 - 0.6 mm 程度が扱いやすいです。",
    ],
    legend: [
      { klass: "solid", label: "樹脂壁" },
      { klass: "slot", label: "毛細管列" },
      { klass: "chamber", label: "通気空間" },
    ],
    defaults: {
      width: 120,
      length: 120,
      thickness: 2.6,
      capillary: 0.9,
      wall: 0.65,
      xSpacing: 5.2,
      ySpacing: 6.8,
      frame: 4.2,
      dimple: true,
      dimpleDepth: 0.45,
    },
    presets: {
      seedling: {
        label: "Seedling",
        params: {
          width: 96,
          length: 96,
          thickness: 2.2,
          capillary: 0.75,
          wall: 0.58,
          xSpacing: 4.1,
          ySpacing: 4.8,
          frame: 3.4,
          dimple: true,
          dimpleDepth: 0.35,
        },
      },
      leafy: {
        label: "Leafy Tray",
        params: {
          width: 140,
          length: 110,
          thickness: 2.8,
          capillary: 0.95,
          wall: 0.72,
          xSpacing: 6.2,
          ySpacing: 7.8,
          frame: 4.6,
          dimple: true,
          dimpleDepth: 0.5,
        },
      },
      orchid: {
        label: "Orchid Wick",
        params: {
          width: 88,
          length: 148,
          thickness: 3.4,
          capillary: 1.15,
          wall: 0.85,
          xSpacing: 7.6,
          ySpacing: 9.2,
          frame: 4.8,
          dimple: false,
          dimpleDepth: 0.4,
        },
      },
    },
    fields: MAT_FIELDS,
    buildDesign: buildMatDesign,
    drawPlan: drawMatPlan,
    fileStem: "capillary-mat",
  },
  sponge: {
    id: "sponge",
    label: "Sponge Soil Beta",
    shortLabel: "立体スポンジ案",
    eyebrow: "Beta Concept",
    title: "3D プリンタ向けの層状スポンジ毛細管土壌を検討",
    lead:
      "水平ラティス層を上下に積み、縦ウィック柱でつないだ試作案です。完全な土壌代替ではなく、立体的な保水・通気体としての検討タブです。",
    paramHint: "層状ラティスと縦ウィックの構成を試作",
    planTitle: "Layer Map",
    planSubtitle: "最上層パターンと縦ウィック位置",
    noteSummary: "立体スポンジ案メモ",
    noteCopy: [
      "この別タブは、3D プリントの積層を活かして平面ではなく層状の毛細管ネットワークを作る試作案です。各層の格子を少しずつずらし、縦ウィック柱で上下をつなぎます。",
      "平面マットより保水体積を増やしつつ、層間空間で酸素を持たせる狙いです。播種床よりも、挿し木や発芽後の根域保持材として相性がよい構成です。",
      "この案はまだ検討用ですが、STL 書き出しまでできます。実機ではサポート不要で出せるか、ブリッジ長と層板厚のバランスを見るのが重要です。",
    ],
    legend: [
      { klass: "solid", label: "層ラティス" },
      { klass: "slot", label: "縦ウィック" },
      { klass: "chamber", label: "スポンジ空間" },
    ],
    defaults: {
      width: 110,
      length: 110,
      thickness: 8.4,
      frame: 4,
      pore: 5.2,
      rib: 0.85,
      layers: 4,
      stagger: 0.35,
      wickWidth: 0.95,
      wickPitch: 15.5,
    },
    presets: {
      nursery: {
        label: "Nursery Plug",
        params: {
          width: 84,
          length: 84,
          thickness: 6.8,
          frame: 3.4,
          pore: 4.1,
          rib: 0.72,
          layers: 4,
          stagger: 0.28,
          wickWidth: 0.85,
          wickPitch: 12.6,
        },
      },
      wickbed: {
        label: "Wick Bed",
        params: {
          width: 136,
          length: 108,
          thickness: 10.2,
          frame: 4.8,
          pore: 6.4,
          rib: 0.92,
          layers: 5,
          stagger: 0.4,
          wickWidth: 1.05,
          wickPitch: 17.8,
        },
      },
      airy: {
        label: "Airy Sponge",
        params: {
          width: 120,
          length: 120,
          thickness: 11.6,
          frame: 4.2,
          pore: 7.8,
          rib: 0.78,
          layers: 5,
          stagger: 0.55,
          wickWidth: 0.82,
          wickPitch: 18.6,
        },
      },
    },
    fields: SPONGE_FIELDS,
    buildDesign: buildSpongeDesign,
    drawPlan: drawSpongePlan,
    fileStem: "sponge-soil-beta",
  },
};

for (const model of Object.values(MODELS)) {
  model.fieldMap = new Map(model.fields.map((field) => [field.key, field]));
}

const state = {
  mode: "mat",
  paramsByMode: Object.fromEntries(Object.values(MODELS).map((model) => [model.id, { ...model.defaults }])),
  currentDesign: null,
  geometry: null,
  edgeGeometry: null,
  controlMap: new Map(),
};

const dom = {
  modeTabs: document.querySelector("#modeTabs"),
  presetGrid: document.querySelector("#presetGrid"),
  paramHint: document.querySelector("#paramHint"),
  controlFields: document.querySelector("#controlFields"),
  metricsGrid: document.querySelector("#metricsGrid"),
  warningList: document.querySelector("#warningList"),
  actionStatus: document.querySelector("#actionStatus"),
  downloadBtn: document.querySelector("#downloadBtn"),
  copyLinkBtn: document.querySelector("#copyLinkBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  meshInfo: document.querySelector("#meshInfo"),
  planCanvas: document.querySelector("#planCanvas"),
  viewerMount: document.querySelector("#viewerMount"),
  noteSummary: document.querySelector("#noteSummary"),
  noteCopy: document.querySelector("#noteCopy"),
  heroEyebrow: document.querySelector("#heroEyebrow"),
  heroTitle: document.querySelector("#heroTitle"),
  heroLead: document.querySelector("#heroLead"),
  legend: document.querySelector("#legend"),
  planTitle: document.querySelector("#planTitle"),
  planSubtitle: document.querySelector("#planSubtitle"),
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
matMesh.rotation.x = -Math.PI / 2;
scene.add(matMesh);

const edgeLines = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
  new THREE.LineBasicMaterial({ color: 0x1f5137, transparent: true, opacity: 0.28 })
);
edgeLines.rotation.x = -Math.PI / 2;
scene.add(edgeLines);

const stage = new THREE.Mesh(
  new THREE.CylinderGeometry(140, 170, 8, 64),
  new THREE.MeshStandardMaterial({
    color: 0xe7efe2,
    roughness: 0.95,
    metalness: 0,
  })
);
stage.position.y = -8;
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
accentRing.position.y = -3.8;
scene.add(accentRing);

function initRenderer() {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
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

function positiveModulo(value, modulus) {
  if (!modulus) {
    return 0;
  }
  return ((value % modulus) + modulus) % modulus;
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

function buildEdges(span, resolution) {
  const count = Math.max(1, Math.ceil(span / resolution));
  const edges = new Float32Array(count + 1);
  for (let index = 0; index <= count; index += 1) {
    edges[index] = Math.min(index * resolution, span);
  }
  return edges;
}

function buildAnchoredEdges(span, resolution, anchors = []) {
  const points = [0, span];
  for (const anchor of anchors) {
    if (!Number.isFinite(anchor)) {
      continue;
    }
    points.push(clamp(anchor, 0, span));
  }
  points.sort((a, b) => a - b);

  const unique = [];
  for (const point of points) {
    if (!unique.length || Math.abs(point - unique[unique.length - 1]) > 1e-6) {
      unique.push(point);
    }
  }

  const edges = [0];
  for (let index = 1; index < unique.length; index += 1) {
    const start = unique[index - 1];
    const end = unique[index];
    const segment = end - start;
    if (segment <= 1e-6) {
      continue;
    }
    const steps = Math.max(1, Math.ceil(segment / resolution));
    for (let step = 1; step <= steps; step += 1) {
      edges.push(start + (segment * step) / steps);
    }
  }
  edges[edges.length - 1] = span;
  return Float32Array.from(edges);
}

function markInterval(mask, edges, start, end) {
  const clippedStart = clamp(start, 0, edges[edges.length - 1]);
  const clippedEnd = clamp(end, 0, edges[edges.length - 1]);
  if (clippedEnd <= clippedStart) {
    return;
  }
  for (let index = 0; index < mask.length; index += 1) {
    const cellStart = edges[index];
    const cellEnd = edges[index + 1];
    if (cellEnd <= clippedStart || cellStart >= clippedEnd) {
      continue;
    }
    mask[index] = 1;
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
  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const last = merged[merged.length - 1];
    if (current[0] <= last[1] + 1e-6) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current.slice());
    }
  }
  return merged;
}

function buildIntervalMask(edges, intervals) {
  const mask = new Uint8Array(edges.length - 1);
  for (const [start, end] of intervals) {
    markInterval(mask, edges, start, end);
  }
  return mask;
}

function getModel() {
  return MODELS[state.mode];
}

function getActiveParams() {
  return state.paramsByMode[state.mode];
}

function parseFieldValue(field, raw) {
  if (field.type === "toggle") {
    return raw === "1" || raw === "true";
  }
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

function toHash() {
  const model = getModel();
  const search = new URLSearchParams();
  search.set("mode", model.id);
  for (const field of model.fields) {
    const value = getActiveParams()[field.key];
    if (field.type === "toggle") {
      search.set(field.key, value ? "1" : "0");
    } else {
      search.set(field.key, String(roundTo(value, field.precision != null ? field.precision : 2)));
    }
  }
  return `#${search.toString()}`;
}

function fromHash() {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  if (!hash) {
    return null;
  }
  const params = new URLSearchParams(hash);
  const mode = params.get("mode");
  const model = MODELS[mode] || MODELS.mat;
  const parsed = {};
  for (const field of model.fields) {
    const raw = params.get(field.key);
    if (raw == null) {
      continue;
    }
    const value = parseFieldValue(field, raw);
    if (value == null) {
      continue;
    }
    parsed[field.key] = value;
  }
  return { mode: model.id, params: parsed };
}

function renderModeTabs() {
  dom.modeTabs.innerHTML = Object.values(MODELS)
    .map(
      (model) => `
        <button
          type="button"
          class="mode-tab ${model.id === state.mode ? "is-active" : ""}"
          data-mode="${model.id}"
        >
          <span>${model.shortLabel}</span>
          <small>${model.label}</small>
        </button>
      `
    )
    .join("");

  for (const button of dom.modeTabs.querySelectorAll("[data-mode]")) {
    button.addEventListener("click", () => {
      if (button.dataset.mode === state.mode) {
        return;
      }
      state.mode = button.dataset.mode;
      renderModeUi();
      renderAll();
      dom.actionStatus.textContent = `${getModel().shortLabel} モードへ切り替えました。`;
    });
  }
}

function renderPresets() {
  const model = getModel();
  dom.presetGrid.innerHTML = Object.entries(model.presets)
    .map(
      ([presetKey, preset]) => `
        <button type="button" class="preset-btn" data-preset="${presetKey}">
          ${preset.label}
        </button>
      `
    )
    .join("");

  for (const button of dom.presetGrid.querySelectorAll("[data-preset]")) {
    button.addEventListener("click", () => {
      const preset = model.presets[button.dataset.preset];
      applyParams(preset.params);
      dom.actionStatus.textContent = `${preset.label} preset を適用しました。`;
    });
  }
}

function renderLegend() {
  dom.legend.innerHTML = getModel().legend
    .map(({ klass, label }) => `<span><i class="swatch ${klass}"></i>${label}</span>`)
    .join("");
}

function renderNotes() {
  const model = getModel();
  dom.noteSummary.textContent = model.noteSummary;
  dom.noteCopy.innerHTML = model.noteCopy.map((paragraph) => `<p>${paragraph}</p>`).join("");
}

function renderHero() {
  const model = getModel();
  dom.heroEyebrow.textContent = model.eyebrow;
  dom.heroTitle.textContent = model.title;
  dom.heroLead.textContent = model.lead;
  dom.paramHint.textContent = model.paramHint;
  dom.planTitle.textContent = model.planTitle;
  dom.planSubtitle.textContent = model.planSubtitle;
}

function controlId(fieldKey, suffix) {
  return `${state.mode}-${fieldKey}-${suffix}`;
}

function renderControls() {
  const model = getModel();
  state.controlMap = new Map();

  dom.controlFields.innerHTML = model.fields
    .map((field) => {
      if (field.type === "toggle") {
        return `
          <label class="toggle-control control" data-control="${field.key}">
            <div class="toggle-copy">
              <div class="control-head">
                <span>${field.label}</span>
                <span class="unit">on / off</span>
              </div>
              ${field.help ? `<p class="control-copy">${field.help}</p>` : ""}
            </div>
            <input id="${controlId(field.key, "toggle")}" type="checkbox" />
          </label>
        `;
      }

      return `
        <label class="control" data-control="${field.key}">
          <div class="control-head">
            <span>${field.label}</span>
            <span class="unit">${field.unit}</span>
          </div>
          <div class="control-inputs">
            <input
              id="${controlId(field.key, "range")}"
              type="range"
              min="${field.min}"
              max="${field.max}"
              step="${field.step}"
            />
            <input
              id="${controlId(field.key, "number")}"
              type="number"
              min="${field.min}"
              max="${field.max}"
              step="${field.step}"
            />
          </div>
          ${field.help ? `<p class="control-copy">${field.help}</p>` : ""}
        </label>
      `;
    })
    .join("");

  for (const field of model.fields) {
    if (field.type === "toggle") {
      const toggle = document.querySelector(`#${controlId(field.key, "toggle")}`);
      toggle.addEventListener("input", () => {
        getActiveParams()[field.key] = toggle.checked;
        setDependentControlStates();
        renderAll();
      });
      state.controlMap.set(field.key, { field, toggle, root: toggle.closest("[data-control]") });
      continue;
    }

    const range = document.querySelector(`#${controlId(field.key, "range")}`);
    const number = document.querySelector(`#${controlId(field.key, "number")}`);
    const handleInput = (event) => {
      const next = Number(event.target.value);
      if (!Number.isFinite(next)) {
        return;
      }
      getActiveParams()[field.key] = next;
      range.value = String(next);
      number.value = String(next);
      renderAll();
    };
    range.addEventListener("input", handleInput);
    number.addEventListener("input", handleInput);
    state.controlMap.set(field.key, { field, range, number, root: range.closest("[data-control]") });
  }

  syncControls();
  setDependentControlStates();
}

function renderModeUi() {
  renderModeTabs();
  renderPresets();
  renderHero();
  renderLegend();
  renderControls();
  renderNotes();
}

function syncControls() {
  const params = getActiveParams();
  for (const [key, controlsForField] of state.controlMap) {
    const field = controlsForField.field;
    if (field.type === "toggle") {
      controlsForField.toggle.checked = Boolean(params[key]);
      continue;
    }
    const value = roundTo(params[key], field.precision != null ? field.precision : 2);
    controlsForField.range.value = String(value);
    controlsForField.number.value = String(value);
  }
}

function setDependentControlStates() {
  const params = getActiveParams();
  for (const controlsForField of state.controlMap.values()) {
    const { field, root } = controlsForField;
    if (!field.dependsOn) {
      continue;
    }
    const enabled = Boolean(params[field.dependsOn]);
    root.classList.toggle("is-disabled", !enabled);
    if (controlsForField.range) {
      controlsForField.range.disabled = !enabled;
      controlsForField.number.disabled = !enabled;
    }
  }
}

function applyParams(partial) {
  const model = getModel();
  const nextParams = getActiveParams();
  for (const field of model.fields) {
    if (!(field.key in partial)) {
      continue;
    }
    if (field.type === "toggle") {
      nextParams[field.key] = Boolean(partial[field.key]);
      continue;
    }
    const numeric = Number(partial[field.key]);
    if (!Number.isFinite(numeric)) {
      continue;
    }
    nextParams[field.key] = clamp(numeric, field.min, field.max);
  }
  syncControls();
  setDependentControlStates();
  renderAll();
}

function buildChannelAxis(span, resolution, frame, capillary, wall, spacing) {
  const interior = Math.max(span - frame * 2, 0.1);
  const usableCapillary = clamp(capillary, 0.25, Math.max(0.25, interior - 0.36));
  const usableWall = clamp(wall, 0.18, Math.max(0.18, (interior - usableCapillary) * 0.5));
  const spacingValue = Math.max(0.2, spacing);
  const envelope = usableCapillary + usableWall * 2;
  const channelCount = Math.max(1, Math.floor((interior + spacingValue) / Math.max(envelope + spacingValue, 0.01)));
  const used = channelCount * envelope + Math.max(0, channelCount - 1) * spacingValue;
  const start = frame + Math.max(0, interior - used) * 0.5;

  const slotIntervals = [];
  const wallIntervals = [];
  const solidIntervals = [
    [0, frame],
    [span - frame, span],
  ];
  const channelCenters = [];

  let cursor = start;
  for (let index = 0; index < channelCount; index += 1) {
    const leftWallStart = cursor;
    const slotStart = leftWallStart + usableWall;
    const slotEnd = slotStart + usableCapillary;
    const rightWallEnd = slotEnd + usableWall;
    slotIntervals.push([slotStart, slotEnd]);
    wallIntervals.push([leftWallStart, slotStart], [slotEnd, rightWallEnd]);
    solidIntervals.push([leftWallStart, slotStart], [slotEnd, rightWallEnd]);
    channelCenters.push(slotStart + usableCapillary * 0.5);
    cursor += envelope + spacingValue;
  }

  const anchors = [frame, span - frame];
  for (const [start, end] of slotIntervals) {
    anchors.push(start, end);
  }
  for (const [start, end] of wallIntervals) {
    anchors.push(start, end);
  }
  const edges = buildAnchoredEdges(span, resolution, anchors);
  const mergedSolid = mergeIntervals(solidIntervals);
  const mergedWalls = mergeIntervals(wallIntervals.concat([
    [0, frame],
    [span - frame, span],
  ]));
  const wallMask = buildIntervalMask(edges, mergedWalls);
  const slotMask = buildIntervalMask(edges, slotIntervals);

  return {
    edges,
    slotIntervals,
    slotMask,
    wallIntervals: mergedWalls,
    wallMask,
    solidIntervals: mergedSolid,
    channelCenters,
    lineCount: channelCount,
    effectiveCapillary: usableCapillary,
    effectiveWall: usableWall,
    pitch: envelope + spacingValue,
  };
}

function estimateMatResolution(params) {
  const dominant = Math.max(params.width, params.length);
  const detail = Math.min(
    params.capillary * 0.45,
    params.wall * 0.7,
    params.xSpacing * 0.45,
    params.ySpacing * 0.45,
    params.thickness * 0.32
  );
  return clamp(detail, Math.max(0.24, dominant / 250), 0.68);
}

function estimateSpongeResolution(params) {
  const dominant = Math.max(params.width, params.length);
  const detail = Math.min(
    params.rib * 0.9,
    params.wickWidth * 0.75,
    params.pore * 0.28,
    params.thickness / Math.max(8, params.layers * 2.2)
  );
  return clamp(detail, Math.max(0.28, dominant / 220), 0.74);
}

function buildZEdges(thickness, xyResolution) {
  const zResolution = clamp(Math.min(xyResolution, thickness / 8.5), 0.18, 0.48);
  return buildEdges(thickness, zResolution);
}

function nearestDistance(centers, value) {
  let best = Infinity;
  for (const center of centers) {
    best = Math.min(best, Math.abs(center - value));
  }
  return best;
}

function classifyMatCell(xAxis, yAxis, ix, iy) {
  const xWall = Boolean(xAxis.wallMask[ix]);
  const yWall = Boolean(yAxis.wallMask[iy]);
  const xSlot = Boolean(xAxis.slotMask[ix]);
  const ySlot = Boolean(yAxis.slotMask[iy]);
  const isSlot = xSlot || ySlot;
  const isSolid = !isSlot && (xWall || yWall);
  const isBridge = xSlot && ySlot;
  return { xWall, yWall, xSlot, ySlot, isSolid, isSlot, isBridge };
}

function buildOccupancyFromTopHeights(xEdges, yEdges, zEdges, solidMask, topHeights, bridgeMask, bridgeHeight) {
  const nx = xEdges.length - 1;
  const ny = yEdges.length - 1;
  const nz = zEdges.length - 1;
  const occupancy = new Uint8Array(nx * ny * nz);
  const zCenters = new Float32Array(nz);
  for (let iz = 0; iz < nz; iz += 1) {
    zCenters[iz] = (zEdges[iz] + zEdges[iz + 1]) * 0.5;
  }

  let occupiedCount = 0;
  for (let iy = 0; iy < ny; iy += 1) {
    for (let ix = 0; ix < nx; ix += 1) {
      const flatIndex = ix + iy * nx;
      for (let iz = 0; iz < nz; iz += 1) {
        let filled = false;
        if (solidMask[flatIndex]) {
          filled = zCenters[iz] <= topHeights[flatIndex] + 1e-6;
        } else if (bridgeMask && bridgeMask[flatIndex]) {
          filled = zCenters[iz] <= bridgeHeight + 1e-6;
        }
        if (!filled) {
          continue;
        }
        occupancy[ix + nx * (iy + ny * iz)] = 1;
        occupiedCount += 1;
      }
    }
  }

  const voxelVolume =
    (xEdges[1] - xEdges[0]) *
    (yEdges[1] - yEdges[0]) *
    (zEdges[1] - zEdges[0]);

  return { occupancy, occupiedCount, voxelVolume };
}

function buildVoxelMesh(xEdges, yEdges, zEdges, occupancy) {
  const nx = xEdges.length - 1;
  const ny = yEdges.length - 1;
  const nz = zEdges.length - 1;
  const positions = [];
  const normals = [];
  const faceNormals = [];
  const xOffset = xEdges[nx] * 0.5;
  const yOffset = yEdges[ny] * 0.5;
  const zOffset = zEdges[nz] * 0.5;

  const solidAt = (ix, iy, iz) => {
    if (ix < 0 || ix >= nx || iy < 0 || iy >= ny || iz < 0 || iz >= nz) {
      return 0;
    }
    return occupancy[ix + nx * (iy + ny * iz)];
  };

  for (let iz = 0; iz < nz; iz += 1) {
    for (let iy = 0; iy < ny; iy += 1) {
      for (let ix = 0; ix < nx; ix += 1) {
        if (!solidAt(ix, iy, iz)) {
          continue;
        }

        const x1 = xEdges[ix] - xOffset;
        const x2 = xEdges[ix + 1] - xOffset;
        const y1 = yEdges[iy] - yOffset;
        const y2 = yEdges[iy + 1] - yOffset;
        const z1 = zEdges[iz] - zOffset;
        const z2 = zEdges[iz + 1] - zOffset;

        if (!solidAt(ix, iy, iz + 1)) {
          pushQuad(
            positions,
            normals,
            faceNormals,
            [
              [x1, y1, z2],
              [x2, y1, z2],
              [x2, y2, z2],
              [x1, y2, z2],
            ],
            [0, 0, 1]
          );
        }

        if (!solidAt(ix, iy, iz - 1)) {
          pushQuad(
            positions,
            normals,
            faceNormals,
            [
              [x1, y1, z1],
              [x1, y2, z1],
              [x2, y2, z1],
              [x2, y1, z1],
            ],
            [0, 0, -1]
          );
        }

        if (!solidAt(ix + 1, iy, iz)) {
          pushQuad(
            positions,
            normals,
            faceNormals,
            [
              [x2, y1, z1],
              [x2, y1, z2],
              [x2, y2, z2],
              [x2, y2, z1],
            ],
            [1, 0, 0]
          );
        }

        if (!solidAt(ix - 1, iy, iz)) {
          pushQuad(
            positions,
            normals,
            faceNormals,
            [
              [x1, y1, z1],
              [x1, y2, z1],
              [x1, y2, z2],
              [x1, y1, z2],
            ],
            [-1, 0, 0]
          );
        }

        if (!solidAt(ix, iy + 1, iz)) {
          pushQuad(
            positions,
            normals,
            faceNormals,
            [
              [x1, y2, z1],
              [x2, y2, z1],
              [x2, y2, z2],
              [x1, y2, z2],
            ],
            [0, 1, 0]
          );
        }

        if (!solidAt(ix, iy - 1, iz)) {
          pushQuad(
            positions,
            normals,
            faceNormals,
            [
              [x1, y1, z1],
              [x1, y1, z2],
              [x2, y1, z2],
              [x2, y1, z1],
            ],
            [0, -1, 0]
          );
        }
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

function buildMatDesign(inputParams) {
  const params = {
    width: clamp(inputParams.width, 60, 220),
    length: clamp(inputParams.length, 60, 220),
    thickness: clamp(inputParams.thickness, 1.6, 8),
    capillary: clamp(inputParams.capillary, 0.4, 2.4),
    wall: clamp(inputParams.wall, 0.35, 2.2),
    xSpacing: clamp(inputParams.xSpacing, 0.6, 16),
    ySpacing: clamp(inputParams.ySpacing, 0.6, 16),
    frame: clamp(inputParams.frame, 2, Math.min(inputParams.width, inputParams.length) * 0.24),
    dimple: Boolean(inputParams.dimple),
    dimpleDepth: clamp(inputParams.dimpleDepth, 0.1, 1.2),
  };

  const resolution = estimateMatResolution(params);
  const xAxis = buildChannelAxis(params.width, resolution, params.frame, params.capillary, params.wall, params.xSpacing);
  const yAxis = buildChannelAxis(params.length, resolution, params.frame, params.capillary, params.wall, params.ySpacing);
  const nx = xAxis.edges.length - 1;
  const ny = yAxis.edges.length - 1;
  const solidMask = new Uint8Array(nx * ny);
  const bridgeMask = new Uint8Array(nx * ny);
  const topHeights = new Float32Array(nx * ny);
  const dimpleDepth = params.dimple ? Math.min(params.dimpleDepth, params.thickness * 0.58) : 0;
  const dimpleRadius = Math.max(
    Math.min((params.capillary + params.wall * 2) * 0.72, Math.min(xAxis.pitch, yAxis.pitch) * 0.42),
    resolution * 1.6
  );

  for (let iy = 0; iy < ny; iy += 1) {
    const yCenter = (yAxis.edges[iy] + yAxis.edges[iy + 1]) * 0.5;
    for (let ix = 0; ix < nx; ix += 1) {
      const { isSolid, isBridge } = classifyMatCell(xAxis, yAxis, ix, iy);
      const flatIndex = ix + iy * nx;
      if (!isSolid) {
        if (isBridge) {
          bridgeMask[flatIndex] = 1;
        }
        continue;
      }
      const xCenter = (xAxis.edges[ix] + xAxis.edges[ix + 1]) * 0.5;
      solidMask[flatIndex] = 1;
      let topHeight = params.thickness;
      if (dimpleDepth > 0) {
        const dx = nearestDistance(xAxis.channelCenters, xCenter);
        const dy = nearestDistance(yAxis.channelCenters, yCenter);
        const distance = Math.hypot(dx, dy);
        if (distance < dimpleRadius) {
          const weight = 1 - distance / dimpleRadius;
          topHeight -= dimpleDepth * weight * weight;
        }
      }
      topHeights[flatIndex] = Math.max(params.thickness * 0.28, topHeight);
    }
  }

  const zEdges = buildZEdges(params.thickness, resolution);
  const zStep = zEdges.length > 1 ? zEdges[1] - zEdges[0] : params.thickness;
  const bridgeHeight = Math.max(
    zStep * 1.05,
    Math.min(params.thickness * 0.22, Math.max(params.wall * 0.45, params.capillary * 0.28))
  );
  const occupancyData = buildOccupancyFromTopHeights(
    xAxis.edges,
    yAxis.edges,
    zEdges,
    solidMask,
    topHeights,
    bridgeMask,
    bridgeHeight
  );
  const mesh = buildVoxelMesh(xAxis.edges, yAxis.edges, zEdges, occupancyData.occupancy);
  const totalVolume = params.width * params.length * params.thickness;
  const solidVolume = occupancyData.occupiedCount * occupancyData.voxelVolume;
  const porosity = clamp(1 - solidVolume / Math.max(totalVolume, 1), 0, 0.98);
  const massGram = solidVolume * 0.00124;

  const warnings = [];
  if (xAxis.effectiveWall + 1e-6 < params.wall || yAxis.effectiveWall + 1e-6 < params.wall) {
    warnings.push("指定壁厚が内側に収まらないため、一部の列では実壁厚を自動で絞っています。");
  }
  if (params.capillary > 1.25) {
    warnings.push("毛細管の空隙幅が広めです。吸い上げを優先するなら 0.7 - 1.1 mm 側が安定しやすいです。");
  }
  if (params.xSpacing < 2 || params.ySpacing < 2) {
    warnings.push("列どうしの距離がかなり狭く、通気余地が減ります。根域の酸素確保を重視するなら間隔を少し広げてください。");
  }
  if (dimpleDepth > params.thickness * 0.28) {
    warnings.push("ディンプルが深めで、交点上面が薄くなっています。0.3 - 0.6 mm あたりが実用域です。");
  }
  if (porosity > 0.82) {
    warnings.push("空隙率が高く、薄肉部が多い構成です。大判サイズでは反りや欠けが出やすくなります。");
  }
  if (!warnings.length) {
    warnings.push("この構成なら、毛細管列と通気空間のバランスは比較的取りやすいです。まずは 1 枚試作して濡れ上がり速度を見てください。");
  }

  return {
    mode: "mat",
    params,
    resolution,
    mesh,
    xAxis,
    yAxis,
    dimpleRadius,
    metricCards: [
      { label: "毛細管内幅", value: `${formatValue((xAxis.effectiveCapillary + yAxis.effectiveCapillary) * 0.5, 2)} mm` },
      { label: "実壁厚", value: `${formatValue((xAxis.effectiveWall + yAxis.effectiveWall) * 0.5, 2)} mm` },
      { label: "列本数", value: `${xAxis.lineCount} × ${yAxis.lineCount}` },
      { label: "外壁クリアランス", value: `X ${formatValue(params.xSpacing, 1)} / Y ${formatValue(params.ySpacing, 1)} mm` },
      { label: "交点ブリッジ厚", value: `${formatValue(bridgeHeight, 2)} mm` },
      { label: "実空隙率", value: `${formatValue(porosity * 100, 1)} %` },
      { label: "概算質量", value: `${formatValue(massGram, 1)} g` },
    ],
    warnings,
  };
}

function buildRepeatingIntervals(span, frame, module, width, offset) {
  const intervals = [];
  let cursor = frame - positiveModulo(offset, module);
  while (cursor < span - frame + module) {
    intervals.push([cursor, cursor + width]);
    cursor += module;
  }
  return mergeIntervals(
    intervals
      .map(([start, end]) => [Math.max(frame, start), Math.min(span - frame, end)])
      .filter(([start, end]) => end > start)
  );
}

function buildWickCenters(span, frame, pitch) {
  const interior = Math.max(span - frame * 2, 0.1);
  const count = Math.max(1, Math.floor((interior + pitch * 0.35) / Math.max(pitch, 0.1)));
  const used = Math.max(0, count - 1) * pitch;
  const start = frame + Math.max(0, interior - used) * 0.5;
  return Array.from({ length: count }, (_, index) => start + index * pitch);
}

function buildSpongeDesign(inputParams) {
  const params = {
    width: clamp(inputParams.width, 60, 220),
    length: clamp(inputParams.length, 60, 220),
    thickness: clamp(inputParams.thickness, 4, 18),
    frame: clamp(inputParams.frame, 2, Math.min(inputParams.width, inputParams.length) * 0.24),
    pore: clamp(inputParams.pore, 2.5, 12),
    rib: clamp(inputParams.rib, 0.45, 1.8),
    layers: Math.round(clamp(inputParams.layers, 2, 7)),
    stagger: clamp(inputParams.stagger, 0, 0.9),
    wickWidth: clamp(inputParams.wickWidth, 0.45, 2.2),
    wickPitch: clamp(inputParams.wickPitch, 6, 26),
  };

  const resolution = estimateSpongeResolution(params);
  const module = params.pore + params.rib;
  const sheetThickness = clamp(params.thickness / (params.layers * 2.2), 0.42, 1.1);
  const layerCenters = Array.from({ length: params.layers }, (_, index) => {
    if (params.layers === 1) {
      return params.thickness * 0.5;
    }
    return (params.thickness * (index + 0.5)) / params.layers;
  });
  const wickCentersX = buildWickCenters(params.width, params.frame, params.wickPitch);
  const wickCentersY = buildWickCenters(params.length, params.frame, params.wickPitch);
  const layerOffsetPatterns = Array.from({ length: params.layers }, (_, layerIndex) => ({
    x: (layerIndex % 2 ? params.stagger : 0) * module,
    y: (layerIndex % 2 ? 0 : params.stagger * 0.62) * module,
  }));
  const xAnchors = [params.frame, params.width - params.frame];
  const yAnchors = [params.frame, params.length - params.frame];
  for (const offset of layerOffsetPatterns) {
    for (const [start, end] of buildRepeatingIntervals(params.width, params.frame, module, params.rib, offset.x)) {
      xAnchors.push(start, end);
    }
    for (const [start, end] of buildRepeatingIntervals(params.length, params.frame, module, params.rib, offset.y)) {
      yAnchors.push(start, end);
    }
  }
  const wickRadius = params.wickWidth * 0.5;
  for (const center of wickCentersX) {
    xAnchors.push(center - wickRadius, center + wickRadius);
  }
  for (const center of wickCentersY) {
    yAnchors.push(center - wickRadius, center + wickRadius);
  }
  const zAnchors = [];
  for (const center of layerCenters) {
    zAnchors.push(center - sheetThickness * 0.5, center + sheetThickness * 0.5);
  }
  const xEdges = buildAnchoredEdges(params.width, resolution, xAnchors);
  const yEdges = buildAnchoredEdges(params.length, resolution, yAnchors);
  const zEdges = buildAnchoredEdges(params.thickness, clamp(Math.min(resolution, sheetThickness * 0.65), 0.18, 0.48), zAnchors);
  const nx = xEdges.length - 1;
  const ny = yEdges.length - 1;
  const nz = zEdges.length - 1;
  const occupancy = new Uint8Array(nx * ny * nz);

  const xCenters = new Float32Array(nx);
  const yCenters = new Float32Array(ny);
  const zCenters = new Float32Array(nz);
  for (let ix = 0; ix < nx; ix += 1) {
    xCenters[ix] = (xEdges[ix] + xEdges[ix + 1]) * 0.5;
  }
  for (let iy = 0; iy < ny; iy += 1) {
    yCenters[iy] = (yEdges[iy] + yEdges[iy + 1]) * 0.5;
  }
  for (let iz = 0; iz < nz; iz += 1) {
    zCenters[iz] = (zEdges[iz] + zEdges[iz + 1]) * 0.5;
  }

  let occupiedCount = 0;
  for (let iz = 0; iz < nz; iz += 1) {
    const z = zCenters[iz];
    let activeLayer = -1;
    for (let layerIndex = 0; layerIndex < layerCenters.length; layerIndex += 1) {
      if (Math.abs(z - layerCenters[layerIndex]) <= sheetThickness * 0.5) {
        activeLayer = layerIndex;
        break;
      }
    }

    for (let iy = 0; iy < ny; iy += 1) {
      const y = yCenters[iy];
      for (let ix = 0; ix < nx; ix += 1) {
        const x = xCenters[ix];
        const edgeFrame =
          x < params.frame ||
          x > params.width - params.frame ||
          y < params.frame ||
          y > params.length - params.frame;

        let solid = edgeFrame;

        if (!solid) {
          for (const centerX of wickCentersX) {
            if (Math.abs(x - centerX) > params.wickWidth * 0.5) {
              continue;
            }
            for (const centerY of wickCentersY) {
              if (Math.hypot(x - centerX, y - centerY) <= params.wickWidth * 0.5) {
                solid = true;
                break;
              }
            }
            if (solid) {
              break;
            }
          }
        }

        if (!solid && activeLayer >= 0) {
          const offsetX = layerOffsetPatterns[activeLayer].x;
          const offsetY = layerOffsetPatterns[activeLayer].y;
          const localX = positiveModulo(x - params.frame + offsetX, module);
          const localY = positiveModulo(y - params.frame + offsetY, module);
          solid = localX < params.rib || localY < params.rib;
        }

        if (!solid) {
          continue;
        }

        occupancy[ix + nx * (iy + ny * iz)] = 1;
        occupiedCount += 1;
      }
    }
  }

  const mesh = buildVoxelMesh(xEdges, yEdges, zEdges, occupancy);
  const voxelVolume =
    (xEdges[1] - xEdges[0]) *
    (yEdges[1] - yEdges[0]) *
    (zEdges[1] - zEdges[0]);
  const solidVolume = occupiedCount * voxelVolume;
  const totalVolume = params.width * params.length * params.thickness;
  const porosity = clamp(1 - solidVolume / Math.max(totalVolume, 1), 0, 0.98);
  const massGram = solidVolume * 0.00124;

  const topLayerIndex = layerCenters.length - 1;
  const topOffsetX = (topLayerIndex % 2 ? params.stagger : 0) * module;
  const topOffsetY = (topLayerIndex % 2 ? 0 : params.stagger * 0.62) * module;
  const topStripesX = buildRepeatingIntervals(params.width, params.frame, module, params.rib, topOffsetX);
  const topStripesY = buildRepeatingIntervals(params.length, params.frame, module, params.rib, topOffsetY);

  const warnings = [];
  if (params.rib < 0.6) {
    warnings.push("層リブがかなり細いです。ノズル 0.4 mm 前提なら 0.65 mm 以上の方が安定します。");
  }
  if (params.layers >= 6 && sheetThickness < 0.55) {
    warnings.push("層数が多く、各層が薄めです。ブリッジ条件を詰めないと潰れやすい構成です。");
  }
  if (params.pore > 8) {
    warnings.push("胞の開口が大きめで、スポンジというより通気材寄りです。保水を優先するなら 4 - 7 mm 側が扱いやすいです。");
  }
  if (porosity > 0.88) {
    warnings.push("空隙率がかなり高く、長辺方向の剛性が落ちています。大判では外周フレームかリブ厚を増やしてください。");
  }
  if (!warnings.length) {
    warnings.push("この案は、水平ラティス層と縦ウィック柱の組み合わせとして比較的素直です。平面マットより厚み方向の保水体積を持たせたい時の検討出発点になります。");
  }

  return {
    mode: "sponge",
    params,
    resolution,
    mesh,
    sheetThickness,
    wickCentersX,
    wickCentersY,
    topStripesX,
    topStripesY,
    metricCards: [
      { label: "水平ラティス層", value: `${params.layers} 層` },
      { label: "胞の開口", value: `${formatValue(params.pore, 1)} mm` },
      { label: "層板厚", value: `${formatValue(sheetThickness, 2)} mm` },
      { label: "縦ウィック数", value: `${wickCentersX.length} × ${wickCentersY.length}` },
      { label: "実空隙率", value: `${formatValue(porosity * 100, 1)} %` },
      { label: "概算質量", value: `${formatValue(massGram, 1)} g` },
    ],
    warnings,
  };
}

function updateMetrics(design) {
  dom.metricsGrid.innerHTML = design.metricCards
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

function prepareCanvas() {
  const canvas = dom.planCanvas;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const drawWidth = Math.max(1, Math.round(rect.width * dpr));
  const drawHeight = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== drawWidth || canvas.height !== drawHeight) {
    canvas.width = drawWidth;
    canvas.height = drawHeight;
  }
  return { canvas, ctx, dpr };
}

function drawMatPlan(design) {
  const { canvas, ctx, dpr } = prepareCanvas();
  const pad = 28 * dpr;
  const scale = Math.min(
    (canvas.width - pad * 2) / design.params.width,
    (canvas.height - pad * 2) / design.params.length
  );

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate((canvas.width - design.params.width * scale) * 0.5, (canvas.height - design.params.length * scale) * 0.5);

  ctx.fillStyle = "#d7f0d0";
  ctx.fillRect(0, 0, design.params.width * scale, design.params.length * scale);

  fillIntervals(ctx, design.xAxis.solidIntervals, design.params.length, design.params.length, scale, "#3e8b58", true);
  fillIntervals(ctx, design.yAxis.solidIntervals, design.params.width, design.params.width, scale, "#3e8b58", false);

  ctx.fillStyle = "rgba(148, 231, 176, 0.95)";
  const nx = design.xAxis.edges.length - 1;
  const ny = design.yAxis.edges.length - 1;
  for (let iy = 0; iy < ny; iy += 1) {
    const yStart = design.yAxis.edges[iy] * scale;
    const cellHeight = Math.max(1, (design.yAxis.edges[iy + 1] - design.yAxis.edges[iy]) * scale);
    for (let ix = 0; ix < nx; ix += 1) {
      const { isSlot } = classifyMatCell(design.xAxis, design.yAxis, ix, iy);
      if (!isSlot) {
        continue;
      }
      const xStart = design.xAxis.edges[ix] * scale;
      const cellWidth = Math.max(1, (design.xAxis.edges[ix + 1] - design.xAxis.edges[ix]) * scale);
      ctx.fillRect(xStart, yStart, cellWidth, cellHeight);
    }
  }

  if (design.params.dimple) {
    ctx.fillStyle = "rgba(242, 249, 193, 0.66)";
    for (const x of design.xAxis.channelCenters) {
      for (const y of design.yAxis.channelCenters) {
        ctx.beginPath();
        ctx.arc(x * scale, y * scale, Math.max(1.5, design.dimpleRadius * scale * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
    }
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

function drawSpongePlan(design) {
  const { canvas, ctx, dpr } = prepareCanvas();
  const pad = 28 * dpr;
  const scale = Math.min(
    (canvas.width - pad * 2) / design.params.width,
    (canvas.height - pad * 2) / design.params.length
  );

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate((canvas.width - design.params.width * scale) * 0.5, (canvas.height - design.params.length * scale) * 0.5);

  ctx.fillStyle = "#d7f0d0";
  ctx.fillRect(0, 0, design.params.width * scale, design.params.length * scale);

  ctx.fillStyle = "#3e8b58";
  ctx.fillRect(0, 0, design.params.width * scale, design.params.frame * scale);
  ctx.fillRect(0, (design.params.length - design.params.frame) * scale, design.params.width * scale, design.params.frame * scale);
  ctx.fillRect(0, 0, design.params.frame * scale, design.params.length * scale);
  ctx.fillRect((design.params.width - design.params.frame) * scale, 0, design.params.frame * scale, design.params.length * scale);

  fillIntervals(ctx, design.topStripesX, design.params.length, design.params.length, scale, "rgba(62, 139, 88, 0.92)", true);
  fillIntervals(ctx, design.topStripesY, design.params.width, design.params.width, scale, "rgba(62, 139, 88, 0.92)", false);

  ctx.fillStyle = "rgba(148, 231, 176, 0.92)";
  for (const x of design.wickCentersX) {
    for (const y of design.wickCentersY) {
      ctx.beginPath();
      ctx.arc(x * scale, y * scale, Math.max(1.5, design.params.wickWidth * scale * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = "rgba(20, 50, 30, 0.35)";
  ctx.lineWidth = Math.max(1, dpr);
  ctx.strokeRect(0, 0, design.params.width * scale, design.params.length * scale);

  ctx.fillStyle = "rgba(22, 48, 32, 0.74)";
  ctx.font = `${12 * dpr}px IBM Plex Sans JP`;
  ctx.fillText(
    `${formatValue(design.params.width, 0)} × ${formatValue(design.params.length, 0)} mm / ${design.params.layers} layers`,
    8 * dpr,
    18 * dpr
  );
  ctx.restore();
}

function drawPlan(design) {
  getModel().drawPlan(design);
}

function resizeViewer() {
  if (renderer) {
    const rect = dom.viewerMount.getBoundingClientRect();
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  }
  if (state.currentDesign) {
    drawPlan(state.currentDesign);
  }
}

function renderAll() {
  const design = getModel().buildDesign(getActiveParams());
  state.currentDesign = design;
  state.paramsByMode[state.mode] = { ...design.params };
  syncControls();
  setDependentControlStates();
  updateMetrics(design);
  updateGeometry(design);
  drawPlan(design);
  window.history.replaceState(null, "", toHash());
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
  const design = state.currentDesign;
  const blob = exportStl(design);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const name = [
    getModel().fileStem,
    `${Math.round(design.params.width)}x${Math.round(design.params.length)}`,
    `t-${formatValue(design.params.thickness, 1)}`,
  ].join("-");
  anchor.href = url;
  anchor.download = `${name}.stl`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  dom.actionStatus.textContent = "STL をダウンロードしました。";
}

async function copyShareUrl() {
  const url = `${window.location.origin}${window.location.pathname}${toHash()}`;
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

dom.downloadBtn.addEventListener("click", downloadCurrentStl);
dom.copyLinkBtn.addEventListener("click", copyShareUrl);
dom.resetBtn.addEventListener("click", () => {
  state.paramsByMode[state.mode] = { ...getModel().defaults };
  syncControls();
  setDependentControlStates();
  renderAll();
  dom.actionStatus.textContent = "既定値に戻しました。";
});

window.addEventListener("resize", resizeViewer);

const initialFromHash = fromHash();
if (initialFromHash) {
  state.mode = initialFromHash.mode;
  state.paramsByMode[state.mode] = { ...state.paramsByMode[state.mode], ...initialFromHash.params };
}

initRenderer();
renderModeUi();
renderAll();
resizeViewer();
animate();
