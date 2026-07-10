import type { SceneId, TimeOfDay, Weather } from "@/lib/engine/types";
import { rngFor } from "@/lib/engine/rng";

/**
 * Procedural pixel-art scene painter.
 *
 * Every scene is painted once, deterministically, onto a 480×270 canvas —
 * dithered skies, silhouetted architecture, warm interior light — and the
 * painter also returns the scene's living details (window lights, neon
 * tubes, smoke stacks) for the PixiJS stage to animate on top.
 */

export const SCENE_W = 480;
export const SCENE_H = 270;

/**
 * Shared stage geometry: cover the container, but never crop more than
 * ~30% of either axis. Used by the Pixi stage AND by DOM overlays
 * (hotspots) so interactive markers stay glued to scene pixels.
 */
export function sceneRect(cw: number, ch: number) {
  const cover = Math.max(cw / SCENE_W, ch / SCENE_H);
  const s = Math.min(cover, Math.min(cw / SCENE_W, ch / SCENE_H) * 1.42);
  return {
    s,
    x: (cw - SCENE_W * s) / 2,
    y: (ch - SCENE_H * s) / 2,
    w: SCENE_W * s,
    h: SCENE_H * s,
  };
}

export interface LightSpot {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  flicker: number; // 0 steady .. 1 candle
}

export interface NeonSign {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

export interface SmokeSource {
  x: number;
  y: number;
}

export interface PaintedScene {
  canvas: HTMLCanvasElement;
  lights: LightSpot[];
  neons: NeonSign[];
  smoke: SmokeSource[];
  horizon: number;
}

/* ------------------------------------------------------------------ */
/* palette helpers                                                     */
/* ------------------------------------------------------------------ */

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hex(a);
  const [br, bg, bb] = hex(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}
function shade(c: string, f: number): string {
  const [r, g, b] = hex(c);
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

interface Mood {
  skyTop: string;
  skyBottom: string;
  far: string;
  mid: string;
  near: string;
  glow: string;
  window: string;
  windowCool: string;
}

function moodFor(time: TimeOfDay, weather: Weather): Mood {
  if (time === "dusk") {
    return {
      skyTop: "#2b2a4a",
      skyBottom: "#c96f3f",
      far: "#3d3050",
      mid: "#2b2138",
      near: "#191225",
      glow: "#e8a849",
      window: "#ffc46b",
      windowCool: "#9fd8e8",
    };
  }
  if (time === "dawn") {
    return {
      skyTop: "#31405c",
      skyBottom: "#c98a6f",
      far: "#42506a",
      mid: "#2e3a50",
      near: "#1b2434",
      glow: "#e8c07a",
      window: "#ffd88a",
      windowCool: "#a8d8e0",
    };
  }
  // night
  const stormy = weather.kind === "storm" || weather.kind === "rain";
  return {
    skyTop: stormy ? "#0c1018" : "#101426",
    skyBottom: stormy ? "#1b2436" : "#26304e",
    far: "#1a2234",
    mid: "#121826",
    near: "#0a0e16",
    glow: "#e8a849",
    window: "#ffc46b",
    windowCool: "#8fd0e8",
  };
}

/* ------------------------------------------------------------------ */
/* drawing primitives                                                  */
/* ------------------------------------------------------------------ */

function ditherBands(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  top: string,
  bottom: string,
  bands: number,
  rnd: () => number
) {
  const bandH = h / bands;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    ctx.fillStyle = mix(top, bottom, t);
    ctx.fillRect(x, y + i * bandH, w, Math.ceil(bandH));
  }
  // dither seams
  for (let i = 1; i < bands; i++) {
    const yy = Math.round(y + i * bandH);
    const above = mix(top, bottom, (i - 1) / (bands - 1));
    const below = mix(top, bottom, i / (bands - 1));
    for (let px = x; px < x + w; px += 2) {
      if (rnd() < 0.5) {
        ctx.fillStyle = rnd() < 0.5 ? above : below;
        ctx.fillRect(px + (rnd() < 0.5 ? 0 : 1), yy - (rnd() < 0.5 ? 1 : 0), 1, 1);
      }
    }
  }
}

function stars(ctx: CanvasRenderingContext2D, rnd: () => number, horizon: number, density = 60) {
  for (let i = 0; i < density; i++) {
    const x = Math.floor(rnd() * SCENE_W);
    const y = Math.floor(rnd() * horizon * 0.8);
    ctx.fillStyle = rnd() < 0.3 ? "rgba(232,226,212,0.8)" : "rgba(232,226,212,0.35)";
    ctx.fillRect(x, y, 1, 1);
  }
}

function moon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = "rgba(230,225,205,0.95)";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(200,195,175,0.5)";
  ctx.fillRect(x - r * 0.4, y - r * 0.2, 2, 2);
  ctx.fillRect(x + r * 0.2, y + r * 0.3, 2, 1);
  // halo
  const grad = ctx.createRadialGradient(x, y, r, x, y, r * 4);
  grad.addColorStop(0, "rgba(230,225,205,0.18)");
  grad.addColorStop(1, "rgba(230,225,205,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
}

interface BuildingOpts {
  x: number;
  w: number;
  h: number;
  color: string;
  windowColor: string;
  litChance: number;
  rnd: () => number;
  lights: LightSpot[];
  ground: number;
  roof?: "flat" | "water" | "antenna" | "peak";
  collectLights?: boolean;
}

function building(ctx: CanvasRenderingContext2D, o: BuildingOpts) {
  const top = o.ground - o.h;
  ctx.fillStyle = o.color;
  ctx.fillRect(o.x, top, o.w, o.h);
  // roof furniture
  if (o.roof === "water" && o.w > 18) {
    ctx.fillRect(o.x + 4, top - 7, 8, 7);
    ctx.fillRect(o.x + 6, top - 9, 4, 2);
  } else if (o.roof === "antenna") {
    ctx.fillRect(o.x + Math.floor(o.w / 2), top - 10, 1, 10);
  } else if (o.roof === "peak") {
    for (let i = 0; i < Math.floor(o.w / 2); i++) {
      ctx.fillRect(o.x + i, top - i, o.w - i * 2, 1);
    }
  }
  // windows
  const cols = Math.max(1, Math.floor((o.w - 4) / 6));
  const rows = Math.max(1, Math.floor((o.h - 6) / 9));
  for (let cx = 0; cx < cols; cx++) {
    for (let cy = 0; cy < rows; cy++) {
      const wx = o.x + 3 + cx * 6;
      const wy = top + 4 + cy * 9;
      if (o.rnd() < o.litChance) {
        const col = o.rnd() < 0.82 ? o.windowColor : "#9fd8e8";
        ctx.fillStyle = col;
        ctx.fillRect(wx, wy, 3, 4);
        if (o.collectLights !== false && o.rnd() < 0.25) {
          o.lights.push({ x: wx, y: wy, w: 3, h: 4, color: col, flicker: o.rnd() < 0.3 ? 0.6 : 0.15 });
        }
      } else {
        ctx.fillStyle = shade(o.color, 0.7);
        ctx.fillRect(wx, wy, 3, 4);
      }
    }
  }
}

function lampPost(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  mood: Mood,
  lights: LightSpot[]
) {
  ctx.fillStyle = "#05070c";
  ctx.fillRect(x, ground - 34, 2, 34);
  ctx.fillRect(x - 4, ground - 34, 10, 2);
  ctx.fillStyle = mood.window;
  ctx.fillRect(x - 4, ground - 32, 3, 3);
  lights.push({ x: x - 4, y: ground - 32, w: 3, h: 3, color: mood.window, flicker: 0.2 });
  // pool of light
  const grad = ctx.createRadialGradient(x - 2, ground, 2, x - 2, ground, 26);
  grad.addColorStop(0, "rgba(232,168,73,0.22)");
  grad.addColorStop(1, "rgba(232,168,73,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(x - 30, ground - 26, 56, 27);
}

function wetReflections(
  ctx: CanvasRenderingContext2D,
  ground: number,
  mood: Mood,
  rnd: () => number,
  neons: NeonSign[]
) {
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rnd() * SCENE_W);
    const y = ground + Math.floor(rnd() * (SCENE_H - ground));
    ctx.fillStyle =
      rnd() < 0.5
        ? "rgba(232,168,73,0.12)"
        : rnd() < 0.5
          ? "rgba(143,208,232,0.10)"
          : "rgba(232,226,212,0.06)";
    ctx.fillRect(x, y, 1 + Math.floor(rnd() * 3), 1);
  }
  for (const n of neons) {
    ctx.fillStyle = n.color.replace("rgb", "rgba").replace(")", ",0.14)");
    for (let i = 0; i < 6; i++) {
      const y = ground + 2 + i * 3 + Math.floor(rnd() * 2);
      if (y < SCENE_H) ctx.fillRect(n.x + Math.floor(rnd() * 4) - 2, y, n.w - Math.floor(rnd() * 6), 1);
    }
  }
}

