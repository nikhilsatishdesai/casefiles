"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame, activeCase, type GameView } from "@/lib/engine/store";
import { audio, type MusicMode } from "@/lib/audio/engine";
import { ToastLayer, ViewFade, Kbd, GhostButton } from "@/components/ui/bits";

import TitleView from "@/components/views/TitleView";
import OfficeView from "@/components/views/OfficeView";
import { NewspaperView, BriefingView } from "@/components/views/CaseIntroViews";
import CityMapView from "@/components/views/CityMapView";
import LocationView from "@/components/views/LocationView";
import InterrogationView from "@/components/views/InterrogationView";
import { EvidenceView, BoardView, NotebookView } from "@/components/views/CaseFileViews";
import AccuseView from "@/components/views/AccuseView";
import { RevealView, RatingView } from "@/components/views/FinaleViews";
import { ArchiveView, StandingsView, SettingsView, CreditsView } from "@/components/views/MetaViews";

const CASE_VIEWS: GameView[] = [
  "citymap", "location", "interrogation", "evidence", "board", "notebook", "accuse",
];

const VIEWS: Record<GameView, React.ComponentType> = {
  title: TitleView,
  office: OfficeView,
  newspaper: NewspaperView,
  briefing: BriefingView,
  citymap: CityMapView,
  location: LocationView,
  interrogation: InterrogationView,
  evidence: EvidenceView,
  board: BoardView,
  notebook: NotebookView,
  accuse: AccuseView,
  reveal: RevealView,
  rating: RatingView,
  archive: ArchiveView,
  standings: StandingsView,
  settings: SettingsView,
  credits: CreditsView,
};

export default function Game() {
  const view = useGame((s) => s.view);
  const setView = useGame((s) => s.setView);
  const hydrated = useGame((s) => s.hydrated);
  const caseDef = useGame((s) => activeCase(s));
  const [hint, setHint] = useState<string | null>(null);

  /* --- audio direction: what does this scene sound like? ----------- */
  useEffect(() => {
    const weather =
      CASE_VIEWS.includes(view) || view === "newspaper" || view === "briefing" || view === "reveal"
        ? (caseDef?.weather.kind ?? "rain")
        : "rain";
    audio.setWeather(weather);
    const music: MusicMode =
      view === "title"
        ? "title"
        : view === "interrogation" || view === "accuse"
          ? "tension"
          : "noir";
    audio.setMusic(music);
  }, [view, caseDef]);

  /* --- unlock audio on first gesture -------------------------------- */
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  /* --- keyboard shortcuts ------------------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        if (e.key === "Escape") (target as HTMLInputElement).blur();
        return;
      }
      const inCase = CASE_VIEWS.includes(useGame.getState().view);
      switch (e.key.toLowerCase()) {
        case "m":
          if (inCase) setView("citymap");
          break;
        case "e":
          if (inCase) setView("evidence");
          break;
        case "b":
          if (inCase) setView("board");
          break;
        case "n":
          if (inCase) setView("notebook");
          break;
        case "h":
          if (inCase) setHint(useGame.getState().useHint());
          break;
        case "escape": {
          const v = useGame.getState().view;
          if (hint) setHint(null);
          else if (v === "interrogation") setView("location");
          else if (v === "location" || v === "evidence" || v === "board" || v === "notebook" || v === "accuse")
            setView("citymap");
          else if (v === "citymap") setView("office");
          else if (v === "archive" || v === "standings" || v === "settings" || v === "credits")
            setView("office");
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setView, hint]);

  const Active = VIEWS[view];
  const showHud = CASE_VIEWS.includes(view);

  if (!hydrated) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-[var(--ink)]">
        <div className="text-center">
          <div className="font-display text-2xl tracking-[0.4em] text-[var(--paper-dim)]">CASEFILES</div>
          <div className="pulse-soft mt-4 font-label text-[var(--steel-dim)]">OPENING THE FILE…</div>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 overflow-clip bg-[var(--ink)]" role="application" aria-label="CASEFILES">
      <AnimatePresence mode="wait">
        <ViewFade k={view}>
          <Active />
        </ViewFade>
      </AnimatePresence>

      {/* cinematic dressings */}
      <div className="letterbox-top" />
      <div className="letterbox-bottom" />
      <div className="film-grain" />

      <ToastLayer />

      {/* case HUD — the quiet dock */}
      <AnimatePresence>
        {showHud && (
          <motion.nav
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-[calc(clamp(24px,4.5vh,56px)+10px)] left-1/2 z-40 w-max max-w-[calc(100vw-12px)] -translate-x-1/2"
            aria-label="Case navigation"
          >
            <div className="glass-bright scroll-thin flex items-center gap-0.5 overflow-x-auto whitespace-nowrap rounded-sm px-1.5 py-1.5 sm:gap-1 sm:px-2">
              <HudButton label="MAP" k="M" active={view === "citymap"} onClick={() => setView("citymap")} />
              <HudButton label="EVIDENCE" k="E" active={view === "evidence"} onClick={() => setView("evidence")} />
              <HudButton label="BOARD" k="B" active={view === "board"} onClick={() => setView("board")} />
              <HudButton label="NOTEBOOK" k="N" active={view === "notebook"} onClick={() => setView("notebook")} />
              <span className="mx-1 h-5 w-px bg-[var(--line-strong)]" />
              <HudButton
                label="HINT"
                k="H"
                active={false}
                onClick={() => setHint(useGame.getState().useHint())}
              />
              <button
                onClick={() => {
                  audio.ui("click");
                  setView("accuse");
                }}
                className={`font-label rounded-sm px-3 py-2 transition-colors ${
                  view === "accuse"
                    ? "bg-[rgba(224,92,110,0.18)] text-[var(--rose)]"
                    : "text-[var(--rose)] opacity-80 hover:opacity-100"
                }`}
              >
                ACCUSE
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* hint modal */}
      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,6,10,0.7)] p-4"
            onClick={() => setHint(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              className="glass-bright w-full max-w-md rounded-sm p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-label text-[var(--teal)]">A WORD FROM CAPTAIN VOSS</div>
              <p className="mt-4 italic leading-relaxed text-[var(--paper-dim)]">“{hint}”</p>
              <p className="font-label mt-4 text-[var(--steel-dim)]">HINTS COST STANDING AT RATING TIME</p>
              <div className="mt-5 text-right">
                <GhostButton onClick={() => setHint(null)}>UNDERSTOOD</GhostButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function HudButton({
  label,
  k,
  active,
  onClick,
}: {
  label: string;
  k: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={() => {
        audio.ui("click");
        onClick();
      }}
      onMouseEnter={() => audio.ui("hover")}
      className={`font-label flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-2 transition-colors sm:px-3 ${
        active
          ? "bg-[rgba(232,168,73,0.14)] text-[var(--amber)]"
          : "text-[var(--steel)] hover:text-[var(--paper-dim)]"
      }`}
    >
      {label}
      <span className="hidden md:inline">
        <Kbd k={k} />
      </span>
    </button>
  );
}
