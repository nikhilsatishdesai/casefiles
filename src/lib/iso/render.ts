import { HW, HH, unIso, rgbOf, mix, rgba, hash2, wallArt } from "./core";
import { bayer } from "@/lib/scenes/primitives";
import { drawPixelText, measurePixelText } from "@/lib/scenes/pixelfont";
import type { FloorKind, IsoLight, IsoTemplate, WallDecor, WallKind } from "./types";

/**
 * Bakes an iso room into one lit pixel-art canvas: floor materials, the two
 * back walls, their decor, colored light pools (dither-quantized), and the
 * cut-away slab edge that makes every room read as a little diorama.
 */

export const SLAB = 10;
const PAD = 28;

export interface Baked {
  canvas: HTMLCanvasElement;
  /** screen position of tile (0,0)'s top corner inside the canvas */
  ox: number;
  oy: number;
  wallH: number;
  /** glass on the walls, as screen polygons (rain & lightning show through) */
  windows: [number, number][][];
  /** emissive points on the walls, for bloom sprites */
  glows: { x: number; y: number; color: string; r: number }[];
  lights: IsoLight[];
  /** room size in tiles */
  size: [number, number];
  /** each wall decor's screen quad, by decor index */
  decorPolys: [number, number][][];
}

type RGB = [number, number, number];

export type Lighter = (c: RGB, u: number, v: number, z: number, px: number, py: number) => RGB;

/**
 * The room's light, as a function: a color at tile-space (u, v) and height z
 * (in tiles) comes back lit by every source in reach — falloff quantized
 * through a Bayer matrix so light pools step like hand-dithered shading.
 */
export function makeLighter(ambient: string, lights: IsoLight[]): Lighter {
  const L = lights.map((l) => {
    const [r, g, b] = rgbOf(l.color);
    return { x: l.x, y: l.y, z: (l.z ?? 30) / 16, r: r / 255, g: g / 255, b: b / 255, rad: l.radius, k: l.intensity };
  });
  // ambient is a floor, not a ceiling: lift it so shadows stay colored rather than black
  const [ar, ag, ab] = rgbOf(ambient).map((c) => Math.min(1, (c / 255) * 1.3 + 0.03));
  return (c, x, y, z, px, py) => {
    let mr = ar;
    let mg = ag;
    let mb = ab;
    const th = bayer(px, py);
    for (const l of L) {
      const dist = Math.hypot(l.x - x, l.y - y, (l.z - z) * 0.3);
      if (dist >= l.rad) continue;
      let f = Math.pow(1 - dist / l.rad, 1.5) * l.k;
      f = Math.floor(f * 10 + th) / 10;
      mr += l.r * f * 1.8;
      mg += l.g * f * 1.8;
      mb += l.b * f * 1.8;
    }
    return [c[0] * mr, c[1] * mg, c[2] * mb];
  };
}

/** Light a prop's diffuse art in place in the room (props never move, so this is baked once). */
export function litProp(
  art: { diffuse: HTMLCanvasElement; ax: number; ay: number },
  p: { x: number; y: number; w?: number; d?: number },
  b: Baked,
  lit: Lighter
): HTMLCanvasElement {
  const src = art.diffuse;
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const sctx = src.getContext("2d", { willReadFrequently: true })!;
  const img = sctx.getImageData(0, 0, src.width, src.height);
  const d = img.data;
  const w = p.w ?? 1;
  const dd = p.d ?? 1;
  // where the footprint's top corner and center land in the baked canvas
  const fx = b.ox + (p.x - p.y) * HW;
  const fy = b.oy + (p.x + p.y) * HH;
  const cy = b.oy + (p.x + w / 2 + p.y + dd / 2) * HH;
  for (let py = 0; py < src.height; py++) {
    for (let px = 0; px < src.width; px++) {
      const o = (py * src.width + px) * 4;
      if (d[o + 3] === 0) continue;
      const X = fx - art.ax + px;
      const Y = fy - art.ay + py;
      const [u, v] = unIso(X + 0.5 - b.ox, cy - b.oy);
      const z = Math.max(0, cy - Y) / 16;
      const c = lit([d[o], d[o + 1], d[o + 2]], u, v, z, X, Y);
      d[o] = clamp(c[0]);
      d[o + 1] = clamp(c[1]);
      d[o + 2] = clamp(c[2]);
    }
  }
  out.getContext("2d")!.putImageData(img, 0, 0);
  return out;
}

