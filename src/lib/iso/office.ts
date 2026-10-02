import type { IsoProp, IsoScene, IsoTarget, IsoTemplate, WallDecor } from "./types";
import { propHeight } from "./props";

/**
 * Your office at Precinct Seven, as a room you can walk: the furniture is
 * the menu. The desk holds tonight's case, the cabinet the city archive,
 * the cork board the standings, the radio the settings; trophies from
 * closed cases turn up on the shelf and around the room.
 */

export type OfficeTarget = "desk" | "archive" | "standings" | "settings" | "shelf" | "door";

function P(id: string, kind: IsoProp["kind"], x: number, y: number, o: Partial<IsoProp> = {}): IsoProp {
  return { id, kind, x, y, ...o };
}

export function buildOfficeScene(opts: { name: string; unlocks: string[] }): IsoScene {
  const has = (id: string) => opts.unlocks.includes(id);
  const door = (opts.name || "DETECTIVE").toUpperCase().slice(0, 14);
  const props: IsoProp[] = [
    P("desk", "desk", 3, 3, { w: 2, d: 1, variant: 3, color: "#5a2e1a" }),
    P("chair", "chair", 3.5, 2, { color: "#3a1a14", solid: false }),
    P("lamp", "deskLamp", 4.3, 3.1, { z: 17, color: "#c9a24a", accent: "#ffd27a" }),
    P("cabinet", "cabinet", 0, 1, { face: "x", color: "#4a5a76" }),
    P("cabinet2", "cabinet", 0, 2, { face: "x", color: "#46546e" }),
    P("shelf", "shelf", 0, 5, { w: 1, d: 2, color: "#3a2430", variant: opts.unlocks.length }),
    P("radioTable", "table", 8, 3, { color: "#3a2018" }),
    P("radio", "radio", 8, 3, { z: 16, solid: false }),
    P("sofa", "sofa", 6, 7, { w: 2, d: 1, color: "#7a2a1e" }),
    P("rug-lamp", "floorLamp", 9, 6, { color: "#3af0ff" }),
    P("coat", "coatRack", 9, 1, { color: "#8a6a4a", variant: 1 }),
    P("plant", "plant", 7, 0),
    P("radiator", "radiator", 1, 0, { w: 2, d: 1 }),
    P("cooler", "cooler", 0, 8),
  ];
  if (has("record-player")) props.push(P("vinyl", "recordPlayer", 8, 0, { color: "#4a1e2a" }));
  if (has("astrolabe")) props.push(P("astrolabe", "globe", 9, 8));

  const decor: WallDecor[] = [
    { wall: "right", at: 1, span: 3, kind: "window" },
    { wall: "right", at: 5, span: 2, kind: "board", v: 52 },
    { wall: "left", at: 3, span: 1, kind: "door", color: "#3a2a3a", text: door },
    { wall: "left", at: 7.5, span: 1, kind: "poster", color: "#ff4fa8", v: 54 },
  ];
  if (has("case-map")) decor.push({ wall: "left", at: 1.5, span: 2, kind: "painting", color: "#5af0ff", v: 64 });
  if (has("tide-clock")) decor.push({ wall: "right", at: 8, kind: "clock", v: 66 });

  const t: IsoTemplate = {
    w: 10,
    h: 9,
    floor: "wood",
    floorColor: "#5a3020",
    zones: [{ x: 2, y: 4, w: 5, h: 4, kind: "rug", color: "#6a1e3e" }],
    wallLeft: "panel",
    wallRight: "plaster",
    wallColor: "#3a2a4e",
    wallH: 90,
    props,
    decor,
    lights: [
      { x: 4.4, y: 3.3, z: 26, color: "#ffd27a", radius: 3.4, intensity: 0.95 },
      { x: 2.5, y: 0.3, z: 50, color: "#ff2e88", radius: 4.2, intensity: 0.7 },
      { x: 2, y: 0.5, z: 70, color: "#6a8aff", radius: 3, intensity: 0.45 },
      { x: 8.5, y: 3.5, z: 22, color: "#ffb43d", radius: 2, intensity: 0.55 },
      { x: 9.5, y: 6.5, z: 40, color: "#3af0ff", radius: 3.2, intensity: 0.75 },
      { x: 0.5, y: 6, z: 30, color: "#b06aff", radius: 2.6, intensity: 0.4 },
    ],
    spawn: [5, 6],
    exit: [5, 8],
    npc: [],
    ambient: "#2a2252",
  };

  const anchorOf = (p: IsoProp): [number, number, number] => [p.x + (p.w ?? 1) / 2, p.y + (p.d ?? 1) / 2, (p.z ?? 0) + propHeight(p) + 8];
  const byId = (id: string) => props.find((p) => p.id === id)!;
  const tilesOf = (p: IsoProp): [number, number][] => {
    const out: [number, number][] = [];
    for (let y = Math.floor(p.y); y < Math.ceil(p.y + (p.d ?? 1)); y++) for (let x = Math.floor(p.x); x < Math.ceil(p.x + (p.w ?? 1)); x++) out.push([x, y]);
    return out;
  };
  const prop = (id: OfficeTarget, pid: string, label: string, verb: string): IsoTarget => {
    const p = byId(pid);
    return { kind: "hotspot", id, label, tiles: tilesOf(p), propId: p.id, anchor: anchorOf(p), verb };
  };
  const boardIdx = decor.findIndex((d) => d.kind === "board");
  const doorIdx = decor.findIndex((d) => d.kind === "door");
  const targets: IsoTarget[] = [
    prop("desk", "desk", "Tonight's case file", "Open"),
    prop("archive", "cabinet", "City archive", "Browse"),
    prop("settings", "radio", "The radio · settings", "Tune"),
    prop("shelf", "shelf", "Your shelf", "Look over"),
    { kind: "hotspot", id: "standings", label: "Standings board", tiles: [[5, 0], [6, 0]], decor: boardIdx, anchor: [6, 0.1, 74], verb: "Check" },
    { kind: "hotspot", id: "door", label: "Leave · title screen", tiles: [[0, 3]], decor: doorIdx, anchor: [0.1, 3.5, 64], verb: "Leave" },
  ];
  const key = `office:${[...opts.unlocks].sort().join(",")}:${door}`;
  return { key, template: t, props, people: [], targets };
}
