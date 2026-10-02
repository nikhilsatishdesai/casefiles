import { SCENE_W, SCENE_H, type Painter, type PaintedScene } from "./types";
import {
  building,
  car,
  deskLamp,
  figure,
  glassWindow,
  glow,
  mix,
  pendant,
  pool,
  rgba,
  room,
  roomVignette,
  shade,
  vGradient,
} from "./primitives";
import { drawPixelText, measurePixelText } from "./pixelfont";

/* ------------------------------------------------------------------ */
/* furniture                                                           */
/* ------------------------------------------------------------------ */

/** A desk seen from the front: top, apron, legs. `top` is the desktop line. */
function desk(ctx: CanvasRenderingContext2D, x: number, top: number, w: number, floor: number, wood = "#2c2014") {
  ctx.fillStyle = shade(wood, 1.35);
  ctx.fillRect(x, top, w, 1);
  ctx.fillStyle = wood;
  ctx.fillRect(x, top + 1, w, 5);
  ctx.fillStyle = shade(wood, 0.7);
  ctx.fillRect(x, top + 6, w, 1);
  ctx.fillStyle = shade(wood, 0.82);
  ctx.fillRect(x + 3, top + 7, 6, floor - top - 7);
  ctx.fillRect(x + w - 9, top + 7, 6, floor - top - 7);
  ctx.fillStyle = shade(wood, 0.92);
  ctx.fillRect(x + w - 26, top + 7, 16, 12);
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(x + w - 19, top + 12, 3, 1);
}

function typewriter(ctx: CanvasRenderingContext2D, x: number, top: number) {
  ctx.fillStyle = "#0a0c10";
  ctx.fillRect(x, top - 9, 22, 9);
  ctx.fillRect(x + 2, top - 12, 18, 3);
  ctx.fillStyle = "#2a2e36";
  ctx.fillRect(x + 1, top - 8, 20, 1);
  ctx.fillStyle = "#d8d2c0";
  ctx.fillRect(x + 5, top - 17, 12, 5);
  ctx.fillStyle = "#8a8478";
  ctx.fillRect(x + 6, top - 15, 9, 1);
  ctx.fillStyle = "#3a3e46";
  for (let i = 0; i < 6; i++) ctx.fillRect(x + 3 + i * 3, top - 4, 2, 1);
}

function papers(ctx: CanvasRenderingContext2D, rnd: () => number, x: number, top: number, n = 3) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = rnd() < 0.5 ? "#d8d2c0" : "#c9b98a";
    ctx.fillRect(x + i * 3 + Math.floor(rnd() * 3), top - 2 - i, 14, 2);
  }
}

function chair(ctx: CanvasRenderingContext2D, x: number, floor: number, c = "#1a1410") {
  ctx.fillStyle = c;
  ctx.fillRect(x, floor - 18, 16, 3);
  ctx.fillRect(x + 2, floor - 34, 12, 16);
  ctx.fillStyle = shade(c, 1.4);
  ctx.fillRect(x + 2, floor - 34, 12, 1);
  ctx.fillStyle = c;
  ctx.fillRect(x + 2, floor - 15, 2, 15);
  ctx.fillRect(x + 12, floor - 15, 2, 15);
}

function cabinet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, drawers: number, c = "#2a3040") {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = shade(c, 1.3);
  ctx.fillRect(x, y, w, 1);
  const dh = Math.floor((h - 4) / drawers);
  for (let d = 0; d < drawers; d++) {
    ctx.fillStyle = shade(c, 0.82);
    ctx.fillRect(x + 3, y + 3 + d * dh, w - 6, dh - 3);
    ctx.fillStyle = "#8a97a8";
    ctx.fillRect(x + Math.floor(w / 2) - 4, y + 3 + d * dh + Math.floor(dh / 2) - 1, 8, 2);
  }
}

function wallClock(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, face = "#e8e2d4") {
  ctx.fillStyle = "#0a0c10";
  for (let dy = -r - 1; dy <= r + 1; dy++) for (let dx = -r - 1; dx <= r + 1; dx++) if (dx * dx + dy * dy <= (r + 1) * (r + 1)) ctx.fillRect(x + dx, y + dy, 1, 1);
  ctx.fillStyle = face;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) ctx.fillRect(x + dx, y + dy, 1, 1);
  ctx.fillStyle = "#3a3430";
  for (let a = 0; a < 12; a++) ctx.fillRect(Math.round(x + Math.cos((a / 12) * Math.PI * 2) * (r - 2)), Math.round(y + Math.sin((a / 12) * Math.PI * 2) * (r - 2)), 1, 1);
  ctx.fillStyle = "#12100c";
  ctx.fillRect(x, y - r + 3, 1, r - 2);
  ctx.fillRect(x, y, Math.max(2, r - 4), 1);
}

function corkboard(ctx: CanvasRenderingContext2D, rnd: () => number, x: number, y: number, w: number, h: number, string = true) {
  ctx.fillStyle = "#3a2c1c";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#5a4430";
  ctx.fillRect(x, y, w, 1);
  vGradient(ctx, x + 3, y + 3, w - 6, h - 6, ["#3a2a18", "#2a1e12"], 4);
  const pins: [number, number][] = [];
  for (let i = 0; i < Math.floor((w * h) / 520); i++) {
    const px = x + 6 + Math.floor(rnd() * (w - 22));
    const py = y + 6 + Math.floor(rnd() * (h - 18));
    ctx.fillStyle = rnd() < 0.3 ? "#9aa4b0" : rnd() < 0.5 ? "#e8e2d4" : "#c9c2b0";
    ctx.fillRect(px, py, 11, 8);
    ctx.fillStyle = "#6a6458";
    ctx.fillRect(px + 2, py + 2, 6, 1);
    ctx.fillRect(px + 2, py + 4, 4, 1);
    ctx.fillStyle = "#e05c6e";
    ctx.fillRect(px + 5, py, 1, 1);
    pins.push([px + 5, py]);
  }
  if (string && pins.length > 2) {
    ctx.strokeStyle = "rgba(224,92,110,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pins[0][0] + 0.5, pins[0][1] + 0.5);
    for (const [px, py] of pins.slice(1, 4)) ctx.lineTo(px + 0.5, py + 0.5);
    ctx.stroke();
  }
}

