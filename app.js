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

const MEANDER_FIELDS = [
  { key: "width", label: "幅", unit: "mm", min: 60, max: 220, step: 2, precision: 0 },
  { key: "length", label: "長さ", unit: "mm", min: 60, max: 220, step: 2, precision: 0 },
  { key: "thickness", label: "厚み", unit: "mm", min: 1.8, max: 8, step: 0.1, precision: 2 },
  { key: "frame", label: "外周フレーム幅", unit: "mm", min: 2, max: 12, step: 0.2, precision: 2 },
  {
    key: "channel",
    label: "ウィックの空隙幅",
    unit: "mm",
    min: 0.45,
    max: 2.4,
    step: 0.05,
    precision: 2,
    help: "蛇行する 1 本の連続毛細管の内幅です。",
  },
  {
    key: "wall",
    label: "隣接壁の最小厚み",
    unit: "mm",
    min: 0.45,
    max: 2.2,
    step: 0.05,
    precision: 2,
    help: "隣り合う走路の間に最低限残す母材厚です。",
  },
  {
    key: "laneGap",
    label: "走路どうしの空気ギャップ",
    unit: "mm",
    min: 1,
    max: 18,
    step: 0.1,
    precision: 2,
    help: "蛇行の折り返し列どうしの間隔です。広いほど通気が増えます。",
  },
  {
    key: "pocket",
    label: "折り返し部に播種ポケットを付ける",
    type: "toggle",
    help: "折り返し位置の上面を浅く凹ませ、種置き位置のガイドにします。",
  },
  {
    key: "pocketDia",
    label: "播種ポケット径",
    unit: "mm",
    min: 1.5,
    max: 8,
    step: 0.1,
    precision: 2,
    dependsOn: "pocket",
  },
];

const LEAF_FIELDS = [
  { key: "width", label: "幅", unit: "mm", min: 60, max: 220, step: 2, precision: 0 },
  { key: "length", label: "長さ", unit: "mm", min: 60, max: 220, step: 2, precision: 0 },
  { key: "thickness", label: "厚み", unit: "mm", min: 1.8, max: 8, step: 0.1, precision: 2 },
  { key: "frame", label: "外周フレーム幅", unit: "mm", min: 2, max: 12, step: 0.2, precision: 2 },
  {
    key: "trunk",
    label: "主脈の空隙幅",
    unit: "mm",
    min: 0.55,
    max: 2.8,
    step: 0.05,
    precision: 2,
    help: "中央の主幹毛細管の幅です。",
  },
  {
    key: "branch",
    label: "側脈の空隙幅",
    unit: "mm",
    min: 0.4,
    max: 2.2,
    step: 0.05,
    precision: 2,
    help: "左右へ伸びる側脈毛細管の幅です。",
  },
  {
    key: "branchPitch",
    label: "側脈ピッチ",
    unit: "mm",
    min: 8,
    max: 28,
    step: 0.2,
    precision: 2,
    help: "主脈上で枝分かれする間隔です。",
  },
  {
    key: "reach",
    label: "側脈の伸び長さ",
    unit: "mm",
    min: 10,
    max: 48,
    step: 0.2,
    precision: 2,
    help: "枝をどこまで左右へ張り出させるかを決めます。",
  },
  {
    key: "pocket",
    label: "枝先に播種ポケットを付ける",
    type: "toggle",
    help: "側脈の先端に浅いくぼみを置き、種や挿し穂の位置決めに使います。",
  },
  {
    key: "pocketDia",
    label: "枝先ポケット径",
    unit: "mm",
    min: 1.5,
    max: 10,
    step: 0.1,
    precision: 2,
    dependsOn: "pocket",
  },
];

const GYROID_FIELDS = [
  { key: "width", label: "幅", unit: "mm", min: 60, max: 220, step: 2, precision: 0 },
  { key: "length", label: "長さ", unit: "mm", min: 60, max: 220, step: 2, precision: 0 },
  { key: "thickness", label: "厚み", unit: "mm", min: 5, max: 20, step: 0.2, precision: 2 },
  { key: "frame", label: "外周フレーム幅", unit: "mm", min: 2, max: 12, step: 0.2, precision: 2 },
  {
    key: "basePlate",
    label: "ベースプレート厚",
    unit: "mm",
    min: 0,
    max: 5,
    step: 0.1,
    precision: 2,
    help: "印刷の初期層の定着のため底面に稠密な板を生成します。0 で無効。SDF の和集合 (min) でジャイロイドと連結します。",
  },
  {
    key: "cell",
    label: "基本セル径",
    unit: "mm",
    min: 3.5,
    max: 18,
    step: 0.1,
    precision: 2,
    help: "3D 細孔の周期スケールです。小さいほどスポンジらしくなります。",
  },
  {
    key: "wall",
    label: "骨格の目標厚み",
    unit: "mm",
    min: 0.6,
    max: 2.8,
    step: 0.05,
    precision: 2,
    help: "gyroid 骨格の太さに相当する値です。",
  },
  {
    key: "zStretch",
    label: "厚み方向の伸長率",
    unit: "ratio",
    min: 0.6,
    max: 1.8,
    step: 0.05,
    precision: 2,
    help: "Z 方向の周期を変えて、縦方向のウィック感を調整します。",
  },
];

const PILLAR_BASE_FIELDS = [
  { key: "width", label: "幅", unit: "mm", min: 60, max: 220, step: 2, precision: 0 },
  { key: "length", label: "長さ", unit: "mm", min: 60, max: 220, step: 2, precision: 0 },
  { key: "thickness", label: "厚み", unit: "mm", min: 2.4, max: 16, step: 0.1, precision: 2 },
  { key: "frame", label: "外周フレーム幅", unit: "mm", min: 2, max: 12, step: 0.2, precision: 2 },
  {
    key: "capillaryDia",
    label: "鉛直毛細管の内径",
    unit: "mm",
    min: 0.45,
    max: 3.2,
    step: 0.05,
    precision: 2,
    help: "下から上まで通る円柱形毛細管の内径です。細いほど吸い上げ寄り、太いほど通気寄りになります。",
  },
  {
    key: "xGap",
    label: "X方向の外壁クリアランス",
    unit: "mm",
    min: 0.8,
    max: 18,
    step: 0.1,
    precision: 2,
    help: "隣り合う円柱毛細管の外壁どうしの距離です。中心間距離ではなく実クリアランスです。",
  },
  {
    key: "yGap",
    label: "Y方向の外壁クリアランス",
    unit: "mm",
    min: 0.8,
    max: 18,
    step: 0.1,
    precision: 2,
    help: "Y 方向の実クリアランスです。X/Y 別に密度を調整できます。",
  },
  {
    key: "cupDia",
    label: "上面播種カップ径",
    unit: "mm",
    min: 1.6,
    max: 10,
    step: 0.1,
    precision: 2,
    help: "各毛細管の上部を受け皿状に凹ませる直径です。種の座りを作ります。",
  },
  {
    key: "cupDepth",
    label: "上面播種カップ深さ",
    unit: "mm",
    min: 0.1,
    max: 2.2,
    step: 0.05,
    precision: 2,
    help: "上面カップの深さです。深すぎると上面剛性が落ちます。",
  },
];

const PILLAR_ZIGZAG_FIELDS = [
  ...PILLAR_BASE_FIELDS,
  {
    key: "tunnelDia",
    label: "横孔の内径",
    unit: "mm",
    min: 0.5,
    max: 3.6,
    step: 0.05,
    precision: 2,
    help: "鉛直毛細管どうしをつなぐ横向き通気孔の太さです。",
  },
  {
    key: "tunnelLift",
    label: "横孔の高さ率",
    unit: "ratio",
    min: 0.25,
    max: 0.82,
    step: 0.01,
    precision: 2,
    help: "横孔を厚みのどの高さに通すかです。0.5 なら中央、0.7 なら上寄りです。",
  },
];

const PILLAR_LADDER_FIELDS = [
  ...PILLAR_BASE_FIELDS,
  {
    key: "tunnelDia",
    label: "連通孔の内径",
    unit: "mm",
    min: 0.5,
    max: 3.2,
    step: 0.05,
    precision: 2,
    help: "隣接する円柱毛細管どうしをつなぐ横孔の太さです。",
  },
  {
    key: "tunnelLift",
    label: "上段連通孔の高さ率",
    unit: "ratio",
    min: 0.42,
    max: 0.82,
    step: 0.01,
    precision: 2,
    help: "上段側の連通孔位置です。下段はこれをもとに自動配置します。",
  },
];

