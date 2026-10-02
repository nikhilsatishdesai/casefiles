import type { Weather } from "@/lib/engine/types";
import { SCENE_W, SCENE_H, type Mood, type NeonSign, type PaintedScene, type Rect } from "./types";
import { drawPixelText, measurePixelText, measurePixelTextVertical } from "./pixelfont";

/**
 * Drawing primitives shared by every scene painter.
 *
 * The look: hard pixel edges for everything solid (ordered dithering, no
 * anti-aliased shapes), soft gradients only for light and air.
 */

/* ------------------------------------------------------------------ */
/* color                                                               */
/* ------------------------------------------------------------------ */

export type RGB = [number, number, number];

export function rgbOf(c: string): RGB {
  if (c.startsWith("#")) {
    const n = parseInt(c.slice(1, 7), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = c.match(/\d+(\.\d+)?/g);
  return m && m.length >= 3 ? [+m[0], +m[1], +m[2]] : [255, 0, 255];
}

const hex2 = (v: number) =>
  Math.max(0, Math.min(255, Math.round(v)))
    .toString(16)
    .padStart(2, "0");

export function hexOf([r, g, b]: RGB): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

export function rgba(c: string, a: number): string {
  const [r, g, b] = rgbOf(c);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}

export function mix(a: string, b: string, t: number): string {
  const A = rgbOf(a);
  const B = rgbOf(b);
  return hexOf([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

export function shade(c: string, f: number): string {
  const [r, g, b] = rgbOf(c);
  return hexOf([r * f, g * f, b * f]);
}

function sampleStops(stops: string[], t: number): string {
  if (stops.length === 1) return stops[0];
  const f = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(f));
  return mix(stops[i], stops[i + 1], f - i);
}

export function smooth(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/* ------------------------------------------------------------------ */
/* ordered dithering                                                   */
/* ------------------------------------------------------------------ */

const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** 4×4 Bayer threshold in (0,1). */
export function bayer(x: number, y: number): number {
  return (B4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;
}

function clipRect(x: number, y: number, w: number, h: number) {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(SCENE_W, Math.round(x + w));
  const y1 = Math.min(SCENE_H, Math.round(y + h));
  return x1 > x0 && y1 > y0 ? { x0, y0, x1, y1 } : null;
}

/**
 * Vertical gradient through any number of stops, quantized to `levels`
 * colors and ordered-dithered between them. Opaque.
 */
export function vGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stops: string[],
  levels = 12
) {
  const r = clipRect(x, y, w, h);
  if (!r) return;
  const pal = Array.from({ length: levels }, (_, i) => rgbOf(sampleStops(stops, i / (levels - 1))));
  const iw = r.x1 - r.x0;
  const img = ctx.getImageData(r.x0, r.y0, iw, r.y1 - r.y0);
  const d = img.data;
  const top = Math.round(y);
  const hh = Math.max(1, Math.round(h) - 1);
  for (let yy = r.y0; yy < r.y1; yy++) {
    const v = ((yy - top) / hh) * (levels - 1);
    const base = Math.floor(v);
    const frac = v - base;
    for (let xx = r.x0; xx < r.x1; xx++) {
      const c = pal[Math.max(0, Math.min(levels - 1, frac > bayer(xx, yy) ? base + 1 : base))];
      const o = ((yy - r.y0) * iw + (xx - r.x0)) * 4;
      d[o] = c[0];
      d[o + 1] = c[1];
      d[o + 2] = c[2];
      d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, r.x0, r.y0);
}

/** Back-compat wrapper: two-stop dithered gradient. */
export function ditherBands(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  top: string,
  bottom: string,
  bands: number
) {
  vGradient(ctx, x, y, w, h, [top, bottom], Math.max(3, bands * 2));
}

/* ------------------------------------------------------------------ */
/* noise                                                               */
/* ------------------------------------------------------------------ */

export type Noise2D = (x: number, y: number) => number;

export function valueNoise(rnd: () => number, size = 64): Noise2D {
  const g = new Float32Array(size * size);
  for (let i = 0; i < g.length; i++) g[i] = rnd();
  const m = size - 1;
  return (x, y) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const x0 = ix & m;
    const x1 = (ix + 1) & m;
    const y0 = (iy & m) * size;
    const y1 = ((iy + 1) & m) * size;
    const a = g[y0 + x0];
    const b = g[y0 + x1];
    const c = g[y1 + x0];
    const e = g[y1 + x1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + e) * sx * sy;
  };
}

export function fbm(n: Noise2D, x: number, y: number, octaves = 4): number {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    v += amp * n(x * f, y * f);
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return v / norm;
}

/* ------------------------------------------------------------------ */
/* sky                                                                 */
/* ------------------------------------------------------------------ */

export function sky(ctx: CanvasRenderingContext2D, mood: Mood, h: number, x = 0, w = SCENE_W, y = 0) {
  vGradient(ctx, x, y, w, h, [mood.skyTop, mood.skyMid, mood.skyBottom], 16);
}

export interface CloudOpts {
  y0: number;
  y1: number;
  /** 0..1 how much of the band is cloud */
  cover: number;
  /** feature size in pixels */
  sx: number;
  sy: number;
  dark: string;
  lit: string;
  /** color the city throws up onto the cloud bellies */
  under: string;
  alpha: number;
}

/** Pixel clouds: noise-shaped, dither-edged, rim-lit on top, city-lit below. */
export function clouds(ctx: CanvasRenderingContext2D, rnd: () => number, o: CloudOpts) {
  const r = clipRect(0, o.y0, SCENE_W, o.y1 - o.y0);
  if (!r) return;
  const n = valueNoise(rnd);
  const ox = rnd() * 300;
  const oy = rnd() * 300;
  const h = r.y1 - r.y0;
  const img = ctx.getImageData(0, r.y0, SCENE_W, h);
  const d = img.data;
  const D = rgbOf(o.dark);
  const L = rgbOf(o.lit);
  const U = rgbOf(o.under);
  for (let y = 0; y < h; y++) {
    const ty = y / Math.max(1, h - 1);
    const band = smooth(0, 0.28, ty) * (1 - smooth(0.72, 1, ty));
    const gy = r.y0 + y;
    for (let x = 0; x < SCENE_W; x++) {
      const v = fbm(n, ox + x / o.sx, oy + gy / o.sy, 4);
      const dens = ((v - (1 - o.cover)) / o.cover) * band;
      if (dens <= 0 || dens * 2.4 < bayer(x, gy)) continue;
      const above = fbm(n, ox + x / o.sx, oy + (gy - 3) / o.sy, 3);
      const rim = above < v - 0.02 ? 0.7 : 0.12;
      const u = Math.min(1, ty * ty * 0.7 + (1 - Math.min(1, dens * 2)) * 0.15);
      const cr = D[0] + (L[0] - D[0]) * rim;
      const cg = D[1] + (L[1] - D[1]) * rim;
      const cb = D[2] + (L[2] - D[2]) * rim;
      const a = Math.min(1, 0.4 + dens * 1.4) * o.alpha;
      const i = (y * SCENE_W + x) * 4;
      d[i] += (cr + (U[0] - cr) * u - d[i]) * a;
      d[i + 1] += (cg + (U[1] - cg) * u - d[i + 1]) * a;
      d[i + 2] += (cb + (U[2] - cb) * u - d[i + 2]) * a;
    }
  }
  ctx.putImageData(img, 0, r.y0);
}

export function stars(ctx: CanvasRenderingContext2D, rnd: () => number, yMax: number, count = 70) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rnd() * SCENE_W);
    const y = Math.floor(rnd() * yMax);
    const bright = rnd() < 0.12;
    ctx.fillStyle = rgba("#e8e2d4", bright ? 0.95 : 0.18 + rnd() * 0.35);
    ctx.fillRect(x, y, 1, 1);
    if (bright && rnd() < 0.5) {
      ctx.fillStyle = rgba("#e8e2d4", 0.25);
      ctx.fillRect(x - 1, y, 1, 1);
      ctx.fillRect(x + 1, y, 1, 1);
      ctx.fillRect(x, y - 1, 1, 1);
      ctx.fillRect(x, y + 1, 1, 1);
    }
  }
}

export function moon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, mood: Mood, haloAlpha = 0.2) {
  const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 6);
  halo.addColorStop(0, rgba(mood.moon, haloAlpha));
  halo.addColorStop(0.4, rgba(mood.moon, haloAlpha * 0.35));
  halo.addColorStop(1, rgba(mood.moon, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dd = dx * dx + dy * dy;
      if (dd > r * r + r * 0.6) continue;
      // terminator: lower-left falls into shadow
      const lit = (dx + dy * 0.6) / r;
      ctx.fillStyle = lit < -0.55 ? shade(mood.moon, 0.72) : dd > (r - 1) * (r - 1) ? shade(mood.moon, 0.9) : mood.moon;
      ctx.fillRect(Math.round(x + dx), Math.round(y + dy), 1, 1);
    }
  }
  ctx.fillStyle = shade(mood.moon, 0.82);
  ctx.fillRect(Math.round(x - r * 0.3), Math.round(y - r * 0.2), 2, 2);
  ctx.fillRect(Math.round(x + r * 0.25), Math.round(y + r * 0.3), 2, 1);
  ctx.fillRect(Math.round(x + r * 0.1), Math.round(y - r * 0.55), 1, 1);
}

