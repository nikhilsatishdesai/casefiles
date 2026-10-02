"use client";

import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Sprite, Texture, TilingSprite } from "pixi.js";
import type { SceneId, TimeOfDay, Weather } from "@/lib/engine/types";
import { paintScene, sceneRect, moodFor, SCENE_W, SCENE_H } from "@/lib/scenes/paint";
import type { Beam, Lane, PaintedScene, Rect } from "@/lib/scenes/types";
import { car, figure, rgbOf, mix } from "@/lib/scenes/primitives";
import { rngFor } from "@/lib/engine/rng";
import { audio } from "@/lib/audio/engine";
import { useReducedMotionPref } from "@/lib/useMotion";

/**
 * PixelStage — the living window into Veilport.
 *
 * A deterministic painted base (Canvas2D pixel art) is displayed through
 * PixiJS, which animates everything that breathes: bloom on every lamp and
 * window, stuttering neon, slanted rain that splashes on the street (and
 * stays behind the glass indoors), fog banks, lightning in step with the
 * thunder, traffic and passers-by, dust turning in shafts of light, the
 * lighthouse sweeping the harbor — plus a slow cinematic zoom and a whisper
 * of mouse parallax. Reduced motion stills the camera and the lightning.
 */

interface Props {
  scene: SceneId;
  weather: Weather;
  timeOfDay: TimeOfDay;
  seedKey?: string;
  className?: string;
  animated?: boolean;
  dim?: number; // 0..1 extra darkening for UI-heavy screens
}

const num = (c: string) => {
  const [r, g, b] = rgbOf(c);
  return (r << 16) | (g << 8) | b;
};

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

/* ------------------------------------------------------------------ */
/* textures                                                            */
/* ------------------------------------------------------------------ */

function glowTexture(): Texture {
  const { c, ctx } = makeCanvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.55)");
  g.addColorStop(0.45, "rgba(255,255,255,0.16)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return Texture.from(c);
}

