"use client";

import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Sprite, Texture } from "pixi.js";
import type { SceneId, TimeOfDay, Weather } from "@/lib/engine/types";
import { paintScene, sceneRect, SCENE_W, SCENE_H, type PaintedScene } from "@/lib/scenes/paint";
import { rngFor } from "@/lib/engine/rng";

/**
 * PixelStage — the living window into Veilport.
 *
 * A deterministic painted base (Canvas2D pixel art) is displayed through
 * PixiJS, which animates everything that breathes: rain, snow, drifting
 * fog, chimney smoke, flickering windows, stuttering neon, lightning,
 * a slow cinematic zoom and a whisper of mouse parallax.
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

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
}
interface Flake {
  x: number;
  y: number;
  speed: number;
  sway: number;
  phase: number;
}
interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
}

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

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let destroyed = false;
    let app: Application | null = null;
    let onMove: ((e: PointerEvent) => void) | null = null;
    let ro: ResizeObserver | null = null;

    (async () => {
      const painted: PaintedScene = paintScene(scene, weather, timeOfDay, seedKey);
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

      const root = new Container();
      a.stage.addChild(root);

      const tex = Texture.from(painted.canvas);
      tex.source.scaleMode = "nearest";
      const base = new Sprite(tex);
      root.addChild(base);

      const fx = new Graphics();
      const weatherFx = new Graphics();
      const flash = new Graphics();
      root.addChild(fx);
      root.addChild(weatherFx);
      root.addChild(flash);

      // dim overlay
      if (dim > 0) {
        const d = new Graphics();
        d.rect(0, 0, SCENE_W, SCENE_H).fill({ color: 0x04060a, alpha: dim });
        root.addChild(d);
      }

      /* layout ------------------------------------------------------- */
      const layout = () => {
        const cw = host.clientWidth;
        const ch = host.clientHeight;
        if (!cw || !ch) return;
        a.renderer.resize(cw, ch);
        const { s } = sceneRect(cw, ch);
        root.scale.set(s * zoom);
        root.position.set(
          (cw - SCENE_W * s * zoom) / 2 + parallaxX * s,
          (ch - SCENE_H * s * zoom) / 2 + parallaxY * s
        );
      };

      let zoom = 1.02;
      let zoomDir = 1;
      let parallaxX = 0;
      let parallaxY = 0;
      let targetPX = 0;
      let targetPY = 0;

      ro = new ResizeObserver(layout);
      ro.observe(host);
      layout();

      onMove = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        targetPX = ((e.clientX - r.left) / r.width - 0.5) * -5;
        targetPY = ((e.clientY - r.top) / r.height - 0.5) * -3;
      };
      window.addEventListener("pointermove", onMove);

      /* dynamic particles -------------------------------------------- */
      const rnd = rngFor(`fx:${scene}:${seedKey}`);
      const drops: Drop[] = [];
      const flakes: Flake[] = [];
      const puffs: Puff[] = [];
      const dropCount =
        weather.kind === "storm" ? 170 : weather.kind === "rain" ? 120 : 0;
      for (let i = 0; i < dropCount; i++) {
        drops.push({
          x: rnd() * SCENE_W,
          y: rnd() * SCENE_H,
          len: 4 + rnd() * 6,
          speed: 220 + rnd() * 160,
        });
      }
      if (weather.kind === "snow") {
        for (let i = 0; i < 110; i++) {
          flakes.push({
            x: rnd() * SCENE_W,
            y: rnd() * SCENE_H,
            speed: 12 + rnd() * 20,
            sway: 4 + rnd() * 8,
            phase: rnd() * Math.PI * 2,
          });
        }
      }
      // fog banks
      const fogBanks =
        weather.kind === "fog"
          ? [0, 1, 2, 3].map((i) => ({
              x: rnd() * SCENE_W,
              y: painted.horizon - 30 + i * 22,
              w: 180 + rnd() * 160,
              speed: 2.5 + rnd() * 4,
              alpha: 0.05 + rnd() * 0.05,
            }))
          : weather.kind === "storm" || weather.kind === "rain"
            ? [0, 1].map(() => ({
                x: rnd() * SCENE_W,
                y: painted.horizon + rnd() * 30,
                w: 200,
                speed: 2,
                alpha: 0.035,
              }))
            : [];

      let time = 0;
      let lightning = 0;
      let nextLightning = 4 + rnd() * 8;

      const lightStates = painted.lights.map(() => ({ on: 1, t: rnd() * 10 }));
      const neonStates = painted.neons.map(() => ({ dimmed: 0 }));

      a.ticker.maxFPS = 60;
      a.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000;
        time += dt;

        if (animated) {
          // cinematic slow zoom
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
          if (l.flicker > 0.3) {
            st.t -= dt;
            if (st.t <= 0) {
              st.on = st.on === 1 ? 0.25 + rnd() * 0.4 : 1;
              st.t = st.on === 1 ? 0.4 + rnd() * 3 : 0.05 + rnd() * 0.2;
            }
          } else {
            st.on = 0.85 + Math.sin(time * (2 + i * 0.7)) * 0.15;
          }
          if (st.on < 1) {
            fx.rect(l.x, l.y, l.w, l.h).fill({
              color: 0x04060a,
              alpha: (1 - st.on) * 0.85,
            });
          }
          // soft pulse glow
          const glowA = 0.05 + 0.03 * Math.sin(time * 1.4 + i);
          fx.rect(l.x - 2, l.y - 2, l.w + 4, l.h + 4).fill({
            color: 0xffc46b,
            alpha: Math.max(0, glowA * st.on),
          });
        });

        painted.neons.forEach((n, i) => {
          const st = neonStates[i];
          if (rnd() < 0.004) st.dimmed = 0.12 + rnd() * 0.2;
          st.dimmed = Math.max(0, st.dimmed - dt);
          if (st.dimmed > 0) {
            fx.rect(n.x - 1, n.y - 1, n.w + 2, n.h + 2).fill({
              color: 0x04060a,
              alpha: 0.75,
            });
          } else {
            fx.rect(n.x - 2, n.y - 2, n.w + 4, n.h + 4).fill({
              color: 0xffffff,
              alpha: 0.04 + 0.02 * Math.sin(time * 3 + i * 2),
            });
          }
        });

        /* smoke ---------------------------------------------------- */
        if (animated) {
          for (const s of painted.smoke) {
            if (rnd() < dt * 2.2) {
              puffs.push({
                x: s.x + (rnd() - 0.5) * 2,
                y: s.y,
                vx: 2 + rnd() * 4,
                vy: -6 - rnd() * 5,
                age: 0,
                life: 3 + rnd() * 2,
                size: 1 + rnd() * 2,
              });
            }
          }
        }
        for (let i = puffs.length - 1; i >= 0; i--) {
          const p = puffs[i];
          p.age += dt;
          if (p.age > p.life) {
            puffs.splice(i, 1);
            continue;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          const t01 = p.age / p.life;
          fx.rect(p.x, p.y, p.size + t01 * 3, p.size + t01 * 2).fill({
            color: 0xb8c0c8,
            alpha: 0.12 * (1 - t01),
          });
        }

        /* weather --------------------------------------------------- */
        weatherFx.clear();
        if (animated) {
          for (const d of drops) {
            d.y += d.speed * dt;
            d.x -= d.speed * 0.12 * dt;
            if (d.y > SCENE_H) {
              d.y = -d.len;
              d.x = rnd() * (SCENE_W + 40);
            }
            weatherFx
              .rect(d.x, d.y, 1, d.len)
              .fill({ color: 0xaec8dc, alpha: 0.35 });
          }
          for (const f of flakes) {
            f.y += f.speed * dt;
            f.x += Math.sin(time + f.phase) * f.sway * dt;
            if (f.y > SCENE_H) {
              f.y = -2;
              f.x = rnd() * SCENE_W;
            }
            weatherFx.rect(f.x, f.y, 1.5, 1.5).fill({ color: 0xe8f0f8, alpha: 0.8 });
          }
          for (const b of fogBanks) {
            b.x += b.speed * dt;
            if (b.x > SCENE_W + b.w) b.x = -b.w;
            weatherFx
              .rect(b.x - b.w, b.y, b.w * 2, 26)
              .fill({ color: 0x9aaabb, alpha: b.alpha });
          }
        }

        /* lightning -------------------------------------------------- */
        flash.clear();
        if (weather.kind === "storm" && animated) {
          nextLightning -= dt;
          if (nextLightning <= 0) {
            lightning = 0.55 + rnd() * 0.3;
            nextLightning = 6 + rnd() * 14;
          }
          if (lightning > 0) {
            lightning = Math.max(0, lightning - dt * 2.4);
            flash
              .rect(0, 0, SCENE_W, SCENE_H)
              .fill({ color: 0xdce8f8, alpha: lightning * 0.35 });
          }
        }
      });
    })();

    return () => {
      destroyed = true;
      if (onMove) window.removeEventListener("pointermove", onMove);
      ro?.disconnect();
      if (app) {
        app.destroy(true, { children: true, texture: true });
        app = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, weather.kind, weather.intensity, timeOfDay, seedKey, animated, dim]);

  return (
    <div
      ref={hostRef}
      className={`pixelated absolute inset-0 overflow-hidden ${className ?? ""}`}
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