/** Light pollution: the city's sodium haze breathing up into the sky. */
export function cityGlow(ctx: CanvasRenderingContext2D, y: number, height: number, color: string, alpha: number) {
  const g = ctx.createLinearGradient(0, y - height, 0, y);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(0.7, rgba(color, alpha * 0.55));
  g.addColorStop(1, rgba(color, alpha));
  ctx.fillStyle = g;
  ctx.fillRect(0, y - height, SCENE_W, height);
}

/* ------------------------------------------------------------------ */
/* buildings                                                           */
/* ------------------------------------------------------------------ */

export interface BuildingOpts {
  x: number;
  w: number;
  h: number;
  ground: number;
  color: string;
  litChance: number;
  rnd: () => number;
  out: PaintedScene;
  mood: Mood;
  windowColor?: string;
  roof?: "flat" | "water" | "antenna" | "peak" | "setback" | "spire";
  style?: "tower" | "brick" | "deco" | "plain";
  /** 0 = right here … 1 = lost in the sky (atmospheric perspective) */
  haze?: number;
  /** register some lit windows with the stage for glow & flicker */
  collectLights?: boolean;
  fireEscape?: boolean;
}

const WINDOW_SPECS = {
  tower: { ww: 2, wh: 3, sx: 4, sy: 5, oy: 3 },
  brick: { ww: 3, wh: 4, sx: 6, sy: 9, oy: 4 },
  deco: { ww: 2, wh: 5, sx: 5, sy: 8, oy: 4 },
  plain: { ww: 3, wh: 4, sx: 6, sy: 8, oy: 4 },
} as const;

function windowLight(rnd: () => number, warm: string, cool: string): string {
  const r = rnd();
  if (r < 0.56) return warm;
  if (r < 0.7) return "#ffe2a8";
  if (r < 0.85) return cool;
  if (r < 0.95) return "#e8924a";
  return rnd() < 0.5 ? "#a8e6b0" : "#f09a9a";
}

