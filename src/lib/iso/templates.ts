import type { IsoProp, IsoTemplate, PropKind, Slot, WallDecor } from "./types";

/**
 * Every place in Veilport, as an iso diorama.
 *
 * Coordinates are tiles: x runs down-right along the right-hand wall, y runs
 * down-left along the left-hand wall; (0,0) is the back corner. Props and
 * wall decor carry a `slot` — the spot, in the side-view percent coordinates
 * that case files use for hotspots, of the thing they stand for — so a
 * case's "Concierge desk" at 14,62 finds the concierge counter here.
 */

type Extra = Partial<Omit<IsoProp, "id" | "kind" | "x" | "y">> & { at?: [number, number] };

function P(kind: PropKind, x: number, y: number, o: Extra = {}): IsoProp {
  const { at, ...rest } = o;
  return { id: kind, kind, x, y, ...rest, ...(at ? { slot: { rx: at[0], ry: at[1] } } : {}) };
}

function D(wall: "left" | "right", at: number, kind: WallDecor["kind"], o: Partial<WallDecor> & { slotAt?: [number, number] } = {}): WallDecor {
  const { slotAt, ...rest } = o;
  const slot: Slot | undefined = slotAt ? { rx: slotAt[0], ry: slotAt[1] } : undefined;
  return { wall, at, kind, ...rest, ...(slot ? { slot } : {}) };
}

/** a round table with chairs turned toward it */
function tableSet(x: number, y: number, cloth: string, chair: string, sides = "nsew"): IsoProp[] {
  const out = [P("roundTable", x, y, { color: cloth })];
  if (sides.includes("w")) out.push(P("chair", x - 1, y, { color: chair, face: "x" }));
  if (sides.includes("e")) out.push(P("chair", x + 1, y, { color: chair, face: "x", variant: 1 }));
  if (sides.includes("n")) out.push(P("chair", x, y - 1, { color: chair }));
  if (sides.includes("s")) out.push(P("chair", x, y + 1, { color: chair, variant: 1 }));
  return out;
}

/* ------------------------------------------------------------------ */
/* Hotel Meridian — the Grand Ballroom                                 */
/* ------------------------------------------------------------------ */

const hotel = (): IsoTemplate => ({
  w: 12,
  h: 10,
  floor: "parquet",
  zones: [
    { x: 3, y: 1, w: 6, h: 5, kind: "rug", color: "#8a1240" },
    { x: 0, y: 6, w: 3, h: 4, kind: "marble" },
  ],
  wallLeft: "panel",
  wallRight: "panel",
  wallColor: "#4a1e3e",
  wallH: 88,
  props: [
    P("piano", 5, 2, { w: 2, d: 2, at: [46, 58] }),
    P("thermos", 6.2, 3.1, { z: 22, at: [55, 50] }),
    P("musicStand", 4, 2, { at: [42, 48] }),
    P("counter", 1, 6, { w: 1, d: 3, color: "#2a1a3a", accent: "#e8c8a0", at: [14, 62] }),
    P("phone", 1.1, 6.3, { z: 21 }),
    P("basket", 3, 8, { at: [26, 66] }),
    ...tableSet(9, 4, "#1a6a8a", "#ff2e88", "wse"),
    ...tableSet(9, 7, "#1a6a8a", "#ff2e88", "nwe"),
    P("floorLamp", 11, 1, { color: "#ff2e88" }),
    P("floorLamp", 3, 1, { color: "#ffb43d" }),
    P("plant", 0, 4),
    P("plant", 7, 0),
    P("armchair", 0, 1, { color: "#2a8a8a", face: "x" }),
  ],
  decor: [
    D("right", 1, "painting", { span: 2, color: "#ffb43d" }),
    D("right", 4, "door", { color: "#2aa878", text: "GREEN ROOM", slotAt: [78, 44] }),
    D("right", 8, "window", { span: 2, slotAt: [90, 30] }),
    D("right", 10, "neon", { span: 2, text: "MERIDIAN", color: "#ff3a9a", v: 62 }),
    D("left", 2, "door", { color: "#5a6a8a", text: "SECURITY", slotAt: [8, 40] }),
    D("left", 4, "painting", { span: 2, color: "#5af0ff" }),
    D("left", 7, "neon", { span: 2, text: "BAR", color: "#3af0ff", v: 58 }),
  ],
  lights: [
    { x: 6, y: 3, z: 96, color: "#ffd9a0", radius: 4.6, intensity: 1 },
    { x: 9.5, y: 4.5, z: 18, color: "#ffb060", radius: 2.2, intensity: 0.55 },
    { x: 9.5, y: 7.5, z: 18, color: "#ffb060", radius: 2.2, intensity: 0.55 },
    { x: 11.5, y: 1.5, z: 40, color: "#ff2e88", radius: 3.4, intensity: 0.8 },
    { x: 3.5, y: 1.5, z: 40, color: "#ffb43d", radius: 3, intensity: 0.7 },
    { x: 1.5, y: 7.5, z: 30, color: "#b06aff", radius: 3, intensity: 0.5 },
  ],
  spawn: [6, 7],
  exit: [6, 9],
  npc: [
    [0.5, 7.5],
    [7.5, 5.5],
    [4.5, 6.5],
  ],
  ambient: "#30285a",
});

/* ------------------------------------------------------------------ */
/* Hotel Meridian — Executive Suite 9                                  */
/* ------------------------------------------------------------------ */