/** Mirror-reversed lettering, as read from inside a frosted-glass door. */
function reversedText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, color: string) {
  const w = measurePixelText(text);
  ctx.save();
  ctx.translate(cx + Math.ceil(w / 2), y);
  ctx.scale(-1, 1);
  ctx.fillStyle = color;
  drawPixelText(ctx, text, 0, 0);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Precinct Seven — the detectives' floor                              */
/* ------------------------------------------------------------------ */

export const paintPrecinct: Painter = (ctx, mood, weather, rnd, out) => {
  room(ctx, rnd, out, { wall: "#1e2532", floor: "#1c1610", wainscot: "#161b26" });
  const fy = 190;
  glassWindow(ctx, { x: 18, y: 30, w: 64, h: 104 }, mood, weather, rnd, out, { beam: { floorY: fy, dx: 26 } });
  glassWindow(ctx, { x: 404, y: 30, w: 60, h: 98 }, mood, weather, rnd, out, { beam: { floorY: fy, dx: -30 } });
  wallClock(ctx, 300, 40, 10);
  glow(ctx, 300, 40, 18, "#e8e2d4", 0.06);
  corkboard(ctx, rnd, 130, 34, 84, 56);
  ctx.fillStyle = "#0a0c10";
  ctx.fillRect(130, 26, 84, 7);
  ctx.fillStyle = rgba("#e8e2d4", 0.6);
  drawPixelText(ctx, "HOMICIDE", 172 - Math.floor(measurePixelText("HOMICIDE") / 2), 27);

  // the registry terminal: a teletype on its own cabinet, screen aglow
  cabinet(ctx, 222, 124, 36, 66, 3, "#2a3040");
  ctx.fillStyle = "#14181e";
  ctx.fillRect(224, 96, 32, 28);
  ctx.fillStyle = "#0a2a22";
  ctx.fillRect(228, 100, 24, 15);
  ctx.fillStyle = "#4fd8a4";
  for (let i = 0; i < 5; i++) ctx.fillRect(230, 102 + i * 3, 6 + Math.floor(rnd() * 14), 1);
  out.lights.push({ x: 228, y: 100, w: 24, h: 15, color: "#4fd8a4", flicker: 0.1, glow: 1.3 });
  ctx.fillStyle = "#2a2e36";
  ctx.fillRect(226, 118, 28, 5);

  // records desk against the back wall, left
  desk(ctx, 52, 162, 92, fy);
  papers(ctx, rnd, 60, 162, 4);
  ctx.fillStyle = "#c9b98a";
  for (let i = 0; i < 4; i++) ctx.fillRect(96 + i * 7, 150 + (i % 2) * 2, 6, 12 - (i % 2) * 2);
  deskLamp(ctx, 132, 162, mood, out, -1);
  // the forensics light table: a slab of cold white light
  ctx.fillStyle = "#1a1e26";
  ctx.fillRect(326, 140, 64, 6);
  ctx.fillRect(330, 146, 5, 44);
  ctx.fillRect(381, 146, 5, 44);
  ctx.fillStyle = "#dff2f8";
  ctx.fillRect(328, 136, 60, 4);
  out.lights.push({ x: 328, y: 136, w: 60, h: 4, color: "#dff2f8", flicker: 0.04, glow: 1.4 });
  out.beams.push({ pts: [[328, 136], [388, 136], [400, 110], [316, 110]], color: "#dff2f8", alpha: 0.08 });
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = "#8a97a8";
    ctx.fillRect(334 + i * 13, 132, 9, 4);
  }

  // pendants & the detectives' desks in the foreground
  pendant(ctx, 120, 20, mood, out, { cone: 40 });
  pendant(ctx, 240, 26, mood, out, { cone: 44 });
  pendant(ctx, 370, 20, mood, out, { cone: 40 });
  // radiator
  ctx.fillStyle = "#2a3040";
  for (let i = 0; i < 9; i++) ctx.fillRect(152 + i * 4, 166, 3, 22);
  ctx.fillStyle = "#3a4252";
  ctx.fillRect(150, 164, 38, 2);

  desk(ctx, 156, 189, 82, 226, "#2a1e12");
  typewriter(ctx, 176, 189);
  papers(ctx, rnd, 206, 189, 3);
  ctx.fillStyle = "#e8e2d4";
  ctx.fillRect(222, 183, 6, 6);
  out.smoke.push({ x: 225, y: 181, kind: "steam" });
  deskLamp(ctx, 162, 189, mood, out, 1);
  chair(ctx, 186, 252, "#141008");
  desk(ctx, 336, 196, 90, 236, "#261a10");
  typewriter(ctx, 352, 196);
  papers(ctx, rnd, 384, 196, 3);
  deskLamp(ctx, 418, 196, mood, out, -1);
  out.walks.push({ y: 212, scale: 1.25, every: 26 });
  roomVignette(ctx, 0.4);
};

/* ------------------------------------------------------------------ */
/* City Morgue — cold tile and a warm kettle                           */
/* ------------------------------------------------------------------ */

export const paintMorgue: Painter = (ctx, mood, weather, rnd, out) => {
  room(ctx, rnd, out, { wall: "#18242e", floor: "#121a22", floorKind: "tiles" });
  const fy = 190;
  ctx.fillStyle = "rgba(160,210,232,0.06)";
  for (let y = 14; y < fy - 4; y += 10) ctx.fillRect(0, y, SCENE_W, 1);
  for (let x = 0; x < SCENE_W; x += 10) ctx.fillRect(x, 12, 1, fy - 16);

  // cooler doors, six names on six cards
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const dx = 16 + i * 56;
      const dy = 52 + j * 52;
      ctx.fillStyle = "#26323e";
      ctx.fillRect(dx, dy, 50, 46);
      ctx.fillStyle = "#1a242e";
      ctx.fillRect(dx + 3, dy + 3, 44, 40);
      ctx.fillStyle = "#3a4856";
      ctx.fillRect(dx + 3, dy + 3, 44, 1);
      ctx.fillStyle = "#9aa6b4";
      ctx.fillRect(dx + 36, dy + 19, 8, 5);
      ctx.fillStyle = "#d8d2c0";
      ctx.fillRect(dx + 8, dy + 8, 12, 7);
    }
  }

  // the table, the sheet, the shape beneath it
  const tx = 150;
  ctx.fillStyle = "#3a4250";
  ctx.fillRect(tx + 12, 182, 8, 34);
  ctx.fillRect(tx + 120, 182, 8, 34);
  ctx.fillStyle = "#8a97a8";
  ctx.fillRect(tx, 172, 140, 6);
  ctx.fillStyle = "#6a7788";
  ctx.fillRect(tx, 178, 140, 3);
  ctx.fillStyle = "#d8d2c4";
  ctx.fillRect(tx + 6, 162, 128, 10);
  ctx.fillRect(tx + 12, 158, 24, 4);
  ctx.fillRect(tx + 116, 159, 10, 3);
  ctx.fillStyle = "#b8b2a4";
  ctx.fillRect(tx + 6, 170, 128, 2);
  ctx.fillRect(tx + 50, 162, 30, 1);
  ctx.fillStyle = "#c9b98a";
  ctx.fillRect(tx + 130, 168, 4, 6);

  // the surgical lamp — a hard white cone
  ctx.fillStyle = "#05070c";
  ctx.fillRect(219, 12, 2, 24);
  ctx.fillStyle = "#26323e";
  ctx.fillRect(200, 36, 40, 8);
  ctx.fillRect(204, 34, 32, 2);
  ctx.fillStyle = "#eef8fc";
  ctx.fillRect(204, 44, 32, 3);
  out.lights.push({ x: 204, y: 44, w: 32, h: 3, color: "#dff2f8", flicker: 0.04, glow: 2 });
  out.beams.push({ pts: [[204, 47], [236, 47], [300, 168], [140, 168]], color: "#dff2f8", alpha: 0.11, motes: true });
  pool(ctx, 220, 165, 70, "#dff2f8", 0.22);

  // Rook's corner: counter, files, the kettle on its shelf, the radio
  ctx.fillStyle = "#2a2018";
  ctx.fillRect(300, 150, 170, 6);
  ctx.fillStyle = "#3a2c20";
  ctx.fillRect(300, 150, 170, 1);
  ctx.fillStyle = "#1e1812";
  ctx.fillRect(304, 156, 162, 34);
  for (let d = 0; d < 4; d++) {
    ctx.fillStyle = "#2a2018";
    ctx.fillRect(310 + d * 40, 162, 34, 22);
    ctx.fillStyle = "#8a97a8";
    ctx.fillRect(323 + d * 40, 168, 8, 2);
  }
  ctx.fillStyle = "#c9b98a";
  ctx.fillRect(330, 143, 14, 7);
  ctx.fillStyle = "#e8e2d4";
  ctx.fillRect(332, 141, 12, 2);
  ctx.fillStyle = "#3a3e46";
  ctx.fillRect(334, 144, 8, 1);
  ctx.fillRect(334, 146, 6, 1);
  ctx.fillStyle = "#2a2018";
  ctx.fillRect(396, 112, 70, 3);
  ctx.fillStyle = "#9aa6b4";
  ctx.fillRect(414, 102, 14, 10);
  ctx.fillRect(428, 104, 4, 3);
  ctx.fillStyle = "#b8c4d0";
  ctx.fillRect(414, 102, 14, 1);
  out.smoke.push({ x: 418, y: 100, kind: "steam" });
  ctx.fillStyle = "#5a3a22";
  ctx.fillRect(440, 104, 18, 8);
  ctx.fillStyle = "#e8a849";
  ctx.fillRect(444, 106, 6, 2);
  out.lights.push({ x: 444, y: 106, w: 6, h: 2, color: "#e8a849", flicker: 0.1 });
  deskLamp(ctx, 380, 150, mood, out, -1, "#2a3a2a");
  // clipboards
  for (const cx of [140, 162]) {
    ctx.fillStyle = "#c9c2b0";
    ctx.fillRect(cx, 82, 16, 22);
    ctx.fillStyle = "#3a3430";
    ctx.fillRect(cx + 4, 78, 8, 5);
  }
  ctx.fillStyle = "#0c1218";
  ctx.fillRect(214, 230, 12, 3);
  roomVignette(ctx, 0.5);
};

