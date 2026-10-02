/**
 * A tiny variable-width pixel font (5 rows tall) for neon signs, painted
 * shop lettering and departure boards. '#' is ink.
 */

const GLYPHS: Record<string, string[]> = {
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
  C: [".##", "#..", "#..", "#..", ".##"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"],
  F: ["###", "#..", "##.", "#..", "#.."],
  G: [".##", "#..", "#.#", "#.#", ".##"],
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  J: ["..#", "..#", "..#", "#.#", ".#."],
  K: ["#.#", "#.#", "##.", "#.#", "#.#"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
  N: ["#..#", "##.#", "#.##", "#..#", "#..#"],
  O: [".#.", "#.#", "#.#", "#.#", ".#."],
  P: ["##.", "#.#", "##.", "#..", "#.."],
  Q: [".#.", "#.#", "#.#", "##.", ".##"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  S: [".##", "#..", ".#.", "..#", "##."],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", "###"],
  V: ["#.#", "#.#", "#.#", "#.#", ".#."],
  W: ["#...#", "#...#", "#.#.#", "##.##", "#...#"],
  X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  Z: ["###", "..#", ".#.", "#..", "###"],
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#.", "##.", ".#.", ".#.", "###"],
  "2": ["##.", "..#", ".#.", "#..", "###"],
  "3": ["##.", "..#", ".#.", "..#", "##."],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "##.", "..#", "##."],
  "6": [".##", "#..", "###", "#.#", "###"],
  "7": ["###", "..#", ".#.", ".#.", ".#."],
  "8": ["###", "#.#", "###", "#.#", "###"],
  "9": ["###", "#.#", "###", "..#", "##."],
  " ": ["..", "..", "..", "..", ".."],
  ".": [".", ".", ".", ".", "#"],
  ":": [".", "#", ".", "#", "."],
  "-": ["...", "...", "###", "...", "..."],
  "'": ["#", "#", ".", ".", "."],
  "/": ["..#", "..#", ".#.", "#..", "#.."],
  "&": [".#.", "#.#", ".#.", "#.#", ".##"],
  "★": [".#.", "###", ".#.", "#.#", "..."],
};

export const GLYPH_HEIGHT = 5;

function glyph(ch: string): string[] {
  return GLYPHS[ch.toUpperCase()] ?? GLYPHS[" "];
}

/** Width in pixels of a horizontal run of text. */
export function measurePixelText(text: string, spacing = 1, scale = 1): number {
  let w = 0;
  for (const ch of text) w += glyph(ch)[0].length + spacing;
  return Math.max(0, w - spacing) * scale;
}

/** Height in pixels of text stacked vertically, one glyph per row. */
export function measurePixelTextVertical(text: string, spacing = 1, scale = 1): number {
  return Math.max(0, text.length * (GLYPH_HEIGHT + spacing) - spacing) * scale;
}

/**
 * Draw text with the current fillStyle. Vertical text stacks glyphs
 * (centered in a column `colWidth` wide), the way hotel signs hang.
 */
export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: { spacing?: number; vertical?: boolean; colWidth?: number; scale?: number } = {}
): void {
  const spacing = opts.spacing ?? 1;
  const k = opts.scale ?? 1;
  let cx = Math.round(x);
  let cy = Math.round(y);
  for (const ch of text) {
    const g = glyph(ch);
    const gw = g[0].length;
    const ox = opts.vertical ? Math.floor(((opts.colWidth ?? 3 * k) - gw * k) / 2) : 0;
    for (let r = 0; r < g.length; r++) {
      for (let c = 0; c < gw; c++) {
        if (g[r][c] === "#") ctx.fillRect(cx + ox + c * k, cy + r * k, k, k);
      }
    }
    if (opts.vertical) cy += (GLYPH_HEIGHT + spacing) * k;
    else cx += (gw + spacing) * k;
  }
}
