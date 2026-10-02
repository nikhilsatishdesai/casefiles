"use client";

import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Rectangle, Sprite, Texture } from "pixi.js";
import type { TimeOfDay, Weather } from "@/lib/engine/types";
import type { IsoScene, IsoTarget } from "@/lib/iso/types";
import { buildRoom, depthOrder, type Box, type Room } from "@/lib/iso/room";
import { spriteSheet, frameRect, DETECTIVE, FW, FH, AX, AY, POSES, LAYERS, PERSON_H, type Facing, type Pose, type Layer, type SpriteDef } from "@/lib/iso/sprites";
import { HW, HH, unIso, lightAt, rgbOf, mix } from "@/lib/iso/core";
import { findPath, bestApproach, slide, fits, nearestOpen, open as tileOpen, type WalkGrid } from "@/lib/iso/path";
import { audio } from "@/lib/audio/engine";
import { useReducedMotionPref } from "@/lib/useMotion";
import { hasEscapeLayer } from "@/components/ui/escape";

/**
 * IsoStage — walk Veilport.
 *
 * The room is a baked, lit pixel-art diorama; the detective walks it with
 * WASD / arrow keys or by clicking (A* pathfinding), and uses whatever is
 * within reach with Space, Enter or F — or by clicking it directly.
 * People and props are depth-sorted every frame, tinted by the room's
 * lights as they move through them, and rim-lit by the nearest neon. Rain
 * falls outside (and behind the glass indoors), lightning answers the
 * thunder, footsteps follow the floor.
 */

export interface TargetState {
  visible: boolean;
  inspected: boolean;
  /** still holds evidence to pick up */
  evidence: boolean;
  /** an interview already on file */
  talked?: boolean;
}

export interface IsoStageApi {
  walkTo: (targetId: string) => void;
}

interface Props {
  scene: IsoScene;
  states: Record<string, TargetState>;
  weather: Weather;
  timeOfDay: TimeOfDay;
  paused?: boolean;
  onInteract: (t: IsoTarget) => void;
  /** the player moved or clicked (dismisses arrival narration) */
  onActivity?: () => void;
  /** what's within reach changed */
  onFocus?: (t: IsoTarget | null) => void;
  apiRef?: React.MutableRefObject<IsoStageApi | null>;
}

/* ------------------------------------------------------------------ */
/* caches that outlive a visit                                         */
/* ------------------------------------------------------------------ */

const ROOMS = new Map<string, Room>();
function roomFor(scene: IsoScene): Room {
  const hit = ROOMS.get(scene.key);
  if (hit) {
    ROOMS.delete(scene.key);
    ROOMS.set(scene.key, hit);
    return hit;
  }
  const r = buildRoom(scene.template, scene.props);
  ROOMS.set(scene.key, r);
  while (ROOMS.size > 4) ROOMS.delete(ROOMS.keys().next().value!);
  return r;
}

/** where the detective stood in each place, so coming back from an interview resumes there */
const MEMORY = new Map<string, { x: number; y: number; facing: Facing; mirror: boolean }>();

const ALPHA = new WeakMap<HTMLCanvasElement, Uint8ClampedArray>();
function alphaOf(c: HTMLCanvasElement): Uint8ClampedArray {
  let a = ALPHA.get(c);
  if (!a) {
    a = c.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, c.width, c.height).data;
    ALPHA.set(c, a);
  }
  return a;
}

const OUTLINES = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
function outlineOf(src: HTMLCanvasElement): HTMLCanvasElement {
  const hit = OUTLINES.get(src);
  if (hit) return hit;
  const w = src.width;
  const h = src.height;
  const a = alphaOf(src);
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (solid(x, y)) continue;
      if (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1)) {
        const o = (y * w + x) * 4;
        img.data[o] = img.data[o + 1] = img.data[o + 2] = img.data[o + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  OUTLINES.set(src, out);
  return out;
}

/* ------------------------------------------------------------------ */
/* little pixel textures                                               */
/* ------------------------------------------------------------------ */

function cv(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  draw(g);
  return c;
}

const glowCanvas = () =>
  cv(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.2, "rgba(255,255,255,0.5)");
    gr.addColorStop(0.5, "rgba(255,255,255,0.14)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
  });

const shadowCanvas = () =>
  cv(20, 8, (g) => {
    const rows = [
      [6, 8],
      [3, 14],
      [2, 16],
      [2, 16],
      [3, 14],
      [6, 8],
    ];
    rows.forEach(([x, w], y) => {
      g.fillStyle = y === 0 || y === 5 ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.85)";
      g.fillRect(x, y + 1, w, 1);
    });
  });

/** an evidence marker: a faceted diamond with a hot core */
const diamondCanvas = (core: string, edge: string) =>
  cv(9, 11, (g) => {
    const rows = [
      [4, 1],
      [3, 3],
      [2, 5],
      [1, 7],
      [0, 9],
      [1, 7],
      [2, 5],
      [3, 3],
      [4, 1],
    ];
    rows.forEach(([x, w], y) => {
      g.fillStyle = "#120818";
      g.fillRect(x - 1 < 0 ? 0 : x - 1, y + 1, w + 2 > 9 ? 9 : w + 2, 1);
    });
    rows.forEach(([x, w], y) => {
      g.fillStyle = edge;
      g.fillRect(x, y + 1, w, 1);
      if (w > 2) {
        g.fillStyle = core;
        g.fillRect(x + 1, y + 1, Math.max(1, Math.floor(w / 2) - 1), 1);
      }
    });
    g.fillStyle = "#ffffff";
    g.fillRect(3, 4, 1, 1);
  });

/** a speech bubble for people */
const bubbleCanvas = () =>
  cv(13, 11, (g) => {
    g.fillStyle = "#120818";
    g.fillRect(1, 0, 11, 9);
    g.fillRect(0, 1, 13, 7);
    g.fillRect(3, 9, 3, 2);
    g.fillStyle = "#f4ecff";
    g.fillRect(2, 1, 9, 7);
    g.fillRect(1, 2, 11, 5);
    g.fillRect(4, 8, 1, 2);
    g.fillStyle = "#2a1838";
    g.fillRect(3, 4, 1, 1);
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);
  });

