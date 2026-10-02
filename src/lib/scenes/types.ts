import type { Weather } from "@/lib/engine/types";

/** Every scene is painted at this native resolution and scaled up, pixel-perfect. */
export const SCENE_W = 480;
export const SCENE_H = 270;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LightSpot {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  flicker: number; // 0 steady .. 1 candle
  /** glow radius multiplier for the stage's bloom (default 1) */
  glow?: number;
}

export interface NeonSign {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string; // "rgb(r,g,b)" or hex
  text?: string;
  vertical?: boolean;
}

export interface SmokeSource {
  x: number;
  y: number;
  kind?: "smoke" | "steam";
}

/** A lane something travels along: cars on a road, people on a sidewalk. */
export interface Lane {
  y: number;
  /** sprite scale at this depth */
  scale: number;
  minX?: number;
  maxX?: number;
  /** average seconds between arrivals */
  every?: number;
}

/** A light that blinks on a schedule: aviation beacons, buoys, nav lights. */
export interface Blinker {
  x: number;
  y: number;
  color: string;
  period: number; // seconds
  phase: number; // 0..1
  duty?: number; // fraction of the period it's on
  size?: number;
}

/** A shaft of light — window light on a floor, a lamp's cone. Drawn additively. */
export interface Beam {
  pts: [number, number][];
  color: string;
  alpha: number;
  /** venetian-blind bands across the beam */
  stripes?: number;
  /** dust drifting in the light */
  motes?: boolean;
}

/** A rotating beam: lighthouses, searchlights. Angles in radians. */
export interface Sweep {
  x: number;
  y: number;
  color: string;
  length: number;
  spread: number;
  speed: number; // radians per second
  from: number;
  to: number;
  alpha: number;
}

export interface Mood {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  far: string;
  mid: string;
  near: string;
  glow: string;
  window: string;
  windowCool: string;
  haze: string;
  moon: string;
}

export interface PaintedScene {
  canvas: HTMLCanvasElement;
  lights: LightSpot[];
  neons: NeonSign[];
  smoke: SmokeSource[];
  /** where the sky meets the city */
  horizon: number;
  /** street / floor line: splashes land here, walkers walk here */
  ground: number;
  /** interiors only see weather through `windows` */
  interior: boolean;
  windows: Rect[];
  roads: Lane[];
  walks: Lane[];
  blinkers: Blinker[];
  beams: Beam[];
  sweeps: Sweep[];
  /** surfaces are wet: reflections were painted, splashes belong here */
  wet: boolean;
  /** the ground is hard enough to mirror lights when wet (not lawns, not forest floor) */
  reflective: boolean;
}

export type Painter = (
  ctx: CanvasRenderingContext2D,
  mood: Mood,
  weather: Weather,
  rnd: () => number,
  out: PaintedScene
) => void;
