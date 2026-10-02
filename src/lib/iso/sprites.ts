import type { PortraitDef } from "@/lib/engine/types";
import { mix, shade, rgbOf } from "./core";

/**
 * Walking pixel people, generated from the same PortraitDef that draws each
 * character's close-up — so the barman in the interview is the barman
 * leaning on the bar.
 *
 * Heads are drawn big (11 px) so faces read at a glance: eyes with whites,
 * brows, nose, mouth, ears. A sheet holds two facings (toward the camera and
 * away; the other two iso directions are mirrors) × seven poses (two idle
 * breaths, a blink, four walk frames) × five layers: the figure, the face
 * (kept in a key light so it never sinks into the dark), and three rim masks
 * the stage tints with the nearest neon.
 */

export const FW = 28;
export const FH = 56;
/** feet anchor inside a frame */
export const AX = 14;
export const AY = 53;
/** how tall a person stands, in px */
export const PERSON_H = 46;

export const POSES = ["idle0", "idle1", "blink", "walk0", "walk1", "walk2", "walk3"] as const;
export type Pose = (typeof POSES)[number];
export type Facing = "front" | "back";
export const LAYERS = ["body", "face", "rimL", "rimR", "rimT"] as const;
export type Layer = (typeof LAYERS)[number];

export interface SpriteDef extends PortraitDef {
  /** override the outfit's main color (the detective's trench) */
  coat?: string;
}

export const DETECTIVE: SpriteDef = {
  skin: "#d8a07a",
  hair: "#241814",
  hairStyle: "short",
  accent: "#ff2e88",
  outfit: "coat",
  hat: "fedora",
  age: "mid",
  coat: "#c48a4c",
};

/** frame rectangle of a pose/facing/layer on the sheet */
export function frameRect(pose: Pose, facing: Facing, layer: Layer = "body"): [number, number, number, number] {
  const col = POSES.indexOf(pose);
  const row = (facing === "front" ? 0 : 1) * LAYERS.length + LAYERS.indexOf(layer);
  return [col * FW, row * FH, FW, FH];
}

/* ------------------------------------------------------------------ */
/* a tiny paletted grid                                                */
/* ------------------------------------------------------------------ */

const EMPTY = -1;