export function building(ctx: CanvasRenderingContext2D, o: BuildingOpts) {
  const { rnd, mood, out } = o;
  const haze = o.haze ?? 0;
  const hz = (c: string) => (haze > 0 ? mix(c, mood.haze, haze) : c);
  const x = Math.round(o.x);
  const w = Math.round(o.w);
  const h = Math.round(o.h);
  const ground = Math.round(o.ground);
  const top = ground - h;
  const style = o.style ?? "plain";
  const body = hz(o.color);
  const warm = o.windowColor ?? mood.window;

  // body: tops catch the sky, feet catch the street
  vGradient(ctx, x, top, w, h, [mix(body, mood.skyBottom, 0.1), body, body, mix(body, mood.glow, 0.06 * (1 - haze))], 6);

  // roof furniture
  ctx.fillStyle = body;
  if (o.roof === "water" && w > 16) {
    const tx = x + 3 + Math.floor(rnd() * Math.max(1, w - 14));
    ctx.fillRect(tx + 1, top - 4, 1, 4);
    ctx.fillRect(tx + 6, top - 4, 1, 4);
    ctx.fillRect(tx, top - 11, 8, 7);
    for (let i = 0; i < 3; i++) ctx.fillRect(tx + 1 + i, top - 12 - i, 6 - i * 2, 1);
    ctx.fillStyle = shade(body, 0.75);
    ctx.fillRect(tx, top - 9, 8, 1);
    ctx.fillRect(tx, top - 6, 8, 1);
  } else if (o.roof === "antenna") {
    const ax = x + Math.floor(w / 2);
    const ah = 8 + Math.floor(rnd() * 8);
    ctx.fillRect(ax, top - ah, 1, ah);
    ctx.fillRect(ax - 2, top - ah + 3, 5, 1);
    out.blinkers.push({ x: ax, y: top - ah - 1, color: "#ff4a4a", period: 1.4 + rnd() * 1.4, phase: rnd(), duty: 0.22 });
    ctx.fillStyle = "#5a1a1a";
    ctx.fillRect(ax, top - ah - 1, 1, 1);
  } else if (o.roof === "peak") {
    const half = Math.floor(w / 2);
    for (let i = 0; i < half; i++) ctx.fillRect(x + i, top - Math.floor(i * 0.6), w - i * 2, 1);
  } else if (o.roof === "setback" && w > 14) {
    building(ctx, {
      ...o,
      x: x + Math.floor(w * 0.18),
      w: Math.floor(w * 0.64),
      h: Math.floor(h * 0.16) + 6,
      ground: top,
      roof: rnd() < 0.5 ? "antenna" : "flat",
      fireEscape: false,
    });
  } else if (o.roof === "spire") {
    const cx = x + Math.floor(w / 2);
    for (let i = 0; i < 4; i++) {
      const tw = Math.max(2, Math.floor(w * (0.72 - i * 0.16)));
      ctx.fillStyle = body;
      ctx.fillRect(cx - Math.floor(tw / 2), top - (i + 1) * 5, tw, 5);
      ctx.fillStyle = hz(warm);
      ctx.fillRect(cx - Math.floor(tw / 2) + 1, top - (i + 1) * 5 + 2, Math.max(1, tw - 2), 1);
    }
    ctx.fillStyle = body;
    ctx.fillRect(cx, top - 34, 1, 14);
    out.lights.push({ x: cx - 4, y: top - 18, w: 8, h: 1, color: warm, flicker: 0.05, glow: 2 });
    out.blinkers.push({ x: cx, y: top - 35, color: "#ff4a4a", period: 2.2, phase: rnd(), duty: 0.2 });
  }

  // edges: parapet against the sky, rim light down the street side
  ctx.fillStyle = mix(body, mood.skyBottom, 0.35);
  ctx.fillRect(x, top, w, 1);
  ctx.fillStyle = shade(body, 0.78);
  ctx.fillRect(x, top + 1, w, 1);
  if (haze < 0.6) {
    ctx.fillStyle = mix(body, mood.glow, 0.16);
    ctx.fillRect(x + w - 1, top + 1, 1, h - 1);
    ctx.fillStyle = shade(body, 0.82);
    ctx.fillRect(x, top + 1, 1, h - 1);
  }

  // windows
  const sp = WINDOW_SPECS[style];
  const cols = Math.max(1, Math.floor((w - 4 + (sp.sx - sp.ww)) / sp.sx));
  const gridW = cols * sp.sx - (sp.sx - sp.ww);
  const gx = x + Math.floor((w - gridW) / 2);
  const rows = Math.max(1, Math.floor((h - sp.oy - 3) / sp.sy));
  const detail = haze < 0.3;
  for (let row = 0; row < rows; row++) {
    const wy = top + sp.oy + row * sp.sy;
    if (wy + sp.wh > ground - 2) break;
    const bias = rnd() < 0.22 ? 0.1 : rnd() < 0.45 ? 1.35 : 1;
    if (detail && (style === "brick" || style === "deco") && row > 0 && row % 3 === 0) {
      ctx.fillStyle = shade(body, 0.74);
      ctx.fillRect(x, wy - 2, w, 1);
      ctx.fillStyle = mix(body, mood.skyBottom, 0.18);
      ctx.fillRect(x, wy - 3, w, 1);
    }
    for (let c = 0; c < cols; c++) {
      const wx = gx + c * sp.sx;
      if (rnd() < o.litChance * bias) {
        let col = windowLight(rnd, warm, mood.windowCool);
        if (haze > 0) col = mix(col, body, haze * 0.55);
        ctx.fillStyle = col;
        ctx.fillRect(wx, wy, sp.ww, sp.wh);
        if (detail && sp.wh >= 3) {
          const k = rnd();
          ctx.fillStyle = shade(col, 0.45);
          if (k < 0.1) ctx.fillRect(wx + (sp.ww > 2 ? 1 : 0), wy + 1, 1, sp.wh - 1); // someone at the window
          else if (k < 0.2) for (let yy = wy + 1; yy < wy + sp.wh; yy += 2) ctx.fillRect(wx, yy, sp.ww, 1); // blinds
          else if (k < 0.27) ctx.fillRect(wx, wy, 1, sp.wh); // curtain
        }
        if (o.collectLights !== false && rnd() < 0.24) {
          out.lights.push({ x: wx, y: wy, w: sp.ww, h: sp.wh, color: col, flicker: rnd() < 0.22 ? 0.6 : 0.12 });
        }
      } else {
        ctx.fillStyle = shade(body, 0.66);
        ctx.fillRect(wx, wy, sp.ww, sp.wh);
        if (detail && rnd() < 0.35) {
          ctx.fillStyle = mix(body, mood.skyBottom, 0.4);
          ctx.fillRect(wx, wy, 1, 1);
        }
      }
      if (detail && (style === "brick" || style === "plain")) {
        ctx.fillStyle = shade(body, 1.22);
        ctx.fillRect(wx - 1, wy + sp.wh, sp.ww + 2, 1);
      }
    }
  }

  // fire escape: platforms every other floor, ladders zig-zagging between
  if (o.fireEscape && detail && h > 40) {
    const fx = x + Math.max(2, Math.floor(w * 0.12));
    const fw = Math.min(18, Math.floor(w * 0.4));
    const iron = mix(shade(body, 0.4), "#05070b", 0.4);
    ctx.fillStyle = iron;
    let flip = false;
    for (let py = top + sp.oy + sp.sy * 2 - 1; py < ground - 14; py += sp.sy * 2) {
      ctx.fillRect(fx, py, fw, 1);
      for (let px = fx; px < fx + fw; px += 3) ctx.fillRect(px, py - 3, 1, 3);
      ctx.fillRect(fx, py - 3, fw, 1);
      const steps = sp.sy * 2 - 1;
      for (let i = 0; i < steps; i++) {
        const lx = flip ? fx + fw - 2 - Math.floor((i / steps) * (fw - 4)) : fx + 1 + Math.floor((i / steps) * (fw - 4));
        if (py + 1 + i < ground - 10) ctx.fillRect(lx, py + 1 + i, 2, 1);
      }
      flip = !flip;
    }
  }
}