/* ------------------------------------------------------------------ */
/* interior helpers                                                    */
/* ------------------------------------------------------------------ */

function interiorRoom(
  ctx: CanvasRenderingContext2D,
  wall: string,
  floor: string,
  mood: Mood,
  rnd: () => number
) {
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, SCENE_W, 190);
  // wall texture
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = rnd() < 0.5 ? shade(wall, 0.92) : shade(wall, 1.08);
    ctx.fillRect(Math.floor(rnd() * SCENE_W), Math.floor(rnd() * 188), 2, 1);
  }
  ctx.fillStyle = floor;
  ctx.fillRect(0, 190, SCENE_W, SCENE_H - 190);
  // floorboards
  ctx.fillStyle = shade(floor, 0.8);
  for (let y = 196; y < SCENE_H; y += 8) ctx.fillRect(0, y, SCENE_W, 1);
  for (let i = 0; i < 20; i++) {
    ctx.fillRect(Math.floor(rnd() * SCENE_W), 190 + Math.floor(rnd() * 78), 1, 6);
  }
  // skirting
  ctx.fillStyle = shade(wall, 0.6);
  ctx.fillRect(0, 187, SCENE_W, 3);
}

function tallWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  mood: Mood,
  weather: Weather,
  rnd: () => number,
  lights: LightSpot[]
) {
  ctx.fillStyle = "#0a0d16";
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  // night city beyond
  ditherBands(ctx, x, y, w, h, mood.skyTop, mood.skyBottom, 5, rnd);
  for (let i = 0; i < Math.floor(w / 5); i++) {
    const bx = x + 1 + i * 5;
    const bh = 8 + Math.floor(rnd() * (h * 0.4));
    ctx.fillStyle = "#0d1220";
    ctx.fillRect(bx, y + h - bh, 4, bh);
    if (rnd() < 0.7) {
      ctx.fillStyle = rnd() < 0.7 ? mood.window : mood.windowCool;
      const wy = y + h - bh + 2 + Math.floor(rnd() * Math.max(1, bh - 4));
      ctx.fillRect(bx + 1, wy, 1, 2);
      lights.push({ x: bx + 1, y: wy, w: 1, h: 2, color: mood.window, flicker: 0.3 });
    }
  }
  // rain streaks on glass
  if (weather.kind === "rain" || weather.kind === "storm") {
    ctx.fillStyle = "rgba(200,220,240,0.16)";
    for (let i = 0; i < 14; i++) {
      const rx = x + Math.floor(rnd() * w);
      ctx.fillRect(rx, y + Math.floor(rnd() * h * 0.5), 1, 4 + Math.floor(rnd() * (h * 0.4)));
    }
  }
  // mullions
  ctx.fillStyle = "#0a0d16";
  ctx.fillRect(x + Math.floor(w / 2), y, 2, h);
  ctx.fillRect(x, y + Math.floor(h / 2), w, 2);
}

function deskLamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  mood: Mood,
  lights: LightSpot[],
  dir = 1
) {
  ctx.fillStyle = "#05070c";
  ctx.fillRect(x, y - 10, 2, 10);
  ctx.fillRect(x + (dir > 0 ? 0 : -6), y - 12, 8, 3);
  ctx.fillStyle = mood.window;
  ctx.fillRect(x + (dir > 0 ? 4 : -4), y - 9, 3, 2);
  lights.push({ x: x + (dir > 0 ? 4 : -4), y: y - 9, w: 3, h: 2, color: mood.window, flicker: 0.1 });
  const grad = ctx.createRadialGradient(x + 4 * dir, y, 2, x + 4 * dir, y, 22);
  grad.addColorStop(0, "rgba(255,196,107,0.30)");
  grad.addColorStop(1, "rgba(255,196,107,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(x - 24, y - 18, 52, 26);
}

/* ------------------------------------------------------------------ */
/* scene painters                                                      */
/* ------------------------------------------------------------------ */

type Painter = (
  ctx: CanvasRenderingContext2D,
  mood: Mood,
  weather: Weather,
  rnd: () => number,
  out: PaintedScene
) => void;

const paintSkyline: Painter = (ctx, mood, weather, rnd, out) => {
  const horizon = 210;
  out.horizon = horizon;
  ditherBands(ctx, 0, 0, SCENE_W, horizon, mood.skyTop, mood.skyBottom, 8, rnd);
  if (weather.kind === "clear" || weather.kind === "wind") {
    stars(ctx, rnd, horizon);
    moon(ctx, 390, 46, 9);
  }
  // far towers
  for (let x = -10; x < SCENE_W; x += 14 + Math.floor(rnd() * 20)) {
    building(ctx, {
      x, w: 16 + Math.floor(rnd() * 20), h: 60 + Math.floor(rnd() * 80),
      color: mood.far, windowColor: mix(mood.window, mood.far, 0.45),
      litChance: 0.35, rnd, lights: out.lights, ground: horizon, collectLights: false,
      roof: rnd() < 0.3 ? "antenna" : "flat",
    });
  }
  // mid towers
  for (let x = -6; x < SCENE_W; x += 30 + Math.floor(rnd() * 34)) {
    building(ctx, {
      x, w: 26 + Math.floor(rnd() * 30), h: 90 + Math.floor(rnd() * 90),
      color: mood.mid, windowColor: mood.window,
      litChance: 0.42, rnd, lights: out.lights, ground: horizon + 6,
      roof: rnd() < 0.4 ? "water" : rnd() < 0.4 ? "antenna" : "flat",
    });
    if (rnd() < 0.35) out.smoke.push({ x: x + 8, y: horizon + 6 - 90 - Math.floor(rnd() * 60) });
  }
  // near block + street
  ctx.fillStyle = mood.near;
  ctx.fillRect(0, horizon + 14, SCENE_W, SCENE_H - horizon - 14);
  building(ctx, { x: 0, w: 70, h: 110, color: mood.near, windowColor: mood.window, litChance: 0.5, rnd, lights: out.lights, ground: 250 });
  building(ctx, { x: 410, w: 70, h: 96, color: mood.near, windowColor: mood.window, litChance: 0.5, rnd, lights: out.lights, ground: 250 });
  out.neons.push({ x: 424, y: 168, w: 40, h: 8, color: "rgb(79,216,196)" });
  out.neons.push({ x: 12, y: 154, w: 34, h: 8, color: "rgb(224,92,110)" });
  lampPost(ctx, 130, 250, mood, out.lights);
  lampPost(ctx, 320, 250, mood, out.lights);
  if (weather.kind === "rain" || weather.kind === "storm") wetReflections(ctx, 250, mood, rnd, out.neons);
};

const paintHarbor: Painter = (ctx, mood, weather, rnd, out) => {
  const horizon = 160;
  out.horizon = horizon;
  ditherBands(ctx, 0, 0, SCENE_W, horizon, mood.skyTop, mix(mood.skyBottom, "#4a5a6a", 0.4), 8, rnd);
  if (weather.kind === "clear") { stars(ctx, rnd, horizon); moon(ctx, 80, 40, 8); }
  // water
  ditherBands(ctx, 0, horizon, SCENE_W, SCENE_H - horizon, mix(mood.skyBottom, "#101826", 0.7), "#080c14", 6, rnd);
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = rnd() < 0.4 ? "rgba(232,168,73,0.10)" : "rgba(180,200,220,0.08)";
    ctx.fillRect(Math.floor(rnd() * SCENE_W), horizon + 4 + Math.floor(rnd() * 90), 2 + Math.floor(rnd() * 4), 1);
  }
  // far shore — a low dark strip with a few scattered lights
  ctx.fillStyle = shade(mood.far, 0.7);
  ctx.fillRect(0, horizon - 8, SCENE_W, 8);
  for (let x = 0; x < SCENE_W; x += 20 + Math.floor(rnd() * 26)) {
    ctx.fillStyle = shade(mood.far, 0.8);
    ctx.fillRect(x, horizon - 10 - Math.floor(rnd() * 6), 6 + Math.floor(rnd() * 8), 10);
    if (rnd() < 0.6) {
      ctx.fillStyle = mix(mood.window, mood.far, 0.5);
      ctx.fillRect(x + 2, horizon - 8 + Math.floor(rnd() * 4), 1, 1);
    }
  }
  // moored ship silhouette — hard dark against the water
  ctx.fillStyle = "#060910";
  ctx.fillRect(280, 134, 156, 30);
  ctx.beginPath();
  ctx.moveTo(436, 134);
  ctx.lineTo(452, 148);
  ctx.lineTo(436, 164);
  ctx.fill();
  ctx.fillRect(308, 112, 22, 24);
  ctx.fillRect(342, 120, 40, 16);
  ctx.fillRect(314, 100, 4, 12);
  ctx.fillStyle = mood.window;
  ctx.fillRect(320, 142, 2, 2);
  ctx.fillRect(346, 142, 2, 2);
  ctx.fillRect(370, 142, 2, 2);
  out.lights.push({ x: 320, y: 142, w: 2, h: 2, color: mood.window, flicker: 0.3 });
  out.lights.push({ x: 370, y: 142, w: 2, h: 2, color: mood.window, flicker: 0.2 });
  // nav lights
  ctx.fillStyle = "#e05c5c";
  ctx.fillRect(448, 144, 2, 2);
  ctx.fillStyle = "#4fd88a";
  ctx.fillRect(282, 138, 2, 2);
  out.lights.push({ x: 448, y: 144, w: 2, h: 2, color: "#e05c5c", flicker: 0.5 });
  out.smoke.push({ x: 315, y: 98 });
  // ship reflection
  ctx.fillStyle = "rgba(255,196,107,0.10)";
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(300 + Math.floor(rnd() * 120), 168 + i * 5, 10 + Math.floor(rnd() * 22), 1);
  }
  // pier deck
  ctx.fillStyle = "#0c0f16";
  ctx.fillRect(0, 220, SCENE_W, 50);
  ctx.fillStyle = shade("#0c0f16", 1.4);
  for (let x = 0; x < SCENE_W; x += 16) ctx.fillRect(x, 222, 1, 48);
  // crane — centered enough to survive any crop
  ctx.fillStyle = "#05080e";
  ctx.fillRect(118, 78, 5, 142);
  ctx.fillRect(118, 78, 104, 5);
  ctx.fillRect(214, 83, 2, 34);
  ctx.fillRect(207, 117, 16, 9);
  for (let i = 0; i < 5; i++) ctx.fillRect(126 + i * 18, 83, 1, 8);
  ctx.fillStyle = "#e05c5c";
  ctx.fillRect(119, 76, 3, 2);
  out.lights.push({ x: 119, y: 76, w: 3, h: 2, color: "#e05c5c", flicker: 0.6 });
  // harbor office
  building(ctx, { x: 168, w: 58, h: 46, color: shade(mood.near, 1.4), windowColor: mood.window, litChance: 0.85, rnd, lights: out.lights, ground: 220, roof: "flat" });
  // office glow on the water edge
  ctx.fillStyle = "rgba(255,196,107,0.08)";
  ctx.fillRect(160, 214, 76, 6);
  lampPost(ctx, 258, 220, mood, out.lights);
  lampPost(ctx, 96, 220, mood, out.lights);
  lampPost(ctx, 396, 220, mood, out.lights);
  // bollards
  for (const bx of [30, 140, 288, 372]) {
    ctx.fillStyle = "#04060a";
    ctx.fillRect(bx, 212, 7, 10);
    ctx.fillRect(bx + 1, 210, 5, 2);
  }
  if (weather.kind === "rain" || weather.kind === "storm") wetReflections(ctx, 220, mood, rnd, out.neons);
};

const paintDocks = paintHarbor;

const paintStreet: Painter = (ctx, mood, weather, rnd, out) => {
  const horizon = 190;
  out.horizon = horizon;
  ditherBands(ctx, 0, 0, SCENE_W, horizon, mood.skyTop, mood.skyBottom, 8, rnd);
  // street canyon: buildings both sides
  building(ctx, { x: 0, w: 92, h: 150, color: mood.mid, windowColor: mood.window, litChance: 0.5, rnd, lights: out.lights, ground: 230, roof: "water" });
  building(ctx, { x: 92, w: 66, h: 120, color: shade(mood.mid, 0.85), windowColor: mood.window, litChance: 0.45, rnd, lights: out.lights, ground: 230 });
  building(ctx, { x: 330, w: 70, h: 132, color: shade(mood.mid, 0.9), windowColor: mood.window, litChance: 0.5, rnd, lights: out.lights, ground: 230, roof: "antenna" });
  building(ctx, { x: 400, w: 80, h: 156, color: mood.mid, windowColor: mood.window, litChance: 0.55, rnd, lights: out.lights, ground: 230, roof: "water" });
  // distant vanishing street
  ditherBands(ctx, 158, 120, 172, 70, mood.far, mood.mid, 4, rnd);
  for (let i = 0; i < 8; i++) {
    const bx = 165 + i * 21;
    building(ctx, { x: bx, w: 16, h: 30 + Math.floor(rnd() * 30), color: shade(mood.far, 0.9), windowColor: mix(mood.window, mood.far, 0.4), litChance: 0.4, rnd, lights: out.lights, ground: 190, collectLights: false });
  }
  // shopfronts + awnings
  ctx.fillStyle = "#12100e";
  ctx.fillRect(0, 196, 92, 34);
  ctx.fillStyle = mood.window;
  ctx.fillRect(8, 200, 30, 22);
  out.lights.push({ x: 8, y: 200, w: 30, h: 22, color: mood.window, flicker: 0.08 });
  ctx.fillStyle = "#5e2c38";
  for (let i = 0; i < 6; i++) ctx.fillRect(4 + i * 14, 192, 12, 5);
  // café silhouette figures
  ctx.fillStyle = "#0a0806";
  ctx.fillRect(16, 208, 5, 12);
  ctx.fillRect(28, 210, 5, 10);
  // neon signs
  out.neons.push({ x: 404, y: 120, w: 10, h: 44, color: "rgb(79,216,196)" });
  out.neons.push({ x: 96, y: 140, w: 36, h: 9, color: "rgb(224,92,110)" });
  out.neons.push({ x: 340, y: 150, w: 30, h: 8, color: "rgb(232,168,73)" });
  // road
  ctx.fillStyle = "#0a0c12";
  ctx.fillRect(0, 230, SCENE_W, 40);
  ctx.fillStyle = "rgba(232,226,212,0.25)";
  for (let x = 10; x < SCENE_W; x += 34) ctx.fillRect(x, 248, 14, 2);
  lampPost(ctx, 150, 230, mood, out.lights);
  lampPost(ctx, 336, 230, mood, out.lights);
  // parked car silhouette
  ctx.fillStyle = "#070a10";
  ctx.fillRect(196, 216, 60, 12);
  ctx.fillRect(208, 209, 34, 8);
  ctx.fillStyle = "#04060a";
  ctx.fillRect(204, 226, 10, 5);
  ctx.fillRect(240, 226, 10, 5);
  ctx.fillStyle = "rgba(255,196,107,0.5)";
  ctx.fillRect(254, 219, 3, 2);
  if (weather.kind === "rain" || weather.kind === "storm") wetReflections(ctx, 230, mood, rnd, out.neons);
};