class Grid {
  d = new Int32Array(FW * FH).fill(EMPTY);
  set(x: number, y: number, c: number) {
    if (x < 0 || y < 0 || x >= FW || y >= FH) return;
    this.d[y * FW + x] = c;
  }
  get(x: number, y: number) {
    if (x < 0 || y < 0 || x >= FW || y >= FH) return EMPTY;
    return this.d[y * FW + x];
  }
  rect(x: number, y: number, w: number, h: number, c: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  /** a horizontal run from x0 to x1 inclusive */
  row(y: number, x0: number, x1: number, c: number) {
    for (let x = x0; x <= x1; x++) this.set(x, y, c);
  }
}

const n = (c: string) => {
  const [r, g, b] = rgbOf(c);
  return (r << 16) | (g << 8) | b;
};

interface Pal {
  skin: number;
  skinSh: number;
  skinHi: number;
  blush: number;
  hair: number;
  hairSh: number;
  hairHi: number;
  body: number;
  bodySh: number;
  bodyHi: number;
  arm: number;
  armSh: number;
  legs: number;
  legsSh: number;
  shoe: number;
  shirt: number;
  accent: number;
  accentSh: number;
  eye: number;
  white: number;
  lip: number;
  lipDark: number;
  gold: number;
  long: boolean;
}

function palette(p: SpriteDef): Pal {
  const OUT: Record<PortraitDef["outfit"], string> = {
    coat: p.coat ?? "#8a6a48",
    suit: "#3a3462",
    uniform: "#2c4a86",
    sweater: mix(p.accent, "#4a3a34", 0.3),
    dress: p.accent,
    apron: mix(p.accent, "#e8e0d0", 0.15),
    labcoat: "#e2e8f0",
    vest: shade(p.accent, 0.85),
  };
  const body = OUT[p.outfit];
  const shirtLike = p.outfit === "vest" || p.outfit === "apron";
  const armC = p.outfit === "vest" ? "#e4ded0" : p.outfit === "apron" ? "#34303a" : body;
  const legsC =
    p.outfit === "uniform" ? "#22365e" : p.outfit === "suit" ? shade(body, 0.82) : p.outfit === "dress" ? "#2a2034" : "#2c2838";
  return {
    skin: n(p.skin),
    skinSh: n(shade(p.skin, 0.76)),
    skinHi: n(mix(p.skin, "#fff2d8", 0.3)),
    blush: n(mix(p.skin, "#e0506a", 0.22)),
    hair: n(p.hair),
    hairSh: n(shade(p.hair, 0.62)),
    hairHi: n(mix(p.hair, "#fff2d8", 0.32)),
    body: n(body),
    bodySh: n(shade(body, 0.68)),
    bodyHi: n(mix(body, "#ffffff", 0.22)),
    arm: n(armC),
    armSh: n(shade(armC, 0.7)),
    legs: n(legsC),
    legsSh: n(shade(legsC, 0.7)),
    shoe: n(p.outfit === "dress" ? shade(p.accent, 0.5) : "#141018"),
    shirt: n(shirtLike ? "#e4ded0" : p.outfit === "labcoat" ? mix(p.accent, "#20303a", 0.4) : "#ece6d8"),
    accent: n(p.accent),
    accentSh: n(shade(p.accent, 0.65)),
    eye: n("#120a16"),
    white: n("#f6f0e6"),
    lip: n(mix(p.skin, "#9a2a3a", 0.45)),
    lipDark: n(mix(p.skin, "#3a0a14", 0.6)),
    gold: n("#f0c050"),
    long: p.outfit === "coat" || p.outfit === "labcoat" || p.outfit === "dress" || p.outfit === "apron",
  };
}

interface PoseSpec {
  /** upper-body lift (passing frames) */
  bob: number;
  /** foot lift for each leg */
  liftL: number;
  liftR: number;
  /** arm swing: +1 near arm forward */
  swing: number;
  /** breathing: shoulders settle */
  breath: number;
  blink?: boolean;
}

const POSE_SPECS: Record<Pose, PoseSpec> = {
  idle0: { bob: 0, liftL: 0, liftR: 0, swing: 0, breath: 0 },
  idle1: { bob: 0, liftL: 0, liftR: 0, swing: 0, breath: 1 },
  blink: { bob: 0, liftL: 0, liftR: 0, swing: 0, breath: 0, blink: true },
  walk0: { bob: 0, liftL: 0, liftR: 2, swing: 1, breath: 0 },
  walk1: { bob: 1, liftL: 0, liftR: 0, swing: 0, breath: 0 },
  walk2: { bob: 0, liftL: 2, liftR: 0, swing: -1, breath: 0 },
  walk3: { bob: 1, liftL: 0, liftR: 0, swing: 0, breath: 0 },
};

/* ------------------------------------------------------------------ */
/* the body                                                            */
/* ------------------------------------------------------------------ */

function drawBody(g: Grid, p: SpriteDef, c: Pal, facing: Facing, s: PoseSpec) {
  const front = facing === "front";
  const ty = s.breath - s.bob; // torso offset

  /* ---- legs & shoes ---- */
  const legTop = c.long ? 44 : 38;
  const leg = (x0: number, lift: number) => {
    const fwd = lift > 0 ? -1 : 0; // the lifted foot swings forward
    for (let y = legTop; y < 50 - lift; y++) {
      g.set(x0 + fwd, y, c.legs);
      g.set(x0 + 1 + fwd, y, c.legs);
      g.set(x0 + 2 + fwd, y, c.legsSh);
    }
    const sy = 50 - lift;
    g.rect(x0 - 1 + fwd, sy, 4, 2, c.shoe);
    g.set(x0 - 1 + fwd, sy, n("#3a3040"));
  };
  leg(15, s.liftR);
  leg(11, s.liftL);
  if (p.outfit === "dress") g.set(12, 51 - s.liftL, c.shoe);

  /* ---- torso ---- */
  const top = 24 + ty;
  const waist = 37 + ty;
  for (let y = top; y <= waist; y++) {
    const sh = y < top + 2;
    const x0 = sh ? 9 : 10;
    const x1 = sh ? 19 : 18;
    for (let x = x0; x <= x1; x++) g.set(x, y, x >= x1 - 1 ? c.bodySh : x === x0 ? c.bodySh : c.body);
    g.set(x0 + 1, y, c.bodyHi);
  }
  if (c.long) {
    for (let y = waist + 1; y <= 45; y++) {
      const flare = y >= 43 ? 1 : 0;
      for (let x = 10 - flare; x <= 18 + flare; x++) g.set(x, y, x >= 17 + flare ? c.bodySh : c.body);
      g.set(10 - flare, y, c.bodySh);
    }
    for (let x = 9; x <= 19; x++) if (g.get(x, 45) !== EMPTY) g.set(x, 45, c.bodySh);
  } else {
    for (let x = 10; x <= 18; x++) g.set(x, waist, c.legsSh);
  }

  /* ---- outfit details ---- */
  if (front) {
    switch (p.outfit) {
      case "coat": {
        // popped collar, lapels, a belt with a buckle, double buttons
        g.rect(10, top - 1, 3, 2, c.bodyHi);
        g.rect(16, top - 1, 3, 2, c.bodySh);
        g.rect(13, top, 3, 1, c.shirt);
        g.set(13, top + 1, c.accent);
        g.set(14, top + 1, c.shirt);
        g.set(13, top + 2, c.accent);
        g.set(13, top + 3, c.accentSh);
        for (let y = top + 2; y <= 45; y++) g.set(15, y, c.bodySh);
        for (let x = 10; x <= 18; x++) g.set(x, top + 9, c.bodySh);
        g.set(13, top + 9, c.gold);
        g.set(16, top + 5, c.bodyHi);
        g.set(16, top + 7, c.bodyHi);
        break;
      }
      case "suit": {
        g.rect(13, top, 3, 4, c.shirt);
        for (let y = top + 1; y <= top + 5; y++) g.set(14, y, y === top + 5 ? c.accentSh : c.accent);
        g.set(12, top + 1, c.bodySh);
        g.set(16, top + 1, c.bodySh);
        g.set(17, top + 3, c.accent);
        g.set(14, top + 8, c.bodyHi);
        g.set(14, top + 10, c.bodyHi);
        break;
      }
      case "uniform": {
        g.rect(12, top, 5, 1, c.bodyHi);
        for (let y = top + 2; y < waist; y += 3) g.set(14, y, c.gold);
        g.rect(11, top + 3, 2, 2, c.gold);
        g.set(11, top + 3, n("#fff0a0"));
        for (let x = 10; x <= 18; x++) g.set(x, waist - 1, n("#141018"));
        g.set(13, waist - 1, c.gold);
        break;
      }
      case "sweater": {
        g.rect(12, top, 5, 1, c.bodyHi);
        for (let x = 11; x <= 17; x++) {
          g.set(x, top + 5, c.bodyHi);
          g.set(x, top + 9, c.bodyHi);
        }
        break;
      }
      case "dress": {
        g.rect(13, top, 3, 2, c.skinSh);
        for (const x of [12, 14, 16]) g.set(x, top + 2, n("#f4ecdc")); // pearls
        for (let x = 10; x <= 18; x++) g.set(x, top + 7, c.accentSh);
        break;
      }
      case "apron": {
        g.rect(12, top + 3, 5, waist - top + 6, c.body);
        g.rect(12, top + 3, 5, 1, c.bodyHi);
        g.rect(12, top, 1, 3, c.body);
        g.rect(16, top, 1, 3, c.body);
        for (let x = 10; x <= 18; x++) if (x < 12 || x > 16) g.set(x, waist, c.legsSh);
        break;
      }
      case "labcoat": {
        for (let y = top; y < waist + 6; y++) g.set(14, y, c.shirt);
        g.set(13, top, c.shirt);
        g.set(15, top, c.shirt);
        g.set(17, top + 3, n("#3a5a8a")); // pen
        g.rect(11, top + 8, 2, 1, c.bodySh);
        break;
      }
      case "vest": {
        g.rect(13, top, 3, 2, c.shirt);
        g.set(14, top + 1, c.accent);
        for (let y = top + 3; y < waist; y += 3) g.set(15, y, c.gold);
        break;
      }
    }
  } else {
    // seen from behind: seams, belts, the drape of the cloth
    if (p.outfit === "coat") {
      g.rect(11, top - 1, 7, 2, c.bodySh);
      for (let x = 10; x <= 18; x++) g.set(x, top + 9, c.bodySh);
      for (let y = top + 10; y <= 45; y++) g.set(14, y, c.bodySh);
    } else if (p.outfit === "labcoat") {
      g.rect(11, top, 7, 1, c.bodySh);
      for (let y = top + 10; y <= 45; y++) g.set(14, y, c.bodySh);
    } else if (p.outfit === "apron") {
      for (let x = 10; x <= 18; x++) g.set(x, top + 8, c.body);
      g.set(14, top + 9, c.body);
      g.set(15, top + 10, c.body);
    } else if (p.outfit === "uniform") {
      for (let x = 10; x <= 18; x++) g.set(x, waist - 1, n("#141018"));
    } else if (p.outfit === "dress") {
      for (let y = top; y < top + 5; y++) g.set(14, y, c.accentSh);
    }
  }

  /* ---- arms ---- */
  const arm = (x: number, near: boolean) => {
    const sw = near ? s.swing : -s.swing;
    const handY = 35 + ty + (sw > 0 ? 1 : sw < 0 ? -1 : 0);
    const dx = sw > 0 ? -1 : 0;
    for (let y = top + 1; y < handY; y++) {
      const lean = y > top + 6 ? dx : 0;
      g.set(x + lean, y, near ? c.arm : c.armSh);
      g.set(x + 1 + lean, y, c.armSh);
    }
    g.rect(x + dx, handY, 2, 2, near ? c.skin : c.skinSh);
  };
  if (front) {
    arm(20, false);
    arm(7, true);
  } else {
    arm(7, false);
    arm(20, true);
  }

  /* ---- neck ---- */
  g.rect(12 + (p.age === "old" ? -1 : 0), 22 + s.breath - s.bob, 4, 2, c.skinSh);
}

/* ------------------------------------------------------------------ */
/* the head — big enough to read                                       */
/* ------------------------------------------------------------------ */

function drawHead(g: Grid, p: SpriteDef, c: Pal, facing: Facing, s: PoseSpec) {
  const front = facing === "front";
  const old = p.age === "old";
  const X0 = 9 + (old ? -1 : 0);
  const H0 = 11 + (old ? 1 : 0) + s.breath - s.bob;

  // skull & jaw: an 11×11 rounded block
  for (let y = H0; y <= H0 + 10; y++) {
    const inset = y === H0 ? 1 : y === H0 + 9 ? 1 : y === H0 + 10 ? 2 : 0;
    for (let x = X0 + inset; x <= X0 + 10 - inset; x++) {
      const far = x >= X0 + 9 || (y >= H0 + 8 && x >= X0 + 8);
      g.set(x, y, far ? c.skinSh : c.skin);
    }
  }

  if (front) {
    // a cheekbone catching the key light
    g.set(X0 + 1, H0 + 3, c.skinHi);
    g.set(X0 + 2, H0 + 3, c.skinHi);
    // brows
    g.row(H0 + 4, X0 + 1, X0 + 2, c.hairSh);
    g.row(H0 + 4, X0 + 5, X0 + 6, c.hairSh);
    // eyes, looking the way they face (down-left)
    if (s.blink) {
      g.row(H0 + 6, X0 + 1, X0 + 2, c.lipDark);
      g.row(H0 + 6, X0 + 5, X0 + 6, c.lipDark);
    } else {
      for (const ex of [X0 + 1, X0 + 5]) {
        g.set(ex, H0 + 5, c.eye);
        g.set(ex, H0 + 6, c.eye);
        g.set(ex + 1, H0 + 5, c.white);
        g.set(ex + 1, H0 + 6, c.white);
      }
    }
    // nose
    g.set(X0 + 3, H0 + 6, c.skinHi);
    g.set(X0 + 4, H0 + 7, c.skinSh);
    g.set(X0 + 3, H0 + 7, c.skinSh);
    // mouth
    g.row(H0 + 8, X0 + 2, X0 + 4, c.lip);
    g.set(X0 + 3, H0 + 8, c.lipDark);
    // cheek
    g.set(X0 + 6, H0 + 7, c.blush);
    // the far ear
    g.set(X0 + 9, H0 + 5, c.skin);
    g.set(X0 + 9, H0 + 6, c.skinSh);
    g.set(X0 + 10, H0 + 5, c.skinSh);
    if (p.beard) {
      for (let y = H0 + 7; y <= H0 + 10; y++) for (let x = X0 + 1; x <= X0 + 9; x++) if (g.get(x, y) !== EMPTY && !(y === H0 + 7 && x < X0 + 5)) g.set(x, y, y === H0 + 7 ? c.hairSh : c.hair);
      g.row(H0 + 8, X0 + 2, X0 + 4, c.lip);
      g.set(X0 + 3, H0 + 8, c.lipDark);
      g.set(X0 + 3, H0 + 9, c.hairHi);
    }
    if (p.glasses) {
      const fr = n("#14181e");
      g.row(H0 + 4, X0, X0 + 3, fr);
      g.row(H0 + 4, X0 + 4, X0 + 7, fr);
      g.set(X0, H0 + 5, fr);
      g.set(X0 + 7, H0 + 5, fr);
      g.set(X0 + 2, H0 + 5, n("#cfefff"));
      g.set(X0 + 6, H0 + 5, n("#cfefff"));
      g.set(X0 + 8, H0 + 4, fr); // the arm toward the ear
    }
    if (p.earrings) g.set(X0 + 9, H0 + 7, c.gold);
  } else {
    // from behind: the near ear, the nape
    g.set(X0 + 10, H0 + 5, c.skin);
    g.set(X0 + 10, H0 + 6, c.skinSh);
  }

  /* ---- hair ---- */
  const style = p.hairStyle;
  const hr = (y: number, a: number, b: number, col = c.hair) => g.row(y, X0 + a, X0 + b, col);
  if (style === "bald") {
    g.set(X0 + 3, H0 + 1, c.skinHi);
    g.set(X0 + 4, H0 + 1, c.skinHi);
    g.set(X0 + 4, H0 + 2, c.skinHi);
    for (let y = H0 + 4; y <= H0 + 6; y++) {
      g.set(X0 + 9, y, c.hairSh);
      g.set(X0 + 10, y, c.hairSh);
    }
    if (!front) for (let y = H0 + 5; y <= H0 + 7; y++) hr(y, 0, 10, c.hairSh);
  } else if (style === "buzz") {
    hr(H0, 1, 9, c.hairSh);
    hr(H0 + 1, 0, 10, c.hairSh);
    if (front) {
      for (let y = H0 + 2; y <= H0 + 4; y++) hr(y, 8, 10, c.hairSh);
      g.set(X0, H0 + 2, c.hairSh);
    } else for (let y = H0 + 2; y <= H0 + 7; y++) hr(y, 0, 10, c.hairSh);
  } else {
    const curly = style === "curly";
    // the crown every style shares
    hr(H0 - 2 - (curly ? 1 : 0), 2, 8);
    for (let y = H0 - 1 - (curly ? 1 : 0); y <= H0 + 1; y++) hr(y, 0, 10);
    if (curly) {
      for (let x = -1; x <= 11; x += 2) g.set(X0 + x, H0 - 2, c.hair);
      for (const y of [H0 + 1, H0 + 3, H0 + 5]) {
        g.set(X0 - 1, y, c.hair);
        g.set(X0 + 11, y, c.hair);
      }
    }
    // shine along the crown
    hr(H0 - 1, 3, 5, c.hairHi);
    if (style === "slick") hr(H0, 2, 7, c.hairHi);
    if (front) {
      // fringe over the brow on the near side, volume over the far side
      hr(H0 + 2, 0, 1);
      g.set(X0, H0 + 3, c.hair);
      for (let y = H0 + 2; y <= H0 + 5; y++) {
        g.set(X0 + 9, y, c.hair);
        g.set(X0 + 10, y, c.hairSh);
      }
      if (style !== "slick") hr(H0 + 2, 6, 10);
    } else {
      for (let y = H0 + 2; y <= H0 + 7; y++) hr(y, 0, 10, y > H0 + 5 ? c.hairSh : c.hair);
      hr(H0 + 8, 2, 8, c.hairSh);
    }
    if (style === "long") {
      for (let y = H0 + 2; y <= H0 + 15; y++) {
        if (front) {
          g.set(X0 + 10, y, c.hair);
          g.set(X0 + 11, y, c.hairSh);
          if (y <= H0 + 9) g.set(X0 - 1, y, c.hairSh);
        } else {
          hr(y, 0, 10, y % 4 === 0 ? c.hairHi : c.hair);
          g.set(X0 + 10, y, c.hairSh);
        }
      }
    } else if (style === "bun") {
      g.rect(X0 + (front ? 7 : 3), H0 - 5, 4, 4, c.hair);
      g.set(X0 + (front ? 8 : 4), H0 - 5, c.hairHi);
      g.set(X0 + (front ? 10 : 6), H0 - 2, c.hairSh);
    } else if (style === "ponytail") {
      const x = front ? X0 + 11 : X0 + 4;
      g.set(front ? X0 + 10 : X0 + 4, H0 + 2, c.accent);
      for (let y = H0 + 3; y <= H0 + 13; y++) {
        g.set(x, y, y % 3 === 0 ? c.hairHi : c.hair);
        g.set(x + 1, y, c.hairSh);
      }
    }
  }

  /* ---- hats ---- */
  if (p.hat === "fedora") {
    const felt = n(p.coat ? "#2a2232" : "#2e2619");
    const feltSh = n(p.coat ? "#16121e" : "#1a140e");
    // a low pinched crown over a wide brim
    g.row(H0 - 4, X0 + 3, X0 + 7, felt);
    g.set(X0 + 5, H0 - 4, feltSh);
    for (let y = H0 - 3; y <= H0 - 1; y++) for (let x = X0 + 2; x <= X0 + 8; x++) g.set(x, y, x >= X0 + 7 ? feltSh : felt);
    g.row(H0 - 1, X0 + 2, X0 + 8, c.accent);
    g.set(X0 + 8, H0 - 1, c.accentSh);
    g.row(H0, X0 - 2, X0 + 12, felt);
    g.row(H0, X0 + 9, X0 + 12, feltSh);
    g.set(X0 - 2, H0 - 1, felt);
    g.set(X0 + 12, H0 - 1, feltSh);
    if (front) {
      // a whisper of brim-shadow — not enough to hide the eyes
      g.row(H0 + 1, X0 + 1, X0 + 8, c.hairSh);
      g.row(H0 + 2, X0 + 2, X0 + 7, c.skinSh);
      g.row(H0 + 2, X0, X0 + 1, c.hair);
    }
  } else if (p.hat === "cap") {
    const cl = n("#2c2834");
    for (let y = H0 - 3; y <= H0 + 1; y++) g.row(y, X0 + (y === H0 - 3 ? 1 : 0), X0 + 10 - (y === H0 - 3 ? 1 : 0), cl);
    g.set(X0 + 5, H0 - 3, n("#4a4458"));
    if (front) g.row(H0 + 2, X0 - 3, X0 + 2, n("#1e1a24"));
  } else if (p.hat === "beanie") {
    for (let y = H0 - 4; y <= H0 + 1; y++) for (let x = X0; x <= X0 + 10; x++) g.set(x, y, y === H0 + 1 ? c.accentSh : (x + y) % 2 ? c.accent : c.accentSh);
    g.set(X0 + 5, H0 - 5, c.accent);
  }
}

/* ------------------------------------------------------------------ */
/* outline + masks                                                     */
/* ------------------------------------------------------------------ */

function outline(src: Grid): Grid {
  const out = new Grid();
  out.d.set(src.d);
  for (let y = 0; y < FH; y++) {
    for (let x = 0; x < FW; x++) {
      if (src.get(x, y) !== EMPTY) continue;
      let nb = EMPTY;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const v = src.get(x + dx, y + dy);
        if (v !== EMPTY) {
          nb = v;
          break;
        }
      }
      if (nb === EMPTY) continue;
      // a selective outline: the neighbour's own color, sunk into ink
      const r = ((nb >> 16) & 255) * 0.25 + 12 * 0.75;
      const g = ((nb >> 8) & 255) * 0.25 + 6 * 0.75;
      const b = (nb & 255) * 0.25 + 20 * 0.75;
      out.set(x, y, (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b));
    }
  }
  return out;
}