const FLOOR_BASE: Record<FloorKind, string> = {
  wood: "#7a4a2c",
  parquet: "#8a5430",
  tile: "#5a8a96",
  checker: "#1c7a78",
  carpet: "#6a1c3e",
  rug: "#8a1e3a",
  marble: "#9a98b4",
  linoleum: "#3e6a58",
  concrete: "#5c5a66",
  asphalt: "#2e2c3a",
  cobble: "#4e4a5c",
  grass: "#2e6a3a",
  planks: "#6a4a32",
  stone: "#5e5a6e",
  water: "#0e2a4a",
  rail: "#3a3440",
};

const WALL_BASE: Record<WallKind, string> = {
  plaster: "#4a3e6a",
  brick: "#7a3a34",
  wood: "#5a3422",
  tile: "#6a9aa8",
  glass: "#16204a",
  metal: "#3e4a5e",
  stone: "#5a5468",
  panel: "#5a2a3a",
};

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

function floorPixel(kind: FloorKind, base: RGB, u: number, v: number, px: number, py: number): RGB {
  const tx = Math.floor(u);
  const ty = Math.floor(v);
  const fu = u - tx;
  const fv = v - ty;
  const n = hash2(tx, ty, 7);
  let k = 0.94 + n * 0.12;
  let [r, g, b] = base;
  switch (kind) {
    case "wood":
    case "parquet": {
      if (kind === "parquet") {
        const block = (Math.floor(u * 2) + Math.floor(v * 2)) & 1;
        const along = block ? u * 2 : v * 2;
        const across = block ? v * 2 : u * 2;
        if (across - Math.floor(across) < 0.07 || along - Math.floor(along) < 0.05) k *= 0.62;
        else k *= 0.9 + hash2(Math.floor(u * 2), Math.floor(v * 2), 3) * 0.2 + (Math.floor(along * 6) & 1 ? 0.03 : 0);
      } else {
        const plank = Math.floor(v * 4);
        const fv4 = v * 4 - plank;
        const joint = (u + hash2(plank, 1, 9) * 3) % 1.5;
        if (fv4 < 0.12) k *= 0.58;
        else if (joint < 0.03) k *= 0.66;
        else k *= 0.86 + hash2(plank, Math.floor((u + hash2(plank, 1, 9) * 3) / 1.5), 2) * 0.26 + (((px + py * 3) % 7) === 0 ? 0.06 : 0);
      }
      break;
    }
    case "checker": {
      const c = (Math.floor(u * 2) + Math.floor(v * 2)) & 1;
      const gu = (u * 2) % 1;
      const gv = (v * 2) % 1;
      if (gu < 0.05 || gv < 0.05) {
        r = r * 0.35;
        g = g * 0.35;
        b = b * 0.4;
      } else if (c) {
        r = 18;
        g = 16;
        b = 30;
      } else {
        k *= 1.05;
      }
      // a glossy streak on each tile
      if (!c && gu > 0.55 && gu < 0.62 && gv > 0.2 && gv < 0.8) k *= 1.25;
      break;
    }
    case "tile":
    case "linoleum": {
      const s = kind === "tile" ? 2 : 1;
      const gu = (u * s) % 1;
      const gv = (v * s) % 1;
      if (gu < 0.05 || gv < 0.05) k *= kind === "tile" ? 0.6 : 0.75;
      else if (kind === "linoleum") k *= ((Math.floor(u) + Math.floor(v)) & 1 ? 0.88 : 1.04) + (hash2(px, py, 4) < 0.05 ? 0.1 : 0);
      break;
    }
    case "carpet":
    case "rug": {
      const motif = (Math.floor(u * 3) + Math.floor(v * 3)) % 3 === 0 && fu > 0.2 && fv > 0.2;
      k *= motif ? 1.18 : 0.92 + hash2(px, py, 5) * 0.12;
      break;
    }
    case "marble": {
      const vein = Math.abs(Math.sin(u * 5.3 + v * 2.1 + Math.sin(v * 7 + u * 1.7) * 1.4));
      if (vein < 0.07) k *= 0.72;
      else k *= 1 + (hash2(px, py, 6) - 0.5) * 0.06;
      if (fu < 0.03 || fv < 0.03) k *= 0.82;
      break;
    }
    case "concrete": {
      const sp = hash2(px, py, 8);
      k *= sp < 0.08 ? 0.8 : sp > 0.96 ? 1.18 : 1;
      if (Math.abs(fu - 0.5) < 0.015 && hash2(tx, ty, 11) < 0.3) k *= 0.7;
      break;
    }
    case "asphalt": {
      const sp = hash2(px, py, 12);
      k *= sp < 0.1 ? 1.25 : sp > 0.97 ? 1.5 : 0.95;
      break;
    }
    case "cobble": {
      const cu = (u * 4) % 1;
      const cv = (v * 4) % 1;
      const ring = Math.max(Math.abs(cu - 0.5), Math.abs(cv - 0.5));
      if (ring > 0.4) k *= 0.45;
      else k *= 0.9 + hash2(Math.floor(u * 4), Math.floor(v * 4), 13) * 0.24 + (cu < 0.35 && cv < 0.35 ? 0.1 : 0);
      break;
    }
    case "grass": {
      const sp = hash2(px, py, 14);
      k *= sp < 0.18 ? 1.3 : sp > 0.9 ? 0.75 : 1;
      break;
    }
    case "planks": {
      const plank = Math.floor(u * 3);
      const fu3 = u * 3 - plank;
      if (fu3 < 0.1) k *= 0.35;
      else k *= 0.84 + hash2(plank, ty, 15) * 0.3 - (fu3 > 0.85 ? 0.08 : 0);
      if (Math.abs(fv - 0.5) < 0.04 && fu3 > 0.4 && fu3 < 0.5) k *= 1.5; // nail heads
      break;
    }
    case "stone": {
      const row = Math.floor(v * 2);
      const cu = (u * 2 + (row & 1) * 0.5) % 1;
      const cv = (v * 2) % 1;
      if (cu < 0.06 || cv < 0.07) k *= 0.55;
      else k *= 0.88 + hash2(Math.floor(u * 2 + (row & 1) * 0.5), row, 16) * 0.24;
      break;
    }
    case "water": {
      const wave = Math.sin(u * 3.1 + v * 1.3 + Math.sin(v * 2.3) * 2);
      k *= wave > 0.92 ? 1.6 : wave > 0.7 ? 1.18 : 0.88 + hash2(px, py, 17) * 0.08;
      break;
    }
    case "rail": {
      const rv = fv;
      if (Math.abs(rv - 0.25) < 0.05 || Math.abs(rv - 0.75) < 0.05) {
        r = 150;
        g = 150;
        b = 170;
      } else if ((u * 3) % 1 < 0.28) {
        r = 70;
        g = 46;
        b = 30;
      } else k *= 0.7;
      break;
    }
  }
  return [r * k, g * k, b * k];
}

