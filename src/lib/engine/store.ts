"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CaseDef, CaseScore } from "./types";
import { caseById } from "@/lib/cases";
import {
  askSuspect,
  freshSuspectRuntime,
  generateHint,
  pressSuspect,
  type SuspectRuntime,
} from "./interrogation";
import { computeScore } from "./scoring";
import { audio } from "@/lib/audio/engine";
import { syncScoreToCloud } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type GameView =
  | "title"
  | "office"
  | "newspaper"
  | "briefing"
  | "citymap"
  | "location"
  | "interrogation"
  | "evidence"
  | "board"
  | "notebook"
  | "accuse"
  | "reveal"
  | "rating"
  | "archive"
  | "standings"
  | "settings"
  | "credits";

export interface ChatMessage {
  from: "player" | "suspect" | "system";
  text: string;
  mood?: string;
  evidenceId?: string;
}

export interface CaseProgress {
  caseId: string;
  startedAt: number;
  elapsedMs: number;
  foundEvidence: string[];
  inspectedHotspots: string[];
  visitedLocations: string[];
  statements: string[];
  contradictions: string[];
  suspectRuntimes: Record<string, SuspectRuntime>;
  chatLogs: Record<string, ChatMessage[]>;
  notes: string;
  pinned: string[];
  wrongAccusations: number;
  hintsUsed: number;
  solved: boolean;
  score?: CaseScore;
}

export interface Settings {
  master: number;
  music: number;
  ambience: number;
  sfx: number;
  reducedMotion: boolean;
  textSpeed: "slow" | "normal" | "fast";
}

export interface Profile {
  detectiveName: string;
  xp: number;
  unlocks: string[];
  completed: Record<string, CaseScore>;
  streak: number;
  lastPlayedDay: number;
}

interface GameState {
  hydrated: boolean;
  view: GameView;
  previousView: GameView;
  activeCaseId: string | null;
  activeLocationId: string | null;
  activeSuspectId: string | null;
  activeEvidenceId: string | null;
  toast: { text: string; kind: "evidence" | "contradiction" | "statement" | "info" } | null;
  profile: Profile;
  settings: Settings;
  progress: Record<string, CaseProgress>;

