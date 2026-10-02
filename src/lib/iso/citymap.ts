import type { CityLocation, SceneId } from "@/lib/engine/types";
import { fillPoly, hash2, mix, shade } from "./core";

/**
 * Veilport in miniature: the whole city as an isometric model, baked once —
 * the bay and the river, districts of lit towers and warehouses, a landmark
 * for every place a case can take you, and the roads its traffic runs on.
 */

export const CN = 36; // tiles per side
const HWm = 8;
const HHm = 4;
const PAD = 44;
const MAXH = 96;

export interface CityBake {
  canvas: HTMLCanvasElement;
  /** canvas position of tile (0,0)'s top corner */
  ox: number;
  oy: number;
  /** beacon anchor (top of each landmark), canvas px, by location id */
  spots: Record<string, { x: number; y: number; ground: number }>;
  /** glowing points for bloom */
  glows: { x: number; y: number; color: string; r: number; blink?: boolean }[];
  /** road runs (tile coords) traffic can follow */
  roads: { a: [number, number]; b: [number, number] }[];
  /** the lighthouse lamp, if any */
  lighthouse: { x: number; y: number } | null;
  /** searchlight roots */
  searchlights: { x: number; y: number }[];
}

type Zone = "water" | "harbor" | "industrial" | "downtown" | "financial" | "civic" | "university" | "suburbs" | "forest";

const DISTRICTS: { k: Zone; x: number; y: number }[] = [
  { k: "harbor", x: 14, y: 68 },
  { k: "industrial", x: 24, y: 90 },
  { k: "downtown", x: 44, y: 56 },
  { k: "financial", x: 50, y: 33 },
  { k: "civic", x: 62, y: 46 },
  { k: "university", x: 74, y: 20 },
  { k: "suburbs", x: 84, y: 62 },
  { k: "forest", x: 94, y: 18 },
  { k: "suburbs", x: 70, y: 84 },
  { k: "forest", x: 96, y: 40 },
];

const RIVER: [number, number][] = [
  [36, 0],
  [33, 12],
  [26, 26],
  [16, 40],
  [4, 50],
];

function distToRiver(mx: number, my: number) {
  let best = Infinity;
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [ax, ay] = RIVER[i];
    const [bx, by] = RIVER[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((mx - ax) * dx + (my - ay) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(mx - ax - dx * t, my - ay - dy * t));
  }
  return best;
}

function coast(my: number) {
  return 5 + 2.5 * Math.sin(my * 0.15) + (my > 80 ? (my - 80) * 0.25 : 0) + (my < 22 ? (22 - my) * 0.12 : 0);
}

const PALETTE: Record<Zone, { wall: string; roof: string; lit: number; hmin: number; hmax: number }> = {
  water: { wall: "#000", roof: "#000", lit: 0, hmin: 0, hmax: 0 },
  harbor: { wall: "#3a3448", roof: "#4a4458", lit: 0.12, hmin: 6, hmax: 12 },
  industrial: { wall: "#3e3438", roof: "#4a3e40", lit: 0.1, hmin: 8, hmax: 16 },
  downtown: { wall: "#3a2a4e", roof: "#4a3a5e", lit: 0.34, hmin: 12, hmax: 28 },
  financial: { wall: "#26305a", roof: "#36406a", lit: 0.42, hmin: 24, hmax: 62 },
  civic: { wall: "#36405a", roof: "#46506a", lit: 0.26, hmin: 10, hmax: 22 },
  university: { wall: "#4a3628", roof: "#5a4632", lit: 0.2, hmin: 8, hmax: 16 },
  suburbs: { wall: "#4a3a44", roof: "#7a2a3a", lit: 0.3, hmin: 5, hmax: 8 },
  forest: { wall: "#000", roof: "#000", lit: 0, hmin: 0, hmax: 0 },
};

const WINDOW = ["#ffc46b", "#ffc46b", "#ffd890", "#ffb04a", "#5af0ff", "#ff4fa8", "#ffe8b0"];

