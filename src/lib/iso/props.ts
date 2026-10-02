import { HW, HH, canvas, fillPoly, isoBox, line, mix, shade, rgba, hash2 } from "./core";
import { drawPixelText, measurePixelText } from "@/lib/scenes/pixelfont";
import type { IsoProp, PropKind } from "./types";

/**
 * The prop library: every piece of furniture in Veilport, drawn as iso
 * pixel art. Each prop paints a diffuse layer (lit at runtime by the room's
 * lights) and an emissive layer (bulbs, screens, flames, neon) that glows
 * no matter how dark the room gets.
 */

export interface PropArt {
  diffuse: HTMLCanvasElement;
  emissive: HTMLCanvasElement | null;
  /** canvas position of the footprint's top corner */
  ax: number;
  ay: number;
  glows: { x: number; y: number; color: string; r: number }[];
}

const TALL: Partial<Record<PropKind, number>> = {
  pendant: 120,
  barShelf: 50,
  drawers: 46,
  globe: 30,
  easel: 40,
  cooler: 34,
  bed: 18,
  bookcase: 58,
  cabinet: 40,
  lockers: 52,
  grandClock: 52,
  streetLamp: 74,
  floorLamp: 46,
  cameraPole: 110,
  crane: 150,
  tideBoard: 70,
  tree: 70,
  coatRack: 44,
  jukebox: 36,
  trainCar: 46,
  departures: 56,
  noticeboard: 40,
  container: 34,
  shelf: 44,
  displayCase: 30,
  fireplace: 40,
  boat: 46,
  piano: 46,
};

interface Ctx {
  g: CanvasRenderingContext2D;
  e: CanvasRenderingContext2D;
  ax: number;
  ay: number;
  p: IsoProp;
  w: number;
  d: number;
  glows: PropArt["glows"];
  emitted: boolean;
}

/** canvas coords of a tile-space point (relative to the footprint corner) at height z */
function at(c: Ctx, tx: number, ty: number, z = 0): [number, number] {
  return [c.ax + (tx - ty) * HW, c.ay + (tx + ty) * HH - z];
}

function faces(color: string) {
  return {
    top: mix(color, "#ffffff", 0.1),
    left: shade(color, 0.86),
    right: shade(color, 0.6),
    rim: mix(color, "#ffffff", 0.28),
  };
}

/** a box at tile-space offset (tx,ty) with size (bw,bd) and height h, lifted by z */
function box(c: Ctx, tx: number, ty: number, bw: number, bd: number, h: number, color: string, z = 0, g = c.g) {
  const [sx, sy] = at(c, tx, ty, z);
  return isoBox(g, sx, sy, bw, bd, h, faces(color));
}

function glow(c: Ctx, x: number, y: number, color: string, r: number) {
  c.glows.push({ x, y, color, r });
}

function px(g: CanvasRenderingContext2D, x: number, y: number, color: string, w = 1, h = 1) {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), w, h);
}

/** rasterized ellipse (for round tops, barrels, rings) */
function ellipse(g: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string, ring = false) {
  g.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01))));
    if (ring) {
      g.fillRect(Math.round(cx - half), Math.round(cy + y), 1, 1);
      g.fillRect(Math.round(cx + half - 1), Math.round(cy + y), 1, 1);
      if (Math.abs(y) === ry) g.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2, 1);
    } else g.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2, 1);
  }
}

/* ------------------------------------------------------------------ */
/* small objects that sit on top of other things                       */
/* ------------------------------------------------------------------ */

function papersOn(c: Ctx, tx: number, ty: number, z: number, n = 3) {
  for (let i = 0; i < n; i++) box(c, tx + i * 0.03, ty + i * 0.05, 0.32, 0.22, 1, i % 2 ? "#e8e0cc" : "#d8ccb0", z + i);
}

function typewriterOn(c: Ctx, tx: number, ty: number, z: number) {
  box(c, tx, ty, 0.42, 0.3, 4, "#1c1c26", z);
  box(c, tx + 0.04, ty + 0.02, 0.34, 0.08, 4, "#2a2a36", z + 4);
  box(c, tx + 0.1, ty, 0.2, 0.04, 6, "#ece6d6", z + 6);
}

function lampOn(c: Ctx, tx: number, ty: number, z: number, shadeColor = "#1e7a4a", light = "#ffd27a") {
  box(c, tx + 0.08, ty + 0.08, 0.06, 0.06, 9, "#c9a24a", z);
  box(c, tx, ty, 0.24, 0.2, 4, shadeColor, z + 9);
  const [bx, by] = at(c, tx + 0.12, ty + 0.12, z + 9);
  px(c.e, bx - 2, by, light, 4, 1);
  glow(c, bx, by + 2, light, 26);
  c.emitted = true;
}

/* ------------------------------------------------------------------ */
/* painters                                                            */
/* ------------------------------------------------------------------ */

type Painter = (c: Ctx) => void;

const WOOD = "#7a3e24";
const DARKWOOD = "#4a2418";
const STEEL = "#4a5a72";
const BRASS = "#e0a83a";

