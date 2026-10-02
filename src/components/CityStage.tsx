"use client";

import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Sprite, Texture } from "pixi.js";
import type { Weather } from "@/lib/engine/types";
import { bakeCityMap, cityScreen, type CityBake } from "@/lib/iso/citymap";
import { CITY_LOCATIONS } from "@/lib/city/veilport";
import { rgbOf } from "@/lib/iso/core";
import { useReducedMotionPref } from "@/lib/useMotion";

/**
 * CityStage — Veilport as a living table model: traffic threading the
 * avenues, searchlights over the financial district, the lighthouse beam
 * turning over the bay, aircraft lights blinking on the towers, rain, and a
 * beam of light over every place the case can take you.
 */

export interface Beacon {
  id: string;
  color: string;
  /** 0 dim … 1 full */
  strength: number;
}

export interface CityLayout {
  scale: number;
  x: number;
  y: number;
  spots: CityBake["spots"];
}

interface Props {
  weather: Weather;
  beacons: Beacon[];
  hovered?: string | null;
  onLayout?: (l: CityLayout) => void;
  /** px on the right kept clear for a panel */
  insetRight?: number;
}

let BAKE: CityBake | null = null;
function cityBake() {
  if (!BAKE) BAKE = bakeCityMap(CITY_LOCATIONS);
  return BAKE;
}

const num = (c: string) => {
  const [r, g, b] = rgbOf(c);
  return (r << 16) | (g << 8) | b;
};

function canvasOf(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  return c;
}

