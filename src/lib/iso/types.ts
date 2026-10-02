import type { PortraitDef } from "@/lib/engine/types";

/**
 * Isometric scene model.
 *
 * Tiles are 32×16 diamonds. Tile (x, y): x runs down-right across the
 * screen, y runs down-left. Rooms are cut-away dioramas: only the two back
 * walls (west = "left", north = "right") are built, so nothing ever hides
 * the detective.
 */

export type FloorKind =
  | "wood"
  | "parquet"
  | "tile"
  | "checker"
  | "carpet"
  | "rug"
  | "marble"
  | "linoleum"
  | "concrete"
  | "asphalt"
  | "cobble"
  | "grass"
  | "planks"
  | "stone"
  | "water"
  | "rail";

export type WallKind = "plaster" | "brick" | "wood" | "tile" | "glass" | "metal" | "stone" | "panel";

export type PropKind =
  | "desk"
  | "deskLamp"
  | "chair"
  | "armchair"
  | "sofa"
  | "table"
  | "roundTable"
  | "stool"
  | "cabinet"
  | "bookcase"
  | "shelf"
  | "counter"
  | "bar"
  | "piano"
  | "musicStand"
  | "thermos"
  | "basket"
  | "floorLamp"
  | "streetLamp"
  | "plant"
  | "crate"
  | "drum"
  | "fireDrum"
  | "container"
  | "bollard"
  | "bench"
  | "car"
  | "taxi"
  | "tree"
  | "fireplace"
  | "grandClock"
  | "examTable"
  | "lightTable"
  | "terminal"
  | "displayCase"
  | "mapCabinet"
  | "astrolabe"
  | "satchel"
  | "bookend"
  | "lockers"
  | "cameraPole"
  | "tideBoard"
  | "crane"
  | "boat"
  | "noticeboard"
  | "recordPlayer"
  | "jukebox"
  | "trainCar"
  | "departures"
  | "typewriter"
  | "papers"
  | "coatRack"
  | "radiator"
  | "kettle"
  | "fileBox"
  | "phone"
  | "bed"
  | "pendant"
  | "barShelf"
  | "sink"
  | "drawers"
  | "globe"
  | "easel"
  | "ring"
  | "cooler"
  | "rope"
  | "rocks"
  | "marker";

export interface Slot {
  /** where the matching object sits in the side-view scene, in % (case hotspot coordinates) */
  rx: number;
  ry: number;
}

export interface IsoProp {
  id: string;
  kind: PropKind;
  /** footprint top corner, in tiles */
  x: number;
  y: number;
  /** footprint size in tiles */
  w?: number;
  d?: number;
  color?: string;
  accent?: string;
  variant?: number;
  /** blocks walking (default true) */
  solid?: boolean;
  /** extra height offset in px, for things sitting on other things */
  z?: number;
  /**
   * which way its front faces: "y" (toward the front-left — against the
   * right-hand wall) or "x" (toward the front-right — against the left wall).
   * Defaults to the long side.
   */
  face?: "x" | "y";
  slot?: Slot;
}

export interface WallDecor {
  wall: "left" | "right";
  /** tile index along the wall, from the back corner */
  at: number;
  span?: number;
  kind: "window" | "door" | "neon" | "poster" | "painting" | "board" | "shelf" | "clock" | "monitor" | "panel" | "frame" | "sign";
  text?: string;
  color?: string;
  /** vertical position (px above the floor) for neon & signs */
  v?: number;
  slot?: Slot;
}

export interface IsoLight {
  x: number;
  y: number;
  /** height of the source above the floor, px */
  z?: number;
  color: string;
  /** reach, in tiles */
  radius: number;
  intensity: number;
  /** 0 steady … 1 guttering */
  flicker?: number;
}

export interface FloorZone {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: FloorKind;
  color?: string;
  /** can't be walked on (water, pits) */
  solid?: boolean;
}

export interface IsoTemplate {
  w: number;
  h: number;
  floor: FloorKind;
  floorColor?: string;
  zones?: FloorZone[];
  wallLeft: WallKind | null;
  wallRight: WallKind | null;
  wallColor?: string;
  /** wall height in px */
  wallH?: number;
  outdoor?: boolean;
  props: IsoProp[];
  decor: WallDecor[];
  lights: IsoLight[];
  spawn: [number, number];
  exit: [number, number];
  /** where people stand, in order of preference */
  npc: [number, number][];
  /** shadow tint over unlit areas */
  ambient: string;
  /** backdrop behind an outdoor diorama */
  backdrop?: [string, string];
}

/** Something the detective can walk up to and use. */
export interface IsoTarget {
  kind: "hotspot" | "npc" | "exit";
  id: string;
  label: string;
  /** footprint tiles: stand on or beside one of these to use it */
  tiles: [number, number][];
  /** the prop that stands for it (outline, hit-testing) */
  propId?: string;
  /** index into template.decor, for things on the walls */
  decor?: number;
  /** where its marker floats: tile x, tile y, px above the floor */
  anchor: [number, number, number];
}

export interface IsoPerson {
  id: string;
  name: string;
  role?: string;
  portrait: PortraitDef;
  x: number;
  y: number;
  witness?: boolean;
}

/** A fully assembled, ready-to-render location. */
export interface IsoScene {
  key: string;
  template: IsoTemplate;
  props: IsoProp[];
  people: IsoPerson[];
  targets: IsoTarget[];
}
