import type { Weather } from "@/lib/engine/types";
import { SCENE_W, SCENE_H, type Mood, type Painter, type PaintedScene } from "./types";
import {
  building,
  pendant,
  car,
  cityGlow,
  clouds,
  figure,
  fbm,
  glow,
  mix,
  moon,
  pool,
  puddle,
  rgba,
  shade,
  sky,
  smooth,
  stars,
  streetLamp,
  valueNoise,
  vGradient,
  waterReflection,
  waterStreak,
} from "./primitives";
import { drawPixelText, measurePixelText } from "./pixelfont";

/* ------------------------------------------------------------------ */
/* shared outdoor helpers                                              */
/* ------------------------------------------------------------------ */

const isWet = (w: Weather) => w.kind === "rain" || w.kind === "storm";

/** Sky for an exterior: gradient, then moon & stars or cloud cover, then city glow. */
function outdoorSky(
  ctx: CanvasRenderingContext2D,
  mood: Mood,
  weather: Weather,
  rnd: () => number,
  horizon: number,
  o: { moonX?: number; moonY?: number; glow?: number } = {}
) {
  sky(ctx, mood, horizon + 24);
  const k = weather.kind;
  if (k === "clear" || k === "wind") {
    stars(ctx, rnd, horizon * 0.7, 90);
    moon(ctx, o.moonX ?? 392, o.moonY ?? 44, 9, mood);
    if (k === "wind") {
      clouds(ctx, rnd, {
        y0: 10, y1: horizon * 0.55, cover: 0.32, sx: 120, sy: 18,
        dark: mix(mood.skyTop, mood.skyMid, 0.6), lit: mix(mood.skyMid, mood.moon, 0.35),
        under: mix(mood.skyBottom, mood.glow, 0.2), alpha: 0.75,
      });
    }
  } else if (k === "snow") {
    clouds(ctx, rnd, {
      y0: 0, y1: horizon * 0.9, cover: 0.7, sx: 90, sy: 26,
      dark: mix(mood.skyMid, mood.haze, 0.4), lit: mix(mood.skyBottom, "#c8d0dc", 0.3),
      under: mix(mood.skyBottom, mood.glow, 0.25), alpha: 0.8,
    });
  } else if (k === "fog") {
    moon(ctx, o.moonX ?? 392, o.moonY ?? 50, 8, mood, 0.08);
    clouds(ctx, rnd, {
      y0: 0, y1: horizon, cover: 0.75, sx: 140, sy: 30,
      dark: mix(mood.skyMid, mood.haze, 0.5), lit: mix(mood.haze, "#d8d0c8", 0.25),
      under: mix(mood.skyBottom, mood.glow, 0.25), alpha: 0.7,
    });
  } else {
    // rain & storm: two decks of low cloud, bellies lit by the city
    clouds(ctx, rnd, {
      y0: 6, y1: horizon * 0.8, cover: 0.62, sx: 74, sy: 20,
      dark: mix(mood.skyTop, mood.skyMid, 0.55), lit: mix(mood.skyMid, mood.moon, 0.2),
      under: mix(mood.skyBottom, mood.glow, 0.32), alpha: 0.85,
    });
    clouds(ctx, rnd, {
      y0: 0, y1: horizon * 0.45, cover: 0.5, sx: 120, sy: 26,
      dark: shade(mood.skyTop, 0.85), lit: mix(mood.skyTop, mood.skyMid, 0.7),
      under: mix(mood.skyMid, mood.glow, 0.18), alpha: 0.9,
    });
  }
  cityGlow(ctx, horizon + 6, Math.round(horizon * 0.5), mood.glow, o.glow ?? (isWet(weather) ? 0.16 : 0.11));
}

/** Rain-slick asphalt with lane paint. */
function road(ctx: CanvasRenderingContext2D, mood: Mood, weather: Weather, rnd: () => number, y: number, laneY: number) {
  vGradient(ctx, 0, y, SCENE_W, SCENE_H - y, [mix(mood.near, mood.skyBottom, 0.12), shade(mood.near, 0.75)], 6);
  ctx.fillStyle = rgba("#e8e2d4", 0.22);
  for (let x = 6 + Math.floor(rnd() * 20); x < SCENE_W; x += 34) ctx.fillRect(x, laneY, 14, 1);
  if (isWet(weather)) {
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = rgba(mood.skyBottom, 0.08 + rnd() * 0.06);
      ctx.fillRect(Math.floor(rnd() * SCENE_W), y + 2 + Math.floor(rnd() * (SCENE_H - y - 2)), 2 + Math.floor(rnd() * 6), 1);
    }
  }
}

function sidewalk(ctx: CanvasRenderingContext2D, mood: Mood, y: number, h: number) {
  ctx.fillStyle = mix(mood.near, mood.mid, 0.55);
  ctx.fillRect(0, y, SCENE_W, h);
  ctx.fillStyle = mix(mood.near, mood.skyBottom, 0.22);
  ctx.fillRect(0, y, SCENE_W, 1);
  ctx.fillStyle = shade(mood.near, 0.6);
  ctx.fillRect(0, y + h - 1, SCENE_W, 1);
  for (let x = 4; x < SCENE_W; x += 16) ctx.fillRect(x, y + 1, 1, h - 2);
}