/** set by wallPixel when a pixel glows on its own (city lights through glass) */
let wallGlow = 0;

function wallPixel(kind: WallKind, base: RGB, u: number, v: number, wallH: number, px: number): RGB {
  wallGlow = 0;
  // u: px along the wall from the back corner; v: px above the floor
  let [r, g, b] = base;
  let k = 1;
  const dado = 30;
  if (v < 5) return [r * 0.45, g * 0.42, b * 0.5]; // skirting
  if (v < 6) return [r * 1.25, g * 1.2, b * 1.25];
  if (v > wallH - 4) return v > wallH - 2 ? [r * 0.35, g * 0.32, b * 0.42] : [r * 1.45, g * 1.4, b * 1.45]; // the cut top
  switch (kind) {
    case "plaster":
      if (v > dado - 1 && v < dado + 2) k = v === dado ? 1.35 : 0.7;
      else if (v < dado) k = 0.78 + ((Math.floor(u / 6) & 1) ? 0 : 0.05);
      else k = 0.95 + ((Math.floor(u / 4) + Math.floor(v / 6)) % 5 === 0 ? 0.12 : 0) + hash2(px, v, 21) * 0.05;
      break;
    case "panel":
      if (v < dado + 10) {
        const pu = u % 12;
        k = pu < 1 ? 0.6 : pu < 2 ? 1.3 : v % 20 < 1 ? 0.7 : 0.92;
        r = r * 0.8 + 40 * 0.2;
      } else {
        k = 1 + (((Math.floor(u / 3) + Math.floor(v / 5)) & 3) === 0 ? 0.14 : 0);
      }
      if (v > dado + 9 && v < dado + 12) k = 1.4;
      break;
    case "brick": {
      const course = Math.floor(v / 4);
      const joint = (u + (course & 1) * 4) % 8;
      if (v % 4 === 0 || joint < 1) k = 0.42;
      else k = 0.82 + hash2(Math.floor((u + (course & 1) * 4) / 8), course, 22) * 0.34;
      break;
    }
    case "wood":
      k = u % 6 < 1 ? 0.6 : 0.85 + hash2(Math.floor(u / 6), Math.floor(v / 9), 23) * 0.25 + (v % 9 === 0 ? -0.1 : 0);
      break;
    case "tile":
      k = u % 8 < 1 || v % 8 < 1 ? 0.7 : 1 + (u % 8 === 2 && v % 8 > 2 && v % 8 < 6 ? 0.18 : 0);
      break;
    case "metal":
      k = u % 3 === 0 ? 1.25 : u % 3 === 1 ? 0.9 : 0.72;
      if (v % 24 < 1) k = 0.5;
      break;
    case "stone": {
      const row = Math.floor(v / 8);
      const cu = (u + (row & 1) * 6) % 12;
      k = v % 8 < 1 || cu < 1 ? 0.5 : 0.86 + hash2(Math.floor((u + (row & 1) * 6) / 12), row, 24) * 0.24;
      break;
    }
    case "glass": {
      u = Math.floor(u);
      if (u % 16 < 2 || v < 8) {
        r = 26;
        g = 24;
        b = 40;
      } else {
        // the night city, seen through floor-to-ceiling glass
        const tower = hash2(Math.floor(u / 5), 0, 25);
        const roof = 18 + tower * (wallH - 28);
        if (v < roof) {
          const lit = hash2(Math.floor(u / 2), Math.floor(v / 3), 26);
          if (u % 2 === 0 && v % 3 === 1 && lit < 0.28) {
            const c = lit < 0.08 ? [255, 70, 160] : lit < 0.14 ? [80, 230, 255] : [255, 196, 107];
            wallGlow = 1;
            return c as RGB;
          }
          r = 22;
          g = 22;
          b = 50;
          wallGlow = 0.5;
        } else {
          // the sky over the city, still lit from below
          const t = (v - roof) / (wallH - roof);
          r = 70 - t * 30;
          g = 34 - t * 10;
          b = 104 - t * 40;
          wallGlow = 0.85;
        }
      }
      break;
    }
  }
  return [r * k, g * k, b * k];
}

