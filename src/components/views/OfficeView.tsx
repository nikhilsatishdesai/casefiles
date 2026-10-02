"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import type { TargetState } from "@/components/IsoStage";
import { useGame } from "@/lib/engine/store";
import { dailyCase, dailyLabel, ALL_CASES } from "@/lib/cases";
import { rankForXp, nextRank } from "@/lib/engine/scoring";
import { GhostButton, PrimaryButton, Label, StarRow } from "@/components/ui/bits";
import { buildOfficeScene, type OfficeTarget } from "@/lib/iso/office";
import type { IsoTarget } from "@/lib/iso/types";
import { useEscapeLayer } from "@/components/ui/escape";
import { audio } from "@/lib/audio/engine";

const IsoStage = dynamic(() => import("@/components/IsoStage"), { ssr: false });

const OFFICE_UNLOCKS: Record<string, { name: string; desc: string }> = {
  "desk-lamp": { name: "Brass Desk Lamp", desc: "Standard issue. The warmest light on the floor." },
  "case-map": { name: "City Map", desc: "Veilport, pinned corner to corner." },
  "record-player": { name: "Record Player", desc: "From the Verne case. Plays the Glass Sonata, softly." },
  "tide-clock": { name: "Brass Tide Clock", desc: "From Pier 9. It never lets you forget the water." },
  astrolabe: { name: "Bronze Astrolabe", desc: "Museum surplus, acquitted of all charges." },
};

const RAIN = { kind: "rain" as const, intensity: 0.55 };

