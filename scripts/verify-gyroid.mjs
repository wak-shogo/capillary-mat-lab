/**
 * Tiny gyroid + base plate → same pipeline as app buildSmoothFieldMesh (voxel occupancy + buildVoxelMesh).
 * Checks directed-edge pairing (closed surface). Optional trimesh.is_watertight after merge_vertices
 * may be false on coarse voxels (edge-only solid contacts); finer resolution reduces that.
 * Run: npm run verify:gyroid  or  node scripts/verify-gyroid.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildEdges(span, resolution) {
  const count = Math.max(1, Math.ceil(span / resolution));
  const edges = new Float32Array(count + 1);
  for (let index = 0; index <= count; index += 1) {
    edges[index] = Math.min(index * resolution, span);
  }
  return edges;
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
          pushQuad(positions, normals, faceNormals, [[x1, y1, z2], [x2, y1, z2], [x2, y2, z2], [x1, y2, z2]], [0, 0, 1]);
        }
        if (!solidAt(ix, iy, iz - 1)) {
          pushQuad(positions, normals, faceNormals, [[x1, y1, z1], [x1, y2, z1], [x2, y2, z1], [x2, y1, z1]], [0, 0, -1]);
        }
        if (!solidAt(ix + 1, iy, iz)) {
          pushQuad(positions, normals, faceNormals, [[x2, y1, z1], [x2, y2, z1], [x2, y2, z2], [x2, y1, z2]], [1, 0, 0]);
        }
        if (!solidAt(ix - 1, iy, iz)) {
          pushQuad(positions, normals, faceNormals, [[x1, y1, z1], [x1, y1, z2], [x1, y2, z2], [x1, y2, z1]], [-1, 0, 0]);
        }
        if (!solidAt(ix, iy + 1, iz)) {
          pushQuad(positions, normals, faceNormals, [[x1, y2, z1], [x1, y2, z2], [x2, y2, z2], [x2, y2, z1]], [0, 1, 0]);
        }
        if (!solidAt(ix, iy - 1, iz)) {
          pushQuad(positions, normals, faceNormals, [[x1, y1, z1], [x2, y1, z1], [x2, y1, z2], [x1, y1, z2]], [0, -1, 0]);
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

function sdBoxCentered(px, py, pz, hx, hy, hz) {
  const qx = Math.abs(px) - hx;
  const qy = Math.abs(py) - hy;
  const qz = Math.abs(pz) - hz;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  const oz = Math.max(qz, 0);
  return Math.hypot(ox, oy, oz) + Math.min(Math.max(qx, qy, qz), 0);
}

function edgeKey(p, q) {
  const fmt = (v) => (Math.round(v * 1e6) / 1e6).toFixed(6);
  return `${fmt(p[0])},${fmt(p[1])},${fmt(p[2])}|${fmt(q[0])},${fmt(q[1])},${fmt(q[2])}`;
}

function validateClosedManifold(positions, triangleCount) {
  const counts = new Map();
  for (let t = 0; t < triangleCount; t += 1) {
    const o = t * 9;
    const v0 = [positions[o], positions[o + 1], positions[o + 2]];
    const v1 = [positions[o + 3], positions[o + 4], positions[o + 5]];
    const v2 = [positions[o + 6], positions[o + 7], positions[o + 8]];
    for (const [a, b] of [
      [v0, v1],
      [v1, v2],
      [v2, v0],
    ]) {
      const k = edgeKey(a, b);
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  }
  let bad = 0;
  for (const [k, c] of counts) {
    const parts = k.split("|");
    if (parts.length !== 2) {
      continue;
    }
    const rev = `${parts[1]}|${parts[0]}`;
    if (c !== (counts.get(rev) || 0)) {
      bad += 1;
    }
  }
  return { ok: bad === 0, badPairs: bad, directedEdges: counts.size };
}

function buildTinyGyroidVoxelMesh() {
  const params = {
    width: 36,
    length: 36,
    thickness: 7,
    frame: 3,
    basePlate: 1.2,
    cell: 5.5,
    wall: 1,
    zStretch: 1,
  };
  const resolution = 0.55;
  const zResolution = 0.45;
  const xEdges = buildEdges(params.width, resolution);
  const yEdges = buildEdges(params.length, resolution);
  const zEdges = buildEdges(params.thickness, zResolution);
  const nx = xEdges.length - 1;
  const ny = yEdges.length - 1;
  const nz = zEdges.length - 1;
  const ax = (Math.PI * 2) / params.cell;
  const ay = (Math.PI * 2) / params.cell;
  const az = (Math.PI * 2) / Math.max(params.cell * params.zStretch, 0.1);
  const threshold = clamp((params.wall / params.cell) * 1.95, 0.14, 0.62);
  const halfWidth = params.width * 0.5;
  const halfLength = params.length * 0.5;
  const halfThickness = params.thickness * 0.5;
  const effectiveBasePlate = Math.min(params.basePlate, params.thickness * 0.45);

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
    const interiorField = effectiveBasePlate > 0 ? Math.min(gyroidRaw, plateSdf) : gyroidRaw;
    return Math.max(boxField, Math.min(frameField, interiorField));
  };

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
  return buildVoxelMesh(xEdges, yEdges, zEdges, occupancy);
}

function writeBinaryStl(mesh, outPath) {
  const { positions, faceNormals } = mesh;
  const triangleCount = faceNormals.length / 3;
  const buffer = new ArrayBuffer(84 + triangleCount * 50);
  const view = new DataView(buffer);
  const header = "verify gyroid voxel";
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
  fs.writeFileSync(outPath, Buffer.from(buffer));
}

const mesh = buildTinyGyroidVoxelMesh();
const { ok, badPairs, directedEdges } = validateClosedManifold(mesh.positions, mesh.triangleCount);
const outStl = path.join(__dirname, "verify-gyroid-tiny.stl");
writeBinaryStl(mesh, outStl);

if (!ok) {
  console.error("FAIL: directed edge pairing", { badPairs, directedEdges, triangles: mesh.triangleCount });
  process.exit(1);
}

console.log("OK: closed voxel shell (directed edge pairing)", {
  triangles: mesh.triangleCount,
  uniqueDirectedEdges: directedEdges,
  stl: outStl,
});

try {
  const { execSync } = await import("child_process");
  const escaped = outStl.replace(/\\/g, "\\\\");
  const py = execSync(
    `python3 -c "import trimesh;m=trimesh.load(r'${escaped}');m.merge_vertices();print('trimesh_watertight',m.is_watertight,'volume',abs(m.volume))"`,
    { encoding: "utf8" }
  );
  const line = py.trim();
  console.log(line);
  if (line.includes("trimesh_watertight False")) {
    console.log(
      "(note) merge_vertices can show non-manifold edges on coarse gyroid voxels; try finer resolution in this script if you need trimesh-clean topology."
    );
  }
} catch {
  console.log("(optional) pip install trimesh for is_watertight cross-check");
}
