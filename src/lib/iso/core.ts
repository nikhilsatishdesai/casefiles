import { mix, rgbOf, shade, rgba } from "@/lib/scenes/primitives";

/**
 * Isometric fundamentals: projection, crisp pixel rasterizers, and a skew
 * helper that lays flat pixel art onto the two back walls.
 */

export { mix, shade, rgba, rgbOf };

export const TW = 32;
export const TH = 16;
export const HW = TW / 2;
export const HH = TH / 2;

/** Screen offset of tile-space point (x, y) relative to the map origin (top corner of tile 0,0). */
export function iso(x: number, y: number): [number, number] {
  return [(x - y) * HW, (x + y) * HH];
}

/** Inverse projection: screen → tile space (fractional). */
export function unIso(sx: number, sy: number): [number, number] {
  const a = sx / HW;
  const b = sy / HH;
  return [(a + b) / 2, (b - a) / 2];
}

/**
 * Crisp convex polygon fill — scanline rasterized with integer spans, so
 * edges step like hand-placed pixels instead of anti-aliasing.
 */
export function fillPoly(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string) {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of pts) {
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  ctx.fillStyle = color;
  for (let y = Math.floor(minY); y < Math.ceil(maxY); y++) {
    const yc = y + 0.5;
    let xl = Infinity;
    let xr = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      if ((yc >= y1 && yc < y2) || (yc >= y2 && yc < y1)) {
        const x = x1 + ((yc - y1) / (y2 - y1)) * (x2 - x1);
        xl = Math.min(xl, x);
        xr = Math.max(xr, x);
      }
    }
    if (xr > xl) {
      const a = Math.round(xl);
      const b = Math.round(xr);
      if (b > a) ctx.fillRect(a, y, b - a, 1);
    }
  }
}

/** A tile diamond whose top corner sits at (sx, sy). */
export function diamond(sx: number, sy: number, w = 1, d = 1): [number, number][] {
  return [
    [sx, sy],
    [sx + w * HW, sy + w * HH],
    [sx + (w - d) * HW, sy + (w + d) * HH],
    [sx - d * HW, sy + d * HH],
  ];
}

export interface BoxColors {
  top: string;
  left: string;
  right: string;
  /** outline / edge darkening */
  edge?: string;
  /** highlight along the top's front edges */
  rim?: string;
}

/**
 * An iso box: footprint w×d tiles (fractions allowed), h px tall, whose
 * footprint top corner sits at (sx, sy). Returns the three face polygons.
 */
export function isoBox(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, d: number, h: number, c: BoxColors) {
  const T: [number, number] = [sx, sy];
  const R: [number, number] = [sx + w * HW, sy + w * HH];
  const B: [number, number] = [sx + (w - d) * HW, sy + (w + d) * HH];
  const L: [number, number] = [sx - d * HW, sy + d * HH];
  const up = (p: [number, number]): [number, number] => [p[0], p[1] - h];
  const left: [number, number][] = [L, B, up(B), up(L)];
  const right: [number, number][] = [B, R, up(R), up(B)];
  const top: [number, number][] = [up(T), up(R), up(B), up(L)];
  fillPoly(ctx, left, c.left);
  fillPoly(ctx, right, c.right);
  fillPoly(ctx, top, c.top);
  if (c.rim) {
    // the lit front edges of the top face
    line(ctx, up(L), up(B), c.rim);
    line(ctx, up(B), up(R), c.rim);
  }
  if (c.edge) {
    line(ctx, B, up(B), c.edge);
  }
  return { T, R, B, L, top, left, right };
}

/** A 1-px line between two points, stepped like pixel art. */
export function line(ctx: CanvasRenderingContext2D, a: [number, number], b: [number, number], color: string) {
  ctx.fillStyle = color;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const n = Math.max(Math.abs(dx), Math.abs(dy));
  for (let i = 0; i <= n; i++) {
    const t = n ? i / n : 0;
    ctx.fillRect(Math.round(a[0] + dx * t - 0.5), Math.round(a[1] + dy * t - 0.5), 1, 1);
  }
}

/** Run a draw callback with flat pixel art skewed onto a back wall. */
export function onWall(
  ctx: CanvasRenderingContext2D,
  wall: "left" | "right",
  x0: number,
  y0: number,
  draw: (c: CanvasRenderingContext2D) => void
) {
  ctx.save();
  // left wall reads left→right climbing toward the back corner; right wall descends away from it
  ctx.setTransform(1, wall === "left" ? -0.5 : 0.5, 0, 1, x0, y0);
  draw(ctx);
  ctx.restore();
}

/** Paint flat pixel art into an offscreen canvas, then skew it onto a wall (crisp, no smoothing). */
export function wallArt(
  ctx: CanvasRenderingContext2D,
  wall: "left" | "right",
  x0: number,
  y0: number,
  w: number,
  h: number,
  draw: (c: CanvasRenderingContext2D) => void
) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  draw(g);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // shear pixel columns individually so the slope stays a clean 2:1 staircase
  const k = wall === "left" ? -0.5 : 0.5;
  for (let x = 0; x < c.width; x++) {
    ctx.drawImage(c, x, 0, 1, c.height, Math.round(x0 + x), Math.round(y0 + x * k), 1, c.height);
  }
  ctx.restore();
}

export function canvas(w: number, h: number): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.imageSmoothingEnabled = false;
  return { c, g };
}

/** Deterministic per-tile noise in [0,1). */
export function hash2(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

/** Blend a list of lights into a tint for something standing at (x, y). */
export function lightAt(
  x: number,
  y: number,
  lights: { x: number; y: number; color: string; radius: number; intensity: number }[],
  ambient: string,
  t = 0
): { tint: number; rim: number; rimColor: number; level: number } {
  const [ar, ag, ab] = rgbOf(ambient).map((c) => Math.min(255, c * 1.3 + 8));
  let r = ar;
  let g = ag;
  let b = ab;
  let best = 0;
  let bestColor = 0xffffff;
  for (const l of lights) {
    const d = Math.hypot(l.x - x, l.y - y);
    if (d >= l.radius) continue;
    const f = Math.pow(1 - d / l.radius, 1.5) * l.intensity * (1 + 0.04 * Math.sin(t * 3 + l.x));
    const [lr, lg, lb] = rgbOf(l.color);
    r += lr * f * 1.8;
    g += lg * f * 1.8;
    b += lb * f * 1.8;
    if (f > best) {
      best = f;
      bestColor = (lr << 16) | (lg << 8) | lb;
    }
  }
  const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const tint = (cl(r) << 16) | (cl(g) << 8) | cl(b);
  return { tint, rim: Math.min(1, best * 1.4), rimColor: bestColor, level: Math.min(1, (r + g + b) / 600) };
}