const suite = (): IsoTemplate => ({
  w: 10,
  h: 9,
  floor: "carpet",
  floorColor: "#4a1e5a",
  zones: [{ x: 3, y: 4, w: 4, h: 4, kind: "rug", color: "#1a5a6a" }],
  wallLeft: "panel",
  wallRight: "glass",
  wallColor: "#3a1838",
  wallH: 88,
  props: [
    P("bed", 0, 2, { w: 3, d: 2, color: "#e8dcf0", accent: "#8a1e4a" }),
    P("table", 0, 1, { color: "#4a2418" }),
    P("deskLamp", 0, 1, { z: 16, color: "#8a1e4a" }),
    P("desk", 5, 1, { w: 2, d: 1, variant: 0, color: "#3a2018" }),
    P("fileBox", 5.2, 1.2, { z: 17, at: [66, 54] }),
    P("chair", 5.5, 2, { color: "#2a1a2a", solid: false, variant: 1 }),
    P("sofa", 4, 6, { w: 2, d: 1, color: "#1e7a8a" }),
    P("table", 4.2, 5, { w: 1.6, d: 0.8, color: "#2a1418" }),
    P("counter", 8, 4, { w: 1, d: 2, color: "#2a1a3a", accent: "#ff4fa8" }),
    P("kettle", 8.2, 4.3, { z: 21 }),
    P("floorLamp", 9, 1, { color: "#ff2e88" }),
    P("plant", 3, 0),
    P("plant", 9, 7),
    P("armchair", 7, 7, { color: "#ff2e88" }),
  ],
  decor: [
    D("left", 5, "painting", { span: 2, color: "#ff4fa8" }),
    D("left", 7, "door", { color: "#6a2a4a", text: "SUITE 9" }),
  ],
  lights: [
    { x: 6, y: 1.5, z: 26, color: "#ffd27a", radius: 3, intensity: 0.85 },
    { x: 9.5, y: 1.5, z: 40, color: "#ff2e88", radius: 3.6, intensity: 0.85 },
    { x: 5, y: 0.4, z: 44, color: "#6a7aff", radius: 5.5, intensity: 0.55 },
    { x: 0.5, y: 1.5, z: 24, color: "#ffb060", radius: 2.8, intensity: 0.7 },
    { x: 7.5, y: 7.5, z: 20, color: "#b06aff", radius: 2.6, intensity: 0.4 },
  ],
  spawn: [2, 6],
  exit: [2, 8],
  npc: [
    [8.5, 2.5],
    [6.5, 4.5],
  ],
  ambient: "#2c2254",
});

/* ------------------------------------------------------------------ */
/* City Morgue — Examination Room 2                                    */
/* ------------------------------------------------------------------ */

const morgue = (): IsoTemplate => ({
  w: 10,
  h: 8,
  floor: "tile",
  floorColor: "#3a6a74",
  zones: [{ x: 2, y: 2, w: 4, h: 3, kind: "linoleum", color: "#2e5a64" }],
  wallLeft: "tile",
  wallRight: "tile",
  wallColor: "#3e6e7e",
  wallH: 84,
  props: [
    P("drawers", 0, 1, { w: 1, d: 4, color: "#8a9cb0" }),
    P("examTable", 3, 3, { w: 2, d: 1 }),
    P("pendant", 3.5, 3, { color: "#e0f4ff", accent: "#5a6878", variant: 1 }),
    P("table", 6, 3, { color: "#5a6878", variant: 1 }),
    P("fileBox", 6.1, 3.1, { z: 16, at: [70, 55] }),
    P("sink", 4, 0, { w: 1, d: 1 }),
    P("counter", 6, 0, { w: 3, d: 1, color: "#5a6878", accent: "#c8d4e0" }),
    P("kettle", 8.1, 0.2, { z: 21, at: [88, 40] }),
    P("cabinet", 2, 0, { color: "#7a8aa0" }),
    P("desk", 7, 5, { w: 2, d: 1, variant: 1, color: "#4a3a3a" }),
    P("deskLamp", 8.3, 5.1, { z: 17, color: "#2a6a4a" }),
    P("cooler", 9, 2),
    P("radiator", 0, 6, { w: 1, d: 1 }),
  ],
  decor: [
    D("right", 1, "clock", { v: 62 }),
    D("right", 3, "sign", { span: 2, text: "EXAM 2", v: 64 }),
    D("left", 6, "door", { color: "#2a6a5a", text: "EXIT" }),
    D("left", 1, "panel", { v: 50 }),
  ],
  lights: [
    { x: 4, y: 3.5, z: 72, color: "#e0f4ff", radius: 4.4, intensity: 1 },
    { x: 8.5, y: 0.7, z: 24, color: "#ffb060", radius: 2.8, intensity: 0.85 },
    { x: 0.3, y: 6.5, z: 62, color: "#3aff8a", radius: 3, intensity: 0.6 },
    { x: 0.6, y: 3, z: 40, color: "#5ab8ff", radius: 3.2, intensity: 0.5 },
    { x: 8, y: 5.4, z: 26, color: "#ffd27a", radius: 2.4, intensity: 0.7 },
  ],
  spawn: [4, 6],
  exit: [4, 7],
  npc: [
    [5.5, 4.5],
    [7.5, 2.5],
  ],
  ambient: "#1c2c48",
});

/* ------------------------------------------------------------------ */
/* Precinct Seven — the detectives' floor                              */
/* ------------------------------------------------------------------ */