/* ------------------------------------------------------------------ */
/* Hotel Meridian — the Grand Ballroom                                 */
/* ------------------------------------------------------------------ */

export const paintHotel: Painter = (ctx, mood, weather, rnd, out) => {
  room(ctx, rnd, out, { wall: "#2a1c24", floor: "#1e1214", wainscot: "#22161c" });
  const fy = 190;

  // the stage curtain behind the piano
  for (let x = 146; x < 334; x++) {
    const fold = Math.sin(x * 0.55) * 0.5 + 0.5;
    ctx.fillStyle = mix("#3a0e16", "#6e1a26", fold * 0.8);
    ctx.fillRect(x, 14, 1, fy - 18);
  }
  ctx.fillStyle = "#8a6a2a";
  ctx.fillRect(146, 12, 188, 3);
  for (let x = 150; x < 330; x += 8) ctx.fillRect(x, 15, 4, 4);

  // columns with gilded capitals
  for (const cx of [130, 334]) {
    ctx.fillStyle = "#34262e";
    ctx.fillRect(cx, 16, 16, fy - 16);
    ctx.fillStyle = "#463440";
    ctx.fillRect(cx + 2, 16, 3, fy - 16);
    ctx.fillStyle = "#8a6a2a";
    ctx.fillRect(cx - 3, 12, 22, 6);
    ctx.fillRect(cx - 3, fy - 8, 22, 6);
    ctx.fillStyle = "#c9a24a";
    ctx.fillRect(cx - 3, 12, 22, 1);
  }

  // the lobby arch on the left: the security office, the concierge's marble
  ctx.fillStyle = "#120c10";
  ctx.fillRect(8, 60, 110, fy - 60);
  for (let i = 0; i < 18; i++) ctx.fillRect(8 + i * 3, 60 - Math.floor(Math.sin((i / 36) * Math.PI) * 12), 110 - i * 6, 1);
  vGradient(ctx, 12, 62, 102, fy - 62, ["#3a2a1c", "#5a3e22", "#2a1c12"], 6);
  ctx.fillStyle = "#1a2030";
  ctx.fillRect(20, 84, 36, 52);
  ctx.fillStyle = "#3a5a7a";
  ctx.fillRect(24, 90, 28, 18);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 ? "#5a8aaa" : "#7aaac8";
    ctx.fillRect(25 + (i % 2) * 14, 91 + Math.floor(i / 2) * 9, 12, 7);
  }
  out.lights.push({ x: 24, y: 90, w: 28, h: 18, color: "#7aaac8", flicker: 0.3, glow: 1.2 });
  ctx.fillStyle = rgba("#e8e2d4", 0.55);
  drawPixelText(ctx, "SECURITY", 38 - Math.floor(measurePixelText("SECURITY") / 2), 78);
  ctx.fillStyle = "#c8c0b4";
  ctx.fillRect(40, 160, 62, 4);
  ctx.fillStyle = "#a8a094";
  ctx.fillRect(42, 164, 58, 22);
  ctx.fillStyle = "#8a8478";
  ctx.fillRect(42, 172, 58, 1);
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(84, 156, 5, 4);
  ctx.fillRect(86, 155, 1, 1);
  pendant(ctx, 70, 64, mood, out, { width: 9, cone: 22 });

  // chandeliers
  for (const chx of [104, 240, 376]) {
    ctx.fillStyle = "#05070c";
    ctx.fillRect(chx, 0, 1, 16);
    ctx.fillStyle = "#8a7a4a";
    ctx.fillRect(chx - 14, 16, 29, 2);
    ctx.fillRect(chx - 9, 20, 19, 2);
    for (let i = 0; i < 6; i++) {
      const lx = chx - 13 + i * 5;
      ctx.fillStyle = "#ffe2a8";
      ctx.fillRect(lx, 13, 2, 3);
      out.lights.push({ x: lx, y: 13, w: 2, h: 3, color: mood.window, flicker: 0.22, glow: 1.6 });
      ctx.fillStyle = rgba("#e8f4ff", 0.6);
      ctx.fillRect(lx, 22 + (i % 2) * 2, 1, 2);
      if (i % 2 === 0) out.blinkers.push({ x: lx, y: 23 + (i % 2) * 2, color: "#fff4d8", period: 2 + rnd() * 3, phase: rnd(), duty: 0.1 });
    }
  }

  // the tall window, rain on the glass
  glassWindow(ctx, { x: 406, y: 34, w: 56, h: 134 }, mood, weather, rnd, out, { panes: [2, 4], beam: { floorY: fy, dx: -40 } });

  // the green room door
  ctx.fillStyle = "#1a1014";
  ctx.fillRect(356, 94, 36, 96);
  ctx.fillStyle = "#2a1a20";
  ctx.fillRect(359, 97, 30, 90);
  ctx.fillStyle = "#3a2830";
  ctx.fillRect(362, 100, 24, 38);
  ctx.fillRect(362, 142, 24, 42);
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(383, 142, 2, 4);
  ctx.fillRect(367, 112, 14, 4);
  ctx.fillStyle = "#e05c6e";
  ctx.fillRect(386, 132, 2, 2);
  out.blinkers.push({ x: 386, y: 132, color: "#e05c6e", period: 3.2, phase: 0.2, duty: 0.6 });

  // the Bösendorfer under its work light
  ctx.fillStyle = "#08070a";
  ctx.beginPath();
  ctx.moveTo(178, 150);
  ctx.quadraticCurveTo(298, 134, 306, 166);
  ctx.lineTo(296, 182);
  ctx.lineTo(186, 182);
  ctx.fill();
  ctx.fillRect(186, 140, 104, 22);
  ctx.beginPath();
  ctx.moveTo(190, 142);
  ctx.lineTo(286, 100);
  ctx.lineTo(292, 142);
  ctx.fill();
  ctx.fillStyle = "#1e1a1e";
  ctx.fillRect(190, 141, 98, 2);
  ctx.fillStyle = "#2c2830";
  for (let i = 0; i < 9; i++) ctx.fillRect(196 + i * 10, 143 - Math.floor(i * 4.4), 3, 1);
  ctx.fillStyle = "#05070c";
  ctx.fillRect(250, 112, 1, 30);
  ctx.fillStyle = "#e8e2d4";
  ctx.fillRect(190, 155, 74, 5);
  ctx.fillStyle = "#08070a";
  for (let i = 0; i < 21; i++) if (i % 7 !== 2 && i % 7 !== 6) ctx.fillRect(192 + i * 3.5, 155, 1, 3);
  ctx.fillStyle = "#08070a";
  ctx.fillRect(196, 182, 6, 22);
  ctx.fillRect(284, 182, 6, 22);
  ctx.fillRect(206, 196, 44, 5);
  ctx.fillRect(212, 201, 4, 12);
  ctx.fillRect(240, 201, 4, 12);
  // sheet music on the stand, the thermos on the lid
  ctx.fillStyle = "#d8d2c0";
  ctx.fillRect(196, 126, 14, 11);
  ctx.fillStyle = "#8a8478";
  for (let i = 0; i < 4; i++) ctx.fillRect(198, 128 + i * 2, 10, 1);
  ctx.fillStyle = "#08070a";
  ctx.fillRect(201, 137, 4, 4);
  ctx.fillStyle = "#9aa6b4";
  ctx.fillRect(262, 129, 5, 10);
  ctx.fillStyle = "#cfd8e2";
  ctx.fillRect(262, 129, 5, 1);
  ctx.fillRect(263, 130, 1, 8);
  // the work light
  ctx.fillStyle = "#05070c";
  ctx.fillRect(300, 120, 2, 70);
  ctx.fillRect(296, 188, 10, 2);
  ctx.fillRect(292, 116, 12, 4);
  ctx.fillStyle = mix(mood.window, "#ffffff", 0.3);
  ctx.fillRect(293, 120, 9, 1);
  out.lights.push({ x: 293, y: 120, w: 9, h: 1, color: mood.window, flicker: 0.05, glow: 2.6 });
  out.beams.push({ pts: [[292, 121], [302, 121], [270, 160], [196, 160]], color: mood.window, alpha: 0.16, motes: true });
  pool(ctx, 236, 156, 50, mood.window, 0.2);

  // Callas's side table with a folder; the fan-mail basket
  ctx.fillStyle = "#2a1a14";
  ctx.fillRect(304, 148, 30, 3);
  ctx.fillRect(317, 151, 4, 38);
  ctx.fillRect(310, 188, 18, 2);
  ctx.fillStyle = "#c9b98a";
  ctx.fillRect(308, 144, 18, 4);
  ctx.fillStyle = "#8a6a28";
  ctx.fillRect(116, 174, 20, 12);
  ctx.fillStyle = "#a88a48";
  for (let i = 0; i < 20; i += 3) ctx.fillRect(116 + i, 174, 1, 12);
  ctx.fillStyle = "#e8e2d4";
  ctx.fillRect(119, 170, 6, 4);
  ctx.fillRect(126, 171, 6, 3);
  ctx.fillStyle = "#e0b4c0";
  ctx.fillRect(122, 168, 5, 3);

  // concert chairs in rows, the red aisle
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 9; i++) {
      const cx2 = 28 + i * 20 + (i > 4 ? 120 : 0);
      if (cx2 > 460) continue;
      const cy = 218 + r * 16;
      ctx.fillStyle = "#2a1418";
      ctx.fillRect(cx2, cy, 12, 4);
      ctx.fillRect(cx2 + 1, cy - 10, 10, 9);
      ctx.fillStyle = "#8a6a2a";
      ctx.fillRect(cx2 + 1, cy - 10, 10, 1);
    }
  }
  ctx.fillStyle = "#4a1620";
  ctx.beginPath();
  ctx.moveTo(214, fy + 2);
  ctx.lineTo(266, fy + 2);
  ctx.lineTo(296, SCENE_H);
  ctx.lineTo(184, SCENE_H);
  ctx.fill();
  roomVignette(ctx, 0.45);
};