const P: Partial<Record<PropKind, Painter>> = {
  desk(c) {
    const wood = c.p.color ?? WOOD;
    const W = c.w;
    const D = c.d;
    box(c, 0.08, 0.1, W - 0.16, D - 0.2, 14, shade(wood, 0.8));
    box(c, 0.02, 0.04, W - 0.04, D - 0.08, 3, wood, 14);
    // drawers & brass pulls on the front
    for (let i = 0; i < Math.max(1, Math.floor(W)); i++) {
      const [x, y] = at(c, 0.25 + i * 0.95, D - 0.1, 9);
      px(c.g, x, y, BRASS, 3, 1);
    }
    const v = c.p.variant ?? 0;
    if (v === 0 || v === 2) papersOn(c, 0.15, 0.2, 17, 3);
    if (v === 1 || v === 2) typewriterOn(c, W * 0.42, 0.25, 17);
    if (v !== 3) lampOn(c, W - 0.45, 0.12, 17, c.p.accent ?? "#1e7a4a");
    if (v === 3) {
      // a phone and the case files
      box(c, 0.3, 0.3, 0.3, 0.24, 2, "#d8b878", 17);
      box(c, 0.36, 0.34, 0.3, 0.24, 2, "#c8a868", 19);
      box(c, W - 0.6, 0.3, 0.26, 0.2, 4, "#b81e3e", 17);
    }
  },
  table(c) {
    const wood = c.p.color ?? WOOD;
    box(c, 0.42, 0.42, 0.16, 0.16, 13, shade(wood, 0.6));
    box(c, 0.05, 0.05, c.w - 0.1, c.d - 0.1, 3, wood, 13);
    if (c.p.variant === 1) papersOn(c, 0.3, 0.3, 16, 2);
  },
  roundTable(c) {
    const cloth = c.p.color ?? "#16704a";
    const [cx, cy] = at(c, c.w / 2, c.d / 2, 15);
    box(c, 0.44, 0.44, 0.12, 0.12, 14, "#2a1a14");
    ellipse(c.g, cx, cy + 2, 14, 7, shade(cloth, 0.55));
    ellipse(c.g, cx, cy, 14, 7, cloth);
    ellipse(c.g, cx, cy, 14, 7, mix(cloth, "#ffffff", 0.25), true);
    px(c.g, cx - 5, cy - 2, "#f0e8d8", 3, 2);
    px(c.g, cx + 3, cy, "#f0e8d8", 3, 2);
    px(c.g, cx - 1, cy + 2, "#e04040", 2, 2);
  },
  chair(c) {
    const col = c.p.color ?? "#5a2a1e";
    const back = c.p.variant === 1; // turned away: backrest toward the camera
    box(c, 0.3, 0.3, 0.06, 0.06, 8, "#1a1018");
    box(c, 0.64, 0.64, 0.06, 0.06, 8, "#1a1018");
    box(c, 0.28, 0.28, 0.44, 0.44, 3, col, 8);
    if (back) box(c, 0.28, 0.64, 0.44, 0.08, 14, shade(col, 1.1), 11);
    else box(c, 0.28, 0.28, 0.44, 0.08, 14, shade(col, 1.1), 11);
  },
  stool(c) {
    const col = c.p.color ?? "#c81e5a";
    box(c, 0.46, 0.46, 0.08, 0.08, 12, "#3a3440");
    const [cx, cy] = at(c, 0.5, 0.5, 13);
    ellipse(c.g, cx, cy + 1, 7, 3, shade(col, 0.6));
    ellipse(c.g, cx, cy, 7, 3, col);
    px(c.g, cx - 3, cy - 1, mix(col, "#ffffff", 0.4), 3, 1);
  },
  armchair(c) {
    const col = c.p.color ?? "#8a1e4a";
    box(c, 0.12, 0.12, 0.76, 0.76, 11, col);
    box(c, 0.12, 0.1, 0.76, 0.2, 24, shade(col, 1.08), 0);
    box(c, 0.1, 0.12, 0.16, 0.76, 16, shade(col, 0.95));
    box(c, 0.74, 0.12, 0.16, 0.76, 16, shade(col, 0.95));
    box(c, 0.26, 0.3, 0.48, 0.5, 3, mix(col, "#ffffff", 0.12), 11);
  },
  sofa(c) {
    const col = c.p.color ?? "#2a7a8a";
    box(c, 0.08, 0.12, c.w - 0.16, 0.76, 10, col);
    box(c, 0.08, 0.1, c.w - 0.16, 0.22, 22, shade(col, 1.08));
    for (let i = 0; i < Math.floor(c.w); i++) box(c, 0.2 + i * 0.95, 0.32, 0.8, 0.5, 3, mix(col, "#ffffff", 0.12), 10);
  },
  cabinet(c) {
    const col = c.p.color ?? STEEL;
    box(c, 0.15, 0.2, 0.7, 0.6, 36, col);
    for (let i = 0; i < 4; i++) {
      const [x1, y1] = at(c, 0.15, 0.8, 32 - i * 8);
      const [x2, y2] = at(c, 0.85, 0.8, 32 - i * 8);
      line(c.g, [x1, y1], [x2, y2], shade(col, 0.6));
      const [hx, hy] = at(c, 0.5, 0.8, 28 - i * 8);
      px(c.g, hx - 2, hy, "#c8d0dc", 4, 1);
    }
  },
  bookcase(c) {
    const wood = c.p.color ?? DARKWOOD;
    const W = c.w;
    box(c, 0.05, 0.25, W - 0.1, 0.55, 54, wood);
    // books on the front face, five shelves deep in color
    for (let s = 0; s < 5; s++) {
      const z = 6 + s * 10;
      for (let i = 0; i < W * 9; i++) {
        const t = 0.1 + i * 0.1;
        if (t > W - 0.12) break;
        const q = hash2(i, s, (c.p.variant ?? 0) + 5);
        const col = ["#d83a5a", "#2ab0a0", "#e8a83a", "#6a5ae8", "#3a8ae0", "#e0603a", "#9a3ae0", "#e8e0c8"][Math.floor(q * 8)];
        const [x, y] = at(c, t, 0.8, z);
        const hgt = 6 + Math.floor(q * 3);
        c.g.fillStyle = col;
        c.g.fillRect(x, y - hgt, 2, hgt);
        c.g.fillStyle = "rgba(255,255,255,0.35)";
        c.g.fillRect(x, y - hgt, 1, 1);
      }
      const [lx1, ly1] = at(c, 0.05, 0.8, z);
      const [lx2, ly2] = at(c, W - 0.05, 0.8, z);
      line(c.g, [lx1, ly1], [lx2, ly2], shade(wood, 1.3));
    }
  },
  shelf(c) {
    // an open shelf against the wall: back panel, three boards, trophies & frames
    const wood = c.p.color ?? "#3a2a3a";
    const W = c.w;
    box(c, 0.05, 0.2, W - 0.1, 0.12, 44, shade(wood, 0.7));
    for (const z of [0, 14, 28, 42]) box(c, 0.05, 0.2, W - 0.1, 0.55, 2, wood, z);
    box(c, 0.05, 0.2, 0.06, 0.55, 44, shade(wood, 0.85));
    box(c, W - 0.11, 0.2, 0.06, 0.55, 44, shade(wood, 0.85));
    for (let i = 0; i < Math.round(W * 3); i++) {
      for (const [z, k] of [[2, 0], [16, 1], [30, 2]] as const) {
        const q = hash2(i, k, (c.p.variant ?? 0) + 9);
        const tx = 0.22 + i * 0.3;
        if (tx > W - 0.2) continue;
        if (q < 0.4) {
          // a trophy: cup on a stem
          box(c, tx, 0.42, 0.1, 0.1, 3, "#2a2028", z);
          box(c, tx + 0.03, 0.45, 0.04, 0.04, 4, BRASS, z + 3);
          const [x, y] = at(c, tx + 0.05, 0.47, z + 7);
          ellipse(c.g, x, y - 1, 3, 2, "#ffd25a");
          px(c.g, x - 2, y - 2, "#fff4c0", 1, 1);
        } else if (q < 0.75) {
          // a framed photograph, propped up
          const a = at(c, tx - 0.04, 0.5, z);
          const b2 = at(c, tx + 0.16, 0.5, z);
          fillPoly(c.g, [a, b2, [b2[0], b2[1] - 9], [a[0], a[1] - 9]], "#c9a24a");
          fillPoly(c.g, [[a[0] + 1, a[1] - 1], [b2[0] - 1, b2[1] - 1], [b2[0] - 1, b2[1] - 8], [a[0] + 1, a[1] - 8]], q < 0.55 ? "#3a2a4a" : "#2a4a5a");
          px(c.g, (a[0] + b2[0]) / 2 - 1, (a[1] + b2[1]) / 2 - 6, "#e8c8b0", 2, 3);
        } else {
          // a gold record
          const [x, y] = at(c, tx + 0.05, 0.5, z + 6);
          ellipse(c.g, x, y, 4, 4, "#1a1418");
          ellipse(c.g, x, y, 3, 3, "#f0c040", true);
          px(c.g, x, y, "#ff4fa8", 1, 1);
        }
      }
    }
  },
  counter(c) {
    const col = c.p.color ?? "#3a2a4a";
    box(c, 0.05, 0.05, c.w - 0.1, c.d - 0.1, 18, col);
    box(c, 0.02, 0.02, c.w - 0.04, c.d - 0.04, 3, c.p.accent ?? "#d8d0e8", 18);
  },
  bar(c) {
    const wood = c.p.color ?? "#5a2418";
    box(c, 0.05, 0.1, c.w - 0.1, c.d - 0.2, 18, wood);
    box(c, 0, 0.05, c.w, c.d - 0.1, 3, "#1a1020", 18);
    // brass rail along the front
    const [x1, y1] = at(c, 0.05, c.d - 0.08, 4);
    const [x2, y2] = at(c, c.w - 0.05, c.d - 0.08, 4);
    line(c.g, [x1, y1], [x2, y2], BRASS);
    // the tabs spike and the glasses
    const n = Math.max(c.w, c.d) * 2;
    for (let i = 0; i < n; i++) {
      const tx = c.w > c.d ? 0.3 + i * 0.5 : 0.4;
      const ty = c.w > c.d ? 0.35 : 0.3 + i * 0.5;
      const q = hash2(i, 3, 17);
      if (q < 0.35) {
        const [gx, gy] = at(c, tx, ty, 21);
        px(c.g, gx, gy - 4, "rgba(220,240,255,0.7)", 3, 4);
        px(c.g, gx, gy - 2, q < 0.15 ? "#ffb43d" : "#ff4fa8", 3, 2);
      }
    }
  },
  piano(c) {
    const black = "#100c18";
    box(c, 0.25, 0.25, 0.12, 0.12, 12, "#08060c");
    box(c, 1.6, 0.4, 0.12, 0.12, 12, "#08060c");
    box(c, 0.4, 1.6, 0.12, 0.12, 12, "#08060c");
    box(c, 0.1, 0.1, 1.8, 1.8, 10, black, 12);
    // the lid, raised: a slab tilted up toward the back
    const a = at(c, 0.1, 0.12, 22);
    const b = at(c, 1.9, 0.12, 22);
    const t1 = at(c, 1.7, 0.2, 52);
    const t2 = at(c, 0.3, 0.2, 40);
    fillPoly(c.g, [a, b, t1, t2], "#1c1626");
    line(c.g, t2, t1, "#ff4fa8");
    line(c.g, a, t2, "#5af0ff");
    const prop = at(c, 1.2, 0.3, 22);
    const propTop = at(c, 1.2, 0.3, 44);
    line(c.g, prop, propTop, "#2a2436");
    // keyboard on the front edge
    const k1 = at(c, 0.15, 1.75, 22);
    const k2 = at(c, 1.85, 1.75, 22);
    for (let i = 0; i < 3; i++) line(c.g, [k1[0], k1[1] + i], [k2[0], k2[1] + i], i === 2 ? "#a8a0b8" : "#f4f0e8");
    for (let i = 1; i < 18; i++) {
      if (i % 7 === 3 || i % 7 === 0) continue;
      const t = i / 18;
      px(c.g, k1[0] + (k2[0] - k1[0]) * t, k1[1] + (k2[1] - k1[1]) * t, "#0a0810", 1, 2);
    }
    // lacquer glints: the room's neon in the black
    const s1 = at(c, 0.4, 0.4, 22);
    const s2 = at(c, 1.4, 0.4, 22);
    line(c.g, s1, s2, rgba("#ff4fa8", 0.6));
    const s3 = at(c, 0.1, 0.6, 18);
    const s4 = at(c, 0.1, 1.6, 18);
    line(c.g, s3, s4, rgba("#5af0ff", 0.5));
  },
  musicStand(c) {
    box(c, 0.47, 0.47, 0.06, 0.06, 22, "#1a1420");
    const p1 = at(c, 0.2, 0.55, 22);
    const p2 = at(c, 0.8, 0.55, 22);
    const p3 = at(c, 0.8, 0.45, 34);
    const p4 = at(c, 0.2, 0.45, 34);
    fillPoly(c.g, [p1, p2, p3, p4], "#f0ead8");
    for (let i = 0; i < 4; i++) line(c.g, at(c, 0.28, 0.53 - i * 0.02, 24 + i * 2.6), at(c, 0.72, 0.53 - i * 0.02, 24 + i * 2.6), "#8a8090");
  },
  thermos(c) {
    const z = c.p.z ?? 0;
    const [x, y] = at(c, 0.5, 0.5, z);
    px(c.g, x - 2, y - 9, "#9aa8bc", 5, 9);
    px(c.g, x - 2, y - 9, "#d8e4f0", 1, 9);
    px(c.g, x - 2, y - 11, "#3a4458", 5, 2);
  },
  basket(c) {
    box(c, 0.25, 0.25, 0.5, 0.5, 9, "#a8742a");
    for (let i = 0; i < 4; i++) box(c, 0.28 + i * 0.08, 0.32, 0.18, 0.08, 6, i % 2 ? "#f4d8e8" : "#f0ead8", 9);
    const [x, y] = at(c, 0.25, 0.75, 4);
    line(c.g, [x, y], at(c, 0.75, 0.75, 4), "#6a4418");
  },
  floorLamp(c) {
    const shadeC = c.p.color ?? "#ff4fa8";
    box(c, 0.4, 0.4, 0.2, 0.2, 2, "#1a1420");
    box(c, 0.47, 0.47, 0.06, 0.06, 34, "#c9a24a");
    box(c, 0.28, 0.28, 0.44, 0.44, 9, shadeC, 34);
    const [x, y] = at(c, 0.5, 0.5, 34);
    px(c.e, x - 5, y, mix(shadeC, "#ffffff", 0.6), 10, 2);
    glow(c, x, y, shadeC, 40);
    c.emitted = true;
  },
  streetLamp(c) {
    const col = c.p.color ?? "#ffb43d";
    box(c, 0.4, 0.4, 0.2, 0.2, 4, "#14101c");
    box(c, 0.46, 0.46, 0.08, 0.08, 62, "#1c1826");
    box(c, 0.3, 0.3, 0.4, 0.4, 3, "#1c1826", 62);
    const [x, y] = at(c, 0.5, 0.5, 62);
    px(c.e, x - 3, y + 1, mix(col, "#ffffff", 0.5), 6, 3);
    glow(c, x, y + 3, col, 44);
    c.emitted = true;
  },
  plant(c) {
    box(c, 0.32, 0.32, 0.36, 0.36, 9, c.p.color ?? "#c8502a");
    const [x, y] = at(c, 0.5, 0.5, 12);
    for (let i = 0; i < 40; i++) {
      const a = hash2(i, 1, 51) * Math.PI * 2;
      const r = hash2(i, 2, 52) * 9;
      const lx = x + Math.cos(a) * r;
      const ly = y - 6 + Math.sin(a) * r * 0.7 - hash2(i, 3, 53) * 8;
      px(c.g, lx, ly, hash2(i, 4, 54) < 0.3 ? "#5ae07a" : hash2(i, 5, 55) < 0.5 ? "#1e8a4a" : "#2ab060", 2, 2);
    }
  },
  crate(c) {
    const col = c.p.color ?? "#9a6a34";
    const h = 16 + (c.p.variant ?? 0) * 14;
    const b = box(c, 0.1, 0.1, 0.8, 0.8, h, col);
    line(c.g, b.L, [b.B[0], b.B[1] - h], shade(col, 0.6));
    line(c.g, [b.L[0], b.L[1] - h], b.B, shade(col, 0.6));
    line(c.g, b.B, [b.R[0], b.R[1] - h], shade(col, 0.45));
    if ((c.p.variant ?? 0) > 0) {
      const mid = h / 2;
      line(c.g, [b.L[0], b.L[1] - mid], [b.B[0], b.B[1] - mid], shade(col, 0.55));
      line(c.g, [b.B[0], b.B[1] - mid], [b.R[0], b.R[1] - mid], shade(col, 0.4));
    }
    const [sx, sy] = at(c, 0.3, 0.9, h * 0.55);
    px(c.g, sx, sy, "#1a1010", 6, 2);
  },
  drum(c) {
    const col = c.p.color ?? "#2a5ac8";
    const [cx, cy] = at(c, 0.5, 0.5, 0);
    for (let z = 0; z < 20; z++) ellipse(c.g, cx, cy - z, 8, 4, z % 7 === 3 ? shade(col, 0.6) : z < 2 ? shade(col, 0.5) : col);
    ellipse(c.g, cx, cy - 20, 8, 4, shade(col, 0.4));
    ellipse(c.g, cx, cy - 20, 8, 4, mix(col, "#ffffff", 0.3), true);
    px(c.g, cx - 6, cy - 18, mix(col, "#ffffff", 0.35), 1, 14);
  },
  fireDrum(c) {
    P.drum!({ ...c, p: { ...c.p, color: c.p.color ?? "#3a2a30" } });
    const [cx, cy] = at(c, 0.5, 0.5, 20);
    for (let i = 0; i < 26; i++) {
      const fx = cx - 6 + hash2(i, 1, 61) * 12;
      const fh = 3 + hash2(i, 2, 62) * 10;
      px(c.e, fx, cy - fh, hash2(i, 3, 63) < 0.4 ? "#ffe07a" : hash2(i, 4, 64) < 0.6 ? "#ff8a2a" : "#ff3a2a", 2, Math.ceil(fh * 0.6));
    }
    glow(c, cx, cy - 6, "#ff7a2a", 54);
    c.emitted = true;
  },
  container(c) {
    const col = c.p.color ?? ["#2ab0a8", "#d8382e", "#e88a1e", "#3a5ae0", "#b8307a"][c.p.variant ?? 0];
    const W = c.w;
    const D = c.d;
    const b = box(c, 0.02, 0.05, W - 0.04, D - 0.1, 30, col);
    // corrugation on both faces
    const n = Math.round((W + D) * 6);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const onLeft = t < D / (W + D);
      if (onLeft) {
        const tt = t / (D / (W + D));
        const x = b.L[0] + (b.B[0] - b.L[0]) * tt;
        const y = b.L[1] + (b.B[1] - b.L[1]) * tt;
        line(c.g, [x, y - 1], [x, y - 29], shade(col, 0.7));
      } else {
        const tt = (t - D / (W + D)) / (W / (W + D));
        const x = b.B[0] + (b.R[0] - b.B[0]) * tt;
        const y = b.B[1] + (b.R[1] - b.B[1]) * tt;
        line(c.g, [x, y - 1], [x, y - 29], shade(col, 0.48));
      }
    }
  },
  bollard(c) {
    const [cx, cy] = at(c, 0.5, 0.5, 0);
    for (let z = 0; z < 10; z++) ellipse(c.g, cx, cy - z, 3, 2, z > 7 ? "#3a3448" : "#16121e");
    ellipse(c.g, cx, cy - 11, 4, 2, "#4a4458");
  },
  bench(c) {
    const col = c.p.color ?? "#6a3a22";
    box(c, 0.1, 0.35, 0.08, 0.3, 8, "#1a1420");
    box(c, c.w - 0.18, 0.35, 0.08, 0.3, 8, "#1a1420");
    for (let i = 0; i < 3; i++) box(c, 0.05, 0.3 + i * 0.13, c.w - 0.1, 0.1, 2, col, 8);
    box(c, 0.05, 0.28, c.w - 0.1, 0.06, 10, col, 10);
  },
  car(c) {
    carBody(c, c.p.color ?? "#5a1e8a", false);
  },
  taxi(c) {
    carBody(c, "#ffc21e", true);
  },
  tree(c) {
    box(c, 0.44, 0.44, 0.12, 0.12, 30, "#3a2418");
    const [x, y] = at(c, 0.5, 0.5, 30);
    for (let i = 0; i < 160; i++) {
      const a = hash2(i, 1, 71) * Math.PI * 2;
      const r = Math.sqrt(hash2(i, 2, 72)) * 18;
      const lx = x + Math.cos(a) * r;
      const ly = y - 10 + Math.sin(a) * r * 0.75;
      const top = ly < y - 14;
      px(c.g, lx, ly, top && hash2(i, 3, 73) < 0.5 ? "#4ad06a" : hash2(i, 4, 74) < 0.5 ? "#1a6a3a" : "#228a4a", 2, 2);
    }
  },
  fireplace(c) {
    const stone = c.p.color ?? "#6a5a6e";
    box(c, 0.05, 0.05, c.w - 0.1, c.d - 0.1, 36, stone);
    box(c, 0, 0, c.w, c.d, 3, shade(stone, 1.3), 36);
    // the hearth opening and the fire, on the face toward the room
    const a = at(c, 0.3, c.d - 0.05, 4);
    const b = at(c, c.w - 0.3, c.d - 0.05, 4);
    const tA = at(c, 0.3, c.d - 0.05, 24);
    const tB = at(c, c.w - 0.3, c.d - 0.05, 24);
    fillPoly(c.g, [a, b, tB, tA], "#0c0810");
    for (let i = 0; i < 40; i++) {
      const t = hash2(i, 1, 81);
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t;
      const fh = 3 + hash2(i, 2, 82) * 12;
      px(c.e, x, y - fh, hash2(i, 3, 83) < 0.35 ? "#ffe07a" : hash2(i, 4, 84) < 0.6 ? "#ff8a2a" : "#ff3a2a", 2, Math.ceil(fh * 0.5));
    }
    // mantel clutter
    box(c, 0.3, 0.2, 0.12, 0.12, 8, BRASS, 39);
    box(c, c.w - 0.5, 0.25, 0.2, 0.08, 10, "#e8e0d0", 39);
    const mid = at(c, c.w / 2, c.d - 0.05, 10);
    glow(c, mid[0], mid[1], "#ff7a2a", 60);
    c.emitted = true;
  },
  grandClock(c) {
    box(c, 0.3, 0.3, 0.4, 0.35, 50, "#4a2418");
    const [x, y] = at(c, 0.5, 0.65, 42);
    ellipse(c.g, x, y, 4, 4, "#f0e8d0");
    px(c.g, x, y - 3, "#1a1010", 1, 3);
    px(c.g, x, y, "#1a1010", 3, 1);
    const [px1, py1] = at(c, 0.5, 0.65, 26);
    px(c.g, px1, py1 - 8, BRASS, 1, 9);
    px(c.g, px1 - 1, py1, BRASS, 3, 3);
  },
  examTable(c) {
    box(c, 0.2, 0.3, 0.1, 0.1, 14, "#3a4458");
    box(c, c.w - 0.3, 0.3, 0.1, 0.1, 14, "#3a4458");
    box(c, 0.05, 0.1, c.w - 0.1, c.d - 0.2, 3, "#a8b8c8", 14);
    // a sheet over the shape of someone
    box(c, 0.15, 0.2, c.w - 0.3, c.d - 0.4, 5, "#ece6f0", 17);
    box(c, 0.2, 0.32, 0.35, 0.36, 3, "#f4f0f8", 22);
    box(c, c.w - 0.5, 0.36, 0.25, 0.28, 2, "#f4f0f8", 22);
    const [tx, ty] = at(c, c.w - 0.12, 0.5, 18);
    px(c.g, tx, ty, "#e8c070", 3, 2);
  },
  lightTable(c) {
    box(c, 0.15, 0.2, 0.1, 0.1, 18, "#2a3040");
    box(c, c.w - 0.25, 0.2, 0.1, 0.1, 18, "#2a3040");
    box(c, 0.05, 0.1, c.w - 0.1, c.d - 0.2, 4, "#2a3040", 18);
    const [sx, sy] = at(c, 0.1, 0.15, 22);
    isoBox(c.e, sx, sy, c.w - 0.2, c.d - 0.3, 0, { top: "#dff4ff", left: "#dff4ff", right: "#dff4ff" });
    fillPoly(c.e, [at(c, 0.1, 0.15, 22), at(c, c.w - 0.1, 0.15, 22), at(c, c.w - 0.1, c.d - 0.15, 22), at(c, 0.1, c.d - 0.15, 22)], "#e8f8ff");
    for (let i = 0; i < 3; i++) box(c, 0.25 + i * 0.45, 0.3, 0.3, 0.2, 1, "#5a6a80", 22, c.e);
    const [gx, gy] = at(c, c.w / 2, c.d / 2, 22);
    glow(c, gx, gy, "#bfe8ff", 46);
    c.emitted = true;
  },
  terminal(c) {
    box(c, 0.1, 0.15, 0.8, 0.7, 16, "#2a3040");
    box(c, 0.2, 0.3, 0.55, 0.45, 18, "#1a1e28", 16);
    const a = at(c, 0.25, 0.75, 20);
    const b = at(c, 0.7, 0.75, 20);
    fillPoly(c.e, [a, b, [b[0], b[1] - 11], [a[0], a[1] - 11]], "#0c3a2a");
    for (let i = 0; i < 4; i++) line(c.e, [a[0] + 2, a[1] - 3 - i * 2], [a[0] + 6 + hash2(i, 1, 91) * 8, a[1] - 3 - i * 2 + 2], "#5aff9a");
    glow(c, (a[0] + b[0]) / 2, a[1] - 6, "#3aff8a", 30);
    c.emitted = true;
  },
  displayCase(c) {
    const wood = DARKWOOD;
    box(c, 0.05, 0.1, c.w - 0.1, c.d - 0.2, 16, wood);
    // folios under glass — one frame conspicuously empty when variant = 1
    for (let i = 0; i < c.w * 2; i++) {
      const empty = c.p.variant === 1 && i === 1;
      box(c, 0.15 + i * 0.45, 0.3, 0.35, 0.4, 1, empty ? "#0a0810" : "#e0c890", 16);
    }
    const [gx, gy] = at(c, 0.05, 0.1, 16);
    isoBox(c.g, gx, gy, c.w - 0.1, c.d - 0.2, 12, {
      top: "rgba(150,230,255,0.18)",
      left: "rgba(150,230,255,0.24)",
      right: "rgba(150,230,255,0.14)",
      rim: "rgba(220,250,255,0.6)",
    });
  },
  mapCabinet(c) {
    box(c, 0.05, 0.15, c.w - 0.1, c.d - 0.3, 22, "#5a3418");
    for (let i = 0; i < 5; i++) {
      line(c.g, at(c, 0.05, c.d - 0.15, 4 + i * 4), at(c, c.w - 0.05, c.d - 0.15, 4 + i * 4), "#3a200e");
      const [hx, hy] = at(c, c.w / 2, c.d - 0.15, 6 + i * 4);
      px(c.g, hx - 2, hy, BRASS, 4, 1);
    }
  },
  astrolabe(c) {
    // toppled, with its chalk outline
    const o = [at(c, 0.05, 0.3), at(c, 0.55, 0.05), at(c, 0.95, 0.4), at(c, 0.7, 0.95), at(c, 0.2, 0.8)];
    for (let i = 0; i < o.length; i++) line(c.g, o[i], o[(i + 1) % o.length], "rgba(240,240,255,0.75)");
    const [cx, cy] = at(c, 0.6, 0.4, 2);
    ellipse(c.g, cx, cy, 8, 4, BRASS, true);
    ellipse(c.g, cx, cy - 1, 6, 3, "#c8902a", true);
    line(c.g, at(c, 0.2, 0.5, 1), at(c, 0.5, 0.45, 1), "#a87a2a");
  },
  satchel(c) {
    box(c, 0.28, 0.3, 0.44, 0.3, 8, "#7a3a1e");
    box(c, 0.28, 0.3, 0.44, 0.12, 3, "#8a4a26", 8);
    const [x, y] = at(c, 0.5, 0.45, 11);
    px(c.g, x - 1, y - 3, BRASS, 2, 2);
  },
  bookend(c) {
    box(c, 0.38, 0.4, 0.24, 0.16, 5, "#b8862a");
    box(c, 0.45, 0.44, 0.06, 0.06, 7, "#d8a63a", 5);
  },
  lockers(c) {
    const col = c.p.color ?? "#2a7a8a";
    const n = Math.round(c.w * 2);
    for (let i = 0; i < n; i++) {
      const b = box(c, i * (c.w / n) + 0.02, 0.3, c.w / n - 0.04, 0.5, 48, i === (c.p.variant ?? 1) ? mix(col, "#ffffff", 0.18) : col);
      for (let v = 0; v < 3; v++) line(c.g, [b.L[0] + 2, b.L[1] - 40 + v * 2], [b.B[0] - 2, b.B[1] - 40 + v * 2], shade(col, 0.6));
      px(c.g, b.B[0] - 3, b.B[1] - 22, "#d8e0e8", 1, 3);
    }
  },
  cameraPole(c) {
    box(c, 0.45, 0.45, 0.1, 0.1, 100, "#1a1622");
    box(c, 0.3, 0.2, 0.5, 0.3, 7, "#3a4458", 96);
    const [x, y] = at(c, 0.3, 0.5, 100);
    px(c.e, x, y, "#ff2a3a", 2, 2);
    glow(c, x, y, "#ff2a3a", 10);
    c.emitted = true;
  },
  tideBoard(c) {
    box(c, 0.4, 0.4, 0.2, 0.15, 64, "#1a1622");
    for (let z = 4; z < 60; z += 6) {
      const [x, y] = at(c, 0.4, 0.55, z);
      px(c.g, x, y - 3, "#f0ead8", 3, 3);
    }
    box(c, 0.2, 0.35, 0.6, 0.12, 8, "#e8d8b8", 62);
    const [x, y] = at(c, 0.5, 0.4, 72);
    px(c.e, x, y, "#ffb43d", 2, 2);
    glow(c, x, y, "#ffb43d", 14);
    c.emitted = true;
  },
  crane(c) {
    const iron = "#d8382e";
    box(c, 0.1, 0.1, 0.18, 0.18, 130, iron);
    box(c, c.w - 0.28, 0.1, 0.18, 0.18, 130, iron);
    box(c, 0.1, c.d - 0.28, 0.18, 0.18, 130, shade(iron, 0.9));
    box(c, c.w - 0.28, c.d - 0.28, 0.18, 0.18, 130, shade(iron, 0.9));
    box(c, 0, 0, c.w, c.d, 8, shade(iron, 0.85), 130);
    for (let z = 20; z < 130; z += 22) line(c.g, at(c, 0.2, c.d - 0.2, z), at(c, c.w - 0.2, c.d - 0.2, z + 18), shade(iron, 0.6));
    const [x, y] = at(c, 0, 0, 140);
    px(c.e, x, y, "#ff2a3a", 2, 2);
    glow(c, x, y, "#ff2a3a", 12);
    c.emitted = true;
  },
  boat(c) {
    // a small harbor launch, bow toward +x, riding at its mooring
    const W = c.w;
    const D = c.d;
    const hull = c.p.color ?? "#e8e4f0";
    const ring = (z: number): [number, number][] => [
      at(c, 0.1, 0.18, z),
      at(c, W - 0.7, 0.12, z),
      at(c, W - 0.05, D / 2, z),
      at(c, W - 0.7, D - 0.12, z),
      at(c, 0.1, D - 0.18, z),
    ];
    const lo = ring(0);
    const hi = ring(10);
    fillPoly(c.g, [lo[4], lo[3], hi[3], hi[4]], shade(hull, 0.86));
    fillPoly(c.g, [lo[3], lo[2], hi[2], hi[3]], shade(hull, 0.66));
    fillPoly(c.g, [lo[0], lo[4], hi[4], hi[0]], shade(hull, 0.75));
    fillPoly(c.g, hi, "#7a5a3a");
    line(c.g, hi[4], hi[3], "#d82a3a");
    line(c.g, hi[3], hi[2], "#d82a3a");
    line(c.g, [lo[4][0], lo[4][1] - 3], [lo[3][0], lo[3][1] - 3], shade(hull, 0.6));
    box(c, 0.35, 0.3, W * 0.35, D - 0.6, 11, "#2a5ab8", 10);
    const [wx, wy] = at(c, 0.35 + W * 0.35, D / 2, 16);
    px(c.e, wx - 1, wy - 2, "#ffd27a", 3, 2);
    const [mx, my] = at(c, 0.6, D / 2, 21);
    px(c.g, mx, my - 18, "#2a2430", 1, 18);
    px(c.e, mx - 1, my - 20, "#ff3a4a", 2, 2);
    glow(c, mx, my - 19, "#ff3a4a", 12);
    glow(c, wx, wy, "#ffd27a", 18);
    c.emitted = true;
  },
  noticeboard(c) {
    box(c, 0.15, 0.45, 0.06, 0.06, 36, "#2a1a14");
    box(c, 0.79, 0.45, 0.06, 0.06, 36, "#2a1a14");
    const a = at(c, 0.1, 0.5, 14);
    const b = at(c, 0.9, 0.5, 14);
    fillPoly(c.g, [a, b, [b[0], b[1] - 22], [a[0], a[1] - 22]], "#7a4a26");
    for (let i = 0; i < 7; i++) {
      const t = 0.1 + hash2(i, 1, 101) * 0.7;
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t - 4 - hash2(i, 2, 102) * 14;
      px(c.g, x, y, hash2(i, 3, 103) < 0.3 ? "#bfe0ff" : "#f4ead8", 4, 4);
      px(c.g, x + 1, y, "#ff2e6e", 1, 1);
    }
  },
  recordPlayer(c) {
    box(c, 0.15, 0.2, 0.7, 0.6, 16, "#5a2a1a");
    box(c, 0.2, 0.25, 0.6, 0.5, 2, "#2a1a14", 16);
    const [x, y] = at(c, 0.5, 0.5, 18);
    ellipse(c.g, x, y, 7, 3, "#0a080c");
    ellipse(c.g, x, y, 2, 1, "#ff2e88");
  },
  jukebox(c) {
    const body = "#3a1a4a";
    box(c, 0.15, 0.25, 0.7, 0.5, 30, body);
    const a = at(c, 0.15, 0.75, 2);
    const b = at(c, 0.85, 0.75, 2);
    // neon arch on the face
    for (let z = 4; z < 30; z += 1) {
      const t = (z - 4) / 26;
      const col = t < 0.33 ? "#ff2e88" : t < 0.66 ? "#ffb43d" : "#3af0ff";
      px(c.e, a[0] + 1, a[1] - z, col, 1, 1);
      px(c.e, b[0] - 2, b[1] - z, col, 1, 1);
    }
    for (let i = 0; i < 5; i++) px(c.e, a[0] + 3 + i * 3, a[1] - 16 + i * 1.5, i % 2 ? "#3af0ff" : "#ff2e88", 2, 4);
    const mid = at(c, 0.5, 0.75, 18);
    glow(c, mid[0], mid[1], "#ff2e88", 46);
    c.emitted = true;
  },
  trainCar(c) {
    const body = c.p.color ?? "#1e3a6a";
    const b = box(c, 0, 0.05, c.w, c.d - 0.1, 40, body);
    // windows along the long side (left face if d is the long axis)
    const along = c.d <= c.w;
    const n = Math.round((along ? c.w : c.d) * 1.6);
    for (let i = 0; i < n; i++) {
      const t0 = (i + 0.2) / n;
      const t1 = (i + 0.75) / n;
      const p = (t: number, z: number): [number, number] =>
        along ? [b.L[0] + (b.B[0] - b.L[0]) * t, b.L[1] + (b.B[1] - b.L[1]) * t - z] : [b.B[0] + (b.R[0] - b.B[0]) * t, b.B[1] + (b.R[1] - b.B[1]) * t - z];
      const lit = hash2(i, 2, 111) < 0.8;
      fillPoly(lit ? c.e : c.g, [p(t0, 18), p(t1, 18), p(t1, 32), p(t0, 32)], lit ? "#ffd27a" : "#1a1828");
      if (lit && hash2(i, 3, 112) < 0.5) {
        const mid = p((t0 + t1) / 2, 18);
        px(c.e, mid[0] - 1, mid[1] - 9, "#6a4a3a", 3, 9);
      }
    }
    line(c.g, b.L, b.B, "#0a0a14");
    c.emitted = true;
    const m = along ? at(c, c.w / 2, c.d - 0.1, 26) : at(c, 0.05, c.d / 2, 26);
    glow(c, m[0], m[1], "#ffd27a", 60);
  },
  departures(c) {
    box(c, 0.2, 0.4, 0.08, 0.08, 40, "#1a1622");
    box(c, 0.72, 0.4, 0.08, 0.08, 40, "#1a1622");
    const a = at(c, 0.1, 0.5, 36);
    const b = at(c, 0.9, 0.5, 36);
    fillPoly(c.g, [a, b, [b[0], b[1] - 18], [a[0], a[1] - 18]], "#08060e");
    c.e.fillStyle = "#ffb43d";
    for (let r = 0; r < 4; r++) for (let i = 0; i < 10; i++) if (hash2(i, r, 121) < 0.7) px(c.e, a[0] + 2 + i * 2.4, a[1] - 15 + r * 4 + i * 1.2, "#ffb43d", 1, 2);
    glow(c, (a[0] + b[0]) / 2, a[1] - 9, "#ffb43d", 30);
    c.emitted = true;
  },
  typewriter(c) {
    typewriterOn(c, 0.29, 0.35, c.p.z ?? 0);
  },
  papers(c) {
    papersOn(c, 0.34, 0.39, c.p.z ?? 0, 3);
  },
  fileBox(c) {
    const z = c.p.z ?? 0;
    box(c, 0.25, 0.3, 0.5, 0.4, 10, "#d8b878", z);
    box(c, 0.25, 0.3, 0.5, 0.4, 2, "#c8a868", z + 10);
    const [x, y] = at(c, 0.4, 0.7, z + 6);
    px(c.g, x, y, "#d82a3a", 4, 2);
  },
  kettle(c) {
    const z = c.p.z ?? 0;
    const [x, y] = at(c, 0.5, 0.5, z);
    ellipse(c.g, x, y - 4, 5, 4, "#9aa8bc");
    px(c.g, x - 5, y - 8, "#c8d4e0", 3, 1);
    px(c.g, x + 4, y - 5, "#9aa8bc", 3, 2);
    px(c.g, x - 1, y - 9, "#1a1e28", 2, 1);
  },
  phone(c) {
    const z = c.p.z ?? 0;
    box(c, 0.32, 0.36, 0.36, 0.28, 4, "#d81e4a", z);
  },
  coatRack(c) {
    box(c, 0.4, 0.4, 0.2, 0.2, 2, "#1a1420");
    box(c, 0.47, 0.47, 0.06, 0.06, 40, "#2a1a14");
    // the coat and the hat
    const [x, y] = at(c, 0.5, 0.5, 36);
    const coat = c.p.color ?? "#b8a48a";
    for (let r = 0; r < 26; r++) px(c.g, x - 4 - Math.floor(r / 9), y + r, r % 6 === 0 ? shade(coat, 0.8) : coat, 8 + Math.floor(r / 9) * 2, 1);
    px(c.g, x - 1, y, shade(coat, 0.7), 2, 20);
    if (c.p.variant !== 1) {
      px(c.g, x - 6, y - 4, "#2a2028", 12, 2);
      px(c.g, x - 4, y - 8, "#2a2028", 8, 4);
      px(c.g, x - 4, y - 5, c.p.accent ?? "#ff2e88", 8, 1);
    }
  },
  radiator(c) {
    box(c, 0.1, 0.35, c.w - 0.2, 0.3, 14, "#5a6478");
    for (let i = 0; i < c.w * 8; i++) {
      const t = 0.12 + i / 8;
      if (t > c.w - 0.15) break;
      line(c.g, at(c, t, 0.65, 1), at(c, t, 0.65, 13), "#3a4458");
    }
  },
  pendant(c) {
    // a lamp hung from somewhere above the cut-away
    const col = c.p.color ?? "#ffc46b";
    const z = c.p.variant === 1 ? 70 : 62;
    const [x, y] = at(c, 0.5, 0.5, 0);
    px(c.g, x, y - 118, "#1a1622", 1, 118 - z - 6);
    const [sx, sy] = at(c, 0.5, 0.5, z + 6);
    // a conical shade
    for (let i = 0; i < 6; i++) px(c.g, sx - 1 - i, sy + i, i < 2 ? "#3a3448" : c.p.accent ?? "#2a6a4a", 3 + i * 2, 1);
    px(c.g, sx - 6, sy + 6, mix(c.p.accent ?? "#2a6a4a", "#ffffff", 0.25), 13, 1);
    px(c.e, sx - 3, sy + 7, mix(col, "#ffffff", 0.6), 7, 1);
    px(c.e, sx - 1, sy + 8, "#ffffff", 3, 1);
    glow(c, sx, sy + 9, col, 34);
    c.emitted = true;
  },
  bed(c) {
    // canonical: the headboard against the back-right wall (y = 0), the bed running toward the camera
    const W = c.w;
    const D = c.d;
    const sheet = c.p.color ?? "#e8e0f0";
    box(c, 0.05, 0.05, W - 0.1, D - 0.1, 8, "#3a2418");
    box(c, 0.1, 0.1, W - 0.2, D - 0.2, 6, sheet, 8);
    box(c, 0.08, D * 0.55, W - 0.16, D * 0.4, 7, c.p.accent ?? "#8a1e4a", 8);
    box(c, 0.18, 0.14, W * 0.36, 0.35, 4, "#f4f0f8", 14);
    box(c, W * 0.54, 0.14, W * 0.36, 0.35, 4, "#f4f0f8", 14);
    box(c, 0.05, 0, W - 0.1, 0.1, 26, "#4a2a1c");
  },
  deskLamp(c) {
    lampOn(c, 0.38, 0.4, c.p.z ?? 0, c.p.color ?? "#1e7a4a", c.p.accent ?? "#ffd27a");
  },
  barShelf(c) {
    // the back bar: mirrored shelves of bottles catching every color in the room
    const W = c.w;
    box(c, 0.05, 0.2, W - 0.1, 0.6, 46, "#1a1020");
    const a = at(c, 0.05, 0.8, 0);
    const b2 = at(c, W - 0.05, 0.8, 0);
    // mirror panel on the front
    fillPoly(c.g, [[a[0], a[1] - 18], [b2[0], b2[1] - 18], [b2[0], b2[1] - 44], [a[0], a[1] - 44]], "#2a2240");
    for (const z of [18, 31, 44]) line(c.g, at(c, 0.05, 0.8, z), at(c, W - 0.05, 0.8, z), "#c9a24a");
    const cols = ["#5af0ff", "#ff4fa8", "#ffc46b", "#7aff9a", "#b06aff", "#ff8a3a"];
    for (const z of [19, 32]) {
      for (let i = 0; i < W * 7; i++) {
        const t = 0.12 + i / 7;
        if (t > W - 0.1) break;
        const q = hash2(i, z, 131);
        const [x, y] = at(c, t, 0.8, z);
        const h = 6 + Math.floor(q * 4);
        const col = cols[Math.floor(q * cols.length)];
        px(c.g, x, y - h, shade(col, 0.55), 2, h);
        px(c.g, x, y - h - 2, "#1a1020", 1, 2);
        px(c.e, x, y - h + 1, rgba(col, 0.9), 1, Math.max(1, h - 3));
      }
    }
    glow(c, ...at(c, W / 2, 0.8, 30), "#ff4fa8", 40);
    c.emitted = true;
  },
  sink(c) {
    box(c, 0.1, 0.25, c.w - 0.2, 0.55, 18, "#9aa8b8");
    box(c, 0.2, 0.32, c.w - 0.4, 0.4, 2, "#5a6878", 17);
    const [x, y] = at(c, c.w / 2, 0.3, 18);
    px(c.g, x, y - 7, "#c8d4e0", 1, 7);
    px(c.g, x, y - 7, "#c8d4e0", 3, 1);
  },
  drawers(c) {
    // a wall of cold-storage drawers
    const steel = c.p.color ?? "#8a98aa";
    const W = c.w;
    const b = box(c, 0.05, 0.15, W - 0.1, 0.7, 44, steel);
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < Math.round(W * 2); i++) {
        const t0 = (i + 0.08) / Math.round(W * 2);
        const t1 = (i + 0.92) / Math.round(W * 2);
        const p = (t: number, z: number): [number, number] => [b.B[0] + (b.R[0] - b.B[0]) * t, b.B[1] + (b.R[1] - b.B[1]) * t - z];
        const pl = (t: number, z: number): [number, number] => [b.L[0] + (b.B[0] - b.L[0]) * t, b.L[1] + (b.B[1] - b.L[1]) * t - z];
        const f = W >= c.d ? pl : p;
        const z0 = 3 + r * 14;
        fillPoly(c.g, [f(t0, z0), f(t1, z0), f(t1, z0 + 12), f(t0, z0 + 12)], shade(steel, r === 1 && i === 1 ? 1.15 : 0.82));
        const h = f((t0 + t1) / 2, z0 + 6);
        px(c.g, h[0] - 2, h[1], "#e8eef4", 4, 1);
        px(c.g, h[0] - 1, h[1] - 4, "#f0e8c0", 2, 2); // name card
      }
    }
  },
  globe(c) {
    box(c, 0.4, 0.4, 0.2, 0.2, 14, "#4a2418");
    const [x, y] = at(c, 0.5, 0.5, 22);
    ellipse(c.g, x, y, 7, 7, "#2a7aa8");
    for (let i = 0; i < 18; i++) px(c.g, x - 5 + hash2(i, 1, 141) * 9, y - 5 + hash2(i, 2, 142) * 9, "#c8a85a", 2, 2);
    ellipse(c.g, x, y, 8, 8, BRASS, true);
    px(c.g, x - 3, y - 4, "rgba(255,255,255,0.5)", 2, 2);
  },
  easel(c) {
    const a = at(c, 0.2, 0.6, 0);
    const b2 = at(c, 0.8, 0.6, 0);
    const top = at(c, 0.5, 0.45, 38);
    line(c.g, a, top, "#6a4a2a");
    line(c.g, b2, top, "#6a4a2a");
    const p1 = at(c, 0.15, 0.55, 16);
    const p2 = at(c, 0.85, 0.55, 16);
    fillPoly(c.g, [p1, p2, [p2[0], p2[1] - 20], [p1[0], p1[1] - 20]], "#f0e6d0");
    for (let i = 0; i < 5; i++) px(c.g, p1[0] + 3 + i * 4, p1[1] - 6 - i * 2 - hash2(i, 1, 151) * 6, ["#ff4fa8", "#3a8ae0", "#e8a83a"][i % 3], 2, 2);
  },
  ring(c) {
    // a boxing ring roped off on the floor
    const W = c.w;
    const D = c.d;
    box(c, 0, 0, W, D, 4, c.p.color ?? "#2a3a6a");
    for (const [tx, ty] of [[0.05, 0.05], [W - 0.15, 0.05], [0.05, D - 0.15], [W - 0.15, D - 0.15]] as const) box(c, tx, ty, 0.1, 0.1, 22, "#c8c8d0", 4);
    for (const z of [12, 18, 24]) {
      const col = z === 18 ? "#ff2e6e" : "#e8e0e8";
      line(c.g, at(c, 0.1, 0.1, z), at(c, W - 0.1, 0.1, z), col);
      line(c.g, at(c, 0.1, 0.1, z), at(c, 0.1, D - 0.1, z), col);
      line(c.g, at(c, 0.1, D - 0.1, z), at(c, W - 0.1, D - 0.1, z), col);
      line(c.g, at(c, W - 0.1, 0.1, z), at(c, W - 0.1, D - 0.1, z), col);
    }
  },
  cooler(c) {
    box(c, 0.25, 0.25, 0.5, 0.5, 22, "#c8d0dc");
    const [x, y] = at(c, 0.5, 0.5, 22);
    ellipse(c.g, x, y - 5, 5, 6, "rgba(120,200,255,0.75)");
    px(c.g, x - 2, y - 9, "rgba(255,255,255,0.7)", 1, 4);
  },
  rocks(c) {
    // tumbled seawall stones, slick with spray
    for (let i = 0; i < 7; i++) {
      const tx = 0.2 + hash2(i, 1, 161) * (c.w - 0.4);
      const ty = 0.2 + hash2(i, 2, 162) * (c.d - 0.4);
      const [x, y] = at(c, tx, ty, 0);
      const r = 3 + Math.floor(hash2(i, 3, 163) * 4);
      const col = mix("#4a4a5e", "#7a7890", hash2(i, 4, 164));
      ellipse(c.g, x, y - r * 0.6, r + 1, r * 0.7 + 1, shade(col, 0.55));
      ellipse(c.g, x, y - r * 0.7, r, r * 0.7, col);
      px(c.g, x - r * 0.5, y - r * 1.1, "rgba(200,220,255,0.55)", 2, 1);
    }
  },
  rope(c) {
    // velvet rope between brass stanchions (variant 1: police tape)
    const W = c.w;
    const D = c.d;
    const a = W >= D ? at(c, 0.1, 0.5, 0) : at(c, 0.5, 0.1, 0);
    const b2 = W >= D ? at(c, W - 0.1, 0.5, 0) : at(c, 0.5, D - 0.1, 0);
    for (const p of [a, b2]) {
      px(c.g, p[0], p[1] - 14, BRASS, 1, 14);
      px(c.g, p[0] - 1, p[1] - 15, "#ffe08a", 3, 2);
      px(c.g, p[0] - 2, p[1], "#8a6a2a", 5, 1);
    }
    const n = Math.max(Math.abs(b2[0] - a[0]), 1);
    for (let i = 0; i <= n; i++) {
      const tt = i / n;
      const sag = Math.sin(tt * Math.PI) * 4;
      const tape = c.p.variant === 1;
      px(c.g, a[0] + (b2[0] - a[0]) * tt, a[1] - 12 + (b2[1] - a[1]) * tt + (tape ? sag * 0.4 : sag), tape ? (i % 6 < 3 ? "#ffd21e" : "#1a1410") : "#c81e4a", 1, 2);
    }
  },
  marker(c) {
    // a crime-scene evidence tent
    const n = String((c.p.variant ?? 0) + 1);
    const a = at(c, 0.35, 0.65);
    const b = at(c, 0.65, 0.55);
    const t = at(c, 0.5, 0.6, 12);
    fillPoly(c.g, [a, b, t], "#ffd21e");
    fillPoly(c.g, [b, at(c, 0.6, 0.35), t], "#c89a10");
    c.g.fillStyle = "#1a1010";
    drawPixelText(c.g, n, t[0] - measurePixelText(n) / 2, t[1] + 2);
  },
};

