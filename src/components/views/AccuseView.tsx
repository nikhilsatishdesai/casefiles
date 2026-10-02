"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PixelStage from "@/components/PixelStage";
import Portrait from "@/components/Portrait";
import EvidenceIcon from "@/components/EvidenceIcon";
import { useGame, activeCase } from "@/lib/engine/store";
import { RECURRING_CAST } from "@/lib/city/veilport";
import { Label, GhostButton, PrimaryButton } from "@/components/ui/bits";
import { useEscapeLayer } from "@/components/ui/escape";
import { audio } from "@/lib/audio/engine";

const MAX_CITED = 4;

export default function AccuseView() {
  const caseDef = useGame((s) => activeCase(s));
  const progress = useGame((s) => (s.activeCaseId ? s.progress[s.activeCaseId] : null));
  const accuse = useGame((s) => s.accuse);
  const setView = useGame((s) => s.setView);

  const [suspectId, setSuspectId] = useState<string | null>(null);
  const [motiveId, setMotiveId] = useState<string | null>(null);
  const [cited, setCited] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);

  useEscapeLayer(confirming, () => setConfirming(false));
  useEscapeLayer(!!rejected, () => setView("citymap"));

  /** evidence the detective has strung to each suspect on the board */
  const boardLinks = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const [a, b] of progress?.board.links ?? []) {
      const sus = a.startsWith("sus:") ? a : b.startsWith("sus:") ? b : null;
      const ev = a.startsWith("ev:") ? a : b.startsWith("ev:") ? b : null;
      if (!sus || !ev) continue;
      (map[sus.slice(4)] ??= new Set()).add(ev.slice(3));
    }
    return map;
  }, [progress?.board.links]);

  if (!caseDef || !progress) return null;
  const suspects = caseDef.suspects.filter((s) => !s.isWitness);
  const ready = suspectId && motiveId && cited.length > 0;
  const linked = suspectId ? (boardLinks[suspectId] ?? new Set<string>()) : new Set<string>();
  const accused = suspects.find((s) => s.id === suspectId);

  const toggleCite = (id: string) => {
    audio.ui("pin");
    setCited((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < MAX_CITED ? [...c, id] : c));
  };

  const citeBoard = () => {
    audio.ui("pin");
    setCited(progress.foundEvidence.filter((e) => linked.has(e)).slice(0, MAX_CITED));
  };

  return (
    <div className="absolute inset-0">
      <PixelStage scene="precinct" weather={caseDef.weather} timeOfDay="night" seedKey={`${caseDef.id}:accuse`} dim={0.62} />
      <div className="vignette" />

      <div className="view-scroll absolute inset-0 flex flex-col overflow-y-auto scroll-thin px-4 pt-[6vh] md:px-10">
        <header className="mx-auto w-full max-w-4xl">
          <Label className="text-[var(--rose)]">THE ACCUSATION · CHOOSE CAREFULLY</Label>
          <h2 className="mt-1 font-display text-xl text-[var(--paper)] md:text-2xl">
            WHO KILLED {caseDef.victim.name.toUpperCase()}?
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--steel)]">
            Name the culprit, name the motive, and cite the exhibits that carry it. A wrong arrest costs you
            standing — and a conviction without proof is only a guess with a badge on it.
          </p>
        </header>

        {/* suspects */}
        <section className="mx-auto mt-6 w-full max-w-4xl">
          <Label className="mb-2">I. THE CULPRIT</Label>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {suspects.map((s) => {
              const on = suspectId === s.id;
              const links = boardLinks[s.id]?.size ?? 0;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    audio.ui("click");
                    setSuspectId(s.id);
                  }}
                  className={`glass relative flex flex-col items-center gap-2 rounded-sm p-4 transition-all duration-300 ${
                    on ? "border-[var(--rose)] bg-[rgba(224,92,110,0.08)]" : "hover:border-[var(--line-strong)]"
                  }`}
                >
                  {links > 0 && (
                    <span className="font-label absolute right-2 top-2 text-[var(--rose)]" title="Exhibits strung to this suspect on your board">
                      ⟡ {links}
                    </span>
                  )}
                  <Portrait def={s.portrait} seed={s.id} size={64} mood={on ? "afraid" : "neutral"} />
                  <span className="text-center text-sm leading-tight text-[var(--paper)]">{s.name}</span>
                  <span className="font-label text-center text-[var(--steel)]">{s.role}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* motive */}
        <section className="mx-auto mt-8 w-full max-w-4xl">
          <Label className="mb-2">II. THE MOTIVE</Label>
          <div className="grid gap-2 md:grid-cols-2">
            {caseDef.motives.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  audio.ui("click");
                  setMotiveId(m.id);
                }}
                className={`glass rounded-sm px-4 py-3 text-left text-sm transition-all duration-300 ${
                  motiveId === m.id
                    ? "border-[var(--amber)] bg-[rgba(232,168,73,0.08)] text-[var(--amber)]"
                    : "text-[var(--paper-dim)] hover:border-[var(--line-strong)]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </section>

        {/* evidence citation */}
        <section className="mx-auto mt-8 w-full max-w-4xl">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <Label>
              III. THE PROOF — CITE UP TO {MAX_CITED} ({cited.length}/{MAX_CITED})
            </Label>
            {linked.size > 0 && (
              <button onClick={citeBoard} className="font-label text-[var(--rose)] hover:text-[var(--paper)]">
                ⟡ CITE WHAT YOUR BOARD LINKS TO {accused?.name.split(" ")[0].toUpperCase()}
              </button>
            )}
          </div>
          {progress.foundEvidence.length === 0 && (
            <p className="text-sm italic text-[var(--steel)]">You have no evidence to cite. Voss won&apos;t sign on a hunch.</p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {progress.foundEvidence.map((id) => {
              const ev = caseDef.evidence.find((e) => e.id === id);
              if (!ev) return null;
              const on = cited.includes(id);
              const isLinked = linked.has(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleCite(id)}
                  className={`glass flex items-center gap-3 rounded-sm p-2.5 text-left transition-all duration-200 ${
                    on ? "border-[var(--teal)] bg-[rgba(79,216,196,0.07)]" : "hover:border-[var(--line-strong)]"
                  }`}
                >
                  <EvidenceIcon icon={ev.icon} size={28} muted={!on && cited.length >= MAX_CITED} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs leading-tight text-[var(--paper)]">{ev.name}</span>
                    {isLinked && <span className="font-label mt-0.5 block text-[var(--rose)]">⟡ ON YOUR BOARD</span>}
                  </span>
                  <span className={`font-label ${on ? "text-[var(--teal)]" : "text-[var(--steel-dim)]"}`}>
                    {on ? "CITED" : "CITE"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mx-auto mt-10 flex w-full max-w-4xl justify-between pb-6">
          <GhostButton onClick={() => setView("citymap")}>← NOT YET</GhostButton>
          <PrimaryButton disabled={!ready} onClick={() => setConfirming(true)}>
            MAKE THE ACCUSATION
          </PrimaryButton>
        </div>
      </div>

      {/* confirmation */}
      <AnimatePresence>
        {confirming && accused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(4,6,10,0.85)] p-4"
            onClick={() => setConfirming(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-bright w-full max-w-md rounded-sm p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Portrait def={accused.portrait} seed={accused.id} size={90} mood="afraid" className="mx-auto" />
              <h3 className="mt-4 font-display text-xl text-[var(--paper)]">{accused.name}</h3>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {cited.map((id) => {
                  const ev = caseDef.evidence.find((e) => e.id === id);
                  return ev ? <EvidenceIcon key={id} icon={ev.icon} size={24} /> : null;
                })}
              </div>
              <p className="mt-4 text-sm text-[var(--steel)]">
                “You&apos;re certain, Detective?” Voss holds the warrant, pen hovering. “Because once I sign
                this, one of us has to be right.”
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <GhostButton onClick={() => setConfirming(false)}>RECONSIDER</GhostButton>
                <button
                  onClick={() => {
                    audio.ui("stamp");
                    setConfirming(false);
                    const res = accuse(accused.id, motiveId!, cited);
                    if (!res.correct) setRejected(accused.id);
                  }}
                  className="btn-danger font-label rounded-sm px-5 py-3"
                >
                  SIGN THE WARRANT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the charges don't hold */}
      <AnimatePresence>
        {rejected && (
          <WrongAccusation
            name={suspects.find((s) => s.id === rejected)?.name ?? "them"}
            strikes={progress.wrongAccusations}
            onBack={() => setView("citymap")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const REJECTIONS = [
  (n: string) =>
    `“The DA read your file twice and laughed once. ${n} had an answer for every exhibit you cited, and a lawyer for the rest. They walked out the front door, Detective. Go find me the one who didn't.”`,
  (n: string) =>
    `“${n} is home tonight, and the papers will have my name next to the word ‘wrongful’ by breakfast. The truth is still out there — and it's laughing at us.”`,
  (n: string) =>
    `“Again? ${n}'s alibi held like a seawall. One more like this and I'm taking your badge for safekeeping.”`,
];

function WrongAccusation({ name, strikes, onBack }: { name: string; strikes: number; onBack: () => void }) {
  const voss = RECURRING_CAST.voss;
  const line = REJECTIONS[Math.min(REJECTIONS.length - 1, Math.max(0, strikes - 1))](name);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(14,4,6,0.88)] p-4"
    >
      <motion.div
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="glass-bright w-full max-w-md rounded-sm border-[rgba(224,92,110,0.45)] p-8 text-center"
      >
        <motion.div
          initial={{ scale: 2.2, rotate: -14, opacity: 0 }}
          animate={{ scale: 1, rotate: -6, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.15 }}
          className="moment-stamp mx-auto inline-block !text-2xl"
        >
          CHARGES DROPPED
        </motion.div>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Portrait def={voss.portrait} seed={voss.id} size={64} mood="angry" />
        </div>
        <p className="mt-4 text-sm italic leading-relaxed text-[var(--paper-dim)]">{line}</p>
        <p className="font-label mt-4 text-[var(--rose)]">−150 PTS AT RATING TIME · WRONG ARRESTS: {strikes}</p>
        <div className="mt-6">
          <PrimaryButton onClick={onBack}>BACK TO THE STREETS →</PrimaryButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