/* ------------------------------------------------------------------ */
/* street furniture                                                    */
/* ------------------------------------------------------------------ */

export function streetLamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  mood: Mood,
  out: PaintedScene,
  o: { h?: number; dir?: 1 | -1; cone?: boolean; color?: string } = {}
) {
  const h = o.h ?? 36;
  const dir = o.dir ?? -1;
  const col = o.color ?? mood.window;
  const top = ground - h;
  ctx.fillStyle = "#06080d";
  ctx.fillRect(x, top, 2, h);
  ctx.fillRect(x - 1, ground - 3, 4, 3);
  ctx.fillRect(x - 1, top + 9, 4, 1);
  const arm = dir < 0 ? x - 7 : x + 2;
  ctx.fillRect(arm, top, 7, 1);
  const bx = dir < 0 ? x - 9 : x + 7;
  ctx.fillRect(bx - 1, top + 1, 5, 2);
  ctx.fillStyle = mix(col, "#ffffff", 0.35);
  ctx.fillRect(bx, top + 3, 3, 1);
  out.lights.push({ x: bx, y: top + 3, w: 3, h: 1, color: col, flicker: 0.1, glow: 2.6 });
  if (o.cone !== false) {
    const cx = bx + 1.5;
    const g = ctx.createLinearGradient(0, top + 4, 0, ground);
    g.addColorStop(0, rgba(col, 0.2));
    g.addColorStop(1, rgba(col, 0.035));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - 2, top + 4);
    ctx.lineTo(cx + 2, top + 4);
    ctx.lineTo(cx + 17, ground);
    ctx.lineTo(cx - 17, ground);
    ctx.closePath();
    ctx.fill();
    pool(ctx, cx, ground, 24, col, 0.26);
  }
}

/** An elliptical pool of light on the ground. */
export function pool(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.32);
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

/** A soft radial glow (baked, for lights that never move). */
export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** A neon sign: dark plate, haloed lettering, hot white-ish tube core. */
export function neonSign(ctx: CanvasRenderingContext2D, n: NeonSign) {
  const col = n.color;
  ctx.fillStyle = "#07090e";
  ctx.fillRect(n.x - 1, n.y - 1, n.w + 2, n.h + 2);
  ctx.fillStyle = mix("#07090e", col, 0.22);
  ctx.fillRect(n.x - 1, n.y - 1, n.w + 2, 1);
  ctx.fillRect(n.x - 1, n.y + n.h, n.w + 2, 1);
  if (!n.text) {
    ctx.fillStyle = rgba(col, 0.4);
    ctx.fillRect(n.x + 1, n.y + 1, n.w - 2, n.h - 2);
    ctx.fillStyle = mix(col, "#ffffff", 0.4);
    ctx.fillRect(n.x + 2, n.y + Math.floor(n.h / 2), n.w - 4, 1);
    return;
  }
  const vertical = n.vertical ?? n.h > n.w * 1.6;
  const fitScale = (s: number) =>
    vertical
      ? measurePixelTextVertical(n.text!, 1, s) <= n.h - 2 && 5 * s <= n.w
      : measurePixelText(n.text!, 1, s) <= n.w - 2 && 5 * s <= n.h;
  const scale = fitScale(2) ? 2 : 1;
  const tw = vertical ? Math.min(n.w, 5 * scale) : measurePixelText(n.text, 1, scale);
  const th = vertical ? measurePixelTextVertical(n.text, 1, scale) : 5 * scale;
  const tx = n.x + Math.floor((n.w - tw) / 2);
  const ty = n.y + Math.floor((n.h - th) / 2);
  const opts = { vertical, colWidth: tw, scale };
  ctx.fillStyle = rgba(col, 0.3);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) drawPixelText(ctx, n.text, tx + dx, ty + dy, opts);
  ctx.fillStyle = mix(col, "#ffffff", 0.42);
  drawPixelText(ctx, n.text, tx, ty, opts);
}

