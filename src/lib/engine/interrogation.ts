import type {
  CaseDef,
  Mood,
  SuspectDef,
  Topic,
  TopicResponse,
} from "./types";

/**
 * The interrogation engine.
 *
 * Deterministic by design: every possible line a character can speak is
 * authored in the case file. The engine's only job is understanding —
 * matching the player's natural-language question to the right authored
 * knowledge, tracking stress and memory, and never inventing a fact.
 */

export interface SuspectRuntime {
  stress: number;
  mood: Mood;
  topicHits: Record<string, number>; // topic id -> times asked
  pressedEvidence: string[];
  saidBreakLine: boolean;
  fallbackIndex: number;
  unlockedTopics: string[];
  greeted: boolean;
}

/** Deep copy — the engine mutates runtimes, and saved state must never be touched in place. */
export function cloneRuntime(rt: SuspectRuntime | undefined): SuspectRuntime {
  if (!rt) return freshSuspectRuntime();
  return {
    ...rt,
    topicHits: { ...rt.topicHits },
    pressedEvidence: [...rt.pressedEvidence],
    unlockedTopics: [...rt.unlockedTopics],
  };
}

/** Topics this suspect can currently be asked about (requirements met). */
export function availableTopics(
  suspect: SuspectDef,
  runtime: SuspectRuntime | undefined,
  playerEvidence: string[]
): Topic[] {
  const rt = runtime ?? freshSuspectRuntime();
  return suspect.topics.filter(
    (topic) =>
      (!topic.requiresEvidence || topic.requiresEvidence.every((e) => playerEvidence.includes(e))) &&
      (!topic.requiresTopics ||
        topic.requiresTopics.every((t) => (rt.topicHits[t] ?? 0) > 0 || rt.unlockedTopics.includes(t)))
  );
}

/** How much of this person's knowledge the detective has heard. */
export function explorationOf(suspect: SuspectDef, runtime: SuspectRuntime | undefined) {
  const hits = runtime?.topicHits ?? {};
  const explored = suspect.topics.filter((t) => (hits[t.id] ?? 0) > 0).length;
  return { explored, total: suspect.topics.length };
}

export function freshSuspectRuntime(): SuspectRuntime {
  return {
    stress: 0,
    mood: "neutral",
    topicHits: {},
    pressedEvidence: [],
    saidBreakLine: false,
    fallbackIndex: 0,
    unlockedTopics: [],
    greeted: false,
  };
}

export interface EngineReply {
  text: string;
  mood: Mood;
  stress: number; // new absolute stress
  revealsEvidence?: string;
  statementId?: string;
  contradictsStatement?: string;
  isBreak?: boolean;
  topicId?: string;
}

const STOPWORDS = new Set([
  "the", "a", "an", "of", "to", "in", "on", "at", "and", "or", "is", "are",
  "was", "were", "do", "did", "does", "you", "your", "he", "she", "it",
  "they", "them", "his", "her", "i", "me", "my", "we", "us", "what", "who",
  "why", "how", "tell", "about", "know", "can", "could", "would", "please",
  "have", "has", "had", "that", "this", "with", "for", "be", "been", "so",
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9:'\- ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/** Score how well a topic's triggers match the player's input. */
function scoreTopic(input: string, tokens: string[], topic: Topic): number {
  let score = 0;
  for (const trigger of topic.triggers) {
    if (trigger.includes(" ") || trigger.includes("-")) {
      // phrase trigger: substring match against the whole input
      if (input.includes(trigger)) score += 3 + trigger.split(" ").length;
    } else {
      for (const tok of tokens) {
        if (tok === trigger) score += 3;
        else if (
          trigger.length > 3 &&
          (tok.startsWith(trigger) || trigger.startsWith(tok)) &&
          Math.min(tok.length, trigger.length) >= 4
        ) {
          score += 2;
        }
      }
    }
  }
  return score;
}

function moodFromStress(base: Mood | undefined, stress: number, s: SuspectDef): Mood {
  if (base) return base;
  if (stress >= s.stressThresholds.breaking) return "afraid";
  if (stress >= s.stressThresholds.nervous) return "nervous";
  return "neutral";
}

export function askSuspect(
  caseDef: CaseDef,
  suspect: SuspectDef,
  runtime: SuspectRuntime,
  rawInput: string,
  playerEvidence: string[]
): EngineReply {
  const input = normalize(rawInput);
  const tokens = tokenize(rawInput);

  // 1. find best topic
  let best: Topic | null = null;
  let bestScore = 0;
  for (const topic of availableTopics(suspect, runtime, playerEvidence)) {
    const score = scoreTopic(input, tokens, topic);
    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  }

  if (best && bestScore >= 3) {
    const hits = runtime.topicHits[best.id] ?? 0;
    const idx = Math.min(hits, best.responses.length - 1);
    const resp: TopicResponse = best.responses[idx];
    runtime.topicHits[best.id] = hits + 1;
    const newStress = clampStress(runtime.stress + (resp.stress ?? 0));
    runtime.stress = newStress;
    const mood = moodFromStress(resp.mood, newStress, suspect);
    runtime.mood = mood;
    return {
      text: resp.text,
      mood,
      stress: newStress,
      revealsEvidence: resp.revealsEvidence,
      statementId: hits === 0 ? resp.statementId : undefined,
      topicId: best.id,
    };
  }

  // 2. fallback by state
  const pool =
    runtime.stress >= suspect.stressThresholds.breaking
      ? suspect.fallbacks.angry
      : runtime.stress >= suspect.stressThresholds.nervous
        ? suspect.fallbacks.nervous
        : suspect.fallbacks.neutral;
  const line = pool[runtime.fallbackIndex % pool.length];
  runtime.fallbackIndex += 1;
  const mood = moodFromStress(undefined, runtime.stress, suspect);
  runtime.mood = mood;
  return { text: line, mood, stress: runtime.stress };
}

export function pressSuspect(
  caseDef: CaseDef,
  suspect: SuspectDef,
  runtime: SuspectRuntime,
  evidenceId: string
): EngineReply | null {
  const press = suspect.presses.find((p) => p.evidenceId === evidenceId);
  if (!press) return null;

  const alreadyPressed = runtime.pressedEvidence.includes(evidenceId);
  if (!alreadyPressed) runtime.pressedEvidence.push(evidenceId);
  if (press.unlocksTopics) {
    for (const t of press.unlocksTopics) {
      if (!runtime.unlockedTopics.includes(t)) runtime.unlockedTopics.push(t);
    }
  }

  const resp = press.response;
  const newStress = clampStress(
    runtime.stress + (alreadyPressed ? 0 : (resp.stress ?? 10))
  );
  runtime.stress = newStress;
  const mood = moodFromStress(resp.mood, newStress, suspect);
  runtime.mood = mood;

  // breaking point — the suspect's authored break line plays once
  let isBreak = false;
  let text = resp.text;
  if (
    !runtime.saidBreakLine &&
    suspect.breakLine &&
    newStress >= suspect.stressThresholds.breaking
  ) {
    runtime.saidBreakLine = true;
    isBreak = true;
    text = `${resp.text}\n\n${suspect.breakLine.text}`;
  }

  return {
    text,
    mood: isBreak ? (suspect.breakLine?.mood ?? mood) : mood,
    stress: newStress,
    revealsEvidence: alreadyPressed ? undefined : resp.revealsEvidence,
    contradictsStatement: alreadyPressed ? undefined : press.contradictsStatement,
    isBreak,
  };
}

function clampStress(v: number): number {
  return Math.max(0, Math.min(100, v));
}