export default function OfficeView() {
  const setView = useGame((s) => s.setView);
  const startCase = useGame((s) => s.startCase);
  const profile = useGame((s) => s.profile);
  const progress = useGame((s) => s.progress);
  const [shelfOpen, setShelfOpen] = useState(false);
  useEscapeLayer(shelfOpen, () => setShelfOpen(false));

  const today = dailyCase();
  const todayProgress = progress[today.id];
  const solvedToday = !!profile.completed[today.id] && !!todayProgress?.solved;
  const inProgress = todayProgress && !todayProgress.solved && todayProgress.visitedLocations.length > 0;
  const rank = rankForXp(profile.xp);
  const next = nextRank(profile.xp);
  const solvedCount = Object.keys(profile.completed).length;

  const unlockKey = profile.unlocks.join(",");
  const scene = useMemo(
    () => buildOfficeScene({ name: profile.detectiveName, unlocks: unlockKey ? unlockKey.split(",") : [] }),
    [profile.detectiveName, unlockKey]
  );
  const states = useMemo(() => {
    const st: Record<string, TargetState> = {};
    for (const t of scene.targets) st[t.id] = { visible: true, inspected: t.id !== "desk" || solvedToday, evidence: t.id === "desk" && !solvedToday };
    return st;
  }, [scene, solvedToday]);

  const onInteract = useCallback(
    (t: IsoTarget) => {
      const id = t.id as OfficeTarget;
      audio.ui("click");
      if (id === "desk") startCase(today.id);
      else if (id === "archive") setView("archive");
      else if (id === "standings") setView("standings");
      else if (id === "settings") setView("settings");
      else if (id === "shelf") {
        audio.ui("paper");
        setShelfOpen(true);
      } else if (id === "door") setView("title");
    },
    [startCase, setView, today.id]
  );

  return (
    <div className="absolute inset-0">
      <IsoStage scene={scene} states={states} weather={RAIN} timeOfDay="night" paused={shelfOpen} onInteract={onInteract} />
      <div className="vignette pointer-events-none" />

      {/* header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pointer-events-none absolute left-0 right-0 top-[6vh] z-10 flex flex-wrap items-start justify-between gap-4 px-4 md:px-10"
      >
        <div>
          <Label className="text-[#5af0ff]">PRECINCT SEVEN · YOUR OFFICE</Label>
          <h2 className="mt-1 font-display text-xl text-[var(--paper)] [text-shadow:0_0_18px_rgba(255,46,136,0.45)] md:text-2xl">
            {profile.detectiveName || "DETECTIVE"}
          </h2>
          <div className="mt-1 text-sm text-[#ffc46b]">{rank}</div>
          {next && (
            <div className="mt-1.5 h-1 w-44 rounded bg-[rgba(232,226,212,0.1)]">
              <div
                className="h-1 rounded bg-gradient-to-r from-[#ff2e88] to-[#ffc46b] transition-all duration-700"
                style={{ width: `${Math.min(100, (profile.xp / next.xp) * 100)}%` }}
              />
            </div>
          )}
        </div>
        <div className="pointer-events-auto flex flex-wrap gap-2">
          <GhostButton onClick={() => setView("archive")}>CITY ARCHIVE</GhostButton>
          <GhostButton onClick={() => setView("standings")}>STANDINGS</GhostButton>
          <GhostButton onClick={() => setView("settings")}>SETTINGS</GhostButton>
        </div>
      </motion.header>

      {/* controls */}
      <div className="font-label pointer-events-none absolute right-4 top-[calc(6vh+60px)] z-10 hidden text-right leading-6 text-[var(--steel)] md:right-10 md:block">
        <div>
          <span className="iso-key mr-2">WASD</span>
          <span className="iso-key mr-2">CLICK</span>walk
        </div>
        <div>
          <span className="iso-key mr-2">SPACE</span>use
        </div>
      </div>

      {/* tonight's episode */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.7 }}
        className="glass-bright absolute bottom-[calc(var(--letterbox)+14px)] left-3 right-3 z-10 rounded-sm border-[rgba(255,196,107,0.3)] p-5 shadow-[0_0_40px_rgba(255,46,136,0.12)] md:left-10 md:right-auto md:w-[420px]"
      >
        <div className="flex items-center justify-between gap-3">
          <Label className="text-[#ffc46b]">TONIGHT · {dailyLabel().toUpperCase()}</Label>
          <Label>
            EP {String(today.number).padStart(2, "0")} · {"◆".repeat(today.difficulty)}
          </Label>
        </div>
        <h3 className="mt-2 font-display text-xl text-[var(--paper)] md:text-2xl">{today.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-[var(--paper-dim)]">{today.hook}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {solvedToday ? (
            <>
              <StarRow n={profile.completed[today.id].stars} />
              <GhostButton onClick={() => startCase(today.id)}>RE-OPEN THE FILE</GhostButton>
            </>
          ) : (
            <PrimaryButton onClick={() => startCase(today.id)}>{inProgress ? "CONTINUE INVESTIGATION" : "OPEN THE CASE FILE"}</PrimaryButton>
          )}
          {profile.streak > 1 && <span className="font-label text-[var(--teal)]">{profile.streak}-NIGHT STREAK</span>}
        </div>
        <div className="font-label mt-3 hidden text-[var(--steel-dim)] md:block">OR WALK TO YOUR DESK AND OPEN THE FILE</div>
      </motion.section>

      <footer className="font-label absolute bottom-[calc(var(--letterbox)+14px)] right-4 z-10 hidden text-[var(--steel-dim)] md:right-10 md:block">
        <button className="hover:text-[var(--steel)]" onClick={() => setView("credits")}>
          ABOUT CASEFILES
        </button>
        <span className="mx-3">·</span>
        <button className="hover:text-[var(--steel)]" onClick={() => setView("title")}>
          TITLE SCREEN
        </button>
      </footer>

      {/* the shelf */}
      <AnimatePresence>
        {shelfOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(6,3,14,0.55)] p-4"
            onClick={() => setShelfOpen(false)}
          >
            <motion.div
              initial={{ y: 24, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="glass-bright w-full max-w-xl rounded-sm border-[rgba(90,240,255,0.25)] p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <Label className="text-[#7af4ff]">
                YOUR SHELF — {solvedCount} CASE{solvedCount === 1 ? "" : "S"} CLOSED
              </Label>
              <div className="mt-4 flex flex-wrap gap-3">
                {profile.unlocks.map((id) => {
                  const item = OFFICE_UNLOCKS[id];
                  if (!item) return null;
                  return (
                    <div key={id} className="glass rounded-sm px-4 py-3">
                      <div className="text-sm text-[var(--paper)]">{item.name}</div>
                      <div className="mt-0.5 max-w-[220px] text-[11px] leading-snug text-[var(--steel)]">{item.desc}</div>
                    </div>
                  );
                })}
                {ALL_CASES.filter((c) => c.rewards.unlockId && !profile.unlocks.includes(c.rewards.unlockId)).map((c) => (
                  <div key={c.id} className="rounded-sm border border-dashed border-[var(--line-strong)] px-4 py-3">
                    <div className="text-sm text-[var(--steel-dim)]">???</div>
                    <div className="text-[11px] text-[var(--steel-dim)]">Solve “{c.title}”</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <GhostButton onClick={() => setShelfOpen(false)}>CLOSE</GhostButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