  // actions
  setView: (v: GameView) => void;
  setDetectiveName: (name: string) => void;
  startCase: (caseId: string) => void;
  goToLocation: (locationId: string) => void;
  inspectHotspot: (hotspotId: string) => void;
  collectEvidence: (evidenceId: string, silent?: boolean) => void;
  openEvidence: (evidenceId: string | null) => void;
  talkTo: (suspectId: string) => void;
  ask: (question: string) => void;
  press: (evidenceId: string) => void;
  togglePin: (evidenceId: string) => void;
  setNotes: (notes: string) => void;
  useHint: () => string;
  accuse: (suspectId: string, motiveId: string, cited: string[]) => { correct: boolean };
  finishReveal: () => void;
  clearToast: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  resetCase: (caseId: string) => void;
  markHydrated: () => void;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function freshProgress(caseId: string): CaseProgress {
  return {
    caseId,
    startedAt: Date.now(),
    elapsedMs: 0,
    foundEvidence: [],
    inspectedHotspots: [],
    visitedLocations: [],
    statements: [],
    contradictions: [],
    suspectRuntimes: {},
    chatLogs: {},
    notes: "",
    pinned: [],
    wrongAccusations: 0,
    hintsUsed: 0,
    solved: false,
  };
}

export function activeCase(state: Pick<GameState, "activeCaseId">): CaseDef | null {
  return state.activeCaseId ? (caseById(state.activeCaseId) ?? null) : null;
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      view: "title",
      previousView: "title",
      activeCaseId: null,
      activeLocationId: null,
      activeSuspectId: null,
      activeEvidenceId: null,
      toast: null,
      profile: {
        detectiveName: "",
        xp: 0,
        unlocks: ["desk-lamp", "case-map"],
        completed: {},
        streak: 0,
        lastPlayedDay: 0,
      },
      settings: {
        master: 0.8,
        music: 0.7,
        ambience: 0.8,
        sfx: 0.9,
        reducedMotion: false,
        textSpeed: "normal",
      },
      progress: {},

      markHydrated: () => set({ hydrated: true }),

      setView: (v) =>
        set((s) => {
          audio.ui("page");
          return { view: v, previousView: s.view };
        }),

      setDetectiveName: (name) =>
        set((s) => ({ profile: { ...s.profile, detectiveName: name.slice(0, 24) } })),

      startCase: (caseId) => {
        const def = caseById(caseId);
        if (!def) return;
        set((s) => {
          const existing = s.progress[caseId];
          const progress =
            existing && !existing.solved ? existing : freshProgress(caseId);
          return {
            activeCaseId: caseId,
            progress: { ...s.progress, [caseId]: progress },
            view: "newspaper",
            previousView: s.view,
            activeLocationId: null,
            activeSuspectId: null,
          };
        });
      },

      goToLocation: (locationId) => {
        const caseDef = activeCase(get());
        if (!caseDef) return;
        audio.ui("travel");
        set((s) => {
          const p = s.progress[caseDef.id];
          const visited = p.visitedLocations.includes(locationId)
            ? p.visitedLocations
            : [...p.visitedLocations, locationId];
          return {
            activeLocationId: locationId,
            view: "location",
            previousView: s.view,
            progress: {
              ...s.progress,
              [caseDef.id]: { ...p, visitedLocations: visited },
            },
          };
        });
      },

      inspectHotspot: (hotspotId) => {
        const caseDef = activeCase(get());
        if (!caseDef) return;
        set((s) => {
          const p = s.progress[caseDef.id];
          if (p.inspectedHotspots.includes(hotspotId)) return {};
          return {
            progress: {
              ...s.progress,
              [caseDef.id]: {
                ...p,
                inspectedHotspots: [...p.inspectedHotspots, hotspotId],
              },
            },
          };
        });
      },

      collectEvidence: (evidenceId, silent) => {
        const caseDef = activeCase(get());
        if (!caseDef) return;
        const ev = caseDef.evidence.find((e) => e.id === evidenceId);
        if (!ev) return;
        set((s) => {
          const p = s.progress[caseDef.id];
          if (p.foundEvidence.includes(evidenceId)) return {};
          if (!silent) audio.ui("evidence");
          return {
            toast: silent
              ? s.toast
              : { text: `Evidence added — ${ev.name}`, kind: "evidence" },
            progress: {
              ...s.progress,
              [caseDef.id]: {
                ...p,
                foundEvidence: [...p.foundEvidence, evidenceId],
              },
            },
          };
        });
      },

      openEvidence: (evidenceId) => {
        if (evidenceId) audio.ui("paper");
        set({ activeEvidenceId: evidenceId });
      },

      talkTo: (suspectId) => {
        const caseDef = activeCase(get());
        if (!caseDef) return;
        const suspect = caseDef.suspects.find((x) => x.id === suspectId);
        if (!suspect) return;
        set((s) => {
          const p = s.progress[caseDef.id];
          const rt = p.suspectRuntimes[suspectId] ?? freshSuspectRuntime();
          const log = p.chatLogs[suspectId] ?? [];
          let newLog = log;
          if (!rt.greeted) {
            rt.greeted = true;
            newLog = [
              ...log,
              { from: "suspect", text: suspect.greeting.text, mood: suspect.greeting.mood },
            ];
          }
          return {
            activeSuspectId: suspectId,
            view: "interrogation",
            previousView: s.view,
            progress: {
              ...s.progress,
              [caseDef.id]: {
                ...p,
                suspectRuntimes: { ...p.suspectRuntimes, [suspectId]: rt },
                chatLogs: { ...p.chatLogs, [suspectId]: newLog },
              },
            },
          };
        });
      },

      ask: (question) => {
        const state = get();
        const caseDef = activeCase(state);
        const suspectId = state.activeSuspectId;
        if (!caseDef || !suspectId) return;
        const suspect = caseDef.suspects.find((x) => x.id === suspectId);
        if (!suspect) return;
        const p = state.progress[caseDef.id];
        const rt = { ...(p.suspectRuntimes[suspectId] ?? freshSuspectRuntime()) };
        const reply = askSuspect(caseDef, suspect, rt, question, p.foundEvidence);

        const log = [...(p.chatLogs[suspectId] ?? [])];
        log.push({ from: "player", text: question });
        log.push({ from: "suspect", text: reply.text, mood: reply.mood });

        let statements = p.statements;
        let toast = state.toast;
        if (reply.statementId && !statements.includes(reply.statementId)) {
          statements = [...statements, reply.statementId];
          toast = { text: "Statement recorded in your notebook", kind: "statement" };
          audio.ui("statement");
        }
        let foundEvidence = p.foundEvidence;
        if (reply.revealsEvidence && !foundEvidence.includes(reply.revealsEvidence)) {
          foundEvidence = [...foundEvidence, reply.revealsEvidence];
          const ev = caseDef.evidence.find((e) => e.id === reply.revealsEvidence);
          toast = { text: `Evidence added — ${ev?.name ?? "new evidence"}`, kind: "evidence" };
          audio.ui("evidence");
        }

        set((s) => ({
          toast,
          progress: {
            ...s.progress,
            [caseDef.id]: {
              ...p,
              statements,
              foundEvidence,
              suspectRuntimes: { ...p.suspectRuntimes, [suspectId]: rt },
              chatLogs: { ...p.chatLogs, [suspectId]: log },
            },
          },
        }));
      },

      press: (evidenceId) => {
        const state = get();
        const caseDef = activeCase(state);
        const suspectId = state.activeSuspectId;
        if (!caseDef || !suspectId) return;
        const suspect = caseDef.suspects.find((x) => x.id === suspectId);
        if (!suspect) return;
        const p = state.progress[caseDef.id];
        const rt = { ...(p.suspectRuntimes[suspectId] ?? freshSuspectRuntime()) };
        const ev = caseDef.evidence.find((e) => e.id === evidenceId);
        const reply = pressSuspect(caseDef, suspect, rt, evidenceId);

        const log = [...(p.chatLogs[suspectId] ?? [])];
        log.push({
          from: "player",
          text: `Presents evidence — ${ev?.name ?? evidenceId}`,
          evidenceId,
        });

        if (!reply) {
          const shrug =
            suspect.fallbacks.neutral[rt.fallbackIndex % suspect.fallbacks.neutral.length];
          rt.fallbackIndex += 1;
          log.push({
            from: "suspect",
            text: `(glances at it, unmoved) ${shrug}`,
            mood: rt.mood,
          });
          set((s) => ({
            progress: {
              ...s.progress,
              [caseDef.id]: {
                ...p,
                suspectRuntimes: { ...p.suspectRuntimes, [suspectId]: rt },
                chatLogs: { ...p.chatLogs, [suspectId]: log },
              },
            },
          }));
          return;
        }

        log.push({ from: "suspect", text: reply.text, mood: reply.mood });

        let contradictions = p.contradictions;
        let foundEvidence = p.foundEvidence;
        let toast = state.toast;
        if (
          reply.contradictsStatement &&
          p.statements.includes(reply.contradictsStatement) &&
          !contradictions.includes(reply.contradictsStatement)
        ) {
          contradictions = [...contradictions, reply.contradictsStatement];
          toast = { text: "Contradiction exposed", kind: "contradiction" };
          audio.ui("contradiction");
        } else if (reply.isBreak) {
          audio.ui("contradiction");
        }
        if (reply.revealsEvidence && !foundEvidence.includes(reply.revealsEvidence)) {
          foundEvidence = [...foundEvidence, reply.revealsEvidence];
          const rev = caseDef.evidence.find((e) => e.id === reply.revealsEvidence);
          toast = { text: `Evidence added — ${rev?.name ?? "new evidence"}`, kind: "evidence" };
          audio.ui("evidence");
        }

        set((s) => ({
          toast,
          progress: {
            ...s.progress,
            [caseDef.id]: {
              ...p,
              contradictions,
              foundEvidence,
              suspectRuntimes: { ...p.suspectRuntimes, [suspectId]: rt },
              chatLogs: { ...p.chatLogs, [suspectId]: log },
            },
          },
        }));
      },

      togglePin: (evidenceId) => {
        const caseDef = activeCase(get());
        if (!caseDef) return;
        audio.ui("pin");
        set((s) => {
          const p = s.progress[caseDef.id];
          const pinned = p.pinned.includes(evidenceId)
            ? p.pinned.filter((x) => x !== evidenceId)
            : [...p.pinned, evidenceId];
          return {
            progress: { ...s.progress, [caseDef.id]: { ...p, pinned } },
          };
        });
      },

      setNotes: (notes) => {
        const caseDef = activeCase(get());
        if (!caseDef) return;
        set((s) => ({
          progress: {
            ...s.progress,
            [caseDef.id]: { ...s.progress[caseDef.id], notes },
          },
        }));
      },

      useHint: () => {
        const state = get();
        const caseDef = activeCase(state);
        if (!caseDef) return "";
        const p = state.progress[caseDef.id];
        const hint = generateHint(caseDef, p.foundEvidence, p.contradictions);
        set((s) => ({
          progress: {
            ...s.progress,
            [caseDef.id]: { ...p, hintsUsed: p.hintsUsed + 1 },
          },
        }));
        return hint;
      },

      accuse: (suspectId, motiveId, cited) => {
        const state = get();
        const caseDef = activeCase(state);
        if (!caseDef) return { correct: false };
        const p = state.progress[caseDef.id];
        const correct = suspectId === caseDef.solution.culpritId;

        if (!correct) {
          audio.ui("wrong");
          set((s) => ({
            toast: {
              text: "The charges don't hold. Voss sends you back to the case.",
              kind: "info",
            },
            view: "citymap",
            progress: {
              ...s.progress,
              [caseDef.id]: { ...p, wrongAccusations: p.wrongAccusations + 1 },
            },
          }));
          return { correct: false };
        }

        const minutes = Math.round(
          (Date.now() - p.startedAt) / 60000
        );
        const score = computeScore({
          caseDef,
          accusedId: suspectId,
          motiveId,
          citedEvidence: cited,
          foundEvidence: p.foundEvidence,
          contradictions: p.contradictions.length,
          wrongAccusations: p.wrongAccusations,
          hintsUsed: p.hintsUsed,
          minutes,
        });

        audio.ui("reveal");
        set((s) => {
          const today = Math.floor(Date.now() / 86400000);
          const streak =
            s.profile.lastPlayedDay === today - 1 ? s.profile.streak + 1 : 1;
          const alreadyCompleted = !!s.profile.completed[caseDef.id];
          const unlocks =
            caseDef.rewards.unlockId && !s.profile.unlocks.includes(caseDef.rewards.unlockId)
              ? [...s.profile.unlocks, caseDef.rewards.unlockId]
              : s.profile.unlocks;
          return {
            view: "reveal",
            progress: {
              ...s.progress,
              [caseDef.id]: { ...p, solved: true, score },
            },
            profile: {
              ...s.profile,
              xp: s.profile.xp + (alreadyCompleted ? Math.round(caseDef.rewards.xp / 4) : caseDef.rewards.xp) + Math.round(score.points / 10),
              completed: { ...s.profile.completed, [caseDef.id]: score },
              unlocks,
              streak,
              lastPlayedDay: today,
            },
          };
        });
        // fire-and-forget cloud sync (no-op when Supabase isn't configured)
        void syncScoreToCloud(caseDef.id, get().profile.detectiveName, score);
        return { correct: true };
      },

      finishReveal: () => set({ view: "rating" }),

      clearToast: () => set({ toast: null }),

      updateSettings: (partial) =>
        set((s) => {
          const settings = { ...s.settings, ...partial };
          audio.setLevels(settings);
          return { settings };
        }),

      resetCase: (caseId) =>
        set((s) => {
          const progress = { ...s.progress };
          delete progress[caseId];
          return { progress };
        }),
    }),
    {
      name: "casefiles-save-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        profile: s.profile,
        settings: s.settings,
        progress: s.progress,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
        if (state) audio.setLevels(state.settings);
      },
    }
  )
);