/* ------------------------------------------------------------------ */
/* Veilport Museum — the map room                                      */
/* ------------------------------------------------------------------ */

export const paintMuseum: Painter = (ctx, mood, weather, rnd, out) => {
  room(ctx, rnd, out, { wall: "#241e16", floor: "#1a1409", wainscot: "#1a140c" });
  const fy = 190;

  // the skylight, storm on the glass
  glassWindow(ctx, { x: 384, y: 22, w: 90, h: 44 }, mood, weather, rnd, out, { panes: [4, 2], view: "sky", sill: false, beam: { floorY: fy, dx: -70, alpha: 0.06 } });

  // the maintenance panel, door hanging open
  ctx.fillStyle = "#3a3e44";
  ctx.fillRect(34, 82, 28, 32);
  ctx.fillStyle = "#14181c";
  ctx.fillRect(37, 85, 22, 26);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i === 2 ? "#e05c6e" : "#8a97a8";
    ctx.fillRect(40 + i * 4, 90, 2, 6);
  }
  ctx.fillStyle = "#4a4e54";
  ctx.fillRect(62, 84, 10, 30);
  ctx.fillStyle = "#e8a849";
  ctx.fillRect(41, 104, 14, 3);

  // the Ashford case: Folio VII's frame, empty
  ctx.fillStyle = "#2c2214";
  ctx.fillRect(118, 84, 54, 70);
  ctx.fillStyle = "#8a7a4a";
  ctx.fillRect(118, 84, 54, 2);
  ctx.fillStyle = rgba("#c8dcea", 0.12);
  ctx.fillRect(122, 90, 46, 58);
  ctx.fillStyle = "#c9b98a";
  ctx.fillRect(126, 94, 16, 22);
  ctx.fillRect(148, 94, 16, 22);
  ctx.fillRect(126, 122, 16, 22);
  ctx.fillStyle = "#0e0a06";
  ctx.fillRect(148, 122, 16, 22);
  ctx.fillStyle = "#6a5a3a";
  for (let i = 0; i < 3; i++) ctx.fillRect(128, 100 + i * 4, 12, 1);
  out.lights.push({ x: 122, y: 90, w: 46, h: 2, color: "#e8d8a8", flicker: 0.05 });

  // old charts framed on the walls
  for (const [mx, my] of [[200, 30], [256, 34], [312, 30]] as [number, number][]) {
    ctx.fillStyle = "#5a4a2a";
    ctx.fillRect(mx, my, 44, 32);
    ctx.fillStyle = "#c9b98a";
    ctx.fillRect(mx + 3, my + 3, 38, 26);
    ctx.fillStyle = "#7a6a48";
    for (let i = 0; i < 18; i++) ctx.fillRect(mx + 6 + i * 2, my + 14 + Math.round(Math.sin(i * 0.8 + mx) * 4), 2, 1);
  }

  // map cabinets
  for (const cx of [72, 410] as number[]) {
    ctx.fillStyle = "#2c2214";
    ctx.fillRect(cx, 120, 44, 70);
    for (let d = 0; d < 5; d++) {
      ctx.fillStyle = "#221a10";
      ctx.fillRect(cx + 3, 124 + d * 13, 38, 10);
      ctx.fillStyle = "#8a7a4a";
      ctx.fillRect(cx + 18, 128 + d * 13, 8, 2);
    }
  }

  // Hale's reading table, the green banker's lamp still burning
  ctx.fillStyle = "#241c12";
  ctx.fillRect(288, 140, 84, 6);
  ctx.fillRect(292, 146, 6, 44);
  ctx.fillRect(362, 146, 6, 44);
  papers(ctx, rnd, 300, 140, 4);
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(326, 134, 18, 6);
  ctx.fillStyle = "#0a3826";
  ctx.fillRect(350, 128, 14, 5);
  ctx.fillStyle = "#147a52";
  ctx.fillRect(350, 128, 14, 1);
  ctx.fillStyle = "#05070c";
  ctx.fillRect(356, 133, 2, 7);
  out.lights.push({ x: 351, y: 133, w: 12, h: 1, color: "#4fd8a4", flicker: 0.08, glow: 2.2 });
  out.beams.push({ pts: [[350, 133], [364, 133], [376, 141], [336, 141]], color: "#4fd8a4", alpha: 0.18 });
  pool(ctx, 357, 140, 30, "#4fd8a4", 0.3);

  // the toppled astrolabe, its stand, a chalk outline on the floor
  ctx.strokeStyle = "rgba(232,226,212,0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(176.5, 176.5);
  ctx.lineTo(196.5, 170.5);
  ctx.lineTo(230.5, 172.5);
  ctx.lineTo(244.5, 166.5);
  ctx.lineTo(248.5, 176.5);
  ctx.lineTo(214.5, 182.5);
  ctx.lineTo(186.5, 184.5);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = "#8a7a4a";
  ctx.fillRect(196, 158, 34, 3);
  ctx.strokeStyle = "#a88a48";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(230, 156, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#5a4a2a";
  ctx.fillRect(228, 154, 4, 4);
  // the bronze bookend, the satchel
  ctx.fillStyle = "#8a6a2a";
  ctx.fillRect(390, 176, 8, 6);
  ctx.fillRect(391, 172, 3, 4);
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(390, 176, 8, 1);
  ctx.fillStyle = "#4a3420";
  ctx.fillRect(258, 194, 22, 12);
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(258, 194, 22, 3);
  ctx.fillRect(266, 190, 6, 4);

  // emergency lighting after the blackout
  out.blinkers.push({ x: 2, y: 186, color: "#e05c6e", period: 1.8, phase: 0, duty: 0.5, size: 2 });
  out.blinkers.push({ x: 474, y: 186, color: "#e05c6e", period: 1.8, phase: 0.5, duty: 0.5, size: 2 });
  ctx.fillStyle = "#5a1a22";
  ctx.fillRect(0, 185, 6, 3);
  ctx.fillRect(474, 185, 6, 3);
  roomVignette(ctx, 0.5);
};