export function bakeCityMap(locations: CityLocation[]): CityBake {
  const W = CN * 2 * HWm + PAD * 2;
  const H = CN * 2 * HHm + MAXH + PAD * 2;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  const ox = CN * HWm + PAD;
  const oy = MAXH + PAD;
  const scr = (x: number, y: number, z = 0): [number, number] => [ox + (x - y) * HWm, oy + (x + y) * HHm - z];
  const glows: CityBake["glows"] = [];
  const px = (x: number, y: number, c: string, w = 1, h = 1) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), w, h);
  };

  /* ---- what each tile is ---- */
  const toMap = (t: number) => ((t + 0.5) / CN) * 100;
  const zone: Zone[][] = [];
  const road: boolean[][] = [];
  for (let y = 0; y < CN; y++) {
    zone.push([]);
    road.push([]);
    for (let x = 0; x < CN; x++) {
      const mx = toMap(x);
      const my = toMap(y);
      let z: Zone;
      if (mx < coast(my) || distToRiver(mx, my) < 3.2 || my > 97) z = "water";
      else {
        let best = Infinity;
        z = "downtown";
        for (const d of DISTRICTS) {
          const dd = Math.hypot(d.x - mx, d.y - my) + hash2(x, y, 3) * 6;
          if (dd < best) {
            best = dd;
            z = d.k;
          }
        }
      }
      zone[y].push(z);
      const grid = z === "suburbs" ? 5 : z === "forest" ? 99 : 4;
      road[y].push(z !== "water" && z !== "forest" && (x % grid === 1 || y % grid === 1));
    }
  }
  // the coastal road and the rail out to the hills
  for (let y = 0; y < CN; y++) {
    for (let x = 0; x < CN; x++) {
      if (zone[y][x] === "water") continue;
      const left = x > 0 && zone[y][x - 1] === "water";
      if (left && zone[y][x] !== "forest") road[y][x] = true;
    }
  }

  // landmarks claim their tiles
  const landmarkAt = new Map<string, { loc: CityLocation; scene: SceneId }>();
  for (const loc of locations) {
    let tx = Math.min(CN - 1, Math.floor((loc.mapX / 100) * CN));
    let ty = Math.min(CN - 1, Math.floor((loc.mapY / 100) * CN));
    // never in the water, never on another landmark
    for (let k = 0; k < 8 && (zone[ty][tx] === "water" || landmarkAt.has(`${tx},${ty}`)); k++) tx = Math.min(CN - 1, tx + 1);
    if (road[ty][tx] && !landmarkAt.has(`${tx},${ty + 1}`) && ty + 1 < CN && zone[ty + 1][tx] !== "water") {
      // keep roads continuous: step off them when we can
      if (!road[ty][Math.min(CN - 1, tx + 1)]) tx = Math.min(CN - 1, tx + 1);
    }
    road[ty][tx] = false;
    if (zone[ty][tx] === "forest" && loc.scene !== "forest") zone[ty][tx] = "suburbs";
    landmarkAt.set(`${tx},${ty}`, { loc, scene: loc.scene });
  }

  /* ---- draw back to front ---- */
  const spots: CityBake["spots"] = {};
  const searchlights: { x: number; y: number }[] = [];
  let lighthouse: CityBake["lighthouse"] = null;

  const ground = (x: number, y: number) => {
    const z = zone[y][x];
    const [sx, sy] = scr(x, y);
    const d: [number, number][] = [
      [sx, sy],
      [sx + HWm, sy + HHm],
      [sx, sy + HHm * 2],
      [sx - HWm, sy + HHm],
    ];
    if (z === "water") {
      // near the shore the water carries the city's lights
      let shore = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (zone[y + dy]?.[x + dx] && zone[y + dy][x + dx] !== "water") shore++;
      fillPoly(g, d, mix((x + y) % 2 ? "#123366" : "#163a70", "#2a4a8a", Math.min(1, shore * 0.12)));
      if (hash2(x, y, 11) < 0.45) px(sx - 3 + hash2(x, y, 12) * 6, sy + 3 + hash2(x, y, 13) * 3, "rgba(150,200,255,0.45)", 2, 1);
      if (shore && hash2(x, y, 15) < 0.6) {
        const c = ["#ffc46b", "#ff4fa8", "#5af0ff"][Math.floor(hash2(x, y, 16) * 3)];
        px(sx - 2 + hash2(x, y, 17) * 4, sy + 2 + hash2(x, y, 18) * 4, c, 1, 2);
      }
      return;
    }
    if (road[y][x]) {
      fillPoly(g, d, "#1e1a2a");
      // lane dashes & a streetlight at crossings
      const xr = road[y][x - 1] && road[y][x + 1];
      const yr = road[y - 1]?.[x] && road[y + 1]?.[x];
      if (xr && !yr) px(sx + 1, sy + HHm, "rgba(255,210,120,0.35)", 2, 1);
      if (yr && !xr) px(sx - 2, sy + HHm, "rgba(255,210,120,0.35)", 2, 1);
      if (xr && yr && hash2(x, y, 14) < 0.7) {
        px(sx, sy + HHm - 1, "#ffd27a", 1, 1);
        glows.push({ x: sx, y: sy + HHm - 1, color: "#ffb43d", r: 7 });
      }
      return;
    }
    const base = z === "forest" ? "#123a2a" : z === "university" ? "#1e3a2a" : z === "suburbs" ? "#2a3a2e" : z === "harbor" ? "#2a2a36" : "#26222e";
    fillPoly(g, d, (x + y) % 2 ? base : shade(base, 1.08));
  };

  const tree = (x: number, y: number, n: number) => {
    const [sx, sy] = scr(x + 0.5, y + 0.5);
    for (let i = 0; i < n; i++) {
      const tx = sx - 5 + hash2(x * 7 + i, y, 21) * 10;
      const ty = sy - 2 + hash2(x, y * 7 + i, 22) * 4;
      const h = 4 + Math.floor(hash2(x + i, y, 23) * 4);
      px(tx, ty - h, "#0e2a1c", 3, h);
      px(tx - 1, ty - h + 1, "#1a4a2e", 5, h - 2);
      px(tx, ty - h, "#2a6a3e", 2, 1);
      px(tx + 1, ty, "#2a1a14", 1, 2);
    }
  };

  /** an iso block with lit windows; returns its top center */
  const block = (x: number, y: number, h: number, wall: string, roof: string, lit: number, inset = 0.12, wInd = 0) => {
    const x0 = x + inset;
    const y0 = y + inset;
    const s = 1 - inset * 2;
    const T = scr(x0, y0);
    const R = scr(x0 + s, y0);
    const B = scr(x0 + s, y0 + s);
    const L = scr(x0, y0 + s);
    const up = (p: [number, number]): [number, number] => [p[0], p[1] - h];
    fillPoly(g, [L, B, up(B), up(L)], shade(wall, 1));
    fillPoly(g, [B, R, up(R), up(B)], shade(wall, 0.7));
    fillPoly(g, [up(T), up(R), up(B), up(L)], roof);
    // windows: rows every 3px, columns every 2px, on both faces
    for (let wy = 3; wy < h - 2; wy += 3) {
      for (let f = 0; f < 2; f++) {
        const a = f ? B : L;
        const b = f ? R : B;
        const len = Math.abs(b[0] - a[0]);
        for (let wx = 1; wx < len - 1; wx += 2) {
          const q = hash2(x * 31 + wx + f * 101 + wInd, y * 17 + wy, 31);
          const t = wx / len;
          const X = a[0] + (b[0] - a[0]) * t;
          const Y = a[1] + (b[1] - a[1]) * t - wy;
          if (q < lit) px(X, Y, WINDOW[Math.floor(hash2(x + wx, y + wy, 32) * WINDOW.length)]);
          else if (q < lit + 0.25) px(X, Y, shade(wall, f ? 0.55 : 0.75));
        }
      }
    }
    // roof edge highlight
    g.fillStyle = mix(roof, "#ffffff", 0.18);
    const [lx, ly] = up(L);
    const [bx, by] = up(B);
    for (let i = 0; i <= Math.abs(bx - lx); i++) px(lx + i, ly + ((by - ly) * i) / Math.max(1, Math.abs(bx - lx)), mix(roof, "#ffffff", 0.2));
    return { top: [(up(T)[0] + up(B)[0]) / 2, (up(T)[1] + up(B)[1]) / 2] as [number, number], h };
  };

  const landmark = (x: number, y: number, loc: CityLocation) => {
    const kind = loc.scene;
    let top: [number, number];
    switch (kind) {
      case "hotel": {
        const r = block(x, y, 58, "#4a1e3e", "#5a2a4e", 0.5, 0.08, 7);
        // a crown of light
        for (let i = -4; i <= 4; i += 2) px(r.top[0] + i, r.top[1] - 2, "#ff4fa8", 1, 2);
        glows.push({ x: r.top[0], y: r.top[1] - 2, color: "#ff4fa8", r: 18 });
        searchlights.push({ x: r.top[0], y: r.top[1] - 3 });
        top = [r.top[0], r.top[1] - 4];
        break;
      }
      case "highrise": {
        const r = block(x, y, 82, "#1e2c5a", "#2e3c6a", 0.55, 0.06, 9);
        px(r.top[0], r.top[1] - 12, "#8a90a8", 1, 12);
        px(r.top[0], r.top[1] - 13, "#ff2a3a", 1, 1);
        glows.push({ x: r.top[0], y: r.top[1] - 13, color: "#ff2a3a", r: 8, blink: true });
        glows.push({ x: r.top[0], y: r.top[1] + 4, color: "#5af0ff", r: 16 });
        searchlights.push({ x: r.top[0], y: r.top[1] - 2 });
        top = [r.top[0], r.top[1] - 14];
        break;
      }
      case "museum": {
        const r = block(x, y, 16, "#5a5468", "#6a6478", 0.1, 0.04);
        // a green copper dome
        for (let i = 0; i < 6; i++) px(r.top[0] - 6 + i, r.top[1] - i, "#3a8a7a", 13 - i * 2, 1);
        px(r.top[0], r.top[1] - 9, "#ffc46b", 1, 3);
        // columns on the front
        const [lx, ly] = scr(x + 0.1, y + 0.96);
        for (let i = 0; i < 6; i++) px(lx + 1 + i * 1.5, ly - 13 + i * 0.75, "#c8c0b0", 1, 11);
        top = [r.top[0], r.top[1] - 10];
        break;
      }
      case "morgue": {
        const r = block(x, y, 18, "#c8ccd8", "#d8dce8", 0.15, 0.08, 3);
        px(r.top[0] - 1, r.top[1] - 4, "#ff3a4a", 3, 1);
        px(r.top[0], r.top[1] - 5, "#ff3a4a", 1, 3);
        glows.push({ x: r.top[0], y: r.top[1] - 4, color: "#ff3a4a", r: 10 });
        top = [r.top[0], r.top[1] - 6];
        break;
      }
      case "precinct": {
        const r = block(x, y, 24, "#2a3a6a", "#3a4a7a", 0.4, 0.06, 5);
        px(r.top[0] - 2, r.top[1] - 2, "#3a6aff", 2, 2);
        px(r.top[0] + 1, r.top[1] - 2, "#ff2a3a", 2, 2);
        glows.push({ x: r.top[0] - 1, y: r.top[1] - 1, color: "#3a6aff", r: 12, blink: true });
        glows.push({ x: r.top[0] + 2, y: r.top[1] - 1, color: "#ff2a3a", r: 12, blink: true });
        top = [r.top[0], r.top[1] - 4];
        break;
      }
      case "bar": {
        const r = block(x, y, 12, "#2a1a3a", "#3a2a4a", 0.2, 0.1, 2);
        const [lx, ly] = scr(x + 0.2, y + 0.9);
        px(lx, ly - 9, "#3af0ff", 7, 2);
        glows.push({ x: lx + 3, y: ly - 8, color: "#3af0ff", r: 14 });
        top = [r.top[0], r.top[1] - 2];
        break;
      }
      case "station": {
        const r = block(x, y, 14, "#4a4058", "#5a5068", 0.3, 0.02, 4);
        // the glass vault of the train hall
        for (let i = 0; i < 5; i++) px(r.top[0] - 7 + i, r.top[1] - i, "#5ab8ff", 15 - i * 2, 1);
        px(r.top[0] + 6, r.top[1] - 14, "#e8e0d0", 3, 12);
        px(r.top[0] + 6, r.top[1] - 12, "#ffc46b", 2, 2);
        glows.push({ x: r.top[0], y: r.top[1] - 2, color: "#5ab8ff", r: 16 });
        top = [r.top[0], r.top[1] - 6];
        break;
      }
      case "apartment": {
        const r = block(x, y, 8, "#5a4048", "#8a2a3a", 0.45, 0.16, 6);
        // a pitched roof
        for (let i = 0; i < 4; i++) px(r.top[0] - 6 + i * 2, r.top[1] - i, "#9a3a4a", 12 - i * 4, 1);
        top = [r.top[0], r.top[1] - 4];
        break;
      }
      case "warehouse": {
        const r = block(x, y, 12, "#4a3a3a", "#5a4848", 0.1, 0.04, 8);
        // sawtooth roof
        for (let i = 0; i < 4; i++) px(r.top[0] - 6 + i * 3, r.top[1] - 2, "#6a5858", 2, 2);
        px(r.top[0] + 5, r.top[1] - 12, "#3a2e2e", 2, 10);
        top = [r.top[0], r.top[1] - 3];
        break;
      }
      case "docks": {
        const r = block(x, y, 8, "#2a8a8a", "#3a9a9a", 0, 0.1, 1);
        // a crane over the water
        px(r.top[0] - 2, r.top[1] - 22, "#d8382e", 2, 22);
        px(r.top[0] - 12, r.top[1] - 22, "#d8382e", 14, 2);
        px(r.top[0] - 12, r.top[1] - 20, "#8a8a9a", 1, 8);
        px(r.top[0] - 1, r.top[1] - 23, "#ff2a3a", 1, 1);
        glows.push({ x: r.top[0] - 1, y: r.top[1] - 23, color: "#ff2a3a", r: 8, blink: true });
        top = [r.top[0], r.top[1] - 24];
        break;
      }
      case "harbor": {
        const r = block(x, y, 6, "#3a3448", "#4a4458", 0.2, 0.2, 2);
        top = [r.top[0], r.top[1]];
        break;
      }
      case "newsroom": {
        const r = block(x, y, 30, "#4a2a2a", "#5a3a3a", 0.42, 0.08, 3);
        const [lx, ly] = scr(x + 0.1, y + 0.92);
        px(lx + 1, ly - 26, "#ff2e88", 8, 3);
        glows.push({ x: lx + 5, y: ly - 25, color: "#ff2e88", r: 14 });
        top = [r.top[0], r.top[1] - 2];
        break;
      }
      case "university": {
        const r = block(x, y, 14, "#5a3a28", "#6a4a32", 0.25, 0.04, 6);
        px(r.top[0] - 1, r.top[1] - 12, "#c8b090", 3, 12);
        px(r.top[0] - 2, r.top[1] - 14, "#3a8a7a", 5, 2);
        top = [r.top[0], r.top[1] - 14];
        break;
      }
      case "forest": {
        tree(x, y, 7);
        const [sx, sy] = scr(x + 0.5, y + 0.5);
        top = [sx, sy - 10];
        break;
      }
      default: {
        const r = block(x, y, 16, "#3a2a4e", "#4a3a5e", 0.3);
        top = r.top;
      }
    }
    const [gx, gy] = scr(x + 0.5, y + 0.5);
    spots[loc.id] = { x: top[0], y: top[1], ground: gy };
    void gx;
  };

  // the model's base: a slab under the front edges, like a planner's table model
  {
    const L = scr(0, CN);
    const B = scr(CN, CN);
    const R = scr(CN, 0);
    const depth = 12;
    fillPoly(g, [L, B, [B[0], B[1] + depth], [L[0], L[1] + depth]], "#1a1428");
    fillPoly(g, [B, R, [R[0], R[1] + depth], [B[0], B[1] + depth]], "#120e1e");
    for (let i = 3; i < depth; i += 4) {
      g.fillStyle = "rgba(255,255,255,0.04)";
      for (let xx = Math.round(L[0]); xx < B[0]; xx++) g.fillRect(xx, Math.round(L[1] + ((xx - L[0]) * (B[1] - L[1])) / (B[0] - L[0]) + i), 1, 1);
      for (let xx = Math.round(B[0]); xx < R[0]; xx++) g.fillRect(xx, Math.round(B[1] + ((xx - B[0]) * (R[1] - B[1])) / (R[0] - B[0]) + i), 1, 1);
    }
    // a brass edge strip
    for (let xx = Math.round(L[0]); xx < B[0]; xx++) px(xx, L[1] + ((xx - L[0]) * (B[1] - L[1])) / (B[0] - L[0]), "#6a5a3a");
    for (let xx = Math.round(B[0]); xx < R[0]; xx++) px(xx, B[1] + ((xx - B[0]) * (R[1] - B[1])) / (R[0] - B[0]), "#4a3e2a");
  }
  for (let s = 0; s < CN * 2 - 1; s++) {
    for (let x = 0; x < CN; x++) {
      const y = s - x;
      if (y < 0 || y >= CN) continue;
      ground(x, y);
    }
  }
  for (let s = 0; s < CN * 2 - 1; s++) {
    for (let x = 0; x < CN; x++) {
      const y = s - x;
      if (y < 0 || y >= CN) continue;
      const lm = landmarkAt.get(`${x},${y}`);
      if (lm) {
        landmark(x, y, lm.loc);
        continue;
      }
      const z = zone[y][x];
      if (z === "water" || road[y][x]) continue;
      const q = hash2(x, y, 41);
      if (z === "forest") {
        tree(x, y, 4 + Math.floor(q * 4));
        continue;
      }
      if ((z === "university" || z === "suburbs") && q < 0.3) {
        tree(x, y, 3);
        continue;
      }
      if (q < 0.08) continue; // a plaza, a lot
      const p = PALETTE[z];
      let h = Math.round(p.hmin + Math.pow(hash2(x, y, 42), 1.6) * (p.hmax - p.hmin));
      // the skyline climbs toward the financial core
      if (z === "financial") h = Math.round(h * (0.7 + 0.6 * (1 - Math.min(1, Math.hypot(toMap(x) - 50, toMap(y) - 33) / 22))));
      const wall = mix(p.wall, hash2(x, y, 43) < 0.5 ? "#3a2a5a" : "#2a3a5a", 0.25);
      const r = block(x, y, h, wall, p.roof, p.lit, z === "harbor" || z === "industrial" ? 0.06 : 0.12, x * 3 + y);
      // rooftop life
      const q2 = hash2(x, y, 44);
      if (z === "industrial" && q2 < 0.35) {
        px(r.top[0] + 2, r.top[1] - 14, "#4a3a3a", 2, 14);
        px(r.top[0] + 2, r.top[1] - 15, "#ff7a2a", 2, 1);
        glows.push({ x: r.top[0] + 3, y: r.top[1] - 15, color: "#ff7a2a", r: 6 });
      } else if ((z === "financial" || z === "downtown") && h > 30 && q2 < 0.4) {
        px(r.top[0], r.top[1] - 7, "#6a6a80", 1, 7);
        px(r.top[0], r.top[1] - 8, "#ff2a3a", 1, 1);
        glows.push({ x: r.top[0], y: r.top[1] - 8, color: "#ff2a3a", r: 5, blink: true });
      } else if (z === "downtown" && q2 < 0.55) {
        // a neon sign on the corner
        const col = ["#ff2e88", "#3af0ff", "#ffb43d", "#b06aff"][Math.floor(q2 * 40) % 4];
        const [bx, by] = scr(x + 0.88, y + 0.88);
        px(bx, by - h + 3, col, 1, Math.min(8, h - 4));
        glows.push({ x: bx, y: by - h + 6, color: col, r: 8 });
      } else if (z === "suburbs" && q2 < 0.6) {
        for (let i = 0; i < 3; i++) px(r.top[0] - 4 + i * 2, r.top[1] - i, "#8a2a3a", 8 - i * 3, 1);
      }
      if (z === "harbor" && q2 < 0.25) {
        // stacked containers
        const col = ["#2ab0a8", "#d8382e", "#e88a1e", "#3a5ae0"][Math.floor(q2 * 16) % 4];
        px(r.top[0] - 4, r.top[1] - 4, col, 8, 3);
      }
    }
  }

  // a lighthouse on the point
  {
    let lx = -1;
    let ly = -1;
    for (let y = Math.floor(CN * 0.7); y < CN * 0.82 && lx < 0; y++) {
      for (let x = 0; x < CN; x++) {
        if (zone[y][x] !== "water" && x > 0 && zone[y][x - 1] === "water") {
          lx = x;
          ly = y;
          break;
        }
      }
    }
    if (lx >= 0) {
      const [sx, sy] = scr(lx + 0.3, ly + 0.5);
      for (let i = 0; i < 22; i++) px(sx - 1, sy - i, i % 6 < 3 ? "#e8e4f0" : "#d8382e", 3, 1);
      px(sx - 2, sy - 25, "#2a2430", 5, 3);
      px(sx - 1, sy - 24, "#fff4c8", 3, 1);
      lighthouse = { x: sx + 0.5, y: sy - 24 };
      glows.push({ x: sx + 0.5, y: sy - 24, color: "#fff0c0", r: 14 });
    }
  }

  // road runs for traffic: long straight stretches along both axes
  const roads: CityBake["roads"] = [];
  for (let y = 0; y < CN; y++) {
    let start = -1;
    for (let x = 0; x <= CN; x++) {
      const on = x < CN && road[y][x] && (road[y][x - 1] || road[y][x + 1]);
      if (on && start < 0) start = x;
      if (!on && start >= 0) {
        if (x - start >= 5) roads.push({ a: [start, y], b: [x - 1, y] });
        start = -1;
      }
    }
  }
  for (let x = 0; x < CN; x++) {
    let start = -1;
    for (let y = 0; y <= CN; y++) {
      const on = y < CN && road[y][x] && (road[y - 1]?.[x] || road[y + 1]?.[x]);
      if (on && start < 0) start = y;
      if (!on && start >= 0) {
        if (y - start >= 5) roads.push({ a: [x, start], b: [x, y - 1] });
        start = -1;
      }
    }
  }

  return { canvas, ox, oy, spots, glows, roads, lighthouse, searchlights };
}

/** canvas px of a tile-space point on the city model */
export function cityScreen(b: Pick<CityBake, "ox" | "oy">, x: number, y: number, z = 0): [number, number] {
  return [b.ox + (x - y) * HWm, b.oy + (x + y) * HHm - z];
}