export function bakeBackground(t: IsoTemplate, occluders: { x: number; y: number; w?: number; d?: number; solid?: boolean }[] = []): Baked {
  const hasWalls = !!(t.wallLeft || t.wallRight);
  const wallH = hasWalls ? (t.wallH ?? 84) : 0;
  const width = (t.w + t.h) * HW + PAD * 2;
  const height = (t.w + t.h) * HH + wallH + PAD * 2 + SLAB;
  const ox = t.h * HW + PAD;
  const oy = wallH + PAD;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;

  // neon on the walls lights the room too
  const lights: IsoLight[] = [...t.lights];
  for (const d of t.decor) {
    if (d.kind === "neon" || d.kind === "monitor") {
      const along = d.at + (d.span ?? 1) / 2;
      lights.push({
        x: d.wall === "left" ? 0.3 : along,
        y: d.wall === "left" ? along : 0.3,
        z: d.v ?? 54,
        color: d.color ?? "#ff2e88",
        radius: d.kind === "neon" ? 4.2 : 2.6,
        intensity: d.kind === "neon" ? 0.85 : 0.5,
      });
    }
  }
  const lit = makeLighter(t.ambient, lights);

  const floorBase = rgbOf(t.floorColor ?? FLOOR_BASE[t.floor]);
  const zoneBase = (t.zones ?? []).map((z) => rgbOf(z.color ?? FLOOR_BASE[z.kind]));
  const wallBaseL = t.wallLeft ? rgbOf(t.wallColor ?? WALL_BASE[t.wallLeft]) : null;
  const wallBaseR = t.wallRight ? rgbOf(t.wallColor ?? WALL_BASE[t.wallRight]) : null;
  const slabC = rgbOf(t.outdoor ? "#2a2236" : "#1c1628");

  const img = ctx.createImageData(width, height);
  const d = img.data;
  const occ0 = occluders
    .filter((o) => o.solid !== false)
    .map((o) => ({ x0: o.x + 0.05, y0: o.y + 0.05, x1: o.x + (o.w ?? 1) - 0.05, y1: o.y + (o.d ?? 1) - 0.05 }));

  // back corner x and the floor's front outline (for the slab)
  const Lx = ox - t.h * HW;
  const Ly = oy + t.h * HH;
  const Bx = ox + (t.w - t.h) * HW;
  const By = oy + (t.w + t.h) * HH;
  const Rx = ox + t.w * HW;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const cx = px + 0.5;
      const cy = py + 0.5;
      const [u, v] = unIso(cx - ox, cy - oy);
      let col: RGB | null = null;
      if (u >= 0 && v >= 0 && u < t.w && v < t.h) {
        let base = floorBase;
        let kind = t.floor;
        const zs = t.zones ?? [];
        for (let i = zs.length - 1; i >= 0; i--) {
          const z = zs[i];
          if (u >= z.x && v >= z.y && u < z.x + z.w && v < z.y + z.h) {
            kind = z.kind;
            base = zoneBase[i];
            if (kind === "rug") {
              const edge = Math.min(u - z.x, v - z.y, z.x + z.w - u, z.y + z.h - v);
              if (edge < 0.14) base = [base[0] * 0.5 + 110, base[1] * 0.5 + 80, base[2] * 0.5 + 30];
              else if (edge < 0.2) base = [base[0] * 0.4, base[1] * 0.4, base[2] * 0.4];
            }
            break;
          }
        }
        col = floorPixel(kind, base, u, v, px, py);
        // contact shadows pooling under the furniture, dithered
        let occ = 0;
        for (const o of occ0) {
          const dx = Math.max(o.x0 - u, 0, u - o.x1);
          const dy = Math.max(o.y0 - v, 0, v - o.y1);
          const dist = Math.hypot(dx, dy);
          if (dist < 0.4) occ = Math.max(occ, (1 - dist / 0.4) * 0.6);
        }
        if (occ > 0) {
          const q = Math.floor(occ * 4 + bayer(px, py)) / 4;
          col = [col[0] * (1 - q * 0.75), col[1] * (1 - q * 0.75), col[2] * (1 - q * 0.65)];
        }
        // contact shadow along the back walls
        if (hasWalls) {
          const near = Math.min(t.wallLeft ? u : 9, t.wallRight ? v : 9);
          if (near < 0.5) col = [col[0] * (0.55 + near * 0.9), col[1] * (0.55 + near * 0.9), col[2] * (0.6 + near * 0.8)];
        }
        col = lit(col, u, v, 0, px, py);
      } else if (wallBaseL && cx <= ox && cx >= Lx) {
        const yE = oy + (ox - cx) / 2;
        if (cy < yE && cy >= yE - wallH) {
          const wu = ox - cx;
          const wv = yE - cy;
          const c = wallPixel(t.wallLeft!, wallBaseL, wu, Math.floor(wv), wallH, px);
          const l = lit([c[0] * 0.86, c[1] * 0.86, c[2] * 0.92], 0.05, wu / HW, wv / 16, px, py);
          col = wallGlow ? [l[0] + (c[0] - l[0]) * wallGlow, l[1] + (c[1] - l[1]) * wallGlow, l[2] + (c[2] - l[2]) * wallGlow] : l;
        }
      }
      if (!col && wallBaseR && cx >= ox && cx <= Rx) {
        const yE = oy + (cx - ox) / 2;
        if (cy < yE && cy >= yE - wallH) {
          const wu = cx - ox;
          const wv = yE - cy;
          const c = wallPixel(t.wallRight!, wallBaseR, wu, Math.floor(wv), wallH, px);
          const l = lit(c, wu / HW, 0.05, wv / 16, px, py);
          col = wallGlow ? [l[0] + (c[0] - l[0]) * wallGlow, l[1] + (c[1] - l[1]) * wallGlow, l[2] + (c[2] - l[2]) * wallGlow] : l;
        }
      }
      if (!col) {
        // the slab: the floor's cut edge, in strata
        let yF = -1;
        let face = 0;
        if (cx >= Lx && cx <= Bx) {
          yF = Ly + (cx - Lx) / 2;
          face = 0;
        } else if (cx > Bx && cx <= Rx) {
          yF = By - (cx - Bx) / 2;
          face = 1;
        }
        if (yF >= 0 && cy >= yF && cy < yF + SLAB) {
          const depth = cy - yF;
          const k = (face ? 0.62 : 0.85) * (depth < 1 ? 1.6 : depth % 4 < 1 ? 0.7 : 1) * (1 - depth / (SLAB * 2.2));
          col = [slabC[0] * k, slabC[1] * k, slabC[2] * k];
        }
      }
      if (col) {
        const o = (py * width + px) * 4;
        d[o] = clamp(col[0]);
        d[o + 1] = clamp(col[1]);
        d[o + 2] = clamp(col[2]);
        d[o + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);

  const baked: Baked = { canvas, ox, oy, wallH, windows: [], glows: [], lights, size: [t.w, t.h], decorPolys: [] };
  t.decor.forEach((dec, i) => {
    baked.decorPolys[i] = drawDecor(ctx, dec, baked);
  });
  return baked;
}

/* ------------------------------------------------------------------ */
/* wall decor                                                          */
/* ------------------------------------------------------------------ */

function wallPoint(b: Baked, wall: "left" | "right", along: number, v: number): [number, number] {
  // screen point at `along` tiles from the back corner, v px above the floor
  if (wall === "left") return [b.ox - along * HW, b.oy + along * HH - v];
  return [b.ox + along * HW, b.oy + along * HH - v];
}

function drawDecor(ctx: CanvasRenderingContext2D, dec: WallDecor, b: Baked): [number, number][] {
  const span = dec.span ?? 1;
  const W = span * HW;
  const wall = dec.wall;
  const wallLen = wall === "left" ? b.size[1] : b.size[0];
  /** paint flat art of width fw (default: the decor's span) centered on the decor, then skew it onto the wall */
  const place = (v0: number, h: number, draw: (g: CanvasRenderingContext2D) => void, inset = 2, fw?: number) => {
    const w = Math.min(fw ?? W - inset * 2, wallLen * HW - 4);
    const half = w / 2 / HW;
    const center = Math.max(half + 0.1, Math.min(wallLen - half - 0.1, dec.at + span / 2));
    const start = wall === "left" ? center + half : center - half;
    const [x0, y0] = wallPoint(b, wall, start, v0 + h);
    wallArt(ctx, wall, x0, y0, w, h, draw);
    const r = { x0, y0, w, h };
    if (!main) main = r;
    return r;
  };
  let main: { x0: number; y0: number; w: number; h: number } | null = null;
  const k = wall === "left" ? -0.5 : 0.5;
  const poly = (r: { x0: number; y0: number; w: number; h: number }): [number, number][] => [
    [r.x0, r.y0],
    [r.x0 + r.w, r.y0 + r.w * k],
    [r.x0 + r.w, r.y0 + r.w * k + r.h],
    [r.x0, r.y0 + r.h],
  ];
  const wallH = b.wallH;
  const color = dec.color ?? "#ff2e88";

  switch (dec.kind) {
    case "window": {
      const h = Math.min(wallH - 22, 58);
      const r = place(18, h, (g) => {
        const w = g.canvas.width;
        const hh = g.canvas.height;
        g.fillStyle = "#120c1c";
        g.fillRect(0, 0, w, hh);
        for (let y = 2; y < hh - 2; y++) {
          const tt = y / hh;
          g.fillStyle = mix("#0a0c2a", "#4a1e5a", tt * tt);
          g.fillRect(2, y, w - 4, 1);
        }
        // the city outside: towers, lit windows in neon colors
        let x = 2;
        let s = 0;
        while (x < w - 2) {
          const bw = 3 + Math.floor(hash2(x, s, 31) * 5);
          const bh = Math.floor(hh * (0.25 + hash2(x, s, 32) * 0.45));
          g.fillStyle = "#0c0a1c";
          g.fillRect(x, hh - 2 - bh, bw, bh);
          for (let wy = hh - bh; wy < hh - 3; wy += 3) {
            for (let wx = x + 1; wx < x + bw - 1; wx += 2) {
              const q = hash2(wx, wy, 33);
              if (q < 0.3) {
                g.fillStyle = q < 0.06 ? "#ff4fa8" : q < 0.12 ? "#5af0ff" : "#ffc46b";
                g.fillRect(wx, wy, 1, 1);
              }
            }
          }
          x += bw + 1;
          s++;
        }
        g.fillStyle = "rgba(190,220,255,0.22)";
        for (let i = 0; i < w / 3; i++) g.fillRect(2 + Math.floor(hash2(i, 1, 34) * (w - 4)), 2 + Math.floor(hash2(i, 2, 35) * hh * 0.5), 1, 3 + Math.floor(hash2(i, 3, 36) * hh * 0.4));
        g.fillStyle = "#1e1428";
        g.fillRect(Math.floor(w / 2) - 1, 0, 2, hh);
        g.fillRect(0, Math.floor(hh / 2), w, 2);
        g.fillStyle = "#3a2a4a";
        g.fillRect(0, 0, w, 2);
        g.fillRect(0, hh - 2, w, 2);
        g.fillRect(0, 0, 2, hh);
        g.fillRect(w - 2, 0, 2, hh);
      });
      b.windows.push(poly(r));
      const [gx, gy] = wallPoint(b, wall, dec.at + span / 2, 18 + h / 2);
      b.glows.push({ x: gx, y: gy, color: "#7a5aff", r: 26 });
      break;
    }
    case "door": {
      const h = Math.min(wallH - 18, 50);
      place(5, h, (g) => {
        const w = g.canvas.width;
        const hh = g.canvas.height;
        g.fillStyle = "#1a1220";
        g.fillRect(0, 0, w, hh);
        g.fillStyle = mix(color, "#2a1a2a", 0.75);
        g.fillRect(2, 2, w - 4, hh - 2);
        g.fillStyle = mix(color, "#2a1a2a", 0.6);
        g.fillRect(4, 5, w - 8, Math.floor(hh * 0.38));
        g.fillRect(4, Math.floor(hh * 0.5), w - 8, Math.floor(hh * 0.42));
        g.fillStyle = "#e8b04a";
        g.fillRect(w - 6, Math.floor(hh * 0.52), 2, 2);
      });
      if (dec.text) {
        // a glowing sign over the door
        const tw = measurePixelText(dec.text);
        place(5 + h + 3, 9, (g) => {
          g.fillStyle = "#08060e";
          g.fillRect(0, 0, g.canvas.width, 9);
          g.fillStyle = rgba(color, 0.4);
          drawPixelText(g, dec.text!, Math.floor((g.canvas.width - tw) / 2) + 1, 2);
          g.fillStyle = mix(color, "#ffffff", 0.35);
          drawPixelText(g, dec.text!, Math.floor((g.canvas.width - tw) / 2), 2);
        }, 0, Math.max(W - 4, tw + 6));
        const [gx, gy] = wallPoint(b, wall, dec.at + span / 2, 5 + h + 8);
        b.glows.push({ x: gx, y: gy, color, r: 16 });
      }
      break;
    }
    case "neon": {
      const text = dec.text ?? "OPEN";
      const scale = measurePixelText(text, 1, 2) <= W - 8 ? 2 : 1;
      const tw = measurePixelText(text, 1, scale);
      const h = 5 * scale + 6;
      const v0 = (dec.v ?? 52) - h / 2;
      place(v0, h, (g) => {
        const w = g.canvas.width;
        const x = Math.floor((w - tw) / 2);
        g.fillStyle = "rgba(6,4,12,0.85)";
        g.fillRect(Math.max(0, x - 3), 0, tw + 6, h);
        g.fillStyle = rgba(color, 0.45);
        for (const [ddx, ddy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) drawPixelText(g, text, x + ddx, 3 + ddy, { scale });
        g.fillStyle = mix(color, "#ffffff", 0.45);
        drawPixelText(g, text, x, 3, { scale });
      }, 0, Math.max(W, tw + 8));
      const [gx, gy] = wallPoint(b, wall, dec.at + span / 2, dec.v ?? 52);
      b.glows.push({ x: gx, y: gy, color, r: 10 + tw * 0.6 });
      break;
    }
    case "sign": {
      const text = dec.text ?? "";
      const h = 9;
      place((dec.v ?? 56) - h / 2, h, (g) => {
        const w = g.canvas.width;
        g.fillStyle = "#16101c";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "#e8c070";
        drawPixelText(g, text, Math.floor((w - measurePixelText(text)) / 2), 2);
      });
      break;
    }
    case "poster":
    case "painting":
    case "frame": {
      const h = dec.kind === "poster" ? 30 : 24;
      place((dec.v ?? 46) - h / 2, h, (g) => {
        const w = g.canvas.width;
        g.fillStyle = dec.kind === "poster" ? "#d8c8a0" : "#c9a24a";
        g.fillRect(0, 0, w, h);
        g.fillStyle = dec.kind === "poster" ? mix(color, "#20101a", 0.3) : "#1a1424";
        g.fillRect(2, 2, w - 4, h - 4);
        if (dec.kind === "poster") {
          g.fillStyle = "#f0e0c0";
          g.fillRect(Math.floor(w / 2) - 3, 6, 6, 7);
          g.fillStyle = "#1a1018";
          g.fillRect(4, h - 9, w - 8, 2);
          g.fillRect(6, h - 6, w - 12, 1);
        } else {
          for (let i = 0; i < w - 6; i++) {
            g.fillStyle = mix(color, "#e0c080", 0.4);
            g.fillRect(3 + i, Math.round(h / 2 + Math.sin(i * 0.6 + dec.at) * 4), 1, 2);
          }
        }
      });
      break;
    }
    case "board": {
      const h = 30;
      place((dec.v ?? 44) - h / 2, h, (g) => {
        const w = g.canvas.width;
        g.fillStyle = "#4a2e1a";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "#6a4426";
        g.fillRect(2, 2, w - 4, h - 4);
        const pins: [number, number][] = [];
        for (let i = 0; i < Math.max(3, Math.floor(w / 7)); i++) {
          const x = 3 + Math.floor(hash2(i, dec.at, 41) * (w - 12));
          const y = 3 + Math.floor(hash2(i, dec.at, 42) * (h - 12));
          g.fillStyle = hash2(i, 0, 43) < 0.3 ? "#c8d8f0" : "#f0e6d0";
          g.fillRect(x, y, 8, 7);
          g.fillStyle = "#6a6458";
          g.fillRect(x + 1, y + 2, 5, 1);
          g.fillStyle = "#ff2e6e";
          g.fillRect(x + 3, y, 1, 1);
          pins.push([x + 3, y]);
        }
        g.fillStyle = "#ff3a6a";
        for (let i = 1; i < pins.length; i++) {
          const [x1, y1] = pins[i - 1];
          const [x2, y2] = pins[i];
          const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
          for (let s = 0; s <= n; s++) g.fillRect(Math.round(x1 + ((x2 - x1) * s) / n), Math.round(y1 + ((y2 - y1) * s) / n), 1, 1);
        }
      });
      break;
    }
    case "shelf": {
      const h = 40;
      place(20, h, (g) => {
        const w = g.canvas.width;
        g.fillStyle = "#2a1a14";
        g.fillRect(0, 0, w, h);
        for (let s = 0; s < 3; s++) {
          const sy = 4 + s * 13;
          g.fillStyle = "#4a2e1c";
          g.fillRect(0, sy + 10, w, 2);
          for (let x = 2; x < w - 2; x += 3) {
            const q = hash2(x, s + dec.at * 7, 44);
            const bh = 5 + Math.floor(q * 5);
            g.fillStyle = ["#2aa878", "#c84a2a", "#5a5ae0", "#e0a83a", "#b83a8a", "#3ac8e0"][Math.floor(q * 6)];
            g.fillRect(x, sy + 10 - bh, 2, bh);
            g.fillStyle = "rgba(255,240,220,0.5)";
            g.fillRect(x, sy + 10 - bh + 1, 1, 1);
          }
        }
      });
      break;
    }
    case "clock": {
      const h = 14;
      place((dec.v ?? 58) - 7, h, (g) => {
        const w = g.canvas.width;
        const cx = Math.floor(w / 2);
        for (let dy = -7; dy <= 6; dy++) {
          for (let dx = -7; dx <= 7; dx++) {
            const dd = dx * dx + dy * dy;
            if (dd > 49) continue;
            g.fillStyle = dd > 30 ? "#c9a24a" : "#f0ead8";
            g.fillRect(cx + dx, 7 + dy, 1, 1);
          }
        }
        g.fillStyle = "#1a1418";
        g.fillRect(cx, 2, 1, 5);
        g.fillRect(cx, 7, 4, 1);
      });
      break;
    }
    case "monitor": {
      const h = 26;
      place((dec.v ?? 40) - h / 2, h, (g) => {
        const w = g.canvas.width;
        g.fillStyle = "#14141c";
        g.fillRect(0, 0, w, h);
        for (let i = 0; i < 4; i++) {
          const mx = 2 + (i % 2) * Math.floor((w - 4) / 2);
          const my = 2 + Math.floor(i / 2) * 12;
          g.fillStyle = i === 1 ? "#3ad8ff" : "#2a7ac8";
          g.fillRect(mx, my, Math.floor((w - 6) / 2), 10);
          g.fillStyle = "rgba(255,255,255,0.25)";
          for (let s = my + 1; s < my + 10; s += 2) g.fillRect(mx, s, Math.floor((w - 6) / 2), 1);
        }
      });
      break;
    }
    case "panel": {
      const h = 34;
      place(dec.v ?? 18, h, (g) => {
        const w = g.canvas.width;
        g.fillStyle = "#4a5466";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "#2a3040";
        g.fillRect(2, 2, w - 4, h - 4);
        for (let i = 0; i < Math.floor((w - 6) / 4); i++) {
          g.fillStyle = i === 2 ? "#ff3a5a" : "#9aa8bc";
          g.fillRect(4 + i * 4, 6, 2, 6);
        }
        g.fillStyle = "#ffb43d";
        g.fillRect(4, h - 10, w - 8, 3);
      });
      const [gx, gy] = wallPoint(b, wall, dec.at + span / 2, (dec.v ?? 18) + 20);
      b.glows.push({ x: gx, y: gy, color: "#ff3a5a", r: 6 });
      break;
    }
  }
  return main ? poly(main) : [];
}