/* ------------------------------------------------------------------ */
/* The Blue Hour — Sal's bar                                           */
/* ------------------------------------------------------------------ */

export const paintBar: Painter = (ctx, mood, weather, rnd, out) => {
  room(ctx, rnd, out, { wall: "#1e161a", floor: "#16110c", wainscot: "#2a1a12" });

  // the back bar: mirror, shelves, a hundred bottles
  ctx.fillStyle = "#2a1c16";
  ctx.fillRect(44, 22, 262, 124);
  vGradient(ctx, 50, 28, 250, 112, ["#1a2028", "#10141a"], 4);
  for (let s = 0; s < 3; s++) {
    const sy = 50 + s * 32;
    ctx.fillStyle = "#3a2a1c";
    ctx.fillRect(50, sy, 250, 3);
    ctx.fillStyle = rgba("#e8a849", 0.3);
    ctx.fillRect(50, sy + 3, 250, 1);
    for (let b = 0; b < 26; b++) {
      const bx = 54 + b * 9 + Math.floor(rnd() * 3);
      const bh = 12 + Math.floor(rnd() * 10);
      const col = ["#3a5a4a", "#6e3a22", "#3a3a5e", "#5e2c38", "#5a4a22", "#2a4a3a"][Math.floor(rnd() * 6)];
      ctx.fillStyle = col;
      ctx.fillRect(bx, sy - bh + 4, 6, bh - 4);
      ctx.fillRect(bx + 2, sy - bh, 2, 4);
      ctx.fillStyle = rgba("#ffdca0", 0.32);
      ctx.fillRect(bx + 1, sy - bh + 6, 1, bh - 8);
      if (rnd() < 0.3) {
        ctx.fillStyle = "#d8d2c0";
        ctx.fillRect(bx + 1, sy - 6, 4, 3);
      }
    }
  }
  out.lights.push({ x: 54, y: 52, w: 242, h: 1, color: "#e8a849", flicker: 0.1, glow: 1 });

  // the neon that names the place
  out.neons.push({ x: 92, y: 4, w: 166, h: 14, color: "rgb(79,216,196)", text: "THE BLUE HOUR" });

  // the counter, brass rail, the tabs on Sal's spike
  ctx.fillStyle = "#4a2c1a";
  ctx.fillRect(30, 146, 290, 6);
  ctx.fillStyle = "#6a4024";
  ctx.fillRect(30, 146, 290, 1);
  vGradient(ctx, 34, 152, 282, 38, ["#2c1a10", "#1c120a"], 4);
  for (let x = 40; x < 316; x += 24) {
    ctx.fillStyle = "#24160c";
    ctx.fillRect(x, 156, 1, 30);
  }
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(34, 182, 282, 1);
  ctx.fillStyle = "#8a6a2a";
  for (let x = 40; x < 316; x += 48) ctx.fillRect(x, 182, 2, 6);
  ctx.fillStyle = "#c9c2b0";
  ctx.fillRect(143, 136, 1, 10);
  ctx.fillStyle = "#e8e2d4";
  ctx.fillRect(140, 140, 7, 2);
  ctx.fillRect(141, 137, 6, 2);
  for (const gx of [92, 186, 236]) {
    ctx.fillStyle = rgba("#dcebf5", 0.55);
    ctx.fillRect(gx, 139, 4, 7);
    ctx.fillStyle = rgba("#e8a849", 0.8);
    ctx.fillRect(gx, 142, 4, 3);
  }
  ctx.fillStyle = "#1a1c20";
  ctx.fillRect(204, 143, 6, 3);
  out.smoke.push({ x: 207, y: 141 });

  // stools
  for (let i = 0; i < 5; i++) {
    const sx = 46 + i * 56;
    ctx.fillStyle = "#3a2a1c";
    ctx.fillRect(sx, 206, 20, 4);
    ctx.fillStyle = "#4a3624";
    ctx.fillRect(sx, 206, 20, 1);
    ctx.fillStyle = "#24180e";
    ctx.fillRect(sx + 8, 210, 4, 22);
    ctx.fillRect(sx + 4, 230, 12, 2);
  }
  figure(ctx, 222, 205, { color: "#0a0806", hat: true, scale: 1.5 });

  // the poker table in the back corner, the record player on its cabinet
  ctx.fillStyle = "#1a3a2a";
  ctx.fillRect(322, 146, 52, 6);
  ctx.fillStyle = "#24503a";
  ctx.fillRect(322, 146, 52, 1);
  ctx.fillStyle = "#1a120c";
  ctx.fillRect(344, 152, 6, 36);
  ctx.fillStyle = "#e8e2d4";
  ctx.fillRect(334, 143, 4, 3);
  ctx.fillRect(352, 144, 4, 2);
  pendant(ctx, 348, 96, mood, out, { width: 11, cone: 26 });
  ctx.fillStyle = "#2c1e12";
  ctx.fillRect(378, 136, 34, 54);
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(378, 136, 34, 1);
  ctx.fillStyle = "#0a0808";
  ctx.fillRect(382, 128, 26, 8);
  ctx.fillStyle = "#14100e";
  ctx.fillRect(386, 125, 16, 3);
  ctx.fillStyle = "#3a1a1a";
  ctx.fillRect(392, 126, 4, 1);
  ctx.fillStyle = "#8a97a8";
  ctx.fillRect(402, 124, 1, 5);

  // a window onto the wet street
  glassWindow(ctx, { x: 420, y: 54, w: 50, h: 76 }, mood, weather, rnd, out, { panes: [2, 3] });

  pendant(ctx, 100, 74, mood, out, { cone: 36 });
  pendant(ctx, 200, 74, mood, out, { cone: 36 });
  pendant(ctx, 290, 74, mood, out, { cone: 36 });
  // smoke under the ceiling
  const haze = ctx.createLinearGradient(0, 0, 0, 70);
  haze.addColorStop(0, "rgba(140,150,170,0.12)");
  haze.addColorStop(1, "rgba(140,150,170,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, SCENE_W, 70);
  roomVignette(ctx, 0.45);
};

/* ------------------------------------------------------------------ */
/* Rowan Heights — a parlor of old money                               */
/* ------------------------------------------------------------------ */

export const paintApartment: Painter = (ctx, mood, weather, rnd, out) => {
  room(ctx, rnd, out, { wall: "#26201c", floor: "#1c1612", floorKind: "planks" });
  const fy = 190;
  ctx.fillStyle = "rgba(232,168,73,0.06)";
  for (let y = 22; y < fy - 8; y += 14) {
    for (let x = (y / 14) % 2 ? 7 : 0; x < SCENE_W; x += 14) {
      ctx.fillRect(x + 3, y, 2, 1);
      ctx.fillRect(x + 2, y + 1, 4, 1);
      ctx.fillRect(x + 3, y + 2, 2, 1);
    }
  }

  // the debut poster in a museum frame over the mantel
  ctx.fillStyle = "#8a7a4a";
  ctx.fillRect(118, 66, 52, 64);
  ctx.fillStyle = "#e0d6c0";
  ctx.fillRect(122, 70, 44, 56);
  ctx.fillStyle = "#3a2a4e";
  ctx.fillRect(126, 76, 36, 30);
  ctx.fillStyle = "#e8c0a4";
  ctx.fillRect(140, 82, 8, 9);
  ctx.fillStyle = "#26201c";
  ctx.fillRect(138, 80, 12, 3);
  ctx.fillStyle = "#8b7cc8";
  ctx.fillRect(136, 92, 16, 14);
  ctx.fillStyle = "#3a3430";
  ctx.fillRect(126, 110, 36, 2);
  ctx.fillRect(130, 114, 28, 1);
  ctx.fillRect(132, 118, 24, 1);
  glow(ctx, 144, 98, 34, mood.window, 0.07);

  // the fireplace
  ctx.fillStyle = "#3a2c22";
  ctx.fillRect(98, 136, 92, 54);
  ctx.fillStyle = "#4a382a";
  ctx.fillRect(92, 132, 104, 5);
  ctx.fillStyle = "#0c0a08";
  ctx.fillRect(114, 148, 60, 42);
  ctx.fillStyle = "#e86a2a";
  ctx.fillRect(126, 176, 36, 10);
  ctx.fillStyle = "#ffb85a";
  ctx.fillRect(132, 170, 6, 8);
  ctx.fillRect(142, 168, 5, 10);
  ctx.fillRect(152, 172, 5, 6);
  ctx.fillStyle = "#2a1408";
  ctx.fillRect(124, 184, 40, 3);
  out.lights.push({ x: 126, y: 168, w: 36, h: 18, color: "#ff8a3a", flicker: 0.9, glow: 2.4 });
  pool(ctx, 144, 196, 70, "#ff8a3a", 0.26);

  // a grandfather clock keeping its own counsel
  ctx.fillStyle = "#2a1a10";
  ctx.fillRect(42, 96, 22, 94);
  ctx.fillRect(40, 92, 26, 6);
  ctx.fillStyle = "#e8e2d4";
  ctx.fillRect(46, 102, 14, 14);
  ctx.fillStyle = "#3a2c1c";
  ctx.fillRect(52, 104, 1, 6);
  ctx.fillRect(52, 109, 4, 1);
  ctx.fillStyle = "#14100a";
  ctx.fillRect(47, 122, 12, 54);
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(52, 124, 2, 30);
  ctx.fillRect(50, 154, 6, 6);

  // the tall window, curtains drawn back
  glassWindow(ctx, { x: 222, y: 36, w: 64, h: 120 }, mood, weather, rnd, out, { panes: [2, 3], view: "trees", beam: { floorY: fy, dx: 20 } });
  for (const [cx, dir] of [[208, 1], [288, -1]] as [number, number][]) {
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 3 === 0 ? "#3a0e16" : "#5a1a24";
      ctx.fillRect(cx + i * dir * 0.6, 28, 1, 136 - Math.abs(8 - i));
    }
    ctx.fillStyle = "#5a1a24";
    ctx.fillRect(Math.min(cx, cx + dir * 10), 28, 10, 140);
  }
  ctx.fillStyle = "#8a6a2a";
  ctx.fillRect(204, 26, 98, 3);

  // the writing desk, the unsent letter under the lamp
  desk(ctx, 296, 150, 64, fy, "#2a1a10");
  ctx.fillStyle = "#e8e2d4";
  ctx.fillRect(316, 146, 14, 4);
  ctx.fillRect(318, 144, 12, 2);
  ctx.fillStyle = "#3a3430";
  ctx.fillRect(320, 146, 8, 1);
  ctx.fillStyle = "#14100a";
  ctx.fillRect(334, 144, 1, 6);
  deskLamp(ctx, 350, 150, mood, out, -1, "#2a3a2a");
  chair(ctx, 312, 204, "#2a1c14");

  // bookshelf
  ctx.fillStyle = "#24180e";
  ctx.fillRect(400, 52, 66, 138);
  for (let s = 0; s < 5; s++) {
    ctx.fillStyle = "#160e08";
    ctx.fillRect(404, 58 + s * 26, 58, 22);
    for (let b = 0; b < 10; b++) {
      ctx.fillStyle = ["#5e2c38", "#2c4a3a", "#3a3a5e", "#6e5a2c", "#4a2c1c"][Math.floor(rnd() * 5)];
      ctx.fillRect(406 + b * 5 + Math.floor(rnd() * 2), 61 + s * 26 + Math.floor(rnd() * 4), 4, 18 - Math.floor(rnd() * 4));
    }
  }

  // armchairs and the rug between them
  ctx.fillStyle = "#3c1e22";
  ctx.beginPath();
  ctx.ellipse(240, 238, 150, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#6a3a2a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(240, 238, 136, 17, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (const [ax, flip] of [[150, 1], [276, -1]] as [number, number][]) {
    ctx.fillStyle = "#3a2c4a";
    ctx.fillRect(ax, 208, 56, 30);
    ctx.fillRect(ax + (flip > 0 ? 0 : 46), 186, 10, 40);
    ctx.fillStyle = "#4a3a5e";
    ctx.fillRect(ax + 4, 206, 48, 6);
    ctx.fillStyle = "#2c2038";
    ctx.fillRect(ax, 236, 56, 4);
  }
  roomVignette(ctx, 0.45);
};

