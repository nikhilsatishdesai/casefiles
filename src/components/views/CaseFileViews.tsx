"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Portrait from "@/components/Portrait";
import { useGame, activeCase, locationUnlocked } from "@/lib/engine/store";
import { Label, GhostButton, Tip } from "@/components/ui/bits";
import EvidenceIcon from "@/components/EvidenceIcon";
import { rngFor } from "@/lib/engine/rng";
import { audio } from "@/lib/audio/engine";
import type { EvidenceItem } from "@/lib/engine/types";
import { useEscapeLayer } from "@/components/ui/escape";

/* ------------------------------------------------------------------ */
/* Evidence locker                                                     */
/* ------------------------------------------------------------------ */

export function EvidenceView() {
  const caseDef = useGame((s) => activeCase(s));
  const progress = useGame((s) => (s.activeCaseId ? s.progress[s.activeCaseId] : null));
  const activeEvidenceId = useGame((s) => s.activeEvidenceId);
  const openEvidence = useGame((s) => s.openEvidence);
  const togglePin = useGame((s) => s.togglePin);

  const [filter, setFilter] = useState<string>("all");
  if (!caseDef || !progress) return null;

  const found = caseDef.evidence.filter((e) => progress.foundEvidence.includes(e.id));
  const filtered = filter === "all" ? found : found.filter((e) => e.type === filter);
  const active = activeEvidenceId ? caseDef.evidence.find((e) => e.id === activeEvidenceId) : null;
  const types = Array.from(new Set(found.map((e) => e.type)));

  return (
    <div className="absolute inset-0 bg-[var(--ink)]">
      <div className="absolute inset-0 flex flex-col px-4 pb-24 pt-[6vh] md:px-10">
        <header className="flex items-end justify-between">
          <div>
            <Label>CASE FILE · EPISODE {String(caseDef.number).padStart(2, "0")}</Label>
            <h2 className="mt-1 font-display text-xl text-[var(--paper)] md:text-2xl">EVIDENCE LOCKER</h2>
          </div>
          <Label>
            {found.length} / {caseDef.evidence.length} COLLECTED
          </Label>
        </header>

        {/* filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          {["all", ...types].map((t) => (
            <button
              key={t}
              onClick={() => {
                audio.ui("click");
                setFilter(t);
              }}
              className={`font-label rounded-sm border px-3 py-1.5 transition-colors ${
                filter === t
                  ? "border-[rgba(255,180,61,0.6)] text-[var(--amber)]"
                  : "border-[var(--line)] text-[var(--steel)] hover:text-[var(--paper-dim)]"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* grid */}
        <div className="scroll-thin mt-5 grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.length === 0 && (
            <div className="col-span-full mt-10 text-center text-[var(--steel)]">
              Nothing collected yet. Work the scene, Detective — evidence doesn&apos;t file itself.
            </div>
          )}
          {filtered.map((ev, i) => {
            const pinned = progress.pinned.includes(ev.id);
            return (
              <motion.button
                key={ev.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                onClick={() => openEvidence(ev.id)}
                onMouseEnter={() => audio.ui("hover")}
                className={`glass group relative h-fit rounded-sm p-4 text-left transition-all duration-300 hover:border-[rgba(255,180,61,0.45)] ${
                  pinned ? "border-[rgba(255,58,110,0.5)]" : ""
                }`}
              >
                {pinned && <span className="absolute right-2 top-2 text-[var(--rose)]">◉</span>}
                {!progress.seenEvidence.includes(ev.id) && (
                  <span className="font-label absolute left-2 top-2 rounded-sm bg-[var(--pink)] px-1.5 py-0.5 text-[9px] text-white shadow-[0_0_12px_rgba(255,46,136,0.6)]">
                    NEW
                  </span>
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-[var(--line)] bg-[rgba(5,3,12,0.45)] transition-colors group-hover:border-[rgba(255,180,61,0.45)]">
                  <EvidenceIcon icon={ev.icon} size={32} />
                </div>
                <div className="mt-2 text-sm leading-snug text-[var(--paper)]">{ev.name}</div>
                <div className="font-label mt-1 text-[var(--steel)]">{ev.type.toUpperCase()}</div>
                <div className="mt-2 line-clamp-2 text-xs leading-snug text-[var(--steel)]">{ev.summary}</div>
              </motion.button>
            );
          })}
          {filter === "all" &&
            Array.from({ length: caseDef.evidence.length - found.length }, (_, i) => (
              <div
                key={`slot-${i}`}
                className="h-fit rounded-sm border border-dashed border-[var(--line)] p-4 text-left opacity-60"
                aria-hidden
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-dashed border-[var(--line)] text-[var(--steel-dim)]">
                  ?
                </div>
                <div className="font-label mt-2 text-[var(--steel-dim)]">UNDISCOVERED</div>
              </div>
            ))}
        </div>
      </div>

      {/* detail modal */}
      <AnimatePresence>
        {active && (
          <EvidenceDetail
            ev={active}
            pinned={progress.pinned.includes(active.id)}
            onPin={() => togglePin(active.id)}
            onClose={() => openEvidence(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function EvidenceDetail({
  ev,
  pinned,
  onPin,
  onClose,
}: {
  ev: EvidenceItem;
  pinned: boolean;
  onPin: () => void;
  onClose: () => void;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  useEscapeLayer(true, onClose);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(5,3,12,0.75)] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="scroll-thin max-h-[86vh] w-full max-w-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {ev.document ? (
          <div className={`${ev.document.kind === "cctv" ? "paper-doc-dark" : "paper-doc"} rounded-[2px] p-8 md:p-10`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-typewriter text-lg font-bold uppercase tracking-wider">
                  {ev.document.title}
                </div>
                {ev.document.meta && (
                  <div className="font-mono-doc mt-1 text-[10px] uppercase tracking-widest opacity-70">
                    {ev.document.meta}
                  </div>
                )}
              </div>
              {ev.keyEvidence !== undefined && ev.document.kind !== "news" && (
                <span className="stamp shrink-0">EXHIBIT</span>
              )}
            </div>
            <pre className="font-typewriter mt-6 whitespace-pre-wrap text-[13px] leading-relaxed md:text-sm">
              {ev.document.body}
            </pre>
          </div>
        ) : (
          <div
            className="glass-bright rounded-sm p-8 md:p-10"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setTilt({
                x: ((e.clientY - r.top) / r.height - 0.5) * -6,
                y: ((e.clientX - r.left) / r.width - 0.5) * 8,
              });
            }}
            onMouseLeave={() => setTilt({ x: 0, y: 0 })}
          >
            <motion.div
              animate={{ rotateX: tilt.x, rotateY: tilt.y }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
              style={{ transformPerspective: 600 }}
              className="mx-auto flex h-36 w-36 items-center justify-center rounded-sm border border-[var(--line-strong)] bg-[rgba(5,3,12,0.5)]"
            >
              <EvidenceIcon icon={ev.icon} size={96} />
            </motion.div>
            <div className="font-label mt-3 text-center text-[var(--steel-dim)]">
              MOVE TO EXAMINE
            </div>
          </div>
        )}

        <div className="glass mt-2 rounded-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-lg text-[var(--paper)]">{ev.name}</h3>
              <Label className="mt-1">{ev.type.toUpperCase()} · FOUND: {ev.foundAt.toUpperCase()}</Label>
            </div>
            <div className="flex gap-2">
              <GhostButton onClick={onPin} className={pinned ? "border-[rgba(255,58,110,0.6)] text-[var(--rose)]" : ""}>
                {pinned ? "◉ PINNED" : "PIN TO BOARD"}
              </GhostButton>
              <GhostButton onClick={onClose}>CLOSE</GhostButton>
            </div>
          </div>
          <p className="mt-4 leading-relaxed text-[var(--paper-dim)]">{ev.detail}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Evidence board                                                      */
/* ------------------------------------------------------------------ */

type Pt = { x: number; y: number };

/** a little deterministic tilt per card */
function tiltOf(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h % 7) - 3) * 0.8;
}

export function BoardView() {
  const caseDef = useGame((s) => activeCase(s));
  const progress = useGame((s) => (s.activeCaseId ? s.progress[s.activeCaseId] : null));
  const openEvidence = useGame((s) => s.openEvidence);
  const togglePin = useGame((s) => s.togglePin);
  const setBoardPosition = useGame((s) => s.setBoardPosition);
  const toggleBoardLink = useGame((s) => s.toggleBoardLink);

  const areaRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const [live, setLive] = useState<Record<string, Pt>>({});
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [cursor, setCursor] = useState<Pt | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  useEscapeLayer(!!linkFrom, () => setLinkFrom(null));

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth || 1, h: el.clientHeight || 1 }));
    ro.observe(el);
    setSize({ w: el.clientWidth || 1, h: el.clientHeight || 1 });
    return () => ro.disconnect();
  }, []);

  // who's worth a photograph: suspects you've met or whose ground you've walked
  const suspects = useMemo(() => {
    if (!caseDef || !progress) return [];
    return caseDef.suspects.filter(
      (s) => !s.isWitness && (progress.suspectRuntimes[s.id]?.greeted || progress.visitedLocations.includes(s.presence))
    );
  }, [caseDef, progress]);

  const pinned = useMemo(
    () => (progress ? progress.pinned.filter((id) => progress.foundEvidence.includes(id)) : []),
    [progress]
  );

  const defaults = useMemo(() => {
    const map: Record<string, Pt> = { victim: { x: 50, y: 46 } };
    suspects.forEach((s, i) => {
      const t = suspects.length === 1 ? 0.5 : i / (suspects.length - 1);
      map[`sus:${s.id}`] = { x: 14 + t * 72, y: 15 + Math.sin(t * Math.PI) * -2 };
    });
    pinned.forEach((id, i) => {
      const a = Math.PI * (0.15 + (i / Math.max(1, pinned.length)) * 0.7) + (i % 2) * 0.12;
      map[`ev:${id}`] = { x: 50 + Math.cos(a) * 38, y: 58 + Math.sin(a) * 26 };
    });
    return map;
  }, [suspects, pinned]);

  if (!caseDef || !progress) return null;
  const saved = progress.board.positions;
  const pos = (id: string): Pt => live[id] ?? saved[id] ?? defaults[id] ?? { x: 50, y: 50 };
  const cards = ["victim", ...suspects.map((s) => `sus:${s.id}`), ...pinned.map((id) => `ev:${id}`)];
  const links = progress.board.links.filter(([a, b]) => cards.includes(a) && cards.includes(b));

  const toPct = (clientX: number, clientY: number): Pt => {
    const r = areaRef.current!.getBoundingClientRect();
    return {
      x: Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100)),
      y: Math.max(6, Math.min(94, ((clientY - r.top) / r.height) * 100)),
    };
  };

  const startDrag = (id: string, e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const p = toPct(e.clientX, e.clientY);
    const c = pos(id);
    drag.current = { id, dx: c.x - p.x, dy: c.y - p.y, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moveDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toPct(e.clientX, e.clientY);
    d.moved = true;
    setLive((l) => ({ ...l, [d.id]: { x: p.x + d.dx, y: p.y + d.dy } }));
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const p = live[d.id];
    if (d.moved && p) {
      setBoardPosition(d.id, { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 });
      audio.ui("pin");
    }
    setLive((l) => {
      const n = { ...l };
      delete n[d.id];
      return n;
    });
  };

  const pinClick = (id: string) => {
    if (!linkFrom) {
      setLinkFrom(id);
      audio.ui("click");
      return;
    }
    if (linkFrom !== id) {
      toggleBoardLink(linkFrom, id);
      audio.ui("pin");
    }
    setLinkFrom(null);
    setCursor(null);
  };

  /** a string sagging between two pins, in px */
  const stringPath = (a: Pt, b: Pt) => {
    const ax = (a.x / 100) * size.w;
    const ay = (a.y / 100) * size.h;
    const bx = (b.x / 100) * size.w;
    const by = (b.y / 100) * size.h;
    const sag = 18 + Math.hypot(bx - ax, by - ay) * 0.08;
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2 + sag;
    return { d: `M${ax},${ay} Q${mx},${my} ${bx},${by}`, mid: { x: mx, y: (ay + by) / 2 + sag / 2 } };
  };
  const cardPin = (id: string, color = "var(--rose)") => (
    <button
      onClick={() => pinClick(id)}
      className={`absolute left-1/2 top-0 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,0,0,0.4)] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform hover:scale-125 ${
        linkFrom === id ? "scale-125 ring-2 ring-[var(--cyan)]" : ""
      }`}
      style={{ background: `radial-gradient(circle at 35% 35%, #ffb0c8, ${color} 60%)` }}
      aria-label="Tie a string from this pin"
      title="Tie a string"
    />
  );

  return (
    <div className="corkboard absolute inset-0">
      <div className="absolute inset-0 flex flex-col px-4 pb-24 pt-[6vh] md:px-10">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <Label>CASE FILE · EPISODE {String(caseDef.number).padStart(2, "0")}</Label>
            <h2 className="mt-1 font-display text-xl text-[var(--paper)] md:text-2xl">EVIDENCE BOARD</h2>
          </div>
          <Label className={linkFrom ? "text-[var(--cyan)]" : ""}>
            {linkFrom ? "NOW CLICK ANOTHER PIN · ESC TO CANCEL" : `${pinned.length} PINNED · DRAG CARDS · CLICK TWO PINS TO TIE A STRING`}
          </Label>
        </header>

        <div
          ref={areaRef}
          className="relative mt-4 flex-1 select-none"
          onPointerMove={(e) => {
            moveDrag(e);
            if (linkFrom) setCursor(toPct(e.clientX, e.clientY));
          }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* strings */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            {suspects.map((s) => {
              const { d } = stringPath(pos("victim"), pos(`sus:${s.id}`));
              return <path key={s.id} d={d} className="board-thread" />;
            })}
            {links.map(([a, b]) => {
              const { d } = stringPath(pos(a), pos(b));
              return (
                <g key={`${a}|${b}`}>
                  <path d={d} className="pin-string-glow" />
                  <path d={d} className="pin-string" />
                </g>
              );
            })}
            {linkFrom && cursor && <path d={stringPath(pos(linkFrom), cursor).d} className="pin-string" strokeDasharray="5 4" />}
          </svg>

          {/* snip a string at its middle */}
          {links.map(([a, b]) => {
            const { mid } = stringPath(pos(a), pos(b));
            return (
              <button
                key={`x-${a}|${b}`}
                onClick={() => {
                  toggleBoardLink(a, b);
                  audio.ui("paper");
                }}
                className="absolute z-20 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,58,110,0.6)] bg-[rgba(20,8,16,0.85)] text-[10px] text-[var(--rose)] opacity-30 transition-opacity hover:opacity-100"
                style={{ left: mid.x, top: mid.y }}
                aria-label="Cut this string"
                title="Cut the string"
              >
                ✕
              </button>
            );
          })}

          {/* the victim, at the center of everything */}
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none active:cursor-grabbing"
            style={{ left: `${pos("victim").x}%`, top: `${pos("victim").y}%` }}
            onPointerDown={(e) => startDrag("victim", e)}
          >
            <div className="relative w-40 rounded-[2px] bg-[#ece6d8] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)]" style={{ transform: "rotate(-1.5deg)" }}>
              {cardPin("victim")}
              <div className="flex justify-center bg-[#0c0816] py-2">
                <Portrait def={caseDef.victim.portrait} seed="victim" size={64} mood="calm" />
              </div>
              <div className="font-typewriter mt-2 text-center text-sm font-bold uppercase text-[#211c14]">{caseDef.victim.name}</div>
              <div className="font-typewriter text-center text-[10px] uppercase text-[#5a5142]">{caseDef.victim.role}</div>
            </div>
          </div>

          {/* suspects, as polaroids */}
          {suspects.map((s) => {
            const id = `sus:${s.id}`;
            const p = pos(id);
            const rt = progress.suspectRuntimes[s.id];
            return (
              <div
                key={id}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none active:cursor-grabbing"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                onPointerDown={(e) => startDrag(id, e)}
              >
                <div className="relative w-28 bg-[#f4f0e8] p-2 pb-1 shadow-[0_8px_22px_rgba(0,0,0,0.55)]" style={{ transform: `rotate(${tiltOf(id)}deg)` }}>
                  {cardPin(id, "#3a8aff")}
                  <div className="flex justify-center bg-[#0c0816]">
                    <Portrait def={s.portrait} seed={s.id} size={72} mood={(rt?.mood as never) ?? "neutral"} />
                  </div>
                  <div className="font-hand mt-1 truncate text-center text-[13px] leading-tight text-[#2a2030]">{s.name.split(" ")[0]}</div>
                  <div className="font-typewriter truncate text-center text-[8px] uppercase text-[#6a5a52]">{s.role}</div>
                </div>
              </div>
            );
          })}

          {/* pinned evidence */}
          <AnimatePresence>
            {pinned.map((evId) => {
              const ev = caseDef.evidence.find((e) => e.id === evId);
              if (!ev) return null;
              const id = `ev:${evId}`;
              const p = pos(id);
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none active:cursor-grabbing"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  onPointerDown={(e) => startDrag(id, e)}
                >
                  <div className="relative w-36 rounded-[2px] bg-[#e4dcc8] p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.55)]" style={{ transform: `rotate(${tiltOf(id)}deg)` }}>
                    {cardPin(id)}
                    <div className="flex items-center gap-2">
                      <EvidenceIcon icon={ev.icon} size={24} />
                      <span className="font-typewriter text-[11px] font-bold uppercase leading-tight text-[#211c14]">{ev.name}</span>
                    </div>
                    <p className="font-typewriter mt-1.5 line-clamp-3 text-[10px] leading-snug text-[#4a4234]">{ev.summary}</p>
                    <div className="mt-2 flex justify-between">
                      <button onClick={() => openEvidence(ev.id)} className="font-typewriter text-[9px] font-bold uppercase text-[#7a4a1e] hover:underline">
                        Examine
                      </button>
                      <button onClick={() => togglePin(ev.id)} className="font-typewriter text-[9px] font-bold uppercase text-[#8a2c2c] hover:underline">
                        Unpin
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <Tip id="board" title="THE BOARD" className="absolute bottom-2 left-1/2 -translate-x-1/2">
            Drag cards wherever they make sense to you. Click one pin, then another, to tie a string between them; click
            the knot in a string to cut it. Pin more evidence from the locker.
          </Tip>

          {pinned.length === 0 && (
            <div className="absolute inset-x-0 top-[74%] text-center text-[var(--steel)]">
              <p className="mx-auto max-w-md italic">
                The board is waiting, Detective. Pin evidence from the locker, then tie strings between what belongs
                together.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Notebook                                                            */
/* ------------------------------------------------------------------ */

export function NotebookView() {
  const caseDef = useGame((s) => activeCase(s));
  const progress = useGame((s) => (s.activeCaseId ? s.progress[s.activeCaseId] : null));
  const setNotes = useGame((s) => s.setNotes);
  const talkTo = useGame((s) => s.talkTo);
  const setView = useGame((s) => s.setView);
  const [tab, setTab] = useState<"statements" | "suspects" | "notes">("statements");
  if (!caseDef || !progress) return null;

  const suspects = caseDef.suspects.filter((s) => !s.isWitness);

  return (
    <div className="absolute inset-0 bg-[var(--ink)]">
      <div className="absolute inset-0 flex flex-col px-4 pb-24 pt-[6vh] md:px-10">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Label>CASE FILE · EPISODE {String(caseDef.number).padStart(2, "0")}</Label>
            <h2 className="mt-1 font-display text-xl text-[var(--paper)] md:text-2xl">DETECTIVE&apos;S NOTEBOOK</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                audio.ui("page");
                setView("briefing");
              }}
              className="font-label rounded-sm border border-[var(--line)] px-3 py-1.5 text-[var(--steel)] hover:text-[var(--paper-dim)]"
              title="Hear Captain Voss's briefing again"
            >
              BRIEFING ↺
            </button>
            {(["statements", "suspects", "notes"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  audio.ui("page");
                  setTab(t);
                }}
                className={`font-label rounded-sm border px-3 py-1.5 ${
                  tab === t
                    ? "border-[rgba(255,180,61,0.6)] text-[var(--amber)]"
                    : "border-[var(--line)] text-[var(--steel)]"
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <div className="scroll-thin mt-5 flex-1 overflow-y-auto">
          {tab === "statements" && (
            <div className="mx-auto max-w-3xl space-y-3">
              {progress.statements.length === 0 && (
                <p className="mt-10 text-center italic text-[var(--steel)]">
                  No formal statements yet. People say the most useful things when you ask about
                  alibis, victims, and each other.
                </p>
              )}
              {progress.statements.map((sid) => {
                const st = caseDef.statements.find((x) => x.id === sid);
                if (!st) return null;
                const suspect = caseDef.suspects.find((x) => x.id === st.suspectId);
                const contradicted = progress.contradictions.includes(sid);
                return (
                  <motion.div
                    key={sid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass flex gap-4 rounded-sm p-5 ${contradicted ? "border-[rgba(255,58,110,0.5)]" : ""}`}
                  >
                    {suspect && <Portrait def={suspect.portrait} seed={suspect.id} size={48} />}
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <Label>{suspect?.name.toUpperCase()}</Label>
                        {contradicted ? (
                          <span className="font-label text-[var(--rose)]">✕ CONTRADICTED BY EVIDENCE</span>
                        ) : (
                          <span className="font-label text-[var(--steel-dim)]">ON THE RECORD</span>
                        )}
                      </div>
                      <p className={`mt-2 italic leading-relaxed ${contradicted ? "text-[var(--paper-dim)] line-through decoration-[var(--rose)] decoration-1" : "text-[var(--paper-dim)]"}`}>
                        {st.text}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {tab === "suspects" && (
            <div className="mx-auto grid max-w-4xl gap-3 md:grid-cols-2">
              {suspects.map((s) => {
                const rt = progress.suspectRuntimes[s.id];
                const talked = !!rt?.greeted;
                // you can't question someone behind a door you haven't opened
                const lockedLoc = caseDef.locations.find((l) => l.locationId === s.presence);
                const reachable = !lockedLoc || locationUnlocked(caseDef, s.presence, progress.foundEvidence);
                return (
                  <div key={s.id} className="glass flex gap-4 rounded-sm p-5">
                    <Portrait def={s.portrait} seed={s.id} size={68} mood={(rt?.mood as never) ?? "neutral"} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[var(--paper)]">{s.name}</div>
                      <Label className="mt-0.5">{s.role.toUpperCase()}</Label>
                      <p className="mt-2 text-xs leading-snug text-[var(--steel)]">{s.personality}</p>
                      <div className="mt-2 space-y-1 text-xs">
                        <div>
                          <span className="text-[var(--teal)]">Alibi — </span>
                          <span className="text-[var(--paper-dim)]">{talked ? s.alibi : "Not yet interviewed."}</span>
                        </div>
                        <div>
                          <span className="text-[var(--amber)]">Angle — </span>
                          <span className="text-[var(--paper-dim)]">{s.motiveHint}</span>
                        </div>
                      </div>
                      {reachable ? (
                        <button
                          onClick={() => talkTo(s.id)}
                          className="font-label mt-3 text-[var(--amber)] hover:text-[var(--paper)]"
                        >
                          {talked ? "QUESTION AGAIN →" : "INTERVIEW →"}
                        </button>
                      ) : (
                        <div className="mt-3">
                          <span className="font-label text-[var(--steel-dim)]">◇ NO ACCESS YET</span>
                          {lockedLoc?.locked && <p className="mt-1 text-[11px] leading-snug text-[var(--steel)]">{lockedLoc.locked.note}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "notes" && (
            <div className="mx-auto max-w-3xl">
              <textarea
                value={progress.notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={"Timelines. Lies. The thing that doesn't fit.\nWrite it down before the city talks you out of it."}
                className="font-hand glass min-h-[46vh] w-full rounded-sm p-6 text-lg leading-loose text-[var(--paper)] placeholder:text-[var(--steel-dim)] focus:outline-none"
              />
              <div className="font-label mt-2 text-right text-[var(--steel-dim)]">
                SAVED AUTOMATICALLY · YOUR EYES ONLY
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