function carBody(c: Ctx, color: string, taxi: boolean) {
  const W = c.w;
  const D = c.d;
  const along = W >= D; // nose toward +x
  const len = along ? W : D;
  const wid = along ? D : W;
  const bx = (t: number, s: number): [number, number] => (along ? [t, s] : [s, t]);
  const [x0, y0] = bx(0.05, 0.12);
  const [bw, bd] = along ? [len - 0.1, wid - 0.24] : [wid - 0.24, len - 0.1];
  box(c, x0, y0, bw, bd, 10, color, 3);
  const [cx0, cy0] = bx(len * 0.28, 0.18);
  const [cw, cd] = along ? [len * 0.42, wid - 0.36] : [wid - 0.36, len * 0.42];
  const cab = box(c, cx0, cy0, cw, cd, 8, shade(color, 1.05), 13);
  // windows reflecting the neon
  fillPoly(c.g, [cab.left[0], cab.left[1], [cab.left[2][0], cab.left[2][1] + 2], [cab.left[3][0], cab.left[3][1] + 2]], "#3a6aa8");
  fillPoly(c.g, [cab.right[0], cab.right[1], [cab.right[2][0], cab.right[2][1] + 2], [cab.right[3][0], cab.right[3][1] + 2]], "#2a4a80");
  line(c.g, cab.left[0], [cab.left[3][0], cab.left[3][1] + 2], "#ff4fa8");
  // wheels
  for (const t of [0.22, 0.78]) {
    const [wx, wy] = at(c, ...bx(len * t, wid - 0.12), 3);
    ellipse(c.g, wx, wy, 3, 3, "#0a080e");
  }
  // headlights at the nose, tail lights at the back
  const [hx, hy] = at(c, ...bx(len - 0.06, wid * 0.5), 8);
  px(c.e, hx - 1, hy, "#fff4c8", 3, 2);
  glow(c, hx, hy, "#fff0c0", 30);
  const [tx, ty] = at(c, ...bx(0.06, wid * 0.5), 8);
  px(c.e, tx - 1, ty, "#ff2a3a", 2, 2);
  if (taxi) {
    const [sx, sy] = at(c, ...bx(len * 0.48, wid * 0.4), 21);
    px(c.e, sx - 4, sy - 3, "#ffe680", 8, 3);
    c.e.fillStyle = "#3a2a00";
    drawPixelText(c.e, "TAXI", sx - 4, sy - 9);
    glow(c, sx, sy - 2, "#ffe680", 18);
    // checker stripe
    for (let i = 0; i < 8; i++) {
      const [qx, qy] = at(c, ...bx(len * (0.1 + i * 0.1), wid - 0.1), 7);
      px(c.g, qx, qy, i % 2 ? "#1a1010" : "#f0f0f0", 2, 1);
    }
  }
  c.emitted = true;
}

