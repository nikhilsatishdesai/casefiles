"use client";

import { useEffect, useRef } from "react";

/**
 * Escape-key layers. Every open modal registers a layer; Esc closes the
 * topmost one before the game's own back-navigation ever sees the key.
 */

const layers: { current: () => void }[] = [];

export function useEscapeLayer(active: boolean, onEscape: () => void) {
  const ref = useRef(onEscape);
  ref.current = onEscape;
  useEffect(() => {
    if (!active) return;
    const layer = { current: () => ref.current() };
    layers.push(layer);
    return () => {
      const i = layers.lastIndexOf(layer);
      if (i >= 0) layers.splice(i, 1);
    };
  }, [active]);
}

/** Closes the topmost layer. Returns false when no modal is open. */
export function popEscapeLayer(): boolean {
  const top = layers[layers.length - 1];
  if (!top) return false;
  top.current();
  return true;
}

export function hasEscapeLayer(): boolean {
  return layers.length > 0;
}
