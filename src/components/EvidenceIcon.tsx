"use client";

import type { EvidenceIcon as IconName } from "@/lib/engine/types";
import { SPRITES, SHARED_PALETTE } from "@/lib/icons/sprites";

/**
 * Pixel-art evidence icon. Each sprite is rasterized once into a data URL
 * and shared by every card, tray and board pin that shows it.
 */

const cache = new Map<string, string>();

function spriteUrl(icon: IconName): string {
  const hit = cache.get(icon);
  if (hit) return hit;
  if (typeof document === "undefined") return "";
  const sprite = SPRITES[icon] ?? SPRITES.folder;
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  sprite.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === ".") continue;
      ctx.fillStyle = sprite.palette[ch] ?? SHARED_PALETTE[ch] ?? "#ff00ff";
      ctx.fillRect(x, y, 1, 1);
    }
  });
  const url = canvas.toDataURL();
  cache.set(icon, url);
  return url;
}

export default function EvidenceIcon({
  icon,
  size = 24,
  className = "",
  muted = false,
}: {
  icon: IconName;
  size?: number;
  className?: string;
  muted?: boolean;
}) {
  const url = spriteUrl(icon);
  if (!url) return <span className={className} style={{ width: size, height: size, display: "inline-block" }} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      aria-hidden
      draggable={false}
      width={size}
      height={size}
      className={`pixelated inline-block shrink-0 select-none ${className}`}
      style={{
        width: size,
        height: size,
        filter: muted
          ? "grayscale(1) brightness(0.55)"
          : "drop-shadow(0 1px 0 rgba(0,0,0,0.55)) drop-shadow(0 0 6px rgba(232,168,73,0.12))",
      }}
    />
  );
}