/** a prop's height in px above whatever it stands on */
export function propHeight(p: IsoProp): number {
  return TALL[p.kind] ?? (p.kind === "marker" || p.kind === "papers" || p.kind === "astrolabe" ? 12 : 22);
}

/** props with a front: painted facing +y, mirrored when they stand against the left wall */
const FRONTED = new Set<PropKind>([
  "desk", "bookcase", "cabinet", "lockers", "drawers", "shelf", "barShelf", "mapCabinet", "counter", "bar", "sofa",
  "bench", "noticeboard", "departures", "trainCar", "radiator", "displayCase", "examTable", "lightTable", "sink", "bed",
  "jukebox", "fireplace", "terminal", "chair", "armchair", "grandClock", "recordPlayer", "tideBoard", "cooler", "easel",
]);

function flip(c: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = c.width;
  out.height = c.height;
  const g = out.getContext("2d", { willReadFrequently: true })!;
  g.imageSmoothingEnabled = false;
  g.translate(c.width, 0);
  g.scale(-1, 1);
  g.drawImage(c, 0, 0);
  return out;
}

export function paintProp(p: IsoProp): PropArt {
  const w = p.w ?? 1;
  const d = p.d ?? 1;
  const mirrored = FRONTED.has(p.kind) && (p.face ? p.face === "x" : p.kind === "bed" ? w > d : d > w);
  // paint in the canonical orientation, then mirror into place
  const cw = mirrored ? d : w;
  const cd = mirrored ? w : d;
  const H = (TALL[p.kind] ?? 34) + (p.z ?? 0);
  const width = (cw + cd) * HW + 16;
  const height = (cw + cd) * HH + H + 16;
  const ax = cd * HW + 8;
  const ay = H + 8;
  const { c: diffuse, g } = canvas(width, height);
  const { c: emissive, g: e } = canvas(width, height);
  const ctx: Ctx = { g, e, ax, ay, p: { ...p, w: cw, d: cd }, w: cw, d: cd, glows: [], emitted: false };
  const painter = P[p.kind] ?? P.marker!;
  painter(ctx);
  if (!mirrored) return { diffuse, emissive: ctx.emitted ? emissive : null, ax, ay, glows: ctx.glows };
  return {
    diffuse: flip(diffuse),
    emissive: ctx.emitted ? flip(emissive) : null,
    ax: width - ax,
    ay,
    glows: ctx.glows.map((gl) => ({ ...gl, x: width - gl.x })),
  };
}