/** A building wall seen at an angle, running from the near corner back to the vanishing point. */
function recedingWall(
  ctx: CanvasRenderingContext2D,
  mood: Mood,
  rnd: () => number,
  out: PaintedScene,
  o: { xNear: number; xFar: number; topNear: number; topFar: number; bottomNear: number; bottomFar: number; color: string }
) {
  const dir = o.xFar > o.xNear ? 1 : -1;
  const span = Math.abs(o.xFar - o.xNear);
  // window columns get narrower and closer together as they recede
  const cols: number[] = [];
  for (let t = 0.04; t < 0.95; t += 0.13 * (1 - t * 0.55)) cols.push(t);
  const lit = cols.map(() => Array.from({ length: 14 }, () => rnd() < 0.3));
  for (let i = 0; i <= span; i++) {
    const t = i / span;
    const x = o.xNear + dir * i;
    const top = Math.round(o.topNear + (o.topFar - o.topNear) * t);
    const bottom = Math.round(o.bottomNear + (o.bottomFar - o.bottomNear) * t);
    ctx.fillStyle = mix(o.color, mood.haze, t * 0.35);
    ctx.fillRect(x, top, 1, bottom - top);
    ctx.fillStyle = mix(o.color, mood.skyBottom, 0.3);
    ctx.fillRect(x, top, 1, 1);
    const ci = cols.findIndex((c, k) => t >= c && t < c + 0.06 * (1 - c * 0.6) && k >= 0);
    if (ci >= 0) {
      const h = bottom - top;
      for (let r = 0; r < 14; r++) {
        const y0 = top + Math.round(h * (0.06 + r * 0.068));
        const y1 = top + Math.round(h * (0.06 + r * 0.068 + 0.035));
        if (y1 >= bottom - 4) break;
        const on = lit[ci][r];
        ctx.fillStyle = on ? mix(mood.window, o.color, t * 0.5) : shade(o.color, 0.7);
        ctx.fillRect(x, y0, 1, Math.max(1, y1 - y0));
        if (on && t < 0.2 && rnd() < 0.08) out.lights.push({ x, y: y0, w: 1, h: Math.max(1, y1 - y0), color: mood.window, flicker: 0.1 });
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* skyline — the waterfront panorama                                   */
/* ------------------------------------------------------------------ */

export const paintSkyline: Painter = (ctx, mood, weather, rnd, out) => {
  const horizon = 212;
  const waterTop = 222;
  const quay = 240;
  out.horizon = horizon;
  out.ground = quay + 6;
  outdoorSky(ctx, mood, weather, rnd, horizon, { glow: isWet(weather) ? 0.2 : 0.14 });

  // far towers, lost in the haze
  for (let x = -10; x < SCENE_W; x += 12 + Math.floor(rnd() * 18)) {
    building(ctx, {
      x, w: 14 + Math.floor(rnd() * 18), h: 46 + Math.floor(rnd() * 80), ground: horizon,
      color: mood.far, litChance: 0.22, rnd, out, mood, haze: 0.5, style: "tower", collectLights: false,
      roof: rnd() < 0.25 ? "antenna" : "flat",
    });
  }

  // the Meridian spire — Veilport's landmark
  building(ctx, {
    x: 284, w: 28, h: 156, ground: horizon + 6, color: mix(mood.mid, mood.far, 0.35), litChance: 0.36,
    rnd, out, mood, haze: 0.12, style: "deco", roof: "spire",
  });

  // mid towers
  for (let x = -6; x < SCENE_W; x += 30 + Math.floor(rnd() * 30)) {
    const w = 26 + Math.floor(rnd() * 28);
    if (x + w > 276 && x < 320) continue;
    const r = rnd();
    building(ctx, {
      x, w, h: 78 + Math.floor(rnd() * 92), ground: horizon + 6, color: mood.mid, litChance: 0.3, rnd, out, mood,
      haze: 0.14, style: r < 0.45 ? "tower" : r < 0.75 ? "deco" : "brick",
      roof: rnd() < 0.3 ? "water" : rnd() < 0.4 ? "antenna" : rnd() < 0.5 ? "setback" : "flat",
    });
    if (rnd() < 0.3) out.smoke.push({ x: x + 6, y: horizon + 6 - 80 - Math.floor(rnd() * 50), kind: "steam" });
  }

  // the river: a dark mirror holding the whole city upside down
  ctx.fillStyle = shade(mood.near, 1.2);
  ctx.fillRect(0, horizon + 6, SCENE_W, waterTop - horizon - 6);
  vGradient(ctx, 0, waterTop, SCENE_W, quay - waterTop, [mix(mood.skyBottom, "#05080e", 0.45), "#05080e"], 6);
  waterReflection(ctx, waterTop, quay, "#06090f", rnd, { squash: 0.55, strength: 0.75, amp: 1.2 });

  // the promenade, its railing and lamps
  ctx.fillStyle = mix(mood.near, mood.mid, 0.4);
  ctx.fillRect(0, quay, SCENE_W, 6);
  ctx.fillStyle = "#05070b";
  ctx.fillRect(0, quay - 6, SCENE_W, 1);
  for (let x = 0; x < SCENE_W; x += 6) ctx.fillRect(x, quay - 6, 1, 6);
  road(ctx, mood, weather, rnd, quay + 6, 258);
  out.roads.push({ y: 262, scale: 1, every: 8 });
  out.walks.push({ y: quay + 5, scale: 0.9, minX: 80, maxX: 400, every: 10 });

  // near corners frame the view
  building(ctx, {
    x: 0, w: 78, h: 128, ground: quay + 6, color: mood.near, litChance: 0.36, rnd, out, mood, style: "brick", fireEscape: true,
  });
  building(ctx, {
    x: 404, w: 76, h: 112, ground: quay + 6, color: shade(mood.near, 1.1), litChance: 0.36, rnd, out, mood, style: "brick",
  });
  out.neons.push({ x: 10, y: 150, w: 30, h: 9, color: "rgb(224,92,110)", text: "JAZZ" });
  out.neons.push({ x: 394, y: 146, w: 9, h: 34, color: "rgb(79,216,196)", text: "HOTEL", vertical: true });
  streetLamp(ctx, 132, quay, mood, out);
  streetLamp(ctx, 330, quay, mood, out);
};

/* ------------------------------------------------------------------ */
/* street — downtown, neon over cobblestone                            */
/* ------------------------------------------------------------------ */

export const paintStreet: Painter = (ctx, mood, weather, rnd, out) => {
  const horizon = 190;
  const ground = 232;
  out.horizon = horizon;
  out.ground = ground;
  outdoorSky(ctx, mood, weather, rnd, horizon, { moonX: 250, moonY: 40 });

  // the side street: an alley receding to a vanishing point between two walls
  const vx = 244;
  const farL = 222;
  const farR = 266;
  for (let i = 0; i < 3; i++) {
    building(ctx, {
      x: farL + i * 15, w: 14, h: 30 + Math.floor(rnd() * 26), ground: horizon, color: mood.far, litChance: 0.3, rnd, out, mood,
      haze: 0.45, style: "tower", collectLights: false, roof: rnd() < 0.4 ? "water" : "flat",
    });
  }
  recedingWall(ctx, mood, rnd, out, { xNear: 162, xFar: farL, topNear: 106, topFar: horizon - 46, bottomNear: ground, bottomFar: horizon, color: shade(mood.mid, 0.72) });
  recedingWall(ctx, mood, rnd, out, { xNear: 324, xFar: farR, topNear: 92, topFar: horizon - 40, bottomNear: ground, bottomFar: horizon, color: shade(mood.mid, 0.66) });
  ctx.fillStyle = shade(mood.near, 1.05);
  ctx.beginPath();
  ctx.moveTo(farL, horizon);
  ctx.lineTo(farR, horizon);
  ctx.lineTo(324, ground);
  ctx.lineTo(162, ground);
  ctx.closePath();
  ctx.fill();
  // narrow sidewalks along the alley walls
  ctx.fillStyle = mix(mood.near, mood.mid, 0.5);
  ctx.beginPath();
  ctx.moveTo(farL, horizon);
  ctx.lineTo(farL + 4, horizon);
  ctx.lineTo(180, ground);
  ctx.lineTo(162, ground);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(farR - 4, horizon);
  ctx.lineTo(farR, horizon);
  ctx.lineTo(324, ground);
  ctx.lineTo(306, ground);
  ctx.fill();
  ctx.fillStyle = rgba("#e8e2d4", 0.16);
  for (let i = 0; i < 6; i++) {
    const t0 = i / 6;
    const y0 = horizon + (ground - horizon) * t0 * t0;
    const y1 = horizon + (ground - horizon) * (t0 + 0.07) * (t0 + 0.07);
    ctx.fillRect(vx, Math.round(y0), 1, Math.max(1, Math.round(y1 - y0)));
  }
  // a lamp at the far end of the alley, and a traffic light
  ctx.fillStyle = "#05070b";
  ctx.fillRect(258, horizon - 22, 1, 22);
  ctx.fillRect(256, horizon - 26, 5, 5);
  out.blinkers.push({ x: 258, y: horizon - 25, color: "#e8a849", period: 1.6, phase: 0.3, duty: 0.5 });
  glow(ctx, 232, horizon - 12, 14, mood.window, 0.25);
  ctx.fillStyle = mood.window;
  ctx.fillRect(231, horizon - 13, 2, 1);
  out.lights.push({ x: 231, y: horizon - 13, w: 2, h: 1, color: mood.window, flicker: 0.4, glow: 2 });

  // left side: tenement with a fire escape, then the café
  building(ctx, {
    x: 0, w: 96, h: 172, ground, color: mood.mid, litChance: 0.34, rnd, out, mood, style: "brick", roof: "water", fireEscape: true,
  });
  building(ctx, {
    x: 96, w: 66, h: 126, ground, color: shade(mood.mid, 0.86), litChance: 0.3, rnd, out, mood, style: "plain",
  });
  // right side: deco block, then the hotel
  building(ctx, {
    x: 324, w: 76, h: 140, ground, color: shade(mood.mid, 0.92), litChance: 0.32, rnd, out, mood, style: "deco", roof: "antenna",
  });
  building(ctx, {
    x: 400, w: 80, h: 178, ground, color: mood.mid, litChance: 0.38, rnd, out, mood, style: "brick", roof: "water", fireEscape: true,
  });

  // the café: awning, lit window, two people who never left
  ctx.fillStyle = "#0e0c0b";
  ctx.fillRect(0, 194, 96, 38);
  ctx.fillStyle = mood.window;
  ctx.fillRect(8, 202, 34, 22);
  ctx.fillRect(52, 202, 34, 22);
  ctx.fillStyle = shade(mood.window, 0.82);
  ctx.fillRect(8, 220, 78, 4);
  out.lights.push({ x: 8, y: 202, w: 34, h: 22, color: mood.window, flicker: 0.05, glow: 1.4 });
  out.lights.push({ x: 52, y: 202, w: 34, h: 22, color: mood.window, flicker: 0.05, glow: 1.4 });
  ctx.fillStyle = "#1a1008";
  ctx.fillRect(42, 202, 10, 30); // door
  figure(ctx, 18, 222, { color: "#2a1a0c", hat: true });
  figure(ctx, 30, 222, { color: "#2a1a0c" });
  figure(ctx, 70, 222, { color: "#2a1a0c", hat: true });
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 ? "#6e2a36" : "#d8cfba";
    ctx.fillRect(2 + i * 13, 189, 13, 5);
    ctx.fillStyle = i % 2 ? "#4a1c24" : "#a89e88";
    ctx.fillRect(2 + i * 13, 194, 13, 1);
  }
  out.neons.push({ x: 104, y: 150, w: 34, h: 10, color: "rgb(224,92,110)", text: "CAFE" });
  out.neons.push({ x: 386, y: 112, w: 10, h: 44, color: "rgb(79,216,196)", text: "HOTEL", vertical: true });
  out.neons.push({ x: 336, y: 160, w: 34, h: 9, color: "rgb(232,168,73)", text: "JAZZ" });

  // pavement, road, lamps
  sidewalk(ctx, mood, ground, 6);
  road(ctx, mood, weather, rnd, ground + 6, 252);
  streetLamp(ctx, 154, ground, mood, out, { dir: 1 });
  streetLamp(ctx, 330, ground, mood, out);
  car(ctx, 204, ground - 6, { color: "#141a26", dir: 1 });
  out.smoke.push({ x: 290, y: 250, kind: "steam" });
  ctx.fillStyle = "#05070b";
  ctx.fillRect(284, 249, 12, 2);
  if (isWet(weather)) {
    puddle(ctx, 60, 248, 26, mood);
    puddle(ctx, 360, 258, 34, mood);
  }
  out.roads.push({ y: 260, scale: 1.1, every: 7 });
  out.walks.push({ y: ground + 4, scale: 1, every: 7 });
};

/* ------------------------------------------------------------------ */
/* harbor & docks                                                      */
/* ------------------------------------------------------------------ */

/** Sky, far shore and open water. Returns nothing; leaves the foreground to the caller. */
function harborBase(
  ctx: CanvasRenderingContext2D,
  mood: Mood,
  weather: Weather,
  rnd: () => number,
  out: PaintedScene,
  horizon: number,
  waterBottom: number
) {
  out.horizon = horizon;
  outdoorSky(ctx, mood, weather, rnd, horizon, { moonX: 80, moonY: 40, glow: 0.12 });
  // far shore: low hills, a few lights
  const shore = mix(mood.far, mood.haze, 0.35);
  ctx.fillStyle = shore;
  ctx.fillRect(0, horizon - 6, SCENE_W, 6);
  for (let x = 0; x < SCENE_W; x += 18 + Math.floor(rnd() * 24)) {
    const hh = 3 + Math.floor(rnd() * 9);
    ctx.fillStyle = shore;
    ctx.fillRect(x, horizon - 6 - hh, 8 + Math.floor(rnd() * 14), hh);
    if (rnd() < 0.7) {
      ctx.fillStyle = mix(mood.window, shore, 0.35);
      ctx.fillRect(x + 2, horizon - 5 - Math.floor(rnd() * hh), 1, 1);
    }
  }
  // the water
  vGradient(ctx, 0, horizon, SCENE_W, waterBottom - horizon, [mix(mood.skyBottom, "#0c1420", 0.55), "#070b12"], 8);
  waterReflection(ctx, horizon, waterBottom, "#070b12", rnd, { squash: 0.35, strength: 0.55, amp: 1.6 });
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = rnd() < 0.4 ? rgba(mood.glow, 0.1) : rgba("#b4c8dc", 0.07);
    ctx.fillRect(Math.floor(rnd() * SCENE_W), horizon + 3 + Math.floor(rnd() * (waterBottom - horizon - 3)), 2 + Math.floor(rnd() * 5), 1);
  }
  // buoys
  out.blinkers.push({ x: 236, y: horizon + 8, color: "#4fd88a", period: 3, phase: 0.2, duty: 0.3 });
  out.blinkers.push({ x: 420, y: horizon + 14, color: "#ff4a4a", period: 3.4, phase: 0.7, duty: 0.3 });
}

function ship(ctx: CanvasRenderingContext2D, mood: Mood, out: PaintedScene, rnd: () => number, x: number, waterline: number) {
  const hull = "#060910";
  ctx.fillStyle = hull;
  ctx.fillRect(x, waterline - 26, 150, 26);
  ctx.beginPath();
  ctx.moveTo(x + 150, waterline - 26);
  ctx.lineTo(x + 168, waterline - 14);
  ctx.lineTo(x + 150, waterline);
  ctx.fill();
  ctx.fillRect(x + 26, waterline - 48, 24, 22); // bridge
  ctx.fillRect(x + 60, waterline - 40, 44, 14);
  ctx.fillRect(x + 32, waterline - 62, 5, 14); // funnel
  ctx.fillStyle = "#3a1418";
  ctx.fillRect(x + 32, waterline - 58, 5, 2);
  ctx.fillStyle = hull;
  ctx.fillRect(x + 120, waterline - 66, 1, 40); // mast
  ctx.fillRect(x + 112, waterline - 56, 17, 1);
  ctx.fillStyle = shade(hull, 2.4);
  ctx.fillRect(x, waterline - 26, 150, 1);
  for (let i = 0; i < 6; i++) {
    if (rnd() < 0.3) continue;
    const px = x + 12 + i * 22;
    ctx.fillStyle = mood.window;
    ctx.fillRect(px, waterline - 18, 2, 2);
    out.lights.push({ x: px, y: waterline - 18, w: 2, h: 2, color: mood.window, flicker: 0.2 });
    waterStreak(ctx, px, waterline, 2, 22, mood.window, rnd, 0.22);
  }
  ctx.fillStyle = mood.window;
  ctx.fillRect(x + 30, waterline - 44, 16, 3);
  out.lights.push({ x: x + 30, y: waterline - 44, w: 16, h: 3, color: mood.window, flicker: 0.05 });
  out.smoke.push({ x: x + 34, y: waterline - 63 });
  out.blinkers.push({ x: x + 120, y: waterline - 67, color: "#ffffff", period: 2, phase: 0.4, duty: 0.15 });
  out.blinkers.push({ x: x + 166, y: waterline - 15, color: "#ff4a4a", period: 1.6, phase: 0.1, duty: 0.5 });
  out.blinkers.push({ x: x + 2, y: waterline - 24, color: "#4fd88a", period: 1.6, phase: 0.6, duty: 0.5 });
}

function gantryCrane(ctx: CanvasRenderingContext2D, out: PaintedScene, x: number, ground: number, h: number, reach: number) {
  const iron = "#05080e";
  ctx.fillStyle = iron;
  ctx.fillRect(x, ground - h, 4, h);
  ctx.fillRect(x + 26, ground - h, 4, h);
  for (let y = ground - h + 6; y < ground - 8; y += 12) {
    for (let i = 0; i < 26; i++) ctx.fillRect(x + 4 + i, y + Math.floor((i / 26) * 10), 1, 1);
  }
  ctx.fillRect(x - 10, ground - h - 6, reach + 20, 5);
  for (let i = 0; i < reach; i += 6) ctx.fillRect(x - 6 + i, ground - h - 1, 1, 3);
  ctx.fillRect(x + reach - 14, ground - h - 1, 1, 30);
  ctx.fillRect(x + reach - 19, ground - h + 29, 11, 6);
  out.blinkers.push({ x: x + 1, y: ground - h - 7, color: "#ff4a4a", period: 1.8, phase: 0.3, duty: 0.25 });
  out.blinkers.push({ x: x + reach + 8, y: ground - h - 7, color: "#ff4a4a", period: 1.8, phase: 0.8, duty: 0.25 });
}

const CONTAINER_COLORS = ["#6e2c24", "#2a5a5e", "#8a6a28", "#3a4a6a", "#5a2a3e", "#4a5a3a"];

function containers(ctx: CanvasRenderingContext2D, rnd: () => number, mood: Mood, x0: number, x1: number, ground: number, maxStack: number) {
  let x = x0;
  while (x < x1) {
    const w = rnd() < 0.5 ? 26 : 40;
    const stack = 1 + Math.floor(rnd() * maxStack);
    for (let s = 0; s < stack; s++) {
      const base = CONTAINER_COLORS[Math.floor(rnd() * CONTAINER_COLORS.length)];
      const c = mix(base, mood.near, 0.45);
      const y = ground - (s + 1) * 13;
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, 12);
      ctx.fillStyle = shade(c, 0.7);
      for (let i = 2; i < w - 1; i += 3) ctx.fillRect(x + i, y + 2, 1, 9);
      ctx.fillStyle = shade(c, 1.4);
      ctx.fillRect(x, y, w, 1);
      ctx.fillStyle = shade(c, 0.5);
      ctx.fillRect(x, y + 12, w, 1);
      ctx.fillRect(x + w - 1, y, 1, 12);
    }
    x += w + 2;
  }
}

export const paintHarbor: Painter = (ctx, mood, weather, rnd, out) => {
  // The seawall runs from far left to near right; water above it, quay below.
  const horizon = 128;
  const wallY = (x: number) => Math.round(142 + x * 0.17);
  harborBase(ctx, mood, weather, rnd, out, horizon, 232);

  // the lighthouse on the point, sweeping the fog
  const lx = 22;
  ctx.fillStyle = mix(mood.far, mood.haze, 0.3);
  ctx.fillRect(0, horizon - 8, 64, 8);
  ctx.fillStyle = "#c8c2b2";
  ctx.fillRect(lx, horizon - 38, 6, 30);
  ctx.fillStyle = "#8a2c2c";
  for (let y = horizon - 34; y < horizon - 8; y += 8) ctx.fillRect(lx, y, 6, 3);
  ctx.fillStyle = "#06080c";
  ctx.fillRect(lx - 1, horizon - 44, 8, 6);
  ctx.fillStyle = "#fff2c8";
  ctx.fillRect(lx + 1, horizon - 43, 4, 3);
  out.lights.push({ x: lx + 1, y: horizon - 43, w: 4, h: 3, color: "#fff2c8", flicker: 0.02, glow: 3 });
  out.sweeps.push({
    x: lx + 3, y: horizon - 42, color: "#fff2c8", length: 280, spread: 0.07, speed: 0.5,
    from: -0.45, to: 0.4, alpha: weather.kind === "fog" ? 0.16 : 0.08,
  });

  ship(ctx, mood, out, rnd, 300, 176);

  // fishing boats tied up along the wall
  for (const bx of [150, 226]) {
    const wl = wallY(bx + 20) - 3;
    ctx.fillStyle = "#070a10";
    ctx.fillRect(bx, wl - 6, 38, 6);
    ctx.fillRect(bx + 4, wl, 30, 2);
    ctx.fillRect(bx + 12, wl - 13, 10, 7);
    ctx.fillRect(bx + 18, wl - 32, 1, 26);
    ctx.fillRect(bx + 10, wl - 26, 16, 1);
    ctx.fillStyle = mood.window;
    ctx.fillRect(bx + 14, wl - 11, 2, 2);
    out.lights.push({ x: bx + 14, y: wl - 11, w: 2, h: 2, color: mood.window, flicker: 0.5 });
    waterStreak(ctx, bx + 14, wl + 1, 2, 9, mood.window, rnd, 0.3);
  }

  // the tide board: a striped gauge post standing in the water
  const tx = 334;
  const tb = wallY(tx);
  ctx.fillStyle = "#0a0c10";
  ctx.fillRect(tx, 108, 6, tb - 108);
  for (let y = 110; y < tb - 2; y += 6) {
    ctx.fillStyle = (y / 6) % 2 < 1 ? "#d8d2c4" : "#1a1c20";
    ctx.fillRect(tx + 1, y, 4, 3);
  }
  ctx.fillStyle = "#c9c2b0";
  ctx.fillRect(tx - 4, 104, 14, 5);
  ctx.fillStyle = "#1a1c20";
  ctx.fillRect(tx - 3, 106, 12, 1);
  out.blinkers.push({ x: tx + 3, y: 102, color: "#e8a849", period: 2.8, phase: 0.5, duty: 0.3 });

  // the seawall itself: granite blocks, thicker as it nears
  const stone = mix("#2c2e32", mood.mid, 0.35);
  for (let x = 0; x < SCENE_W; x++) {
    const y0 = wallY(x);
    const th = 5 + Math.round(x * 0.03);
    for (let i = 0; i < th; i++) {
      const course = Math.floor(i / 4);
      const joint = (x + course * 7) % 14 === 0;
      ctx.fillStyle = i === 0 ? shade(stone, 1.45) : joint || i % 4 === 3 ? shade(stone, 0.7) : stone;
      ctx.fillRect(x, y0 + i, 1, 1);
    }
  }
  // stone steps down to the water, where they brought him up
  for (let i = 0; i < 5; i++) {
    const sx = 188 + i * 2;
    ctx.fillStyle = shade(stone, 1.2 - i * 0.08);
    ctx.fillRect(sx, wallY(sx) - 4 + i * 2, 22 - i * 2, 2);
  }
  ctx.fillStyle = rgba("#e8e2d4", 0.6);
  for (const [cx, w] of [[92, 10], [104, 6], [196, 9]] as [number, number][]) {
    const cy = wallY(cx) + 2;
    ctx.fillRect(cx, cy, w, 1);
    ctx.fillRect(cx, cy, 1, 3);
    ctx.fillRect(cx + w - 1, cy, 1, 2);
  }

  // the quay below the wall: dark wet paving, old rope, a stack of crates
  for (let x = 0; x < SCENE_W; x++) {
    const y0 = wallY(x) + 5 + Math.round(x * 0.03);
    vGradient(ctx, x, y0, 1, SCENE_H - y0, [mix(mood.near, mood.mid, 0.3), shade(mood.near, 0.45)], 5);
  }
  for (let i = 0; i < 160; i++) {
    const x = Math.floor(rnd() * SCENE_W);
    const y = wallY(x) + 10 + Math.floor(rnd() * 120);
    if (y >= SCENE_H) continue;
    ctx.fillStyle = rnd() < 0.5 ? rgba("#000000", 0.18) : rgba(mood.skyBottom, 0.08);
    ctx.fillRect(x, y, 3 + Math.floor(rnd() * 6), 1);
  }
  for (const [cx, cy, cw, ch] of [[14, 214, 26, 20], [40, 222, 18, 12], [18, 196, 20, 18]] as [number, number, number, number][]) {
    ctx.fillStyle = "#241c14";
    ctx.fillRect(cx, cy, cw, ch);
    ctx.fillStyle = "#33281c";
    ctx.fillRect(cx, cy, cw, 1);
    ctx.fillStyle = "#18120c";
    for (let i = 2; i < cw; i += 5) ctx.fillRect(cx + i, cy + 2, 1, ch - 3);
  }
  ctx.fillStyle = "#4a3a24";
  for (let a = 0; a < 3; a++) {
    for (let t = 0; t < Math.PI * 2; t += 0.2) {
      ctx.fillRect(Math.round(86 + Math.cos(t) * (6 - a * 2)), Math.round(244 + Math.sin(t) * (2.5 - a * 0.8)), 1, 1);
    }
  }
  for (const bx of [60, 130, 264, 396]) {
    const by = wallY(bx) + 4;
    ctx.fillStyle = "#05030a";
    ctx.fillRect(bx, by - 6, 6, 8);
    ctx.fillRect(bx + 1, by - 8, 4, 2);
  }
  streetLamp(ctx, 116, wallY(116) + 6, mood, out);
  streetLamp(ctx, 286, wallY(286) + 8, mood, out);
  out.ground = 236;
  out.walks.push({ y: 250, scale: 1.1, minX: 0, maxX: 360, every: 14 });
  if (isWet(weather)) {
    puddle(ctx, 70, 236, 28, mood);
    puddle(ctx, 220, 254, 34, mood);
  }
};

export const paintDocks: Painter = (ctx, mood, weather, rnd, out) => {
  const horizon = 132;
  const pier = 198;
  harborBase(ctx, mood, weather, rnd, out, horizon, pier);
  ship(ctx, mood, out, rnd, 300, 172);

  // the pier deck: tarred planks, oil, weather
  vGradient(ctx, 0, pier, SCENE_W, SCENE_H - pier, [mix(mood.near, mood.mid, 0.3), shade(mood.near, 0.45)], 6);
  ctx.fillStyle = shade(mood.near, 0.5);
  for (let x = 0; x < SCENE_W; x += 12) ctx.fillRect(x, pier, 1, SCENE_H - pier);
  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = rnd() < 0.6 ? rgba("#000000", 0.2) : rgba(mood.skyBottom, 0.07);
    ctx.fillRect(Math.floor(rnd() * SCENE_W), pier + 4 + Math.floor(rnd() * (SCENE_H - pier - 4)), 2 + Math.floor(rnd() * 7), 1);
  }
  ctx.fillStyle = mix(mood.near, mood.skyBottom, 0.3);
  ctx.fillRect(0, pier, SCENE_W, 1);
  ctx.fillStyle = "#2a2c30";
  ctx.fillRect(0, 222, SCENE_W, 1);
  ctx.fillRect(0, 228, SCENE_W, 1);

  // the harbormaster's office: records on every shelf, a view of everything
  building(ctx, {
    x: 14, w: 106, h: 118, ground: pier + 2, color: shade(mood.near, 1.7), litChance: 0, rnd, out, mood, style: "plain", roof: "antenna",
  });
  ctx.fillStyle = mood.window;
  ctx.fillRect(30, 94, 76, 22);
  out.lights.push({ x: 30, y: 94, w: 76, h: 22, color: mood.window, flicker: 0.04, glow: 1.3 });
  ctx.fillStyle = shade(mood.window, 0.55);
  for (let sy = 98; sy < 116; sy += 6) ctx.fillRect(32, sy, 34, 1);
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = ["#5e3a2c", "#3a4a5e", "#6e5a2c", "#4a2c34"][Math.floor(rnd() * 4)];
    ctx.fillRect(33 + (i % 13) * 2 + Math.floor(i / 13) * 0, 95 + Math.floor(i / 13) * 6, 1, 3);
  }
  figure(ctx, 88, 116, { color: shade(mood.window, 0.3), hat: true });
  ctx.fillStyle = "#090b10";
  ctx.fillRect(30, 104, 76, 1);
  ctx.fillRect(67, 94, 1, 22);
  ctx.fillStyle = "#0a0c10";
  ctx.fillRect(34, 128, 66, 7);
  ctx.fillStyle = rgba("#e8e2d4", 0.75);
  drawPixelText(ctx, "HARBORMASTER", 67 - Math.floor(measurePixelText("HARBORMASTER") / 2), 129);
  ctx.fillStyle = "#120c08";
  ctx.fillRect(56, 172, 16, 28);

  gantryCrane(ctx, out, 196, pier, 126, 104);
  ctx.fillStyle = "#2a3038";
  ctx.fillRect(214, 75, 14, 13);
  ctx.fillStyle = "#3a424c";
  ctx.fillRect(214, 75, 14, 1);
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(225, 80, 2, 2);

  // Local 9's union hall, its noticeboard thick with paper
  building(ctx, {
    x: 252, w: 70, h: 108, ground: pier + 6, color: mix("#3a2a24", mood.mid, 0.4), litChance: 0.25, rnd, out, mood, style: "brick",
  });
  ctx.fillStyle = "#2a1e14";
  ctx.fillRect(274, 99, 28, 20);
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = rnd() < 0.5 ? "#d8d2c0" : "#c9b98a";
    ctx.fillRect(276 + Math.floor(rnd() * 20), 101 + Math.floor(rnd() * 13), 6, 5);
  }
  ctx.fillStyle = rgba(mood.window, 0.5);
  ctx.fillRect(274, 96, 28, 1);
  out.lights.push({ x: 280, y: 95, w: 16, h: 1, color: mood.window, flicker: 0.3 });

  // workers' lockers
  for (let i = 0; i < 4; i++) {
    const lx = 346 + i * 14;
    ctx.fillStyle = i === 2 ? "#3c4a56" : "#2c3640";
    ctx.fillRect(lx, 134, 13, 72);
    ctx.fillStyle = "#1a2028";
    ctx.fillRect(lx + 1, 137, 11, 1);
    ctx.fillRect(lx + 1, 139, 11, 1);
    ctx.fillStyle = "#8a97a8";
    ctx.fillRect(lx + 10, 160, 2, 5);
  }
  ctx.fillStyle = "#c9c2b0";
  ctx.fillRect(375, 145, 6, 3);

  // camera pole one — it watches the slipway, when it's working
  ctx.fillStyle = "#06080c";
  ctx.fillRect(423, 62, 2, 146);
  ctx.fillRect(417, 60, 12, 6);
  ctx.fillRect(413, 61, 4, 4);
  out.blinkers.push({ x: 427, y: 61, color: "#ff3a3a", period: 1.2, phase: 0.5, duty: 0.4, size: 1 });

  // the slipway: a ramp cut into the pier edge, down into black water
  ctx.fillStyle = "#14181c";
  ctx.beginPath();
  ctx.moveTo(126, pier - 14);
  ctx.lineTo(166, pier - 14);
  ctx.lineTo(176, pier + 16);
  ctx.lineTo(116, pier + 16);
  ctx.fill();
  ctx.fillStyle = "#1e2c22";
  for (let i = 0; i < 40; i++) ctx.fillRect(122 + Math.floor(rnd() * 50), pier - 12 + Math.floor(rnd() * 26), 2, 1);
  ctx.fillStyle = rgba("#c9c2b0", 0.28);
  for (let y = pier - 12; y < pier + 14; y += 3) ctx.fillRect(140 + Math.floor((y - pier) * 0.15), y, 5, 1);

  containers(ctx, rnd, mood, 404, 480, 262, 2);
  streetLamp(ctx, 186, 230, mood, out, { color: "#f0a050", h: 44 });
  streetLamp(ctx, 336, 232, mood, out, { color: "#f0a050", h: 44 });
  for (const bx of [92, 240, 300]) {
    ctx.fillStyle = "#05030a";
    ctx.fillRect(bx, 224, 7, 8);
    ctx.fillRect(bx + 1, 222, 5, 2);
  }
  out.ground = 232;
  out.walks.push({ y: 244, scale: 1.05, minX: 0, maxX: 400, every: 12 });
  if (isWet(weather)) {
    puddle(ctx, 210, 246, 30, mood);
    puddle(ctx, 320, 258, 22, mood);
  }
};