const num = (c: string) => {
  const [r, g, b] = rgbOf(c);
  return (r << 16) | (g << 8) | b;
};

/* ------------------------------------------------------------------ */
/* actors                                                              */
/* ------------------------------------------------------------------ */

type FrameKey = `${Facing}:${Pose}:${Layer}`;

interface Actor {
  id: string;
  player: boolean;
  x: number;
  y: number;
  facing: Facing;
  mirror: boolean;
  walkT: number;
  idleT: number;
  moving: boolean;
  lastStep: number;
  c: Container;
  body: Sprite;
  /** the head, kept in a key light so faces always read */
  face: Sprite;
  /** next blink, in stage seconds */
  blinkAt: number;
  rim: Sprite;
  rimTop: Sprite;
  shadow: Sprite;
  frames: Map<FrameKey, Texture>;
}

/** facing + mirroring for a direction of travel in tile space */
function faceFor(dx: number, dy: number, prev: { facing: Facing; mirror: boolean }): { facing: Facing; mirror: boolean } {
  const sx = dx - dy;
  const sy = dx + dy;
  const facing: Facing = sy > 0.05 ? "front" : sy < -0.05 ? "back" : prev.facing;
  const mirror = sx > 0.05 ? true : sx < -0.05 ? false : prev.mirror;
  return { facing, mirror };
}

const MOVE: Record<string, [number, number]> = {
  w: [-1, -1],
  arrowup: [-1, -1],
  s: [1, 1],
  arrowdown: [1, 1],
  a: [-1, 1],
  arrowleft: [-1, 1],
  d: [1, -1],
  arrowright: [1, -1],
};

const SPEED = 3.4; // tiles per second
const REACH = 0.8; // tiles from a footprint's edge

function rectDist(x: number, y: number, tiles: [number, number][]): number {
  let best = Infinity;
  for (const [tx, ty] of tiles) {
    const dx = Math.max(tx - x, 0, x - (tx + 1));
    const dy = Math.max(ty - y, 0, y - (ty + 1));
    best = Math.min(best, Math.hypot(dx, dy));
  }
  return best;
}

