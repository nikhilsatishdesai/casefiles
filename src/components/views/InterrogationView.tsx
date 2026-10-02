"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PixelStage from "@/components/PixelStage";
import Portrait from "@/components/Portrait";
import EvidenceIcon from "@/components/EvidenceIcon";
import { EvidenceDetail } from "@/components/views/CaseFileViews";
import { useGame, activeCase, type ChatMessage } from "@/lib/engine/store";
import { explorationOf } from "@/lib/engine/interrogation";
import { leadsFor, normalizeCorpus } from "@/lib/engine/leads";
import { cityLocation } from "@/lib/city/veilport";
import { GhostButton } from "@/components/ui/bits";
import { useEscapeLayer } from "@/components/ui/escape";
import { useTextCps } from "@/lib/useMotion";
import { audio } from "@/lib/audio/engine";
import type { CaseDef, Mood, SuspectDef } from "@/lib/engine/types";

/* ------------------------------------------------------------------ */
/* typewriter                                                          */
/* ------------------------------------------------------------------ */

function Typewriter({ text, cps, skip, onDone }: { text: string; cps: number; skip: number; onDone: () => void }) {
  const [n, setN] = useState(cps === Infinity ? text.length : 0);
  const skip0 = useRef(skip);
  const done = useRef(false);
  const doneCb = useRef(onDone);
  doneCb.current = onDone;

  useEffect(() => {
    if (skip !== skip0.current) setN(text.length);
  }, [skip, text.length]);

  useEffect(() => {
    if (n >= text.length) {
      if (!done.current) {
        done.current = true;
        doneCb.current();
      }
      return;
    }
    const prev = text[n - 1] ?? "";
    const pause = ".!?".includes(prev) ? 240 : ",;:—".includes(prev) ? 110 : prev === "\n" ? 200 : 0;
    const t = setTimeout(() => {
      setN((k) => Math.min(text.length, k + 1));
      if (n % 3 === 0 && text[n] !== " ") audio.ui("tick");
    }, 1000 / cps + pause);
    return () => clearTimeout(t);
  }, [n, text, cps]);

  return <Paragraphs text={text} shown={n} />;
}