/* ------------------------------------------------------------------ */
/* Halloway University — gothic stone on the hill                      */
/* ------------------------------------------------------------------ */

export const paintUniversity: Painter = (ctx, mood, weather, rnd, out) => {
  const horizon = 200;
  const lawn = 222;
  out.horizon = horizon;
  out.ground = lawn;
  out.reflective = false;
  outdoorSky(ctx, mood, weather, rnd, horizon, { moonX: 110, moonY: 46 });

  const stoneC = mix("#3a3a40", mood.mid, 0.55);
  // side wings
  building(ctx, { x: 18, w: 90, h: 86, ground: lawn, color: shade(stoneC, 0.85), litChance: 0.32, rnd, out, mood, roof: "peak", style: "brick" });
  building(ctx, { x: 372, w: 90, h: 80, ground: lawn, color: shade(stoneC, 0.85), litChance: 0.32, rnd, out, mood, roof: "peak", style: "brick" });

  // the great hall
  vGradient(ctx, 118, 110, 244, lawn - 110, [mix(stoneC, mood.skyBottom, 0.15), stoneC, shade(stoneC, 0.8)], 6);
  ctx.fillStyle = shade(stoneC, 0.82);
  for (let y = 114; y < lawn; y += 5) {
    const off = ((y - 114) / 5) % 2 ? 6 : 0;
    for (let x = 118 + off; x < 362; x += 12) ctx.fillRect(x, y, 1, 4);
    ctx.fillRect(118, y, 244, 1);
  }
  for (let i = 0; i < 9; i++) {
    const wx = 130 + i * 26;
    const lit = rnd() < 0.65;
    const col = lit ? mood.window : shade(stoneC, 0.55);
    ctx.fillStyle = shade(stoneC, 0.6);
    ctx.fillRect(wx - 1, 145, 10, 27);
    ctx.fillStyle = col;
    ctx.fillRect(wx, 150, 8, 21);
    ctx.fillRect(wx + 1, 148, 6, 2);
    ctx.fillRect(wx + 3, 146, 2, 2);
    ctx.fillStyle = shade(col, 0.6);
    ctx.fillRect(wx + 4, 148, 1, 23);
    ctx.fillRect(wx, 160, 8, 1);
    if (lit) out.lights.push({ x: wx, y: 150, w: 8, h: 21, color: mood.window, flicker: 0.06 });
    // buttress
    ctx.fillStyle = shade(stoneC, 1.12);
    ctx.fillRect(wx + 12, 120, 3, lawn - 120);
  }
  // the upper floor: study carrels, one still burning — Tessa's
  for (let i = 0; i < 12; i++) {
    const wx = 128 + i * 20;
    if (wx > 206 && wx < 270) continue;
    const mine = wx === 288;
    ctx.fillStyle = shade(stoneC, 0.6);
    ctx.fillRect(wx - 1, 121, 9, 14);
    ctx.fillStyle = mine ? "#ffd890" : rnd() < 0.25 ? shade(mood.window, 0.8) : shade(stoneC, 0.5);
    ctx.fillRect(wx, 122, 7, 12);
    if (mine) {
      ctx.fillStyle = "#c9b98a";
      ctx.fillRect(wx + 1, 124, 2, 3);
      ctx.fillRect(wx + 4, 125, 2, 2);
      ctx.fillRect(wx + 2, 129, 3, 2);
      out.lights.push({ x: wx, y: 122, w: 7, h: 12, color: "#ffd890", flicker: 0.1, glow: 1.6 });
    }
  }
  // parapet crenellation
  ctx.fillStyle = stoneC;
  for (let x = 118; x < 362; x += 8) ctx.fillRect(x, 106, 5, 4);
  // the clock tower
  vGradient(ctx, 214, 54, 52, 60, [mix(stoneC, mood.skyBottom, 0.2), stoneC], 5);
  ctx.fillStyle = stoneC;
  for (let i = 0; i < 26; i++) ctx.fillRect(214 + i, 54 - Math.floor(i * 0.9), 52 - i * 2, 1);
  ctx.fillRect(239, 20, 2, 12);
  out.blinkers.push({ x: 239, y: 19, color: "#ff4a4a", period: 2.6, phase: 0.5, duty: 0.2 });
  glow(ctx, 240, 82, 22, mood.window, 0.25);
  ctx.fillStyle = "#f0e2b8";
  for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) if (dx * dx + dy * dy <= 84) ctx.fillRect(240 + dx, 82 + dy, 1, 1);
  ctx.fillStyle = "#3a2c18";
  ctx.fillRect(239, 75, 2, 8);
  ctx.fillRect(240, 81, 6, 2);
  for (let a = 0; a < 12; a++) ctx.fillRect(Math.round(240 + Math.cos((a / 12) * Math.PI * 2) * 8), Math.round(82 + Math.sin((a / 12) * Math.PI * 2) * 8), 1, 1);
  out.lights.push({ x: 231, y: 73, w: 19, h: 19, color: "#f0e2b8", flicker: 0.02, glow: 1.4 });
  // great door
  ctx.fillStyle = "#120c08";
  ctx.fillRect(228, 186, 24, 36);
  ctx.fillRect(231, 182, 18, 4);
  ctx.fillStyle = mix(mood.window, "#120c08", 0.4);
  ctx.fillRect(239, 188, 2, 34);
  // ivy
  for (let i = 0; i < 260; i++) {
    const ix = 118 + Math.floor(rnd() * 90) + (rnd() < 0.5 ? 150 : 0);
    const iy = 130 + Math.floor(rnd() * 90);
    ctx.fillStyle = rnd() < 0.5 ? "#0e1c12" : "#16281a";
    ctx.fillRect(ix, iy, 2, 2);
  }

  // lawn and path
  vGradient(ctx, 0, lawn, SCENE_W, SCENE_H - lawn, ["#122016", "#070c08"], 6);
  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = rnd() < 0.5 ? "#18281a" : "#0a120c";
    ctx.fillRect(Math.floor(rnd() * SCENE_W), lawn + Math.floor(rnd() * (SCENE_H - lawn)), 1, 2);
  }
  ctx.fillStyle = "#1c1a18";
  ctx.beginPath();
  ctx.moveTo(230, lawn);
  ctx.lineTo(250, lawn);
  ctx.lineTo(300, SCENE_H);
  ctx.lineTo(180, SCENE_H);
  ctx.fill();
  // trees: dark crowns with a little moonlight on top
  for (const [tx, tr] of [[62, 15], [150, 12], [334, 13], [420, 16]] as [number, number][]) {
    ctx.fillStyle = "#05080a";
    ctx.fillRect(tx, lawn - 28, 3, 28);
    for (let dy = -tr; dy <= tr; dy++) {
      for (let dx = -tr - 3; dx <= tr + 3; dx++) {
        const d = (dx * dx) / ((tr + 3) * (tr + 3)) + (dy * dy) / (tr * tr);
        if (d > 1 + (rnd() - 0.5) * 0.25) continue;
        ctx.fillStyle = dy < -tr * 0.5 && rnd() < 0.4 ? "#162418" : "#070c09";
        ctx.fillRect(tx + 1 + dx, lawn - 34 + dy, 1, 1);
      }
    }
  }
  streetLamp(ctx, 206, lawn + 4, mood, out, { dir: 1 });
  streetLamp(ctx, 274, lawn + 4, mood, out);
  out.walks.push({ y: 246, scale: 1, every: 16 });
};