/**
 * Wet asphalt: every light near the ground smears a broken vertical streak
 * below the street line, the signature of a rain-soaked noir street.
 */
export function reflections(ctx: CanvasRenderingContext2D, ground: number, out: PaintedScene, rnd: () => number, strength = 1) {
  const srcs = [
    ...out.lights.map((l) => ({ x: l.x, y: l.y, w: l.w, h: l.h, color: l.color, k: 1 })),
    ...out.neons.map((n) => ({ x: n.x, y: n.y, w: n.w, h: n.h, color: n.color, k: 1.7 })),
  ];
  for (const s of srcs) {
    const bottom = s.y + s.h;
    if (bottom > ground) continue;
    const above = ground - bottom;
    if (above > 100) continue;
    const len = Math.min(SCENE_H - ground - 1, Math.round(8 + above * 0.85 + s.h));
    const size = Math.min(1, (s.w * s.h) / 10 + 0.35);
    for (let i = 1; i < len; i++) {
      if (rnd() < 0.3) continue;
      const fall = 1 - i / len;
      const a = 0.26 * fall * fall * s.k * size * strength;
      if (a < 0.012) continue;
      const jitter = Math.round((rnd() - 0.5) * (1.5 + i * 0.06));
      const ww = Math.max(1, Math.round(s.w * (0.6 + rnd() * 0.6)));
      ctx.fillStyle = rgba(s.color, Math.min(0.55, a));
      ctx.fillRect(Math.round(s.x + jitter + (s.w - ww) / 2), ground + i, ww, 1);
    }
  }
}

/** A puddle: a flat dark ellipse holding a sliver of sky. */
export function puddle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, mood: Mood) {
  const h = Math.max(2, Math.round(w / 6));
  for (let r = 0; r < h; r++) {
    const t = 1 - Math.abs((r - (h - 1) / 2) / (h / 2));
    const rw = Math.round(w * (0.55 + 0.45 * t));
    ctx.fillStyle = mix(mood.near, mood.skyBottom, 0.28 + r * 0.04);
    ctx.fillRect(Math.round(x + (w - rw) / 2), y + r, rw, 1);
  }
  ctx.fillStyle = rgba(mood.windowCool, 0.25);
  ctx.fillRect(Math.round(x + w * 0.3), y + 1, Math.round(w * 0.25), 1);
}

/* ------------------------------------------------------------------ */
/* people & cars (also rasterized by the stage for moving traffic)     */
/* ------------------------------------------------------------------ */

export interface FigureOpts {
  color?: string;
  hat?: boolean;
  umbrella?: boolean;
  /** 0..3 walk-cycle frame */
  frame?: number;
  scale?: number;
}

/** A silhouette in a long coat — feet at (x, ground). About 16px tall at scale 1. */
export function figure(ctx: CanvasRenderingContext2D, x: number, ground: number, o: FigureOpts = {}) {
  const k = o.scale ?? 1;
  // (dx, top-above-ground, w, h) in figure pixels
  const px = (dx: number, top: number, w = 1, h = 1) =>
    ctx.fillRect(Math.round(x + dx * k), Math.round(ground - top * k), Math.ceil(w * k), Math.ceil(h * k));
  ctx.fillStyle = o.color ?? "#05070b";
  const stride = [0, 1, 0, -1][(o.frame ?? 0) % 4];
  px(-1 + Math.min(0, stride), 3, 1, 3); // legs
  px(1 + Math.max(0, stride), 3, 1, 3);
  px(-2, 11, 5, 8); // coat
  px(-1, 12, 3, 1); // collar
  px(-1, 15, 3, 3); // head
  if (o.hat) {
    px(-2, 15, 5, 1);
    px(-1, 16, 3, 1);
  }
  if (o.umbrella) {
    px(2, 20, 1, 10);
    px(-4, 21, 11, 1);
    px(-3, 22, 9, 1);
    px(-1, 23, 5, 1);
  }
}

/** A forties sedan in silhouette. (x, ground) is the left end at the tires. */
export function car(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  o: { color?: string; dir?: 1 | -1; lit?: boolean; taxi?: boolean; scale?: number } = {}
) {
  const k = o.scale ?? 1;
  const body = o.taxi ? "#a87e1a" : (o.color ?? "#0a0d14");
  const dir = o.dir ?? 1;
  const r = (dx: number, dy: number, w: number, h: number) => {
    const L = dir > 0 ? dx : 30 - dx - w;
    ctx.fillRect(Math.round(x + L * k), Math.round(ground - dy * k), Math.ceil(w * k), Math.ceil(h * k));
  };
  ctx.fillStyle = body;
  r(1, 8, 28, 5); // body
  r(3, 9, 25, 1);
  r(8, 13, 13, 4); // cabin
  r(10, 14, 9, 1);
  ctx.fillStyle = mix(body, "#9fb8c8", 0.35); // glass
  r(10, 12, 4, 2);
  r(15, 12, 4, 2);
  ctx.fillStyle = shade(body, 1.6);
  r(2, 8, 26, 1); // chrome line
  ctx.fillStyle = "#030406";
  r(5, 3, 5, 3); // wheels
  r(21, 3, 5, 3);
  if (o.taxi) {
    ctx.fillStyle = "#e8d070";
    r(13, 15, 3, 1);
  }
  if (o.lit) {
    ctx.fillStyle = "#fff2c8";
    r(28, 7, 2, 2); // headlight (front = right when dir > 0)
    ctx.fillStyle = "#e0404a";
    r(0, 7, 1, 2); // tail light
  }
}