function fogTexture(rnd: () => number): Texture {
  const W = 256;
  const H = 64;
  const { c, ctx } = makeCanvas(W, H);
  for (let i = 0; i < 46; i++) {
    const x = rnd() * W;
    const y = H * (0.3 + rnd() * 0.45);
    const r = 10 + rnd() * 26;
    for (const ox of [-W, 0, W]) {
      const g = ctx.createRadialGradient(x + ox, y, 0, x + ox, y, r);
      g.addColorStop(0, `rgba(255,255,255,${0.1 + rnd() * 0.12})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x + ox - r, y - r, r * 2, r * 2);
    }
  }
  return Texture.from(c);
}

function pixelTexture(c: HTMLCanvasElement): Texture {
  const t = Texture.from(c);
  t.source.scaleMode = "nearest";
  return t;
}

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */

function bilinear(pts: [number, number][], u: number, v: number): [number, number] {
  const [p0, p1, p2, p3] = pts;
  const tx = p0[0] + (p1[0] - p0[0]) * u;
  const ty = p0[1] + (p1[1] - p0[1]) * u;
  const bx = p3[0] + (p2[0] - p3[0]) * u;
  const by = p3[1] + (p2[1] - p3[1]) * u;
  return [tx + (bx - tx) * v, ty + (by - ty) * v];
}

function drawBeam(g: Graphics, b: Beam) {
  const col = num(b.color);
  if (!b.stripes) {
    g.poly(b.pts.flat()).fill({ color: col, alpha: b.alpha });
    // a brighter core down the middle
    const core = [bilinear(b.pts, 0.25, 0), bilinear(b.pts, 0.75, 0), bilinear(b.pts, 0.7, 1), bilinear(b.pts, 0.3, 1)];
    g.poly(core.flat()).fill({ color: col, alpha: b.alpha * 0.6 });
    return;
  }
  // venetian blinds: the shaft breaks into bands parallel to the window
  const n = b.stripes;
  for (let i = 0; i < n; i++) {
    const v0 = i / n;
    const v1 = (i + 0.55) / n;
    const q = [bilinear(b.pts, 0, v0), bilinear(b.pts, 1, v0), bilinear(b.pts, 1, v1), bilinear(b.pts, 0, v1)];
    g.poly(q.flat()).fill({ color: col, alpha: b.alpha * 1.6 });
  }
}

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  region: Rect;
  stop: number;
}

interface Actor {
  sprite: Sprite;
  glows: { s: Sprite; dx: number; dy: number }[];
  x: number;
  vx: number;
  lane: Lane;
  frames?: Texture[];
  t: number;
}

/* ------------------------------------------------------------------ */
/* the stage                                                           */
/* ------------------------------------------------------------------ */

export default function PixelStage({
  scene,
  weather,
  timeOfDay,
  seedKey = "veilport",
  className,
  animated = true,
  dim = 0,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionPref();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let destroyed = false;
    let app: Application | null = null;
    let onMove: ((e: PointerEvent) => void) | null = null;
    let ro: ResizeObserver | null = null;
    let releaseStorm: (() => void) | null = null;
    const textures: Texture[] = [];
    const calm = reduce || !animated;

    (async () => {
      const painted: PaintedScene = paintScene(scene, weather, timeOfDay, seedKey);
      const mood = moodFor(timeOfDay, weather);
      const a = new Application();
      await a.init({
        backgroundAlpha: 0,
        antialias: false,
        resolution: Math.min(2, window.devicePixelRatio || 1),
        autoDensity: true,
      });
      if (destroyed) {
        a.destroy(true);
        return;
      }
      app = a;
      a.canvas.style.position = "absolute";
      a.canvas.style.inset = "0";
      a.canvas.style.width = "100%";
      a.canvas.style.height = "100%";
      host.appendChild(a.canvas);

      const rnd = rngFor(`fx:${scene}:${seedKey}`);
      const glowTex = glowTexture();
      textures.push(glowTex);

      const root = new Container();
      a.stage.addChild(root);
      const baseTex = pixelTexture(painted.canvas);
      textures.push(baseTex);
      root.addChild(new Sprite(baseTex));

      /* ---- light shafts & sweeps (additive) ---- */
      const beamG = new Graphics();
      beamG.blendMode = "add";
      for (const b of painted.beams) drawBeam(beamG, b);
      root.addChild(beamG);
      const motesG = new Graphics();
      motesG.blendMode = "add";
      root.addChild(motesG);
      const sweepG = new Graphics();
      sweepG.blendMode = "add";
      root.addChild(sweepG);

      /* ---- traffic & passers-by ---- */
      const actorLayer = new Container();
      root.addChild(actorLayer);
      const actorGlowLayer = new Container();
      root.addChild(actorGlowLayer);

      /* ---- bloom: every light gets a soft additive halo ---- */
      const glowLayer = new Container();
      root.addChild(glowLayer);
      const fx = new Graphics();
      root.addChild(fx);
      const smokeLayer = new Container();
      root.addChild(smokeLayer);

      const lightGlows = painted.lights.map((l) => {
        const s = new Sprite(glowTex);
        s.anchor.set(0.5);
        s.blendMode = "add";
        s.tint = num(l.color);
        const r = (Math.max(l.w, l.h) * 1.4 + 5) * (l.glow ?? 1);
        s.width = l.w + r * 2;
        s.height = l.h + r * 2;
        s.position.set(l.x + l.w / 2, l.y + l.h / 2);
        const base = l.glow ? 0.34 : 0.17;
        glowLayer.addChild(s);
        return { s, base };
      });
      const neonGlows = painted.neons.map((n) => {
        const s = new Sprite(glowTex);
        s.anchor.set(0.5);
        s.blendMode = "add";
        s.tint = num(n.color);
        s.width = n.w + 30;
        s.height = n.h + 26;
        s.position.set(n.x + n.w / 2, n.y + n.h / 2);
        glowLayer.addChild(s);
        return s;
      });
      const blinkGlows = painted.blinkers.map((b) => {
        const s = new Sprite(glowTex);
        s.anchor.set(0.5);
        s.blendMode = "add";
        s.tint = num(b.color);
        s.width = s.height = 12 + (b.size ?? 1) * 4;
        s.position.set(b.x + 0.5, b.y + 0.5);
        glowLayer.addChild(s);
        return s;
      });

      /* ---- weather ---- */
      const kind = weather.kind;
      const intensity = Math.max(0.35, Math.min(1, weather.intensity || 0.6));
      const weatherLayer = new Container();
      root.addChild(weatherLayer);
      const regions: Rect[] = painted.interior ? painted.windows : [{ x: -20, y: -20, w: SCENE_W + 60, h: SCENE_H + 40 }];
      if (painted.interior) {
        const mask = new Graphics();
        for (const w of painted.windows) mask.rect(w.x, w.y, w.w, w.h).fill(0xffffff);
        root.addChild(mask);
        weatherLayer.mask = mask;
      }
      const fogLayer = new Container();
      weatherLayer.addChild(fogLayer);
      const rainFar = new Graphics();
      const rainNear = new Graphics();
      const splashG = new Graphics();
      const snowG = new Graphics();
      weatherLayer.addChild(rainFar, rainNear, splashG, snowG);
      const glassG = new Graphics();
      root.addChild(glassG);

      const rainy = kind === "rain" || kind === "storm";
      const slant = kind === "storm" ? 0.3 : kind === "wind" ? 0.22 : 0.13;
      const density = (kind === "storm" ? 1.45 : 1) * intensity * (calm ? 0.6 : 1);
      const regionArea = regions.reduce((s, r) => s + r.w * r.h, 0);
      const areaK = painted.interior ? Math.min(1, regionArea / (SCENE_W * SCENE_H)) * 2.2 : 1;
      const pickRegion = () => {
        let t = rnd() * regionArea;
        for (const r of regions) {
          t -= r.w * r.h;
          if (t <= 0) return r;
        }
        return regions[0];
      };
      const makeDrop = (near: boolean, fresh: boolean): Drop => {
        const region = pickRegion();
        const len = near ? 7 + rnd() * 6 : 3 + rnd() * 3;
        const stop =
          near && !painted.interior && painted.wet ? painted.ground + rnd() * (SCENE_H - painted.ground) : region.y + region.h + len;
        return {
          x: region.x + rnd() * (region.w + 30),
          y: fresh ? region.y + rnd() * region.h : region.y - len - rnd() * 30,
          len,
          speed: near ? 420 + rnd() * 120 : 250 + rnd() * 70,
          region,
          stop,
        };
      };
      const farDrops: Drop[] = [];
      const nearDrops: Drop[] = [];
      if (rainy && regions.length) {
        for (let i = 0; i < Math.round(110 * density * areaK); i++) farDrops.push(makeDrop(false, true));
        for (let i = 0; i < Math.round(60 * density * areaK); i++) nearDrops.push(makeDrop(true, true));
      }
      const splashes: { x: number; y: number; t: number }[] = [];
      const flakes =
        kind === "snow" && regions.length
          ? Array.from({ length: Math.round(140 * intensity * areaK) }, () => {
              const r = pickRegion();
              return { x: r.x + rnd() * r.w, y: r.y + rnd() * r.h, s: rnd() < 0.3 ? 2 : 1, v: 10 + rnd() * 22, sway: 4 + rnd() * 8, ph: rnd() * 6.28, r };
            })
          : [];
      // drips sliding down window glass
      const drips =
        rainy && painted.interior
          ? painted.windows.flatMap((w) =>
              Array.from({ length: Math.max(2, Math.round(w.w / 18)) }, () => ({
                x: w.x + 1 + Math.floor(rnd() * (w.w - 2)),
                y: w.y + rnd() * w.h,
                v: 0,
                pause: rnd() * 3,
                w,
              }))
            )
          : [];

      // fog banks: soft textures drifting at a few depths
      const fogTex = fogTexture(rnd);
      textures.push(fogTex);
      const fogBanks: { s: TilingSprite; speed: number }[] = [];
      if (!painted.interior) {
        const tint = num(mix(mood.haze, "#c8d0d8", 0.35));
        const banks: [number, number, number, number][] =
          kind === "fog"
            ? [
                [painted.horizon - 70, 80, 0.34, 3],
                [painted.horizon - 18, 70, 0.42, 6],
                [painted.ground - 34, 80, 0.4, 10],
              ]
            : rainy
              ? [[painted.ground - 30, 44, 0.12, 5]]
              : kind === "snow"
                ? [[painted.ground - 40, 60, 0.18, 4]]
                : [];
        for (const [y, h, alpha, speed] of banks) {
          const s = new TilingSprite({ texture: fogTex, width: SCENE_W + 40, height: h });
          s.position.set(-20, y);
          s.tileScale.set(1, h / 64);
          s.tint = tint;
          s.alpha = alpha;
          fogLayer.addChild(s);
          fogBanks.push({ s, speed });
        }
      }

      /* ---- lightning ---- */
      const flashG = new Graphics();
      const boltG = new Graphics();
      boltG.blendMode = "add";
      root.addChild(boltG, flashG);
      const storm = kind === "storm" && !calm;
      if (storm) releaseStorm = audio.claimStorm();
      let nextStrike = 3 + rnd() * 6;
      let flash = 0;
      let flashQueue: { at: number; k: number }[] = [];
      let bolt: number[][] = [];
      let boltLife = 0;
      const makeBolt = () => {
        const paths: number[][] = [];
        const x0 = 40 + rnd() * (SCENE_W - 80);
        const bottom = painted.horizon * (0.45 + rnd() * 0.4);
        const main: number[] = [x0, -4];
        let x = x0;
        let y = -4;
        while (y < bottom) {
          x += (rnd() - 0.5) * 16;
          y += 5 + rnd() * 9;
          main.push(x, y);
          if (rnd() < 0.18) {
            const br: number[] = [x, y];
            let bx = x;
            let by = y;
            for (let i = 0; i < 3 + Math.floor(rnd() * 4); i++) {
              bx += (rnd() - 0.3) * 14 * (rnd() < 0.5 ? -1 : 1);
              by += 4 + rnd() * 7;
              br.push(bx, by);
            }
            paths.push(br);
          }
        }
        paths.unshift(main);
        return paths;
      };

      /* ---- dim overlay ---- */
      if (dim > 0) {
        const d = new Graphics();
        d.rect(-40, -40, SCENE_W + 80, SCENE_H + 80).fill({ color: 0x04060a, alpha: dim });
        root.addChild(d);
      }

      /* ---- actors: textures for cars and walkers ---- */
      const carTextures: Texture[][] = [];
      for (const variant of [{ color: "#0b0e16" }, { color: "#1e1418" }, { color: "#141c22" }, { taxi: true }]) {
        const pair: Texture[] = [];
        for (const dir of [1, -1] as const) {
          const { c, ctx } = makeCanvas(32, 20);
          car(ctx, 1, 19, { ...variant, dir, lit: true });
          const t = pixelTexture(c);
          textures.push(t);
          pair.push(t);
        }
        carTextures.push(pair);
      }
      const walkerFrames: Texture[][] = [];
      for (const v of [{ hat: true }, {}, { umbrella: true, hat: true }, { umbrella: true }]) {
        const frames: Texture[] = [];
        for (let f = 0; f < 4; f++) {
          const { c, ctx } = makeCanvas(18, 26);
          figure(ctx, 8, 25, { ...v, frame: f });
          const t = pixelTexture(c);
          textures.push(t);
          frames.push(t);
        }
        walkerFrames.push(frames);
      }
      const actors: Actor[] = [];
      const laneTimers = new Map<Lane, number>();
      const spawnCar = (lane: Lane, x?: number) => {
        const dir = rnd() < 0.5 ? 1 : -1;
        const variant = carTextures[rnd() < 0.18 ? 3 : Math.floor(rnd() * 3)];
        const sprite = new Sprite(variant[dir > 0 ? 0 : 1]);
        sprite.anchor.set(0, 1);
        sprite.scale.set(lane.scale);
        const w = 32 * lane.scale;
        const glows: Actor["glows"] = [];
        const head = new Sprite(glowTex);
        head.anchor.set(dir > 0 ? 0.08 : 0.92, 0.5);
        head.blendMode = "add";
        head.tint = 0xfff0c8;
        head.alpha = 0.55;
        head.width = 58 * lane.scale;
        head.height = 9 * lane.scale;
        glows.push({ s: head, dx: dir > 0 ? w - 3 * lane.scale : 3 * lane.scale, dy: -7 * lane.scale });
        const tail = new Sprite(glowTex);
        tail.anchor.set(0.5);
        tail.blendMode = "add";
        tail.tint = 0xe0404a;
        tail.alpha = 0.6;
        tail.width = tail.height = 9 * lane.scale;
        glows.push({ s: tail, dx: dir > 0 ? 2 * lane.scale : w - 2 * lane.scale, dy: -6 * lane.scale });
        if (painted.wet && !painted.interior) {
          const refl = new Sprite(glowTex);
          refl.anchor.set(0.5, 0);
          refl.blendMode = "add";
          refl.tint = 0xfff0c8;
          refl.alpha = 0.22;
          refl.width = 10 * lane.scale;
          refl.height = 30 * lane.scale;
          glows.push({ s: refl, dx: dir > 0 ? w - 4 * lane.scale : 4 * lane.scale, dy: 0 });
        }
        actorLayer.addChild(sprite);
        for (const g of glows) actorGlowLayer.addChild(g.s);
        const speed = (46 + rnd() * 40) * lane.scale;
        actors.push({ sprite, glows, x: x ?? (dir > 0 ? (lane.minX ?? 0) - w - 4 : (lane.maxX ?? SCENE_W) + 4), vx: dir * speed, lane, t: 0 });
      };
      const spawnWalker = (lane: Lane, x?: number) => {
        const dir = rnd() < 0.5 ? 1 : -1;
        const variant = rainy && rnd() < 0.6 ? walkerFrames[2 + Math.floor(rnd() * 2)] : walkerFrames[Math.floor(rnd() * 2)];
        const sprite = new Sprite(variant[0]);
        sprite.anchor.set(0.45, 1);
        sprite.scale.set(dir * lane.scale, lane.scale);
        actorLayer.addChild(sprite);
        const minX = lane.minX ?? -12;
        const maxX = lane.maxX ?? SCENE_W + 12;
        actors.push({
          sprite,
          glows: [],
          x: x ?? (dir > 0 ? minX : maxX),
          vx: dir * (9 + rnd() * 6) * lane.scale,
          lane,
          frames: variant,
          t: rnd(),
        });
      };
      for (const lane of painted.roads) {
        laneTimers.set(lane, (lane.every ?? 8) * rnd());
        if (rnd() < 0.6) spawnCar(lane, rnd() * SCENE_W);
      }
      for (const lane of painted.walks) {
        laneTimers.set(lane, (lane.every ?? 10) * rnd());
        if (rnd() < 0.7) spawnWalker(lane, (lane.minX ?? 0) + rnd() * ((lane.maxX ?? SCENE_W) - (lane.minX ?? 0)));
      }

      /* ---- motes drifting in the light ---- */
      const motes = painted.beams
        .filter((b) => b.motes)
        .flatMap((b) =>
          Array.from({ length: 14 }, () => ({ b, u: rnd(), v: rnd(), du: (rnd() - 0.5) * 0.02, dv: 0.008 + rnd() * 0.02, ph: rnd() * 6.28 }))
        );

      /* ---- smoke & steam ---- */
      const puffs: { s: Sprite; vx: number; vy: number; age: number; life: number; size: number; grow: number; a: number }[] = [];

      /* ---- layout & camera ---- */
      let zoom = 1.02;
      let zoomDir = 1;
      let parallaxX = 0;
      let parallaxY = 0;
      let targetPX = 0;
      let targetPY = 0;
      const layout = () => {
        const cw = host.clientWidth;
        const ch = host.clientHeight;
        if (!cw || !ch) return;
        a.renderer.resize(cw, ch);
        const { s } = sceneRect(cw, ch);
        root.scale.set(s * zoom);
        root.position.set((cw - SCENE_W * s * zoom) / 2 + parallaxX * s, (ch - SCENE_H * s * zoom) / 2 + parallaxY * s);
      };
      ro = new ResizeObserver(layout);
      ro.observe(host);
      layout();
      if (!calm) {
        onMove = (e: PointerEvent) => {
          const r = host.getBoundingClientRect();
          targetPX = ((e.clientX - r.left) / r.width - 0.5) * -5;
          targetPY = ((e.clientY - r.top) / r.height - 0.5) * -3;
        };
        window.addEventListener("pointermove", onMove);
      }

      /* ---- state for flickering things ---- */
      const lightStates = painted.lights.map(() => ({ on: 1, t: rnd() * 6, ph: rnd() * 10 }));
      const neonStates = painted.neons.map(() => ({ glitch: 0, next: 3 + rnd() * 10 }));

      let time = 0;
      a.ticker.maxFPS = 60;
      a.ticker.add((ticker) => {
        const dt = Math.min(0.05, ticker.deltaMS / 1000);
        time += dt;

        if (!calm) {
          zoom += zoomDir * dt * 0.0016;
          if (zoom > 1.05) zoomDir = -1;
          if (zoom < 1.0) zoomDir = 1;
          parallaxX += (targetPX - parallaxX) * dt * 2;
          parallaxY += (targetPY - parallaxY) * dt * 2;
          layout();
        }

        /* lights ------------------------------------------------- */
        fx.clear();
        painted.lights.forEach((l, i) => {
          const st = lightStates[i];
          if (l.flicker >= 0.8) {
            // fire: never out, never still
            st.on = 0.72 + 0.16 * Math.sin(time * 9 + st.ph) + 0.12 * Math.sin(time * 23 + st.ph * 2);
          } else if (l.flicker > 0.3) {
            st.t -= dt;
            if (st.t <= 0) {
              const dipping = st.on > 0.9;
              st.on = dipping ? 0.2 + rnd() * 0.45 : 1;
              st.t = dipping ? 0.04 + rnd() * 0.18 : 0.6 + rnd() * 5;
            }
          } else {
            st.on = 0.9 + 0.1 * Math.sin(time * (1.3 + (i % 7) * 0.31) + st.ph);
          }
          if (st.on < 0.97) {
            fx.rect(l.x, l.y, l.w, l.h).fill({ color: 0x04060a, alpha: (1 - st.on) * 0.8 });
          }
          lightGlows[i].s.alpha = lightGlows[i].base * st.on;
        });

        painted.neons.forEach((n, i) => {
          const st = neonStates[i];
          st.next -= dt;
          if (st.next <= 0 && st.glitch <= 0) {
            st.glitch = 0.15 + rnd() * 0.5;
            st.next = 4 + rnd() * 12;
          }
          let on = 0.92 + 0.08 * Math.sin(time * 3 + i * 2);
          if (st.glitch > 0) {
            st.glitch -= dt;
            on = Math.sin(time * 70 + i) > 0.1 ? 1 : 0.08;
          }
          if (on < 0.5) fx.rect(n.x - 1, n.y - 1, n.w + 2, n.h + 2).fill({ color: 0x04060a, alpha: 0.72 });
          neonGlows[i].alpha = 0.52 * on;
        });

        painted.blinkers.forEach((b, i) => {
          const p = (time / b.period + b.phase) % 1;
          const duty = b.duty ?? 0.3;
          const on = p < duty ? Math.min(1, Math.sin((p / duty) * Math.PI) * 2.4) : 0;
          const sz = b.size ?? 1;
          if (on > 0.05) fx.rect(b.x, b.y, sz, sz).fill({ color: num(b.color), alpha: on });
          blinkGlows[i].alpha = 0.7 * on;
        });

        /* light shafts breathe; dust turns in them -------------------- */
        beamG.alpha = 0.88 + 0.12 * Math.sin(time * 0.6);
        motesG.clear();
        for (const m of motes) {
          m.u += m.du * dt;
          m.v += m.dv * dt * 0.6;
          if (m.u < 0) m.u += 1;
          if (m.u > 1) m.u -= 1;
          if (m.v > 1) m.v -= 1;
          const [x, y] = bilinear(m.b.pts, m.u, m.v);
          const tw = 0.5 + 0.5 * Math.sin(time * 1.7 + m.ph);
          motesG.rect(x, y, 1, 1).fill({ color: 0xfff4d8, alpha: 0.12 + 0.3 * tw });
        }

        /* sweeping beams ---------------------------------------------- */
        sweepG.clear();
        for (const sw of painted.sweeps) {
          const k = 0.5 - 0.5 * Math.cos(time * sw.speed);
          const ang = sw.from + (sw.to - sw.from) * k;
          for (const [spread, alpha] of [[1, 0.35], [0.55, 0.55], [0.22, 0.9]] as const) {
            const a1 = ang - sw.spread * spread;
            const a2 = ang + sw.spread * spread;
            sweepG
              .poly([sw.x, sw.y, sw.x + Math.cos(a1) * sw.length, sw.y + Math.sin(a1) * sw.length, sw.x + Math.cos(a2) * sw.length, sw.y + Math.sin(a2) * sw.length])
              .fill({ color: num(sw.color), alpha: sw.alpha * alpha });
          }
        }

        /* traffic & pedestrians --------------------------------------- */
        for (const lane of [...painted.roads, ...painted.walks]) {
          let t = (laneTimers.get(lane) ?? 0) - dt;
          if (t <= 0) {
            if (painted.roads.includes(lane)) spawnCar(lane);
            else spawnWalker(lane);
            t = (lane.every ?? 9) * (0.5 + rnd());
          }
          laneTimers.set(lane, t);
        }
        for (let i = actors.length - 1; i >= 0; i--) {
          const ac = actors[i];
          ac.x += ac.vx * dt;
          ac.sprite.position.set(Math.round(ac.x), ac.lane.y);
          for (const g of ac.glows) g.s.position.set(ac.x + g.dx, ac.lane.y + g.dy);
          if (ac.frames) {
            ac.t += dt;
            ac.sprite.texture = ac.frames[Math.floor(ac.t / 0.16) % 4];
          }
          const minX = (ac.lane.minX ?? 0) - 60;
          const maxX = (ac.lane.maxX ?? SCENE_W) + 60;
          if (ac.x < minX || ac.x > maxX) {
            ac.sprite.destroy();
            for (const g of ac.glows) g.s.destroy();
            actors.splice(i, 1);
          }
        }

        /* smoke & steam ------------------------------------------------ */
        for (const src of painted.smoke) {
          const steam = src.kind === "steam";
          if (puffs.length < 140 && rnd() < dt * (steam ? 2.6 : 2.1)) {
            const s = new Sprite(glowTex);
            s.anchor.set(0.5);
            s.tint = steam ? 0xdfe8f0 : 0x9aa4b0;
            smokeLayer.addChild(s);
            puffs.push({
              s,
              vx: 2 + rnd() * 4 + (kind === "wind" ? 6 : 0),
              vy: -(steam ? 7 + rnd() * 6 : 5 + rnd() * 5),
              age: 0,
              life: steam ? 1.4 + rnd() * 0.8 : 2.8 + rnd() * 2,
              size: steam ? 2 : 2.5,
              grow: steam ? 5 : 8,
              a: steam ? 0.26 : 0.18,
            });
            const p = puffs[puffs.length - 1];
            s.position.set(src.x + (rnd() - 0.5) * 2, src.y);
            p.s.alpha = 0;
          }
        }
        for (let i = puffs.length - 1; i >= 0; i--) {
          const p = puffs[i];
          p.age += dt;
          if (p.age > p.life) {
            p.s.destroy();
            puffs.splice(i, 1);
            continue;
          }
          const t01 = p.age / p.life;
          p.s.x += p.vx * dt;
          p.s.y += p.vy * dt;
          const size = p.size + p.grow * t01;
          p.s.width = p.s.height = size * 2.2;
          p.s.alpha = p.a * Math.min(1, t01 * 6) * (1 - t01);
        }

        /* weather ------------------------------------------------------- */
        rainFar.clear();
        rainNear.clear();
        splashG.clear();
        snowG.clear();
        for (const d of farDrops) {
          d.y += d.speed * dt;
          d.x -= d.speed * slant * dt;
          if (d.y - d.len > d.region.y + d.region.h) Object.assign(d, makeDrop(false, false));
          rainFar.moveTo(d.x, d.y).lineTo(d.x + d.len * slant, d.y - d.len);
        }
        if (farDrops.length) rainFar.stroke({ width: 1, color: 0x9fb8cc, alpha: 0.2 });
        for (const d of nearDrops) {
          d.y += d.speed * dt;
          d.x -= d.speed * slant * dt;
          if (d.y >= d.stop) {
            if (d.stop < SCENE_H && !painted.interior) splashes.push({ x: d.x, y: d.stop, t: 0 });
            Object.assign(d, makeDrop(true, false));
          }
          rainNear.moveTo(d.x, d.y).lineTo(d.x + d.len * slant, d.y - d.len);
        }
        if (nearDrops.length) rainNear.stroke({ width: 1, color: 0xc4d8e8, alpha: 0.42 });
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          s.t += dt;
          if (s.t > 0.16) {
            splashes.splice(i, 1);
            continue;
          }
          const k = s.t < 0.07 ? 1 : 2;
          const al = 0.55 * (1 - s.t / 0.16);
          splashG.rect(s.x - k, s.y - k, 1, 1).fill({ color: 0xd8e8f4, alpha: al });
          splashG.rect(s.x + k, s.y - k, 1, 1).fill({ color: 0xd8e8f4, alpha: al });
        }
        for (const f of flakes) {
          f.y += f.v * dt;
          f.x += Math.sin(time + f.ph) * f.sway * dt;
          if (f.y > f.r.y + f.r.h) {
            f.y = f.r.y - 2;
            f.x = f.r.x + rnd() * f.r.w;
          }
          snowG.rect(f.x, f.y, f.s, f.s).fill({ color: 0xeef4fa, alpha: 0.85 });
        }
        for (const b of fogBanks) b.s.tilePosition.x -= b.speed * dt;

        glassG.clear();
        for (const d of drips) {
          if (d.pause > 0) d.pause -= dt;
          else {
            d.v = Math.min(26, d.v + dt * (6 + rnd() * 30));
            d.y += d.v * dt;
            if (rnd() < dt * 0.8) {
              d.pause = 0.2 + rnd() * 1.6;
              d.v = 0;
            }
          }
          if (d.y > d.w.y + d.w.h - 1) {
            d.y = d.w.y + rnd() * d.w.h * 0.3;
            d.x = d.w.x + 1 + Math.floor(rnd() * (d.w.w - 2));
          }
          glassG.rect(d.x, d.y - 3, 1, 3).fill({ color: 0xc8dcf0, alpha: 0.18 });
          glassG.rect(d.x, d.y, 1, 1).fill({ color: 0xeaf6ff, alpha: 0.55 });
        }

        /* lightning ---------------------------------------------------- */
        flashG.clear();
        boltG.clear();
        if (storm) {
          nextStrike -= dt;
          if (nextStrike <= 0) {
            const k = 0.65 + rnd() * 0.35;
            flashQueue = [
              { at: time, k },
              { at: time + 0.08 + rnd() * 0.05, k: k * 0.45 },
              { at: time + 0.19 + rnd() * 0.08, k: k * 0.8 },
            ];
            if (!painted.interior) {
              bolt = makeBolt();
              boltLife = 0.28;
            }
            audio.thunder(0.25 + rnd() * 1.6, 0.55 + k * 0.35);
            nextStrike = 7 + rnd() * 14;
          }
          while (flashQueue.length && flashQueue[0].at <= time) flash = Math.max(flash, flashQueue.shift()!.k);
          if (flash > 0) {
            flash = Math.max(0, flash - dt * 5.5);
            if (painted.interior) {
              for (const w of painted.windows) flashG.rect(w.x, w.y, w.w, w.h).fill({ color: 0xe6f0ff, alpha: flash * 0.8 });
              flashG.rect(0, 0, SCENE_W, SCENE_H).fill({ color: 0xc8d8f0, alpha: flash * 0.09 });
            } else {
              flashG.rect(-40, -40, SCENE_W + 80, painted.horizon + 40).fill({ color: 0xdce8f8, alpha: flash * 0.22 });
              flashG.rect(-40, -40, SCENE_W + 80, SCENE_H + 80).fill({ color: 0xdce8f8, alpha: flash * 0.18 });
            }
          }
          if (boltLife > 0) {
            boltLife -= dt;
            const vis = flash > 0.15 ? 1 : 0.25;
            for (const path of bolt) {
              boltG.moveTo(path[0], path[1]);
              for (let p = 2; p < path.length; p += 2) boltG.lineTo(path[p], path[p + 1]);
            }
            boltG.stroke({ width: 3, color: 0x9cb8ff, alpha: 0.25 * vis });
            for (const path of bolt) {
              boltG.moveTo(path[0], path[1]);
              for (let p = 2; p < path.length; p += 2) boltG.lineTo(path[p], path[p + 1]);
            }
            boltG.stroke({ width: 1, color: 0xffffff, alpha: 0.95 * vis });
          }
        }
      });
    })();

    return () => {
      destroyed = true;
      if (onMove) window.removeEventListener("pointermove", onMove);
      ro?.disconnect();
      releaseStorm?.();
      if (app) {
        app.destroy(true, { children: true });
        app = null;
      }
      for (const t of textures) t.destroy(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, weather.kind, weather.intensity, timeOfDay, seedKey, animated, dim, reduce]);

  return (
    <div
      ref={hostRef}
      className={`pixelated absolute inset-0 overflow-hidden ${className ?? ""}`}
      style={{ filter: "saturate(1.35) contrast(1.06) brightness(1.05)" }}
      aria-hidden="true"
    />
  );
}

/**
 * StageOverlay — a DOM layer that exactly matches the rendered scene
 * rectangle, so hotspots and markers positioned in scene-percent
 * coordinates stay glued to the pixels on every aspect ratio.
 */
export function StageOverlay({ children, className }: { children: React.ReactNode; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;
    const layout = () => {
      const r = sceneRect(host.clientWidth, host.clientHeight);
      inner.style.left = `${r.x}px`;
      inner.style.top = `${r.y}px`;
      inner.style.width = `${r.w}px`;
      inner.style.height = `${r.h}px`;
    };
    const ro = new ResizeObserver(layout);
    ro.observe(host);
    layout();
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={hostRef} className={`pointer-events-none absolute inset-0 ${className ?? ""}`}>
      <div ref={innerRef} className="absolute [&>*]:pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