/** Paragraphs with an invisible remainder, so a reply never reflows while it types. */
function Paragraphs({ text, shown = Infinity }: { text: string; shown?: number }) {
  let offset = 0;
  return (
    <>
      {text.split("\n\n").map((p, j) => {
        const start = offset;
        offset += p.length + 2;
        const vis = Math.max(0, Math.min(p.length, shown - start));
        return (
          <p key={j} className={j > 0 ? "mt-3 border-t border-[var(--line)] pt-3" : ""}>
            {p.slice(0, vis)}
            {vis < p.length && <span className="invisible">{p.slice(vis)}</span>}
          </p>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* the interview                                                       */
/* ------------------------------------------------------------------ */

export default function InterrogationView() {
  const caseDef = useGame((s) => activeCase(s));
  const suspectId = useGame((s) => s.activeSuspectId);
  const progress = useGame((s) => (s.activeCaseId ? s.progress[s.activeCaseId] : null));
  const ask = useGame((s) => s.ask);
  const press = useGame((s) => s.press);
  const leaveInterrogation = useGame((s) => s.leaveInterrogation);
  const togglePin = useGame((s) => s.togglePin);
  const cps = useTextCps();

  const [input, setInput] = useState("");
  const [showTray, setShowTray] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [examine, setExamine] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [doneSet, setDoneSet] = useState<Set<number>>(() => new Set());
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suspect = caseDef?.suspects.find((x) => x.id === suspectId);
  const rt = suspectId ? progress?.suspectRuntimes[suspectId] : undefined;
  const log: ChatMessage[] = useMemo(
    () => (suspectId ? (progress?.chatLogs[suspectId] ?? []) : []),
    [progress?.chatLogs, suspectId]
  );
  // a first meeting types out the greeting; a return visit starts where you left off
  const [animFrom] = useState(() => (log.length === 1 ? 0 : log.length));
  const typingIdx = log.findIndex((m, i) => i >= animFrom && m.from === "suspect" && !doneSet.has(i));

  useEscapeLayer(showTray, () => setShowTray(false));

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [log.length, thinking]);

  const corpus = useMemo(() => {
    if (!caseDef || !progress) return " ";
    const texts: string[] = [
      caseDef.newspaper.headline,
      caseDef.newspaper.subhead,
      ...caseDef.newspaper.body,
      ...caseDef.briefing.lines,
      caseDef.victim.bio,
      caseDef.victim.initialFinding,
    ];
    for (const l of Object.values(progress.chatLogs)) for (const m of l) if (m.from === "suspect") texts.push(m.text);
    for (const id of progress.foundEvidence) {
      const ev = caseDef.evidence.find((e) => e.id === id);
      if (ev) texts.push(ev.name, ev.summary, ev.detail, ev.document?.body ?? "");
    }
    for (const loc of caseDef.locations) {
      if (progress.visitedLocations.includes(loc.locationId)) texts.push(loc.arrivalText);
      for (const h of loc.hotspots) if (progress.inspectedHotspots.includes(h.id)) texts.push(h.description);
    }
    return normalizeCorpus(texts);
  }, [caseDef, progress]);

  if (!caseDef || !suspect || !progress) return null;

  const city = cityLocation(suspect.presence);
  const mood: Mood = (rt?.mood as Mood) ?? "neutral";
  const stress = rt?.stress ?? 0;
  const nervous = stress >= suspect.stressThresholds.nervous;
  const breaking = stress >= suspect.stressThresholds.breaking;
  const { explored, total } = explorationOf(suspect, rt);
  const busy = thinking || typingIdx >= 0;

  // the last answered line of questioning, for "press further"
  let lastQuestion: string | undefined;
  let lastTopicId: string | undefined;
  for (let i = log.length - 1; i > 0; i--) {
    if (log[i].from === "suspect" && log[i].topicId && log[i - 1]?.from === "player" && !log[i - 1].evidenceId) {
      lastTopicId = log[i].topicId;
      lastQuestion = log[i - 1].text;
      break;
    }
    if (log[i].from === "player") break;
  }
  const leads = leadsFor({ caseDef, suspect, runtime: rt, found: progress.foundEvidence, corpus, lastQuestion, lastTopicId });

  // two blank looks in a row → a nudge
  let blank = 0;
  for (let i = log.length - 1; i > 0; i -= 2) {
    const reply = log[i];
    const q = log[i - 1];
    if (reply.from !== "suspect" || q?.from !== "player" || q.evidenceId || reply.topicId) break;
    blank++;
  }

  const finishTyping = () => {
    if (typingIdx >= 0) setSkip((k) => k + 1);
  };

  const submit = (q?: string) => {
    const text = (q ?? input).trim();
    if (!text || thinking) return;
    finishTyping();
    if (!q) setInput("");
    setThinking(true);
    audio.ui("click");
    // a breath before they answer — people think before they lie
    setTimeout(() => {
      ask(text);
      setThinking(false);
      inputRef.current?.focus({ preventScroll: true });
    }, 450 + Math.random() * 500);
  };

  const presentEvidence = (evId: string) => {
    if (thinking) return;
    finishTyping();
    setShowTray(false);
    setThinking(true);
    audio.ui("paper");
    setTimeout(() => {
      press(evId);
      setThinking(false);
    }, 650 + Math.random() * 500);
  };

  const examineEv = examine ? caseDef.evidence.find((e) => e.id === examine) : null;

  return (
    <div className="absolute inset-0">
      <PixelStage
        scene={city.scene}
        weather={caseDef.weather}
        timeOfDay={caseDef.timeOfDay}
        seedKey={`${caseDef.id}:${suspect.presence}`}
        dim={0.55}
      />
      <div className="vignette" />

      <div className="absolute inset-0 flex flex-col px-3 pt-[5.5vh] md:px-8" style={{ paddingBottom: "var(--hud-clear)" }}>
        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 gap-5">
          {/* the person across the table */}
          <aside className="hidden w-[232px] shrink-0 flex-col md:flex">
            <div className="glass-bright rounded-sm p-4">
              <div className={`flex justify-center ${breaking ? "portrait-shake" : ""}`}>
                <Portrait def={suspect.portrait} seed={suspect.id} size={196} mood={mood} animated speaking={typingIdx >= 0} label={suspect.name} />
              </div>
              <h2 className="mt-3 font-display text-base leading-snug tracking-[0.18em] text-[var(--paper)]">{suspect.name}</h2>
              <div className="mt-1 text-xs leading-snug text-[var(--steel)]">{suspect.role}</div>
              <PersonMeters suspect={suspect} stress={stress} nervous={nervous} breaking={breaking} mood={mood} explored={explored} total={total} />
              <div className="font-label mt-3 text-[var(--steel-dim)]">AT {city.name.toUpperCase()}</div>
            </div>
            <GhostButton className="mt-3 w-full" onClick={leaveInterrogation}>
              ← END INTERVIEW
            </GhostButton>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            {/* compact header for small screens */}
            <div className="flex items-center gap-3 md:hidden">
              <div className={breaking ? "portrait-shake" : ""}>
                <Portrait def={suspect.portrait} seed={suspect.id} size={58} mood={mood} animated speaking={typingIdx >= 0} label={suspect.name} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-sm tracking-[0.16em] text-[var(--paper)]">{suspect.name}</div>
                <PersonMeters suspect={suspect} stress={stress} nervous={nervous} breaking={breaking} mood={mood} explored={explored} total={total} compact />
              </div>
              <GhostButton className="!px-3" onClick={leaveInterrogation} title="End interview">
                ←
              </GhostButton>
            </div>

            {/* the transcript */}
            <div
              ref={logRef}
              onClick={finishTyping}
              className="scroll-thin mt-3 min-h-0 flex-1 overflow-y-auto md:mt-0"
              aria-live="polite"
            >
              <div className="flex flex-col gap-3 py-2 pr-1">
                {log.map((m, i) => (
                  <Bubble
                    key={i}
                    m={m}
                    caseDef={caseDef}
                    suspect={suspect}
                    typing={i === typingIdx}
                    pending={i > typingIdx && typingIdx >= 0 && i >= animFrom}
                    cps={cps}
                    skip={skip}
                    onDone={() => setDoneSet((s) => new Set(s).add(i))}
                    onExamine={setExamine}
                  />
                ))}
                {thinking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="glass-bright rounded-sm px-4 py-3">
                      <span className="thinking-dots text-[var(--steel)]">
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {blank >= 2 && !busy && (
              <p className="mt-2 text-xs italic text-[var(--steel)]">
                They&apos;re not following you. Try a name, a place, or something from the evidence — or follow one of your
                leads.
              </p>
            )}

            {/* leads */}
            {leads.length > 0 && (
              <div className="mt-2">
                <div className="font-label mb-1.5 text-[var(--steel-dim)]">LEADS</div>
                <div className="scroll-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible">
                  {leads.map((l) => (
                    <button
                      key={`${l.kind}:${l.label}`}
                      disabled={thinking}
                      onClick={() => submit(l.question)}
                      onMouseEnter={() => audio.ui("hover")}
                      title={l.question}
                      className={`shrink-0 rounded-sm border px-2.5 py-1.5 text-xs transition-colors hover:bg-[rgba(232,226,212,0.05)] disabled:opacity-40 ${
                        l.kind === "followup"
                          ? "border-[rgba(255,180,61,0.55)] text-[var(--amber)]"
                          : l.kind === "lead"
                            ? "border-[rgba(58,232,216,0.4)] text-[var(--teal)]"
                            : "border-[var(--line-strong)] text-[var(--paper-dim)]"
                      }`}
                    >
                      {l.kind === "followup" ? "↻ " : l.kind === "lead" ? "◆ " : ""}
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ask */}
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  audio.ui("click");
                  setShowTray((v) => !v);
                }}
                aria-expanded={showTray}
                title="Present evidence"
                className={`btn-ghost font-label shrink-0 rounded-sm px-3 sm:px-4 ${
                  showTray ? "border-[rgba(255,180,61,0.6)] text-[var(--amber)]" : ""
                }`}
              >
                ◈<span className="hidden sm:inline"> PRESENT</span>
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (!input.trim()) finishTyping();
                    else submit();
                  } else if (e.key.length === 1) audio.ui("type");
                }}
                placeholder={`Ask ${suspect.name.replace(/^(Dr\.|Dame|Officer|Captain)\s+/, "").split(" ")[0]} anything…`}
                className="glass min-w-0 flex-1 rounded-sm px-4 py-3 text-[15px] text-[var(--paper)] placeholder:text-[var(--steel-dim)] focus:outline-none"
                aria-label="Your question"
                autoFocus
              />
              <button
                onClick={() => submit()}
                disabled={!input.trim() || thinking}
                className="btn-primary font-label shrink-0 rounded-sm px-4 disabled:opacity-30 sm:px-5"
              >
                ASK
              </button>
            </div>

            {/* the evidence you can put on the table */}
            <AnimatePresence>
              {showTray && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                  className="glass-bright scroll-thin mt-2 flex max-h-[30vh] gap-2 overflow-x-auto rounded-sm p-2.5"
                >
                  {progress.foundEvidence.length === 0 && (
                    <span className="px-2 py-3 text-sm text-[var(--steel)]">
                      You haven&apos;t collected any evidence yet. Search the scene first.
                    </span>
                  )}
                  {progress.foundEvidence.map((evId) => {
                    const ev = caseDef.evidence.find((e) => e.id === evId);
                    if (!ev) return null;
                    const used = rt?.pressedEvidence.includes(evId);
                    return (
                      <button
                        key={evId}
                        onClick={() => presentEvidence(evId)}
                        onMouseEnter={() => audio.ui("hover")}
                        disabled={thinking}
                        className={`group flex w-[132px] shrink-0 flex-col items-start rounded-sm border p-2.5 text-left transition-all duration-200 disabled:opacity-50 ${
                          used
                            ? "border-[var(--line)] opacity-55"
                            : "border-[var(--line-strong)] hover:border-[rgba(255,180,61,0.6)] hover:bg-[rgba(255,180,61,0.05)]"
                        }`}
                        title={`Present: ${ev.name}`}
                      >
                        <EvidenceIcon icon={ev.icon} size={30} />
                        <span className="mt-1.5 text-xs leading-tight text-[var(--paper)]">{ev.name}</span>
                        {used && <span className="font-label mt-1 text-[var(--steel-dim)]">SHOWN</span>}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {examineEv && (
          <EvidenceDetail
            ev={examineEv}
            pinned={progress.pinned.includes(examineEv.id)}
            onPin={() => togglePin(examineEv.id)}
            onClose={() => setExamine(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* pieces                                                              */
/* ------------------------------------------------------------------ */

const MOOD_WORD: Record<Mood, string> = {
  neutral: "guarded",
  calm: "calm",
  smug: "smug",
  nervous: "nervous",
  afraid: "afraid",
  angry: "angry",
  sad: "grieving",
  defensive: "defensive",
};

function PersonMeters({
  suspect,
  stress,
  nervous,
  breaking,
  mood,
  explored,
  total,
  compact = false,
}: {
  suspect: SuspectDef;
  stress: number;
  nervous: boolean;
  breaking: boolean;
  mood: Mood;
  explored: number;
  total: number;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mt-1 space-y-1" : "mt-3 space-y-2.5"}>
      {suspect.isWitness ? (
        <div className="font-label text-[var(--teal)]">WITNESS · {MOOD_WORD[mood].toUpperCase()}</div>
      ) : (
        <div>
          {!compact && (
            <div className="font-label mb-1 flex justify-between text-[var(--steel)]">
              <span>{breaking ? "BREAKING" : nervous ? "UNDER PRESSURE" : "COMPOSED"}</span>
              <span className="text-[var(--amber-dim)]">{MOOD_WORD[mood].toUpperCase()}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div
              className={`h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(232,226,212,0.1)] ${breaking ? "stress-pulse" : ""}`}
              role="meter"
              aria-label="Stress"
              aria-valuenow={stress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div
                animate={{ width: `${stress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: breaking ? "var(--rose)" : nervous ? "var(--amber)" : "var(--teal)" }}
              />
            </div>
            {compact && (
              <span className="font-label text-[9px] text-[var(--steel)]">
                {breaking ? "BREAKING" : nervous ? "PRESSURE" : "COMPOSED"}
              </span>
            )}
          </div>
        </div>
      )}
      <div title="Lines of questioning you've opened with this person. Some only open once you hold the right evidence.">
        {!compact && <div className="font-label mb-1 text-[var(--steel)]">LINES OF QUESTIONING</div>}
        <div className="flex items-center gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-[1px] ${i < explored ? "bg-[var(--paper-dim)]" : "bg-[rgba(232,226,212,0.12)]"}`}
            />
          ))}
          <span className="font-label ml-1.5 text-[9px] text-[var(--steel)]">
            {explored}/{total}
          </span>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  m,
  caseDef,
  suspect,
  typing,
  pending,
  cps,
  skip,
  onDone,
  onExamine,
}: {
  m: ChatMessage;
  caseDef: CaseDef;
  suspect: SuspectDef;
  typing: boolean;
  pending: boolean;
  cps: number;
  skip: number;
  onDone: () => void;
  onExamine: (id: string) => void;
}) {
  if (pending) return null;
  if (m.from === "player") {
    const ev = m.evidenceId ? caseDef.evidence.find((e) => e.id === m.evidenceId) : null;
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex justify-end">
        {ev ? (
          <div className="flex max-w-[85%] items-center gap-3 rounded-sm border border-[rgba(255,180,61,0.5)] bg-[rgba(28,20,8,0.88)] px-3 py-2.5 backdrop-blur-sm">
            <EvidenceIcon icon={ev.icon} size={28} />
            <div>
              <div className="font-label text-[var(--amber-dim)]">YOU PUT ON THE TABLE</div>
              <div className="text-sm text-[var(--amber)]">{ev.name}</div>
            </div>
          </div>
        ) : (
          <div className="glass max-w-[85%] rounded-sm px-4 py-2.5 text-[15px] leading-relaxed text-[var(--paper)]">{m.text}</div>
        )}
      </motion.div>
    );
  }

  const statement = m.contradicts ? caseDef.statements.find((s) => s.id === m.contradicts) : null;
  const revealed = m.revealedEvidence ? caseDef.evidence.find((e) => e.id === m.revealedEvidence) : null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col items-start">
      <div
        className={`glass-bright max-w-[88%] rounded-sm px-4 py-3 text-[15px] leading-relaxed text-[var(--paper-dim)] ${
          m.isBreak ? "border-[rgba(255,58,110,0.5)]" : ""
        }`}
      >
        <div className="font-label mb-1.5 text-[var(--steel)]">
          {suspect.name.toUpperCase()}
          {m.mood && m.mood !== "neutral" && m.mood !== "calm" && (
            <span className="ml-2 text-[var(--amber-dim)]">— {MOOD_WORD[m.mood as Mood] ?? m.mood}</span>
          )}
        </div>
        {typing ? <Typewriter text={m.text} cps={cps} skip={skip} onDone={onDone} /> : <Paragraphs text={m.text} />}
      </div>
      {!typing && (m.statementId || revealed || statement || m.isBreak || m.unmoved) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 flex max-w-[88%] flex-wrap gap-1.5">
          {m.statementId && <span className="marker border-[rgba(58,232,216,0.4)] text-[var(--teal)]">◆ ON THE RECORD</span>}
          {revealed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExamine(revealed.id);
              }}
              className="marker flex items-center gap-1.5 border-[rgba(255,180,61,0.5)] text-[var(--amber)] hover:bg-[rgba(255,180,61,0.08)]"
            >
              <EvidenceIcon icon={revealed.icon} size={16} /> NEW EVIDENCE · {revealed.name.toUpperCase()} · EXAMINE
            </button>
          )}
          {statement && (
            <span className="marker border-[rgba(255,58,110,0.5)] text-[var(--rose)]">
              ✕ CONTRADICTS <s className="ml-1 normal-case tracking-normal opacity-80">{statement.text}</s>
            </span>
          )}
          {m.isBreak && <span className="marker border-[rgba(255,58,110,0.5)] text-[var(--rose)]">BREAKING POINT</span>}
          {m.unmoved && <span className="marker border-[var(--line)] text-[var(--steel-dim)]">NO REACTION</span>}
        </motion.div>
      )}
    </motion.div>
  );
}
