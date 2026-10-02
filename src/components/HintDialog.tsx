"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Portrait from "@/components/Portrait";
import { useGame } from "@/lib/engine/store";
import { RECURRING_CAST } from "@/lib/city/veilport";
import { GhostButton, PrimaryButton } from "@/components/ui/bits";
import { useEscapeLayer } from "@/components/ui/escape";

/**
 * A word from Captain Voss. Hints are never spent by accident: the dialog
 * opens on what you've already been told, and a new hint costs a click.
 */
export default function HintDialog({ onClose }: { onClose: () => void }) {
  const caseId = useGame((s) => s.activeCaseId);
  const hints = useGame((s) => (s.activeCaseId ? (s.progress[s.activeCaseId]?.hints ?? []) : []));
  const requestHint = useGame((s) => s.requestHint);
  const [freshIndex, setFreshIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const voss = RECURRING_CAST.voss;

  useEscapeLayer(true, onClose);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [hints.length]);

  if (!caseId) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,3,12,0.72)] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ask Captain Voss for a hint"
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 10 }}
        className="glass-bright w-full max-w-lg rounded-sm p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <Portrait def={voss.portrait} seed={voss.id} size={56} mood="calm" />
          <div>
            <div className="font-label text-[var(--teal)]">A WORD FROM CAPTAIN VOSS</div>
            <div className="mt-1 text-sm text-[var(--steel)]">
              {hints.length === 0
                ? "“Stuck already? Fine. Ask — but it goes in your file.”"
                : "“Here's what I've told you so far.”"}
            </div>
          </div>
        </div>

        {hints.length > 0 && (
          <div ref={listRef} className="scroll-thin mt-5 max-h-[38vh] space-y-3 overflow-y-auto pr-1">
            {hints.map((h, i) => (
              <motion.p
                key={i}
                initial={i === freshIndex ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                className={`border-l-2 pl-3 italic leading-relaxed ${
                  i === freshIndex
                    ? "border-[var(--amber)] text-[var(--paper)]"
                    : "border-[var(--line-strong)] text-[var(--paper-dim)]"
                }`}
              >
                “{h.text}”
                {h.level === 2 && (
                  <span className="font-label ml-2 not-italic text-[var(--amber-dim)]">· SPELLED OUT</span>
                )}
              </motion.p>
            ))}
          </div>
        )}

        <p className="font-label mt-5 text-[var(--steel-dim)]">
          EACH HINT COSTS 50 PTS AT RATING TIME · USED THIS CASE: {hints.length}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <GhostButton onClick={onClose}>{hints.length ? "BACK TO WORK" : "NEVER MIND"}</GhostButton>
          <PrimaryButton
            onClick={() => {
              const h = requestHint();
              if (h) setFreshIndex(hints.length);
            }}
          >
            {hints.length ? "ANOTHER HINT · −50" : "ASK VOSS · −50"}
          </PrimaryButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