const precinct = (): IsoTemplate => ({
  w: 12,
  h: 10,
  floor: "linoleum",
  floorColor: "#2e5a56",
  wallLeft: "plaster",
  wallRight: "plaster",
  wallColor: "#34426a",
  wallH: 88,
  props: [
    P("desk", 1, 6, { w: 1, d: 2, variant: 2, at: [20, 60] }),
    P("cabinet", 0, 2, { face: "x" }),
    P("cabinet", 0, 3, { face: "x" }),
    P("cabinet", 0, 4, { face: "x", color: "#5a6a82" }),
    P("desk", 4, 7, { w: 2, d: 1, variant: 3, color: "#5a3420", at: [40, 70] }),
    P("chair", 4.5, 6, { color: "#2a3a4a", solid: false }),
    P("terminal", 5, 1, { at: [50, 41] }),
    P("chair", 5, 2, { color: "#2a3a4a", solid: false, variant: 1 }),
    P("lightTable", 8, 3, { w: 2, d: 1, at: [74, 52] }),
    P("desk", 8, 6, { w: 2, d: 1, variant: 1 }),
    P("chair", 8.5, 5, { color: "#2a3a4a", solid: false }),
    P("radiator", 2, 0, { w: 2, d: 1 }),
    P("cooler", 11, 2),
    P("coatRack", 11, 4, { color: "#8a6a4a" }),
    P("plant", 11, 0),
    P("bookcase", 7, 0, { w: 2, d: 1, color: "#3a2a2a", variant: 3 }),
  ],
  decor: [
    D("right", 2, "window", { span: 2 }),
    D("right", 4, "board", { span: 3, v: 50 }),
    D("right", 10, "clock", { v: 64 }),
    D("left", 1, "neon", { span: 2, text: "VPD", color: "#3a8aff", v: 66 }),
    D("left", 6, "door", { color: "#2c4a6e", text: "CAPTAIN" }),
    D("left", 8, "poster", { color: "#ff4fa8" }),
  ],
  lights: [
    { x: 4, y: 4, z: 92, color: "#cfe8ff", radius: 5, intensity: 0.7 },
    { x: 9, y: 4, z: 26, color: "#bfe8ff", radius: 3, intensity: 0.85 },
    { x: 5.5, y: 1.6, z: 22, color: "#3aff8a", radius: 2.6, intensity: 0.65 },
    { x: 3, y: 0.3, z: 50, color: "#ff4fa8", radius: 3.4, intensity: 0.55 },
    { x: 5.4, y: 7.3, z: 26, color: "#ffd27a", radius: 2.6, intensity: 0.8 },
    { x: 9, y: 6.3, z: 26, color: "#ffd27a", radius: 2.4, intensity: 0.7 },
    { x: 1.5, y: 6.5, z: 26, color: "#ffd27a", radius: 2.4, intensity: 0.7 },
  ],
  spawn: [6, 8],
  exit: [6, 9],
  npc: [
    [7.5, 3.5],
    [3.5, 4.5],
  ],
  ambient: "#222a50",
});

/* ------------------------------------------------------------------ */
/* The Blue Hour                                                       */
/* ------------------------------------------------------------------ */

const bar = (): IsoTemplate => ({
  w: 12,
  h: 9,
  floor: "checker",
  floorColor: "#1c7a78",
  zones: [{ x: 6, y: 3, w: 5, h: 5, kind: "wood", color: "#5a2a1c" }],
  wallLeft: "brick",
  wallRight: "panel",
  wallColor: "#5a2244",
  wallH: 90,
  props: [
    P("barShelf", 0, 2, { w: 1, d: 5 }),
    P("bar", 2, 2, { w: 1, d: 5, at: [30, 55] }),
    P("stool", 3, 2, { color: "#ff2e88" }),
    P("stool", 3, 4, { color: "#ff2e88" }),
    P("stool", 3, 6, { color: "#ff2e88" }),
    ...tableSet(8, 5, "#1e7a3a", "#3a1a2a", "nsew").map((p, i) => (i === 0 ? { ...p, slot: { rx: 72, ry: 55 } } : p)),
    P("papers", 8.2, 5.2, { z: 16 }),
    P("pendant", 8, 5, { color: "#7aff9a", accent: "#1e5a3a" }),
    P("pendant", 2, 3, { color: "#ffc46b", accent: "#8a1e4a", variant: 1 }),
    P("pendant", 2, 5, { color: "#ffc46b", accent: "#8a1e4a", variant: 1 }),
    P("jukebox", 10, 0, { at: [82, 48] }),
    P("sofa", 5, 0, { w: 2, d: 1, color: "#8a1e4a" }),
    P("roundTable", 5.5, 1.2, { w: 1, d: 1, color: "#2a1a2a", solid: true }),
    P("plant", 11, 3),
    P("recordPlayer", 8, 0, { color: "#3a1a2a" }),
  ],
  decor: [
    D("right", 1, "neon", { span: 4, text: "THE BLUE HOUR", color: "#3af0ff", v: 66 }),
    D("right", 6, "window", { span: 2 }),
    D("left", 1, "neon", { span: 3, text: "JAZZ", color: "#ff2e88", v: 72 }),
    D("left", 7, "door", { color: "#3a2a4a", text: "OFFICE" }),
    D("right", 9, "poster", { color: "#ffb43d", v: 60 }),
  ],
  lights: [
    { x: 2.5, y: 3.5, z: 70, color: "#ffc46b", radius: 3.4, intensity: 0.85 },
    { x: 2.5, y: 5.5, z: 70, color: "#ffc46b", radius: 3, intensity: 0.7 },
    { x: 8.5, y: 5.5, z: 66, color: "#7aff9a", radius: 3.2, intensity: 0.85 },
    { x: 10.5, y: 1.2, z: 24, color: "#ff2e88", radius: 3.6, intensity: 0.85 },
    { x: 6, y: 1.6, z: 18, color: "#ffb060", radius: 2, intensity: 0.6 },
    { x: 6.5, y: 0.3, z: 50, color: "#5a8aff", radius: 3, intensity: 0.5 },
  ],
  spawn: [5, 6],
  exit: [5, 8],
  npc: [
    [1.5, 4.5],
    [9.5, 2.5],
    [4.5, 4.5],
  ],
  ambient: "#261c4a",
});

/* ------------------------------------------------------------------ */
/* Financial District — Meer Artist Management, 14th floor             */
/* ------------------------------------------------------------------ */