const paintUniversity: Painter = (ctx, mood, weather, rnd, out) => {
  const horizon = 200;
  out.horizon = horizon;
  ditherBands(ctx, 0, 0, SCENE_W, horizon, mood.skyTop, mood.skyBottom, 8, rnd);
  if (weather.kind === "clear") stars(ctx, rnd, horizon);
  // main hall with clock tower
  ctx.fillStyle = mood.mid;
  ctx.fillRect(120, 110, 240, 110);
  ctx.fillRect(215, 60, 50, 60);
  // peak roofs
  for (let i = 0; i < 25; i++) ctx.fillRect(215 + i, 60 - i * 0.6, 50 - i * 2, 1);
  // clock
  ctx.fillStyle = mood.window;
  ctx.beginPath();
  ctx.arc(240, 84, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#12100c";
  ctx.fillRect(239, 77, 2, 8);
  ctx.fillRect(240, 83, 6, 2);
  out.lights.push({ x: 232, y: 76, w: 17, h: 17, color: mood.window, flicker: 0.05 });
  // arched windows
  for (let i = 0; i < 9; i++) {
    const wx = 132 + i * 26;
    ctx.fillStyle = rnd() < 0.6 ? mood.window : shade(mood.mid, 0.7);
    ctx.fillRect(wx, 150, 8, 18);
    if (rnd() < 0.6) out.lights.push({ x: wx, y: 150, w: 8, h: 18, color: mood.window, flicker: 0.1 });
  }
  // side wings
  building(ctx, { x: 20, w: 84, h: 84, color: shade(mood.mid, 0.85), windowColor: mood.window, litChance: 0.35, rnd, lights: out.lights, ground: 220, roof: "peak" });
  building(ctx, { x: 380, w: 84, h: 76, color: shade(mood.mid, 0.85), windowColor: mood.window, litChance: 0.35, rnd, lights: out.lights, ground: 220, roof: "peak" });
  // lawn & path
  ctx.fillStyle = "#0c1410";
  ctx.fillRect(0, 220, SCENE_W, 50);
  ctx.fillStyle = "#141210";
  ctx.fillRect(210, 220, 60, 50);
  // trees
  for (const tx of [70, 150, 330, 410]) {
    ctx.fillStyle = "#05080c";
    ctx.fillRect(tx, 196, 3, 26);
    ctx.beginPath();
    ctx.arc(tx + 1, 190, 12 + rnd() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  lampPost(ctx, 200, 222, mood, out.lights);
  lampPost(ctx, 280, 222, mood, out.lights);
};

const paintForest: Painter = (ctx, mood, weather, rnd, out) => {
  const horizon = 180;
  out.horizon = horizon;
  ditherBands(ctx, 0, 0, SCENE_W, SCENE_H, mood.skyTop, mix(mood.skyBottom, "#1a2a2a", 0.6), 10, rnd);
  if (weather.kind === "clear") { stars(ctx, rnd, 160); moon(ctx, 350, 50, 10); }
  // mountain ridges
  ctx.fillStyle = mix(mood.far, "#1a2430", 0.5);
  ctx.beginPath();
  ctx.moveTo(0, 150);
  for (let x = 0; x <= SCENE_W; x += 40) ctx.lineTo(x, 110 + rnd() * 50);
  ctx.lineTo(SCENE_W, 200);
  ctx.lineTo(0, 200);
  ctx.fill();
  // pine layers
  for (const [yBase, color, size] of [
    [200, shade("#0e1a16", 1.3), 26],
    [225, "#0a1410", 34],
    [258, "#060c0a", 46],
  ] as [number, string, number][]) {
    ctx.fillStyle = color;
    ctx.fillRect(0, yBase, SCENE_W, SCENE_H - yBase);
    for (let x = -10; x < SCENE_W + 10; x += 14 + Math.floor(rnd() * 10)) {
      const h = size + rnd() * size * 0.5;
      for (let i = 0; i < h; i += 3) {
        const w = 2 + (i / h) * (size * 0.5);
        ctx.fillRect(x - w / 2, yBase - h + i, w, 3);
      }
      ctx.fillRect(x - 1, yBase - 3, 2, 4);
    }
  }
  // winding road
  ctx.fillStyle = "#10141a";
  ctx.beginPath();
  ctx.moveTo(180, SCENE_H);
  ctx.quadraticCurveTo(240, 230, 300, 214);
  ctx.lineTo(330, 214);
  ctx.quadraticCurveTo(260, 236, 250, SCENE_H);
  ctx.fill();
  ctx.fillStyle = "rgba(232,226,212,0.2)";
  ctx.fillRect(240, 250, 3, 2);
  ctx.fillRect(258, 232, 3, 2);
  ctx.fillRect(280, 220, 3, 2);
  // lone car headlights
  ctx.fillStyle = "#070a10";
  ctx.fillRect(288, 208, 26, 8);
  ctx.fillStyle = "rgba(255,230,180,0.9)";
  ctx.fillRect(312, 211, 3, 2);
  out.lights.push({ x: 312, y: 211, w: 3, h: 2, color: "#ffe6b4", flicker: 0.1 });
  const grad = ctx.createRadialGradient(318, 212, 1, 330, 212, 30);
  grad.addColorStop(0, "rgba(255,230,180,0.25)");
  grad.addColorStop(1, "rgba(255,230,180,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(312, 200, 60, 24);
};

const paintStation: Painter = (ctx, mood, weather, rnd, out) => {
  const horizon = 120;
  out.horizon = horizon;
  // grand iron canopy interior
  ditherBands(ctx, 0, 0, SCENE_W, SCENE_H, "#0c1018", "#1a2130", 8, rnd);
  // arched roof ribs
  ctx.strokeStyle = "#060910";
  ctx.lineWidth = 4;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(240, 260, 240 - i * 34, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
  }
  // glazing glow between ribs
  ctx.fillStyle = "rgba(143,208,232,0.05)";
  ctx.fillRect(0, 0, SCENE_W, 90);
  // big clock
  ctx.fillStyle = "#e8e2d4";
  ctx.beginPath();
  ctx.arc(240, 80, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#12100c";
  ctx.fillRect(239, 70, 2, 11);
  ctx.fillRect(240, 79, 8, 2);
  out.lights.push({ x: 226, y: 66, w: 28, h: 28, color: "#e8e2d4", flicker: 0.03 });
  // platform
  ctx.fillStyle = "#141822";
  ctx.fillRect(0, 210, SCENE_W, 60);
  ctx.fillStyle = "#e8a849";
  ctx.fillRect(0, 212, SCENE_W, 2);
  // train
  ctx.fillStyle = "#0a0e16";
  ctx.fillRect(20, 150, 300, 60);
  ctx.fillStyle = shade("#0a0e16", 1.5);
  ctx.fillRect(20, 150, 300, 4);
  for (let i = 0; i < 8; i++) {
    const wx = 36 + i * 36;
    ctx.fillStyle = rnd() < 0.75 ? mood.window : "#1a2030";
    ctx.fillRect(wx, 162, 18, 14);
    if (rnd() < 0.4) out.lights.push({ x: wx, y: 162, w: 18, h: 14, color: mood.window, flicker: 0.06 });
  }
  ctx.fillStyle = "rgba(255,100,80,0.9)";
  ctx.fillRect(316, 186, 3, 3);
  out.smoke.push({ x: 40, y: 146 });
  // taxi at right
  ctx.fillStyle = "#8a6a14";
  ctx.fillRect(370, 222, 66, 16);
  ctx.fillRect(384, 212, 38, 12);
  ctx.fillStyle = "#04060a";
  ctx.fillRect(380, 234, 10, 6);
  ctx.fillRect(420, 234, 10, 6);
  ctx.fillStyle = mood.window;
  ctx.fillRect(388, 215, 12, 7);
  ctx.fillStyle = "#e8e2d4";
  ctx.fillRect(398, 206, 12, 5);
  out.lights.push({ x: 398, y: 206, w: 12, h: 5, color: "#e8e2d4", flicker: 0.1 });
  // hanging lamps
  for (const lx of [90, 200, 310]) {
    ctx.fillStyle = "#05070c";
    ctx.fillRect(lx, 96, 1, 18);
    ctx.fillStyle = mood.window;
    ctx.fillRect(lx - 4, 114, 9, 4);
    out.lights.push({ x: lx - 4, y: 114, w: 9, h: 4, color: mood.window, flicker: 0.12 });
  }
  // travellers
  ctx.fillStyle = "#05070c";
  ctx.fillRect(150, 190, 6, 20);
  ctx.fillRect(160, 194, 5, 16);
  ctx.fillRect(260, 192, 6, 18);
};

const paintWarehouse: Painter = (ctx, mood, weather, rnd, out) => {
  const horizon = 170;
  out.horizon = horizon;
  ditherBands(ctx, 0, 0, SCENE_W, horizon, mood.skyTop, mix(mood.skyBottom, "#3a3230", 0.5), 8, rnd);
  // smokestacks on skyline
  for (const [sx, sh] of [[60, 90], [90, 70], [380, 100], [420, 60]] as [number, number][]) {
    ctx.fillStyle = mood.far;
    ctx.fillRect(sx, horizon - sh, 14, sh);
    ctx.fillRect(sx - 2, horizon - sh, 18, 4);
    if (rnd() < 0.7) out.smoke.push({ x: sx + 7, y: horizon - sh - 2 });
  }
  // big shed
  ctx.fillStyle = mood.mid;
  ctx.fillRect(120, 100, 250, 120);
  for (let i = 0; i < 32; i++) ctx.fillRect(120 + i * 4, 96 - i * 0.5, 4, 6);
  // corrugation
  ctx.fillStyle = shade(mood.mid, 0.85);
  for (let x = 124; x < 366; x += 6) ctx.fillRect(x, 104, 1, 112);
  // broken windows band
  for (let i = 0; i < 10; i++) {
    const wx = 136 + i * 23;
    ctx.fillStyle = rnd() < 0.4 ? "rgba(143,208,232,0.25)" : "#0c1018";
    ctx.fillRect(wx, 116, 12, 10);
    if (rnd() < 0.3) {
      ctx.fillStyle = "#0c1018";
      ctx.fillRect(wx + Math.floor(rnd() * 8), 116, 4, 5);
    }
  }
  // open door glow
  ctx.fillStyle = "#0a0c12";
  ctx.fillRect(220, 168, 50, 52);
  ctx.fillStyle = "rgba(232,168,73,0.35)";
  ctx.fillRect(226, 172, 18, 48);
  out.lights.push({ x: 226, y: 172, w: 18, h: 48, color: "#e8a849", flicker: 0.5 });
  // ground, crates, drum fire
  ctx.fillStyle = "#0c0e12";
  ctx.fillRect(0, 220, SCENE_W, 50);
  ctx.fillStyle = "#141210";
  ctx.fillRect(60, 206, 22, 14);
  ctx.fillRect(84, 212, 16, 8);
  ctx.fillRect(330, 204, 26, 16);
  ctx.fillStyle = shade("#141210", 1.4);
  ctx.fillRect(60, 206, 22, 2);
  ctx.fillRect(330, 204, 26, 2);
  // fence
  ctx.fillStyle = "#05070c";
  for (let x = 0; x < SCENE_W; x += 8) ctx.fillRect(x, 196, 1, 26);
  ctx.fillRect(0, 196, SCENE_W, 2);
  lampPost(ctx, 300, 220, mood, out.lights);
};

const paintPrecinct: Painter = (ctx, mood, weather, rnd, out) => {
  out.horizon = 190;
  interiorRoom(ctx, "#1c2230", "#181410", mood, rnd);
  tallWindow(ctx, 30, 30, 70, 120, mood, weather, rnd, out.lights);
  tallWindow(ctx, 370, 30, 70, 120, mood, weather, rnd, out.lights);
  // wall clock
  ctx.fillStyle = "#e8e2d4";
  ctx.beginPath();
  ctx.arc(240, 46, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#12100c";
  ctx.fillRect(239, 39, 2, 8);
  ctx.fillRect(240, 45, 6, 2);
  // corkboard
  ctx.fillStyle = "#3a2c1c";
  ctx.fillRect(150, 70, 180, 70);
  ctx.fillStyle = "#2a2014";
  ctx.fillRect(154, 74, 172, 62);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = rnd() < 0.5 ? "#e8e2d4" : "#c9c2b0";
    ctx.fillRect(160 + Math.floor(rnd() * 150), 78 + Math.floor(rnd() * 46), 12, 9);
  }
  ctx.strokeStyle = "rgba(224,92,110,0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(180, 90);
  ctx.lineTo(280, 120);
  ctx.lineTo(240, 84);
  ctx.stroke();
  // desks
  for (const [dx, dy] of [[70, 200], [230, 208], [370, 200]] as [number, number][]) {
    ctx.fillStyle = "#241c12";
    ctx.fillRect(dx, dy, 80, 8);
    ctx.fillRect(dx + 6, dy + 8, 6, 22);
    ctx.fillRect(dx + 68, dy + 8, 6, 22);
    // typewriter
    ctx.fillStyle = "#0a0c10";
    ctx.fillRect(dx + 16, dy - 8, 20, 8);
    ctx.fillRect(dx + 18, dy - 11, 16, 3);
    // papers
    ctx.fillStyle = "#c9c2b0";
    ctx.fillRect(dx + 46, dy - 3, 16, 3);
    deskLamp(ctx, dx + 66, dy, mood, out.lights, -1);
  }
  // hanging lights
  for (const lx of [120, 240, 360]) {
    ctx.fillStyle = "#05070c";
    ctx.fillRect(lx, 0, 1, 22);
    ctx.fillStyle = "#0e1218";
    ctx.fillRect(lx - 8, 22, 17, 5);
    ctx.fillStyle = mood.window;
    ctx.fillRect(lx - 5, 27, 11, 3);
    out.lights.push({ x: lx - 5, y: 27, w: 11, h: 3, color: mood.window, flicker: 0.1 });
  }
  // radiator
  ctx.fillStyle = "#2a3040";
  for (let i = 0; i < 8; i++) ctx.fillRect(120 + i * 4, 164, 3, 22);
};

const paintMorgue: Painter = (ctx, mood, weather, rnd, out) => {
  out.horizon = 190;
  interiorRoom(ctx, "#16202a", "#101820", mood, rnd);
  // cold tile walls
  ctx.fillStyle = "rgba(143,208,232,0.05)";
  for (let y = 20; y < 180; y += 22) for (let x = 10; x < 470; x += 26) ctx.fillRect(x, y, 24, 20);
  // cooler doors
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const dx = 300 + i * 54;
      const dy = 60 + j * 52;
      ctx.fillStyle = "#222c38";
      ctx.fillRect(dx, dy, 48, 46);
      ctx.fillStyle = "#161e28";
      ctx.fillRect(dx + 3, dy + 3, 42, 40);
      ctx.fillStyle = "#8a97a8";
      ctx.fillRect(dx + 34, dy + 20, 8, 4);
    }
  }
  // examination table
  ctx.fillStyle = "#8a97a8";
  ctx.fillRect(100, 196, 130, 6);
  ctx.fillStyle = "#6a7788";
  ctx.fillRect(100, 202, 130, 3);
  ctx.fillStyle = "#3a4250";
  ctx.fillRect(114, 205, 8, 26);
  ctx.fillRect(208, 205, 8, 26);
  // sheeted figure
  ctx.fillStyle = "#d8d2c4";
  ctx.fillRect(108, 186, 114, 10);
  ctx.fillRect(116, 183, 22, 4);
  // surgical light
  ctx.fillStyle = "#05070c";
  ctx.fillRect(164, 0, 2, 30);
  ctx.fillStyle = "#222c38";
  ctx.fillRect(148, 30, 34, 8);
  ctx.fillStyle = "#e8f4f8";
  ctx.fillRect(152, 38, 26, 4);
  out.lights.push({ x: 152, y: 38, w: 26, h: 4, color: "#dff2f8", flicker: 0.06 });
  const grad = ctx.createRadialGradient(165, 60, 4, 165, 130, 110);
  grad.addColorStop(0, "rgba(223,242,248,0.16)");
  grad.addColorStop(1, "rgba(223,242,248,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(60, 40, 210, 180);
  // Rook's kettle corner
  ctx.fillStyle = "#241c12";
  ctx.fillRect(20, 200, 60, 8);
  ctx.fillRect(26, 208, 5, 20);
  ctx.fillRect(68, 208, 5, 20);
  ctx.fillStyle = "#8a97a8";
  ctx.fillRect(34, 190, 14, 10);
  ctx.fillRect(48, 192, 5, 3);
  out.smoke.push({ x: 40, y: 188 });
  deskLamp(ctx, 66, 200, mood, out.lights, -1);
  // clipboard wall
  ctx.fillStyle = "#c9c2b0";
  ctx.fillRect(40, 80, 16, 22);
  ctx.fillRect(64, 84, 16, 22);
  ctx.fillStyle = "#3a3430";
  ctx.fillRect(44, 76, 8, 5);
  ctx.fillRect(68, 80, 8, 5);
};

const paintHotel: Painter = (ctx, mood, weather, rnd, out) => {
  out.horizon = 190;
  interiorRoom(ctx, "#241a20", "#1a1014", mood, rnd);
  // ballroom columns
  for (const cx of [40, 150, 330, 440]) {
    ctx.fillStyle = "#2e222a";
    ctx.fillRect(cx, 20, 14, 170);
    ctx.fillStyle = "#3c2c36";
    ctx.fillRect(cx, 20, 3, 170);
    ctx.fillStyle = "#4a3640";
    ctx.fillRect(cx - 3, 14, 20, 8);
    ctx.fillRect(cx - 3, 184, 20, 8);
  }
  // chandeliers
  for (const chx of [120, 240, 360]) {
    ctx.fillStyle = "#05070c";
    ctx.fillRect(chx, 0, 1, 18);
    ctx.fillStyle = "#8a7a4a";
    ctx.fillRect(chx - 12, 18, 25, 3);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = mood.window;
      ctx.fillRect(chx - 11 + i * 6, 21, 2, 4);
      out.lights.push({ x: chx - 11 + i * 6, y: 21, w: 2, h: 4, color: mood.window, flicker: 0.25 });
    }
  }
  // tall window with rain
  tallWindow(ctx, 396, 40, 60, 130, mood, weather, rnd, out.lights);
  // grand piano
  ctx.fillStyle = "#0a0808";
  ctx.beginPath();
  ctx.moveTo(180, 180);
  ctx.quadraticCurveTo(300, 160, 310, 196);
  ctx.lineTo(300, 214);
  ctx.lineTo(190, 214);
  ctx.fill();
  ctx.fillRect(190, 168, 100, 20);
  // raised lid
  ctx.beginPath();
  ctx.moveTo(190, 170);
  ctx.lineTo(285, 130);
  ctx.lineTo(292, 170);
  ctx.fill();
  ctx.fillStyle = "#1a1616";
  ctx.fillRect(190, 168, 100, 3);
  // keys
  ctx.fillStyle = "#e8e2d4";
  ctx.fillRect(192, 190, 70, 5);
  ctx.fillStyle = "#0a0808";
  for (let i = 0; i < 20; i++) ctx.fillRect(194 + i * 3.4, 190, 1, 3);
  // legs & bench
  ctx.fillStyle = "#0a0808";
  ctx.fillRect(200, 214, 6, 20);
  ctx.fillRect(290, 214, 6, 20);
  ctx.fillRect(210, 222, 44, 5);
  ctx.fillRect(216, 227, 5, 10);
  ctx.fillRect(244, 227, 5, 10);
  // work light on piano
  deskLamp(ctx, 260, 168, mood, out.lights, -1);
  // rows of concert chairs
  ctx.fillStyle = "#181014";
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 8; i++) {
      const chx2 = 36 + i * 18;
      const chy = 226 + r * 14;
      ctx.fillRect(chx2, chy, 10, 3);
      ctx.fillRect(chx2, chy - 8, 2, 8);
    }
  }
  // red carpet
  ctx.fillStyle = "#4a1620";
  ctx.fillRect(330, 190, 60, 80);
  ctx.fillStyle = "#5e2c38";
  ctx.fillRect(334, 190, 2, 80);
  ctx.fillRect(384, 190, 2, 80);
};

const paintMuseum: Painter = (ctx, mood, weather, rnd, out) => {
  out.horizon = 190;
  interiorRoom(ctx, "#221c14", "#181208", mood, rnd);
  // cedar map cabinets to ceiling
  for (const cx of [10, 92, 340, 422] as number[]) {
    ctx.fillStyle = "#2c2214";
    ctx.fillRect(cx, 26, 70, 160);
    for (let d = 0; d < 9; d++) {
      ctx.fillStyle = "#221a10";
      ctx.fillRect(cx + 4, 32 + d * 17, 62, 13);
      ctx.fillStyle = "#8a7a4a";
      ctx.fillRect(cx + 30, 37 + d * 17, 10, 3);
    }
  }
  // display cases
  for (const dx of [190, 260] as number[]) {
    ctx.fillStyle = "#2c2214";
    ctx.fillRect(dx, 190, 54, 8);
    ctx.fillRect(dx + 4, 198, 5, 30);
    ctx.fillRect(dx + 45, 198, 5, 30);
    ctx.fillStyle = "rgba(200,220,235,0.14)";
    ctx.fillRect(dx + 2, 168, 50, 22);
    ctx.fillStyle = "#c9b98a";
    ctx.fillRect(dx + 10, 182, 34, 5);
    out.lights.push({ x: dx + 2, y: 168, w: 50, h: 4, color: "#e8d8a8", flicker: 0.05 });
  }
  // skylight with storm
  ctx.fillStyle = "#0a0d16";
  ctx.fillRect(150, 8, 180, 34);
  ditherBands(ctx, 154, 11, 172, 28, "#0c1018", "#1b2436", 3, rnd);
  ctx.fillStyle = "rgba(200,220,240,0.18)";
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(158 + Math.floor(rnd() * 160), 11 + Math.floor(rnd() * 10), 1, 6 + Math.floor(rnd() * 12));
  }
  ctx.fillStyle = "#0a0d16";
  for (let i = 0; i < 5; i++) ctx.fillRect(150 + i * 45, 8, 3, 34);
  // toppled astrolabe stand + chalk outline
  ctx.fillStyle = "#8a7a4a";
  ctx.fillRect(120, 226, 60, 4);
  ctx.beginPath();
  ctx.arc(178, 224, 9, 0, Math.PI * 2);
  ctx.strokeStyle = "#8a7a4a";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = "rgba(232,226,212,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(96, 232, 52, 20);
  // reading table with green lamp
  ctx.fillStyle = "#241c12";
  ctx.fillRect(280, 208, 90, 7);
  ctx.fillRect(288, 215, 6, 24);
  ctx.fillRect(356, 215, 6, 24);
  ctx.fillStyle = "#c9c2b0";
  ctx.fillRect(296, 202, 24, 6);
  ctx.fillStyle = "#0a3826";
  ctx.fillRect(338, 196, 14, 5);
  ctx.fillStyle = "#05070c";
  ctx.fillRect(343, 201, 3, 7);
  out.lights.push({ x: 338, y: 196, w: 14, h: 3, color: "#4fd8a4", flicker: 0.08 });
  const grad = ctx.createRadialGradient(345, 206, 2, 345, 206, 26);
  grad.addColorStop(0, "rgba(79,216,164,0.2)");
  grad.addColorStop(1, "rgba(79,216,164,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(316, 190, 60, 30);
  // emergency lighting strips
  ctx.fillStyle = "rgba(224,92,110,0.5)";
  ctx.fillRect(0, 186, 8, 3);
  ctx.fillRect(472, 186, 8, 3);
  out.lights.push({ x: 0, y: 186, w: 8, h: 3, color: "#e05c6e", flicker: 0.4 });
  out.lights.push({ x: 472, y: 186, w: 8, h: 3, color: "#e05c6e", flicker: 0.4 });
};

const paintBar: Painter = (ctx, mood, weather, rnd, out) => {
  out.horizon = 190;
  interiorRoom(ctx, "#1c1418", "#14100c", mood, rnd);
  // back bar shelving
  ctx.fillStyle = "#241a1e";
  ctx.fillRect(60, 40, 240, 120);
  for (let s = 0; s < 3; s++) {
    ctx.fillStyle = "#1a1216";
    ctx.fillRect(66, 56 + s * 34, 228, 26);
    for (let b = 0; b < 16; b++) {
      const bx = 72 + b * 14;
      const bh = 12 + Math.floor(rnd() * 10);
      ctx.fillStyle = ["#3a5a4a", "#5e3a2c", "#3a3a5e", "#5e2c38", "#4a4232"][Math.floor(rnd() * 5)];
      ctx.fillRect(bx, 82 + s * 34 - bh, 6, bh);
      ctx.fillStyle = "rgba(255,220,150,0.25)";
      ctx.fillRect(bx + 1, 82 + s * 34 - bh + 2, 1, bh - 4);
    }
  }
  // warm shelf lighting
  ctx.fillStyle = "rgba(232,168,73,0.14)";
  ctx.fillRect(60, 40, 240, 120);
  out.lights.push({ x: 70, y: 52, w: 220, h: 2, color: "#e8a849", flicker: 0.12 });
  // bar counter
  ctx.fillStyle = "#3a2418";
  ctx.fillRect(40, 190, 280, 10);
  ctx.fillStyle = "#2a1a10";
  ctx.fillRect(40, 200, 280, 34);
  ctx.fillStyle = "rgba(232,168,73,0.25)";
  ctx.fillRect(40, 190, 280, 2);
  // stools
  for (let i = 0; i < 5; i++) {
    const sx = 60 + i * 54;
    ctx.fillStyle = "#241a12";
    ctx.fillRect(sx, 236, 20, 4);
    ctx.fillRect(sx + 8, 240, 4, 18);
  }
  // record player, spinning disc drawn by stage
  ctx.fillStyle = "#241c12";
  ctx.fillRect(330, 178, 56, 14);
  ctx.fillStyle = "#0a0808";
  ctx.fillRect(336, 170, 44, 8);
  out.neons.push({ x: 350, y: 60, w: 70, h: 12, color: "rgb(79,216,196)" });
  // neon sign 'BLUE HOUR' represented as tube
  ctx.fillStyle = "rgba(79,216,196,0.85)";
  ctx.fillRect(350, 60, 70, 3);
  ctx.fillRect(350, 68, 52, 2);
  // window to rainy street
  tallWindow(ctx, 404, 90, 56, 84, mood, weather, rnd, out.lights);
  // hanging pendant over bar
  for (const lx of [100, 200, 290]) {
    ctx.fillStyle = "#05070c";
    ctx.fillRect(lx, 0, 1, 26);
    ctx.fillStyle = "#2a1c0e";
    ctx.fillRect(lx - 6, 26, 13, 6);
    ctx.fillStyle = mood.window;
    ctx.fillRect(lx - 4, 32, 9, 3);
    out.lights.push({ x: lx - 4, y: 32, w: 9, h: 3, color: mood.window, flicker: 0.18 });
  }
  // glasses on bar
  ctx.fillStyle = "rgba(220,235,245,0.5)";
  ctx.fillRect(120, 184, 4, 6);
  ctx.fillRect(180, 184, 4, 6);
  ctx.fillStyle = "rgba(232,168,73,0.7)";
  ctx.fillRect(181, 187, 2, 3);
};

const paintApartment: Painter = (ctx, mood, weather, rnd, out) => {
  out.horizon = 190;
  interiorRoom(ctx, "#221c1a", "#1a1410", mood, rnd);
  tallWindow(ctx, 300, 34, 88, 130, mood, weather, rnd, out.lights);
  // wallpaper pattern
  ctx.fillStyle = "rgba(232,168,73,0.05)";
  for (let y = 20; y < 180; y += 18) for (let x = 10; x < 280; x += 18) ctx.fillRect(x, y, 2, 2);
  // fireplace
  ctx.fillStyle = "#181210";
  ctx.fillRect(50, 110, 84, 80);
  ctx.fillStyle = "#0c0a08";
  ctx.fillRect(64, 134, 56, 56);
  ctx.fillStyle = "rgba(232,140,60,0.8)";
  ctx.fillRect(76, 168, 32, 16);
  out.lights.push({ x: 76, y: 168, w: 32, h: 16, color: "#e88c3c", flicker: 0.85 });
  ctx.fillStyle = "#2c241c";
  ctx.fillRect(44, 104, 96, 8);
  // framed poster above mantel
  ctx.fillStyle = "#8a7a4a";
  ctx.fillRect(66, 40, 52, 60);
  ctx.fillStyle = "#e0d6c0";
  ctx.fillRect(70, 44, 44, 52);
  ctx.fillStyle = "#4a3a5e";
  ctx.fillRect(76, 52, 32, 30);
  ctx.fillStyle = "#12100c";
  ctx.fillRect(80, 86, 24, 3);
  // armchairs
  for (const [ax, flip] of [[170, 1], [250, -1]] as [number, number][]) {
    ctx.fillStyle = "#3a2c4a";
    ctx.fillRect(ax, 196, 54, 34);
    ctx.fillRect(ax + (flip > 0 ? 0 : 44), 172, 10, 34);
    ctx.fillStyle = "#2c2038";
    ctx.fillRect(ax + 4, 200, 46, 6);
  }
  // side table + lamp
  ctx.fillStyle = "#241c12";
  ctx.fillRect(232, 206, 22, 4);
  ctx.fillRect(240, 210, 4, 22);
  deskLamp(ctx, 238, 206, mood, out.lights, 1);
  // rug
  ctx.fillStyle = "#3c2020";
  ctx.fillRect(150, 240, 180, 24);
  ctx.fillStyle = "#4a2c2c";
  ctx.fillRect(156, 244, 168, 2);
  ctx.fillRect(156, 258, 168, 2);
  // bookshelf
  ctx.fillStyle = "#241a10";
  ctx.fillRect(410, 60, 60, 130);
  for (let s = 0; s < 5; s++) {
    ctx.fillStyle = "#1a1208";
    ctx.fillRect(414, 68 + s * 25, 52, 20);
    for (let b = 0; b < 8; b++) {
      ctx.fillStyle = ["#5e2c38", "#2c4a3a", "#3a3a5e", "#6e5a2c"][Math.floor(rnd() * 4)];
      ctx.fillRect(416 + b * 6, 70 + s * 25 + Math.floor(rnd() * 4), 4, 16 - Math.floor(rnd() * 4));
    }
  }
};

const paintNewsroom: Painter = (ctx, mood, weather, rnd, out) => {
  out.horizon = 190;
  interiorRoom(ctx, "#20242c", "#16140f", mood, rnd);
  tallWindow(ctx, 24, 30, 64, 116, mood, weather, rnd, out.lights);
  // THE LEDGER painted on glass door
  ctx.fillStyle = "#181c24";
  ctx.fillRect(392, 30, 70, 158);
  ctx.fillStyle = "rgba(200,220,235,0.12)";
  ctx.fillRect(398, 36, 58, 100);
  ctx.fillStyle = "rgba(232,226,212,0.7)";
  ctx.fillRect(406, 60, 42, 3);
  ctx.fillRect(410, 68, 34, 2);
  // pinned front pages wall
  for (let i = 0; i < 6; i++) {
    const px = 120 + (i % 3) * 60;
    const py = 44 + Math.floor(i / 3) * 56;
    ctx.fillStyle = "#d8d2c0";
    ctx.fillRect(px, py, 44, 44);
    ctx.fillStyle = "#3a3430";
    ctx.fillRect(px + 4, py + 5, 36, 5);
    ctx.fillStyle = "#8a8478";
    for (let l = 0; l < 5; l++) ctx.fillRect(px + 4, py + 15 + l * 5, 36 - Math.floor(rnd() * 10), 2);
  }
  // desks with typewriters and mess
  for (const dx of [90, 240] as number[]) {
    ctx.fillStyle = "#2a2218";
    ctx.fillRect(dx, 204, 110, 8);
    ctx.fillRect(dx + 8, 212, 7, 26);
    ctx.fillRect(dx + 94, 212, 7, 26);
    ctx.fillStyle = "#0a0c10";
    ctx.fillRect(dx + 20, 192, 26, 12);
    ctx.fillStyle = "#c9c2b0";
    ctx.fillRect(dx + 24, 188, 18, 4);
    ctx.fillRect(dx + 60, 198, 22, 5);
    ctx.fillRect(dx + 64, 194, 22, 4);
    deskLamp(ctx, dx + 96, 204, mood, out.lights, -1);
  }
  // hanging bulbs
  for (const lx of [160, 300]) {
    ctx.fillStyle = "#05070c";
    ctx.fillRect(lx, 0, 1, 30);
    ctx.fillStyle = mood.window;
    ctx.fillRect(lx - 2, 30, 5, 6);
    out.lights.push({ x: lx - 2, y: 30, w: 5, h: 6, color: mood.window, flicker: 0.14 });
  }
  // paper on floor
  ctx.fillStyle = "#c9c2b0";
  ctx.fillRect(200, 250, 12, 5);
  ctx.fillRect(330, 244, 10, 4);
  out.smoke.push({ x: 260, y: 200 });
};

const paintOffice: Painter = (ctx, mood, weather, rnd, out) => {
  out.horizon = 190;
  interiorRoom(ctx, "#1e1a16", "#161008", mood, rnd);
  // your office: venetian blinds with city glow
  ctx.fillStyle = "#0a0d16";
  ctx.fillRect(160, 26, 160, 130);
  ditherBands(ctx, 164, 30, 152, 122, mood.skyTop, mood.skyBottom, 5, rnd);
  for (let i = 0; i < 8; i++) {
    const bx = 168 + i * 19;
    const bh = 14 + Math.floor(rnd() * 50);
    ctx.fillStyle = "#0d1220";
    ctx.fillRect(bx, 152 - bh, 15, bh);
    for (let wj = 0; wj < 3; wj++) {
      if (rnd() < 0.6) {
        ctx.fillStyle = rnd() < 0.75 ? mood.window : mood.windowCool;
        ctx.fillRect(bx + 2 + wj * 4, 152 - bh + 3 + Math.floor(rnd() * (bh - 6)), 2, 2);
      }
    }
  }
  if (weather.kind === "rain" || weather.kind === "storm") {
    ctx.fillStyle = "rgba(200,220,240,0.15)";
    for (let i = 0; i < 12; i++) {
      ctx.fillRect(164 + Math.floor(rnd() * 150), 30 + Math.floor(rnd() * 60), 1, 6 + Math.floor(rnd() * 40));
    }
  }
  // blinds
  ctx.fillStyle = "#14100c";
  for (let i = 0; i < 13; i++) ctx.fillRect(160, 26 + i * 10, 160, 3);
  ctx.fillRect(160, 26, 3, 130);
  ctx.fillRect(317, 26, 3, 130);
  // desk
  ctx.fillStyle = "#2c2014";
  ctx.fillRect(140, 208, 200, 10);
  ctx.fillRect(150, 218, 10, 34);
  ctx.fillRect(320, 218, 10, 34);
  ctx.fillStyle = "#241a10";
  ctx.fillRect(140, 208, 200, 3);
  // typewriter
  ctx.fillStyle = "#0a0c10";
  ctx.fillRect(200, 192, 32, 16);
  ctx.fillStyle = "#c9c2b0";
  ctx.fillRect(205, 186, 22, 6);
  // case files
  ctx.fillStyle = "#c9b98a";
  ctx.fillRect(250, 200, 26, 8);
  ctx.fillStyle = "#b9a97a";
  ctx.fillRect(253, 197, 26, 6);
  ctx.fillStyle = "#e05c6e";
  ctx.fillRect(266, 202, 8, 2);
  // coffee
  ctx.fillStyle = "#e8e2d4";
  ctx.fillRect(292, 200, 9, 8);
  ctx.fillRect(301, 202, 3, 4);
  out.smoke.push({ x: 296, y: 198 });
  deskLamp(ctx, 172, 208, mood, out.lights, 1);
  // chair
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(216, 222, 48, 8);
  ctx.fillRect(234, 230, 8, 24);
  // filing cabinet + coat stand
  ctx.fillStyle = "#2a3040";
  ctx.fillRect(40, 130, 44, 88);
  for (let d = 0; d < 4; d++) {
    ctx.fillStyle = "#222836";
    ctx.fillRect(44, 136 + d * 21, 36, 16);
    ctx.fillStyle = "#8a97a8";
    ctx.fillRect(56, 142 + d * 21, 12, 3);
  }
  ctx.fillStyle = "#0c0a08";
  ctx.fillRect(420, 140, 3, 96);
  ctx.fillRect(408, 144, 28, 3);
  // trench coat and fedora
  ctx.fillStyle = "#3a3226";
  ctx.fillRect(410, 148, 22, 52);
  ctx.fillStyle = "#2c2418";
  ctx.fillRect(407, 128, 28, 9);
  ctx.fillRect(414, 122, 14, 7);
  // corkboard small
  ctx.fillStyle = "#3a2c1c";
  ctx.fillRect(30, 40, 100, 70);
  ctx.fillStyle = "#2a2014";
  ctx.fillRect(34, 44, 92, 62);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "#d8d2c0";
    ctx.fillRect(40 + Math.floor(rnd() * 70), 48 + Math.floor(rnd() * 44), 12, 9);
  }
};

