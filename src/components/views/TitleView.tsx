"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PixelStage from "@/components/PixelStage";
import { useGame } from "@/lib/engine/store";
import { audio } from "@/lib/audio/engine";
import { PrimaryButton, Label, Kbd } from "@/components/ui/bits";
import { CITY_NAME } from "@/lib/city/veilport";

export default function TitleView() {
  const setView = useGame((s) => s.setView);
  const profile = useGame((s) => s.profile);
  const setDetectiveName = useGame((s) => s.setDetectiveName);
  const [name, setName] = useState(profile.detectiveName);
  const needsName = !profile.detectiveName;

  const enter = () => {
    if (needsName) {
      const n = name.trim() || "Detective";
      setDetectiveName(n);
    }
    audio.unlock();
    audio.setMusic("noir");
    setView("office");
  };

  return (
    <div className="absolute inset-0">
      <PixelStage
        scene="skyline"
        weather={{ kind: "rain", intensity: 0.7 }}
        timeOfDay="night"
        seedKey="title"
      />
      <div className="vignette" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <div className="font-label mb-6 tracking-[0.5em] text-[var(--steel)]">
            A {CITY_NAME.toUpperCase()} MYSTERY SERIES
          </div>
          <h1 className="font-display text-glow-amber text-5xl text-[var(--paper)] sm:text-7xl md:text-8xl">
            CASEFILES
          </h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mx-auto mt-6 h-px w-48 bg-[var(--amber)] opacity-60"
          />
          <p className="mt-6 font-label text-[var(--amber-dim)] tracking-[0.4em]">
            EVERY CASE HAS A STORY
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 1 }}
          className="mt-16 flex w-full max-w-xs flex-col items-center gap-4"
        >
          {needsName && (
            <div className="w-full">
              <Label className="mb-2 text-center">YOUR NAME, DETECTIVE</Label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") enter();
                  else audio.ui("type");
                }}
                maxLength={24}
                placeholder="Det. ______"
                autoFocus
                className="glass w-full rounded-sm px-4 py-3 text-center text-lg tracking-widest text-[var(--paper)] placeholder:text-[var(--steel-dim)] focus:outline-none"
              />
            </div>
          )}
          <PrimaryButton onClick={enter} className="w-full text-center">
            {needsName ? "BEGIN YOUR FIRST SHIFT" : `WELCOME BACK, ${profile.detectiveName.toUpperCase()}`}
          </PrimaryButton>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--steel-dim)]">
            <Kbd k="↵" /> <span className="font-label">to enter · headphones recommended</span>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4 }}
        className="absolute bottom-[7vh] w-full text-center font-label text-[var(--steel-dim)]"
      >
        RAIN TONIGHT · POPULATION 402,117 · ONE OF THEM IS LYING
      </motion.div>
    </div>
  );
}