const highrise = (): IsoTemplate => ({
  w: 10,
  h: 9,
  floor: "carpet",
  floorColor: "#3a4a6e",
  zones: [{ x: 3, y: 5, w: 4, h: 3, kind: "rug", color: "#6a2a6a" }],
  wallLeft: "plaster",
  wallRight: "glass",
  wallColor: "#3e3e66",
  wallH: 90,
  props: [
    P("desk", 4, 4, { w: 2, d: 1, variant: 0, color: "#2a2a3a", at: [40, 62] }),
    P("chair", 4.5, 3, { color: "#1a1a2a", solid: false }),
    P("coatRack", 0, 2, { color: "#c8b090", accent: "#ff2e88", at: [12, 44] }),
    P("cabinet", 7, 4, { color: "#6a7a96", at: [70, 58] }),
    P("shelf", 8, 0, { w: 2, d: 1, at: [88, 36] }),
    P("sofa", 0, 5, { w: 1, d: 2, color: "#e0e4f0" }),
    P("table", 1.4, 5.3, { w: 0.8, d: 1.4, color: "#1a1a2a" }),
    P("plant", 0, 0),
    P("plant", 9, 7),
    P("floorLamp", 9, 3, { color: "#3af0ff" }),
    P("armchair", 5, 7, { color: "#ff2e88" }),
  ],
  decor: [
    D("left", 1, "poster", { color: "#ff4fa8", v: 50 }),
    D("left", 3, "poster", { color: "#3af0ff", v: 50 }),
    D("left", 7, "door", { color: "#4a4a6a", text: "MEER" }),
  ],
  lights: [
    { x: 5.4, y: 4.3, z: 26, color: "#ffd27a", radius: 3, intensity: 0.85 },
    { x: 5, y: 0.4, z: 50, color: "#7a6aff", radius: 5.5, intensity: 0.6 },
    { x: 8.5, y: 0.5, z: 30, color: "#ff4fa8", radius: 3, intensity: 0.6 },
    { x: 9.5, y: 3.5, z: 40, color: "#3af0ff", radius: 3.2, intensity: 0.75 },
    { x: 1, y: 6, z: 30, color: "#b06aff", radius: 2.6, intensity: 0.4 },
  ],
  spawn: [4, 7],
  exit: [4, 8],
  npc: [
    [5.5, 3.3],
    [2.5, 3.5],
  ],
  ambient: "#262650",
});

/* ------------------------------------------------------------------ */
/* Rowan Heights — Hartwell House                                      */
/* ------------------------------------------------------------------ */

const apartment = (): IsoTemplate => ({
  w: 10,
  h: 9,
  floor: "wood",
  floorColor: "#6a3a24",
  zones: [{ x: 2, y: 3, w: 4, h: 4, kind: "rug", color: "#1a6a7a" }],
  wallLeft: "plaster",
  wallRight: "plaster",
  wallColor: "#4e2e52",
  wallH: 86,
  props: [
    P("fireplace", 0, 3, { w: 1, d: 2 }),
    P("armchair", 2, 2, { color: "#8a1e4a" }),
    P("armchair", 2, 6, { color: "#8a1e4a", face: "x" }),
    P("table", 3, 4, { color: "#4a2418" }),
    P("desk", 7, 3, { w: 2, d: 1, variant: 0, color: "#5a2a1a", at: [68, 56] }),
    P("chair", 7.5, 2, { color: "#3a1a1a", solid: false }),
    P("bookcase", 2, 0, { w: 2, d: 1 }),
    P("grandClock", 5, 0),
    P("recordPlayer", 0, 0),
    P("plant", 9, 0),
    P("floorLamp", 0, 7, { color: "#ff4fa8" }),
    P("sofa", 5, 6, { w: 2, d: 1, color: "#2a6a8a" }),
  ],
  decor: [
    D("left", 1, "poster", { color: "#ff2e88", v: 50, slotAt: [30, 38] }),
    D("left", 6, "window", { span: 2 }),
    D("right", 6, "window", { span: 2 }),
    D("right", 8, "frame", { color: "#ffb43d" }),
    D("left", 5, "frame", { color: "#3af0ff", v: 60 }),
  ],
  lights: [
    { x: 1.2, y: 4, z: 16, color: "#ff7a2a", radius: 4.2, intensity: 0.95 },
    { x: 8.2, y: 3.2, z: 26, color: "#ffd27a", radius: 2.6, intensity: 0.8 },
    { x: 6.5, y: 0.3, z: 50, color: "#6a8aff", radius: 3.2, intensity: 0.5 },
    { x: 0.5, y: 7.5, z: 40, color: "#ff4fa8", radius: 3, intensity: 0.65 },
  ],
  spawn: [5, 7],
  exit: [5, 8],
  npc: [
    [3.5, 5.5],
    [6.5, 4.5],
  ],
  ambient: "#2a2050",
});

/* ------------------------------------------------------------------ */
/* Grand Veilport Station — the taxi rank                              */
/* ------------------------------------------------------------------ */

const station = (): IsoTemplate => ({
  w: 12,
  h: 10,
  floor: "stone",
  floorColor: "#4e4a62",
  zones: [
    { x: 0, y: 7, w: 12, h: 3, kind: "asphalt" },
    { x: 0, y: 6.8, w: 12, h: 0.2, kind: "concrete", color: "#8a8aa0" },
  ],
  wallLeft: "stone",
  wallRight: "stone",
  wallColor: "#5a5274",
  wallH: 110,
  outdoor: true,
  props: [
    P("taxi", 4, 7.2, { w: 2, d: 1, at: [55, 58] }),
    P("car", 8, 8, { w: 2, d: 1, color: "#6a1e8a" }),
    P("streetLamp", 3, 6),
    P("streetLamp", 9, 6),
    P("bench", 1, 2, { w: 2, d: 1, color: "#3a2a4a" }),
    P("bench", 6, 2, { w: 2, d: 1, color: "#3a2a4a" }),
    P("bollard", 1, 6),
    P("bollard", 6, 6),
    P("bollard", 11, 6),
    P("plant", 0, 0, { color: "#5a5a6a" }),
    P("plant", 11, 0, { color: "#5a5a6a" }),
    P("departures", 10, 2),
  ],
  decor: [
    D("right", 1, "window", { span: 3 }),
    D("right", 4.5, "door", { span: 2, color: "#3a2a4a", text: "GRAND VEILPORT" }),
    D("right", 8, "window", { span: 3 }),
    D("left", 1, "window", { span: 2 }),
    D("left", 4, "clock", { v: 92 }),
    D("left", 5.5, "neon", { span: 3, text: "TRAINS", color: "#3af0ff", v: 70 }),
    D("right", 4.5, "neon", { span: 2, text: "TAXI", color: "#ffe21e", v: 92 }),
  ],
  lights: [
    { x: 3.5, y: 6.5, z: 66, color: "#ffb43d", radius: 3.8, intensity: 0.9 },
    { x: 9.5, y: 6.5, z: 66, color: "#ffb43d", radius: 3.8, intensity: 0.9 },
    { x: 6.4, y: 7.7, z: 8, color: "#fff0c0", radius: 2.4, intensity: 0.6 },
    { x: 5.5, y: 0.6, z: 50, color: "#ffc46b", radius: 3.2, intensity: 0.75 },
    { x: 10.5, y: 2.5, z: 40, color: "#ffb43d", radius: 2.2, intensity: 0.5 },
  ],
  spawn: [9, 4],
  exit: [11, 4],
  npc: [
    [6.5, 6.5],
    [3.5, 3.5],
  ],
  ambient: "#262a56",
});