const PAINTERS: Record<SceneId, Painter> = {
  skyline: paintSkyline,
  harbor: paintHarbor,
  docks: paintDocks,
  street: paintStreet,
  university: paintUniversity,
  forest: paintForest,
  station: paintStation,
  warehouse: paintWarehouse,
  precinct: paintPrecinct,
  morgue: paintMorgue,
  hotel: paintHotel,
  museum: paintMuseum,
  bar: paintBar,
  apartment: paintApartment,
  newsroom: paintNewsroom,
  office: paintOffice,
  citymap: paintSkyline,
};

export function paintScene(
  scene: SceneId,
  weather: Weather,
  time: TimeOfDay,
  seedKey: string
): PaintedScene {
  const canvas = document.createElement("canvas");
  canvas.width = SCENE_W;
  canvas.height = SCENE_H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const rnd = rngFor(`${scene}:${seedKey}`);
  const mood = moodFor(time, weather);
  const out: PaintedScene = { canvas, lights: [], neons: [], smoke: [], horizon: 190 };
  ctx.fillStyle = "#04060a";
  ctx.fillRect(0, 0, SCENE_W, SCENE_H);
  PAINTERS[scene](ctx, mood, weather, rnd, out);

  // global atmosphere: fog / snow ground tint
  if (weather.kind === "fog") {
    ctx.fillStyle = "rgba(140,160,180,0.12)";
    ctx.fillRect(0, out.horizon - 40, SCENE_W, SCENE_H - out.horizon + 40);
    ctx.fillStyle = "rgba(140,160,180,0.08)";
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);
  }
  if (weather.kind === "snow") {
    ctx.fillStyle = "rgba(220,230,240,0.10)";
    ctx.fillRect(0, out.horizon, SCENE_W, SCENE_H - out.horizon);
  }
  return out;
}
