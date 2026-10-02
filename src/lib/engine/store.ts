"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CaseDef, CaseScore } from "./types";
import { caseById } from "@/lib/cases";
import {
  askSuspect,
  cloneRuntime,
  pressSuspect,
  type SuspectRuntime,
} from "./interrogation";
import { nextHint, type HintEntry } from "./hints";
import { computeScore } from "./scoring";
import { dayIndex } from "./rng";
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

/** Views where the investigation clock runs. */
export const INVESTIGATION_VIEWS: GameView[] = [
  "citymap", "location", "interrogation", "evidence", "board", "notebook", "accuse",
];

export interface ChatMessage {
  from: "player" | "suspect" | "system";
  text: string;
  mood?: string;
  /** player presented this exhibit */
  evidenceId?: string;
  /** reply matched this line of questioning */
  topicId?: string;
  /** reply put a statement on the record */
  statementId?: string;
  /** reply surrendered this exhibit */
  revealedEvidence?: string;
  /** press exposed this statement as a lie */
  contradicts?: string;
  /** the suspect reached their breaking point */
  isBreak?: boolean;
  /** the exhibit drew no reaction */
  unmoved?: boolean;
}

export interface BoardState {
  /** card id → position in % of the board area */
  positions: Record<string, { x: number; y: number }>;
  /** string between two card ids */
  links: [string, string][];
}

export interface CaseProgress {
  caseId: string;
  startedAt: number;
  /** active investigation time — paused when idle, hidden or out of the case */
  elapsedMs: number;
  foundEvidence: string[];
  seenEvidence: string[];
  inspectedHotspots: string[];
  visitedLocations: string[];
  statements: string[];
  contradictions: string[];
  suspectRuntimes: Record<string, SuspectRuntime>;
  chatLogs: Record<string, ChatMessage[]>;
  notes: string;
  pinned: string[];
  board: BoardState;
  wrongAccusations: number;
  hints: HintEntry[];
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
  textSpeed: "slow" | "normal" | "fast" | "instant";
}

export interface Profile {
  detectiveName: string;
  xp: number;
  unlocks: string[];
  completed: Record<string, CaseScore>;
  streak: number;
  lastPlayedDay: number;
  seenTips: string[];
}

export type Moment =
  | { id: number; kind: "contradiction"; suspectId: string; statementId: string; evidenceId: string }
  | { id: number; kind: "breaking"; suspectId: string };

export interface Toast {
  text: string;
  kind: "evidence" | "contradiction" | "statement" | "info";
}

interface GameState {
  hydrated: boolean;
  view: GameView;
  previousView: GameView;
  activeCaseId: string | null;
  activeLocationId: string | null;
  activeSuspectId: string | null;
  activeEvidenceId: string | null;
  toast: Toast | null;
  moment: Moment | null;
  profile: Profile;
  settings: Settings;
  progress: Record<string, CaseProgress>;

  // actions
  setView: (v: GameView) => void;
  setDetectiveName: (name: string) => void;
  startCase: (caseId: string) => void;
  reviewCaseIntro: () => void;
  goToLocation: (locationId: string) => void;
  inspectHotspot: (hotspotId: string) => void;
  collectEvidence: (evidenceId: string, silent?: boolean) => void;
  openEvidence: (evidenceId: string | null) => void;
  talkTo: (suspectId: string) => void;
  leaveInterrogation: () => void;
  ask: (question: string) => void;
  press: (evidenceId: string) => void;
  togglePin: (evidenceId: string) => void;
  setBoardPosition: (cardId: string, pos: { x: number; y: number }) => void;
  toggleBoardLink: (a: string, b: string) => void;
  setNotes: (notes: string) => void;
  requestHint: () => HintEntry | null;
  addPlayTime: (ms: number) => void;
  accuse: (suspectId: string, motiveId: string, cited: string[]) => { correct: boolean };
  finishReveal: () => void;
  clearToast: () => void;
  clearMoment: () => void;
  markTipSeen: (tipId: string) => void;
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
    seenEvidence: [],
    inspectedHotspots: [],
    visitedLocations: [],
    statements: [],
    contradictions: [],
    suspectRuntimes: {},
    chatLogs: {},
    notes: "",
    pinned: [],
    board: { positions: {}, links: [] },
    wrongAccusations: 0,
    hints: [],
    hintsUsed: 0,
    solved: false,
  };
}

