"use client";

import { useEffect, useRef } from "react";
import type { Mood, PortraitDef } from "@/lib/engine/types";
import { rngFor } from "@/lib/engine/rng";

/**
 * Pixel portrait renderer.
 *
 * Every character in Veilport is drawn deterministically from their
 * PortraitDef onto a 48×64 canvas — noir bust lighting, mood-driven
 * expressions, and a signature accent color per person.
 */

const W = 48;
const H = 64;

function hexToRgb(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(c: string, f: number): string {
  const [r, g, b] = hexToRgb(c);
  return `rgb(${Math.min(255, Math.round(r * f))},${Math.min(255, Math.round(g * f))},${Math.min(255, Math.round(b * f))})`;
}

export function drawPortrait(
  ctx: CanvasRenderingContext2D,
  p: PortraitDef,
  mood: Mood,
  seed: string
) {
  const rnd = rngFor(`portrait:${seed}`);
  ctx.clearRect(0, 0, W, H);

  // backdrop: dark with venetian-blind light bars
  ctx.fillStyle = "#0c1018";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(232,168,73,0.10)";
  for (let i = 0; i < 5; i++) ctx.fillRect(0, 4 + i * 12, W, 4);
  ctx.fillStyle = "rgba(4,6,10,0.5)";
  ctx.fillRect(0, 0, 6, H);

  const skin = p.skin;
  const skinShadow = shade(skin, 0.72);
  const hair = p.hair;
  const cx = 24;

  /* ---- shoulders / outfit ---- */
  const outfitBase: Record<PortraitDef["outfit"], string> = {
    coat: "#3a3226",
    suit: "#232030",
    uniform: "#26344a",
    sweater: "#4a3a2c",
    dress: "#3c2438",
    apron: "#2e2a26",
    labcoat: "#c8ccd0",
    vest: "#38302a",
  };
  const oc = outfitBase[p.outfit];
  ctx.fillStyle = oc;
  ctx.fillRect(6, 46, 36, 18);
  ctx.fillRect(9, 42, 30, 6);
  // shading
  ctx.fillStyle = shade(oc, 0.7);
  ctx.fillRect(6, 46, 8, 18);
  ctx.fillStyle = shade(oc, 1.25);
  ctx.fillRect(34, 46, 8, 18);
  // lapels / collar detail
  if (p.outfit === "suit" || p.outfit === "coat" || p.outfit === "vest") {
    ctx.fillStyle = shade(oc, 0.55);
    ctx.fillRect(18, 46, 4, 12);
    ctx.fillRect(26, 46, 4, 12);
    ctx.fillStyle = "#e8e2d4";
    ctx.fillRect(22, 46, 4, 6);
    ctx.fillStyle = p.accent;
    ctx.fillRect(22, 50, 4, 10);
  } else if (p.outfit === "labcoat") {
    ctx.fillStyle = "#9aa0a8";
    ctx.fillRect(18, 46, 3, 14);
    ctx.fillRect(27, 46, 3, 14);
    ctx.fillStyle = p.accent;
    ctx.fillRect(22, 47, 4, 8);
  } else if (p.outfit === "uniform") {
    ctx.fillStyle = shade(oc, 1.4);
    ctx.fillRect(10, 48, 3, 3);
    ctx.fillRect(35, 48, 3, 3);
    ctx.fillStyle = "#c9a22e";
    ctx.fillRect(14, 52, 2, 2);
  } else if (p.outfit === "apron") {
    ctx.fillStyle = p.accent;
    ctx.fillRect(16, 50, 16, 14);
    ctx.fillStyle = shade(p.accent, 0.7);
    ctx.fillRect(16, 50, 16, 2);
  } else if (p.outfit === "dress") {
    ctx.fillStyle = p.accent;
    ctx.fillRect(20, 46, 8, 4);
  } else if (p.outfit === "sweater") {
    ctx.fillStyle = shade(oc, 1.3);
    ctx.fillRect(14, 44, 20, 3);
  }

  /* ---- neck & head ---- */
  ctx.fillStyle = skinShadow;
  ctx.fillRect(20, 38, 8, 8);
  ctx.fillStyle = skin;
  ctx.fillRect(15, 14, 18, 26);
  // jaw rounding
  ctx.fillStyle = "#0c1018";
  ctx.fillRect(15, 36, 2, 4);
  ctx.fillRect(31, 36, 2, 4);
  ctx.fillRect(15, 14, 1, 2);
  ctx.fillRect(32, 14, 1, 2);
  // face shading (left in shadow — noir key light from right)
  ctx.fillStyle = skinShadow;
  ctx.fillRect(15, 16, 4, 22);
  ctx.fillRect(19, 34, 10, 3);
  // ears
  ctx.fillStyle = skin;
  ctx.fillRect(13, 24, 2, 5);
  ctx.fillRect(33, 24, 2, 5);
  if (p.earrings) {
    ctx.fillStyle = "#e8d88a";
    ctx.fillRect(13, 29, 2, 2);
    ctx.fillRect(33, 29, 2, 2);
  }

  // age lines
  if (p.age === "old") {
    ctx.fillStyle = skinShadow;
    ctx.fillRect(19, 30, 2, 1);
    ctx.fillRect(27, 30, 2, 1);
    ctx.fillRect(22, 21, 5, 1);
  }

  /* ---- eyes & expression ---- */
  const eyeY = 24;
  const wide = mood === "afraid" || mood === "nervous";
  ctx.fillStyle = "#f4f0e6";
  ctx.fillRect(19, eyeY, 4, wide ? 4 : 3);
  ctx.fillRect(26, eyeY, 4, wide ? 4 : 3);
  ctx.fillStyle = "#141210";
  const look = mood === "nervous" ? 0 : 1;
  ctx.fillRect(20 + look, eyeY + 1, 2, 2);
  ctx.fillRect(27 + look, eyeY + 1, 2, 2);
  if (mood === "calm" || mood === "smug") {
    ctx.fillStyle = skin;
    ctx.fillRect(19, eyeY, 4, 1);
    ctx.fillRect(26, eyeY, 4, 1);
  }
  // brows
  ctx.fillStyle = shade(hair, 0.9);
  if (mood === "angry" || mood === "defensive") {
    ctx.fillRect(19, eyeY - 3, 4, 2);
    ctx.fillRect(26, eyeY - 3, 4, 2);
    ctx.fillRect(22, eyeY - 2, 2, 1);
    ctx.fillRect(25, eyeY - 2, 2, 1);
  } else if (mood === "sad" || mood === "afraid") {
    ctx.fillRect(19, eyeY - 2, 4, 1);
    ctx.fillRect(26, eyeY - 2, 4, 1);
    ctx.fillRect(19, eyeY - 3, 2, 1);
    ctx.fillRect(28, eyeY - 3, 2, 1);
  } else {
    ctx.fillRect(19, eyeY - 3, 4, 1);
    ctx.fillRect(26, eyeY - 3, 4, 1);
  }
  // nose
  ctx.fillStyle = skinShadow;
  ctx.fillRect(23, eyeY + 4, 2, 4);
  // mouth
  ctx.fillStyle = "#5e3a38";
  if (mood === "afraid") {
    ctx.fillRect(22, 33, 5, 3);
  } else if (mood === "angry") {
    ctx.fillRect(21, 34, 7, 1);
    ctx.fillRect(20, 33, 2, 1);
    ctx.fillRect(27, 33, 2, 1);
  } else if (mood === "sad") {
    ctx.fillRect(21, 34, 6, 1);
    ctx.fillRect(20, 35, 2, 1);
    ctx.fillRect(26, 35, 2, 1);
  } else if (mood === "smug") {
    ctx.fillRect(22, 34, 5, 1);
    ctx.fillRect(26, 33, 2, 1);
  } else {
    ctx.fillRect(21, 34, 6, 1);
  }
  // nervous sweat
  if (mood === "nervous" || mood === "afraid") {
    ctx.fillStyle = "#9fd8e8";
    ctx.fillRect(33, 18 + Math.floor(rnd() * 3), 1, 2);
  }
  // blush of anger
  if (mood === "angry") {
    ctx.fillStyle = "rgba(224,92,110,0.35)";
    ctx.fillRect(18, 29, 3, 2);
    ctx.fillRect(28, 29, 3, 2);
  }

  /* ---- beard ---- */
  if (p.beard) {
    ctx.fillStyle = hair;
    ctx.fillRect(17, 31, 3, 7);
    ctx.fillRect(28, 31, 3, 7);
    ctx.fillRect(18, 36, 12, 4);
    ctx.fillStyle = "#5e3a38";
    ctx.fillRect(21, 34, 6, 1);
  }

  /* ---- hair ---- */
  ctx.fillStyle = hair;
  switch (p.hairStyle) {
    case "short":
      ctx.fillRect(14, 11, 20, 6);
      ctx.fillRect(14, 15, 3, 8);
      ctx.fillRect(31, 15, 3, 8);
      break;
    case "buzz":
      ctx.fillRect(15, 12, 18, 4);
      break;
    case "slick":
      ctx.fillRect(14, 10, 20, 6);
      ctx.fillRect(14, 14, 2, 7);
      ctx.fillRect(32, 14, 2, 7);
      ctx.fillStyle = shade(hair, 1.5);
      ctx.fillRect(16, 11, 16, 1);
      break;
    case "curly":
      for (let i = 0; i < 22; i++) {
        ctx.fillRect(13 + Math.floor(rnd() * 22), 8 + Math.floor(rnd() * 8), 3, 3);
      }
      ctx.fillRect(14, 12, 20, 5);
      break;
    case "long":
      ctx.fillRect(13, 10, 22, 7);
      ctx.fillRect(12, 14, 4, 28);
      ctx.fillRect(32, 14, 4, 28);
      ctx.fillRect(11, 38, 6, 8);
      ctx.fillRect(31, 38, 6, 8);
      break;
    case "bun":
      ctx.fillRect(14, 10, 20, 7);
      ctx.fillRect(14, 15, 2, 8);
      ctx.fillRect(32, 15, 2, 8);
      ctx.fillRect(19, 5, 10, 6);
      break;
    case "ponytail":
      ctx.fillRect(14, 10, 20, 7);
      ctx.fillRect(14, 15, 2, 6);
      ctx.fillRect(32, 15, 2, 6);
      ctx.fillRect(33, 16, 4, 20);
      ctx.fillRect(34, 36, 3, 6);
      break;
    case "bald":
      ctx.fillStyle = skinShadow;
      ctx.fillRect(15, 13, 3, 4);
      ctx.fillStyle = hair;
      ctx.fillRect(14, 20, 2, 6);
      ctx.fillRect(32, 20, 2, 6);
      break;
  }

  /* ---- hat ---- */
  if (p.hat === "fedora") {
    ctx.fillStyle = "#2c2418";
    ctx.fillRect(11, 12, 26, 3);
    ctx.fillRect(14, 5, 20, 8);
    ctx.fillStyle = "#1c1810";
    ctx.fillRect(14, 10, 20, 2);
    ctx.fillStyle = p.accent;
    ctx.fillRect(14, 9, 20, 1);
  } else if (p.hat === "cap") {
    ctx.fillStyle = "#2a2622";
    ctx.fillRect(14, 9, 20, 6);
    ctx.fillRect(28, 13, 9, 2);
  } else if (p.hat === "beanie") {
    ctx.fillStyle = p.accent;
    ctx.fillRect(14, 8, 20, 8);
    ctx.fillStyle = shade(p.accent, 0.7);
    ctx.fillRect(14, 14, 20, 2);
  }

  /* ---- glasses ---- */
  if (p.glasses) {
    ctx.fillStyle = "#141a20";
    ctx.strokeStyle = "#141a20";
    ctx.fillRect(18, eyeY - 1, 6, 1);
    ctx.fillRect(25, eyeY - 1, 6, 1);
    ctx.fillRect(18, eyeY + 3, 6, 1);
    ctx.fillRect(25, eyeY + 3, 6, 1);
    ctx.fillRect(18, eyeY, 1, 3);
    ctx.fillRect(23, eyeY, 1, 3);
    ctx.fillRect(25, eyeY, 1, 3);
    ctx.fillRect(30, eyeY, 1, 3);
    ctx.fillRect(24, eyeY, 1, 1);
    ctx.fillStyle = "rgba(159,216,232,0.28)";
    ctx.fillRect(19, eyeY, 4, 3);
    ctx.fillRect(26, eyeY, 4, 3);
  }

  /* ---- rim light (right key light) ---- */
  ctx.fillStyle = "rgba(232,168,73,0.45)";
  ctx.fillRect(33, 16, 1, 20);
  ctx.fillRect(41, 46, 1, 16);
  ctx.fillStyle = "rgba(232,168,73,0.2)";
  ctx.fillRect(32, 14, 1, 3);
}

export default function Portrait({
  def,
  mood = "neutral",
  seed,
  size = 96,
  className,
}: {
  def: PortraitDef;
  mood?: Mood;
  seed: string;
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    drawPortrait(ctx, def, mood, seed);
  }, [def, mood, seed]);
  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className={`pixelated ${className ?? ""}`}
      style={{ width: size, height: (size * H) / W }}
      role="img"
      aria-label="Character portrait"
    />
  );
}