function mask(src: Grid, dx: number, dy: number): Grid {
  const m = new Grid();
  for (let y = 0; y < FH; y++) {
    for (let x = 0; x < FW; x++) {
      if (src.get(x, y) === EMPTY) continue;
      if (src.get(x + dx, y + dy) === EMPTY) m.set(x, y, 0xffffff);
    }
  }
  return m;
}

function blit(ctx: CanvasRenderingContext2D, g: Grid, ox: number, oy: number) {
  const img = ctx.createImageData(FW, FH);
  for (let i = 0; i < g.d.length; i++) {
    const v = g.d[i];
    if (v === EMPTY) continue;
    img.data[i * 4] = (v >> 16) & 255;
    img.data[i * 4 + 1] = (v >> 8) & 255;
    img.data[i * 4 + 2] = v & 255;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, ox, oy);
}

const cache = new Map<string, HTMLCanvasElement>();

/** The full sheet for one character (cached by appearance). */
export function spriteSheet(def: SpriteDef): HTMLCanvasElement {
  const key = JSON.stringify(def);
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = FW * POSES.length;
  c.height = FH * LAYERS.length * 2;
  const ctx = c.getContext("2d")!;
  const pal = palette(def);
  for (const facing of ["front", "back"] as Facing[]) {
    for (const pose of POSES) {
      const spec = POSE_SPECS[pose];
      const body = new Grid();
      drawBody(body, def, pal, facing, spec);
      const head = new Grid();
      drawHead(head, def, pal, facing, spec);
      const all = new Grid();
      all.d.set(body.d);
      for (let i = 0; i < head.d.length; i++) if (head.d[i] !== EMPTY) all.d[i] = head.d[i];
      const layers: Record<Layer, Grid> = {
        body: outline(all),
        face: head,
        rimL: mask(all, -1, 0),
        rimR: mask(all, 1, 0),
        rimT: mask(all, 0, -1),
      };
      for (const layer of LAYERS) {
        const [x, y] = frameRect(pose, facing, layer);
        blit(ctx, layers[layer], x, y);
      }
    }
  }
  cache.set(key, c);
  return c;
}