export default function CityStage({ weather, beacons, hovered, onLayout, insetRight = 0 }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const beaconsRef = useRef(beacons);
  beaconsRef.current = beacons;
  const hoverRef = useRef(hovered);
  hoverRef.current = hovered;
  const layoutRef = useRef(onLayout);
  layoutRef.current = onLayout;
  const insetRef = useRef(insetRight);
  insetRef.current = insetRight;
  const reduce = useReducedMotionPref();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let destroyed = false;
    let app: Application | null = null;
    const textures: Texture[] = [];
    const cleanups: (() => void)[] = [];

    (async () => {
      const bake = cityBake();
      const a = new Application();
      await a.init({ backgroundAlpha: 0, antialias: false, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true, roundPixels: true });
      if (destroyed) {
        a.destroy(true);
        return;
      }
      app = a;
      a.canvas.style.position = "absolute";
      a.canvas.style.inset = "0";
      a.canvas.style.width = "100%";
      a.canvas.style.height = "100%";
      host.prepend(a.canvas);
      const tex = (c: HTMLCanvasElement, nearest = true) => {
        const t = Texture.from(c, true);
        if (nearest) t.source.scaleMode = "nearest";
        textures.push(t);
        return t;
      };

      const world = new Container();
      a.stage.addChild(world);
      world.addChild(new Sprite(tex(bake.canvas)));
      const glowTex = tex(
        canvasOf(64, 64, (g) => {
          const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
          gr.addColorStop(0, "rgba(255,255,255,1)");
          gr.addColorStop(0.25, "rgba(255,255,255,0.45)");
          gr.addColorStop(1, "rgba(255,255,255,0)");
          g.fillStyle = gr;
          g.fillRect(0, 0, 64, 64);
        }),
        false
      );
      const beamTex = tex(
        canvasOf(16, 128, (g) => {
          for (let y = 0; y < 128; y++) {
            const k = Math.pow(y / 128, 1.6);
            const gr = g.createLinearGradient(0, 0, 16, 0);
            gr.addColorStop(0, "rgba(255,255,255,0)");
            gr.addColorStop(0.5, `rgba(255,255,255,${0.75 * k})`);
            gr.addColorStop(1, "rgba(255,255,255,0)");
            g.fillStyle = gr;
            g.fillRect(0, y, 16, 1);
          }
        }),
        false
      );

      /* ---- glows ---- */
      const fxLayer = new Container();
      world.addChild(fxLayer);
      const glows = bake.glows.map((gl, i) => {
        const s = new Sprite(glowTex);
        s.anchor.set(0.5);
        s.position.set(gl.x, gl.y);
        s.scale.set((gl.r * 2) / 64);
        s.tint = num(gl.color);
        s.blendMode = "add";
        s.alpha = 0.5;
        fxLayer.addChild(s);
        return { s, blink: !!gl.blink, ph: (i * 0.37) % 1 };
      });

      /* ---- traffic ---- */
      const cars = Array.from({ length: Math.min(70, bake.roads.length * 3) }, (_, i) => {
        const road = bake.roads[i % bake.roads.length];
        const head = i % 3 !== 0;
        const s = new Sprite(Texture.WHITE);
        s.width = 1;
        s.height = 1;
        s.tint = head ? (i % 5 === 0 ? 0xffd27a : 0xfff4e0) : 0xff3a4a;
        const halo = new Sprite(glowTex);
        halo.anchor.set(0.5);
        halo.scale.set(6 / 64);
        halo.tint = s.tint;
        halo.blendMode = "add";
        halo.alpha = 0.55;
        fxLayer.addChild(halo, s);
        return { s, halo, road, t: ((i * 0.61) % 1) as number, v: (0.025 + ((i * 7) % 5) * 0.008) * (i % 2 ? 1 : -1), lane: i % 2 ? 0.3 : -0.3 };
      });

      /* ---- searchlights & the lighthouse ---- */
      const sweepG = new Graphics();
      sweepG.blendMode = "add";
      world.addChildAt(sweepG, 1);

      /* ---- beacons over destinations ---- */
      const beaconLayer = new Container();
      world.addChild(beaconLayer);
      const beaconViews = new Map<string, { beam: Sprite; ring: Graphics; core: Sprite }>();
      const ensureBeacon = (id: string) => {
        let v = beaconViews.get(id);
        const spot = bake.spots[id];
        if (!v && spot) {
          const beam = new Sprite(beamTex);
          beam.anchor.set(0.5, 1);
          beam.position.set(spot.x, spot.y);
          beam.blendMode = "add";
          const ring = new Graphics();
          ring.blendMode = "add";
          const core = new Sprite(glowTex);
          core.anchor.set(0.5);
          core.position.set(spot.x, spot.y);
          core.blendMode = "add";
          beaconLayer.addChild(ring, beam, core);
          v = { beam, ring, core };
          beaconViews.set(id, v);
        }
        return v;
      };

      /* ---- rain ---- */
      const rainG = new Graphics();
      a.stage.addChild(rainG);
      const raining = weather.kind === "rain" || weather.kind === "storm";
      const drops = raining
        ? Array.from({ length: Math.round(140 * (0.5 + weather.intensity)) }, () => ({ x: Math.random(), y: Math.random(), v: 0.9 + Math.random() * 0.6, len: 8 + Math.random() * 10 }))
        : [];
      const fogG = weather.kind === "fog";
      const fogSprites = fogG
        ? Array.from({ length: 10 }, () => {
            const s = new Sprite(glowTex);
            s.anchor.set(0.5);
            s.tint = 0xc8b8f0;
            s.alpha = 0.12;
            s.scale.set(5 + Math.random() * 5, 1.5 + Math.random());
            s.position.set(Math.random() * bake.canvas.width, bake.canvas.height * (0.3 + Math.random() * 0.6));
            world.addChild(s);
            return { s, v: 3 + Math.random() * 5 };
          })
        : [];

      /* ---- layout ---- */
      let scale = 1;
      let vw = 0;
      let vh = 0;
      const layout = () => {
        vw = host.clientWidth;
        vh = host.clientHeight;
        if (!vw || !vh) return;
        a.renderer.resize(vw, vh);
        // a side panel may overlap the model's empty eastern tip, not its middle
        const inset = vw >= 900 ? insetRef.current * 0.5 : 0;
        const room = vw - inset;
        const fit = Math.min(room / bake.canvas.width, (vh * 1.04) / bake.canvas.height);
        scale = fit >= 1.9 ? Math.floor(fit + 0.1) : fit >= 1 ? Math.floor(fit * 4) / 4 : fit;
        const x = Math.round((room - bake.canvas.width * scale) / 2);
        const y = Math.round((vh - bake.canvas.height * scale) / 2 + vh * 0.03);
        world.scale.set(scale);
        world.position.set(x, y);
        layoutRef.current?.({ scale, x, y, spots: bake.spots });
      };
      const ro = new ResizeObserver(layout);
      ro.observe(host);
      cleanups.push(() => ro.disconnect());
      layout();

      let time = 0;
      const calm = reduce;
      a.ticker.maxFPS = 60;
      a.ticker.add((ticker) => {
        const dt = Math.min(0.05, ticker.deltaMS / 1000);
        time += dt;

        for (const gl of glows) {
          gl.s.alpha = gl.blink ? ((time * 0.8 + gl.ph) % 1 < 0.5 ? 0.9 : 0.08) : 0.45 + (calm ? 0 : Math.sin(time * 1.4 + gl.ph * 6) * 0.08);
        }

        if (!calm) {
          for (const c of cars) {
            c.t += c.v * dt;
            if (c.t > 1) c.t -= 1;
            if (c.t < 0) c.t += 1;
            const [ax, ay] = c.road.a;
            const [bx, by] = c.road.b;
            const horiz = ay === by;
            const x = ax + 0.5 + (bx - ax) * c.t + (horiz ? 0 : c.lane * 0.5);
            const y = ay + 0.5 + (by - ay) * c.t + (horiz ? c.lane * 0.5 : 0);
            const [sx, sy] = cityScreen(bake, x, y, 1);
            c.s.position.set(Math.round(sx), Math.round(sy));
            c.halo.position.set(sx, sy);
          }
        }

        // searchlights rake the clouds; the lighthouse turns
        sweepG.clear();
        bake.searchlights.forEach((sl, i) => {
          const ang = -Math.PI / 2 + Math.sin(time * (calm ? 0 : 0.35) + i * 2.1) * 0.55;
          const len = 260;
          const spread = 0.05;
          const x1 = sl.x + Math.cos(ang - spread) * len;
          const y1 = sl.y + Math.sin(ang - spread) * len;
          const x2 = sl.x + Math.cos(ang + spread) * len;
          const y2 = sl.y + Math.sin(ang + spread) * len;
          sweepG.poly([sl.x, sl.y, x1, y1, x2, y2]).fill({ color: i % 2 ? 0xff7ab8 : 0x9ad8ff, alpha: 0.07 });
        });
        if (bake.lighthouse) {
          const { x, y } = bake.lighthouse;
          const ang = calm ? 0.6 : time * 0.9;
          const len = 120;
          const dx = Math.cos(ang);
          const dy = Math.sin(ang) * 0.5; // the beam sweeps a flattened circle
          const nx = -dy;
          const ny = dx;
          const w = 9;
          sweepG.poly([x, y, x + dx * len + nx * w, y + dy * len + ny * w * 0.5, x + dx * len - nx * w, y + dy * len - ny * w * 0.5]).fill({ color: 0xfff0c0, alpha: 0.12 + Math.max(0, Math.cos(ang)) * 0.06 });
        }

        // beacons over destinations
        const hov = hoverRef.current;
        for (const bc of beaconsRef.current) {
          const v = ensureBeacon(bc.id);
          if (!v) continue;
          const spot = bake.spots[bc.id];
          const col = num(bc.color);
          const hot = hov === bc.id;
          const pulse = calm ? 0.5 : (Math.sin(time * 2.2 + spot.x * 0.05) + 1) / 2;
          v.beam.tint = col;
          v.beam.alpha = (0.35 + pulse * 0.2) * bc.strength + (hot ? 0.35 : 0);
          v.beam.scale.set(hot ? 0.9 : 0.6, (hot ? 1.3 : 1) * (0.8 + bc.strength * 0.4));
          v.core.tint = col;
          v.core.scale.set(((hot ? 26 : 16) * (0.6 + bc.strength * 0.4)) / 64);
          v.core.alpha = 0.8;
          v.ring.clear();
          const k = calm ? 0.5 : (time * 0.7 + spot.x * 0.01) % 1;
          v.ring.ellipse(spot.x, spot.ground ?? spot.y, 4 + k * 14, (4 + k * 14) * 0.5).stroke({ width: 1, color: col, alpha: (1 - k) * 0.8 * bc.strength });
        }

        // rain across the glass of the night
        if (drops.length) {
          rainG.clear();
          for (const d of drops) {
            d.y += d.v * dt * (calm ? 0 : 1);
            if (d.y > 1.05) {
              d.y = -0.05;
              d.x = Math.random();
            }
            const x = d.x * vw;
            const y = d.y * vh;
            rainG.moveTo(x, y).lineTo(x + d.len * 0.18, y - d.len);
          }
          rainG.stroke({ width: 1, color: 0xa8c0ff, alpha: 0.18 });
        }
        for (const f of fogSprites) {
          f.s.x += f.v * dt;
          if (f.s.x > bake.canvas.width + 160) f.s.x = -160;
        }
      });
    })();

    return () => {
      destroyed = true;
      for (const c of cleanups) c();
      if (app) {
        app.destroy(true, { children: true });
        app = null;
      }
      for (const t of textures) t.destroy(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather.kind, weather.intensity, reduce]);

  return (
    <div
      ref={hostRef}
      className="pixelated absolute inset-0 overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 42%, #2a1a4e 0%, #140c2a 48%, #07050f 100%)" }}
      aria-hidden="true"
    />
  );
}