/* ------------------------------------------------------------------ */
/* The Veilport Ledger — City Desk                                     */
/* ------------------------------------------------------------------ */

const newsroom = (): IsoTemplate => ({
  w: 11,
  h: 9,
  floor: "wood",
  floorColor: "#5a3424",
  zones: [{ x: 6, y: 2, w: 4, h: 3, kind: "carpet", color: "#2a3a6a" }],
  wallLeft: "brick",
  wallRight: "brick",
  wallColor: "#6a3432",
  wallH: 88,
  props: [
    P("desk", 7, 3, { w: 2, d: 1, variant: 2, color: "#4a2a1a", at: [70, 52] }),
    P("fileBox", 7.1, 3.15, { z: 17 }),
    P("chair", 7.5, 2, { color: "#2a1a1a", solid: false }),
    P("desk", 2, 2, { w: 2, d: 1, variant: 1 }),
    P("chair", 2.5, 3, { color: "#2a1a1a", solid: false, variant: 1 }),
    P("desk", 2, 5, { w: 2, d: 1, variant: 0 }),
    P("chair", 2.5, 6, { color: "#2a1a1a", solid: false, variant: 1 }),
    P("cabinet", 0, 1, { face: "x" }),
    P("cabinet", 0, 2, { face: "x" }),
    P("bookcase", 4, 0, { w: 2, d: 1, color: "#3a2418", variant: 2 }),
    P("noticeboard", 9, 0),
    P("coatRack", 10, 2, { color: "#5a4a3a", variant: 1 }),
    P("cooler", 0, 7),
    P("papers", 5.5, 6.2),
    P("plant", 10, 7),
  ],
  decor: [
    D("right", 1, "neon", { span: 3, text: "THE LEDGER", color: "#ff2e88", v: 66 }),
    D("right", 6.5, "window", { span: 2 }),
    D("right", 9, "clock", { v: 66 }),
    D("left", 3, "board", { span: 3, v: 50 }),
    D("left", 7, "window", { span: 2 }),
  ],
  lights: [
    { x: 8.3, y: 3.3, z: 26, color: "#7aff9a", radius: 2.6, intensity: 0.8 },
    { x: 3.3, y: 2.3, z: 26, color: "#ffd27a", radius: 2.4, intensity: 0.75 },
    { x: 3.3, y: 5.3, z: 26, color: "#ffd27a", radius: 2.4, intensity: 0.75 },
    { x: 5, y: 4.5, z: 90, color: "#ffd9a0", radius: 4.5, intensity: 0.5 },
    { x: 6.5, y: 0.3, z: 50, color: "#5a8aff", radius: 3, intensity: 0.5 },
  ],
  spawn: [5, 7],
  exit: [5, 8],
  npc: [
    [7.5, 1.5],
    [4.5, 3.5],
  ],
  ambient: "#28204c",
});

/* ------------------------------------------------------------------ */
/* Old Harbor — the seawall                                            */
/* ------------------------------------------------------------------ */

const harbor = (): IsoTemplate => ({
  w: 12,
  h: 9,
  floor: "cobble",
  floorColor: "#4a4a62",
  zones: [
    { x: 8, y: 0, w: 4, h: 9, kind: "water", solid: true },
    { x: 7.6, y: 0, w: 0.4, h: 9, kind: "stone", color: "#6a6a80" },
  ],
  wallLeft: "brick",
  wallRight: null,
  wallColor: "#5a2e34",
  wallH: 96,
  outdoor: true,
  props: [
    P("tideBoard", 6, 1, { at: [70, 44] }),
    P("rocks", 1, 5, { w: 2, d: 2, at: [20, 56] }),
    P("marker", 6.1, 5.1, { w: 0.8, d: 0.8, at: [42, 62], solid: false }),
    P("rope", 5, 4, { w: 2, d: 0.4, variant: 1, solid: false }),
    P("rope", 5, 7, { w: 2, d: 0.4, variant: 1, solid: false }),
    P("bollard", 7, 0),
    P("bollard", 7, 3),
    P("bollard", 7, 8),
    P("streetLamp", 3, 1),
    P("streetLamp", 3, 7),
    P("crate", 0, 1, { variant: 1 }),
    P("crate", 1, 0),
    P("boat", 9, 3, { w: 2, d: 1 }),
    P("bench", 4, 0, { w: 2, d: 1, color: "#3a2a3a" }),
  ],
  decor: [
    D("left", 1, "window", { span: 2 }),
    D("left", 4, "door", { color: "#3a3a5a", text: "CANNERY CO." }),
    D("left", 6, "window", { span: 2 }),
    D("left", 3, "neon", { span: 1, text: "BAIT", color: "#3af0ff", v: 80 }),
  ],
  lights: [
    { x: 3.5, y: 1.5, z: 66, color: "#ffb43d", radius: 3.6, intensity: 0.9 },
    { x: 3.5, y: 7.5, z: 66, color: "#ffb43d", radius: 3.6, intensity: 0.9 },
    { x: 10, y: 3.5, z: 30, color: "#ffd27a", radius: 2.2, intensity: 0.6 },
    { x: 10, y: 6.5, z: 80, color: "#5ab8ff", radius: 4.2, intensity: 0.55 },
    { x: 6.5, y: 5.5, z: 30, color: "#ff3a6a", radius: 2.6, intensity: 0.5 },
  ],
  spawn: [3, 6],
  exit: [3, 8],
  npc: [
    [4.5, 3.5],
    [4.5, 5.5],
  ],
  ambient: "#28305a",
  backdrop: ["#1a1840", "#3a2a5a"],
});

