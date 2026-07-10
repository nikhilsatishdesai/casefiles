"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PixelStage from "@/components/PixelStage";
import Portrait from "@/components/Portrait";
import { useGame, activeCase } from "@/lib/engine/store";
import { Label, GhostButton, PrimaryButton, StarRow } from "@/components/ui/bits";
import { rankForXp, nextRank } from "@/lib/engine/scoring";
import { audio } from "@/lib/audio/engine";

/* ------------------------------------------------------------------ */
/* The cinematic reveal                                                */
/* ------------------------------------------------------------------ */

export function RevealView() {
  const caseDef = useGame((s) => activeCase(s));
  const finishReveal = useGame((s) => s.finishReveal);
  const [stage, setStage] = useState(0);
  if (!caseDef) return null;

  const culprit = caseDef.suspects.find((s) => s.id === caseDef.solution.culpritId)!;
  const paragraphs = caseDef.solution.explanation;
  // stages: 0 = arrest card, 1..paragraphs = explanation, then timeline, then epilogue
  const maxStage = paragraphs.length + 2;

  const advance = () => {
    audio.ui("page");
    if (stage >= maxStage) finishReveal();
    else setStage((s) => s + 1);
  };

  return (
    <div className="absolute inset-0 bg-[#04060a]" onClick={advance}>
      <PixelStage scene="precinct" weather={caseDef.weather} timeOfDay="night" seedKey={`${caseDef.id}:reveal`} dim={0.78} />
      <div className="vignette" />

      <div className="absolute inset-0 flex items-center justify-center overflow-y-auto scroll-thin px-4 py-[8vh]">
        <div className="w-full max-w-2xl cursor-pointer select-none">
          <AnimatePresence mode="wait">
            {stage === 0 && (
              <motion.div
                key="arrest"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <Label className="text-[var(--rose)]">CASE CLOSED · THE TRUTH</Label>
                <div className="mt-8 flex justify-center">
                  <motion.div
                    initial={{ filter: "brightness(0)" }}
                    animate={{ filter: "brightness(1)" }}
                    transition={{ delay: 0.6, duration: 1.4 }}
                  >
                    <Portrait def={culprit.portrait} seed={culprit.id} size={140} mood="sad" />
                  </motion.div>
                </div>
                <motion.h2
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4, duration: 0.8 }}
                  className="mt-6 font-display text-3xl text-[var(--paper)]"
                >
                  {culprit.name}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2, duration: 0.8 }}
                  className="mt-3 text-[var(--steel)]"
                >
                  {caseDef.solution.methodSummary}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.8 }}
                  className="font-label mt-10 text-[var(--steel-dim)]"
                >
                  CLICK TO HEAR HOW YOU KNEW
                </motion.div>
              </motion.div>
            )}

            {stage >= 1 && stage <= paragraphs.length && (
              <motion.div
                key={`p${stage}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6 }}
                className="glass-bright rounded-sm p-8 md:p-10"
              >
                <Label className="text-[var(--amber)]">
                  THE EXPLANATION · {stage} / {paragraphs.length}
                </Label>
                <p className="mt-5 text-lg leading-relaxed text-[var(--paper-dim)]">
                  {paragraphs[stage - 1]}
                </p>
                <div className="font-label mt-8 text-right text-[var(--steel-dim)]">CLICK →</div>
              </motion.div>
            )}

            {stage === paragraphs.length + 1 && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-bright rounded-sm p-8"
              >
                <Label className="text-[var(--teal)]">THE TRUE TIMELINE</Label>
                <div className="mt-5 space-y-0">
                  {caseDef.timelineTruth.map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.18 }}
                      className="flex gap-4 border-l border-[var(--line-strong)] pb-4 pl-4"
                    >
                      <span className="font-mono-doc w-24 shrink-0 text-xs text-[var(--amber)]">{t.time}</span>
                      <span className="text-sm leading-snug text-[var(--paper-dim)]">{t.label}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="font-label mt-4 text-right text-[var(--steel-dim)]">CLICK →</div>
              </motion.div>
            )}

            {stage === paragraphs.length + 2 && (
              <motion.div
                key="epilogue"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="paper-doc rounded-[2px] p-8 md:p-10"
              >
                <div className="font-typewriter text-lg font-bold uppercase tracking-widest">Epilogue</div>
                <div className="mt-5 space-y-4">
                  {caseDef.epilogue.map((p, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.5 }}
                      className="font-typewriter text-sm leading-relaxed"
                    >
                      {p}
                    </motion.p>
                  ))}
                </div>
                <div className="mt-8 text-right">
                  <span className="stamp">CASE CLOSED</span>
                </div>
                <div className="font-typewriter mt-6 text-right text-[10px] uppercase text-[#5a5142]">
                  Click for your rating, Detective
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The detective rating                                                */
/* ------------------------------------------------------------------ */

export function RatingView() {
  const caseDef = useGame((s) => activeCase(s));
  const progress = useGame((s) => (s.activeCaseId ? s.progress[s.activeCaseId] : null));
  const profile = useGame((s) => s.profile);
  const setView = useGame((s) => s.setView);
  if (!caseDef || !progress?.score) return null;
  const sc = progress.score;
  const next = nextRank(profile.xp);

  const rows: [string, string, boolean][] = [
    ["Culprit identified", sc.correct ? "Correct" : "Wrong", sc.correct],
    ["Motive named", sc.motiveCorrect ? "Correct" : "Missed", sc.motiveCorrect],
    [
      "Key evidence cited",
      `${sc.evidenceCitedCorrect} / ${caseDef.solution.keyEvidence.length}`,
      sc.evidenceCitedCorrect >= caseDef.solution.keyEvidence.length,
    ],
    ["Evidence recovered", `${sc.evidenceFound} / ${sc.evidenceTotal}`, sc.evidenceFound === sc.evidenceTotal],
    ["Contradictions exposed", `${sc.contradictions}`, sc.contradictions > 0],
    ["Wrong accusations", `${sc.wrongAccusations}`, sc.wrongAccusations === 0],
    ["Hints used", `${sc.hintsUsed}`, sc.hintsUsed === 0],
    ["Time on the case", `${sc.minutes} min`, sc.minutes <= 45],
  ];

  return (
    <div className="absolute inset-0">
      <PixelStage scene="office" weather={{ kind: "rain", intensity: 0.5 }} timeOfDay="night" seedKey="rating" dim={0.5} />
      <div className="vignette" />
      <div className="absolute inset-0 flex items-center justify-center overflow-y-auto scroll-thin px-4 py-[7vh]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="glass-bright my-auto w-full max-w-lg rounded-sm p-8"
        >
          <Label className="text-center">EPISODE {String(caseDef.number).padStart(2, "0")} · DETECTIVE RATING</Label>
          <h2 className="mt-2 text-center font-display text-2xl text-[var(--paper)]">{sc.rankTitle}</h2>
          <div className="mt-4 flex justify-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 14 }}
            >
              <StarRow n={sc.stars} size={26} />
            </motion.div>
          </div>
          <div className="mt-2 text-center font-mono-doc text-sm text-[var(--amber)]">
            {sc.points.toLocaleString()} PTS
          </div>

          <div className="mt-6 space-y-1.5">
            {rows.map(([k, v, good], i) => (
              <motion.div
                key={k}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex items-center justify-between border-b border-[var(--line)] pb-1.5 text-sm"
              >
                <span className="text-[var(--steel)]">{k}</span>
                <span className={good ? "text-[var(--teal)]" : "text-[var(--paper-dim)]"}>{v}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 rounded-sm border border-[var(--line)] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--steel)]">{rankForXp(profile.xp)}</span>
              <span className="font-mono-doc text-xs text-[var(--amber)]">{profile.xp} XP</span>
            </div>
            {next && (
              <>
                <div className="mt-2 h-1 rounded bg-[rgba(232,226,212,0.1)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (profile.xp / next.xp) * 100)}%` }}
                    transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
                    className="h-1 rounded bg-[var(--amber)]"
                  />
                </div>
                <div className="font-label mt-1.5 text-right text-[var(--steel-dim)]">
                  NEXT: {next.title.toUpperCase()} AT {next.xp} XP
                </div>
              </>
            )}
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <GhostButton onClick={() => setView("standings")}>PRECINCT STANDINGS</GhostButton>
            <PrimaryButton onClick={() => setView("office")}>BACK TO THE OFFICE →</PrimaryButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
