import type { CaseDef, CaseLocation, HotspotDef } from "@/lib/engine/types";
import { cityLocation } from "@/lib/city/veilport";
import { templateFor } from "./templates";
import { propHeight } from "./props";
import type { IsoPerson, IsoProp, IsoScene, IsoTarget, IsoTemplate } from "./types";

/**
 * Turn a case location into a walkable scene: the place's diorama, every
 * hotspot bound to the prop or wall fixture it describes, the people who
 * are here, and the way out.
 */

const MATCH_RADIUS = 20;

function footprint(p: IsoProp): [number, number][] {
  const tiles: [number, number][] = [];
  const w = p.w ?? 1;
  const d = p.d ?? 1;
  for (let y = Math.floor(p.y + 0.01); y < Math.ceil(p.y + d - 0.01); y++) {
    for (let x = Math.floor(p.x + 0.01); x < Math.ceil(p.x + w - 0.01); x++) tiles.push([x, y]);
  }
  return tiles.length ? tiles : [[Math.floor(p.x), Math.floor(p.y)]];
}

/** where a side-view hotspot (percent coords) would sit on this floor */
function project(t: IsoTemplate, h: HotspotDef): [number, number] {
  const X = -t.h + (h.x / 100) * (t.w + t.h);
  const D = Math.max(0.15, Math.min(0.95, (h.y - 25) / 70)) * (t.w + t.h);
  const x = (X + D) / 2;
  const y = (D - X) / 2;
  return [Math.max(1, Math.min(t.w - 1.5, x)), Math.max(1, Math.min(t.h - 1.5, y))];
}

export function buildScene(caseDef: CaseDef, loc: CaseLocation): IsoScene {
  const city = cityLocation(loc.locationId);
  const t = templateFor(caseDef.id, loc.locationId, city.scene);
  const props: IsoProp[] = t.props.map((p) => ({ ...p }));
  const targets: IsoTarget[] = [];

  /* ---- hotspots → the closest-matching prop or fixture ---- */
  type Cand = { kind: "prop"; i: number } | { kind: "decor"; i: number };
  const cands: { c: Cand; rx: number; ry: number }[] = [];
  props.forEach((p, i) => p.slot && cands.push({ c: { kind: "prop", i }, rx: p.slot.rx, ry: p.slot.ry }));
  t.decor.forEach((d, i) => d.slot && cands.push({ c: { kind: "decor", i }, rx: d.slot.rx, ry: d.slot.ry }));
  const pairs: { h: number; k: number; d: number }[] = [];
  loc.hotspots.forEach((h, hi) =>
    cands.forEach((c, k) => {
      const d = Math.hypot(h.x - c.rx, (h.y - c.ry) * 1.15);
      if (d <= MATCH_RADIUS) pairs.push({ h: hi, k, d });
    })
  );
  pairs.sort((a, b) => a.d - b.d);
  const bound = new Map<number, Cand>();
  const used = new Set<number>();
  for (const pr of pairs) {
    if (bound.has(pr.h) || used.has(pr.k)) continue;
    bound.set(pr.h, cands[pr.k].c);
    used.add(pr.k);
  }

  // tiles nothing stands on, for evidence tents that have no fixture of their own
  const taken = new Set<string>();
  const mark = (x: number, y: number) => taken.add(`${x},${y}`);
  for (const p of props) if ((p.z ?? 0) === 0 && p.solid !== false) footprint(p).forEach(([x, y]) => mark(x, y));
  mark(t.spawn[0], t.spawn[1]);
  mark(t.exit[0], t.exit[1]);
  for (const [x, y] of t.npc) mark(Math.floor(x), Math.floor(y));
  const freeNear = (px: number, py: number): [number, number] => {
    let best: [number, number] = [Math.floor(px), Math.floor(py)];
    let bd = Infinity;
    for (let y = 1; y < t.h - 1; y++) {
      for (let x = 1; x < t.w - 1; x++) {
        if (taken.has(`${x},${y}`)) continue;
        // keep tents reachable: avoid tiles boxed in by furniture
        let crowd = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && taken.has(`${x + dx},${y + dy}`)) crowd++;
        const d = (x + 0.5 - px) ** 2 + (y + 0.5 - py) ** 2 + crowd * 0.6;
        if (d < bd) {
          bd = d;
          best = [x, y];
        }
      }
    }
    return best;
  };

  let tents = 0;
  loc.hotspots.forEach((h, hi) => {
    const c = bound.get(hi);
    if (c?.kind === "prop") {
      const p = props[c.i];
      targets.push({
        kind: "hotspot",
        id: h.id,
        label: h.label,
        tiles: footprint(p),
        propId: p.id,
        anchor: [p.x + (p.w ?? 1) / 2, p.y + (p.d ?? 1) / 2, (p.z ?? 0) + propHeight(p) + 8],
      });
      return;
    }
    if (c?.kind === "decor") {
      const d = t.decor[c.i];
      const span = d.span ?? 1;
      const tiles: [number, number][] = [];
      for (let k = 0; k < span; k++) tiles.push(d.wall === "left" ? [0, d.at + k] : [d.at + k, 0]);
      const mid = d.at + span / 2;
      const top = d.kind === "door" ? 64 : d.kind === "window" ? 80 : (d.v ?? 50) + 18;
      targets.push({
        kind: "hotspot",
        id: h.id,
        label: h.label,
        tiles,
        decor: c.i,
        anchor: d.wall === "left" ? [0.1, mid, top] : [mid, 0.1, top],
      });
      return;
    }
    // nothing in the room stands for it: mark the spot with an evidence tent
    const [px, py] = project(t, h);
    const [x, y] = freeNear(px, py);
    mark(x, y);
    const tent: IsoProp = { id: `tent-${h.id}`, kind: "marker", x: x + 0.1, y: y + 0.1, w: 0.8, d: 0.8, variant: tents++, solid: false };
    props.push(tent);
    targets.push({ kind: "hotspot", id: h.id, label: h.label, tiles: [[x, y]], propId: tent.id, anchor: [x + 0.5, y + 0.5, 22] });
  });

  /* ---- people ---- */
  const people: IsoPerson[] = [];
  loc.peopleHere.forEach((pid, i) => {
    const s = caseDef.suspects.find((x) => x.id === pid);
    if (!s) return;
    const spot = t.npc[i] ?? (() => {
      const [x, y] = freeNear(t.w / 2, t.h / 2);
      mark(x, y);
      return [x + 0.5, y + 0.5] as [number, number];
    })();
    people.push({ id: s.id, name: s.name, role: s.role, portrait: s.portrait, x: spot[0], y: spot[1], witness: s.isWitness });
    targets.push({
      kind: "npc",
      id: s.id,
      label: s.name,
      tiles: [[Math.floor(spot[0]), Math.floor(spot[1])]],
      anchor: [spot[0], spot[1], 58],
    });
  });

  targets.push({
    kind: "exit",
    id: "exit",
    label: "Back to the city map",
    tiles: [[t.exit[0], t.exit[1]]],
    anchor: [t.exit[0] + 0.5, t.exit[1] + 0.5, 6],
  });

  return { key: `${caseDef.id}:${loc.locationId}`, template: t, props, people, targets };
}