/* ------------------------------------------------------------------ */
/* Pier 9 Docks                                                        */
/* ------------------------------------------------------------------ */

const docks = (): IsoTemplate => ({
  w: 13,
  h: 11,
  floor: "planks",
  floorColor: "#5a4636",
  zones: [
    { x: 0, y: 0, w: 13, h: 4, kind: "concrete", color: "#4e4e5e" },
    { x: 2, y: 7, w: 2, h: 2, kind: "concrete", color: "#6a6a7a" },
    { x: 0, y: 9, w: 13, h: 2, kind: "water", solid: true },
  ],
  wallLeft: "brick",
  wallRight: "metal",
  wallColor: "#4a3a52",
  wallH: 92,
  outdoor: true,
  props: [
    P("marker", 2.6, 7.6, { w: 0.8, d: 0.8, at: [30, 70], solid: false }),
    P("lockers", 9, 0, { w: 2, d: 1, color: "#2a8a8a", at: [78, 52] }),
    P("noticeboard", 7, 0, { at: [60, 40] }),
    P("bookcase", 0, 2, { w: 1, d: 1, face: "x", color: "#3a2a1a", at: [14, 38] }),
    P("cabinet", 5, 2, { color: "#d8382e", at: [46, 30] }),
    P("cameraPole", 12, 1, { at: [88, 24] }),
    P("crate", 3, 0, { variant: 1, color: "#3a6a8a" }),
    P("crate", 3, 1, { color: "#7a5a34" }),
    P("drum", 4, 0, { color: "#d8382e" }),
    P("container", 9, 3, { w: 3, d: 1, variant: 1 }),
    P("container", 9, 3, { w: 3, d: 1, variant: 0, z: 30 }),
    P("fireDrum", 6, 6),
    P("crate", 1, 4, { variant: 1 }),
    P("crate", 1, 5),
    P("crate", 0, 4),
    P("bollard", 5, 8),
    P("bollard", 8, 8),
    P("bollard", 11, 8),
    P("boat", 7, 9.2, { w: 3, d: 1 }),
    P("streetLamp", 4, 5),
    P("streetLamp", 11, 6),
  ],
  decor: [
    D("left", 1, "window", { span: 1 }),
    D("left", 3, "door", { color: "#3a3a52", text: "HARBORMASTER" }),
    D("left", 6, "window", { span: 2 }),
    D("right", 1, "neon", { span: 2, text: "PIER 9", color: "#ff3a4a", v: 74 }),
    D("right", 5, "door", { color: "#2aa878", text: "UNION HALL" }),
    D("right", 11, "poster", { color: "#ffb43d", v: 50 }),
  ],
  lights: [
    { x: 6.5, y: 6.5, z: 20, color: "#ff7a2a", radius: 3.6, intensity: 0.95 },
    { x: 4.5, y: 5.5, z: 66, color: "#ffb43d", radius: 3.6, intensity: 0.8 },
    { x: 11.5, y: 6.5, z: 66, color: "#ffb43d", radius: 3.6, intensity: 0.8 },
    { x: 0.3, y: 1.5, z: 40, color: "#ffc46b", radius: 2.6, intensity: 0.6 },
    { x: 6, y: 10, z: 60, color: "#5ab8ff", radius: 5, intensity: 0.45 },
    { x: 5.5, y: 0.5, z: 56, color: "#2aff9a", radius: 2.6, intensity: 0.45 },
  ],
  spawn: [10, 7],
  exit: [12, 7],
  npc: [
    [7.5, 1.5],
    [5.5, 6.5],
    [7.5, 5.5],
  ],
  ambient: "#22305a",
});

/* ------------------------------------------------------------------ */
/* The abandoned cannery                                               */
/* ------------------------------------------------------------------ */

const cannery = (): IsoTemplate => ({
  w: 12,
  h: 10,
  floor: "concrete",
  floorColor: "#4a4858",
  zones: [{ x: 3, y: 4, w: 4, h: 4, kind: "planks", color: "#4a3a2e" }],
  wallLeft: "brick",
  wallRight: "brick",
  wallColor: "#5a2e34",
  wallH: 94,
  props: [
    P("drum", 5, 5, { color: "#3a5a8a", at: [50, 58] }),
    P("papers", 5.2, 5.2, { z: 20 }),
    P("crate", 4, 5),
    P("crate", 6, 5, { color: "#7a5a34" }),
    P("crate", 5, 6, { color: "#8a6a3a" }),
    P("pendant", 5, 5, { color: "#ffd27a", accent: "#3a3a4a" }),
    P("ring", 8, 2, { w: 3, d: 3, color: "#2a2a5a" }),
    P("fireDrum", 2, 7),
    P("crate", 0, 2, { variant: 1 }),
    P("crate", 0, 3, { variant: 2 }),
    P("crate", 1, 2),
    P("container", 0, 5, { w: 1, d: 3, variant: 3 }),
    P("bench", 9, 7, { w: 2, d: 1 }),
    P("lockers", 4, 0, { w: 2, d: 1, color: "#5a6a7a" }),
  ],
  decor: [
    D("right", 10, "poster", { color: "#ff3a4a", v: 54, slotAt: [84, 36] }),
    D("right", 1, "window", { span: 2 }),
    D("right", 6.5, "neon", { span: 3, text: "FIGHT NIGHT", color: "#ff2e88", v: 74 }),
    D("left", 1, "window", { span: 1 }),
    D("left", 8, "door", { color: "#4a3a3a", text: "LOADING" }),
    D("left", 4, "sign", { span: 3, text: "VEILPORT CANNING", v: 76 }),
  ],
  lights: [
    { x: 5.5, y: 5.5, z: 66, color: "#ffd27a", radius: 3.8, intensity: 1 },
    { x: 2.5, y: 7.5, z: 20, color: "#ff7a2a", radius: 3.2, intensity: 0.9 },
    { x: 9.5, y: 3.5, z: 92, color: "#ff4fa8", radius: 3.6, intensity: 0.75 },
    { x: 2, y: 0.3, z: 50, color: "#6a8aff", radius: 3, intensity: 0.5 },
  ],
  spawn: [6, 8],
  exit: [6, 9],
  npc: [
    [4.5, 4.3],
    [7.5, 6.5],
  ],
  ambient: "#221c3e",
});

