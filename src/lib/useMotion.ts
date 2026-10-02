"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/engine/store";

/** Reduced motion, honored from both the OS and the in-game setting. */
export function useReducedMotionPref(): boolean {
  const setting = useGame((s) => s.settings.reducedMotion);
  const [os, setOs] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setOs(mq.matches);
    const onChange = () => setOs(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return setting || os;
}

/** Characters per second for revealed dialogue; Infinity means instant. */
export function useTextCps(): number {
  const speed = useGame((s) => s.settings.textSpeed);
  const reduce = useReducedMotionPref();
  if (reduce || speed === "instant") return Infinity;
  return speed === "slow" ? 28 : speed === "fast" ? 110 : 55;
}