/* ------------------------------------------------------------------ */
/* forest & mountain road                                              */
/* ------------------------------------------------------------------ */

export const paintForest: Painter = (ctx, mood, weather, rnd, out) => {
  const horizon = 180;
  out.horizon = horizon;
  out.ground = 214;
  out.reflective = false;
  outdoorSky(ctx, mood, weather, rnd, horizon, { moonX: 350, moonY: 50, glow: 0.05 });

  // mountain ridges, each nearer one darker and sharper
  const n = valueNoise(rnd);
  const ridges: [number, number, string][] = [
    [118, 40, mix(mood.far, mood.haze, 0.5)],
    [146, 34, mix(mood.far, "#141e24", 0.45)],
  ];
  ridges.forEach(([base, amp, col], li) => {
    ctx.fillStyle = col;
    for (let x = 0; x < SCENE_W; x++) {
      const y = Math.round(base - fbm(n, x / 60 + li * 7, li * 3, 4) * amp);
      ctx.fillRect(x, y, 1, SCENE_H - y);
    }
  });
  // mist pooled in the valley
  const mist = ctx.createLinearGradient(0, 150, 0, 196);
  mist.addColorStop(0, rgba(mood.haze, 0));
  mist.addColorStop(0.6, rgba(mood.haze, weather.kind === "fog" ? 0.5 : 0.28));
  mist.addColorStop(1, rgba(mood.haze, 0));
  ctx.fillStyle = mist;
  ctx.fillRect(0, 150, SCENE_W, 46);

  // pines, three ranks deep
  const ranks: [number, string, number][] = [
    [196, mix("#0e1a16", mood.haze, 0.35), 24],
    [222, "#0a1410", 32],
    [262, "#050b08", 46],
  ];
  for (const [yBase, color, size] of ranks) {
    ctx.fillStyle = color;
    ctx.fillRect(0, yBase, SCENE_W, SCENE_H - yBase);
    for (let x = -10; x < SCENE_W + 10; x += 9 + Math.floor(rnd() * 10)) {
      const h = size + rnd() * size * 0.6;
      const tiers = 4 + Math.floor(rnd() * 2);
      for (let i = 0; i < h; i++) {
        const t = i / h;
        const tierT = (t * tiers) % 1;
        const wv = 1 + t * size * 0.42 * (0.55 + tierT * 0.45);
        ctx.fillRect(Math.round(x - wv / 2), Math.round(yBase - h + i), Math.max(1, Math.round(wv)), 1);
      }
      ctx.fillRect(x - 1, yBase - 3, 2, 4);
    }
  }

  // Mirror Pass Road, guard rail and all
  ctx.fillStyle = "#11151b";
  ctx.beginPath();
  ctx.moveTo(176, SCENE_H);
  ctx.quadraticCurveTo(236, 232, 300, 214);
  ctx.lineTo(332, 214);
  ctx.quadraticCurveTo(262, 238, 252, SCENE_H);
  ctx.fill();
  ctx.fillStyle = rgba("#e8e2d4", 0.24);
  for (const [px, py] of [[238, 252], [256, 236], [278, 224], [298, 217]] as [number, number][]) ctx.fillRect(px, py, 3, 1);
  ctx.fillStyle = "#6a6e74";
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const px = Math.round(334 - t * 76 + t * t * 20);
    const py = Math.round(212 + t * t * 56);
    ctx.fillRect(px, py - 3, 1, 3);
    ctx.fillRect(px, py - 3, 5, 1);
  }
  // a lone car, headlights cutting the dark
  car(ctx, 286, 216, { color: "#0a0d12", dir: 1, lit: true, scale: 0.8 });
  out.lights.push({ x: 309, y: 210, w: 2, h: 2, color: "#ffe6b4", flicker: 0.02, glow: 3 });
  out.beams.push({ pts: [[310, 209], [311, 213], [372, 222], [372, 196]], color: "#ffe6b4", alpha: 0.12 });
  pool(ctx, 340, 216, 30, "#ffe6b4", 0.22);
};

