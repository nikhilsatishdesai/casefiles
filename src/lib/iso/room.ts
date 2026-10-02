import { HW, HH } from "./core";
import { bakeBackground, litProp, makeLighter, type Baked, type Lighter } from "./render";
import { paintProp, propHeight } from "./props";
import type { IsoProp, IsoTemplate } from "./types";

/**
 * A room, assembled: the baked background, every prop painted and lit in
 * place, and the walkable grid. Built once per visit; the stage only moves
 * people through it.
 */

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** px above the floor */
  z0: number;
  z1: number;
}

export interface RoomProp {
  prop: IsoProp;
  lit: HTMLCanvasElement;
  emissive: HTMLCanvasElement | null;
  /** glow points, in baked-canvas coords */
  glows: { x: number; y: number; color: string; r: number }[];
  box: Box;
  /** top-left of the prop canvas, in baked-canvas coords */
  sx: number;
  sy: number;
}

export interface Room {
  t: IsoTemplate;
  baked: Baked;
  lighter: Lighter;
  props: RoomProp[];
  /** w*h, 1 where something solid stands */
  blocked: Uint8Array;
}

export function isSolid(p: IsoProp): boolean {
  if (p.solid !== undefined) return p.solid;
  if ((p.z ?? 0) > 0) return false;
  return p.kind !== "papers" && p.kind !== "pendant";
}

export function propBox(p: IsoProp): Box {
  // a hanging lamp only occupies the air above head height
  const z0 = p.kind === "pendant" ? 56 : p.z ?? 0;
  return { x0: p.x, y0: p.y, x1: p.x + (p.w ?? 1), y1: p.y + (p.d ?? 1), z0, z1: z0 + propHeight(p) };
}

export function buildRoom(t: IsoTemplate, props: IsoProp[]): Room {
  const baked = bakeBackground(t, props.filter(isSolid));
  const lighter = makeLighter(t.ambient, baked.lights);
  const rps: RoomProp[] = props.map((p) => {
    const art = paintProp(p);
    const lit = litProp(art, p, baked, lighter);
    const sx = baked.ox + (p.x - p.y) * HW - art.ax;
    const sy = baked.oy + (p.x + p.y) * HH - art.ay;
    return {
      prop: p,
      lit,
      emissive: art.emissive,
      glows: art.glows.map((g) => ({ ...g, x: g.x + sx, y: g.y + sy })),
      box: propBox(p),
      sx,
      sy,
    };
  });
  const blocked = new Uint8Array(t.w * t.h);
  for (const z of t.zones ?? []) {
    if (!z.solid) continue;
    for (let y = Math.floor(z.y); y < Math.ceil(z.y + z.h); y++) {
      for (let x = Math.floor(z.x); x < Math.ceil(z.x + z.w); x++) {
        if (x >= 0 && y >= 0 && x < t.w && y < t.h) blocked[y * t.w + x] = 1;
      }
    }
  }
  for (const p of props) {
    if (!isSolid(p)) continue;
    const b = propBox(p);
    for (let y = Math.floor(b.y0 + 0.01); y < Math.ceil(b.y1 - 0.01); y++) {
      for (let x = Math.floor(b.x0 + 0.01); x < Math.ceil(b.x1 - 0.01); x++) {
        if (x >= 0 && y >= 0 && x < t.w && y < t.h) blocked[y * t.w + x] = 1;
      }
    }
  }
  return { t, baked, lighter, props: rps, blocked };
}

/* ------------------------------------------------------------------ */
/* depth sorting                                                       */
/* ------------------------------------------------------------------ */

/** true when a must be drawn after (in front of) b */
export function inFront(a: Box, b: Box): boolean {
  if (a.x0 >= b.x1 - 1e-3) return true;
  if (a.y0 >= b.y1 - 1e-3) return true;
  if (b.x0 >= a.x1 - 1e-3) return false;
  if (b.y0 >= a.y1 - 1e-3) return false;
  // footprints overlap: whatever stands on top goes last
  if (a.z0 >= b.z1 - 1e-3) return true;
  if (b.z0 >= a.z1 - 1e-3) return false;
  return a.x0 + a.x1 + a.y0 + a.y1 > b.x0 + b.x1 + b.y0 + b.y1;
}

/**
 * Topological depth sort: anything a box stands in front of is drawn first.
 * Returns indices in draw order. Cheap enough to run every frame for a
 * room's worth of things.
 */
export function depthOrder(boxes: Box[]): number[] {
  const n = boxes.length;
  const behind: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    const a = boxes[i];
    for (let j = i + 1; j < n; j++) {
      const b = boxes[j];
      // only pairs whose screen extents can overlap matter
      const ax0 = a.x0 - a.y1;
      const ax1 = a.x1 - a.y0;
      const bx0 = b.x0 - b.y1;
      const bx1 = b.x1 - b.y0;
      if (ax1 <= bx0 || bx1 <= ax0) continue;
      if (inFront(a, b)) behind[i].push(j);
      else behind[j].push(i);
    }
  }
  const out: number[] = [];
  const state = new Uint8Array(n);
  const visit = (i: number) => {
    if (state[i]) return;
    state[i] = 1;
    for (const j of behind[i]) visit(j);
    out.push(i);
  };
  // visit back-to-front so ties fall in a natural order
  const seed = Array.from({ length: n }, (_, i) => i).sort(
    (i, j) => boxes[i].x0 + boxes[i].y0 - (boxes[j].x0 + boxes[j].y0)
  );
  for (const i of seed) visit(i);
  return out;
}
