"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PixelStage from "@/components/PixelStage";
import { useGame } from "@/lib/engine/store";
import { ALL_CASES, dailyCase } from "@/lib/cases";
import { rngFor, dayIndex } from "@/lib/engine/rng";
import { Label, GhostButton, PrimaryButton, StarRow, Kbd } from "@/components/ui/bits";
import {
  isCloudEnabled,
  signInWithProvider,
  signInWithEmail,
  signOut,
  getSessionEmail,
  fetchCloudScores,
  type CloudScoreRow,
} from "@/lib/supabase/client";
import { audio } from "@/lib/audio/engine";

/* ------------------------------------------------------------------ */
/* City Archive — every episode, replayable                            */
/* ------------------------------------------------------------------ */

export function ArchiveView() {
  const setView = useGame((s) => s.setView);
  const startCase = useGame((s) => s.startCase);
  const resetCase = useGame((s) => s.resetCase);
  const profile = useGame((s) => s.profile);
  const today = dailyCase();

  return (
    <div className="absolute inset-0">
      <PixelStage scene="museum" weather={{ kind: "rain", intensity: 0.4 }} timeOfDay="night" seedKey="archive" dim={0.55} />
      <div className="vignette" />
      <div className="absolute inset-0 flex flex-col overflow-y-auto scroll-thin px-6 py-[7vh] md:px-14">
        <header className="flex items-end justify-between">
          <div>
            <Label>PRECINCT SEVEN · RECORDS DIVISION</Label>
            <h2 className="mt-1 font-display text-2xl text-[var(--paper)]">CITY ARCHIVE</h2>
          </div>
          <GhostButton onClick={() => setView("office")}>← OFFICE</GhostButton>
        </header>

        <div className="mt-8 grid max-w-4xl gap-4">
          {ALL_CASES.map((c, i) => {
            const done = profile.completed[c.id];
            const isToday = c.id === today.id;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-bright flex flex-wrap items-center gap-5 rounded-sm p-6 ${
                  isToday ? "border-[rgba(255,180,61,0.45)]" : ""
                }`}
              >
                <div className="font-display text-3xl text-[var(--steel-dim)]">
                  {String(c.number).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-lg text-[var(--paper)]">{c.title}</h3>
                    {isToday && <span className="font-label text-[var(--amber)]">TONIGHT&apos;S EPISODE</span>}
                    <span className="font-label text-[var(--steel-dim)]">{"◆".repeat(c.difficulty)}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--steel)]">{c.hook}</p>
                  {done && (
                    <div className="mt-2 flex items-center gap-3">
                      <StarRow n={done.stars} size={13} />
                      <span className="font-mono-doc text-xs text-[var(--amber)]">{done.points} PTS</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {done ? (
                    <GhostButton
                      onClick={() => {
                        resetCase(c.id);
                        startCase(c.id);
                      }}
                    >
                      RE-INVESTIGATE
                    </GhostButton>
                  ) : (
                    <PrimaryButton onClick={() => startCase(c.id)}>OPEN FILE</PrimaryButton>
                  )}
                </div>
              </motion.div>
            );
          })}
          <div className="glass rounded-sm border-dashed p-6 text-center text-sm text-[var(--steel)]">
            New episodes arrive nightly. The city never runs out of stories — Season Two is already in the
            writers&apos; room at Precinct Seven.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Precinct standings — the daily leaderboard                          */
/* ------------------------------------------------------------------ */

const NPC_DETECTIVES = [
  "Det. Imre Kovach", "Det. Ada Brandt", "Det. Ray Solano", "Det. Wren Ito",
  "Det. Clyde Munro", "Det. Sofia Aliyeva", "Det. Barnaby Cole", "Det. Ines Ferrer",
  "Det. Oz Whitfield", "Det. Petra Molnar", "Det. Hugo Blanc", "Det. Mercy Adler",
];

export function StandingsView() {
  const setView = useGame((s) => s.setView);
  const profile = useGame((s) => s.profile);
  const today = dailyCase();
  const [cloud, setCloud] = useState<CloudScoreRow[] | null>(null);

  useEffect(() => {
    let mounted = true;
    void fetchCloudScores(today.id).then((rows) => {
      if (mounted && rows && rows.length > 0) setCloud(rows);
    });
    return () => {
      mounted = false;
    };
  }, [today.id]);

  // Deterministic precinct colleagues — same for every player on a given day.
  const rnd = rngFor(`standings:${today.id}:${dayIndex()}`);
  const npcRows = NPC_DETECTIVES
    .map((name) => ({
      detective: name,
      points: 300 + Math.floor(rnd() * 850),
      stars: (2 + Math.floor(rnd() * 3)) as number,
      minutes: 22 + Math.floor(rnd() * 60),
    }))
    .filter(() => rnd() < 0.7)
    .slice(0, 8);

  const playerScore = profile.completed[today.id];
  const rows = [
    ...(cloud ?? npcRows),
    ...(playerScore
      ? [{
          detective: `${profile.detectiveName || "You"} ★`,
          points: playerScore.points,
          stars: playerScore.stars,
          minutes: playerScore.minutes,
        }]
      : []),
  ].sort((a, b) => b.points - a.points);

  return (
    <div className="absolute inset-0">
      <PixelStage scene="precinct" weather={{ kind: "rain", intensity: 0.5 }} timeOfDay="night" seedKey="standings" dim={0.6} />
      <div className="vignette" />
      <div className="absolute inset-0 flex flex-col overflow-y-auto scroll-thin px-6 py-[7vh] md:px-14">
        <header className="flex items-end justify-between">
          <div>
            <Label>{cloud ? "GLOBAL LEADERBOARD" : "PRECINCT SEVEN — NIGHT SHIFT"}</Label>
            <h2 className="mt-1 font-display text-2xl text-[var(--paper)]">STANDINGS</h2>
            <p className="mt-1 text-sm text-[var(--steel)]">
              Tonight&apos;s episode: <span className="text-[var(--amber)]">{today.title}</span>
              {!cloud && " · the shift board updates as detectives close the file"}
            </p>
          </div>
          <GhostButton onClick={() => setView("office")}>← OFFICE</GhostButton>
        </header>

        <div className="mt-8 max-w-3xl">
          <div className="font-label grid grid-cols-[2.5rem_1fr_5rem_6rem_5rem] gap-2 border-b border-[var(--line-strong)] pb-2 text-[var(--steel)]">
            <span>#</span><span>DETECTIVE</span><span>RATING</span><span className="text-right">POINTS</span><span className="text-right">TIME</span>
          </div>
          {rows.length === 0 && (
            <p className="mt-8 text-center italic text-[var(--steel)]">
              Nobody has closed tonight&apos;s file yet. The board is yours to open, Detective.
            </p>
          )}
          {rows.map((r, i) => {
            const you = r.detective.endsWith("★");
            return (
              <motion.div
                key={`${r.detective}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`grid grid-cols-[2.5rem_1fr_5rem_6rem_5rem] items-center gap-2 border-b border-[var(--line)] py-2.5 text-sm ${
                  you ? "bg-[rgba(255,180,61,0.06)] text-[var(--amber)]" : "text-[var(--paper-dim)]"
                }`}
              >
                <span className="font-mono-doc">{i + 1}</span>
                <span className="truncate">{r.detective.replace(" ★", "")}{you && <span className="font-label ml-2 text-[var(--amber)]">YOU</span>}</span>
                <StarRow n={r.stars} size={11} />
                <span className="text-right font-mono-doc">{r.points.toLocaleString()}</span>
                <span className="text-right font-mono-doc text-xs">{r.minutes}m</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between">
        <Label>{label}</Label>
        <span className="font-mono-doc text-xs text-[var(--steel)]">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="mt-2 w-full accent-[#e8a849]"
        aria-label={label}
      />
    </div>
  );
}

export function SettingsView() {
  const setView = useGame((s) => s.setView);
  const settings = useGame((s) => s.settings);
  const updateSettings = useGame((s) => s.updateSettings);
  const profile = useGame((s) => s.profile);
  const setDetectiveName = useGame((s) => s.setDetectiveName);
  const [email, setEmail] = useState("");
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => {
    void getSessionEmail().then(setSessionEmail);
  }, []);

  return (
    <div className="absolute inset-0">
      <PixelStage scene="apartment" weather={{ kind: "rain", intensity: 0.5 }} timeOfDay="night" seedKey="settings" dim={0.55} />
      <div className="vignette" />
      <div className="absolute inset-0 flex flex-col overflow-y-auto scroll-thin px-6 py-[7vh] md:px-14">
        <header className="flex items-end justify-between">
          <div>
            <Label>PREFERENCES</Label>
            <h2 className="mt-1 font-display text-2xl text-[var(--paper)]">SETTINGS</h2>
          </div>
          <GhostButton onClick={() => setView("office")}>← OFFICE</GhostButton>
        </header>

        <div className="mt-8 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* sound */}
          <section className="glass-bright rounded-sm p-6">
            <h3 className="font-display text-sm text-[var(--amber)]">SOUND</h3>
            <div className="mt-5 space-y-5">
              <Slider label="MASTER" value={settings.master} onChange={(v) => updateSettings({ master: v })} />
              <Slider label="MUSIC — LO-FI NOIR" value={settings.music} onChange={(v) => updateSettings({ music: v })} />
              <Slider label="CITY AMBIENCE" value={settings.ambience} onChange={(v) => updateSettings({ ambience: v })} />
              <Slider label="INTERACTIONS" value={settings.sfx} onChange={(v) => updateSettings({ sfx: v })} />
            </div>
          </section>

          {/* display / identity */}
          <section className="glass-bright rounded-sm p-6">
            <h3 className="font-display text-sm text-[var(--amber)]">DETECTIVE</h3>
            <div className="mt-5">
              <Label className="mb-2">NAME ON THE DOOR</Label>
              <input
                value={profile.detectiveName}
                onChange={(e) => setDetectiveName(e.target.value)}
                maxLength={24}
                className="glass w-full rounded-sm px-4 py-2.5 text-[var(--paper)] focus:outline-none"
              />
            </div>
            <div className="mt-5 flex items-center justify-between">
              <Label>REDUCED MOTION</Label>
              <button
                onClick={() => {
                  audio.ui("click");
                  updateSettings({ reducedMotion: !settings.reducedMotion });
                }}
                className={`font-label rounded-sm border px-3 py-1.5 ${
                  settings.reducedMotion
                    ? "border-[var(--amber)] text-[var(--amber)]"
                    : "border-[var(--line)] text-[var(--steel)]"
                }`}
              >
                {settings.reducedMotion ? "ON" : "OFF"}
              </button>
            </div>
            <div className="mt-5">
              <Label className="mb-2">KEYBOARD SHORTCUTS</Label>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-[var(--steel)]">
                <span><Kbd k="M" /> City map</span>
                <span><Kbd k="E" /> Evidence</span>
                <span><Kbd k="B" /> Board</span>
                <span><Kbd k="N" /> Notebook</span>
                <span><Kbd k="H" /> Hint</span>
                <span><Kbd k="Esc" /> Back</span>
              </div>
            </div>
          </section>

          {/* account */}
          <section className="glass-bright rounded-sm p-6">
            <h3 className="font-display text-sm text-[var(--amber)]">ACCOUNT</h3>
            {sessionEmail ? (
              <div className="mt-5">
                <p className="text-sm text-[var(--paper-dim)]">
                  Signed in as <span className="text-[var(--teal)]">{sessionEmail}</span>. Scores sync to the
                  global leaderboard.
                </p>
                <GhostButton
                  className="mt-4"
                  onClick={() => {
                    void signOut().then(() => setSessionEmail(null));
                  }}
                >
                  SIGN OUT
                </GhostButton>
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-sm text-[var(--steel)]">
                  You&apos;re playing as a <span className="text-[var(--paper-dim)]">guest</span> — every case,
                  save and unlock lives safely on this device.
                  {isCloudEnabled
                    ? " Sign in to join the global leaderboard."
                    : " This deployment runs fully offline; cloud accounts are switched off."}
                </p>
                {isCloudEnabled && (
                  <>
                    <div className="mt-4 flex gap-2">
                      <GhostButton onClick={() => void signInWithProvider("google").then((r) => setAuthMsg(r.error))}>
                        GOOGLE
                      </GhostButton>
                      <GhostButton onClick={() => void signInWithProvider("github").then((r) => setAuthMsg(r.error))}>
                        GITHUB
                      </GhostButton>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@veilport.city"
                        className="glass min-w-0 flex-1 rounded-sm px-3 py-2 text-sm text-[var(--paper)] focus:outline-none"
                      />
                      <GhostButton
                        onClick={() =>
                          void signInWithEmail(email).then((r) =>
                            setAuthMsg(r.error ?? "Magic link sent — check your mail.")
                          )
                        }
                      >
                        EMAIL LINK
                      </GhostButton>
                    </div>
                  </>
                )}
                {authMsg && <p className="mt-3 text-xs text-[var(--teal)]">{authMsg}</p>}
              </div>
            )}
          </section>

          {/* data */}
          <section className="glass-bright rounded-sm p-6">
            <h3 className="font-display text-sm text-[var(--amber)]">CASE RECORDS</h3>
            <p className="mt-5 text-sm text-[var(--steel)]">
              {Object.keys(profile.completed).length} case(s) closed · {profile.xp} XP earned ·{" "}
              {profile.unlocks.length} office item(s).
            </p>
            {!confirmWipe ? (
              <GhostButton className="mt-4" onClick={() => setConfirmWipe(true)}>
                BURN THE FILES…
              </GhostButton>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-[var(--rose)]">
                  Every save, rank and unlock on this device — gone for good. Certain?
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      localStorage.removeItem("casefiles-save-v1");
                      location.reload();
                    }}
                    className="btn-danger font-label rounded-sm px-4 py-2"
                  >
                    BURN EVERYTHING
                  </button>
                  <GhostButton onClick={() => setConfirmWipe(false)}>KEEP THEM</GhostButton>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Credits                                                             */
/* ------------------------------------------------------------------ */

export function CreditsView() {
  const setView = useGame((s) => s.setView);
  return (
    <div className="absolute inset-0">
      <PixelStage scene="skyline" weather={{ kind: "clear", intensity: 0.2 }} timeOfDay="dusk" seedKey="credits" dim={0.35} />
      <div className="vignette" />
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="glass-bright max-w-lg rounded-sm p-10 text-center"
        >
          <h2 className="font-display text-3xl text-[var(--paper)] text-glow-amber">CASEFILES</h2>
          <p className="mt-2 font-label text-[var(--amber-dim)] tracking-[0.35em]">EVERY CASE HAS A STORY</p>
          <div className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--paper-dim)]">
            <p>
              An endless detective series set in the city of Veilport — where the rain keeps the records,
              the tide keeps the time, and every case is written whole before you ever open the file.
            </p>
            <p>
              Every scene is painted procedurally, every note of the score is synthesized live, and every
              fact a suspect tells you was true (or a lie) before you asked. Nothing is improvised.
              Especially the lies.
            </p>
            <p className="text-[var(--steel)]">
              Built with Next.js, React, TypeScript, Tailwind CSS, Framer Motion, PixiJS, WebAudio and
              Supabase. Dedicated to everyone who ever said “just one more episode.”
            </p>
          </div>
          <GhostButton className="mt-8" onClick={() => setView("office")}>
            ← BACK TO THE OFFICE
          </GhostButton>
        </motion.div>
      </div>
    </div>
  );
}
