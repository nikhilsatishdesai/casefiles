"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Portrait from "@/components/Portrait";
import { useGame, activeCase } from "@/lib/engine/store";
import { Label, GhostButton, EVIDENCE_GLYPH } from "@/components/ui/bits";
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
                  ? "border-[rgba(255, 180, 61,0.6)] text-[var(--amber)]"
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
                className={`glass group relative h-fit rounded-sm p-4 text-left transition-all duration-300 hover:border-[rgba(255, 180, 61,0.45)] ${
                  pinned ? "border-[rgba(255, 58, 110,0.5)]" : ""
                }`}
              >
                {pinned && <span className="absolute right-2 top-2 text-[var(--rose)]">◉</span>}
                <div className="text-2xl text-[var(--amber)]">{EVIDENCE_GLYPH[ev.icon] ?? "◈"}</div>
                <div className="mt-2 text-sm leading-snug text-[var(--paper)]">{ev.name}</div>
                <div className="font-label mt-1 text-[var(--steel)]">{ev.type.toUpperCase()}</div>
                <div className="mt-2 line-clamp-2 text-xs leading-snug text-[var(--steel)]">{ev.summary}</div>
              </motion.button>
            );
          })}
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
      className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(5, 3, 12,0.75)] p-4"
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
              className="mx-auto flex h-36 w-36 items-center justify-center rounded-sm border border-[var(--line-strong)] bg-[rgba(5, 3, 12,0.5)]"
            >
              <span className="text-6xl text-[var(--amber)]">{EVIDENCE_GLYPH[ev.icon] ?? "◈"}</span>
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
              <GhostButton onClick={onPin} className={pinned ? "border-[rgba(255, 58, 110,0.6)] text-[var(--rose)]" : ""}>
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

export function BoardView() {
  const caseDef = useGame((s) => activeCase(s));
  const progress = useGame((s) => (s.activeCaseId ? s.progress[s.activeCaseId] : null));
  const openEvidence = useGame((s) => s.openEvidence);
  const togglePin = useGame((s) => s.togglePin);

  const positions = useMemo(() => {
    if (!caseDef) return {};
    const rnd = rngFor(`board:${caseDef.id}`);
    const map: Record<string, { x: number; y: number; r: number }> = {};
    caseDef.evidence.forEach((e, i) => {
      const angle = (i / caseDef.evidence.length) * Math.PI * 2 + rnd() * 0.5;
      const radius = 26 + rnd() * 14;
      map[e.id] = {
        x: 50 + Math.cos(angle) * radius * 0.85,
        y: 46 + Math.sin(angle) * radius * 0.72,
        r: (rnd() - 0.5) * 6,
      };
    });
    return map;
  }, [caseDef]);

  if (!caseDef || !progress) return null;
  const pinned = progress.pinned.filter((id) => progress.foundEvidence.includes(id));

  return (
    <div className="corkboard absolute inset-0">
      <div className="absolute inset-0 flex flex-col px-4 pb-24 pt-[6vh] md:px-10">
        <header className="flex items-end justify-between">
          <div>
            <Label>CASE FILE · EPISODE {String(caseDef.number).padStart(2, "0")}</Label>
            <h2 className="mt-1 font-display text-xl text-[var(--paper)] md:text-2xl">EVIDENCE BOARD</h2>
          </div>
          <Label>{pinned.length} PINNED · PIN EVIDENCE FROM THE LOCKER</Label>
        </header>

        <div className="relative mt-4 flex-1">
          {/* strings */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {pinned.map((id) => {
              const pos = positions[id];
              if (!pos) return null;
              return (
                <line
                  key={id}
                  x1="50%"
                  y1="42%"
                  x2={`${pos.x}%`}
                  y2={`${pos.y}%`}
                  className="pin-string"
                />
              );
            })}
          </svg>

          {/* victim card — the center of everything */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute left-1/2 top-[42%] z-10 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-44 rotate-[-1.5deg] rounded-[2px] bg-[#e8e2d4] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
              <div className="absolute left-1/2 top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[var(--rose)] shadow" />
              <div className="flex justify-center bg-[#0c1018] py-2">
                <Portrait def={caseDef.victim.portrait} seed="victim" size={64} mood="calm" />
              </div>
              <div className="font-typewriter mt-2 text-center text-sm font-bold uppercase text-[#211c14]">
                {caseDef.victim.name}
              </div>
              <div className="font-typewriter text-center text-[10px] uppercase text-[#5a5142]">
                {caseDef.victim.role}
              </div>
            </div>
          </motion.div>

          {/* pinned evidence */}
          <AnimatePresence>
            {pinned.map((id) => {
              const ev = caseDef.evidence.find((e) => e.id === id);
              const pos = positions[id];
              if (!ev || !pos) return null;
              return (
                <motion.div
                  key={id}
                  drag
                  dragMomentum={false}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1, rotate: pos.r }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div className="w-36 rounded-[2px] bg-[#ddd6c4] p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
                    <div className="absolute left-1/2 top-0.5 h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--rose)]" />
                    <div className="flex items-center gap-2">
                      <span className="text-xl text-[#7a4a1e]">{EVIDENCE_GLYPH[ev.icon] ?? "◈"}</span>
                      <span className="font-typewriter text-[11px] font-bold uppercase leading-tight text-[#211c14]">
                        {ev.name}
                      </span>
                    </div>
                    <p className="font-typewriter mt-1.5 text-[10px] leading-snug text-[#4a4234]">
                      {ev.summary}
                    </p>
                    <div className="mt-2 flex justify-between">
                      <button
                        onClick={() => openEvidence(ev.id)}
                        className="font-typewriter text-[9px] font-bold uppercase text-[#7a4a1e] hover:underline"
                      >
                        Examine
                      </button>
                      <button
                        onClick={() => togglePin(ev.id)}
                        className="font-typewriter text-[9px] font-bold uppercase text-[#8a2c2c] hover:underline"
                      >
                        Unpin
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {pinned.length === 0 && (
            <div className="absolute inset-x-0 top-[68%] text-center text-[var(--steel)]">
              <p className="mx-auto max-w-md italic">
                The board is waiting, Detective. Pin evidence from the locker and let the strings do their
                thinking.
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
          <div className="flex gap-2">
            {(["statements", "suspects", "notes"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  audio.ui("page");
                  setTab(t);
                }}
                className={`font-label rounded-sm border px-3 py-1.5 ${
                  tab === t
                    ? "border-[rgba(255, 180, 61,0.6)] text-[var(--amber)]"
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
                    className={`glass flex gap-4 rounded-sm p-5 ${contradicted ? "border-[rgba(255, 58, 110,0.5)]" : ""}`}
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
                      <button
                        onClick={() => talkTo(s.id)}
                        className="font-label mt-3 text-[var(--amber)] hover:text-[var(--paper)]"
                      >
                        {talked ? "QUESTION AGAIN →" : "INTERVIEW →"}
                      </button>
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