const MODELS = {
  pillar: {
    id: "pillar",
    label: "Vertical Pillar Wells Beta",
    shortLabel: "縦筒アレイ",
    eyebrow: "Beta Concept",
    title: "鉛直円柱毛細管を素直に並べるベースライン案",
    lead:
      "下から上まで通る円柱毛細管を、母材の中に規則正しく配置する最も単純な案です。上面だけを浅いカップ状にして、播種位置を自然に持たせます。",
    paramHint: "円柱毛細管の径と X/Y 密度を直接指定",
    planTitle: "Pillar Map",
    planSubtitle: "鉛直毛細管と上面播種カップ",
    noteSummary: "縦筒アレイ案メモ",
    noteCopy: [
      "まず比較の基準として、鉛直方向の円柱毛細管をそのまま並べる案を置きました。流路のルールが単純なので、水の上がり方と通気の見え方を最も素直に観察できます。",
      "上面の各開口は浅いカップ状に凹ませています。毛細管そのものは下まで貫通しつつ、種は少し受け皿に乗る形です。",
      "まずこの案で密度と径の感触を掴み、その後に横孔付き案へ進むと比較しやすいです。",
    ],
    legend: [
      { klass: "solid", label: "母材" },
      { klass: "slot", label: "鉛直毛細管" },
      { klass: "chamber", label: "播種カップ" },
    ],
    defaults: {
      width: 120,
      length: 120,
      thickness: 4.8,
      frame: 4,
      capillaryDia: 1.05,
      xGap: 6,
      yGap: 6,
      cupDia: 3.8,
      cupDepth: 0.7,
    },
    presets: {
      nursery: {
        label: "Nursery",
        params: {
          width: 96,
          length: 96,
          thickness: 4.2,
          frame: 3.6,
          capillaryDia: 0.9,
          xGap: 4.8,
          yGap: 5.2,
          cupDia: 3.2,
          cupDepth: 0.55,
        },
      },
      tray: {
        label: "Tray",
        params: {
          width: 128,
          length: 144,
          thickness: 5.2,
          frame: 4.4,
          capillaryDia: 1.15,
          xGap: 6.8,
          yGap: 7.4,
          cupDia: 4.4,
          cupDepth: 0.82,
        },
      },
      airy: {
        label: "Airy",
        params: {
          width: 120,
          length: 132,
          thickness: 5.6,
          frame: 4,
          capillaryDia: 1.25,
          xGap: 8.5,
          yGap: 8.5,
          cupDia: 4.8,
          cupDepth: 0.72,
        },
      },
    },
    fields: PILLAR_BASE_FIELDS,
    buildDesign: buildPillarDesign,
    drawPlan: drawPillarPlan,
    fileStem: "vertical-pillar-beta",
  },
  pillarZigzag: {
    id: "pillarZigzag",
    label: "Zigzag Cross-Bore Beta",
    shortLabel: "ジグザグ横孔",
    eyebrow: "Beta Concept",
    title: "縦筒毛細管をジグザグ横孔でつなぐ通気強化案",
    lead:
      "鉛直円柱毛細管を基本にしつつ、上寄りの高さで横向きのジグザグ孔を通して、各筒どうしの空気の抜け道を増やす案です。",
    paramHint: "円柱毛細管に横向き通気孔を追加",
    planTitle: "Zigzag Bore Map",
    planSubtitle: "鉛直毛細管と上段ジグザグ横孔",
    noteSummary: "ジグザグ横孔案メモ",
    noteCopy: [
      "これは、ユーザー案にかなり近いベータです。鉛直方向の円柱毛細管を並べ、その一部を上寄りの高さでジグザグの横孔がつないでいきます。",
      "横孔は水を吸い上げる主経路ではなく、空気の逃げ道と根の酸素アクセスを増やすための補助経路として扱っています。上寄りに置くことで、下側の連続ウィック区間はなるべく残します。",
      "横孔を太くしすぎると毛細管らしさは弱まるので、まずは 0.7 - 1.2 mm 程度から比較するのがよいです。",
    ],
    legend: [
      { klass: "solid", label: "母材" },
      { klass: "slot", label: "鉛直毛細管" },
      { klass: "chamber", label: "ジグザグ横孔" },
    ],
    defaults: {
      width: 120,
      length: 120,
      thickness: 5.2,
      frame: 4,
      capillaryDia: 1,
      xGap: 6.2,
      yGap: 6.2,
      cupDia: 3.8,
      cupDepth: 0.72,
      tunnelDia: 0.9,
      tunnelLift: 0.66,
    },
    presets: {
      mild: {
        label: "Mild",
        params: {
          width: 100,
          length: 112,
          thickness: 4.6,
          frame: 3.8,
          capillaryDia: 0.92,
          xGap: 5.2,
          yGap: 5.4,
          cupDia: 3.4,
          cupDepth: 0.58,
          tunnelDia: 0.72,
          tunnelLift: 0.68,
        },
      },
      compare: {
        label: "Compare",
        params: {
          width: 128,
          length: 128,
          thickness: 5.4,
          frame: 4.2,
          capillaryDia: 1.08,
          xGap: 6.4,
          yGap: 6.4,
          cupDia: 4.2,
          cupDepth: 0.76,
          tunnelDia: 0.96,
          tunnelLift: 0.64,
        },
      },
      ventilated: {
        label: "Ventilated",
        params: {
          width: 132,
          length: 120,
          thickness: 6,
          frame: 4.2,
          capillaryDia: 1.15,
          xGap: 7.8,
          yGap: 7,
          cupDia: 4.6,
          cupDepth: 0.88,
          tunnelDia: 1.15,
          tunnelLift: 0.72,
        },
      },
    },
    fields: PILLAR_ZIGZAG_FIELDS,
    buildDesign: buildPillarZigzagDesign,
    drawPlan: drawPillarPlan,
    fileStem: "pillar-zigzag-beta",
  },
  pillarLadder: {
    id: "pillarLadder",
    label: "Alternating Ladder Bore Beta",
    shortLabel: "交互ラダー孔",
    eyebrow: "Beta Concept",
    title: "縦筒毛細管を上下 2 層の横孔で疎につなぐ案",
    lead:
      "鉛直毛細管を配列し、隣接孔どうしを上下 2 段の高さで交互に連通させる案です。ジグザグ案より局所的な横流れを分散させやすくなります。",
    paramHint: "円柱毛細管を交互高さの連通孔で比較",
    planTitle: "Ladder Bore Map",
    planSubtitle: "鉛直毛細管と上下交互の連通孔",
    noteSummary: "交互ラダー孔案メモ",
    noteCopy: [
      "この案では、隣接する毛細管どうしを全部同じ高さではなく、上段と下段に分けて交互に連通させます。横流れを散らしつつ、板全体を弱くしすぎない狙いです。",
      "X 方向の連通と Y 方向の連通を別の高さに割り当てるので、空気が抜ける経路に少し 3D っぽさが生まれます。",
      "実際の吸い上げは円柱毛細管が主役で、横孔は再分配と通気の補助という位置づけです。",
    ],
    legend: [
      { klass: "solid", label: "母材" },
      { klass: "slot", label: "鉛直毛細管" },
      { klass: "chamber", label: "交互連通孔" },
    ],
    defaults: {
      width: 120,
      length: 120,
      thickness: 5.6,
      frame: 4,
      capillaryDia: 0.96,
      xGap: 6.4,
      yGap: 6.4,
      cupDia: 4,
      cupDepth: 0.76,
      tunnelDia: 0.8,
      tunnelLift: 0.7,
    },
    presets: {
      compact: {
        label: "Compact",
        params: {
          width: 96,
          length: 108,
          thickness: 4.8,
          frame: 3.6,
          capillaryDia: 0.88,
          xGap: 5.4,
          yGap: 5,
          cupDia: 3.4,
          cupDepth: 0.6,
          tunnelDia: 0.72,
          tunnelLift: 0.66,
        },
      },
      balance: {
        label: "Balance",
        params: {
          width: 124,
          length: 124,
          thickness: 5.8,
          frame: 4.2,
          capillaryDia: 1,
          xGap: 6.6,
          yGap: 6.6,
          cupDia: 4.1,
          cupDepth: 0.8,
          tunnelDia: 0.84,
          tunnelLift: 0.71,
        },
      },
      robust: {
        label: "Robust",
        params: {
          width: 140,
          length: 124,
          thickness: 6.6,
          frame: 4.6,
          capillaryDia: 1.12,
          xGap: 7.8,
          yGap: 7.2,
          cupDia: 4.6,
          cupDepth: 0.9,
          tunnelDia: 0.95,
          tunnelLift: 0.74,
        },
      },
    },
    fields: PILLAR_LADDER_FIELDS,
    buildDesign: buildPillarLadderDesign,
    drawPlan: drawPillarPlan,
    fileStem: "pillar-ladder-beta",
  },
  meander: {
    id: "meander",
    label: "Meander Wick Beta",
    shortLabel: "蛇行ウィック",
    eyebrow: "Beta Concept",
    title: "1本の連続ウィックを蛇行させる平面案",
    lead:
      "縦横格子をやめて、1 本の連続毛細管だけを母材の中に通す案です。交差点がないので、寸法揺れや連結性の破綻を避けやすくなります。",
    paramHint: "1本の連続毛細管を蛇行させて設計",
    planTitle: "Channel Map",
    planSubtitle: "蛇行ウィックと播種ポケット",
    noteSummary: "蛇行ウィック案メモ",
    noteCopy: [
      "まず一番素直なのは、毛細管を 1 本の連続走路として扱う方法です。これなら母材は常に一体で、空隙幅も path 半径だけで決まるので、格子交差より設計と検証がかなり簡単です。",
      "走路どうしの空気ギャップを十分に取ると、通気と乾きムラの観察がしやすくなります。まずは苗床や発芽テストのベースラインとして扱いやすい案です。",
      "折り返し部には浅い播種ポケットを付けられます。流路そのものは貫通空隙、ポケットは上面だけのくぼみです。",
    ],
    legend: [
      { klass: "solid", label: "母材" },
      { klass: "slot", label: "連続毛細管" },
      { klass: "chamber", label: "播種ポケット" },
    ],
    defaults: {
      width: 120,
      length: 120,
      thickness: 2.8,
      frame: 4.2,
      channel: 0.9,
      wall: 0.7,
      laneGap: 5.6,
      pocket: true,
      pocketDia: 3.8,
    },
    presets: {
      starter: {
        label: "Starter",
        params: {
          width: 96,
          length: 96,
          thickness: 2.4,
          frame: 3.6,
          channel: 0.75,
          wall: 0.62,
          laneGap: 4.8,
          pocket: true,
          pocketDia: 3.2,
        },
      },
      nursery: {
        label: "Nursery",
        params: {
          width: 120,
          length: 144,
          thickness: 2.9,
          frame: 4.6,
          channel: 0.92,
          wall: 0.72,
          laneGap: 6.2,
          pocket: true,
          pocketDia: 4.4,
        },
      },
      dryair: {
        label: "Dry Air",
        params: {
          width: 136,
          length: 120,
          thickness: 3.1,
          frame: 4.4,
          channel: 1.05,
          wall: 0.86,
          laneGap: 8.6,
          pocket: false,
          pocketDia: 3.8,
        },
      },
    },
    fields: MEANDER_FIELDS,
    buildDesign: buildMeanderDesign,
    drawPlan: drawChannelPlan,
    fileStem: "meander-wick-beta",
  },
  leaf: {
    id: "leaf",
    label: "Leaf Vein Beta",
    shortLabel: "葉脈ネット",
    eyebrow: "Beta Concept",
    title: "葉脈のように主脈と側脈で給水を分配する案",
    lead:
      "中央の主脈から左右へ側脈を伸ばす、葉脈モチーフの分配ネットワークです。格子よりも有機的で、播種位置を枝先に寄せる使い方を想定しています。",
    paramHint: "主脈と側脈のネットワークを試作",
    planTitle: "Vein Map",
    planSubtitle: "主脈・側脈と枝先ポケット",
    noteSummary: "葉脈ネット案メモ",
    noteCopy: [
      "中心に主脈を置き、そこから左右へ側脈を出す構成です。水は幹から枝へ配り、枝と枝の間の面積を通気領域として使います。",
      "播種や挿し木を点在させたい用途では、枝先に浅いポケットを並べると、どこへ置くかが形状側で自然に決まります。",
      "規則格子よりも方向性があるので、トレイの長手方向に給水勾配を持たせたい時の比較対象に向いています。",
    ],
    legend: [
      { klass: "solid", label: "母材" },
      { klass: "slot", label: "葉脈毛細管" },
      { klass: "chamber", label: "枝先ポケット" },
    ],
    defaults: {
      width: 110,
      length: 140,
      thickness: 2.8,
      frame: 4.4,
      trunk: 1.15,
      branch: 0.78,
      branchPitch: 13.5,
      reach: 28,
      pocket: true,
      pocketDia: 4.2,
    },
    presets: {
      sprouts: {
        label: "Sprouts",
        params: {
          width: 92,
          length: 120,
          thickness: 2.4,
          frame: 3.8,
          trunk: 0.95,
          branch: 0.65,
          branchPitch: 11.6,
          reach: 22,
          pocket: true,
          pocketDia: 3.6,
        },
      },
      tray: {
        label: "Tray",
        params: {
          width: 128,
          length: 156,
          thickness: 3,
          frame: 4.8,
          trunk: 1.25,
          branch: 0.84,
          branchPitch: 15.2,
          reach: 32,
          pocket: true,
          pocketDia: 4.8,
        },
      },
      cuttings: {
        label: "Cuttings",
        params: {
          width: 108,
          length: 164,
          thickness: 3.2,
          frame: 4.6,
          trunk: 1.35,
          branch: 0.92,
          branchPitch: 16.4,
          reach: 24,
          pocket: false,
          pocketDia: 4.2,
        },
      },
    },
    fields: LEAF_FIELDS,
    buildDesign: buildLeafDesign,
    drawPlan: drawChannelPlan,
    fileStem: "leaf-vein-beta",
  },
  gyroid: {
    id: "gyroid",
    label: "Gyroid Sponge Beta",
    shortLabel: "gyroid土壌",
    eyebrow: "Beta Concept",
    title: "TPMS 系の 3D スポンジ骨格で保水と通気を両立する案",
    lead:
      "平面の列ではなく、3 次元に連続した gyroid 骨格を使う案です。3D プリンタの積層で作りやすいスポンジ状母材として比較できるようにしました。",
    paramHint: "3D 細孔ネットワークを検討",
    planTitle: "Mid Slice",
    planSubtitle: "中央断面の骨格パターン",
    noteSummary: "gyroid 土壌案メモ",
    noteCopy: [
      "こちらは 3D プリンタらしく、面ではなく体積で水と空気の通り道を持たせる案です。gyroid は空隙側も骨格側も連続しやすく、スポンジ的な構造の比較対象として扱いやすいです。",
      "基本セル径を小さくし、骨格をやや太めにすると保水寄りになります。セル径を大きくして伸長率を上げると、より通気寄りで軽い構造になります。",
      "ベースプレートを設定すると、底面に稠密な板が生成され、初期層の定着面積が増えます。プレートと gyroid は位相的に一本化されるよう SDF を min で結合しています。",
      "実機ではノズル径とレイヤー高に強く依存するので、このモードは造形条件との相性を見るためのベータ枠として使ってください。",
    ],
    legend: [
      { klass: "solid", label: "樹脂骨格" },
      { klass: "slot", label: "連続細孔" },
      { klass: "chamber", label: "開放空隙" },
    ],
    defaults: {
      width: 108,
      length: 108,
      thickness: 10.2,
      frame: 4,
      basePlate: 1.2,
      cell: 7.2,
      wall: 1,
      zStretch: 1.1,
    },
    presets: {
      plug: {
        label: "Plug",
        params: {
          width: 84,
          length: 84,
          thickness: 8.4,
          frame: 3.4,
          basePlate: 1,
          cell: 5.8,
          wall: 0.9,
          zStretch: 0.9,
        },
      },
      retain: {
        label: "Retain",
        params: {
          width: 112,
          length: 112,
          thickness: 11.2,
          frame: 4.2,
          basePlate: 1.4,
          cell: 6.4,
          wall: 1.1,
          zStretch: 1,
        },
      },
      airy: {
        label: "Airy",
        params: {
          width: 128,
          length: 120,
          thickness: 12.6,
          frame: 4.4,
          basePlate: 1,
          cell: 9.2,
          wall: 0.88,
          zStretch: 1.35,
        },
      },
    },
    fields: GYROID_FIELDS,
    buildDesign: buildGyroidDesign,
    drawPlan: drawGyroidPlan,
    fileStem: "gyroid-sponge-beta",
  },
  mat: {
    id: "mat",
    label: "Legacy Grid Mat",
    shortLabel: "旧格子案",
    eyebrow: "Legacy Preview",
    title: "縦横格子ベースの旧案",
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
    label: "Legacy Layer Sponge",
    shortLabel: "旧層状案",
    eyebrow: "Legacy Preview",
    title: "層状ラティスベースの旧案",
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
  mode: "meander",
  paramsByMode: Object.fromEntries(Object.values(MODELS).map((model) => [model.id, { ...model.defaults }])),
  currentDesign: null,
  renderedMode: null,
  geometry: null,
  edgeGeometry: null,
  controlMap: new Map(),
  dirtyModes: new Set(),
  isRendering: false,
  renderPromise: null,
};

const dom = {
  modeTabs: document.querySelector("#modeTabs"),
  presetGrid: document.querySelector("#presetGrid"),
  paramHint: document.querySelector("#paramHint"),
  controlFields: document.querySelector("#controlFields"),
  metricsGrid: document.querySelector("#metricsGrid"),
  warningList: document.querySelector("#warningList"),
  actionStatus: document.querySelector("#actionStatus"),
  updatePreviewBtn: document.querySelector("#updatePreviewBtn"),
  downloadBtn: document.querySelector("#downloadBtn"),
  copyLinkBtn: document.querySelector("#copyLinkBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  meshInfo: document.querySelector("#meshInfo"),
  planCanvas: document.querySelector("#planCanvas"),
  viewerMount: document.querySelector("#viewerMount"),
  previewLoading: document.querySelector("#previewLoading"),
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

function buildUniqueEdges(span, anchors = []) {
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
  if (unique.length === 1) {
    unique.push(span);
  }
  return Float32Array.from(unique);
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
  if (unique.length === 1) {
    unique.push(span);
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
  if (edges.length === 1) {
    edges.push(span);
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

function circleIntersectsCell(cx, cy, radius, x1, x2, y1, y2) {
  const nearestX = clamp(cx, x1, x2);
  const nearestY = clamp(cy, y1, y2);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy <= radius * radius + 1e-9;
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

function currentModeHasPendingChanges() {
  return state.dirtyModes.has(state.mode);
}

function updateActionButtons() {
  const dirty = currentModeHasPendingChanges();
  dom.updatePreviewBtn.disabled = state.isRendering || !dirty;
  dom.updatePreviewBtn.textContent = state.isRendering ? "Updating..." : "Update Preview";
  dom.downloadBtn.disabled = state.isRendering;
  dom.copyLinkBtn.disabled = state.isRendering;
  dom.resetBtn.disabled = state.isRendering;
}

function markDirty(message = "変更があります。Update Preview を押すと再計算します。") {
  const wasDirty = currentModeHasPendingChanges();
  state.dirtyModes.add(state.mode);
  updateActionButtons();
  if (!wasDirty) {
    dom.actionStatus.textContent = message;
  }
}

function clearDirty(mode = state.mode) {
  state.dirtyModes.delete(mode);
  updateActionButtons();
}

function setLoading(loading) {
  dom.previewLoading.hidden = !loading;
  updateActionButtons();
}

function nextPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function parseFieldValue(field, raw) {
  if (field.type === "toggle") {
    return raw === "1" || raw === "true";
  }
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

function getFieldMin(field) {
  return field.min != null ? field.min : 0;
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
  const model = MODELS[mode] || MODELS.meander;
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
      void renderAll(`${getModel().shortLabel} モードへ切り替えました。`);
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
      applyParams(preset.params, { render: true, statusMessage: `${preset.label} preset を適用しました。` });
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
              min="${getFieldMin(field)}"
              max="${field.max}"
              step="${field.step}"
            />
            <input
              id="${controlId(field.key, "number")}"
              type="number"
              min="${getFieldMin(field)}"
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
        markDirty();
      });
      state.controlMap.set(field.key, { field, toggle, root: toggle.closest("[data-control]") });
      continue;
    }

    const range = document.querySelector(`#${controlId(field.key, "range")}`);
    const number = document.querySelector(`#${controlId(field.key, "number")}`);
    const applyValue = (raw, syncBoth) => {
      const next = Number(raw);
      if (!Number.isFinite(next)) {
        return;
      }
      const clamped = clamp(next, getFieldMin(field), field.max);
      getActiveParams()[field.key] = clamped;
      range.value = String(clamped);
      if (syncBoth) {
        number.value = String(clamped);
      }
      markDirty();
    };
    range.addEventListener("input", () => {
      applyValue(range.value, true);
    });
    number.addEventListener("change", () => {
      applyValue(number.value, true);
    });
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

function applyParams(partial, options = {}) {
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
    nextParams[field.key] = clamp(numeric, getFieldMin(field), field.max);
  }
  syncControls();
  setDependentControlStates();
  if (options.render) {
    void renderAll(options.statusMessage || "");
    return;
  }
  markDirty(options.statusMessage);
}

function buildChannelAxis(span, frame, capillary, wall, spacing) {
  const interior = Math.max(span - frame * 2, 0);
  const usableCapillary = clamp(capillary, 0, Math.max(0, interior));
  const usableWall = clamp(wall, 0, Math.max(0, (interior - usableCapillary) * 0.5));
  const spacingValue = Math.max(0, spacing);
  const envelope = usableCapillary + usableWall * 2;
  const channelCount =
    interior <= 1e-6 || envelope <= 1e-6
      ? 0
      : Math.max(1, Math.floor((interior + spacingValue) / Math.max(envelope + spacingValue, 0.01)));
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
  const edges = buildUniqueEdges(span, anchors);
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
  const xChamber = !xWall && !xSlot;
  const yChamber = !yWall && !ySlot;
  const isSlot = xSlot || ySlot;
  const isSolid = !isSlot && (xWall || yWall);
  const isBridge = (xWall && ySlot) || (xSlot && yWall);
  return { xWall, yWall, xSlot, ySlot, xChamber, yChamber, isSolid, isSlot, isBridge };
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

/** 12 directions: two steps on axes, zero on the third (edge-adjacent voxels, not face-adjacent). */
const VOXEL_EDGE_OFFSETS = (() => {
  const out = [];
  for (const a of [-1, 1]) {
    for (const b of [-1, 1]) {
      out.push([a, b, 0], [a, 0, b], [0, a, b]);
    }
  }
  return out;
})();

function bridgeOffsetsForEdgeVector(dx, dy, dz) {
  if (dx !== 0 && dy !== 0 && dz === 0) {
    return [
      [Math.sign(dx), 0, 0],
      [0, Math.sign(dy), 0],
    ];
  }
  if (dx !== 0 && dz !== 0 && dy === 0) {
    return [
      [Math.sign(dx), 0, 0],
      [0, 0, Math.sign(dz)],
    ];
  }
  if (dy !== 0 && dz !== 0 && dx === 0) {
    return [
      [0, Math.sign(dy), 0],
      [0, 0, Math.sign(dz)],
    ];
  }
  return [];
}

/**
 * Face-adjacent union of cubes has a 2-manifold boundary; edge-only contacts add voxels so each
 * diagonal solid pair shares a face with at least one bridge cell (polycube-style fix).
 */
function bridgeVoxelOccupancyForManifoldShell(occupancy, nx, ny, nz) {
  const at = (ix, iy, iz) => {
    if (ix < 0 || ix >= nx || iy < 0 || iy >= ny || iz < 0 || iz >= nz) {
      return 0;
    }
    return occupancy[ix + nx * (iy + ny * iz)];
  };
  const setSolid = (ix, iy, iz) => {
    occupancy[ix + nx * (iy + ny * iz)] = 1;
  };

  let guard = 0;
  let changed = true;
  while (changed && guard < 512) {
    guard += 1;
    changed = false;
    for (let iz = 0; iz < nz; iz += 1) {
      for (let iy = 0; iy < ny; iy += 1) {
        for (let ix = 0; ix < nx; ix += 1) {
          if (!at(ix, iy, iz)) {
            continue;
          }
          for (const [dx, dy, dz] of VOXEL_EDGE_OFFSETS) {
            const ox = ix + dx;
            const oy = iy + dy;
            const oz = iz + dz;
            if (!at(ox, oy, oz)) {
              continue;
            }
            for (const [bx, by, bz] of bridgeOffsetsForEdgeVector(dx, dy, dz)) {
              const tx = ix + bx;
              const ty = iy + by;
              const tz = iz + bz;
              if (!at(tx, ty, tz)) {
                setSolid(tx, ty, tz);
                changed = true;
              }
            }
          }
        }
      }
    }
  }
}

function buildVoxelMesh(xEdges, yEdges, zEdges, occupancy) {
  const nx = xEdges.length - 1;
  const ny = yEdges.length - 1;
  const nz = zEdges.length - 1;
  const occ = new Uint8Array(occupancy);
  bridgeVoxelOccupancyForManifoldShell(occ, nx, ny, nz);
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
    return occ[ix + nx * (iy + ny * iz)];
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
              [x2, y2, z1],
              [x2, y2, z2],
              [x2, y1, z2],
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
              [x1, y1, z2],
              [x1, y2, z2],
              [x1, y2, z1],
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
              [x1, y2, z2],
              [x2, y2, z2],
              [x2, y2, z1],
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
              [x2, y1, z1],
              [x2, y1, z2],
              [x1, y1, z2],
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

function vertexIndex(ix, iy, iz, gx, gy) {
  return ix + gx * (iy + gy * iz);
}

function computeGridFieldValues(xEdges, yEdges, zEdges, sampleField) {
  const gx = xEdges.length;
  const gy = yEdges.length;
  const gz = zEdges.length;
  const values = new Float32Array(gx * gy * gz);

  for (let iz = 0; iz < gz; iz += 1) {
    const z = zEdges[iz];
    for (let iy = 0; iy < gy; iy += 1) {
      const y = yEdges[iy];
      for (let ix = 0; ix < gx; ix += 1) {
        values[vertexIndex(ix, iy, iz, gx, gy)] = sampleField(xEdges[ix], y, z);
      }
    }
  }

  return values;
}

function buildSmoothFieldMesh(xEdges, yEdges, zEdges, sampleField) {
  const values = computeGridFieldValues(xEdges, yEdges, zEdges, sampleField);
  const nx = xEdges.length - 1;
  const ny = yEdges.length - 1;
  const nz = zEdges.length - 1;
  const occupancy = new Uint8Array(nx * ny * nz);
  for (let iz = 0; iz < nz; iz += 1) {
    const z = (zEdges[iz] + zEdges[iz + 1]) * 0.5;
    for (let iy = 0; iy < ny; iy += 1) {
      const y = (yEdges[iy] + yEdges[iy + 1]) * 0.5;
      for (let ix = 0; ix < nx; ix += 1) {
        const x = (xEdges[ix] + xEdges[ix + 1]) * 0.5;
        occupancy[ix + nx * (iy + ny * iz)] = sampleField(x, y, z) <= 0 ? 1 : 0;
      }
    }
  }
  const mesh = buildVoxelMesh(xEdges, yEdges, zEdges, occupancy);
  return { mesh, values };
}

function estimateSolidVolumeFromFieldGrid(xEdges, yEdges, zEdges, values) {
  const gx = xEdges.length;
  const gy = yEdges.length;
  const gz = zEdges.length;
  const nx = gx - 1;
  const ny = gy - 1;
  const nz = gz - 1;
  let solidVolume = 0;
  const sliceMask = new Uint8Array(nx * ny);
  const midIndex = Math.floor(nz * 0.5);

  for (let iz = 0; iz < nz; iz += 1) {
    const dz = zEdges[iz + 1] - zEdges[iz];
    for (let iy = 0; iy < ny; iy += 1) {
      const dy = yEdges[iy + 1] - yEdges[iy];
      for (let ix = 0; ix < nx; ix += 1) {
        const dx = xEdges[ix + 1] - xEdges[ix];
        const corners = [
          values[vertexIndex(ix, iy, iz, gx, gy)],
          values[vertexIndex(ix + 1, iy, iz, gx, gy)],
          values[vertexIndex(ix + 1, iy + 1, iz, gx, gy)],
          values[vertexIndex(ix, iy + 1, iz, gx, gy)],
          values[vertexIndex(ix, iy, iz + 1, gx, gy)],
          values[vertexIndex(ix + 1, iy, iz + 1, gx, gy)],
          values[vertexIndex(ix + 1, iy + 1, iz + 1, gx, gy)],
          values[vertexIndex(ix, iy + 1, iz + 1, gx, gy)],
        ];
        const mean = corners.reduce((sum, value) => sum + value, 0) / corners.length;
        if (mean <= 0) {
          solidVolume += dx * dy * dz;
          if (iz === midIndex) {
            sliceMask[ix + iy * nx] = 1;
          }
        }
      }
    }
  }

  return { solidVolume, sliceMask };
}

function estimateSolidVolumeFromCellCenters(xEdges, yEdges, zEdges, sampleField) {
  const nx = xEdges.length - 1;
  const ny = yEdges.length - 1;
  const nz = zEdges.length - 1;
  let solidVolume = 0;

  for (let iz = 0; iz < nz; iz += 1) {
    const z = (zEdges[iz] + zEdges[iz + 1]) * 0.5;
    const dz = zEdges[iz + 1] - zEdges[iz];
    for (let iy = 0; iy < ny; iy += 1) {
      const y = (yEdges[iy] + yEdges[iy + 1]) * 0.5;
      const dy = yEdges[iy + 1] - yEdges[iy];
      for (let ix = 0; ix < nx; ix += 1) {
        const x = (xEdges[ix] + xEdges[ix + 1]) * 0.5;
        if (sampleField(x, y, z) > 0) {
          continue;
        }
        solidVolume += (xEdges[ix + 1] - xEdges[ix]) * dy * dz;
      }
    }
  }

  return solidVolume;
}

function sdBoxCentered(px, py, pz, hx, hy, hz) {
  const qx = Math.abs(px) - hx;
  const qy = Math.abs(py) - hy;
  const qz = Math.abs(pz) - hz;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  const oz = Math.max(qz, 0);
  return Math.hypot(ox, oy, oz) + Math.min(Math.max(qx, qy, qz), 0);
}

function sdVerticalCylinder(x, y, z, cx, cy, radius, z0, z1) {
  const radial = Math.hypot(x - cx, y - cy) - radius;
  const centerZ = (z0 + z1) * 0.5;
  const halfHeight = Math.max(0, (z1 - z0) * 0.5);
  const axial = Math.abs(z - centerZ) - halfHeight;
  const ox = Math.max(radial, 0);
  const oy = Math.max(axial, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(radial, axial), 0);
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq <= 1e-9) {
    return Math.hypot(px - ax, py - ay);
  }
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / lengthSq, 0, 1);
  const qx = ax + dx * t;
  const qy = ay + dy * t;
  return Math.hypot(px - qx, py - qy);
}

function distanceToChannelNetwork(px, py, segments) {
  let best = Infinity;
  for (const segment of segments) {
    const distance =
      distanceToSegment(px, py, segment.x1, segment.y1, segment.x2, segment.y2) - segment.radius;
    if (distance < best) {
      best = distance;
    }
  }
  return best;
}

function estimatePlanarBetaResolution(params, minFeature) {
  const dominant = Math.max(params.width, params.length);
  return clamp(minFeature * 0.42, Math.max(0.46, dominant / 240), 0.82);
}

function buildDimpleHeight(topHeight, x, y, thickness, dimpleCenters, dimpleRadius, dimpleDepth) {
  if (!dimpleCenters.length || dimpleRadius <= 0 || dimpleDepth <= 0) {
    return topHeight;
  }
  let adjusted = topHeight;
  for (const center of dimpleCenters) {
    const distance = Math.hypot(x - center.x, y - center.y);
    if (distance > dimpleRadius) {
      continue;
    }
    const weight = 1 - distance / dimpleRadius;
    adjusted -= dimpleDepth * weight * weight;
  }
  return Math.max(thickness * 0.34, adjusted);
}

function buildPlanarChannelDesign({
  mode,
  params,
  resolution,
  segments,
  dimpleCenters = [],
  dimpleRadius = 0,
  dimpleDepth = 0,
  metricCards,
  warnings,
  meshInfoText,
  extra = {},
}) {
  const xEdges = buildEdges(params.width, resolution);
  const yEdges = buildEdges(params.length, resolution);
  const zEdges = buildZEdges(params.thickness, resolution);
  const nx = xEdges.length - 1;
  const ny = yEdges.length - 1;
  const solidMask = new Uint8Array(nx * ny);
  const topHeights = new Float32Array(nx * ny);

  for (let iy = 0; iy < ny; iy += 1) {
    const y = (yEdges[iy] + yEdges[iy + 1]) * 0.5;
    for (let ix = 0; ix < nx; ix += 1) {
      const x = (xEdges[ix] + xEdges[ix + 1]) * 0.5;
      const flatIndex = ix + iy * nx;
      const inInterior =
        x >= params.frame &&
        x <= params.width - params.frame &&
        y >= params.frame &&
        y <= params.length - params.frame;
      const inChannel = inInterior && distanceToChannelNetwork(x, y, segments) <= 0;
      if (inChannel) {
        continue;
      }
      solidMask[flatIndex] = 1;
      topHeights[flatIndex] = buildDimpleHeight(
        params.thickness,
        x,
        y,
        params.thickness,
        dimpleCenters,
        dimpleRadius,
        dimpleDepth
      );
    }
  }

  const occupancyData = buildOccupancyFromTopHeights(xEdges, yEdges, zEdges, solidMask, topHeights, null, 0);
  const mesh = buildVoxelMesh(xEdges, yEdges, zEdges, occupancyData.occupancy);
  const totalVolume = params.width * params.length * params.thickness;
  const solidVolume = occupancyData.occupiedCount * occupancyData.voxelVolume;
  const porosity = clamp(1 - solidVolume / Math.max(totalVolume, 1), 0, 0.98);
  const massGram = solidVolume * 0.00124;

  return {
    mode,
    params,
    resolution,
    mesh,
    porosity,
    massGram,
    segments,
    dimpleCenters,
    dimpleRadius,
    meshInfoText:
      meshInfoText ||
      `${mesh.triangleCount.toLocaleString()} tris / XY ${formatValue(resolution, 2)} mm / Z ${
        formatValue(zEdges[1] - zEdges[0], 2)
      } mm`,
    metricCards: metricCards({ porosity, massGram }),
    warnings: warnings({ porosity, massGram }),
    ...extra,
  };
}

function buildMeanderSegments(params) {
  const insetX = params.frame + params.wall + params.channel * 0.5;
  const insetY = params.frame + params.wall + params.channel * 0.5;
  const pitch = params.channel + params.wall * 2 + params.laneGap;
  const usableLength = Math.max(params.length - insetY * 2, params.channel);
  const laneCount = Math.max(1, Math.floor((usableLength + params.laneGap) / Math.max(pitch, 0.2)));
  const used = Math.max(0, laneCount - 1) * pitch;
  const startY = params.length * 0.5 - used * 0.5;
  const points = [{ x: insetX, y: startY }];

  for (let laneIndex = 0; laneIndex < laneCount; laneIndex += 1) {
    const y = startY + laneIndex * pitch;
    const x = laneIndex % 2 === 0 ? params.width - insetX : insetX;
    points.push({ x, y });
    if (laneIndex < laneCount - 1) {
      points.push({ x, y: startY + (laneIndex + 1) * pitch });
    }
  }

  const segments = [];
  let channelLength = 0;
  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    channelLength += Math.hypot(b.x - a.x, b.y - a.y);
    segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, radius: params.channel * 0.5 });
  }

  const turningPoints = points.slice(1, -1);
  return { segments, laneCount, channelLength, turningPoints };
}

function buildMeanderDesign(inputParams) {
  const params = {
    width: clamp(inputParams.width, 0, 220),
    length: clamp(inputParams.length, 0, 220),
    thickness: clamp(inputParams.thickness, 0, 8),
    frame: clamp(inputParams.frame, 0, Math.min(inputParams.width, inputParams.length) * 0.24),
    channel: clamp(inputParams.channel, 0, 2.4),
    wall: clamp(inputParams.wall, 0, 2.2),
    laneGap: clamp(inputParams.laneGap, 0, 18),
    pocket: Boolean(inputParams.pocket),
    pocketDia: clamp(inputParams.pocketDia, 0, 8),
  };

  const meander = buildMeanderSegments(params);
  const dimpleCenters = params.pocket ? meander.turningPoints : [];
  const dimpleRadius = params.pocket ? params.pocketDia * 0.5 : 0;
  const dimpleDepth = params.pocket ? Math.min(params.thickness * 0.24, params.pocketDia * 0.12 + 0.16) : 0;
  const resolution = estimatePlanarBetaResolution(
    params,
    Math.min(params.channel, params.wall, params.laneGap, params.thickness)
  );

  return buildPlanarChannelDesign({
    mode: "meander",
    params,
    resolution,
    segments: meander.segments,
    dimpleCenters,
    dimpleRadius,
    dimpleDepth,
    metricCards: ({ porosity, massGram }) => [
      { label: "蛇行レーン数", value: `${meander.laneCount}` },
      { label: "流路延長", value: `${formatValue(meander.channelLength, 0)} mm` },
      { label: "空隙幅", value: `${formatValue(params.channel, 2)} mm` },
      { label: "最小壁厚", value: `${formatValue(params.wall, 2)} mm` },
      { label: "空気ギャップ", value: `${formatValue(params.laneGap, 1)} mm` },
      { label: "播種ポケット", value: params.pocket ? `${dimpleCenters.length} 箇所` : "off" },
      { label: "実空隙率", value: `${formatValue(porosity * 100, 1)} %` },
      { label: "概算質量", value: `${formatValue(massGram, 1)} g` },
    ],
    warnings: ({ porosity }) => {
      const notes = [];
      if (params.wall < 0.6) {
        notes.push("最小壁厚が細めです。0.4 mm ノズルなら 0.65 mm 以上の方が安定します。");
      }
      if (params.laneGap < 2.2) {
        notes.push("空気ギャップが狭めです。通気を見たい試作なら 3 mm 以上あると比較しやすいです。");
      }
      if (meander.laneCount <= 2) {
        notes.push("レーン数が少なく、面内の濡れ広がり比較にはやや単純です。長さか密度を上げる余地があります。");
      }
      if (porosity > 0.7) {
        notes.push("空隙率が高めで、持ち上げ時のたわみが出やすい構成です。厚みか壁厚を少し増やすと扱いやすくなります。");
      }
      if (!notes.length) {
        notes.push("この案は単一路線なので、寸法の再現性と濡れ上がり観察のしやすさを優先したベースラインとして扱いやすいです。");
      }
      return notes;
    },
    extra: {
      channelWidth: params.channel,
    },
  });
}

function buildLeafNetwork(params) {
  const centerX = params.width * 0.5;
  const trunkStart = params.frame + params.trunk * 0.8;
  const trunkEnd = params.length - params.frame - params.trunk * 0.8;
  const usable = Math.max(trunkEnd - trunkStart, 8);
  const step = Math.max(params.branchPitch, 6);
  const nodeCount = Math.max(2, Math.floor(usable / step));
  const startY = trunkStart + Math.max(0, usable - step * (nodeCount - 1)) * 0.5;
  const segments = [
    { x1: centerX, y1: trunkStart, x2: centerX, y2: trunkEnd, radius: params.trunk * 0.5 },
  ];
  const branchTips = [];
  let channelLength = trunkEnd - trunkStart;

  for (let index = 0; index < nodeCount; index += 1) {
    const y = startY + index * step;
    const progress = usable <= 0 ? 0.5 : clamp((y - trunkStart) / usable, 0, 1);
    const reachScale = 0.78 + Math.sin(progress * Math.PI) * 0.28;
    const reach = Math.min(params.reach * reachScale, centerX - params.frame - params.branch * 0.7);
    const rise = Math.min(step * 0.82, Math.max(step * 0.3, reach * 0.32));
    const tipY = Math.min(trunkEnd - params.branch * 0.7, y + rise);
    const left = { x: centerX - reach, y: tipY };
    const right = { x: centerX + reach, y: tipY };
    branchTips.push(left, right);
    channelLength += Math.hypot(left.x - centerX, left.y - y) + Math.hypot(right.x - centerX, right.y - y);
    segments.push(
      { x1: centerX, y1: y, x2: left.x, y2: left.y, radius: params.branch * 0.5 },
      { x1: centerX, y1: y, x2: right.x, y2: right.y, radius: params.branch * 0.5 }
    );
  }

  return { segments, nodeCount, branchTips, channelLength };
}

function buildLeafDesign(inputParams) {
  const params = {
    width: clamp(inputParams.width, 0, 220),
    length: clamp(inputParams.length, 0, 220),
    thickness: clamp(inputParams.thickness, 0, 8),
    frame: clamp(inputParams.frame, 0, Math.min(inputParams.width, inputParams.length) * 0.24),
    trunk: clamp(inputParams.trunk, 0, 2.8),
    branch: clamp(inputParams.branch, 0, 2.2),
    branchPitch: clamp(inputParams.branchPitch, 0, 28),
    reach: clamp(inputParams.reach, 0, 48),
    pocket: Boolean(inputParams.pocket),
    pocketDia: clamp(inputParams.pocketDia, 0, 10),
  };

  const network = buildLeafNetwork(params);
  const dimpleCenters = params.pocket ? network.branchTips : [];
  const dimpleRadius = params.pocket ? params.pocketDia * 0.5 : 0;
  const dimpleDepth = params.pocket ? Math.min(params.thickness * 0.22, params.pocketDia * 0.1 + 0.18) : 0;
  const resolution = estimatePlanarBetaResolution(
    params,
    Math.min(params.trunk, params.branch, params.branchPitch * 0.5, params.thickness)
  );

  return buildPlanarChannelDesign({
    mode: "leaf",
    params,
    resolution,
    segments: network.segments,
    dimpleCenters,
    dimpleRadius,
    dimpleDepth,
    metricCards: ({ porosity, massGram }) => [
      { label: "側脈ノード数", value: `${network.nodeCount}` },
      { label: "流路延長", value: `${formatValue(network.channelLength, 0)} mm` },
      { label: "主脈幅", value: `${formatValue(params.trunk, 2)} mm` },
      { label: "側脈幅", value: `${formatValue(params.branch, 2)} mm` },
      { label: "側脈ピッチ", value: `${formatValue(params.branchPitch, 1)} mm` },
      { label: "枝先ポケット", value: params.pocket ? `${dimpleCenters.length} 箇所` : "off" },
      { label: "実空隙率", value: `${formatValue(porosity * 100, 1)} %` },
      { label: "概算質量", value: `${formatValue(massGram, 1)} g` },
    ],
    warnings: ({ porosity }) => {
      const notes = [];
      if (params.branch < 0.55) {
        notes.push("側脈幅がかなり細いです。先端まで抜けるかは造形条件の確認が必要です。");
      }
      if (params.reach > params.width * 0.32) {
        notes.push("側脈の張り出しが大きめで、枝先近傍の剛性が落ちやすいです。");
      }
      if (params.branchPitch < 10) {
        notes.push("枝密度が高めで、葉脈というより広い溝面になりやすい設定です。");
      }
      if (porosity < 0.08) {
        notes.push("空隙率が低く、通気よりも保水寄りの重い板になります。");
      }
      if (!notes.length) {
        notes.push("この案は主脈から側脈へ流れを配るので、方向性を持つ給水パターンの比較に向いています。");
      }
      return notes;
    },
    extra: {
      channelWidth: Math.max(params.trunk, params.branch),
    },
  });
}

function buildPillarAxis(span, frame, diameter, gap) {
  const radius = diameter * 0.5;
  const minCenter = Math.min(span * 0.5, frame + radius);
  const maxCenter = Math.max(minCenter, span - frame - radius);
  const pitch = Math.max(diameter + gap, 0.1);
  const count = Math.max(1, Math.floor((maxCenter - minCenter) / Math.max(pitch, 0.1)) + 1);
  const used = Math.max(0, count - 1) * pitch;
  const start = minCenter + Math.max(0, maxCenter - minCenter - used) * 0.5;
  return {
    centers: Array.from({ length: count }, (_, index) => start + index * pitch),
    count,
    pitch,
  };
}

function buildRectPillarLayout(params) {
  const xAxis = buildPillarAxis(params.width, params.frame, params.capillaryDia, params.xGap);
  const yAxis = buildPillarAxis(params.length, params.frame, params.capillaryDia, params.yGap);
  const centers = [];
  for (const y of yAxis.centers) {
    for (const x of xAxis.centers) {
      centers.push({ x, y });
    }
  }
  return {
    centers,
    xCenters: xAxis.centers,
    yCenters: yAxis.centers,
    xPitch: xAxis.pitch,
    yPitch: yAxis.pitch,
    columnCount: xAxis.count,
    rowCount: yAxis.count,
  };
}

function bounceIndex(index, length) {
  if (length <= 1) {
    return 0;
  }
  const cycle = (length - 1) * 2;
  const phase = positiveModulo(index, cycle);
  return phase < length ? phase : cycle - phase;
}

function clampTunnelCenterZ(thickness, cupDepth, radius, ratio) {
  const minZ = radius + 0.22;
  const maxZ = Math.max(minZ, thickness - cupDepth - radius - 0.18);
  return clamp(thickness * ratio, minZ, maxZ);
}

function estimatePillarResolution(params, tunnelDia = 0) {
  const dominant = Math.max(params.width, params.length);
  const detail = Math.min(
    params.capillaryDia * 0.34,
    params.xGap * 0.4,
    params.yGap * 0.4,
    params.cupDepth * 0.95,
    params.thickness / 10,
    tunnelDia > 0 ? tunnelDia * 0.42 : Infinity
  );
  return clamp(detail, Math.max(0.28, dominant / 250), 0.74);
}

function distanceToSegment3d(px, py, pz, ax, ay, az, bx, by, bz) {
  const dx = bx - ax;
  const dy = by - ay;
  const dz = bz - az;
  const lengthSq = dx * dx + dy * dy + dz * dz;
  if (lengthSq <= 1e-9) {
    return Math.hypot(px - ax, py - ay, pz - az);
  }
  const t = clamp(((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / lengthSq, 0, 1);
  const qx = ax + dx * t;
  const qy = ay + dy * t;
  const qz = az + dz * t;
  return Math.hypot(px - qx, py - qy, pz - qz);
}

function distanceToTunnelNetwork3d(px, py, pz, segments) {
  let best = Infinity;
  for (const segment of segments) {
    const distance =
      distanceToSegment3d(px, py, pz, segment.x1, segment.y1, segment.z1, segment.x2, segment.y2, segment.z2) -
      segment.radius;
    if (distance < best) {
      best = distance;
    }
  }
  return best;
}

function measureSegmentNetworkLength(segments) {
  let total = 0;
  for (const segment of segments) {
    total += Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1, segment.z2 - segment.z1);
  }
  return total;
}

function buildZigzagTunnelSegments(layout, params) {
  const radius = params.tunnelDia * 0.5;
  const z = clampTunnelCenterZ(params.thickness, params.cupDepth, radius, params.tunnelLift);
  const segments = [];

  if (layout.xCenters.length >= 2) {
    const points = layout.xCenters.map((x, index) => ({
      x,
      y: layout.yCenters[bounceIndex(index, layout.yCenters.length)],
      z,
    }));
    for (let index = 1; index < points.length; index += 1) {
      const a = points[index - 1];
      const b = points[index];
      segments.push({ x1: a.x, y1: a.y, z1: a.z, x2: b.x, y2: b.y, z2: b.z, radius });
    }
    return { segments, upperZ: z, lowerZ: z };
  }

  if (layout.yCenters.length >= 2) {
    for (let index = 1; index < layout.yCenters.length; index += 1) {
      segments.push({
        x1: layout.xCenters[0],
        y1: layout.yCenters[index - 1],
        z1: z,
        x2: layout.xCenters[0],
        y2: layout.yCenters[index],
        z2: z,
        radius,
      });
    }
  }

  return { segments, upperZ: z, lowerZ: z };
}

function buildLadderTunnelSegments(layout, params) {
  const radius = params.tunnelDia * 0.5;
  const upperZ = clampTunnelCenterZ(params.thickness, params.cupDepth, radius, params.tunnelLift);
  const lowerTarget = Math.min(params.thickness * 0.38, upperZ - Math.max(radius * 2.4, 0.9));
  const lowerZ = clamp(lowerTarget, radius + 0.22, Math.max(radius + 0.22, upperZ - radius * 1.6));
  const segments = [];

  for (let rowIndex = 0; rowIndex < layout.yCenters.length; rowIndex += 1) {
    const y = layout.yCenters[rowIndex];
    const z = rowIndex % 2 === 0 ? upperZ : lowerZ;
    for (let index = 1; index < layout.xCenters.length; index += 1) {
      segments.push({
        x1: layout.xCenters[index - 1],
        y1: y,
        z1: z,
        x2: layout.xCenters[index],
        y2: y,
        z2: z,
        radius,
      });
    }
  }

  for (let columnIndex = 0; columnIndex < layout.xCenters.length; columnIndex += 1) {
    const x = layout.xCenters[columnIndex];
    const z = columnIndex % 2 === 0 ? lowerZ : upperZ;
    for (let index = 1; index < layout.yCenters.length; index += 1) {
      segments.push({
        x1: x,
        y1: layout.yCenters[index - 1],
        z1: z,
        x2: x,
        y2: layout.yCenters[index],
        z2: z,
        radius,
      });
    }
  }

  return { segments, upperZ, lowerZ };
}

function normalizePillarBaseParams(inputParams) {
  return {
    width: clamp(inputParams.width, 0, 220),
    length: clamp(inputParams.length, 0, 220),
    thickness: clamp(inputParams.thickness, 0, 16),
    frame: clamp(inputParams.frame, 0, Math.min(inputParams.width, inputParams.length) * 0.24),
    capillaryDia: clamp(inputParams.capillaryDia, 0, 3.2),
    xGap: clamp(inputParams.xGap, 0, 18),
    yGap: clamp(inputParams.yGap, 0, 18),
    cupDia: clamp(inputParams.cupDia, 0, 10),
    cupDepth: clamp(inputParams.cupDepth, 0, 2.2),
  };
}

function buildPillarVoxelDesign({ mode, params, layout, tunnelSegments = [], tunnelLabel = null, tunnelLevels = null }) {
  const capillaryRadius = params.capillaryDia * 0.5;
  const pitchFloor = Math.min(layout.xPitch, layout.yPitch);
  const maxCupRadius = Math.max(
    capillaryRadius + 0.18,
    (Number.isFinite(pitchFloor) ? pitchFloor : params.capillaryDia + Math.min(params.xGap, params.yGap)) * 0.48
  );
  const cupRadius = clamp(params.cupDia * 0.5, capillaryRadius + 0.18, maxCupRadius);
  const cupDepth = Math.min(params.cupDepth, params.thickness * 0.42);
  const tunnelDia = tunnelSegments.length ? tunnelSegments[0].radius * 2 : 0;
  const resolution = estimatePillarResolution(params, tunnelDia);
  const xAnchors = [params.frame, params.width - params.frame];
  const yAnchors = [params.frame, params.length - params.frame];
  const zAnchors = [0, params.thickness, params.thickness - cupDepth];
  for (const center of layout.centers) {
    xAnchors.push(center.x - capillaryRadius, center.x + capillaryRadius, center.x - cupRadius, center.x + cupRadius);
    yAnchors.push(center.y - capillaryRadius, center.y + capillaryRadius, center.y - cupRadius, center.y + cupRadius);
  }
  for (const segment of tunnelSegments) {
    xAnchors.push(segment.x1 - segment.radius, segment.x1 + segment.radius, segment.x2 - segment.radius, segment.x2 + segment.radius);
    yAnchors.push(segment.y1 - segment.radius, segment.y1 + segment.radius, segment.y2 - segment.radius, segment.y2 + segment.radius);
    zAnchors.push(segment.z1 - segment.radius, segment.z1 + segment.radius, segment.z2 - segment.radius, segment.z2 + segment.radius);
  }

  const xEdges = buildAnchoredEdges(params.width, resolution, xAnchors);
  const yEdges = buildAnchoredEdges(params.length, resolution, yAnchors);
  const zEdges = buildAnchoredEdges(params.thickness, clamp(Math.min(resolution, params.thickness / 12), 0.18, 0.52), zAnchors);
  const halfWidth = params.width * 0.5;
  const halfLength = params.length * 0.5;
  const halfThickness = params.thickness * 0.5;

  const sampleField = (x, y, z) => {
    const boxField = sdBoxCentered(x - halfWidth, y - halfLength, z - halfThickness, halfWidth, halfLength, halfThickness);
    let voidField = Infinity;

    for (const center of layout.centers) {
      voidField = Math.min(
        voidField,
        sdVerticalCylinder(x, y, z, center.x, center.y, capillaryRadius, 0, params.thickness)
      );
      if (cupDepth > 0) {
        voidField = Math.min(
          voidField,
          sdVerticalCylinder(
            x,
            y,
            z,
            center.x,
            center.y,
            cupRadius,
            params.thickness - cupDepth,
            params.thickness
          )
        );
      }
    }

    for (const segment of tunnelSegments) {
      voidField = Math.min(
        voidField,
        distanceToSegment3d(x, y, z, segment.x1, segment.y1, segment.z1, segment.x2, segment.y2, segment.z2) -
          segment.radius
      );
    }

    return Math.max(boxField, -voidField);
  };

  const smooth = buildSmoothFieldMesh(xEdges, yEdges, zEdges, sampleField);
  const solidVolume = estimateSolidVolumeFromCellCenters(xEdges, yEdges, zEdges, sampleField);
  const mesh = smooth.mesh;
  const totalVolume = params.width * params.length * params.thickness;
  const porosity = clamp(1 - solidVolume / Math.max(totalVolume, 1), 0, 0.98);
  const massGram = solidVolume * 0.00124;

  const warnings = [];
  if (params.capillaryDia > 1.6) {
    warnings.push("鉛直毛細管の内径が広めです。吸い上げの比較なら 0.8 - 1.2 mm 側が基準にしやすいです。");
  }
  if (params.xGap < 2 || params.yGap < 2) {
    warnings.push("円柱どうしの外壁クリアランスが狭めです。通気比較なら 3 mm 以上あると差が見やすいです。");
  }
  if (cupDepth > params.thickness * 0.24) {
    warnings.push("上面カップが深めで、上面剛性が落ち気味です。0.4 - 0.9 mm 付近から確認するのが安全です。");
  }
  if (tunnelDia > 0 && tunnelDia > params.capillaryDia * 1.2) {
    warnings.push("横孔が鉛直毛細管よりかなり太いです。通気は増えますが、毛細管らしさは弱まりやすいです。");
  }
  if (porosity > 0.84) {
    warnings.push("空隙率が高く、持ち上げ時のたわみが出やすい構成です。厚みかクリアランスを少し戻す余地があります。");
  }
  if (!warnings.length) {
    warnings.push("円柱毛細管系としては比較的素直な構成です。まずはこの寸法感で濡れ上がりと乾きの差を見るのに向いています。");
  }

  const metricCards = [
    { label: "毛細管本数", value: `${layout.columnCount} × ${layout.rowCount}` },
    { label: "毛細管内径", value: `${formatValue(params.capillaryDia, 2)} mm` },
    { label: "配置ピッチ", value: `X ${formatValue(layout.xPitch, 1)} / Y ${formatValue(layout.yPitch, 1)} mm` },
    { label: "播種カップ径", value: `${formatValue(cupRadius * 2, 2)} mm` },
  ];
  if (tunnelLabel) {
    metricCards.push(
      { label: tunnelLabel, value: `${formatValue(tunnelDia, 2)} mm` },
      { label: "横孔延長", value: `${formatValue(measureSegmentNetworkLength(tunnelSegments), 0)} mm` }
    );
  }
  if (tunnelLevels) {
    metricCards.push({ label: "横孔高さ", value: tunnelLevels });
  }
  metricCards.push(
    { label: "実空隙率", value: `${formatValue(porosity * 100, 1)} %` },
    { label: "概算質量", value: `${formatValue(massGram, 1)} g` }
  );

  return {
    mode,
    params,
    resolution,
    mesh,
    meshInfoText: `${mesh.triangleCount.toLocaleString()} tris / watertight voxel surface / XY ${formatValue(resolution, 2)} mm / Z ${formatValue(zEdges[1] - zEdges[0], 2)} mm`,
    pillarCenters: layout.centers,
    capillaryRadius,
    cupRadius,
    tunnelSegments,
    metricCards,
    warnings,
  };
}

function buildPillarDesign(inputParams) {
  const params = normalizePillarBaseParams(inputParams);
  const layout = buildRectPillarLayout(params);
  return buildPillarVoxelDesign({ mode: "pillar", params, layout });
}

function buildPillarZigzagDesign(inputParams) {
  const params = {
    ...normalizePillarBaseParams(inputParams),
    tunnelDia: clamp(inputParams.tunnelDia, 0, 3.6),
    tunnelLift: clamp(inputParams.tunnelLift, 0, 0.82),
  };
  const layout = buildRectPillarLayout(params);
  const tunnel = buildZigzagTunnelSegments(layout, params);
  return buildPillarVoxelDesign({
    mode: "pillarZigzag",
    params,
    layout,
    tunnelSegments: tunnel.segments,
    tunnelLabel: "横孔内径",
    tunnelLevels: `${formatValue(tunnel.upperZ, 2)} mm`,
  });
}

function buildPillarLadderDesign(inputParams) {
  const params = {
    ...normalizePillarBaseParams(inputParams),
    tunnelDia: clamp(inputParams.tunnelDia, 0, 3.2),
    tunnelLift: clamp(inputParams.tunnelLift, 0, 0.82),
  };
  const layout = buildRectPillarLayout(params);
  const tunnel = buildLadderTunnelSegments(layout, params);
  return buildPillarVoxelDesign({
    mode: "pillarLadder",
    params,
    layout,
    tunnelSegments: tunnel.segments,
    tunnelLabel: "連通孔内径",
    tunnelLevels: `${formatValue(tunnel.lowerZ, 2)} / ${formatValue(tunnel.upperZ, 2)} mm`,
  });
}

function estimateGyroidResolution(params) {
  const dominant = Math.max(params.width, params.length);
  return clamp(
    Math.min(params.wall * 0.45, params.cell * 0.16),
    Math.max(0.34, dominant / 300),
    0.82
  );
}

function buildGyroidDesign(inputParams) {
  const params = {
    width: clamp(inputParams.width, 0, 220),
    length: clamp(inputParams.length, 0, 220),
    thickness: clamp(inputParams.thickness, 0, 20),
    frame: clamp(inputParams.frame, 0, Math.min(inputParams.width, inputParams.length) * 0.24),
    basePlate: clamp(inputParams.basePlate ?? 0, 0, 5),
    cell: clamp(inputParams.cell, 0, 18),
    wall: clamp(inputParams.wall, 0, 2.8),
    zStretch: clamp(inputParams.zStretch, 0, 1.8),
  };
  const effectiveBasePlate = Math.min(params.basePlate, params.thickness * 0.45);

  const resolution = estimateGyroidResolution(params);
  const zResolution = clamp(Math.min(resolution, params.cell * 0.14), 0.28, 0.72);
  const xEdges = buildEdges(params.width, resolution);
  const yEdges = buildEdges(params.length, resolution);
  const zEdges = buildEdges(params.thickness, zResolution);
  const ax = (Math.PI * 2) / params.cell;
  const ay = (Math.PI * 2) / params.cell;
  const az = (Math.PI * 2) / Math.max(params.cell * params.zStretch, 0.1);
  const threshold = clamp((params.wall / params.cell) * 1.95, 0.14, 0.62);
  const halfWidth = params.width * 0.5;
  const halfLength = params.length * 0.5;
  const halfThickness = params.thickness * 0.5;
  const sampleField = (x, y, z) => {
    const boxField = sdBoxCentered(x - halfWidth, y - halfLength, z - halfThickness, halfWidth, halfLength, halfThickness);
    const frameField = Math.min(
      x - params.frame,
      params.width - params.frame - x,
      y - params.frame,
      params.length - params.frame - y
    );
    const gyroidRaw =
      Math.abs(
        Math.sin(ax * x) * Math.cos(ay * y) +
          Math.sin(ay * y) * Math.cos(az * z) +
          Math.sin(az * z) * Math.cos(ax * x)
      ) - threshold;
    const plateSdf = z - effectiveBasePlate;
    const interiorField =
      effectiveBasePlate > 0 ? Math.min(gyroidRaw, plateSdf) : gyroidRaw;
    return Math.max(boxField, Math.min(frameField, interiorField));
  };

  const smooth = buildSmoothFieldMesh(xEdges, yEdges, zEdges, sampleField);
  const mesh = smooth.mesh;
  const { solidVolume, sliceMask } = estimateSolidVolumeFromFieldGrid(xEdges, yEdges, zEdges, smooth.values);
  const totalVolume = params.width * params.length * params.thickness;
  const porosity = clamp(1 - solidVolume / Math.max(totalVolume, 1), 0, 0.98);
  const massGram = solidVolume * 0.00124;

  const warnings = [];
  if (params.wall < 0.8) {
    warnings.push("骨格厚がかなり細いです。gyroid の連続性は保てても実機では欠けやすくなります。");
  }
  if (params.cell > params.thickness * 0.95) {
    warnings.push("セル径が厚みに対して大きめです。3D スポンジというより上下に抜ける大孔寄りになります。");
  }
  if (porosity > 0.84) {
    warnings.push("空隙率がかなり高く、軽い代わりに上面支持が弱めです。セル径を下げるか骨格を太くしてください。");
  }
  if (params.zStretch > 1.45) {
    warnings.push("厚み方向の伸長が大きく、上下の連通は増えますが中間層の密度ムラも強くなります。");
  }
  if (effectiveBasePlate > 0 && effectiveBasePlate < 0.6) {
    warnings.push("ベースプレートが薄めです。初期層の定着には 0.8 mm 以上を推奨します。");
  }
  if (!warnings.length) {
    warnings.push("この案は水路も空路も 3D で連続しやすく、スポンジ的な母材を試したい時の比較対象として有効です。");
  }

  return {
    mode: "gyroid",
    params,
    resolution,
    mesh,
    sliceMask,
    xEdges,
    yEdges,
    meshInfoText: `${mesh.triangleCount.toLocaleString()} tris / watertight voxel surface / XY ${formatValue(resolution, 2)} mm / Z ${formatValue(zResolution, 2)} mm`,
    metricCards: [
      { label: "基本セル径", value: `${formatValue(params.cell, 1)} mm` },
      { label: "骨格厚み目標", value: `${formatValue(params.wall, 2)} mm` },
      { label: "ベースプレート", value: effectiveBasePlate > 0 ? `${formatValue(effectiveBasePlate, 1)} mm` : "なし" },
      { label: "厚み方向伸長", value: `${formatValue(params.zStretch, 2)} x` },
      { label: "中央断面充填率", value: `${formatValue((sliceMask.reduce((sum, cell) => sum + cell, 0) / sliceMask.length) * 100, 1)} %` },
      { label: "実空隙率", value: `${formatValue(porosity * 100, 1)} %` },
      { label: "概算質量", value: `${formatValue(massGram, 1)} g` },
    ],
    warnings,
  };
}

function buildMatDesign(inputParams) {
  const params = {
    width: clamp(inputParams.width, 0, 220),
    length: clamp(inputParams.length, 0, 220),
    thickness: clamp(inputParams.thickness, 0, 8),
    capillary: clamp(inputParams.capillary, 0, 2.4),
    wall: clamp(inputParams.wall, 0, 2.2),
    xSpacing: clamp(inputParams.xSpacing, 0, 16),
    ySpacing: clamp(inputParams.ySpacing, 0, 16),
    frame: clamp(inputParams.frame, 0, Math.min(inputParams.width, inputParams.length) * 0.24),
    dimple: Boolean(inputParams.dimple),
    dimpleDepth: clamp(inputParams.dimpleDepth, 0, 1.2),
  };

  const resolution = estimateMatResolution(params);
  const xAxis = buildChannelAxis(params.width, params.frame, params.capillary, params.wall, params.xSpacing);
  const yAxis = buildChannelAxis(params.length, params.frame, params.capillary, params.wall, params.ySpacing);
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
    meshInfoText: `${mesh.triangleCount.toLocaleString()} tris / XY exact / Z ${formatValue(zStep, 2)} mm`,
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
    width: clamp(inputParams.width, 0, 220),
    length: clamp(inputParams.length, 0, 220),
    thickness: clamp(inputParams.thickness, 0, 18),
    frame: clamp(inputParams.frame, 0, Math.min(inputParams.width, inputParams.length) * 0.24),
    pore: clamp(inputParams.pore, 0, 12),
    rib: clamp(inputParams.rib, 0, 1.8),
    layers: Math.round(clamp(inputParams.layers, 0, 7)),
    stagger: clamp(inputParams.stagger, 0, 0.9),
    wickWidth: clamp(inputParams.wickWidth, 0, 2.2),
    wickPitch: clamp(inputParams.wickPitch, 0, 26),
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

  dom.meshInfo.textContent =
    design.meshInfoText ||
    `${design.mesh.triangleCount.toLocaleString()} tris / ${formatValue(design.resolution, 2)} mm vox`;
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
  state.geometry = geometry;
  matMesh.geometry = geometry;

  const edgeGeometry =
    design.mesh.positions.length >= 9 ? new THREE.EdgesGeometry(geometry, 26) : new THREE.BufferGeometry();
  state.edgeGeometry = edgeGeometry;
  edgeLines.geometry = edgeGeometry;

  let radius = 80;
  if (design.mesh.positions.length >= 9) {
    geometry.computeBoundingSphere();
    if (geometry.boundingSphere && Number.isFinite(geometry.boundingSphere.radius)) {
      radius = geometry.boundingSphere.radius;
    }
  }
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

function drawDimensionStamp(ctx, dpr, text) {
  ctx.fillStyle = "rgba(22, 48, 32, 0.74)";
  ctx.font = `${12 * dpr}px IBM Plex Sans JP`;
  ctx.fillText(text, 8 * dpr, 18 * dpr);
}

function drawChannelPlan(design) {
  const { canvas, ctx, dpr } = prepareCanvas();
  const pad = 28 * dpr;
  const scale = Math.min(
    (canvas.width - pad * 2) / design.params.width,
    (canvas.height - pad * 2) / design.params.length
  );

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate((canvas.width - design.params.width * scale) * 0.5, (canvas.height - design.params.length * scale) * 0.5);

  ctx.fillStyle = "#3e8b58";
  ctx.fillRect(0, 0, design.params.width * scale, design.params.length * scale);

  ctx.strokeStyle = "rgba(148, 231, 176, 0.96)";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const segment of design.segments) {
    ctx.beginPath();
    ctx.lineWidth = Math.max(1.5, segment.radius * 2 * scale);
    ctx.moveTo(segment.x1 * scale, segment.y1 * scale);
    ctx.lineTo(segment.x2 * scale, segment.y2 * scale);
    ctx.stroke();
  }

  if (design.dimpleCenters.length) {
    ctx.fillStyle = "rgba(242, 249, 193, 0.72)";
    for (const center of design.dimpleCenters) {
      ctx.beginPath();
      ctx.arc(center.x * scale, center.y * scale, Math.max(1.5, design.dimpleRadius * scale), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = "rgba(20, 50, 30, 0.35)";
  ctx.lineWidth = Math.max(1, dpr);
  ctx.strokeRect(0, 0, design.params.width * scale, design.params.length * scale);
  drawDimensionStamp(
    ctx,
    dpr,
    `${formatValue(design.params.width, 0)} × ${formatValue(design.params.length, 0)} mm`
  );
  ctx.restore();
}

function drawPillarPlan(design) {
  const { canvas, ctx, dpr } = prepareCanvas();
  const pad = 28 * dpr;
  const scale = Math.min(
    (canvas.width - pad * 2) / design.params.width,
    (canvas.height - pad * 2) / design.params.length
  );

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate((canvas.width - design.params.width * scale) * 0.5, (canvas.height - design.params.length * scale) * 0.5);

  ctx.fillStyle = "#3e8b58";
  ctx.fillRect(0, 0, design.params.width * scale, design.params.length * scale);

  if (design.tunnelSegments.length) {
    ctx.strokeStyle = "rgba(242, 249, 193, 0.82)";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const segment of design.tunnelSegments) {
      ctx.beginPath();
      ctx.lineWidth = Math.max(1.2, segment.radius * 2 * scale);
      ctx.moveTo(segment.x1 * scale, segment.y1 * scale);
      ctx.lineTo(segment.x2 * scale, segment.y2 * scale);
      ctx.stroke();
    }
  }

  ctx.fillStyle = "rgba(242, 249, 193, 0.74)";
  for (const center of design.pillarCenters) {
    ctx.beginPath();
    ctx.arc(center.x * scale, center.y * scale, Math.max(1.5, design.cupRadius * scale), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(148, 231, 176, 0.98)";
  for (const center of design.pillarCenters) {
    ctx.beginPath();
    ctx.arc(center.x * scale, center.y * scale, Math.max(1.2, design.capillaryRadius * scale), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(20, 50, 30, 0.35)";
  ctx.lineWidth = Math.max(1, dpr);
  ctx.strokeRect(0, 0, design.params.width * scale, design.params.length * scale);
  drawDimensionStamp(
    ctx,
    dpr,
    `${formatValue(design.params.width, 0)} × ${formatValue(design.params.length, 0)} mm`
  );
  ctx.restore();
}

function drawGyroidPlan(design) {
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

  const nx = design.xEdges.length - 1;
  const ny = design.yEdges.length - 1;
  for (let iy = 0; iy < ny; iy += 1) {
    const y1 = design.yEdges[iy] * scale;
    const y2 = design.yEdges[iy + 1] * scale;
    for (let ix = 0; ix < nx; ix += 1) {
      if (!design.sliceMask[ix + iy * nx]) {
        continue;
      }
      const x1 = design.xEdges[ix] * scale;
      const x2 = design.xEdges[ix + 1] * scale;
      ctx.fillRect(x1, y1, Math.max(1, x2 - x1), Math.max(1, y2 - y1));
    }
  }

  ctx.strokeStyle = "rgba(20, 50, 30, 0.35)";
  ctx.lineWidth = Math.max(1, dpr);
  ctx.strokeRect(0, 0, design.params.width * scale, design.params.length * scale);
  drawDimensionStamp(
    ctx,
    dpr,
    `${formatValue(design.params.width, 0)} × ${formatValue(design.params.length, 0)} mm / mid slice`
  );
  ctx.restore();
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
  fillIntervals(ctx, design.xAxis.slotIntervals, design.params.length, design.params.length, scale, "rgba(148, 231, 176, 0.95)", true);
  fillIntervals(ctx, design.yAxis.slotIntervals, design.params.width, design.params.width, scale, "rgba(148, 231, 176, 0.95)", false);

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

  drawDimensionStamp(
    ctx,
    dpr,
    `${formatValue(design.params.width, 0)} × ${formatValue(design.params.length, 0)} mm`
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

  drawDimensionStamp(
    ctx,
    dpr,
    `${formatValue(design.params.width, 0)} × ${formatValue(design.params.length, 0)} mm / ${design.params.layers} layers`
  );
  ctx.restore();
}

function drawPlan(design) {
  const model = MODELS[design.modeId] || getModel();
  model.drawPlan(design);
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

async function renderAll(statusMessage = "") {
  if (state.isRendering) {
    return state.renderPromise;
  }

  state.isRendering = true;
  setLoading(true);
  state.renderPromise = (async () => {
    await nextPaint();
    const design = getModel().buildDesign(getActiveParams());
    design.modeId = state.mode;
    state.currentDesign = design;
    state.renderedMode = state.mode;
    state.paramsByMode[state.mode] = { ...design.params };
    syncControls();
    setDependentControlStates();
    updateMetrics(design);
    updateGeometry(design);
    drawPlan(design);
    window.history.replaceState(null, "", toHash());
    clearDirty(state.mode);
    if (statusMessage) {
      dom.actionStatus.textContent = statusMessage;
    }
    return design;
  })();

  try {
    return await state.renderPromise;
  } finally {
    state.renderPromise = null;
    state.isRendering = false;
    setLoading(false);
  }
}

async function ensureCurrentDesign(statusMessage = "") {
  if (!state.currentDesign || state.renderedMode !== state.mode || currentModeHasPendingChanges()) {
    return renderAll(statusMessage);
  }
  if (statusMessage) {
    dom.actionStatus.textContent = statusMessage;
  }
  return state.currentDesign;
}

function exportStl(design) {
  const positions = design.mesh.positions;
  const faceNormals = design.mesh.faceNormals;
  const triangleCount = faceNormals.length / 3;
  const bufferSize = 84 + triangleCount * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);
  const header = "binary STL – Capillary Mat Lab";
  for (let i = 0; i < 80; i += 1) {
    view.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
  }
  view.setUint32(80, triangleCount, true);
  let offset = 84;
  for (let tri = 0; tri < triangleCount; tri += 1) {
    view.setFloat32(offset, faceNormals[tri * 3], true);
    view.setFloat32(offset + 4, faceNormals[tri * 3 + 1], true);
    view.setFloat32(offset + 8, faceNormals[tri * 3 + 2], true);
    offset += 12;
    for (let v = 0; v < 3; v += 1) {
      const base = tri * 9 + v * 3;
      view.setFloat32(offset, positions[base], true);
      view.setFloat32(offset + 4, positions[base + 1], true);
      view.setFloat32(offset + 8, positions[base + 2], true);
      offset += 12;
    }
    view.setUint16(offset, 0, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "model/stl" });
}

async function downloadCurrentStl() {
  const design = await ensureCurrentDesign();
  if (!design) {
    return;
  }
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
  await ensureCurrentDesign();
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

dom.updatePreviewBtn.addEventListener("click", () => {
  void renderAll("プレビューを更新しました。");
});
dom.downloadBtn.addEventListener("click", downloadCurrentStl);
dom.copyLinkBtn.addEventListener("click", copyShareUrl);
dom.resetBtn.addEventListener("click", () => {
  state.paramsByMode[state.mode] = { ...getModel().defaults };
  syncControls();
  setDependentControlStates();
  void renderAll("既定値に戻しました。");
});

window.addEventListener("resize", resizeViewer);

const initialFromHash = fromHash();
if (initialFromHash) {
  state.mode = initialFromHash.mode;
  state.paramsByMode[state.mode] = { ...state.paramsByMode[state.mode], ...initialFromHash.params };
}

initRenderer();
renderModeUi();
updateActionButtons();
void renderAll();
resizeViewer();
animate();
