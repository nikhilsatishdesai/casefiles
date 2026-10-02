/**
 * Walking: an 8-way A* over the room's tile grid (no cutting corners past
 * furniture), string-pulled into straight runs, plus circle-vs-tile
 * collision for keyboard movement.
 */

export interface WalkGrid {
  w: number;
  h: number;
  /** 1 = blocked */
  blocked: Uint8Array;
}

export function open(g: WalkGrid, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < g.w && y < g.h && !g.blocked[y * g.w + x];
}

/** Does a circle of radius r centered at (x, y) (tile space) fit? */
export function fits(g: WalkGrid, x: number, y: number, r = 0.26): boolean {
  if (x - r < 0 || y - r < 0 || x + r > g.w || y + r > g.h) return false;
  for (let ty = Math.floor(y - r); ty <= Math.floor(y + r); ty++) {
    for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) {
      if (open(g, tx, ty)) continue;
      // closest point of the blocked tile to the circle's center
      const cx = Math.max(tx, Math.min(x, tx + 1));
      const cy = Math.max(ty, Math.min(y, ty + 1));
      if ((cx - x) ** 2 + (cy - y) ** 2 < r * r) return false;
    }
  }
  return true;
}

/** Move by (dx, dy), sliding along whatever blocks the way. */
export function slide(g: WalkGrid, x: number, y: number, dx: number, dy: number, r = 0.26): [number, number] {
  let nx = x;
  let ny = y;
  if (fits(g, x + dx, y + dy, r)) return [x + dx, y + dy];
  if (dx && fits(g, x + dx, ny, r)) nx = x + dx;
  if (dy && fits(g, nx, y + dy, r)) ny = y + dy;
  return [nx, ny];
}

function clearLine(g: WalkGrid, ax: number, ay: number, bx: number, by: number, r: number): boolean {
  const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 0.15);
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    if (!fits(g, ax + (bx - ax) * t, ay + (by - ay) * t, r)) return false;
  }
  return true;
}

/**
 * Path from a point to a tile's center. Returns waypoints (tile-space
 * points) excluding the start, or null when the tile can't be reached.
 */
export function findPath(g: WalkGrid, from: [number, number], to: [number, number], r = 0.26): [number, number][] | null {
  const sx = Math.floor(from[0]);
  const sy = Math.floor(from[1]);
  const [tx, ty] = to;
  if (!open(g, tx, ty)) return null;
  if (sx === tx && sy === ty) return [[tx + 0.5, ty + 0.5]];
  const N = g.w * g.h;
  const gScore = new Float32Array(N).fill(Infinity);
  const came = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const heap: [number, number][] = []; // [f, idx]
  const push = (f: number, i: number) => {
    heap.push([f, i]);
    let k = heap.length - 1;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (heap[p][0] <= heap[k][0]) break;
      [heap[p], heap[k]] = [heap[k], heap[p]];
      k = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let k = 0;
      for (;;) {
        const l = k * 2 + 1;
        const rr = l + 1;
        let m = k;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (rr < heap.length && heap[rr][0] < heap[m][0]) m = rr;
        if (m === k) break;
        [heap[m], heap[k]] = [heap[k], heap[m]];
        k = m;
      }
    }
    return top;
  };
  const h = (x: number, y: number) => {
    const dx = Math.abs(x - tx);
    const dy = Math.abs(y - ty);
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
  };
  // the start may sit on a tile edge next to a blocked one; let it begin anyway
  const start = sy * g.w + sx;
  gScore[start] = 0;
  push(h(sx, sy), start);
  const goal = ty * g.w + tx;
  while (heap.length) {
    const [, cur] = pop();
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % g.w;
    const cy = (cur - cx) / g.w;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (!open(g, nx, ny)) continue;
        if (dx && dy && (!open(g, cx + dx, cy) || !open(g, cx, cy + dy))) continue;
        const ni = ny * g.w + nx;
        if (closed[ni]) continue;
        const cost = gScore[cur] + (dx && dy ? Math.SQRT2 : 1);
        if (cost < gScore[ni]) {
          gScore[ni] = cost;
          came[ni] = cur;
          push(cost + h(nx, ny), ni);
        }
      }
    }
  }
  if (came[goal] === -1) return null;
  const tiles: [number, number][] = [];
  for (let i = goal; i !== start && i !== -1; i = came[i]) tiles.push([(i % g.w) + 0.5, Math.floor(i / g.w) + 0.5]);
  tiles.reverse();
  // string-pull: skip waypoints we can see past
  const out: [number, number][] = [];
  let ax = from[0];
  let ay = from[1];
  let i = 0;
  while (i < tiles.length) {
    let j = tiles.length - 1;
    while (j > i && !clearLine(g, ax, ay, tiles[j][0], tiles[j][1], r)) j--;
    out.push(tiles[j]);
    [ax, ay] = tiles[j];
    i = j + 1;
  }
  return out;
}

/** Of the open tiles touching a footprint, the one with the shortest walk. */
export function bestApproach(g: WalkGrid, from: [number, number], tiles: [number, number][]): { tile: [number, number]; path: [number, number][] } | null {
  const fx = Math.floor(from[0]);
  const fy = Math.floor(from[1]);
  const set = new Set(tiles.map(([x, y]) => `${x},${y}`));
  const cands: [number, number][] = [];
  for (const [x, y] of tiles) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (set.has(`${nx},${ny}`) && !open(g, nx, ny)) continue;
        if (!open(g, nx, ny)) continue;
        if (!cands.some(([a, b]) => a === nx && b === ny)) cands.push([nx, ny]);
      }
    }
  }
  // already standing in reach
  if (cands.some(([x, y]) => x === fx && y === fy)) return { tile: [fx, fy], path: [] };
  let best: { tile: [number, number]; path: [number, number][]; len: number } | null = null;
  for (const c of cands) {
    const path = findPath(g, from, c);
    if (!path) continue;
    let len = 0;
    let [px, py] = from;
    for (const [x, y] of path) {
      len += Math.hypot(x - px, y - py);
      px = x;
      py = y;
    }
    // orthogonal neighbours read better than diagonal ones
    const [tx, ty] = tiles.reduce((a, t) => (Math.hypot(t[0] - c[0], t[1] - c[1]) < Math.hypot(a[0] - c[0], a[1] - c[1]) ? t : a));
    if (Math.abs(tx - c[0]) + Math.abs(ty - c[1]) > 1) len += 0.35;
    if (!best || len < best.len) best = { tile: c, path, len };
  }
  return best ? { tile: best.tile, path: best.path } : null;
}

/** nearest open tile to a point (for spawns that landed on furniture) */
export function nearestOpen(g: WalkGrid, x: number, y: number): [number, number] {
  let best: [number, number] = [Math.floor(x), Math.floor(y)];
  let bd = Infinity;
  for (let ty = 0; ty < g.h; ty++) {
    for (let tx = 0; tx < g.w; tx++) {
      if (!open(g, tx, ty)) continue;
      const d = (tx + 0.5 - x) ** 2 + (ty + 0.5 - y) ** 2;
      if (d < bd) {
        bd = d;
        best = [tx, ty];
      }
    }
  }
  return best;
}