/* ------------------------------------------------------------------ */
/* The Veilport Ledger — the city desk                                 */
/* ------------------------------------------------------------------ */

export const paintNewsroom: Painter = (ctx, mood, weather, rnd, out) => {
  room(ctx, rnd, out, { wall: "#222630", floor: "#18150f", wainscot: "#1a1d24" });
  const fy = 190;
  glassWindow(ctx, { x: 20, y: 30, w: 64, h: 112 }, mood, weather, rnd, out, { blinds: false, beam: { floorY: fy, dx: 24 } });

  // the glass door, gilt letters backwards from in here
  ctx.fillStyle = "#14181e";
  ctx.fillRect(404, 30, 64, 160);
  ctx.fillStyle = rgba("#c8dcea", 0.12);
  ctx.fillRect(410, 36, 52, 96);
  reversedText(ctx, "THE LEDGER", 436, 62, "#c9a24a");
  reversedText(ctx, "CITY DESK", 436, 72, "rgba(201,162,74,0.7)");
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(412, 142, 3, 6);

  // the wall of front pages
  for (let i = 0; i < 8; i++) {
    const px = 110 + (i % 4) * 54;
    const py = 30 + Math.floor(i / 4) * 52;
    ctx.fillStyle = "#d8d2c0";
    ctx.fillRect(px, py, 42, 44);
    ctx.fillStyle = "#2a2622";
    ctx.fillRect(px + 3, py + 4, 36, 5);
    ctx.fillStyle = "#8a8478";
    for (let l = 0; l < 5; l++) ctx.fillRect(px + 3, py + 13 + l * 5, 36 - Math.floor(rnd() * 12), 2);
    ctx.fillStyle = "#e05c6e";
    ctx.fillRect(px + 20, py, 2, 2);
  }
  wallClock(ctx, 360, 46, 9);

  // Marlowe's desk: files stacked to the lamp, ashtray smoking
  desk(ctx, 288, 146, 92, fy, "#2a2218");
  ctx.fillStyle = "#c9b98a";
  ctx.fillRect(326, 132, 22, 14);
  ctx.fillStyle = "#a89868";
  ctx.fillRect(326, 136, 22, 1);
  ctx.fillRect(326, 140, 22, 1);
  ctx.fillStyle = "#8a2c2c";
  ctx.fillRect(330, 132, 6, 2);
  typewriter(ctx, 296, 146);
  ctx.fillStyle = "#1a1c20";
  ctx.fillRect(354, 143, 7, 3);
  out.smoke.push({ x: 357, y: 141 });
  deskLamp(ctx, 372, 146, mood, out, -1);
  chair(ctx, 300, 202, "#14100a");

  // the other desks, the mess, the bulbs
  desk(ctx, 96, 196, 112, 236, "#2a2218");
  typewriter(ctx, 110, 196);
  papers(ctx, rnd, 150, 196, 4);
  ctx.fillStyle = "#1a1c20";
  ctx.fillRect(184, 193, 7, 3);
  out.smoke.push({ x: 187, y: 191 });
  for (const lx of [160, 300]) {
    ctx.fillStyle = "#05070c";
    ctx.fillRect(lx, 0, 1, 26);
    ctx.fillStyle = mix(mood.window, "#ffffff", 0.4);
    ctx.fillRect(lx - 2, 26, 5, 5);
    out.lights.push({ x: lx - 2, y: 26, w: 5, h: 5, color: mood.window, flicker: 0.14, glow: 2.4 });
    out.beams.push({ pts: [[lx - 2, 31], [lx + 3, 31], [lx + 46, 190], [lx - 46, 190]], color: mood.window, alpha: 0.05 });
  }
  ctx.fillStyle = "#c9c2b0";
  ctx.fillRect(220, 250, 12, 5);
  ctx.fillRect(356, 244, 10, 4);
  roomVignette(ctx, 0.45);
};