function pointInPoly(x: number, y: number, poly: [number, number][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function verb(t: IsoTarget, st?: TargetState) {
  if (t.verb) return t.verb;
  if (t.kind === "npc") return st?.talked ? "Talk again" : "Talk to";
  if (t.kind === "exit") return "Leave";
  return st?.inspected ? "Look again" : "Inspect";
}

/* ------------------------------------------------------------------ */

export default function IsoStage({ scene, states, weather, timeOfDay, paused, onInteract, onActivity, onFocus, apiRef }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const statesRef = useRef(states);
  statesRef.current = states;
  const pausedRef = useRef(!!paused);
  pausedRef.current = !!paused;
  const cbRef = useRef({ onInteract, onActivity, onFocus });
  cbRef.current = { onInteract, onActivity, onFocus };
  const interactRef = useRef<(() => void) | null>(null);
  const reduce = useReducedMotionPref();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let destroyed = false;
    let app: Application | null = null;
    const textures: Texture[] = [];
    const cleanups: (() => void)[] = [];
    let saveMemory: (() => void) | null = null;

    (async () => {
      const room = roomFor(scene);
      const t = room.t;
      const b = room.baked;
      const a = new Application();
      await a.init({
        backgroundAlpha: 0,
        antialias: false,
        resolution: Math.min(2, window.devicePixelRatio || 1),
        autoDensity: true,
        roundPixels: true,
      });
      if (destroyed) {
        a.destroy(true);
        return;
      }
      app = a;
      const canvasEl = a.canvas;
      canvasEl.style.position = "absolute";
      canvasEl.style.inset = "0";
      canvasEl.style.width = "100%";
      canvasEl.style.height = "100%";
      canvasEl.style.touchAction = "none";
      host.prepend(canvasEl);

      const tex = (c: HTMLCanvasElement) => {
        const tt = Texture.from(c, true);
        tt.source.scaleMode = "nearest";
        textures.push(tt);
        return tt;
      };

      /* ---------------- layers ---------------- */
      const world = new Container();
      a.stage.addChild(world);
      const bgLayer = new Container();
      const floorFx = new Container();
      const entities = new Container();
      entities.sortableChildren = true;
      const glowLayer = new Container();
      const weatherLayer = new Container();
      const markerLayer = new Container();
      world.addChild(bgLayer, floorFx, entities, glowLayer, weatherLayer, markerLayer);
      bgLayer.addChild(new Sprite(tex(b.canvas)));

      const glowTex = tex(glowCanvas());
      const shadowTex = tex(shadowCanvas());
      const amberTex = tex(diamondCanvas("#fff2b0", "#ffb43d"));
      const cyanTex = tex(diamondCanvas("#e0fbff", "#3ad8ff"));
      const bubbleTex = tex(bubbleCanvas());

      const screenOf = (x: number, y: number, z = 0): [number, number] => [b.ox + (x - y) * HW, b.oy + (x + y) * HH - z];
      const diamondPathOn = (gr: Graphics, x: number, y: number, inset = 0) => {
        const [sx, sy] = screenOf(x, y);
        gr.poly([sx, sy + inset, sx + HW - inset * 2, sy + HH, sx, sy + HH * 2 - inset, sx - HW + inset * 2, sy + HH]);
      };

      /* ---------------- props ---------------- */
      const targetsById = new Map(scene.targets.map((tg) => [tg.id, tg]));
      const propTarget = new Map<string, IsoTarget>();
      for (const tg of scene.targets) if (tg.propId) propTarget.set(tg.propId, tg);
      const propViews = room.props.map((rp) => {
        const c = new Container();
        c.position.set(rp.sx, rp.sy);
        c.addChild(new Sprite(tex(rp.lit)));
        if (rp.emissive) c.addChild(new Sprite(tex(rp.emissive)));
        let outline: Sprite | null = null;
        if (propTarget.has(rp.prop.id)) {
          outline = new Sprite(tex(outlineOf(rp.lit)));
          outline.visible = false;
          c.addChild(outline);
        }
        entities.addChild(c);
        return { rp, c, outline, target: propTarget.get(rp.prop.id) ?? null };
      });

      /* ---------------- glows ---------------- */
      const glows = [...b.glows, ...room.props.flatMap((p) => p.glows)].map((g, i) => {
        const s = new Sprite(glowTex);
        s.anchor.set(0.5);
        s.position.set(g.x, g.y);
        s.scale.set((g.r * 2.2) / 64);
        s.tint = num(g.color);
        s.blendMode = "add";
        s.alpha = 0.4;
        glowLayer.addChild(s);
        return { s, base: 0.4, ph: i * 1.7, glitch: 0, next: 4 + ((i * 7.3) % 9) };
      });

      /* ---------------- walk grid ---------------- */
      const grid: WalkGrid = { w: t.w, h: t.h, blocked: new Uint8Array(room.blocked) };
      for (const p of scene.people) {
        const tx = Math.floor(p.x);
        const ty = Math.floor(p.y);
        if (tx >= 0 && ty >= 0 && tx < t.w && ty < t.h) grid.blocked[ty * t.w + tx] = 1;
      }

      /* ---------------- actors ---------------- */
      const makeActor = (id: string, def: SpriteDef, x: number, y: number, player: boolean): Actor => {
        const base = tex(spriteSheet(def));
        const frames = new Map<FrameKey, Texture>();
        for (const facing of ["front", "back"] as Facing[]) {
          for (const pose of POSES) {
            for (const layer of LAYERS) {
              const [fx, fy, fw, fh] = frameRect(pose, facing, layer);
              const ft = new Texture({ source: base.source, frame: new Rectangle(fx, fy, fw, fh) });
              textures.push(ft);
              frames.set(`${facing}:${pose}:${layer}`, ft);
            }
          }
        }
        const c = new Container();
        const body = new Sprite(frames.get("front:idle0:body")!);
        const face = new Sprite(frames.get("front:idle0:face")!);
        const rim = new Sprite(frames.get("front:idle0:rimL")!);
        const rimTop = new Sprite(frames.get("front:idle0:rimT")!);
        for (const s of [body, face, rim, rimTop]) s.anchor.set(AX / FW, AY / FH);
        rim.blendMode = "add";
        rimTop.blendMode = "add";
        c.addChild(body, face, rim, rimTop);
        entities.addChild(c);
        const shadow = new Sprite(shadowTex);
        shadow.anchor.set(0.5, 0.55);
        shadow.alpha = 0.55;
        floorFx.addChild(shadow);
        return { id, player, x, y, facing: "front", mirror: false, walkT: 0, idleT: Math.random() * 3, moving: false, lastStep: -1, c, body, face, blinkAt: 1 + Math.random() * 4, rim, rimTop, shadow, frames };
      };

      const memo = MEMORY.get(scene.key);
      let start: [number, number] = memo ? [memo.x, memo.y] : [t.spawn[0] + 0.5, t.spawn[1] + 0.5];
      if (!fits(grid, start[0], start[1])) {
        const [nx, ny] = nearestOpen(grid, start[0], start[1]);
        start = [nx + 0.5, ny + 0.5];
      }
      const player = makeActor("detective", DETECTIVE, start[0], start[1], true);
      if (memo) {
        player.facing = memo.facing;
        player.mirror = memo.mirror;
      } else {
        player.facing = "back";
        player.mirror = t.spawn[0] > t.w / 2;
      }
      const npcs = scene.people.map((p) => {
        const ac = makeActor(p.id, p.portrait, p.x, p.y, false);
        Object.assign(ac, faceFor(t.w / 2 - p.x, t.h - p.y, ac));
        return ac;
      });
      const actors = [player, ...npcs];
      saveMemory = () => MEMORY.set(scene.key, { x: player.x, y: player.y, facing: player.facing, mirror: player.mirror });

      /* ---------------- markers & highlights ---------------- */
      const markers = new Map<string, Sprite>();
      for (const tg of scene.targets) {
        if (tg.kind === "exit") continue;
        const s = new Sprite(tg.kind === "npc" ? bubbleTex : amberTex);
        s.anchor.set(0.5, 1);
        markerLayer.addChild(s);
        markers.set(tg.id, s);
      }
      const exitTarget = scene.targets.find((tg) => tg.kind === "exit") ?? null;
      // which way is "out": off whichever edge the exit tile sits on
      const [exX, exY] = exitTarget ? exitTarget.tiles[0] : [-9, -9];
      const outDir: [number, number] = exY >= t.h - 1 ? [0, 1] : exX >= t.w - 1 ? [1, 0] : exX <= 0 ? [-1, 0] : [0, -1];
      const exitG = new Graphics();
      floorFx.addChild(exitG);
      const fx = new Graphics();
      floorFx.addChild(fx);
      const decorFx = new Graphics();
      floorFx.addChild(decorFx);

      /* ---------------- weather ---------------- */
      const raining = weather.kind === "rain" || weather.kind === "storm";
      const storm = weather.kind === "storm";
      const calm = reduce;
      const rainG = new Graphics();
      const splashG = new Graphics();
      const flashG = new Graphics();
      weatherLayer.addChild(rainG, flashG);
      floorFx.addChild(splashG);
      let releaseStorm: (() => void) | null = null;
      if (storm && !calm) releaseStorm = audio.claimStorm();
      cleanups.push(() => releaseStorm?.());
      // indoors, rain only shows through the glass
      if (!t.outdoor && b.windows.length) {
        const mask = new Graphics();
        for (const w of b.windows) mask.poly(w.flat()).fill(0xffffff);
        weatherLayer.addChild(mask);
        rainG.mask = mask;
      }
      const winBox = b.windows.length
        ? b.windows.flat().reduce((m, [x, y]) => [Math.min(m[0], x), Math.min(m[1], y), Math.max(m[2], x), Math.max(m[3], y)], [Infinity, Infinity, -Infinity, -Infinity])
        : null;
      const drops: { x: number; y: number; len: number; v: number }[] = [];
      const nDrops = raining ? (t.outdoor ? Math.round(110 * (0.4 + weather.intensity)) : 40) : 0;
      const W = b.canvas.width;
      const H = b.canvas.height;
      const spawnDrop = (d: { x: number; y: number; len: number; v: number }, anywhere: boolean) => {
        if (!t.outdoor && winBox) {
          d.x = winBox[0] + Math.random() * (winBox[2] - winBox[0] + 10);
          d.y = anywhere ? winBox[1] + Math.random() * (winBox[3] - winBox[1]) : winBox[1] - 10;
        } else {
          d.x = -40 + Math.random() * (W + 80);
          d.y = anywhere ? Math.random() * H : -20 - Math.random() * 40;
        }
        d.len = 5 + Math.random() * 6;
        d.v = 190 + Math.random() * 120;
      };
      for (let i = 0; i < nDrops; i++) {
        const d = { x: 0, y: 0, len: 0, v: 0 };
        spawnDrop(d, true);
        drops.push(d);
      }
      const splashes: { x: number; y: number; age: number }[] = [];
      let flash = 0;
      let nextBolt = 6 + Math.random() * 10;
      const fog = weather.kind === "fog" && !!t.outdoor;
      const fogSprites: { s: Sprite; v: number }[] = [];
      if (fog) {
        for (let i = 0; i < 12; i++) {
          const s = new Sprite(glowTex);
          s.anchor.set(0.5);
          s.tint = i % 3 ? 0xb8b0e0 : 0xd8c8f0;
          s.alpha = 0.13 + Math.random() * 0.08;
          s.scale.set(4 + Math.random() * 4, 1.4 + Math.random() * 1.2);
          s.position.set(Math.random() * W, H * (0.35 + Math.random() * 0.6));
          weatherLayer.addChild(s);
          fogSprites.push({ s, v: 3 + Math.random() * 6 });
        }
      }
      // motes turning in the lamplight
      const motes = t.outdoor
        ? []
        : b.lights.slice(0, 6).flatMap((l) =>
            Array.from({ length: 5 }, (_, i) => {
              const s = new Sprite(Texture.WHITE);
              s.width = 1;
              s.height = 1;
              s.tint = num(mix(l.color, "#ffffff", 0.5));
              s.blendMode = "add";
              s.alpha = 0;
              glowLayer.addChild(s);
              return { s, l, ph: i * 1.3 + l.x, r: 0.4 + (i % 3) * 0.35 };
            })
          );

      /* ---------------- camera ---------------- */
      let scale = 3;
      let vw = host.clientWidth;
      let vh = host.clientHeight;
      let camX = screenOf(player.x, player.y)[0];
      let camY = screenOf(player.x, player.y)[1];
      const pickScale = () => {
        const fit = Math.min(vw / (W * 0.8), vh / (H * 0.8));
        let s = Math.floor(fit);
        if (vw < 700) s = Math.min(s, 2);
        return Math.max(2, Math.min(5, s));
      };
      const camTarget = (): [number, number] => {
        const [px, py] = screenOf(player.x, player.y, 24);
        const viewW = vw / scale;
        const viewH = vh / scale;
        const clampAxis = (p: number, view: number, size: number) => (view >= size ? size / 2 : Math.max(view / 2, Math.min(size - view / 2, p)));
        return [clampAxis(px, viewW, W), clampAxis(py, viewH, H)];
      };
      const placeWorld = () => {
        world.scale.set(scale);
        world.position.set(Math.round(vw / 2 - camX * scale), Math.round(vh * 0.53 - camY * scale));
      };
      const layout = () => {
        vw = host.clientWidth;
        vh = host.clientHeight;
        if (!vw || !vh) return;
        a.renderer.resize(vw, vh);
        scale = pickScale();
        [camX, camY] = camTarget();
        placeWorld();
      };
      const ro = new ResizeObserver(layout);
      ro.observe(host);
      cleanups.push(() => ro.disconnect());
      layout();

      /* ---------------- interaction ---------------- */
      let path: [number, number][] | null = null;
      let pending: IsoTarget | null = null;
      let focus: IsoTarget | null = null;
      let hover: IsoTarget | null = null;
      let hoverTile: [number, number] | null = null;
      let clickMark: { x: number; y: number; age: number } | null = null;
      const keys = new Set<string>();

      const visible = (tg: IsoTarget) => tg.kind !== "hotspot" || statesRef.current[tg.id]?.visible !== false;

      const faceToward = (tg: IsoTarget) => {
        const [ax, ay] = tg.anchor;
        Object.assign(player, faceFor(ax - player.x, ay - player.y, player));
        if (tg.kind === "npc") {
          const n = npcs.find((x) => x.id === tg.id);
          if (n) Object.assign(n, faceFor(player.x - n.x, player.y - n.y, n));
        }
      };

      const interact = (tg: IsoTarget) => {
        if (pausedRef.current) return;
        faceToward(tg);
        path = null;
        pending = null;
        cbRef.current.onInteract(tg);
      };
      interactRef.current = () => focus && interact(focus);

      const walkToTarget = (tg: IsoTarget) => {
        const res = bestApproach(grid, [player.x, player.y], tg.tiles);
        if (!res) return;
        if (!res.path.length) {
          interact(tg);
          return;
        }
        path = res.path;
        pending = tg;
        const [dx, dy] = res.tile;
        clickMark = { x: dx + 0.5, y: dy + 0.5, age: 0 };
      };
      if (apiRef) {
        apiRef.current = {
          walkTo: (id: string) => {
            const tg = targetsById.get(id);
            if (tg && !pausedRef.current) walkToTarget(tg);
          },
        };
        cleanups.push(() => {
          if (apiRef.current) apiRef.current = null;
        });
      }

      const toWorld = (clientX: number, clientY: number): [number, number] => {
        const r = host.getBoundingClientRect();
        return [(clientX - r.left - world.x) / scale, (clientY - r.top - world.y) / scale];
      };

      const pick = (wx: number, wy: number): IsoTarget | null => {
        // people first: they stand in front of things
        for (const n of npcs) {
          const [sx, sy] = screenOf(n.x, n.y);
          if (wx >= sx - 8 && wx <= sx + 8 && wy >= sy - PERSON_H && wy <= sy + 2) return targetsById.get(n.id) ?? null;
        }
        // then props, front-most first
        const kids = [...entities.children].sort((p, q) => q.zIndex - p.zIndex);
        for (const k of kids) {
          const pv = propViews.find((v) => v.c === k);
          if (!pv || !pv.target || !visible(pv.target) || !pv.c.visible) continue;
          const lx = Math.floor(wx - pv.rp.sx);
          const ly = Math.floor(wy - pv.rp.sy);
          const c = pv.rp.lit;
          if (lx < 0 || ly < 0 || lx >= c.width || ly >= c.height) continue;
          // a 1-px grace margin makes thin things clickable
          const al = alphaOf(c);
          for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const X = lx + ox;
            const Y = ly + oy;
            if (X >= 0 && Y >= 0 && X < c.width && Y < c.height && al[(Y * c.width + X) * 4 + 3] > 0) return pv.target;
          }
        }
        // wall fixtures
        for (const tg of scene.targets) {
          if (tg.decor === undefined || !visible(tg)) continue;
          const poly = b.decorPolys[tg.decor];
          if (poly?.length && pointInPoly(wx, wy, poly)) return tg;
        }
        // the floor
        const [u, v] = unIso(wx - b.ox, wy - b.oy);
        const tx = Math.floor(u);
        const ty = Math.floor(v);
        if (exitTarget && exX === tx && exY === ty) return exitTarget;
        for (const tg of scene.targets) {
          if (tg.kind === "hotspot" && visible(tg) && tg.decor === undefined && !tg.propId && tg.tiles.some(([x, y]) => x === tx && y === ty)) return tg;
        }
        return null;
      };

      const floorTile = (wx: number, wy: number): [number, number] | null => {
        const [u, v] = unIso(wx - b.ox, wy - b.oy);
        const tx = Math.floor(u);
        const ty = Math.floor(v);
        if (tx < 0 || ty < 0 || tx >= t.w || ty >= t.h) return null;
        return [tx, ty];
      };

      const label = labelRef.current;
      const onPointerMove = (e: PointerEvent) => {
        const [wx, wy] = toWorld(e.clientX, e.clientY);
        hover = pick(wx, wy);
        hoverTile = hover ? null : floorTile(wx, wy);
        host.style.cursor = hover ? "pointer" : hoverTile && tileOpen(grid, hoverTile[0], hoverTile[1]) ? "crosshair" : "default";
        if (label) {
          if (hover && !pausedRef.current) {
            const st = statesRef.current[hover.id];
            const r = host.getBoundingClientRect();
            label.textContent = hover.kind === "exit" ? "Leave · city map" : `${hover.label}${hover.kind === "hotspot" && st?.evidence ? "  ◆" : ""}`;
            label.style.transform = `translate(${Math.round(e.clientX - r.left + 14)}px, ${Math.round(e.clientY - r.top + 10)}px)`;
            label.style.opacity = "1";
          } else label.style.opacity = "0";
        }
      };
      const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0 || pausedRef.current || hasEscapeLayer()) return;
        (document.activeElement as HTMLElement | null)?.blur?.();
        cbRef.current.onActivity?.();
        audio.unlock();
        const [wx, wy] = toWorld(e.clientX, e.clientY);
        const tg = pick(wx, wy);
        if (tg) {
          walkToTarget(tg);
          return;
        }
        const tile = floorTile(wx, wy);
        if (!tile) return;
        let dest = tile;
        if (!tileOpen(grid, tile[0], tile[1])) {
          const res = bestApproach(grid, [player.x, player.y], [tile]);
          if (!res) return;
          dest = res.tile;
        }
        const p = findPath(grid, [player.x, player.y], dest);
        if (p) {
          path = p;
          pending = null;
          clickMark = { x: dest[0] + 0.5, y: dest[1] + 0.5, age: 0 };
        }
      };
      const onPointerLeave = () => {
        hover = null;
        hoverTile = null;
        if (label) label.style.opacity = "0";
      };
      canvasEl.addEventListener("pointermove", onPointerMove);
      canvasEl.addEventListener("pointerdown", onPointerDown);
      canvasEl.addEventListener("pointerleave", onPointerLeave);
      cleanups.push(() => {
        canvasEl.removeEventListener("pointermove", onPointerMove);
        canvasEl.removeEventListener("pointerdown", onPointerDown);
        canvasEl.removeEventListener("pointerleave", onPointerLeave);
      });

      const onKeyDown = (e: KeyboardEvent) => {
        const el = e.target as HTMLElement | null;
        if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
        if (pausedRef.current || hasEscapeLayer() || e.metaKey || e.ctrlKey || e.altKey) return;
        const k = e.key.toLowerCase();
        if (MOVE[k]) {
          e.preventDefault();
          if (!keys.has(k)) {
            keys.add(k);
            path = null;
            pending = null;
            cbRef.current.onActivity?.();
          }
          return;
        }
        if (k === " " || k === "enter" || k === "f") {
          if (focus) {
            e.preventDefault();
            interact(focus);
          }
        }
      };
      const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
      const onBlur = () => keys.clear();
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      window.addEventListener("blur", onBlur);
      cleanups.push(() => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("blur", onBlur);
      });

      // a handle for automated play-tests in development
      if (process.env.NODE_ENV !== "production") {
        const toClient = (x: number, y: number, z = 0) => {
          const [sx, sy] = screenOf(x, y, z);
          const r = host.getBoundingClientRect();
          return { x: r.left + world.x + sx * scale, y: r.top + world.y + sy * scale };
        };
        (window as unknown as { __iso?: unknown }).__iso = {
          player: () => ({ x: player.x, y: player.y, facing: player.facing, mirror: player.mirror, moving: player.moving }),
          target: (id: string) => {
            const tg = targetsById.get(id);
            return tg ? toClient(tg.anchor[0], tg.anchor[1], Math.max(0, tg.anchor[2] - 14)) : null;
          },
          tile: (x: number, y: number) => toClient(x + 0.5, y + 0.5),
          focus: () => focus?.id ?? null,
          scale: () => scale,
        };
        cleanups.push(() => {
          delete (window as unknown as { __iso?: unknown }).__iso;
        });
      }

      /* ---------------- per-frame ---------------- */
      const surface: "hard" | "soft" | "wet" = t.outdoor && raining ? "wet" : t.floor === "carpet" || t.floor === "grass" || t.floor === "rug" ? "soft" : "hard";
      const zoneAt = (x: number, y: number) => {
        const zs = t.zones ?? [];
        for (let i = zs.length - 1; i >= 0; i--) {
          const z = zs[i];
          if (x >= z.x && y >= z.y && x < z.x + z.w && y < z.y + z.h) return z.kind;
        }
        return undefined;
      };
      const propBoxes: Box[] = room.props.map((p) => p.box);
      const prompt = promptRef.current;
      let lastPrompt = "";
      let lastFocus: IsoTarget | null = null;
      let time = 0;

      const poseFor = (ac: Actor): Pose => {
        if (ac.moving) return (["walk0", "walk1", "walk2", "walk3"] as Pose[])[Math.floor(ac.walkT * 7.5) % 4];
        if (time >= ac.blinkAt) {
          if (time < ac.blinkAt + 0.14) return "blink";
          ac.blinkAt = time + 2.2 + Math.random() * 4.5;
        }
        return Math.floor((ac.idleT + time) / 0.9) % 2 ? "idle1" : "idle0";
      };

      const updateActor = (ac: Actor) => {
        const pose = poseFor(ac);
        const fr = (layer: Layer) => ac.frames.get(`${ac.facing}:${pose}:${layer}`)!;
        ac.body.texture = fr("body");
        const [sx, sy] = screenOf(ac.x, ac.y);
        const rx = Math.round(sx);
        const ry = Math.round(sy);
        ac.c.position.set(rx, ry);
        ac.c.scale.x = ac.mirror ? -1 : 1;
        ac.shadow.position.set(rx, ry);
        // light: tint toward the room's color at this spot, keep a floor of readability
        const L = lightAt(ac.x, ac.y, b.lights, t.ambient, time);
        const floor = ac.player ? 0.42 : 0.34;
        const ch = (v: number) => Math.round(Math.min(255, v * (1 - floor) + 255 * floor));
        const tr = ch((L.tint >> 16) & 255);
        const tgc = ch((L.tint >> 8) & 255);
        const tb = ch(L.tint & 255);
        ac.body.tint = (tr << 16) | (tgc << 8) | tb;
        // faces stay in a soft key light: tinted by the room, never lost to it
        ac.face.texture = fr("face");
        const kf = (v: number) => Math.round(Math.min(255, v * 0.42 + 255 * 0.58));
        ac.face.tint = (kf(tr) << 16) | (kf(tgc) << 8) | kf(tb);
        // rim from the strongest light, on the side it shines from
        let best: { x: number; y: number; z?: number; color: string } | null = null;
        let bf = 0;
        for (const l of b.lights) {
          const d = Math.hypot(l.x - ac.x, l.y - ac.y);
          if (d >= l.radius) continue;
          const f = Math.pow(1 - d / l.radius, 1.4) * l.intensity;
          if (f > bf) {
            bf = f;
            best = l;
          }
        }
        if (best && bf > 0.04) {
          const [lsx] = screenOf(best.x, best.y);
          let fromLeft = lsx < sx;
          if (ac.mirror) fromLeft = !fromLeft;
          ac.rim.texture = fr(fromLeft ? "rimL" : "rimR");
          ac.rim.tint = num(best.color);
          ac.rim.alpha = Math.min(0.75, bf * 1.4);
          ac.rim.visible = true;
          ac.rimTop.texture = fr("rimT");
          ac.rimTop.tint = num(best.color);
          ac.rimTop.alpha = Math.min(0.45, bf * ((best.z ?? 30) > 40 ? 1 : 0.4));
          ac.rimTop.visible = true;
        } else {
          ac.rim.visible = false;
          ac.rimTop.visible = false;
        }
      };

      a.ticker.maxFPS = 60;
      a.ticker.add((ticker) => {
        const dt = Math.min(0.05, ticker.deltaMS / 1000);
        time += dt;
        const pausedNow = pausedRef.current;

        /* ---- movement ---- */
        let mx = 0;
        let my = 0;
        if (!pausedNow) for (const k of keys) {
          mx += MOVE[k][0];
          my += MOVE[k][1];
        }
        let moved = false;
        const before: [number, number] = [player.x, player.y];
        if (mx || my) {
          const len = Math.hypot(mx, my);
          const step = SPEED * dt;
          const [nx, ny] = slide(grid, player.x, player.y, (mx / len) * step, (my / len) * step);
          player.x = nx;
          player.y = ny;
          Object.assign(player, faceFor(mx, my, player));
          moved = true;
        } else if (path && path.length && !pausedNow) {
          let budget = SPEED * dt;
          while (budget > 0 && path.length) {
            const [tx, ty] = path[0];
            const dx = tx - player.x;
            const dy = ty - player.y;
            const d = Math.hypot(dx, dy);
            if (d <= budget) {
              player.x = tx;
              player.y = ty;
              path.shift();
              budget -= d;
            } else {
              player.x += (dx / d) * budget;
              player.y += (dy / d) * budget;
              budget = 0;
            }
            if (d > 0.001) Object.assign(player, faceFor(dx, dy, player));
          }
          moved = true;
          if (!path.length) {
            path = null;
            if (pending) {
              const tg = pending;
              pending = null;
              if (rectDist(player.x, player.y, tg.tiles) <= REACH + 0.2) interact(tg);
            }
          }
        }
        const dist = Math.hypot(player.x - before[0], player.y - before[1]);
        player.moving = moved && dist > 0.0005;
        if (player.moving) {
          player.walkT += dt;
          const stepIdx = Math.floor(player.walkT * 7.5) % 4;
          if ((stepIdx === 0 || stepIdx === 2) && stepIdx !== player.lastStep) {
            const z = zoneAt(player.x, player.y);
            audio.step(z === "rug" || z === "carpet" || z === "grass" ? "soft" : surface);
          }
          player.lastStep = stepIdx;
        } else {
          player.walkT = 0;
          player.lastStep = -1;
        }

        /* ---- people glance at the detective when near ---- */
        for (const n of npcs) {
          const d = Math.hypot(player.x - n.x, player.y - n.y);
          if (d < 3.2) {
            const f = faceFor(player.x - n.x, player.y - n.y, n);
            n.facing = f.facing;
            n.mirror = f.mirror;
          }
        }

        /* ---- draw order ---- */
        const boxes: Box[] = propBoxes.slice();
        for (const ac of actors) boxes.push({ x0: ac.x - 0.22, y0: ac.y - 0.22, x1: ac.x + 0.22, y1: ac.y + 0.22, z0: 0, z1: PERSON_H });
        const order = depthOrder(boxes);
        order.forEach((idx, z) => {
          if (idx < propViews.length) propViews[idx].c.zIndex = z;
          else actors[idx - propViews.length].c.zIndex = z;
        });
        for (const ac of actors) updateActor(ac);

        /* ---- focus: what's within reach ---- */
        focus = null;
        if (!pausedNow && !player.moving) {
          let bestScore = Infinity;
          const [fx0, fy0] = player.facing === "front" ? (player.mirror ? [1, 0] : [0, 1]) : player.mirror ? [0, -1] : [-1, 0];
          for (const tg of scene.targets) {
            if (!visible(tg)) continue;
            const d = rectDist(player.x, player.y, tg.tiles);
            if (d > REACH) continue;
            const [ax, ay] = tg.anchor;
            const vx = ax - player.x;
            const vy = ay - player.y;
            const vl = Math.hypot(vx, vy) || 1;
            const align = (vx * fx0 + vy * fy0) / vl;
            const score = d - align * 0.45 + (tg.kind === "exit" ? 0.3 : 0);
            if (score < bestScore) {
              bestScore = score;
              focus = tg;
            }
          }
        }

        if (focus !== lastFocus) {
          lastFocus = focus;
          cbRef.current.onFocus?.(focus);
        }

        /* ---- props & markers ---- */
        for (const pv of propViews) {
          const tg = pv.target;
          if (tg && pv.rp.prop.id.startsWith("tent-")) pv.c.visible = visible(tg);
          if (pv.outline) {
            const on = !!tg && (tg === focus || tg === hover) && !pausedNow;
            pv.outline.visible = on;
            if (on) {
              pv.outline.tint = statesRef.current[tg.id]?.evidence ? 0xffc65a : 0x7af4ff;
              pv.outline.alpha = 0.75 + Math.sin(time * 6) * 0.25;
            }
          }
        }
        for (const [id, s] of markers) {
          const tg = targetsById.get(id)!;
          const st = statesRef.current[id];
          const show = visible(tg) && !pausedNow && (tg.kind === "npc" ? true : !st?.inspected);
          s.visible = show;
          if (!show) continue;
          if (tg.kind === "hotspot") s.texture = st?.evidence ? amberTex : cyanTex;
          const bob = calm ? 0 : Math.round(Math.sin(time * 3 + tg.anchor[0]) * 1.5);
          let [ax, ay, az] = tg.anchor;
          if (tg.kind === "npc") {
            const n = npcs.find((x) => x.id === id);
            if (n) {
              ax = n.x;
              ay = n.y;
            }
            s.alpha = st?.talked ? 0.45 : 1;
          } else s.alpha = 1;
          const [sx, sy] = screenOf(ax, ay, az);
          s.position.set(Math.round(sx), Math.round(sy) + bob);
        }
        // the way out: chevrons sliding off the edge of the floor
        exitG.clear();
        if (exitTarget) {
          const hot = focus === exitTarget || hover === exitTarget;
          const [ox, oy] = outDir;
          const [px2, py2] = [-oy, ox]; // across the edge
          const cx = exX + 0.5;
          const cy = exY + 0.5;
          for (let k = 0; k < 3; k++) {
            const ph = calm ? k / 3 : (time * 0.9 + k / 3) % 1;
            const d = -0.35 + ph * 0.8;
            const tipX = cx + ox * (d + 0.18);
            const tipY = cy + oy * (d + 0.18);
            const a1 = screenOf(cx + ox * d + px2 * 0.32, cy + oy * d + py2 * 0.32);
            const tip = screenOf(tipX, tipY);
            const a2 = screenOf(cx + ox * d - px2 * 0.32, cy + oy * d - py2 * 0.32);
            const alpha = Math.sin(ph * Math.PI) * (hot ? 1 : 0.7);
            exitG.moveTo(a1[0], a1[1]).lineTo(tip[0], tip[1]).lineTo(a2[0], a2[1]);
            exitG.stroke({ width: 2, color: hot ? 0xffffff : 0x5af0ff, alpha });
          }
          diamondPathOn(exitG, exX, exY, 1);
          exitG.stroke({ width: 1, color: 0x5af0ff, alpha: hot ? 0.8 : 0.35 });
        }

        /* ---- floor highlights ---- */
        fx.clear();
        const diamondPath = (x: number, y: number, inset = 0) => {
          const [sx, sy] = screenOf(x, y);
          fx.poly([sx, sy + inset, sx + HW - inset * 2, sy + HH, sx, sy + HH * 2 - inset, sx - HW + inset * 2, sy + HH]);
        };
        if (focus && !pausedNow) {
          const col = focus.kind === "npc" ? 0xff5ab0 : statesRef.current[focus.id]?.evidence ? 0xffb43d : 0x5af0ff;
          for (const [x, y] of focus.tiles) {
            diamondPath(x, y, 1);
            fx.fill({ color: col, alpha: 0.12 + Math.sin(time * 5) * 0.04 });
            diamondPath(x, y, 1);
            fx.stroke({ width: 1, color: col, alpha: 0.7 });
          }
        }
        if (hoverTile && !pausedNow && tileOpen(grid, hoverTile[0], hoverTile[1])) {
          diamondPath(hoverTile[0], hoverTile[1], 2);
          fx.stroke({ width: 1, color: 0xffffff, alpha: 0.28 });
        }
        if (clickMark) {
          clickMark.age += dt;
          const k = clickMark.age / 0.6;
          if (k >= 1 || (!path && !player.moving && k > 0.3)) clickMark = null;
          else {
            const inset = Math.round(k * 4);
            const [sx, sy] = screenOf(clickMark.x - 0.5, clickMark.y - 0.5);
            fx.poly([sx, sy + inset, sx + HW - inset * 2, sy + HH, sx, sy + HH * 2 - inset, sx - HW + inset * 2, sy + HH]);
            fx.stroke({ width: 1, color: 0xffd27a, alpha: 1 - k });
          }
        }
        // wall fixtures light up when in reach or hovered
        decorFx.clear();
        for (const tg of [focus, hover]) {
          if (!tg || tg.decor === undefined || pausedNow) continue;
          const poly = b.decorPolys[tg.decor];
          if (!poly?.length) continue;
          decorFx.poly(poly.flat());
          decorFx.stroke({ width: 1, color: statesRef.current[tg.id]?.evidence ? 0xffc65a : 0x7af4ff, alpha: 0.75 + Math.sin(time * 6) * 0.25 });
        }

        /* ---- prompt ---- */
        if (prompt) {
          const text = focus ? `${verb(focus, statesRef.current[focus.id])}${focus.kind === "exit" ? "" : " · " + focus.label}` : "";
          if (text !== lastPrompt) {
            lastPrompt = text;
            const keyEl = prompt.querySelector("[data-k]");
            const txtEl = prompt.querySelector("[data-t]");
            if (txtEl) txtEl.textContent = text;
            if (keyEl) keyEl.textContent = "SPACE";
            prompt.dataset.on = text ? "1" : "0";
          }
        }

        /* ---- glows breathe; neon stutters ---- */
        if (!calm) {
          for (const g of glows) {
            g.next -= dt;
            if (g.next <= 0) {
              g.glitch = 0.12 + Math.random() * 0.2;
              g.next = 5 + Math.random() * 14;
            }
            g.glitch = Math.max(0, g.glitch - dt);
            const stutter = g.glitch > 0 && Math.floor(g.glitch * 40) % 2 ? 0.35 : 1;
            g.s.alpha = (g.base + Math.sin(time * 1.3 + g.ph) * 0.05) * stutter;
          }
          for (const m of motes) {
            const k = time * 0.25 + m.ph;
            const x = m.l.x + Math.cos(k) * m.r;
            const y = m.l.y + Math.sin(k * 1.3) * m.r;
            const z = ((m.l.z ?? 30) * 0.6 + Math.sin(k * 0.7) * 14) | 0;
            const [sx, sy] = screenOf(x, y, z);
            m.s.position.set(Math.round(sx), Math.round(sy));
            m.s.alpha = 0.35 + Math.sin(k * 3) * 0.25;
          }
        }

        /* ---- weather ---- */
        if (drops.length) {
          rainG.clear();
          const slant = 0.18;
          for (const d of drops) {
            d.y += d.v * dt;
            d.x -= d.v * dt * slant;
            const bottom = !t.outdoor && winBox ? winBox[3] + 6 : H + 10;
            if (d.y > bottom) {
              if (t.outdoor && !calm && Math.random() < 0.5) {
                // land somewhere on the open floor
                const ux = Math.random() * t.w;
                const uy = Math.random() * t.h;
                if (tileOpen(grid, Math.floor(ux), Math.floor(uy))) {
                  const [sx, sy] = screenOf(ux, uy);
                  splashes.push({ x: sx, y: sy, age: 0 });
                }
              }
              spawnDrop(d, false);
            }
            rainG.moveTo(d.x, d.y).lineTo(d.x + d.len * slant, d.y - d.len);
          }
          rainG.stroke({ width: 1, color: t.outdoor ? 0xa8c4ff : 0xc8dcff, alpha: t.outdoor ? 0.32 : 0.45 });
          splashG.clear();
          for (let i = splashes.length - 1; i >= 0; i--) {
            const s = splashes[i];
            s.age += dt;
            if (s.age > 0.45) {
              splashes.splice(i, 1);
              continue;
            }
            const r = 1 + s.age * 9;
            splashG.ellipse(s.x, s.y, r, r * 0.45);
            splashG.stroke({ width: 1, color: 0xb8d0ff, alpha: 0.5 * (1 - s.age / 0.45) });
          }
        }
        if (fog) {
          for (const f of fogSprites) {
            f.s.x += f.v * dt;
            if (f.s.x > W + 120) f.s.x = -120;
          }
        }
        if ((storm || (raining && weather.intensity > 0.75)) && !calm) {
          nextBolt -= dt;
          if (nextBolt <= 0) {
            nextBolt = 9 + Math.random() * 16;
            flash = 1;
            audio.thunder(0.3 + Math.random() * 1.4, 0.6 + Math.random() * 0.3);
          }
        }
        flashG.clear();
        if (flash > 0) {
          flash = Math.max(0, flash - dt * 4.5);
          const k = flash > 0.6 || (flash > 0.3 && flash < 0.45) ? flash : flash * 0.3;
          if (t.outdoor) flashG.rect(-50, -50, W + 100, H + 100).fill({ color: 0xd8e4ff, alpha: k * 0.28 });
          for (const w of b.windows) flashG.poly(w.flat()).fill({ color: 0xeaf2ff, alpha: k * 0.85 });
          if (!t.outdoor) flashG.rect(-50, -50, W + 100, H + 100).fill({ color: 0xb8c8ff, alpha: k * 0.06 });
        }

        /* ---- camera ---- */
        const [tx, ty] = camTarget();
        if (calm) {
          camX = tx;
          camY = ty;
        } else {
          const k = Math.min(1, dt * 5);
          camX += (tx - camX) * k;
          camY += (ty - camY) * k;
        }
        placeWorld();
      });
    })();

    return () => {
      destroyed = true;
      cbRef.current.onFocus?.(null);
      saveMemory?.();
      for (const c of cleanups) c();
      interactRef.current = null;
      if (app) {
        app.destroy(true, { children: true });
        app = null;
      }
      for (const tt of textures) tt.destroy(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.key, weather.kind, weather.intensity, timeOfDay, reduce]);

  return (
    <div
      ref={hostRef}
      className="pixelated absolute inset-0 overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 46%, #241a44 0%, #120c26 45%, #07050f 100%)" }}
    >
      <div
        ref={labelRef}
        className="font-label pointer-events-none absolute left-0 top-0 z-10 whitespace-nowrap rounded-sm border border-[rgba(122,244,255,0.35)] bg-[rgba(10,6,20,0.85)] px-2 py-1 text-[var(--paper)] opacity-0 transition-opacity duration-100"
      />
      <button
        ref={promptRef}
        data-on="0"
        onClick={() => interactRef.current?.()}
        className="iso-prompt font-label absolute bottom-[calc(var(--hud-clear,88px)+8px)] left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-sm px-3 py-2 text-[var(--paper)]"
      >
        <span data-k className="iso-key">SPACE</span>
        <span data-t />
      </button>
    </div>
  );
}
