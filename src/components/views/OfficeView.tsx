"use client";

import { motion } from "framer-motion";
import PixelStage from "@/components/PixelStage";
import { useGame } from "@/lib/engine/store";
import { dailyCase, dailyLabel, ALL_CASES } from "@/lib/cases";
import { rankForXp, nextRank } from "@/lib/engine/scoring";
import { GhostButton, PrimaryButton, Label, StarRow } from "@/components/ui/bits";

const OFFICE_UNLOCKS: Record<string, { name: string; desc: string }> = {
  "desk-lamp": { name: "Brass Desk Lamp", desc: "Standard issue. The warmest light on the floor." },
  "case-map": { name: "City Map", desc: "Veilport, pinned corner to corner." },
  "record-player": { name: "Record Player", desc: "From the Verne case. Plays the Glass Sonata, softly." },
  "tide-clock": { name: "Brass Tide Clock", desc: "From Pier 9. It never lets you forget the water." },
  astrolabe: { name: "Bronze Astrolabe", desc: "Museum surplus, acquitted of all charges." },
};

export default function OfficeView() {
  const setView = useGame((s) => s.setView);
  const startCase = useGame((s) => s.startCase);
  const profile = useGame((s) => s.profile);
  const progress = useGame((s) => s.progress);

  const today = dailyCase();
  const todayProgress = progress[today.id];
  const solvedToday = !!profile.completed[today.id] && !!todayProgress?.solved;
  const inProgress = todayProgress && !todayProgress.solved && todayProgress.visitedLocations.length > 0;
  const rank = rankForXp(profile.xp);
  const next = nextRank(profile.xp);
  const solvedCount = Object.keys(profile.completed).length;

  return (
    <div className="absolute inset-0">
      <PixelStage scene="office" weather={{ kind: "rain", intensity: 0.5 }} timeOfDay="night" seedKey="office" dim={0.25} />
      <div className="vignette" />

      <div className="absolute inset-0 flex flex-col overflow-y-auto scroll-thin px-6 py-[7vh] md:px-14">
        {/* header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <Label>PRECINCT SEVEN · YOUR OFFICE</Label>
            <h2 className="mt-1 font-display text-2xl text-[var(--paper)]">
              {profile.detectiveName || "DETECTIVE"}
            </h2>
            <div className="mt-1 text-sm text-[var(--amber)]">{rank}</div>
            {next && (
              <div className="mt-1 h-1 w-44 rounded bg-[rgba(232,226,212,0.1)]">
                <div
                  className="h-1 rounded bg-[var(--amber)] transition-all duration-700"
                  style={{ width: `${Math.min(100, (profile.xp / next.xp) * 100)}%` }}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <GhostButton onClick={() => setView("archive")}>CITY ARCHIVE</GhostButton>
            <GhostButton onClick={() => setView("standings")}>STANDINGS</GhostButton>
            <GhostButton onClick={() => setView("settings")}>SETTINGS</GhostButton>
          </div>
        </motion.header>

        {/* tonight's episode */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="glass-bright mt-10 max-w-3xl rounded-sm p-8"
        >
          <div className="flex items-center justify-between">
            <Label className="text-[var(--amber)]">TONIGHT&apos;S EPISODE · {dailyLabel().toUpperCase()}</Label>
            <Label>EPISODE {String(today.number).padStart(2, "0")} · {"◆".repeat(today.difficulty)}</Label>
          </div>
          <h3 className="mt-4 font-display text-3xl text-[var(--paper)] md:text-4xl">{today.title}</h3>
          <p className="mt-4 max-w-xl text-[var(--paper-dim)]">{today.hook}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {solvedToday ? (
              <>
                <StarRow n={profile.completed[today.id].stars} />
                <GhostButton onClick={() => startCase(today.id)}>RE-OPEN THE FILE</GhostButton>
              </>
            ) : (
              <PrimaryButton onClick={() => startCase(today.id)}>
                {inProgress ? "CONTINUE INVESTIGATION" : "OPEN THE CASE FILE"}
              </PrimaryButton>
            )}
            {profile.streak > 1 && (
              <span className="font-label text-[var(--teal)]">{profile.streak}-NIGHT STREAK</span>
            )}
          </div>
        </motion.section>

        {/* office shelf */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-10 max-w-3xl"
        >
          <Label className="mb-3">ON YOUR SHELF — {solvedCount} CASE{solvedCount === 1 ? "" : "S"} CLOSED</Label>
          <div className="flex flex-wrap gap-3">
            {profile.unlocks.map((id) => {
              const item = OFFICE_UNLOCKS[id];
              if (!item) return null;
              return (
                <div key={id} className="glass group rounded-sm px-4 py-3" title={item.desc}>
                  <div className="text-sm text-[var(--paper)]">{item.name}</div>
                  <div className="mt-0.5 max-w-[220px] text-[11px] leading-snug text-[var(--steel)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {item.desc}
                  </div>
                </div>
              );
            })}
            {ALL_CASES.filter((c) => c.rewards.unlockId && !profile.unlocks.includes(c.rewards.unlockId)).map(
              (c) => (
                <div key={c.id} className="rounded-sm border border-dashed border-[var(--line)] px-4 py-3">
                  <div className="text-sm text-[var(--steel-dim)]">???</div>
                  <div className="text-[11px] text-[var(--steel-dim)]">Solve “{c.title}”</div>
                </div>
              )
            )}
          </div>
        </motion.section>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-auto pt-10 font-label text-[var(--steel-dim)]"
        >
          <button className="hover:text-[var(--steel)]" onClick={() => setView("credits")}>
            ABOUT CASEFILES
          </button>
          <span className="mx-3">·</span>
          <button className="hover:text-[var(--steel)]" onClick={() => setView("title")}>
            TITLE SCREEN
          </button>
        </motion.footer>
      </div>
    </div>
  );
}