/* ------------------------------------------------------------------ */
/* your office — third desk back, under the slow clock                 */
/* ------------------------------------------------------------------ */

export const paintOffice: Painter = (ctx, mood, weather, rnd, out) => {
  room(ctx, rnd, out, { wall: "#221d18", floor: "#18120a", wainscot: "#1a1510" });
  const fy = 190;
  // the window, blinds half drawn: the city cut into ribbons
  glassWindow(ctx, { x: 160, y: 26, w: 160, h: 126 }, mood, weather, rnd, out, {
    panes: [2, 1],
    blinds: true,
    beam: { floorY: fy, dx: 60, color: mix(mood.windowCool, mood.window, 0.35), alpha: 0.05 },
  });
  // the frosted door, name lettered backwards
  ctx.fillStyle = "#16120e";
  ctx.fillRect(346, 64, 46, 126);
  ctx.fillStyle = rgba("#c8d0d8", 0.16);
  ctx.fillRect(351, 70, 36, 56);
  reversedText(ctx, "DETECTIVE", 369, 94, "rgba(232,226,212,0.55)");
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(352, 134, 3, 5);

  // desk, typewriter, files, coffee, phone, lamp
  desk(ctx, 132, 196, 216, 236, "#2e2014");
  typewriter(ctx, 196, 196);
  ctx.fillStyle = "#c9b98a";
  ctx.fillRect(246, 188, 26, 8);
  ctx.fillStyle = "#b9a97a";
  ctx.fillRect(249, 185, 26, 4);
  ctx.fillStyle = "#e05c6e";
  ctx.fillRect(262, 190, 8, 2);
  ctx.fillStyle = "#e8e2d4";
  ctx.fillRect(290, 188, 9, 8);
  ctx.fillRect(299, 190, 3, 4);
  out.smoke.push({ x: 294, y: 186, kind: "steam" });
  ctx.fillStyle = "#7a2228";
  ctx.fillRect(310, 190, 16, 6);
  ctx.fillRect(312, 186, 12, 3);
  ctx.fillStyle = "#a83440";
  ctx.fillRect(310, 186, 4, 2);
  ctx.fillRect(322, 186, 4, 2);
  deskLamp(ctx, 150, 196, mood, out, 1);
  chair(ctx, 222, 254, "#1a1410");

  // filing cabinet, corkboard, coat rack with the coat and the hat
  cabinet(ctx, 36, 116, 46, 74, 4, "#2a3040");
  corkboard(ctx, rnd, 28, 36, 100, 66);
  ctx.fillStyle = "#0c0a08";
  ctx.fillRect(424, 98, 3, 92);
  ctx.fillRect(412, 102, 28, 3);
  ctx.fillRect(418, 188, 16, 2);
  ctx.fillStyle = "#3e3428";
  ctx.fillRect(414, 106, 22, 54);
  ctx.fillRect(412, 112, 26, 40);
  ctx.fillStyle = "#2e261c";
  ctx.fillRect(424, 106, 2, 52);
  ctx.fillStyle = "#2c2418";
  ctx.fillRect(410, 88, 32, 6);
  ctx.fillRect(416, 80, 20, 9);
  ctx.fillStyle = "#14100a";
  ctx.fillRect(416, 86, 20, 2);
  roomVignette(ctx, 0.5);
};

/* ------------------------------------------------------------------ */
/* Grand Veilport Station                                              */
/* ------------------------------------------------------------------ */

