"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PixelStage from "@/components/PixelStage";
import Portrait from "@/components/Portrait";
import { useGame, activeCase } from "@/lib/engine/store";
import { Label, GhostButton, PrimaryButton, EVIDENCE_GLYPH } from "@/components/ui/bits";
import { audio } from "@/lib/audio/engine";

export default function AccuseView() {
  const caseDef = useGame((s) => activeCase(s));
  const progress = useGame((s) => (s.activeCaseId ? s.progress[s.activeCaseId] : null));
  const accuse = useGame((s) => s.accuse);
  const setView = useGame((s) => s.setView);

  const [suspectId, setSuspectId] = useState<string | null>(null);
  const [motiveId, setMotiveId] = useState<string | null>(null);
  const [cited, setCited] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);

  if (!caseDef || !progress) return null;
  const suspects = caseDef.suspects.filter((s) => !s.isWitness);
  const ready = suspectId && motiveId && cited.length > 0;

  const toggleCite = (id: string) => {
    audio.ui("pin");
    setCited((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 4 ? [...c, id] : c));
  };

  return (
    <div className="absolute inset-0">
      <PixelStage scene="precinct" weather={caseDef.weather} timeOfDay="night" seedKey={`${caseDef.id}:accuse`} dim={0.6} />
      <div className="vignette" />

      <div className="absolute inset-0 flex flex-col overflow-y-auto scroll-thin px-4 pb-24 pt-[6vh] md:px-10">
        <header className="mx-auto w-full max-w-4xl">
          <Label className="text-[var(--rose)]">THE ACCUSATION · CHOOSE CAREFULLY</Label>
          <h2 className="mt-1 font-display text-xl text-[var(--paper)] md:text-2xl">
            WHO KILLED {caseDef.victim.name.toUpperCase()}?
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--steel)]">
            Voss will back your arrest — once. Name the culprit, name the motive, and cite the evidence
            that carries it. A wrong accusation costs you standing, and the truth doesn&apos;t wait.
          </p>
        </header>

        {/* suspects */}
        <section className="mx-auto mt-6 w-full max-w-4xl">
          <Label className="mb-2">I. THE CULPRIT</Label>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {suspects.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  audio.ui("click");
                  setSuspectId(s.id);
                }}
                className={`glass flex flex-col items-center gap-2 rounded-sm p-4 transition-all duration-300 ${
                  suspectId === s.id
                    ? "border-[var(--rose)] bg-[rgba(224,92,110,0.08)]"
                    : "hover:border-[var(--line-strong)]"
                }`}
              >
                <Portrait def={s.portrait} seed={s.id} size={64} mood={suspectId === s.id ? "afraid" : "neutral"} />
                <span className="text-center text-sm leading-tight text-[var(--paper)]">{s.name}</span>
                <span className="font-label text-center text-[var(--steel)]">{s.role}</span>
              </button>
            ))}
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
          <Label className="mb-2">III. THE PROOF — CITE UP TO FOUR ({cited.length}/4)</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {progress.foundEvidence.map((id) => {
              const ev = caseDef.evidence.find((e) => e.id === id);
              if (!ev) return null;
              const on = cited.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleCite(id)}
                  className={`glass flex items-center gap-2 rounded-sm p-3 text-left transition-all duration-200 ${
                    on ? "border-[var(--teal)] bg-[rgba(79,216,196,0.07)]" : "hover:border-[var(--line-strong)]"
                  }`}
                >
                  <span className={`text-lg ${on ? "text-[var(--teal)]" : "text-[var(--amber)]"}`}>
                    {EVIDENCE_GLYPH[ev.icon] ?? "◈"}
                  </span>
                  <span className="text-xs leading-tight text-[var(--paper)]">{ev.name}</span>
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
        {confirming && suspectId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(4,6,10,0.85)] p-4"
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-bright w-full max-w-md rounded-sm p-8 text-center"
            >
              <Portrait
                def={suspects.find((s) => s.id === suspectId)!.portrait}
                seed={suspectId}
                size={90}
                mood="afraid"
                className="mx-auto"
              />
              <h3 className="mt-4 font-display text-xl text-[var(--paper)]">
                {suspects.find((s) => s.id === suspectId)!.name}
              </h3>
              <p className="mt-3 text-sm text-[var(--steel)]">
                “You&apos;re certain, Detective?” Voss holds the warrant, pen hovering. “Because once I sign
                this, one of us has to be right.”
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <GhostButton onClick={() => setConfirming(false)}>RECONSIDER</GhostButton>
                <button
                  onClick={() => {
                    audio.ui("stamp");
                    setConfirming(false);
                    accuse(suspectId, motiveId!, cited);
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
    </div>
  );
}