/** Fill any field an older save doesn't carry. */
function normalizeProgress(p: Partial<CaseProgress> & { caseId: string }): CaseProgress {
  const base = freshProgress(p.caseId);
  const merged = { ...base, ...p } as CaseProgress;
  merged.board = {
    positions: { ...(p.board?.positions ?? {}) },
    links: [...(p.board?.links ?? [])],
  };
  merged.hints = p.hints ?? [];
  merged.hintsUsed = Math.max(p.hintsUsed ?? 0, merged.hints.length);
  // evidence collected before "new" badges existed counts as already seen
  merged.seenEvidence = p.seenEvidence ?? [...(p.foundEvidence ?? [])];
  return merged;
}

export function activeCase(state: Pick<GameState, "activeCaseId">): CaseDef | null {
  return state.activeCaseId ? (caseById(state.activeCaseId) ?? null) : null;
}

/** Is this case location open to the detective? */
export function locationUnlocked(caseDef: CaseDef, locationId: string, found: string[]): boolean {
  const loc = caseDef.locations.find((l) => l.locationId === locationId);
  return !!loc && (!loc.locked || found.includes(loc.locked.untilEvidence));
}

const DEFAULT_PROFILE: Profile = {
  detectiveName: "",
  xp: 0,
  unlocks: ["desk-lamp", "case-map"],
  completed: {},
  streak: 0,
  lastPlayedDay: 0,
  seenTips: [],
};

const DEFAULT_SETTINGS: Settings = {
  master: 0.8,
  music: 0.7,
  ambience: 0.8,
  sfx: 0.9,
  reducedMotion: false,
  textSpeed: "normal",
};

