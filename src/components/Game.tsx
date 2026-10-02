"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useAnimate } from "framer-motion";
import { useGame, activeCase, INVESTIGATION_VIEWS, type GameView } from "@/lib/engine/store";
import { audio, type MusicMode } from "@/lib/audio/engine";
import { ToastLayer, ViewFade, Kbd } from "@/components/ui/bits";
import { popEscapeLayer, hasEscapeLayer } from "@/components/ui/escape";
import { useReducedMotionPref } from "@/lib/useMotion";
import HintDialog from "@/components/HintDialog";
import MomentLayer from "@/components/MomentLayer";

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

const CASE_VIEWS = INVESTIGATION_VIEWS;

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

/** No input for this long and the investigation clock stops. */
const IDLE_MS = 120_000;
const TICK_MS = 5_000;

export default function Game() {
  const view = useGame((s) => s.view);
  const setView = useGame((s) => s.setView);
  const hydrated = useGame((s) => s.hydrated);
  const caseDef = useGame((s) => activeCase(s));
  const moment = useGame((s) => s.moment);
  const newEvidence = useGame((s) => {
    const p = s.activeCaseId ? s.progress[s.activeCaseId] : null;
    return p ? p.foundEvidence.filter((e) => !p.seenEvidence.includes(e)).length : 0;
  });
  const reduceMotion = useReducedMotionPref();
  const [hintOpen, setHintOpen] = useState(false);
  const [stageRef, animateStage] = useAnimate();

  /* --- a lie collapsing should be felt ------------------------------ */
  useEffect(() => {
    if (!moment || moment.kind !== "contradiction" || reduceMotion || !stageRef.current) return;
    void animateStage(
      stageRef.current,
      { x: [0, -10, 9, -7, 5, -3, 0], y: [0, 4, -3, 2, -1, 0, 0] },
      { duration: 0.5, ease: "easeOut" }
    );
  }, [moment, reduceMotion, animateStage, stageRef]);

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

  /* --- the investigation clock: active, visible, attended time only -- */
  useEffect(() => {
    let lastInput = Date.now();
    const onInput = () => {
      lastInput = Date.now();
    };
    const events = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onInput, { passive: true }));
    const id = setInterval(() => {
      const s = useGame.getState();
      if (!s.activeCaseId || !CASE_VIEWS.includes(s.view)) return;
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastInput > IDLE_MS) return;
      s.addPlayTime(TICK_MS);
    }, TICK_MS);
    return () => {
      clearInterval(id);
      events.forEach((e) => window.removeEventListener(e, onInput));
    };
  }, []);

  /* --- keyboard shortcuts ------------------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        if (e.key === "Escape") target.blur();
        return;
      }
      if (e.key === "Escape") {
        // modals first, then one step back up the hierarchy
        if (popEscapeLayer()) return;
        const v = useGame.getState().view;
        if (v === "interrogation") useGame.getState().leaveInterrogation();
        else if (v === "location" || v === "evidence" || v === "board" || v === "notebook" || v === "accuse")
          setView("citymap");
        else if (v === "citymap") setView("office");
        else if (v === "archive" || v === "standings" || v === "settings" || v === "credits")
          setView("office");
        return;
      }
      if (hasEscapeLayer()) return;
      const inCase = CASE_VIEWS.includes(useGame.getState().view);
      if (!inCase) return;
      switch (e.key.toLowerCase()) {
        case "m":
          setView("citymap");
          break;
        case "e":
          setView("evidence");
          break;
        case "b":
          setView("board");
          break;
        case "n":
          setView("notebook");
          break;
        case "h":
          setHintOpen(true);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setView]);

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
    <MotionConfig reducedMotion={reduceMotion ? "always" : "never"}>
      <main className="fixed inset-0 overflow-clip bg-[var(--ink)]" role="application" aria-label="CASEFILES">
        <div ref={stageRef} className="absolute inset-0">
          <AnimatePresence mode="wait">
            <ViewFade k={view}>
              <Active />
            </ViewFade>
          </AnimatePresence>
        </div>

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
              className="hud-dock fixed left-1/2 z-40 w-max max-w-[calc(100vw-12px)] -translate-x-1/2"
              aria-label="Case navigation"
            >
              <div className="glass-bright flex items-center gap-0.5 rounded-sm px-1 py-1 sm:gap-1 sm:px-2 sm:py-1.5">
                <HudButton label="MAP" k="M" active={view === "citymap"} onClick={() => setView("citymap")} />
                <HudButton
                  label="EVIDENCE"
                  short="FILES"
                  k="E"
                  active={view === "evidence"}
                  badge={newEvidence}
                  onClick={() => setView("evidence")}
                />
                <HudButton label="BOARD" k="B" active={view === "board"} onClick={() => setView("board")} />
                <HudButton
                  label="NOTEBOOK"
                  short="NOTES"
                  k="N"
                  active={view === "notebook"}
                  onClick={() => setView("notebook")}
                />
                <span className="mx-0.5 h-5 w-px bg-[var(--line-strong)] sm:mx-1" />
                <HudButton label="HINT" k="H" active={hintOpen} onClick={() => setHintOpen(true)} />
                <button
                  onClick={() => {
                    audio.ui("click");
                    setView("accuse");
                  }}
                  className={`hud-btn font-label rounded-sm transition-colors ${
                    view === "accuse"
                      ? "bg-[rgba(255,58,110,0.18)] text-[var(--rose)]"
                      : "text-[var(--rose)] opacity-80 hover:opacity-100"
                  }`}
                >
                  ACCUSE
                </button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>

        <AnimatePresence>{hintOpen && <HintDialog onClose={() => setHintOpen(false)} />}</AnimatePresence>

        <MomentLayer />
      </main>
    </MotionConfig>
  );
}

function HudButton({
  label,
  short,
  k,
  active,
  badge = 0,
  onClick,
}: {
  label: string;
  short?: string;
  k: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={() => {
        audio.ui("click");
        onClick();
      }}
      onMouseEnter={() => audio.ui("hover")}
      aria-label={badge ? `${label} (${badge} new)` : label}
      className={`hud-btn font-label relative flex shrink-0 items-center gap-1.5 rounded-sm transition-colors ${
        active
          ? "bg-[rgba(255,180,61,0.14)] text-[var(--amber)]"
          : "text-[var(--steel)] hover:text-[var(--paper-dim)]"
      }`}
    >
      <span className="sm:hidden">{short ?? label}</span>
      <span className="hidden sm:inline">{label}</span>
      <span className="hidden md:inline">
        <Kbd k={k} />
      </span>
      {badge > 0 && (
        <span className="absolute -right-1 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--amber)] px-1 text-[9px] font-semibold tracking-normal text-[#1a1206]">
          {badge}
        </span>
      )}
    </button>
  );
}