export const paintStation: Painter = (ctx, mood, weather, rnd, out) => {
  out.interior = true;
  out.horizon = 120;
  out.ground = 214;
  const fy = 214;
  vGradient(ctx, 0, 0, SCENE_W, SCENE_H, ["#0a0e16", "#141a26", "#1e2432"], 10);

  // the open end of the shed: the city, and the rain, beyond
  glassWindow(ctx, { x: 176, y: 108, w: 128, h: 62 }, mood, weather, rnd, out, { panes: [1, 1], sill: false });
  ctx.fillStyle = "#0a0e16";
  ctx.fillRect(176, 166, 128, 6);
  // iron ribs of the canopy and the glazing between them
  for (let i = 0; i < 7; i++) {
    const r = 250 - i * 30;
    ctx.strokeStyle = i % 2 ? "#070a10" : "#0b0f17";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(240, 270, r, Math.PI * 1.06, Math.PI * 1.94);
    ctx.stroke();
    ctx.strokeStyle = rgba(mood.windowCool, 0.06);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(240, 270, r - 15, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
  }

  // the departure board
  ctx.fillStyle = "#06080c";
  ctx.fillRect(316, 60, 118, 46);
  ctx.fillStyle = "#1a1e26";
  ctx.fillRect(316, 60, 118, 2);
  ctx.fillStyle = "#e8a849";
  drawPixelText(ctx, "DEPARTURES", 322, 64);
  const rows = ["22:15 HARBOR LINE", "22:40 MIRROR PASS", "23:05 ROWAN HTS", "23:50 NIGHT MAIL"];
  ctx.fillStyle = "rgba(232,168,73,0.75)";
  rows.forEach((r, i) => drawPixelText(ctx, r, 322, 74 + i * 7));
  out.lights.push({ x: 318, y: 62, w: 114, h: 42, color: "#e8a849", flicker: 0.04, glow: 0.8 });

  // the great clock
  glow(ctx, 240, 70, 26, "#e8e2d4", 0.12);
  wallClock(ctx, 240, 70, 13);
  ctx.fillStyle = "#05070c";
  ctx.fillRect(239, 0, 2, 56);
  out.lights.push({ x: 228, y: 58, w: 24, h: 24, color: "#e8e2d4", flicker: 0.03, glow: 1 });

  // platform and the safety line
  vGradient(ctx, 0, fy, SCENE_W, SCENE_H - fy, ["#1a1e28", "#0c0f16"], 6);
  ctx.fillStyle = "#e8a849";
  ctx.fillRect(0, fy + 2, 200, 2);
  ctx.fillStyle = "#0a0c12";
  for (let x = 0; x < SCENE_W; x += 20) ctx.fillRect(x, fy + 6, 1, SCENE_H - fy - 6);

  // the night train, windows full of strangers
  ctx.fillStyle = "#0a0e16";
  ctx.fillRect(0, 150, 170, 62);
  ctx.fillStyle = "#1c2230";
  ctx.fillRect(0, 150, 170, 3);
  ctx.fillStyle = "#151a24";
  ctx.fillRect(0, 196, 170, 2);
  for (let i = 0; i < 5; i++) {
    const wx = 10 + i * 32;
    const lit = rnd() < 0.8;
    ctx.fillStyle = lit ? mood.window : "#1a2030";
    ctx.fillRect(wx, 162, 20, 14);
    if (lit) {
      out.lights.push({ x: wx, y: 162, w: 20, h: 14, color: mood.window, flicker: 0.05, glow: 1.2 });
      if (rnd() < 0.6) figure(ctx, wx + 6 + Math.floor(rnd() * 8), 176, { color: shade(mood.window, 0.35), hat: rnd() < 0.5 });
    }
  }
  ctx.fillStyle = "#e0404a";
  ctx.fillRect(166, 186, 3, 3);
  out.smoke.push({ x: 20, y: 146, kind: "steam" });
  out.smoke.push({ x: 120, y: 210, kind: "steam" });

  // the taxi rank: a cab lane behind the platform edge, Medallion 7-7-4 waiting
  vGradient(ctx, 186, 170, SCENE_W - 186, fy - 170, ["#141820", "#0e1118"], 4);
  ctx.fillStyle = "#2a2e36";
  ctx.fillRect(186, fy - 2, SCENE_W - 186, 2);
  ctx.fillStyle = rgba("#e8e2d4", 0.18);
  for (let x = 196; x < SCENE_W; x += 26) ctx.fillRect(x, 200, 12, 1);
  car(ctx, 220, 192, { taxi: true, dir: -1, lit: true, scale: 2.4 });
  out.neons.push({ x: 248, y: 146, w: 18, h: 7, color: "rgb(232,200,96)", text: "TAXI" });
  ctx.fillStyle = "#d8d2c0";
  ctx.fillRect(258, 160, 10, 4);
  out.lights.push({ x: 286, y: 174, w: 4, h: 3, color: "#fff2c8", flicker: 0.02, glow: 2.4 });
  pool(ctx, 292, 194, 34, "#fff2c8", 0.2);

  // hanging lamps
  for (const lx of [64, 410]) pendant(ctx, lx, 84, mood, out, { cone: 40 });
  // travellers
  figure(ctx, 340, 228, { hat: true, scale: 1.3 });
  figure(ctx, 352, 228, { scale: 1.2 });
  ctx.fillStyle = "#3a2c1c";
  ctx.fillRect(356, 220, 8, 7);
  figure(ctx, 440, 236, { hat: true, umbrella: true, scale: 1.4 });
  out.walks.push({ y: 232, scale: 1.35, minX: 180, maxX: 480, every: 9 });
  roomVignette(ctx, 0.35);
};

/* ------------------------------------------------------------------ */
/* the 14th floor — a manager's glass box over the Financial District  */
/* ------------------------------------------------------------------ */

export const paintHighrise: Painter = (ctx, mood, weather, rnd, out) => {
  out.interior = true;
  out.horizon = 186;
  out.ground = 190;
  const fy = 190;
  // floor-to-ceiling glass: the whole district glittering below
  const win = { x: 92, y: 14, w: 296, h: 172 };
  glassWindow(ctx, win, mood, weather, rnd, out, { panes: [4, 1], sill: false, view: "city", beam: { floorY: fy, dx: 0, alpha: 0.05 } });
  for (let i = 0; i < 9; i++) {
    building(ctx, {
      x: win.x + i * 33 + Math.floor(rnd() * 6), w: 22 + Math.floor(rnd() * 10), h: 40 + Math.floor(rnd() * 100),
      ground: win.y + win.h, color: mix(mood.mid, mood.haze, 0.3), litChance: 0.45, rnd, out, mood, haze: 0.25,
      style: "tower", collectLights: false, roof: rnd() < 0.3 ? "antenna" : "flat",
    });
  }
  ctx.fillStyle = "#0c1018";
  for (let i = 0; i <= 4; i++) ctx.fillRect(win.x + Math.round((win.w * i) / 4) - 2, win.y, 4, win.h);
  ctx.fillRect(win.x, win.y + win.h - 3, win.w, 4);
  // dove-gray walls either side
  vGradient(ctx, 0, 0, win.x - 2, fy, ["#2e3034", "#3a3c42", "#34363a"], 8);
  vGradient(ctx, win.x + win.w + 2, 0, SCENE_W - win.x - win.w - 2, fy, ["#2e3034", "#3a3c42", "#34363a"], 8);
  // carpet
  vGradient(ctx, 0, fy, SCENE_W, SCENE_H - fy, ["#3a3a40", "#26262c", "#16161a"], 8);
  ctx.fillStyle = "#1e1e22";
  ctx.fillRect(0, fy, SCENE_W, 2);

  // the coat rack, her coat still damp
  ctx.fillStyle = "#0c0e12";
  ctx.fillRect(58, 96, 3, 94);
  ctx.fillRect(48, 98, 24, 3);
  ctx.fillRect(52, 188, 16, 2);
  ctx.fillStyle = "#a8a49c";
  ctx.fillRect(48, 104, 22, 62);
  ctx.fillStyle = "#8a867e";
  ctx.fillRect(58, 104, 2, 60);
  ctx.fillRect(48, 104, 2, 62);
  ctx.fillStyle = rgba("#c8dcea", 0.35);
  ctx.fillRect(52, 108, 1, 2);
  ctx.fillRect(64, 112, 1, 2);

  // the award shelf
  ctx.fillStyle = "#1e2024";
  ctx.fillRect(400, 78, 70, 3);
  ctx.fillRect(400, 112, 70, 3);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? "#c9a24a" : "#d8d2c0";
    ctx.fillRect(406 + i * 13, 66 + (i % 2) * 2, 7, 12 - (i % 2) * 2);
    ctx.fillStyle = "#3a3c42";
    ctx.fillRect(404 + i * 13, 98, 11, 14);
    ctx.fillStyle = "#c9c2b0";
    ctx.fillRect(405 + i * 13, 99, 9, 9);
  }
  out.lights.push({ x: 404, y: 76, w: 62, h: 1, color: "#e8d8a8", flicker: 0.04, glow: 0.8 });

  // the filing drawer marked VERNE TRUST
  cabinet(ctx, 320, 138, 34, 52, 3, "#3a3e46");
  ctx.fillStyle = "#e8e2d4";
  ctx.fillRect(331, 158, 12, 3);

  // the desk: glass top, calendar, a phone that rang once too often
  ctx.fillStyle = rgba("#c8dcea", 0.25);
  ctx.fillRect(130, 164, 140, 3);
  ctx.fillStyle = "#1a1c20";
  ctx.fillRect(134, 167, 4, 30);
  ctx.fillRect(262, 167, 4, 30);
  ctx.fillRect(134, 196, 132, 2);
  ctx.fillStyle = "#e8e2d4";
  ctx.fillRect(184, 156, 18, 8);
  ctx.fillStyle = "#c23a48";
  ctx.fillRect(190, 158, 6, 4);
  ctx.fillStyle = "#14161a";
  ctx.fillRect(226, 157, 14, 7);
  deskLamp(ctx, 252, 164, mood, out, -1, "#3a3c42");
  chair(ctx, 196, 214, "#2a2a30");
  roomVignette(ctx, 0.35);
};

/** Pale floor reflections under interior lights — the polished-floor look. */
export function floorSheen(ctx: CanvasRenderingContext2D, out: PaintedScene) {
  for (const l of out.lights) {
    if (l.y > out.ground || l.y < out.ground - 70) continue;
    const g = ctx.createLinearGradient(0, out.ground, 0, out.ground + 26);
    g.addColorStop(0, rgba(l.color, 0.08));
    g.addColorStop(1, rgba(l.color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(l.x - 2, out.ground + 1, l.w + 4, 26);
  }
}