let momentSeq = 1;

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export const useGame = create<GameState>()(
  persist(
    (set, get) => {
      /** apply a change to the active case's progress */
      const patchProgress = (fn: (p: CaseProgress) => Partial<CaseProgress> | null) => {
        const caseId = get().activeCaseId;
        if (!caseId) return;
        set((s) => {
          const p = s.progress[caseId];
          if (!p) return {};
          const patch = fn(p);
          if (!patch) return {};
          return { progress: { ...s.progress, [caseId]: { ...p, ...patch } } };
        });
      };

      return {
        hydrated: false,
        view: "title",
        previousView: "title",
        activeCaseId: null,
        activeLocationId: null,
        activeSuspectId: null,
        activeEvidenceId: null,
        toast: null,
        moment: null,
        profile: DEFAULT_PROFILE,
        settings: DEFAULT_SETTINGS,
        progress: {},

        markHydrated: () => set({ hydrated: true }),

        setView: (v) =>
          set((s) => {
            if (s.view === v) return {};
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
            const resuming = !!existing && !existing.solved;
            const progress = resuming ? existing : freshProgress(caseId);
            // a case already under way picks up on the streets, not at the newsstand
            const view: GameView =
              resuming && existing.visitedLocations.length > 0 ? "citymap" : "newspaper";
            return {
              activeCaseId: caseId,
              progress: { ...s.progress, [caseId]: progress },
              view,
              previousView: s.view,
              activeLocationId: null,
              activeSuspectId: null,
              activeEvidenceId: null,
            };
          });
        },

        reviewCaseIntro: () => get().setView("newspaper"),

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

        inspectHotspot: (hotspotId) =>
          patchProgress((p) =>
            p.inspectedHotspots.includes(hotspotId)
              ? null
              : { inspectedHotspots: [...p.inspectedHotspots, hotspotId] }
          ),

        collectEvidence: (evidenceId, silent) => {
          const caseDef = activeCase(get());
          const ev = caseDef?.evidence.find((e) => e.id === evidenceId);
          if (!caseDef || !ev) return;
          const p = get().progress[caseDef.id];
          if (!p || p.foundEvidence.includes(evidenceId)) return;
          if (!silent) audio.ui("evidence");
          set((s) => ({
            toast: silent ? s.toast : { text: `Evidence added — ${ev.name}`, kind: "evidence" },
          }));
          patchProgress((pp) => ({ foundEvidence: [...pp.foundEvidence, evidenceId] }));
        },

        openEvidence: (evidenceId) => {
          if (evidenceId) {
            audio.ui("paper");
            patchProgress((p) =>
              p.seenEvidence.includes(evidenceId)
                ? null
                : { seenEvidence: [...p.seenEvidence, evidenceId] }
            );
          }
          set({ activeEvidenceId: evidenceId });
        },

        talkTo: (suspectId) => {
          const caseDef = activeCase(get());
          const suspect = caseDef?.suspects.find((x) => x.id === suspectId);
          if (!caseDef || !suspect) return;
          // nobody behind a locked door takes questions
          const p0 = get().progress[caseDef.id];
          if (p0 && caseDef.locations.some((l) => l.locationId === suspect.presence) && !locationUnlocked(caseDef, suspect.presence, p0.foundEvidence)) return;
          set((s) => {
            const p = s.progress[caseDef.id];
            const rt = cloneRuntime(p.suspectRuntimes[suspectId]);
            let log = p.chatLogs[suspectId] ?? [];
            if (!rt.greeted) {
              rt.greeted = true;
              log = [...log, { from: "suspect", text: suspect.greeting.text, mood: suspect.greeting.mood }];
              if (suspect.greeting.mood) rt.mood = suspect.greeting.mood;
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
                  chatLogs: { ...p.chatLogs, [suspectId]: log },
                },
              },
            };
          });
        },

        leaveInterrogation: () => {
          const s = get();
          const back: GameView =
            s.previousView === "notebook" || s.previousView === "board" || s.previousView === "evidence"
              ? s.previousView
              : s.activeLocationId
                ? "location"
                : "citymap";
          s.setView(back);
        },

        ask: (question) => {
          const state = get();
          const caseDef = activeCase(state);
          const suspectId = state.activeSuspectId;
          const suspect = caseDef?.suspects.find((x) => x.id === suspectId);
          if (!caseDef || !suspect || !suspectId) return;
          const p = state.progress[caseDef.id];
          const rt = cloneRuntime(p.suspectRuntimes[suspectId]);
          const reply = askSuspect(caseDef, suspect, rt, question, p.foundEvidence);

          const newStatement =
            reply.statementId && !p.statements.includes(reply.statementId) ? reply.statementId : undefined;
          const newEvidence =
            reply.revealsEvidence && !p.foundEvidence.includes(reply.revealsEvidence)
              ? reply.revealsEvidence
              : undefined;

          const log: ChatMessage[] = [
            ...(p.chatLogs[suspectId] ?? []),
            { from: "player", text: question },
            {
              from: "suspect",
              text: reply.text,
              mood: reply.mood,
              topicId: reply.topicId,
              statementId: newStatement,
              revealedEvidence: newEvidence,
            },
          ];
          if (newStatement) audio.ui("statement");
          if (newEvidence) audio.ui("evidence");

          set((s) => ({
            progress: {
              ...s.progress,
              [caseDef.id]: {
                ...p,
                statements: newStatement ? [...p.statements, newStatement] : p.statements,
                foundEvidence: newEvidence ? [...p.foundEvidence, newEvidence] : p.foundEvidence,
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
          const suspect = caseDef?.suspects.find((x) => x.id === suspectId);
          if (!caseDef || !suspect || !suspectId) return;
          const p = state.progress[caseDef.id];
          const rt = cloneRuntime(p.suspectRuntimes[suspectId]);
          const ev = caseDef.evidence.find((e) => e.id === evidenceId);
          const reply = pressSuspect(caseDef, suspect, rt, evidenceId);

          const log: ChatMessage[] = [
            ...(p.chatLogs[suspectId] ?? []),
            { from: "player", text: `Presents evidence — ${ev?.name ?? evidenceId}`, evidenceId },
          ];

          if (!reply) {
            const shrug = suspect.fallbacks.neutral[rt.fallbackIndex % suspect.fallbacks.neutral.length];
            rt.fallbackIndex += 1;
            log.push({ from: "suspect", text: `(glances at it, unmoved) ${shrug}`, mood: rt.mood, unmoved: true });
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

          const exposes =
            reply.contradictsStatement &&
            p.statements.includes(reply.contradictsStatement) &&
            !p.contradictions.includes(reply.contradictsStatement)
              ? reply.contradictsStatement
              : undefined;
          const newEvidence =
            reply.revealsEvidence && !p.foundEvidence.includes(reply.revealsEvidence)
              ? reply.revealsEvidence
              : undefined;

          log.push({
            from: "suspect",
            text: reply.text,
            mood: reply.mood,
            contradicts: exposes,
            revealedEvidence: newEvidence,
            isBreak: reply.isBreak || undefined,
          });

          let moment: Moment | null = state.moment;
          if (exposes) {
            audio.ui("contradiction");
            moment = { id: momentSeq++, kind: "contradiction", suspectId, statementId: exposes, evidenceId };
          } else if (reply.isBreak) {
            audio.ui("contradiction");
            moment = { id: momentSeq++, kind: "breaking", suspectId };
          }
          if (newEvidence) audio.ui("evidence");

          set((s) => ({
            moment,
            progress: {
              ...s.progress,
              [caseDef.id]: {
                ...p,
                contradictions: exposes ? [...p.contradictions, exposes] : p.contradictions,
                foundEvidence: newEvidence ? [...p.foundEvidence, newEvidence] : p.foundEvidence,
                suspectRuntimes: { ...p.suspectRuntimes, [suspectId]: rt },
                chatLogs: { ...p.chatLogs, [suspectId]: log },
              },
            },
          }));
        },

        togglePin: (evidenceId) => {
          audio.ui("pin");
          patchProgress((p) => {
            const isPinned = p.pinned.includes(evidenceId);
            const card = `ev:${evidenceId}`;
            return {
              pinned: isPinned ? p.pinned.filter((x) => x !== evidenceId) : [...p.pinned, evidenceId],
              // unpinning takes its strings down with it
              board: isPinned
                ? { ...p.board, links: p.board.links.filter(([a, b]) => a !== card && b !== card) }
                : p.board,
            };
          });
        },

        setBoardPosition: (cardId, pos) =>
          patchProgress((p) => ({
            board: { ...p.board, positions: { ...p.board.positions, [cardId]: pos } },
          })),

        toggleBoardLink: (a, b) => {
          if (a === b) return;
          audio.ui("pin");
          patchProgress((p) => {
            const has = p.board.links.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
            return {
              board: {
                ...p.board,
                links: has
                  ? p.board.links.filter(([x, y]) => !((x === a && y === b) || (x === b && y === a)))
                  : [...p.board.links, [a, b]],
              },
            };
          });
        },

        setNotes: (notes) => patchProgress(() => ({ notes })),

        requestHint: () => {
          const state = get();
          const caseDef = activeCase(state);
          if (!caseDef) return null;
          const p = state.progress[caseDef.id];
          const hint = nextHint(caseDef, {
            found: p.foundEvidence,
            statements: p.statements,
            contradictions: p.contradictions,
            prior: p.hints,
          });
          audio.ui("statement");
          patchProgress((pp) => ({ hints: [...pp.hints, hint], hintsUsed: pp.hintsUsed + 1 }));
          return hint;
        },

        addPlayTime: (ms) => patchProgress((p) => (p.solved ? null : { elapsedMs: p.elapsedMs + ms })),

        accuse: (suspectId, motiveId, cited) => {
          const state = get();
          const caseDef = activeCase(state);
          if (!caseDef) return { correct: false };
          const p = state.progress[caseDef.id];
          const correct = suspectId === caseDef.solution.culpritId;

          if (!correct) {
            audio.ui("wrong");
            patchProgress((pp) => ({ wrongAccusations: pp.wrongAccusations + 1 }));
            return { correct: false };
          }

          const minutes = Math.max(1, Math.round(p.elapsedMs / 60000));
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
            const today = dayIndex();
            const last = s.profile.lastPlayedDay;
            const streak =
              last === today ? Math.max(1, s.profile.streak) : last === today - 1 ? s.profile.streak + 1 : 1;
            const previous = s.profile.completed[caseDef.id];
            const best = !previous || score.points >= previous.points ? score : previous;
            const unlocks =
              caseDef.rewards.unlockId && !s.profile.unlocks.includes(caseDef.rewards.unlockId)
                ? [...s.profile.unlocks, caseDef.rewards.unlockId]
                : s.profile.unlocks;
            const xpGain =
              (previous ? Math.round(caseDef.rewards.xp / 4) : caseDef.rewards.xp) + Math.round(score.points / 10);
            return {
              view: "reveal",
              previousView: s.view,
              progress: {
                ...s.progress,
                [caseDef.id]: { ...p, solved: true, score },
              },
              profile: {
                ...s.profile,
                xp: s.profile.xp + xpGain,
                completed: { ...s.profile.completed, [caseDef.id]: best },
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

        finishReveal: () => set((s) => ({ view: "rating", previousView: s.view })),

        clearToast: () => set({ toast: null }),

        clearMoment: () => set({ moment: null }),

        markTipSeen: (tipId) =>
          set((s) =>
            s.profile.seenTips.includes(tipId)
              ? {}
              : { profile: { ...s.profile, seenTips: [...s.profile.seenTips, tipId] } }
          ),

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
      };
    },
    {
      name: "casefiles-save-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        profile: s.profile,
        settings: s.settings,
        progress: s.progress,
      }),
      // saves from v1.0 carry fewer fields; merge() fills every gap
      migrate: (persisted) => persisted as never,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Pick<GameState, "profile" | "settings" | "progress">>;
        const progress: Record<string, CaseProgress> = {};
        for (const [id, pr] of Object.entries(p.progress ?? {})) {
          progress[id] = normalizeProgress({ ...pr, caseId: pr.caseId ?? id });
        }
        return {
          ...current,
          profile: { ...DEFAULT_PROFILE, ...(p.profile ?? {}) },
          settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
          progress,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
        if (state) audio.setLevels(state.settings);
      },
    }
  )
);