/* ------------------------------------------------------------------ */
/* interiors                                                           */
/* ------------------------------------------------------------------ */

export interface RoomOpts {
  wall: string;
  floor: string;
  floorY?: number;
  /** lower wall paneling color */
  wainscot?: string;
  floorKind?: "planks" | "tiles" | "carpet";
  ceiling?: boolean;
}

/** The shell of a room: graded wall, molding, paneling, a floor that recedes. */
export function room(ctx: CanvasRenderingContext2D, rnd: () => number, out: PaintedScene, o: RoomOpts) {
  const fy = o.floorY ?? 190;
  out.interior = true;
  out.ground = fy;
  out.horizon = fy;

  vGradient(ctx, 0, 0, SCENE_W, fy, [shade(o.wall, 0.55), shade(o.wall, 0.86), o.wall, shade(o.wall, 1.04)], 12);
  for (let i = 0; i < 340; i++) {
    ctx.fillStyle = rnd() < 0.5 ? shade(o.wall, 0.9) : shade(o.wall, 1.1);
    ctx.fillRect(Math.floor(rnd() * SCENE_W), Math.floor(rnd() * fy), 2, 1);
  }
  if (o.ceiling !== false) {
    ctx.fillStyle = shade(o.wall, 0.42);
    ctx.fillRect(0, 0, SCENE_W, 8);
    ctx.fillStyle = shade(o.wall, 0.7);
    ctx.fillRect(0, 8, SCENE_W, 1);
    ctx.fillStyle = shade(o.wall, 1.25);
    ctx.fillRect(0, 9, SCENE_W, 1);
    ctx.fillStyle = shade(o.wall, 0.6);
    ctx.fillRect(0, 10, SCENE_W, 2);
  }
  if (o.wainscot) {
    const wy = fy - 44;
    ctx.fillStyle = o.wainscot;
    ctx.fillRect(0, wy, SCENE_W, 44);
    ctx.fillStyle = shade(o.wainscot, 1.35);
    ctx.fillRect(0, wy, SCENE_W, 1);
    ctx.fillStyle = shade(o.wainscot, 0.6);
    ctx.fillRect(0, wy + 1, SCENE_W, 2);
    for (let px = 6; px < SCENE_W; px += 40) {
      ctx.fillStyle = shade(o.wainscot, 0.8);
      ctx.strokeStyle = shade(o.wainscot, 0.8);
      ctx.fillRect(px, wy + 8, 30, 1);
      ctx.fillRect(px, wy + 8, 1, 28);
      ctx.fillStyle = shade(o.wainscot, 1.15);
      ctx.fillRect(px + 1, wy + 36, 30, 1);
      ctx.fillRect(px + 30, wy + 9, 1, 28);
    }
  }

  // floor, receding toward a vanishing point above the room
  const fk = o.floorKind ?? "planks";
  vGradient(ctx, 0, fy, SCENE_W, SCENE_H - fy, [shade(o.floor, 1.15), o.floor, shade(o.floor, 0.6)], 10);
  const vx = 240;
  const vy = fy - 120;
  if (fk !== "carpet") {
    ctx.fillStyle = shade(o.floor, fk === "tiles" ? 0.72 : 0.78);
    const step = fk === "tiles" ? 30 : 20;
    for (let bx = -720; bx <= 1200; bx += step) {
      for (let yy = fy; yy < SCENE_H; yy++) {
        const t = (yy - vy) / (SCENE_H - vy);
        const xx = Math.round(vx + (bx - vx) * t);
        if (xx >= 0 && xx < SCENE_W) ctx.fillRect(xx, yy, 1, 1);
      }
    }
    if (fk === "tiles") {
      for (let i = 1; i < 9; i++) {
        const yy = Math.round(fy + (SCENE_H - fy) * Math.pow(i / 9, 1.5));
        ctx.fillRect(0, yy, SCENE_W, 1);
      }
    } else {
      for (let i = 0; i < 70; i++) {
        const yy = fy + 2 + Math.floor(rnd() * (SCENE_H - fy - 2));
        const t = (yy - vy) / (SCENE_H - vy);
        ctx.fillRect(Math.floor(rnd() * SCENE_W), yy, Math.max(2, Math.round(step * t * 0.8)), 1);
      }
    }
  } else {
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = rnd() < 0.5 ? shade(o.floor, 0.88) : shade(o.floor, 1.1);
      ctx.fillRect(Math.floor(rnd() * SCENE_W), fy + Math.floor(rnd() * (SCENE_H - fy)), 1, 1);
    }
  }
  // skirting + shadow where the wall meets the floor
  ctx.fillStyle = shade(o.wall, 0.45);
  ctx.fillRect(0, fy - 4, SCENE_W, 4);
  ctx.fillStyle = shade(o.wall, 0.78);
  ctx.fillRect(0, fy - 4, SCENE_W, 1);
  const ao = ctx.createLinearGradient(0, fy, 0, fy + 12);
  ao.addColorStop(0, "rgba(5, 3, 12,0.5)");
  ao.addColorStop(1, "rgba(5, 3, 12,0)");
  ctx.fillStyle = ao;
  ctx.fillRect(0, fy, SCENE_W, 12);
}

