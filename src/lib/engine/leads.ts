import type { CaseDef, SuspectDef } from "./types";
import { availableTopics, type SuspectRuntime } from "./interrogation";

/**
 * Leads — the detective's instincts, surfaced as one-click questions.
 *
 * Free-text questioning stays the heart of an interview, but nobody should
 * lose an evening guessing the magic word. A lead appears only when two
 * things are true: the person in front of you has something to say about
 * a subject, AND that subject has already turned up in what you've read,
 * heard or searched. Discovery is still earned; guesswork isn't required.
 */

export interface Lead {
  kind: "followup" | "alibi" | "victim" | "person" | "lead";
  label: string;
  question: string;
}

const ALIBI = new Set(["where were you", "alibi", "whereabouts", "that night", "last night", "your evening"]);

/** Words too ordinary to count as a lead on their own. */
const GENERIC = new Set([
  "when", "time", "here", "home", "close", "talk", "hear", "call", "rang", "spoke", "talked", "story", "game", "size",
  "lights", "window", "died", "friday", "monday", "tuesday", "office", "boss", "pressure", "afraid", "fight", "minutes",
  "eight", "know", "left", "leave", "night", "evening", "think", "love", "hate", "free", "card", "sign", "access", "side",
  "second", "career", "close", "friend", "relationship", "victim", "anything", "else", "notice", "background", "source",
  "where", "drink", "work", "together", "years", "today", "staff", "hallway", "anyone", "people", "this", "place",
]);

const TITLES = new Set(["dr", "dr.", "dame", "officer", "captain", "det", "det.", "mr", "mrs", "ms", "sir"]);

export function normalizeCorpus(texts: string[]): string {
  return ` ${texts
    .join(" ")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9:'\- ]/g, " ")
    .replace(/\s+/g, " ")} `;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The word in the corpus this trigger points at, if the detective has come across it. */
function discovered(trigger: string, corpus: string): string | null {
  if (ALIBI.has(trigger)) return null;
  if (trigger.includes(" ")) return corpus.includes(` ${trigger} `) ? trigger : null;
  if (trigger.length < 4 || GENERIC.has(trigger)) return null;
  const m = corpus.match(new RegExp(`(?<=\\s)${escapeRe(trigger)}[a-z]*(?=\\s)`));
  return m ? m[0] : null;
}

function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[“”"]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !TITLES.has(t));
}

const title = (s: string) => s.replace(/(^|[\s-])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());

export function leadsFor(o: {
  caseDef: CaseDef;
  suspect: SuspectDef;
  runtime: SuspectRuntime | undefined;
  found: string[];
  corpus: string;
  lastQuestion?: string;
  lastTopicId?: string;
  max?: number;
}): Lead[] {
  const { caseDef, suspect, runtime, found, corpus } = o;
  const hits = runtime?.topicHits ?? {};
  const leads: Lead[] = [];

  // a line of questioning with more left in it
  if (o.lastTopicId && o.lastQuestion) {
    const t = suspect.topics.find((x) => x.id === o.lastTopicId);
    if (t && (hits[t.id] ?? 0) < t.responses.length) {
      leads.push({ kind: "followup", label: "Press further", question: o.lastQuestion });
    }
  }

  const open = availableTopics(suspect, runtime, found).filter((t) => !hits[t.id]);
  const used = new Set<string>();

  const alibi = open.find((t) => t.triggers.some((tr) => ALIBI.has(tr)));
  if (alibi && !suspect.isWitness) {
    leads.push({ kind: "alibi", label: "Where were you?", question: "Where were you that night?" });
    used.add(alibi.id);
  }

  const [vFirst, ...vRest] = nameTokens(caseDef.victim.name);
  const vLast = vRest[vRest.length - 1];
  const vt = open.find((t) => !used.has(t.id) && t.triggers.some((tr) => tr === vFirst || tr === vLast));
  if (vt) {
    leads.push({ kind: "victim", label: `About ${title(vFirst)}`, question: `Tell me about ${title(vFirst)}.` });
    used.add(vt.id);
  }

  for (const s of caseDef.suspects) {
    if (s.id === suspect.id) continue;
    const names = nameTokens(s.name);
    const t = open.find((tp) => !used.has(tp.id) && tp.triggers.some((tr) => names.includes(tr)));
    if (!t) continue;
    const trig = t.triggers.find((tr) => names.includes(tr))!;
    leads.push({ kind: "person", label: `About ${title(names[0])}`, question: `What can you tell me about ${title(trig)}?` });
    used.add(t.id);
  }

  for (const t of open) {
    if (used.has(t.id)) continue;
    for (const trig of t.triggers) {
      const word = discovered(trig, corpus);
      if (!word) continue;
      leads.push({ kind: "lead", label: title(word), question: `What can you tell me about ${word}?` });
      used.add(t.id);
      break;
    }
  }

  return leads.slice(0, o.max ?? 7);
}
