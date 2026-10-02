"use client";

import { useEffect, useRef, useState } from "react";
import type { Mood, PortraitDef } from "@/lib/engine/types";
import { rngFor } from "@/lib/engine/rng";

/**
 * Pixel portrait renderer.
 *
 * Every character in Veilport is drawn deterministically from their
 * PortraitDef onto a 48×64 canvas: noir key light from the right with a
 * warm rim, shadow side falling away to the left, venetian-blind light
 * across the backdrop, and a face that reacts — brows, lids, gaze, mouth.
 * Animated portraits blink, breathe, and move their lips while they talk.
 */

const W = 48;
const H = 64;

export interface PortraitFrame {
  /** 0 open, 1 half, 2 shut */
  blink?: 0 | 1 | 2;
  /** 0 closed, 1 parted, 2 open */
  mouth?: 0 | 1 | 2;
  /** 0 or 1 px — the rise and fall of breath */
  breath?: 0 | 1;
}

function rgb(c: string): [number, number, number] {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hex(r: number, g: number, b: number) {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
function shade(c: string, f: number): string {
  const [r, g, b] = rgb(c);
  return hex(r * f, g * f, b * f);
}
function mix(a: string, b: string, t: number): string {
  const A = rgb(a);
  const B = rgb(b);
  return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

const EYE_COLORS = ["#4a2e1c", "#5a3a22", "#6a5a2a", "#3a5a7a", "#3a6a4a", "#5a6470"];
const KEY = "#f0b860"; // the key light, a warm streetlamp through the blinds

/** half-width of the head at each row, top (y=13) to chin (y=41) */
const HEAD_ROWS = [4, 6, 7, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 8, 8, 7, 7, 6, 6, 5, 4, 3, 2];
const HEAD_TOP = 13;
const CX = 24;

export function drawPortrait(
  ctx: CanvasRenderingContext2D,
  p: PortraitDef,
  mood: Mood,
  seed: string,
  frame: PortraitFrame = {}
) {
  const rnd = rngFor(`portrait:${seed}`);
  const by = frame.breath ?? 0; // whole bust shifts down a pixel on the out-breath
  const px = (x: number, y: number, c: string, w = 1, h = 1) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y + by, w, h);
  };
  ctx.clearRect(0, 0, W, H);

  /* ---- backdrop: dark, a spill of colored light, blinds across it ---- */
  for (let y = 0; y < H; y++) {
    ctx.fillStyle = mix("#111722", "#06080d", y / H);
    ctx.fillRect(0, y, W, 1);
  }
  const halo = ctx.createRadialGradient(30, 26, 2, 30, 26, 30);
  halo.addColorStop(0, `${p.accent}38`);
  halo.addColorStop(1, `${p.accent}00`);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(240,184,96,0.075)";
  for (let i = -4; i < 10; i++) {
    for (let y = 0; y < H; y++) {
      const x0 = i * 9 + Math.floor(y * 0.45);
      ctx.fillRect(x0, y, 4, 1);
    }
  }
  ctx.fillStyle = "rgba(5, 3, 12,0.45)";
  ctx.fillRect(0, 0, 5, H);

  const age = p.age;
  const fear = mood === "afraid";
  const skin = fear ? mix(p.skin, "#9aa4b0", 0.12) : p.skin;
  const skinSh = shade(skin, 0.7);
  const skinDeep = shade(skin, 0.52);
  const skinHi = mix(skin, "#fff2d8", 0.18);
  const hair = p.hair;
  const hairSh = shade(hair, 0.62);
  const hairHi = mix(hair, "#fff2d8", 0.28);
  const eyeColor = EYE_COLORS[Math.floor(rnd() * EYE_COLORS.length)];

  /* ---- outfit ---------------------------------------------------- */
  const outfitBase: Record<PortraitDef["outfit"], string> = {
    coat: "#4a3e2e",
    suit: "#262433",
    uniform: "#243450",
    sweater: "#4e3c2e",
    dress: shade(p.accent, 0.7),
    apron: "#d8d2c4",
    labcoat: "#d2d6da",
    vest: "#e4ded0",
  };
  const oc = outfitBase[p.outfit];
  const torso = (y: number) => Math.min(20, 6 + Math.max(0, y - 44) * 1.9);
  for (let y = 44; y < H; y++) {
    const hw = Math.round(torso(y));
    const x0 = CX - hw;
    const w = hw * 2;
    px(x0, y, oc, w);
    px(x0, y, shade(oc, 0.62), Math.max(2, Math.round(w * 0.32))); // shadow side
    px(x0, y, shade(oc, 0.48), 1);
    px(x0 + w - 1, y, mix(oc, KEY, 0.4), 1); // rim light
  }
  const neckY = 38;
  // shirt / inner layers + details per outfit
  if (p.outfit === "suit" || p.outfit === "coat" || p.outfit === "vest") {
    const shirt = p.outfit === "vest" ? "#c8c2b4" : "#e8e2d4";
    for (let y = 45; y < H; y++) {
      const v = Math.max(1, 7 - Math.floor((y - 45) / 2.4));
      px(CX - v, y, shirt, v * 2);
    }
    for (let y = 47; y < H; y++) px(CX - 1, y, p.accent, 2); // tie
    px(CX - 1, 46, shade(p.accent, 0.7), 2);
    if (p.outfit === "vest") {
      // waistcoat over shirtsleeves, buttons down the front
      for (let y = 50; y < H; y++) {
        const off = Math.max(2, 7 - Math.floor((y - 50) / 1.6));
        px(CX - 8, y, shade(p.accent, 0.55), 8 - off);
        px(CX + off, y, shade(p.accent, 0.7), 8 - off);
      }
      for (let y = 52; y < H; y += 4) px(CX + 2, y, "#c9a24a");
    } else {
      // lapels
      for (let y = 45; y < H; y++) {
        const off = Math.max(1, 8 - Math.floor((y - 45) / 2));
        px(CX - off - 3, y, shade(oc, 0.5), 3);
        px(CX + off, y, shade(oc, 0.78), 3);
      }
      if (p.outfit === "coat") {
        // collar up against the rain
        for (let y = 40; y < 48; y++) {
          px(CX - 12 + Math.floor((y - 40) / 3), y, shade(oc, 0.7), 4);
          px(CX + 8 - Math.floor((y - 40) / 3), y, mix(oc, KEY, 0.18), 4);
        }
      } else {
        px(CX + 9, 52, p.accent, 3); // pocket square
      }
    }
  } else if (p.outfit === "labcoat") {
    for (let y = 45; y < H; y++) {
      const v = Math.max(1, 6 - Math.floor((y - 45) / 2.6));
      px(CX - v, y, "#9ab0c0", v * 2);
    }
    for (let y = 47; y < H; y++) px(CX - 1, y, p.accent, 2);
    for (let y = 45; y < H; y++) {
      const off = Math.max(1, 7 - Math.floor((y - 45) / 2));
      px(CX - off - 3, y, "#a8adb4", 3);
      px(CX + off, y, "#e8ecf0", 3);
    }
    px(CX + 9, 54, "#e8ecf0", 5, 1);
    px(CX + 10, 51, "#3a5a8a", 1, 4); // pen
  } else if (p.outfit === "uniform") {
    px(CX - 4, 45, shade(oc, 1.3), 8, 2); // collar
    for (let y = 49; y < H; y += 4) px(CX, y, "#c9a22e", 1, 2);
    px(CX - 11, 51, "#c9a22e", 4, 4); // badge
    px(CX - 10, 52, "#f0d070", 2, 2);
    px(CX - 18, 47, shade(oc, 1.4), 5, 2); // epaulettes
    px(CX + 13, 47, mix(oc, KEY, 0.35), 5, 2);
  } else if (p.outfit === "apron") {
    px(CX - 15, 47, "#2e2a26", 30, H - 47); // dark shirt under
    px(CX - 15, 47, shade("#2e2a26", 0.7), 9, H - 47);
    px(CX - 8, 50, p.accent, 16, H - 50); // bib
    px(CX - 8, 50, shade(p.accent, 0.7), 16, 1);
    px(CX - 9, 46, shade(p.accent, 0.8), 2, 5); // straps
    px(CX + 7, 46, mix(p.accent, KEY, 0.3), 2, 5);
  } else if (p.outfit === "dress") {
    for (let y = 45; y < 51; y++) {
      const v = Math.max(1, 6 - (y - 45));
      px(CX - v, y, skinSh, v * 2); // neckline
    }
    for (let i = -5; i <= 5; i += 2) px(CX + i, 47 + Math.round(Math.abs(i) * 0.3), "#ece6d6"); // pearls
  } else if (p.outfit === "sweater") {
    px(CX - 6, 45, shade(oc, 1.25), 12, 2); // ribbed crew neck
    for (let y = 48; y < H; y += 2) {
      for (let x = CX - 18; x < CX + 18; x += 3) px(x, y, shade(oc, 0.86));
    }
  }

  /* ---- neck ---- */
  px(CX - 4, neckY, skinSh, 8, 8);
  px(CX + 2, neckY, skin, 2, 7);
  px(CX - 4, neckY, skinDeep, 8, 2); // shadow under the jaw

  /* ---- head ---- */
  const lean = age === "old" ? 1 : 0;
  HEAD_ROWS.forEach((hw0, i) => {
    const y = HEAD_TOP + i;
    const hw = hw0 - (lean && y >= 29 && y <= 34 ? 1 : 0);
    const x0 = CX - hw;
    const w = hw * 2;
    px(x0, y, skin, w);
    px(x0, y, mix(skin, skinSh, 0.55), Math.max(1, Math.round(w * 0.36)));
    px(x0, y, skinSh, Math.max(1, Math.round(w * 0.24)));
    px(x0, y, skinDeep, Math.max(1, Math.round(w * 0.08)));
    if (y >= 15 && y <= 36) px(x0 + w - 1, y, mix(skin, KEY, 0.45));
  });
  // cheekbone light, temple shadow, jaw underside
  px(29, 27, skinHi, 3, 4);
  px(30, 31, skinHi, 2, 2);
  px(17, 30, skinSh, 2, 5);
  px(21, 39, skinSh, 7, 1);
  // ears
  px(13, 24, skinSh, 2, 6);
  px(14, 25, skinDeep, 1, 3);
  px(33, 24, skin, 2, 6);
  px(34, 25, mix(skin, KEY, 0.4), 1, 4);
  if (p.earrings) {
    px(13, 30, "#e8d88a", 2, 2);
    px(33, 30, "#f6e6a0", 2, 2);
  }

  /* ---- age ---- */
  if (age === "old") {
    px(19, 19, skinSh, 3);
    px(25, 19, skinSh, 4);
    px(21, 21, skinSh, 6);
    px(17, 27, skinSh, 1, 2); // crow's feet
    px(31, 26, skinSh, 1, 1);
    px(31, 28, skinSh, 1, 1);
    px(19, 33, skinSh, 1, 3); // nasolabial
    px(29, 33, skinSh, 1, 3);
    px(19, 28, skinSh, 3, 1); // bags
    px(26, 28, skinSh, 3, 1);
  } else if (age === "young") {
    px(28, 31, mix(skin, "#e07a6a", 0.18), 2, 1); // a little color
  }

  /* ---- eyes ---- */
  const eyeY = 25;
  const wide = mood === "afraid" || mood === "nervous";
  const narrow = mood === "angry" || mood === "defensive";
  const lidded = mood === "calm" || mood === "smug";
  const blink = frame.blink ?? 0;
  const gazeX = mood === "nervous" ? -1 : mood === "sad" ? 0 : 1;
  const gazeY = mood === "sad" ? 1 : 0;
  for (const ex of [18, 26]) {
    const lit = ex === 26;
    if (blink === 2) {
      px(ex, eyeY + 1, skinSh, 4, 1);
      px(ex, eyeY + 2, shade(skin, 0.6), 4, 1);
      continue;
    }
    // socket shadow
    px(ex - 1, eyeY - 1, lit ? skin : skinSh, 6, 1);
    const top = eyeY + (wide ? 0 : 1);
    const rows = wide ? 3 : 2;
    px(ex, top, lit ? "#f2ece0" : "#cdc6b8", 4, rows);
    // iris + pupil + catchlight
    const ix = ex + 1 + gazeX;
    const iy = top + (wide ? 1 : 0) + gazeY;
    px(Math.max(ex, Math.min(ex + 2, ix)), Math.min(top + rows - 1, iy), eyeColor, 2, Math.min(2, rows));
    px(Math.max(ex, Math.min(ex + 2, ix)) + (fear ? 1 : 0), Math.min(top + rows - 1, iy) + (fear ? 0 : 1) - (rows === 2 ? 1 : 0), "#0a0806", 1, 1);
    if (lit && !narrow) px(Math.max(ex, Math.min(ex + 2, ix)) + 1, Math.min(top + rows - 1, iy), "#ffffff");
    // upper lid line (heavier when narrowed / lidded / mid-blink)
    px(ex, top - 1, shade(hair, 0.55), 4, 1);
    if (narrow || lidded || blink === 1) px(ex, top, lit ? skin : skinSh, 4, 1);
    if (blink === 1 && rows > 1) px(ex, top + 1, skinSh, 4, 1);
    // lower lid
    px(ex, top + rows, skinSh, 4, 1);
  }

  /* ---- brows ---- */
  const brow = shade(hair === "#c9c2b0" || hair === "#dcd6ca" ? "#8a847a" : hair, 0.85);
  const by0 = eyeY - 3;
  if (mood === "angry" || mood === "defensive") {
    px(18, by0, brow, 4, 1);
    px(26, by0, brow, 4, 1);
    px(21, by0 + 1, brow, 2, 1);
    px(25, by0 + 1, brow, 2, 1);
  } else if (mood === "sad" || mood === "afraid") {
    px(18, by0 + 1, brow, 3, 1);
    px(20, by0, brow, 2, 1);
    px(26, by0, brow, 2, 1);
    px(27, by0 + 1, brow, 3, 1);
  } else if (mood === "smug") {
    px(18, by0 + 1, brow, 4, 1);
    px(26, by0 - 1, brow, 4, 1);
    px(29, by0, brow, 1, 1);
  } else if (mood === "nervous") {
    px(18, by0 - 1, brow, 4, 1);
    px(26, by0 - 1, brow, 4, 1);
  } else {
    px(18, by0, brow, 4, 1);
    px(26, by0, brow, 4, 1);
  }

  /* ---- nose ---- */
  px(24, eyeY + 1, skinHi, 1, 5); // bridge catching the light
  px(22, eyeY + 3, skinSh, 1, 4);
  px(22, eyeY + 7, skinDeep, 4, 1); // under-nose shadow
  px(25, eyeY + 6, skinHi, 1, 1);

  /* ---- mouth ---- */
  const lip = mix(skin, "#8a3a3a", 0.45);
  const lipDark = mix(skin, "#3a1414", 0.6);
  const lipLo = mix(skin, "#b85a5a", 0.25);
  const my = 35;
  const talking = frame.mouth ?? 0;
  if (talking > 0 || fear) {
    const open = fear ? 2 : talking;
    px(21, my - 1, lipDark, 6, 1);
    px(21, my, "#1a0808", 6, open);
    if (open === 2) px(22, my, "#d8d0c4", 4, 1); // teeth
    px(22, my + open, lipLo, 4, 1);
  } else if (mood === "angry") {
    px(20, my, lipDark, 8, 1);
    px(21, my - 1, "#d8d0c4", 6, 1);
    px(20, my - 1, lipDark, 1, 1);
    px(27, my - 1, lipDark, 1, 1);
    px(21, my + 1, lipLo, 6, 1);
  } else if (mood === "sad") {
    px(21, my, lip, 6, 1);
    px(20, my + 1, lip, 1, 1);
    px(27, my + 1, lip, 1, 1);
    px(22, my + 1, lipLo, 4, 1);
  } else if (mood === "smug") {
    px(21, my, lip, 5, 1);
    px(26, my - 1, lip, 2, 1);
    px(22, my + 1, lipLo, 3, 1);
  } else if (mood === "calm") {
    px(21, my, lip, 6, 1);
    px(20, my - 1, lip, 1, 1);
    px(27, my - 1, lip, 1, 1);
    px(22, my + 1, lipLo, 4, 1);
  } else if (mood === "nervous") {
    px(22, my, lip, 2, 1);
    px(24, my + 1, lip, 2, 1);
    px(26, my, lip, 1, 1);
  } else {
    px(21, my, lip, 6, 1);
    px(22, my + 1, lipLo, 4, 1);
  }
  // sweat and color
  if (mood === "nervous" || fear) {
    px(32, 18 + Math.floor(rnd() * 3), "#bfe6f4", 1, 2);
    px(32, 20 + Math.floor(rnd() * 2), "#e8f8ff");
  }
  if (mood === "angry") {
    ctx.fillStyle = "rgba(255, 58, 110,0.32)";
    ctx.fillRect(18, 30 + by, 3, 2);
    ctx.fillRect(28, 30 + by, 3, 2);
  }
  if (mood === "sad") px(19, 29, "#a8d4e8", 1, 3); // a tear on the shadow side

  /* ---- beard ---- */
  if (p.beard) {
    for (let y = 31; y <= 41; y++) {
      const i = y - HEAD_TOP;
      const hw = HEAD_ROWS[Math.min(HEAD_ROWS.length - 1, i)] ?? 2;
      for (let x = CX - hw; x < CX + hw; x++) {
        const inMouth = y >= my - 1 && y <= my + 1 && x >= 21 && x <= 26;
        if (inMouth) continue;
        if (y < 33 && x > 19 && x < 29) continue;
        const sh = x < CX - hw + 4 ? hairSh : (x + y) % 3 === 0 ? hairHi : hair;
        px(x, y, sh);
      }
    }
    px(20, my - 2, hair, 8, 1); // mustache
    px(21, my - 3, hairSh, 6, 1);
  }

  /* ---- hair ---- */
  const hairShape = (rows: [number, number, number][]) => {
    // [y, x0, x1] spans with shading: shadow left, sheen right of center
    for (const [y, x0, x1] of rows) {
      for (let x = x0; x <= x1; x++) {
        const t = (x - x0) / Math.max(1, x1 - x0);
        px(x, y, t < 0.3 ? hairSh : t > 0.62 && t < 0.8 ? hairHi : hair);
      }
    }
  };
  switch (p.hairStyle) {
    case "short":
      hairShape([[11, 18, 30], [12, 16, 32], [13, 15, 33], [14, 14, 34], [15, 14, 34], [16, 14, 21], [16, 28, 34], [17, 14, 17], [17, 31, 34], [18, 14, 16], [18, 32, 33]]);
      for (let y = 19; y < 25; y++) {
        px(14, y, hairSh, 2);
        px(32, y, hair, 2);
      }
      px(22, 13, hairSh, 1, 3); // part
      break;
    case "buzz":
      for (let y = 12; y < 17; y++) {
        const hw = HEAD_ROWS[Math.max(0, y - HEAD_TOP)] ?? 4;
        for (let x = CX - hw; x < CX + hw; x++) if ((x + y) % 2 === 0 || y < 14) px(x, y, x < CX - 4 ? hairSh : hair);
      }
      break;
    case "slick":
      hairShape([[10, 18, 30], [11, 16, 32], [12, 15, 33], [13, 14, 34], [14, 14, 34], [15, 14, 20], [15, 29, 34], [16, 14, 16], [16, 32, 34]]);
      for (let y = 17; y < 23; y++) {
        px(14, y, hairSh, 2);
        px(32, y, hair, 2);
      }
      px(19, 11, hairHi, 10, 1); // pomade shine
      px(26, 12, mix(hairHi, "#ffffff", 0.3), 4, 1);
      break;
    case "curly":
      for (let i = 0; i < 30; i++) {
        const cx = 13 + Math.floor(rnd() * 22);
        const cy = 7 + Math.floor(rnd() * 10);
        px(cx, cy, cx < 20 ? hairSh : hair, 3, 3);
        px(cx + 1, cy, hairHi, 1, 1);
      }
      hairShape([[13, 14, 34], [14, 13, 35], [15, 13, 20], [15, 29, 35], [16, 13, 17], [16, 32, 35], [17, 13, 16], [17, 33, 35]]);
      break;
    case "long":
      hairShape([[9, 18, 30], [10, 15, 33], [11, 13, 35], [12, 12, 35], [13, 12, 35], [14, 12, 22], [14, 26, 35], [15, 12, 18], [15, 30, 35]]);
      for (let y = 16; y < 50; y++) {
        const spread = y > 40 ? Math.min(4, Math.floor((y - 40) / 2)) : 0;
        px(11 - spread, y, hairSh, 5);
        px(12 - spread, y, shade(hairSh, 0.8), 1);
        const rx = 32 + Math.floor(spread / 2);
        px(rx, y, hair, 5);
        px(rx + 2, y, y < 44 ? hairHi : hair, 1);
        px(rx + 4, y, mix(hair, KEY, 0.25), 1);
      }
      break;
    case "bun":
      for (let dy = -4; dy <= 3; dy++)
        for (let dx = -7; dx <= 7; dx++)
          if ((dx * dx) / 49 + (dy * dy) / 14 <= 1) px(CX + 1 + dx, 10 + dy, dx < -2 ? hairSh : dx > 2 && dy < -1 ? hairHi : hair);
      px(CX - 4, 9, hairSh, 9, 1); // wrap line
      hairShape([[11, 17, 31], [12, 15, 33], [13, 14, 34], [14, 14, 34], [15, 14, 19], [15, 30, 34], [16, 14, 16], [16, 32, 34]]);
      for (let y = 17; y < 24; y++) {
        px(14, y, hairSh, 2);
        px(32, y, hair, 2);
      }
      break;
    case "ponytail":
      hairShape([[10, 18, 30], [11, 15, 33], [12, 14, 34], [13, 14, 34], [14, 14, 21], [14, 27, 34], [15, 14, 17], [15, 31, 34]]);
      for (let y = 16; y < 22; y++) {
        px(14, y, hairSh, 2);
        px(32, y, hair, 2);
      }
      for (let y = 14; y < 44; y++) px(35 - Math.floor((y - 14) / 10), y, y % 3 === 0 ? hairHi : hair, 3);
      px(34, 15, p.accent, 2, 2); // tie
      break;
    case "bald":
      px(26, 14, skinHi, 4, 2); // scalp shine
      px(27, 13, mix(skinHi, "#ffffff", 0.3), 2, 1);
      for (let y = 20; y < 28; y++) {
        px(14, y, hairSh, 2);
        px(32, y, hair, 2);
      }
      break;
  }

  /* ---- hats ---- */
  if (p.hat === "fedora") {
    const felt = "#2e2619";
    // the brim's shadow falls across the brow — the most noir thing in the world
    ctx.fillStyle = "rgba(6,4,2,0.42)";
    ctx.fillRect(14, 15 + by, 20, 7);
    for (let y = 4; y < 13; y++) {
      const hw = y < 6 ? 7 : 9;
      px(CX - hw, y, felt, hw * 2);
      px(CX - hw, y, shade(felt, 0.65), 5);
      px(CX + hw - 1, y, mix(felt, KEY, 0.35));
    }
    px(CX - 2, 4, shade(felt, 0.6), 4, 2); // pinch
    px(CX - 9, 10, p.accent, 18, 2); // band
    px(CX - 9, 10, shade(p.accent, 0.6), 5, 2);
    px(CX - 15, 12, felt, 30, 2); // brim
    px(CX - 16, 13, shade(felt, 0.7), 32, 1);
    px(CX + 11, 12, mix(felt, KEY, 0.3), 5, 1);
  } else if (p.hat === "cap") {
    const cl = "#2c2824";
    for (let y = 8; y < 15; y++) px(CX - 10, y, y < 10 ? shade(cl, 1.1) : cl, 20);
    px(CX - 10, 8, shade(cl, 0.7), 5, 7);
    px(CX + 2, 13, shade(cl, 0.8), 13, 2); // short brim
    px(CX + 3, 14, mix(cl, KEY, 0.2), 12, 1);
    px(CX - 1, 7, shade(cl, 1.2), 2, 1);
  } else if (p.hat === "beanie") {
    for (let y = 6; y < 16; y++) {
      const hw = y < 8 ? 8 : 10;
      px(CX - hw, y, p.accent, hw * 2);
      px(CX - hw, y, shade(p.accent, 0.65), 5);
      if (y % 2 === 0 && y < 13) for (let x = CX - hw + 1; x < CX + hw; x += 2) px(x, y, shade(p.accent, 0.85));
    }
    px(CX - 10, 13, shade(p.accent, 0.75), 20, 3); // turn-up
    px(CX - 1, 4, shade(p.accent, 1.2), 3, 2);
  }

  /* ---- glasses ---- */
  if (p.glasses) {
    const fr = "#14181e";
    for (const ex of [17, 25]) {
      px(ex, eyeY - 1, fr, 6, 1);
      px(ex, eyeY + 3, fr, 6, 1);
      px(ex, eyeY, fr, 1, 3);
      px(ex + 5, eyeY, fr, 1, 3);
    }
    px(23, eyeY, fr, 2, 1); // bridge
    px(15, eyeY, fr, 2, 1);
    px(31, eyeY, fr, 2, 1);
    ctx.fillStyle = "rgba(170,220,240,0.22)";
    ctx.fillRect(18, eyeY + by, 4, 3);
    ctx.fillRect(26, eyeY + by, 4, 3);
    px(29, eyeY, "#e8f8ff"); // glint
    px(28, eyeY + 1, "rgba(232,248,255,0.6)");
  }
}

/* ------------------------------------------------------------------ */
/* the component                                                       */
/* ------------------------------------------------------------------ */

export default function Portrait({
  def,
  mood = "neutral",
  seed,
  size = 96,
  className,
  animated = false,
  speaking = false,
  label,
}: {
  def: PortraitDef;
  mood?: Mood;
  seed: string;
  size?: number;
  className?: string;
  /** blink and breathe */
  animated?: boolean;
  /** move the lips (implies animated) */
  speaking?: boolean;
  label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState<PortraitFrame>({});
  const live = animated || speaking;

  // blinking & breathing
  useEffect(() => {
    if (!live) return;
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(() => alive && fn(), ms));
    const blink = () => {
      setFrame((f) => ({ ...f, blink: 1 }));
      later(() => setFrame((f) => ({ ...f, blink: 2 })), 45);
      later(() => setFrame((f) => ({ ...f, blink: 1 })), 125);
      later(() => setFrame((f) => ({ ...f, blink: 0 })), 170);
      later(blink, 2200 + Math.random() * 3800);
    };
    later(blink, 800 + Math.random() * 2400);
    const breathe = setInterval(() => setFrame((f) => ({ ...f, breath: f.breath ? 0 : 1 })), 1700);
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      clearInterval(breathe);
    };
  }, [live]);

  // lips while speaking
  useEffect(() => {
    if (!speaking) {
      setFrame((f) => (f.mouth ? { ...f, mouth: 0 } : f));
      return;
    }
    const id = setInterval(() => {
      setFrame((f) => ({ ...f, mouth: (Math.random() < 0.28 ? 0 : Math.random() < 0.55 ? 1 : 2) as 0 | 1 | 2 }));
    }, 105);
    return () => clearInterval(id);
  }, [speaking]);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    drawPortrait(ctx, def, mood, seed, live ? frame : {});
  }, [def, mood, seed, frame, live]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className={`pixelated ${className ?? ""}`}
      style={{ width: size, height: (size * H) / W }}
      role="img"
      aria-label={label ?? "Character portrait"}
    />
  );
}