/** Darken the room's corners — light pools in the middle, never the edges. */
export function roomVignette(ctx: CanvasRenderingContext2D, strength = 0.45) {
  const l = ctx.createLinearGradient(0, 0, 70, 0);
  l.addColorStop(0, `rgba(5, 3, 12,${strength})`);
  l.addColorStop(1, "rgba(5, 3, 12,0)");
  ctx.fillStyle = l;
  ctx.fillRect(0, 0, 70, SCENE_H);
  const r = ctx.createLinearGradient(SCENE_W, 0, SCENE_W - 70, 0);
  r.addColorStop(0, `rgba(5, 3, 12,${strength})`);
  r.addColorStop(1, "rgba(5, 3, 12,0)");
  ctx.fillStyle = r;
  ctx.fillRect(SCENE_W - 70, 0, 70, SCENE_H);
  const t = ctx.createLinearGradient(0, 0, 0, 40);
  t.addColorStop(0, `rgba(5, 3, 12,${strength * 0.9})`);
  t.addColorStop(1, "rgba(5, 3, 12,0)");
  ctx.fillStyle = t;
  ctx.fillRect(0, 0, SCENE_W, 40);
}

export interface WindowOpts {
  /** pane grid */
  panes?: [number, number];
  view?: "city" | "harbor" | "trees" | "sky";
  sill?: boolean;
  blinds?: boolean;
  /** throw a shaft of light into the room down to this floor line */
  beam?: { floorY: number; dx: number; color?: string; alpha?: number };
}

/** A window onto the night: frame, glass, a slice of Veilport, weather on the pane. */
export function glassWindow(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  mood: Mood,
  weather: Weather,
  rnd: () => number,
  out: PaintedScene,
  o: WindowOpts = {}
) {
  const { x, y, w, h } = r;
  ctx.fillStyle = "#090c14";
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  sky(ctx, mood, h, x, w, y);
  const view = o.view ?? "city";
  if (view === "city" || view === "harbor") {
    cityGlowRect(ctx, x, y + h * 0.4, w, h * 0.6, mood.glow, 0.18);
    const baseY = y + h;
    let bx = x - 2;
    while (bx < x + w) {
      const bw = 4 + Math.floor(rnd() * 7);
      const bh = Math.floor(h * (view === "harbor" ? 0.08 : 0.15) + rnd() * h * (view === "harbor" ? 0.12 : 0.45));
      ctx.fillStyle = mix("#0d1220", mood.haze, 0.18);
      ctx.fillRect(bx, baseY - bh, Math.min(bw, x + w - bx), bh);
      for (let wy = baseY - bh + 2; wy < baseY - 1; wy += 3) {
        for (let wx = bx + 1; wx < Math.min(bx + bw - 1, x + w); wx += 2) {
          if (rnd() < 0.3) {
            ctx.fillStyle = rnd() < 0.75 ? mood.window : mood.windowCool;
            ctx.fillRect(wx, wy, 1, 1);
          }
        }
      }
      bx += bw + (rnd() < 0.3 ? 2 : 0);
    }
    if (view === "harbor") {
      ctx.fillStyle = mix(mood.skyBottom, "#05080e", 0.55);
      ctx.fillRect(x, baseY - Math.floor(h * 0.08), w, Math.floor(h * 0.08));
    }
  } else if (view === "trees") {
    for (let i = 0; i < w; i += 3) {
      const th = Math.floor(h * 0.3 + rnd() * h * 0.3);
      ctx.fillStyle = "#070b0a";
      ctx.fillRect(x + i, y + h - th, 3, th);
    }
  }
  if (weather.kind === "fog") {
    ctx.fillStyle = rgba(mood.haze, 0.42);
    ctx.fillRect(x, y, w, h);
  }
  if (weather.kind === "rain" || weather.kind === "storm") {
    for (let i = 0; i < Math.max(6, w / 3); i++) {
      const rx = x + Math.floor(rnd() * w);
      const ry = y + Math.floor(rnd() * h * 0.6);
      const rl = 3 + Math.floor(rnd() * h * 0.4);
      ctx.fillStyle = rgba("#c8dcf0", 0.1 + rnd() * 0.08);
      ctx.fillRect(rx, ry, 1, Math.min(rl, y + h - ry));
      ctx.fillStyle = rgba("#e8f4ff", 0.35);
      ctx.fillRect(rx, Math.min(y + h - 1, ry + rl), 1, 1);
    }
  }
  out.windows.push({ x, y, w, h });
  if (o.blinds) {
    ctx.fillStyle = "#130f0b";
    for (let yy = y; yy < y + h; yy += 5) ctx.fillRect(x, yy, w, 2);
  }
  const [pc, pr] = o.panes ?? [2, 2];
  ctx.fillStyle = "#090c14";
  for (let i = 1; i < pc; i++) ctx.fillRect(x + Math.round((w * i) / pc) - 1, y, 2, h);
  for (let i = 1; i < pr; i++) ctx.fillRect(x, y + Math.round((h * i) / pr) - 1, w, 2);
  if (o.sill !== false) {
    ctx.fillStyle = "#2a2420";
    ctx.fillRect(x - 5, y + h + 3, w + 10, 2);
    ctx.fillStyle = "#3a322c";
    ctx.fillRect(x - 5, y + h + 3, w + 10, 1);
  }
  if (o.beam) {
    const { floorY, dx } = o.beam;
    out.beams.push({
      pts: [
        [x, y + 2],
        [x + w, y + 2],
        [x + w + dx + w * 0.35, floorY + 30],
        [x + dx - w * 0.15, floorY + 30],
      ],
      color: o.beam.color ?? mood.windowCool,
      alpha: o.beam.alpha ?? 0.07,
      stripes: o.blinds ? Math.round(h / 5) : undefined,
      motes: true,
    });
  }
}

function cityGlowRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, alpha: number) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(1, rgba(color, alpha));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

/** A desk lamp with a shade, a hot bulb and a cone of light onto the desk. */
export function deskLamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  mood: Mood,
  out: PaintedScene,
  dir: 1 | -1 = 1,
  shadeColor = "#1c2a20"
) {
  ctx.fillStyle = "#05070c";
  ctx.fillRect(x - 2, y - 1, 6, 1);
  ctx.fillRect(x, y - 10, 2, 10);
  ctx.fillStyle = shadeColor;
  const sx = dir > 0 ? x - 1 : x - 7;
  ctx.fillRect(sx, y - 13, 10, 3);
  ctx.fillRect(sx + 1, y - 14, 8, 1);
  ctx.fillStyle = shade(shadeColor, 1.8);
  ctx.fillRect(sx + 1, y - 13, 8, 1);
  ctx.fillStyle = mix(mood.window, "#ffffff", 0.3);
  ctx.fillRect(sx + 3, y - 10, 4, 1);
  out.lights.push({ x: sx + 3, y: y - 10, w: 4, h: 1, color: mood.window, flicker: 0.06, glow: 2.4 });
  out.beams.push({
    pts: [
      [sx + 1, y - 10],
      [sx + 9, y - 10],
      [sx + 22, y],
      [sx - 12, y],
    ],
    color: mood.window,
    alpha: 0.14,
  });
  pool(ctx, sx + 5, y, 26, mood.window, 0.32);
}

/** A hanging lamp: cord, metal shade, bulb, and a soft cone toward the floor. */
export function pendant(
  ctx: CanvasRenderingContext2D,
  x: number,
  cord: number,
  mood: Mood,
  out: PaintedScene,
  o: { width?: number; color?: string; shadeColor?: string; cone?: number; top?: number } = {}
) {
  const w = o.width ?? 13;
  const col = o.color ?? mood.window;
  const ceiling = o.top ?? 0;
  ctx.fillStyle = "#05070c";
  ctx.fillRect(x, ceiling, 1, cord - ceiling);
  ctx.fillStyle = o.shadeColor ?? "#141a22";
  ctx.fillRect(x - Math.floor(w / 2) + 2, cord, w - 4, 2);
  ctx.fillRect(x - Math.floor(w / 2), cord + 2, w, 3);
  ctx.fillStyle = mix(col, "#ffffff", 0.35);
  ctx.fillRect(x - Math.floor(w / 2) + 2, cord + 5, w - 4, 1);
  out.lights.push({ x: x - Math.floor(w / 2) + 2, y: cord + 5, w: w - 4, h: 1, color: col, flicker: 0.08, glow: 2.2 });
  if (o.cone) {
    out.beams.push({
      pts: [
        [x - Math.floor(w / 2) + 1, cord + 6],
        [x + Math.floor(w / 2), cord + 6],
        [x + o.cone, cord + 120],
        [x - o.cone, cord + 120],
      ],
      color: col,
      alpha: 0.06,
    });
  }
}

/* ------------------------------------------------------------------ */
/* water                                                               */
/* ------------------------------------------------------------------ */

/**
 * Mirror everything painted above `top` down into the water band, squashed
 * by perspective, broken by ripple lines and swayed by the swell.
 */
export function waterReflection(
  ctx: CanvasRenderingContext2D,
  top: number,
  bottom: number,
  water: string,
  rnd: () => number,
  o: { squash?: number; strength?: number; amp?: number } = {}
) {
  const t = Math.round(top);
  const b = Math.min(SCENE_H, Math.round(bottom));
  if (t <= 0 || b <= t) return;
  const squash = o.squash ?? 0.6;
  const strength = o.strength ?? 0.6;
  const amp = o.amp ?? 1.4;
  const src = ctx.getImageData(0, 0, SCENE_W, t).data;
  const img = ctx.getImageData(0, t, SCENE_W, b - t);
  const d = img.data;
  const [wr, wg, wb] = rgbOf(water);
  const phase = rnd() * 10;
  const hgt = b - t;
  for (let y = 0; y < hgt; y++) {
    const sy = Math.round(t - 1 - y / squash);
    if (sy < 0) break;
    const fade = 1 - y / hgt;
    const ripple = y % 3 === 2 ? 0.3 : 1;
    const dx = Math.round(Math.sin(y * 0.85 + phase) * amp * (0.4 + y / 22));
    const k = strength * (0.35 + 0.65 * fade) * ripple;
    for (let x = 0; x < SCENE_W; x++) {
      const sx = Math.min(SCENE_W - 1, Math.max(0, x + dx));
      const si = (sy * SCENE_W + sx) * 4;
      const di = (y * SCENE_W + x) * 4;
      d[di] += (src[si] * 0.72 + wr * 0.28 - d[di]) * k;
      d[di + 1] += (src[si + 1] * 0.72 + wg * 0.28 - d[di + 1]) * k;
      d[di + 2] += (src[si + 2] * 0.76 + wb * 0.24 - d[di + 2]) * k;
    }
  }
  ctx.putImageData(img, 0, t);
}

/** Vertical light streaks on open water beneath a light near the waterline. */
export function waterStreak(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, len: number, color: string, rnd: () => number, alpha = 0.3) {
  for (let i = 1; i < len; i++) {
    if (rnd() < 0.35) continue;
    const fall = 1 - i / len;
    const ww = Math.max(1, Math.round(w * (0.5 + rnd() * 1.2)));
    ctx.fillStyle = rgba(color, alpha * fall);
    ctx.fillRect(Math.round(x + (rnd() - 0.5) * 3), y + i, ww, 1);
  }
}
