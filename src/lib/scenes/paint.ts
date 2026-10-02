import type { SceneId, TimeOfDay, Weather } from "@/lib/engine/types";
import { rngFor } from "@/lib/engine/rng";
import { SCENE_W, SCENE_H, type Mood, type Painter, type PaintedScene } from "./types";
import { mix, neonSign, reflections, rgba } from "./primitives";
import {
  paintDocks,
  paintForest,
  paintHarbor,
  paintSkyline,
  paintStreet,
  paintUniversity,
  paintWarehouse,
  wetSheen,
} from "./exteriors";
import {
  floorSheen,
  paintApartment,
  paintBar,
  paintHighrise,
  paintHotel,
  paintMorgue,
  paintMuseum,
  paintNewsroom,
  paintOffice,
  paintPrecinct,
  paintStation,
} from "./interiors";

/**
 * Procedural pixel-art scene painter.
 *
 * Every scene is painted once, deterministically, onto a 480×270 canvas —
 * ordered-dither skies, noise-shaped clouds, layered architecture, neon
 * lettering, wet-street reflections — and the painter also returns the
 * scene's living details (lights, neon, smoke, windows, lanes, beams,
 * beacons) for the PixiJS stage to animate on top.
 */

export { SCENE_W, SCENE_H };
export type { PaintedScene, LightSpot, NeonSign, SmokeSource } from "./types";

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

/* ------------------------------------------------------------------ */
/* palettes                                                            */
/* ------------------------------------------------------------------ */

export function moodFor(time: TimeOfDay, weather: Weather): Mood {
  const wet = weather.kind === "rain" || weather.kind === "storm";
  let m: Mood;
  if (time === "dusk") {
    m = {
      skyTop: "#222542", skyMid: "#5a3a5a", skyBottom: "#c8703e", far: "#46344e", mid: "#2b2138", near: "#17111e",
      glow: "#e8a849", window: "#ffc46b", windowCool: "#9fd8e8", haze: "#7a4e58", moon: "#f0e2c4",
    };
  } else if (time === "dawn") {
    m = {
      skyTop: "#2a3a5a", skyMid: "#5c6482", skyBottom: "#d49a78", far: "#4a5874", mid: "#2e3a52", near: "#1a2234",
      glow: "#e8c07a", window: "#ffd88a", windowCool: "#a8d8e0", haze: "#7c7c90", moon: "#f0ead8",
    };
  } else if (wet) {
    m = {
      skyTop: "#080c15", skyMid: "#111a2a", skyBottom: "#26344f", far: "#1c2639", mid: "#131b29", near: "#0a0e16",
      glow: "#e8a849", window: "#ffc46b", windowCool: "#8fd0e8", haze: "#25314a", moon: "#e6e1cd",
    };
  } else {
    m = {
      skyTop: "#060a18", skyMid: "#0f1634", skyBottom: "#28325c", far: "#1d2540", mid: "#131a2c", near: "#0a0e18",
      glow: "#e8a849", window: "#ffc46b", windowCool: "#8fd0e8", haze: "#262f52", moon: "#ece6d0",
    };
  }
  if (weather.kind === "fog") {
    const f = time === "dusk" ? "#8a7068" : time === "dawn" ? "#8a8c98" : "#3a4458";
    m = {
      ...m,
      skyTop: mix(m.skyTop, f, 0.35),
      skyMid: mix(m.skyMid, f, 0.55),
      skyBottom: mix(m.skyBottom, f, 0.62),
      far: mix(m.far, f, 0.55),
      mid: mix(m.mid, f, 0.28),
      near: mix(m.near, f, 0.1),
      haze: f,
    };
  }
  if (weather.kind === "snow") {
    m = { ...m, haze: mix(m.haze, "#9aa8b8", 0.4), skyBottom: mix(m.skyBottom, "#8a98a8", 0.3) };
  }
  return m;
}

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
  highrise: paintHighrise,
  citymap: paintSkyline,
};

export function paintScene(scene: SceneId, weather: Weather, time: TimeOfDay, seedKey: string): PaintedScene {
  const canvas = document.createElement("canvas");
  canvas.width = SCENE_W;
  canvas.height = SCENE_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  const rnd = rngFor(`${scene}:${seedKey}`);
  const mood = moodFor(time, weather);
  const out: PaintedScene = {
    canvas,
    lights: [],
    neons: [],
    smoke: [],
    horizon: 190,
    ground: 230,
    interior: false,
    windows: [],
    roads: [],
    walks: [],
    blinkers: [],
    beams: [],
    sweeps: [],
    wet: false,
    reflective: true,
  };
  ctx.fillStyle = "#05030a";
  ctx.fillRect(0, 0, SCENE_W, SCENE_H);
  PAINTERS[scene](ctx, mood, weather, rnd, out);

  // neon goes up last, over whatever wall it hangs on
  for (const n of out.neons) neonSign(ctx, n);

  const wet = weather.kind === "rain" || weather.kind === "storm";
  if (!out.interior) {
    if (wet) {
      if (out.reflective) {
        reflections(ctx, out.ground, out, rnd);
        wetSheen(ctx, mood, out.ground, rnd);
      }
      out.wet = true;
    }
    if (weather.kind === "fog") {
      // the fog sits thickest along the waterline and thins upward
      const g = ctx.createLinearGradient(0, out.horizon - 90, 0, SCENE_H);
      g.addColorStop(0, rgba(mood.haze, 0.04));
      g.addColorStop(0.42, rgba(mood.haze, 0.24));
      g.addColorStop(0.66, rgba(mood.haze, 0.1));
      g.addColorStop(1, rgba(mood.haze, 0.03));
      ctx.fillStyle = g;
      ctx.fillRect(0, out.horizon - 90, SCENE_W, SCENE_H - out.horizon + 90);
    }
    if (weather.kind === "snow") {
      ctx.fillStyle = "rgba(220,230,240,0.12)";
      ctx.fillRect(0, out.ground, SCENE_W, SCENE_H - out.ground);
    }
  } else {
    floorSheen(ctx, out);
  }
  return out;
}