/* ------------------------------------------------------------------ */
/* Veilport Museum — the Map Room                                      */
/* ------------------------------------------------------------------ */

const museum = (): IsoTemplate => ({
  w: 12,
  h: 10,
  floor: "parquet",
  floorColor: "#5a3420",
  zones: [{ x: 3, y: 4, w: 4, h: 4, kind: "marble", color: "#8a8aa8" }],
  wallLeft: "panel",
  wallRight: "panel",
  wallColor: "#1e4a40",
  wallH: 96,
  props: [
    P("displayCase", 1, 3, { w: 1, d: 2, variant: 1, at: [30, 42] }),
    P("astrolabe", 4, 6, { at: [44, 60] }),
    P("rope", 3, 5, { w: 3, d: 0.4, variant: 1, solid: false }),
    P("desk", 7, 3, { w: 2, d: 1, variant: 0, color: "#4a2418", at: [68, 52] }),
    P("chair", 7.5, 2, { color: "#2a1a1a", solid: false }),
    P("bookend", 9, 7, { at: [82, 66] }),
    P("satchel", 6, 8, { at: [56, 74] }),
    P("mapCabinet", 2, 0, { w: 2, d: 1 }),
    P("mapCabinet", 5, 0, { w: 2, d: 1 }),
    P("globe", 10, 1),
    P("globe", 10, 4),
    P("bookcase", 0, 6, { w: 1, d: 2 }),
    P("grandClock", 0, 0),
    P("displayCase", 9, 9, { w: 2, d: 0.9 }),
  ],
  decor: [
    D("left", 1, "panel", { v: 18, slotAt: [10, 36] }),
    D("left", 3, "painting", { span: 2, color: "#ffb43d", v: 56 }),
    D("right", 3.5, "painting", { span: 2, color: "#5af0ff", v: 56 }),
    D("right", 9, "window", { span: 2, slotAt: [90, 20] }),
    D("right", 7, "sign", { span: 2, text: "MAP ROOM", v: 76 }),
    D("left", 8, "door", { color: "#2a3a3a", text: "ARCHIVE" }),
  ],
  lights: [
    { x: 1.5, y: 4, z: 70, color: "#ffd9a0", radius: 3, intensity: 0.85 },
    { x: 8.3, y: 3.3, z: 26, color: "#7aff9a", radius: 2.8, intensity: 0.8 },
    { x: 9.5, y: 0.5, z: 80, color: "#7aa8ff", radius: 4.5, intensity: 0.75 },
    { x: 4.5, y: 6.5, z: 60, color: "#5af0ff", radius: 3, intensity: 0.65 },
    { x: 10.5, y: 4.5, z: 50, color: "#ff4fa8", radius: 2.6, intensity: 0.5 },
    { x: 3, y: 0.6, z: 50, color: "#ffb43d", radius: 2.6, intensity: 0.45 },
  ],
  spawn: [4, 8],
  exit: [4, 9],
  npc: [
    [8.5, 2.3],
    [1.5, 1.5],
    [6.5, 5.5],
  ],
  ambient: "#1e2a46",
});

/* ------------------------------------------------------------------ */
/* Halloway University — Cartography                                   */
/* ------------------------------------------------------------------ */

const university = (): IsoTemplate => ({
  w: 10,
  h: 9,
  floor: "wood",
  floorColor: "#6a4428",
  zones: [{ x: 3, y: 4, w: 4, h: 3, kind: "rug", color: "#2a4a7a" }],
  wallLeft: "wood",
  wallRight: "plaster",
  wallColor: "#3a3a5e",
  wallH: 88,
  props: [
    P("desk", 4, 1, { w: 2, d: 1, variant: 1, color: "#5a3a22" }),
    P("chair", 4.5, 2, { color: "#2a1a1a", solid: false, variant: 1 }),
    P("desk", 7, 4, { w: 2, d: 1, variant: 0, color: "#5a3a22" }),
    P("chair", 7.5, 3, { color: "#2a1a1a", solid: false }),
    P("bookcase", 0, 1, { w: 1, d: 2 }),
    P("bookcase", 0, 4, { w: 1, d: 2, variant: 1 }),
    P("mapCabinet", 8, 0, { w: 2, d: 1 }),
    P("table", 4, 5, { w: 2, d: 1, variant: 1, color: "#4a2a18" }),
    P("globe", 2, 7),
    P("easel", 7, 7),
    P("plant", 9, 3),
  ],
  decor: [
    D("right", 4.5, "board", { span: 3, v: 50, slotAt: [60, 48] }),
    D("right", 1, "window", { span: 2 }),
    D("left", 6.5, "window", { span: 2 }),
    D("left", 3.5, "frame", { color: "#ffb43d", v: 60 }),
    D("right", 8.5, "clock", { v: 70 }),
  ],
  lights: [
    { x: 5.3, y: 1.3, z: 26, color: "#ffd27a", radius: 2.8, intensity: 0.85 },
    { x: 8.3, y: 4.3, z: 26, color: "#ffd27a", radius: 2.6, intensity: 0.8 },
    { x: 1.5, y: 0.3, z: 50, color: "#6a8aff", radius: 3, intensity: 0.55 },
    { x: 0.3, y: 7, z: 50, color: "#b06aff", radius: 3, intensity: 0.45 },
    { x: 5.5, y: 0.4, z: 60, color: "#ff4fa8", radius: 2.4, intensity: 0.45 },
  ],
  spawn: [5, 7],
  exit: [5, 8],
  npc: [
    [6.5, 2.5],
    [2.5, 5.5],
  ],
  ambient: "#262248",
});

