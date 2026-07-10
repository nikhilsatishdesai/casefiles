"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PixelStage from "@/components/PixelStage";
import Portrait from "@/components/Portrait";
import { useGame, activeCase } from "@/lib/engine/store";
import { cityLocation } from "@/lib/city/veilport";
import { Label, GhostButton, EVIDENCE_GLYPH } from "@/components/ui/bits";
import { audio } from "@/lib/audio/engine";
import type { Mood } from "@/lib/engine/types";

export default function InterrogationView() {
  const caseDef = useGame((s) => activeCase(s));
  const suspectId = useGame((s) => s.activeSuspectId);
  const progress = useGame((s) => (s.activeCaseId ? s.progress[s.activeCaseId] : null));
  const ask = useGame((s) => s.ask);
  const press = useGame((s) => s.press);
  const setView = useGame((s) => s.setView);

  const [input, setInput] = useState("");
  const [showEvidence, setShowEvidence] = useState(false);
  const [thinking, setThinking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suspect = caseDef?.suspects.find((x) => x.id === suspectId);
  const rt = suspectId ? progress?.suspectRuntimes[suspectId] : null;
  const log = suspectId ? (progress?.chatLogs[suspectId] ?? []) : [];

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [log.length, thinking]);

  if (!caseDef || !suspect || !progress) return null;

  const city = cityLocation(suspect.presence);
  const mood: Mood = (rt?.mood as Mood) ?? "neutral";
  const stress = rt?.stress ?? 0;
  const nervous = stress >= suspect.stressThresholds.nervous;
  const breaking = stress >= suspect.stressThresholds.breaking;

  const submit = () => {
    const q = input.trim();
    if (!q || thinking) return;
    setInput("");
    setThinking(true);
    audio.ui("click");
    // A breath before they answer — people think before they lie.
    setTimeout(() => {
      ask(q);
      setThinking(false);
      inputRef.current?.focus();
    }, 450 + Math.random() * 500);
  };

  const presentEvidence = (evId: string) => {
    if (thinking) return;
    setShowEvidence(false);
    setThinking(true);
    audio.ui("paper");
    setTimeout(() => {
      press(evId);
      setThinking(false);
    }, 600 + Math.random() * 500);
  };

  return (
    <div className="absolute inset-0">
      <PixelStage
        scene={city.scene}
        weather={caseDef.weather}
        timeOfDay={caseDef.timeOfDay}
        seedKey={`${caseDef.id}:${suspect.presence}`}
        dim={0.5}
      />
      <div className="vignette" />

      <div className="absolute inset-0 flex flex-col px-3 pb-24 pt-[6vh] md:px-8">
        {/* header card */}
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4">
          <motion.div
            key={mood}
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Portrait def={suspect.portrait} seed={suspect.id} size={86} mood={mood} />
          </motion.div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg text-[var(--paper)] md:text-xl">{suspect.name}</h2>
            <div className="mt-0.5 truncate text-sm text-[var(--steel)]">{suspect.role}</div>
            {!suspect.isWitness && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 w-36 overflow-hidden rounded bg-[rgba(232,226,212,0.1)]">
                  <motion.div
                    animate={{ width: `${stress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-1 rounded"
                    style={{
                      background: breaking ? "var(--rose)" : nervous ? "var(--amber)" : "var(--teal)",
                    }}
                  />
                </div>
                <span className="font-label text-[9px] text-[var(--steel)]">
                  {breaking ? "BREAKING" : nervous ? "UNDER PRESSURE" : "COMPOSED"}
                </span>
              </div>
            )}
          </div>
          <GhostButton onClick={() => setView("location")}>← LEAVE</GhostButton>
        </div>

        {/* transcript */}
        <div
          ref={logRef}
          className="scroll-thin mx-auto mt-4 w-full max-w-3xl flex-1 overflow-y-auto rounded-sm"
        >
          <div className="flex flex-col gap-3 py-2">
            {log.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className={`flex ${m.from === "player" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-sm px-4 py-3 text-[15px] leading-relaxed ${
                    m.from === "player"
                      ? m.evidenceId
                        ? "border border-[rgba(232,168,73,0.5)] bg-[rgba(232,168,73,0.10)] text-[var(--amber)]"
                        : "glass text-[var(--paper)]"
                      : "glass-bright text-[var(--paper-dim)]"
                  }`}
                >
                  {m.from === "suspect" && (
                    <div className="font-label mb-1.5 text-[var(--steel)]">
                      {suspect.name.toUpperCase()}
                      {m.mood && m.mood !== "neutral" && m.mood !== "calm" && (
                        <span className="ml-2 text-[var(--amber-dim)]">— {m.mood}</span>
                      )}
                    </div>
                  )}
                  {m.text.split("\n\n").map((para, j) => (
                    <p key={j} className={j > 0 ? "mt-3 border-t border-[var(--line)] pt-3" : ""}>
                      {para}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
            {thinking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="glass-bright rounded-sm px-4 py-3">
                  <span className="pulse-soft text-[var(--steel)]">…</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* input row */}
        <div className="mx-auto mt-3 flex w-full max-w-3xl gap-2">
          <button
            onClick={() => {
              audio.ui("click");
              setShowEvidence((v) => !v);
            }}
            title="Present evidence"
            className={`btn-ghost font-label rounded-sm px-4 ${showEvidence ? "border-[rgba(232,168,73,0.6)] text-[var(--amber)]" : ""}`}
          >
            ◈ EVIDENCE
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              else if (e.key.length === 1) audio.ui("type");
            }}
            placeholder={`Ask ${suspect.name.split(" ")[0]} anything…`}
            className="glass min-w-0 flex-1 rounded-sm px-4 py-3 text-[15px] text-[var(--paper)] placeholder:text-[var(--steel-dim)] focus:outline-none"
            autoFocus
          />
          <button
            onClick={submit}
            disabled={!input.trim() || thinking}
            className="btn-primary font-label rounded-sm px-5 disabled:opacity-30"
          >
            ASK
          </button>
        </div>

        {/* evidence tray */}
        <AnimatePresence>
          {showEvidence && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3 }}
              className="glass-bright scroll-thin mx-auto mt-2 flex w-full max-w-3xl gap-2 overflow-x-auto rounded-sm p-3"
            >
              {progress.foundEvidence.length === 0 && (
                <span className="px-2 py-3 text-sm text-[var(--steel)]">
                  You haven&apos;t collected any evidence yet. Search the scene first.
                </span>
              )}
              {progress.foundEvidence.map((evId) => {
                const ev = caseDef.evidence.find((e) => e.id === evId);
                if (!ev) return null;
                const reacts = suspect.presses.some((pp) => pp.evidenceId === evId);
                const used = rt?.pressedEvidence.includes(evId);
                return (
                  <button
                    key={evId}
                    onClick={() => presentEvidence(evId)}
                    onMouseEnter={() => audio.ui("hover")}
                    className={`group min-w-[128px] rounded-sm border p-3 text-left transition-all duration-200 ${
                      used
                        ? "border-[var(--line)] opacity-45"
                        : "border-[var(--line-strong)] hover:border-[rgba(232,168,73,0.6)]"
                    }`}
                    title={reacts && used ? "Already confronted" : `Present: ${ev.name}`}
                  >
                    <div className="text-lg text-[var(--amber)]">{EVIDENCE_GLYPH[ev.icon] ?? "◈"}</div>
                    <div className="mt-1 text-xs leading-tight text-[var(--paper)]">{ev.name}</div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
