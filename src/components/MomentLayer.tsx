"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame, activeCase } from "@/lib/engine/store";
import { useReducedMotionPref } from "@/lib/useMotion";
import EvidenceIcon from "@/components/EvidenceIcon";

/**
 * Story beats too important for a toast. When a lie collapses, the game
 * stops for a second: a flash, a stamp, and the statement struck through.
 */
export default function MomentLayer() {
  const moment = useGame((s) => s.moment);
  const clearMoment = useGame((s) => s.clearMoment);
  const caseDef = useGame((s) => activeCase(s));
  const reduce = useReducedMotionPref();

  useEffect(() => {
    if (!moment) return;
    const t = setTimeout(clearMoment, moment.kind === "contradiction" ? 3600 : 2000);
    return () => clearTimeout(t);
  }, [moment, clearMoment]);

  const suspect = moment && caseDef?.suspects.find((s) => s.id === moment.suspectId);
  const statement =
    moment?.kind === "contradiction" ? caseDef?.statements.find((s) => s.id === moment.statementId) : null;
  const evidence =
    moment?.kind === "contradiction" ? caseDef?.evidence.find((e) => e.id === moment.evidenceId) : null;

  return (
    <AnimatePresence>
      {moment && suspect && (
        <motion.div
          key={moment.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          className="fixed inset-0 z-[60] flex cursor-pointer items-center justify-center p-6"
          onClick={clearMoment}
          role="alert"
        >
          {/* flash + vignette */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: reduce ? 0.35 : 0.9 }}
            animate={{ opacity: 0.55 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              background:
                moment.kind === "contradiction"
                  ? "radial-gradient(ellipse at center, rgba(255,58,110,0.28) 0%, rgba(40,6,12,0.86) 70%)"
                  : "radial-gradient(ellipse at center, rgba(255,180,61,0.16) 0%, rgba(10,6,4,0.8) 70%)",
            }}
          />

          <div className="relative w-full max-w-xl text-center">
            <motion.div
              initial={reduce ? { opacity: 0 } : { scale: 2.6, rotate: -14, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { scale: 1, rotate: -6, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 18 }}
              className={`moment-stamp mx-auto inline-block ${
                moment.kind === "contradiction" ? "" : "moment-stamp-amber"
              }`}
            >
              {moment.kind === "contradiction" ? "CONTRADICTION" : "BREAKING POINT"}
            </motion.div>

            {moment.kind === "contradiction" && statement && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="mt-8"
              >
                <div className="font-label text-[var(--rose)]">{suspect.name.toUpperCase()} · ON THE RECORD</div>
                <p className="relative mx-auto mt-3 max-w-lg text-lg italic leading-relaxed text-[var(--paper)]">
                  {statement.text}
                  <motion.span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-[2px] bg-[var(--rose)]"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.9, duration: 0.5, ease: "easeInOut" }}
                  />
                </p>
                {evidence && (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-sm border border-[rgba(255,58,110,0.4)] bg-[rgba(10,6,8,0.6)] px-3 py-2">
                    <EvidenceIcon icon={evidence.icon} size={22} />
                    <span className="font-label text-[var(--paper-dim)]">BROKEN BY · {evidence.name.toUpperCase()}</span>
                  </div>
                )}
              </motion.div>
            )}

            {moment.kind === "breaking" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-[var(--paper-dim)]"
              >
                {suspect.name} can&apos;t hold the story together any longer.
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