/* ------------------------------------------------------------------ */
/* industrial zone — the cannery, the storage yards                    */
/* ------------------------------------------------------------------ */

export const paintWarehouse: Painter = (ctx, mood, weather, rnd, out) => {
  const horizon = 150;
  const yard = 222;
  out.horizon = horizon;
  out.ground = yard;
  outdoorSky(ctx, mood, weather, rnd, horizon, { glow: 0.2 });

  // smokestacks against the glow
  for (const [sx, sh] of [[40, 96], [70, 70], [446, 108]] as [number, number][]) {
    const c = mix(mood.far, mood.haze, 0.25);
    ctx.fillStyle = c;
    ctx.fillRect(sx, horizon - sh, 12, sh);
    ctx.fillRect(sx - 2, horizon - sh, 16, 3);
    ctx.fillStyle = shade(c, 0.75);
    for (let y = horizon - sh + 10; y < horizon; y += 12) ctx.fillRect(sx, y, 12, 1);
    out.blinkers.push({ x: sx + 6, y: horizon - sh - 1, color: "#ff4a4a", period: 2 + rnd(), phase: rnd(), duty: 0.2 });
    out.smoke.push({ x: sx + 6, y: horizon - sh - 2 });
  }
  ctx.fillStyle = mix(mood.far, mood.haze, 0.3);
  ctx.fillRect(0, horizon - 8, SCENE_W, 8);

  // the shed: sawtooth roof, corrugated skin, a sign nobody repainted
  const shed = mood.mid;
  const top = 84;
  vGradient(ctx, 100, top, 330, yard - top, [mix(shed, mood.skyBottom, 0.15), shed, shade(shed, 0.85)], 6);
  for (let i = 0; i < 7; i++) {
    const tx = 100 + i * 47;
    ctx.fillStyle = shed;
    for (let j = 0; j < 14; j++) ctx.fillRect(tx + j * 3, top - j, 3, j);
    ctx.fillStyle = rgba(mood.windowCool, 0.16);
    ctx.fillRect(tx + 42, top - 13, 4, 13);
  }
  ctx.fillStyle = shade(shed, 0.78);
  for (let x = 102; x < 430; x += 4) ctx.fillRect(x, top + 4, 1, yard - top - 6);
  ctx.fillStyle = rgba("#d8cfb8", 0.3);
  drawPixelText(ctx, "VEILPORT CANNING CO.", 250 - Math.floor(measurePixelText("VEILPORT CANNING CO.") / 2), top + 8);
  for (let i = 0; i < 11; i++) {
    const wx = 116 + i * 28;
    if (wx > 196 && wx < 290) continue;
    ctx.fillStyle = "#0b0e14";
    ctx.fillRect(wx, 104, 14, 11);
    ctx.fillStyle = rnd() < 0.5 ? rgba(mood.windowCool, 0.28) : rgba(mood.window, 0.2);
    ctx.fillRect(wx + 1, 105, 6, 4);
    ctx.fillRect(wx + 8, 110, 5, 4);
  }
  // a boxing poster, peeling — Friday's fight, long gone
  ctx.fillStyle = "#b8a882";
  ctx.fillRect(394, 86, 20, 26);
  ctx.fillStyle = "#8a2c2c";
  ctx.fillRect(396, 88, 16, 6);
  ctx.fillStyle = "#3a3028";
  ctx.fillRect(398, 97, 12, 2);
  ctx.fillRect(398, 101, 9, 1);
  ctx.fillRect(398, 104, 12, 1);
  ctx.fillStyle = shed;
  ctx.fillRect(410, 108, 4, 4);

  // the loading door, rolled up: light spilling out across the wet yard
  ctx.fillStyle = "#06080c";
  ctx.fillRect(208, 124, 66, 98);
  ctx.fillStyle = shade(shed, 0.6);
  for (let y = 124; y < 138; y += 3) ctx.fillRect(208, y, 66, 2);
  vGradient(ctx, 212, 138, 58, 84, ["#3a2614", "#5a3a1c", "#2a1a0e"], 6);
  ctx.fillStyle = "#1a120a";
  ctx.fillRect(216, 140, 4, 82);
  ctx.fillRect(260, 140, 4, 82);
  for (let sy = 142; sy < 214; sy += 12) ctx.fillRect(220, sy, 40, 2);
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = ["#6e5a3a", "#8a7a5a", "#4a3a2a"][Math.floor(rnd() * 3)];
    ctx.fillRect(222 + Math.floor(rnd() * 34), 134 + Math.floor(rnd() * 6) * 12, 5, 7);
  }
  // the makeshift table: a drum, a plank, cards and slips
  ctx.fillStyle = "#1a1c20";
  ctx.fillRect(232, 160, 16, 20);
  ctx.fillStyle = "#3a2c1e";
  ctx.fillRect(226, 156, 28, 3);
  ctx.fillStyle = "#d8d2c0";
  ctx.fillRect(232, 154, 4, 2);
  ctx.fillRect(240, 155, 5, 1);
  pendant(ctx, 240, 140, mood, out, { width: 9, cone: 20, top: 124 });
  out.beams.push({ pts: [[210, 222], [272, 222], [300, 270], [186, 270]], color: "#e8a849", alpha: 0.08, motes: true });

  // crates stacked high against the wall
  for (const [cx, cy, cw, ch] of [[340, 150, 30, 24], [344, 174, 26, 24], [340, 198, 32, 24], [372, 190, 18, 32], [58, 204, 22, 18], [80, 212, 16, 10]] as [number, number, number, number][]) {
    ctx.fillStyle = "#2a2016";
    ctx.fillRect(cx, cy, cw, ch);
    ctx.fillStyle = "#3a2c1e";
    ctx.fillRect(cx, cy, cw, 1);
    ctx.fillStyle = "#1c150e";
    ctx.fillRect(cx + 2, cy + 2, cw - 4, 1);
    ctx.fillRect(cx + 2, cy + ch - 3, cw - 4, 1);
    for (let i = 0; i < cw; i += 5) ctx.fillRect(cx + i, cy + 2, 1, ch - 4);
  }
  ctx.fillStyle = "#c9b98a";
  ctx.fillRect(352, 154, 8, 4);
  ctx.fillStyle = "#8a2c2c";
  ctx.fillRect(354, 155, 4, 1);

  // the yard
  vGradient(ctx, 0, yard, SCENE_W, SCENE_H - yard, [mix(mood.near, mood.mid, 0.5), shade(mood.near, 0.7)], 6);
  ctx.fillStyle = "#24262a";
  ctx.fillRect(0, 252, SCENE_W, 1);
  ctx.fillRect(0, 262, SCENE_W, 1);
  for (let x = 0; x < SCENE_W; x += 7) {
    ctx.fillStyle = "#1a140e";
    ctx.fillRect(x, 251, 3, 13);
  }
  // the oil-drum fire, and the man who keeps it
  ctx.fillStyle = "#1a1c20";
  ctx.fillRect(146, 208, 12, 14);
  ctx.fillStyle = "#2c2e34";
  ctx.fillRect(146, 211, 12, 1);
  ctx.fillRect(146, 217, 12, 1);
  ctx.fillStyle = "#e86a2a";
  ctx.fillRect(147, 204, 10, 4);
  ctx.fillStyle = "#ffc46b";
  ctx.fillRect(149, 201, 3, 4);
  ctx.fillRect(153, 202, 2, 3);
  out.lights.push({ x: 147, y: 201, w: 10, h: 6, color: "#ff8a3a", flicker: 0.95, glow: 3.2 });
  out.smoke.push({ x: 151, y: 199 });
  pool(ctx, 152, 222, 34, "#ff8a3a", 0.3);
  figure(ctx, 166, 222, { color: "#08090c", hat: true });

  // the fence
  ctx.fillStyle = "#05070c";
  for (let x = 0; x < SCENE_W; x += 32) {
    if (x > 96 && x < 432) continue;
    ctx.fillRect(x, 186, 2, 38);
  }
  ctx.fillStyle = rgba("#8a97a8", 0.16);
  for (let y = 187; y < 222; y += 3) {
    for (let x = y % 6 === 1 ? 0 : 2; x < SCENE_W; x += 4) {
      if (x > 96 && x < 432) continue;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  streetLamp(ctx, 316, yard, mood, out, { color: "#f0a050", h: 46 });
  out.walks.push({ y: 240, scale: 1, every: 18 });
  if (isWet(weather)) {
    puddle(ctx, 104, 236, 30, mood);
    puddle(ctx, 400, 244, 24, mood);
  }
};

/** Rain sheen along the ground line — called by paintScene for wet exteriors. */
export function wetSheen(ctx: CanvasRenderingContext2D, mood: Mood, ground: number, rnd: () => number) {
  for (let i = 0; i < 50; i++) {
    const y = ground + 2 + Math.floor(rnd() * (SCENE_H - ground - 2));
    const fall = smooth(0, 1, (y - ground) / (SCENE_H - ground));
    ctx.fillStyle = rgba(mood.windowCool, 0.05 + 0.05 * fall);
    ctx.fillRect(Math.floor(rnd() * SCENE_W), y, 3 + Math.floor(rnd() * 8), 1);
  }
}