/* ------------------------------------------------------------------ */
/* Ironway Self-Storage — Unit 44                                      */
/* ------------------------------------------------------------------ */

const storage = (): IsoTemplate => ({
  w: 8,
  h: 8,
  floor: "concrete",
  floorColor: "#4a4a5a",
  wallLeft: "metal",
  wallRight: "metal",
  wallColor: "#3a4866",
  wallH: 84,
  props: [
    P("bookcase", 3, 0, { w: 2, d: 1, color: "#5a6a7e", variant: 4, at: [50, 50] }),
    P("fileBox", 5.4, 3.2, { at: [74, 58] }),
    P("fileBox", 5.6, 3.4, { z: 12 }),
    P("crate", 0, 1),
    P("crate", 0, 2, { variant: 1 }),
    P("fileBox", 1.2, 1.3),
    P("sofa", 0, 5, { w: 1, d: 2, color: "#5a6a5a" }),
    P("pendant", 3.5, 3.5, { color: "#ffe0a0", accent: "#3a3a4a" }),
    P("cabinet", 6, 0, { color: "#4a5a6a" }),
    P("drum", 7, 6, { color: "#c83a2a" }),
  ],
  decor: [
    D("right", 1, "panel", { v: 24 }),
    D("left", 2, "sign", { span: 2, text: "UNIT 44", v: 68 }),
    D("left", 5, "door", { span: 2, color: "#4a5a6a" }),
  ],
  lights: [
    { x: 3.5, y: 3.5, z: 70, color: "#ffe0a0", radius: 4, intensity: 0.95, flicker: 0.6 },
    { x: 7.5, y: 0.3, z: 70, color: "#ff3a4a", radius: 3, intensity: 0.55 },
    { x: 0.3, y: 4, z: 60, color: "#9ad8ff", radius: 3, intensity: 0.45 },
  ],
  spawn: [4, 6],
  exit: [4, 7],
  npc: [[2.5, 4.5]],
  ambient: "#1e2040",
});

/* ------------------------------------------------------------------ */
/* A Veilport street (anywhere else)                                   */
/* ------------------------------------------------------------------ */

const street = (): IsoTemplate => ({
  w: 11,
  h: 9,
  floor: "cobble",
  floorColor: "#4a465e",
  zones: [{ x: 0, y: 6, w: 11, h: 3, kind: "asphalt" }],
  wallLeft: "brick",
  wallRight: "brick",
  wallColor: "#5a2e3e",
  wallH: 100,
  outdoor: true,
  props: [
    P("streetLamp", 2, 5),
    P("streetLamp", 8, 5),
    P("container", 0, 1, { w: 1, d: 2, variant: 4 }),
    P("crate", 1, 0),
    P("fireDrum", 5, 3),
    P("car", 6, 7, { w: 2, d: 1, color: "#1e5a8a" }),
    P("bench", 6, 0, { w: 2, d: 1, color: "#3a2a3a" }),
    P("plant", 10, 0),
  ],
  decor: [
    D("right", 1, "neon", { span: 3, text: "HOTEL", color: "#ff2e88", v: 80 }),
    D("right", 4, "door", { color: "#3a2a4a", text: "NO. 9" }),
    D("right", 6, "window", { span: 2 }),
    D("left", 2, "window", { span: 2 }),
    D("left", 5, "neon", { span: 2, text: "BAR", color: "#3af0ff", v: 70 }),
    D("right", 9, "poster", { color: "#ffb43d", v: 50 }),
  ],
  lights: [
    { x: 2.5, y: 5.5, z: 66, color: "#ffb43d", radius: 3.6, intensity: 0.9 },
    { x: 8.5, y: 5.5, z: 66, color: "#ffb43d", radius: 3.6, intensity: 0.9 },
    { x: 5.5, y: 3.5, z: 20, color: "#ff7a2a", radius: 3, intensity: 0.8 },
  ],
  spawn: [9, 4],
  exit: [10, 4],
  npc: [
    [4.5, 4.5],
    [6.5, 2.5],
  ],
  ambient: "#262850",
});

export const TEMPLATES: Record<string, () => IsoTemplate> = {
  hotel,
  "the-archivist:hotel": suite,
  morgue,
  precinct,
  bar,
  highrise,
  apartment,
  station,
  newsroom,
  harbor,
  docks,
  cannery,
  warehouse: cannery,
  industrial: storage,
  museum,
  university,
  street,
  forest: street,
};

/**
 * The diorama for a place: a case-specific room first (the same hotel can
 * be a ballroom in one case and a suite in another), then the location,
 * then the kind of scene.
 */
export function templateFor(caseId: string, locationId: string, scene: string): IsoTemplate {
  const make = TEMPLATES[`${caseId}:${locationId}`] ?? TEMPLATES[locationId] ?? TEMPLATES[scene] ?? street;
  const t = make();
  // stable ids, so a cached room and a rebuilt scene agree
  t.props = t.props.map((p, i) => ({ ...p, id: `p${i}-${p.kind}` }));
  // arrive two steps in from the way out, so the first prompt isn't "Leave"
  const [ex, ey] = t.exit;
  const [ox, oy] = ey >= t.h - 1 ? [0, 1] : ex >= t.w - 1 ? [1, 0] : ex <= 0 ? [-1, 0] : [0, -1];
  t.spawn = [ex - ox * 2, ey - oy * 2];
  return t;
}
