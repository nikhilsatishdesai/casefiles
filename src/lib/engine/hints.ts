import type { CaseDef, HotspotDef, SuspectDef, Topic } from "./types";
import { cityLocation } from "@/lib/city/veilport";

/**
 * Captain Voss's hints.
 *
 * A hint is never a guess: the engine walks the case's dependency graph —
 * locked locations, hidden hotspots, evidence surrendered in interviews or
 * shaken loose by a press — back to the first step the player can take
 * *right now*, and names it. Asking twice about the same step sharpens the
 * hint from a nudge into an instruction.
 */

export interface HintEntry {
  /** identity of the step this hint points at (repeats escalate) */
  target: string;
  level: 1 | 2;
  text: string;
}

export interface HintState {
  found: string[];
  statements: string[];
  contradictions: string[];
  prior: HintEntry[];
}

type Step =
  | { kind: "search"; locationId: string; hotspot: HotspotDef }
  | { kind: "ask"; suspect: SuspectDef; topic: Topic }
  | { kind: "press"; suspect: SuspectDef; evidenceId: string }
  | { kind: "record"; suspect: SuspectDef; topic: Topic }
  | { kind: "confront"; suspect: SuspectDef; evidenceId: string };

function cityName(locationId: string): string {
  try {
    return cityLocation(locationId).name;
  } catch {
    return locationId;
  }
}

/** The most "askable" keyword a topic responds to. */
function topicKeyword(topic: Topic): string {
  const single = topic.triggers.find((t) => !t.includes(" ") && t.length >= 4);
  return single ?? topic.triggers[0] ?? "that night";
}

export function nextHint(caseDef: CaseDef, st: HintState): HintEntry {
  const found = new Set(st.found);
  const have = (id: string) => found.has(id);

  const locationOpen = (locationId: string) => {
    const loc = caseDef.locations.find((l) => l.locationId === locationId);
    return !!loc && (!loc.locked || have(loc.locked.untilEvidence));
  };

  /** first actionable step that makes a suspect reachable, or null if they already are */
  const reachStep = (suspect: SuspectDef, seen: Set<string>): Step | null | "blocked" => {
    const homes = caseDef.locations.filter((l) => l.peopleHere.includes(suspect.id));
    if (homes.some((l) => locationOpen(l.locationId))) return null;
    for (const l of homes) {
      if (l.locked) {
        const s = stepFor(l.locked.untilEvidence, seen);
        if (s) return s;
      }
    }
    return "blocked";
  };

  /** first step the player can take right now towards holding `evId` */
  const stepFor = (evId: string, seen: Set<string>): Step | null => {
    if (have(evId) || seen.has(evId)) return null;
    seen.add(evId);

    for (const loc of caseDef.locations) {
      for (const h of loc.hotspots) {
        if (h.evidenceId !== evId) continue;
        if (loc.locked && !have(loc.locked.untilEvidence)) {
          const s = stepFor(loc.locked.untilEvidence, seen);
          if (s) return s;
          continue;
        }
        const missing = (h.requiresEvidence ?? []).filter((e) => !have(e));
        if (missing.length) {
          for (const m of missing) {
            const s = stepFor(m, seen);
            if (s) return s;
          }
          continue;
        }
        return { kind: "search", locationId: loc.locationId, hotspot: h };
      }
    }

    for (const suspect of caseDef.suspects) {
      for (const topic of suspect.topics) {
        if (!topic.responses.some((r) => r.revealsEvidence === evId)) continue;
        const missing = (topic.requiresEvidence ?? []).filter((e) => !have(e));
        if (missing.length) {
          for (const m of missing) {
            const s = stepFor(m, seen);
            if (s) return s;
          }
          continue;
        }
        const reach = reachStep(suspect, seen);
        if (reach === "blocked") continue;
        return reach ?? { kind: "ask", suspect, topic };
      }
      for (const press of suspect.presses) {
        if (press.response.revealsEvidence !== evId) continue;
        if (!have(press.evidenceId)) {
          const s = stepFor(press.evidenceId, seen);
          if (s) return s;
          continue;
        }
        const reach = reachStep(suspect, seen);
        if (reach === "blocked") continue;
        return reach ?? { kind: "press", suspect, evidenceId: press.evidenceId };
      }
    }
    return null;
  };

  // 1. the proof: every key exhibit, in authored order
  let step: Step | null = null;
  for (const key of caseDef.solution.keyEvidence) {
    step = stepFor(key, new Set());
    if (step) break;
  }

  // 2. the lies: contradictions the player could expose
  if (!step) {
    const exposed = new Set(st.contradictions);
    outer: for (const suspect of caseDef.suspects) {
      for (const press of suspect.presses) {
        const sid = press.contradictsStatement;
        if (!sid || exposed.has(sid)) continue;
        if (!have(press.evidenceId)) continue;
        if (reachStep(suspect, new Set()) !== null) continue;
        if (!st.statements.includes(sid)) {
          const topic = suspect.topics.find((t) => t.responses.some((r) => r.statementId === sid));
          if (!topic) continue;
          step = { kind: "record", suspect, topic };
        } else {
          step = { kind: "confront", suspect, evidenceId: press.evidenceId };
        }
        break outer;
      }
    }
  }

  const target = !step
    ? "deduce"
    : step.kind === "search"
      ? `search:${step.hotspot.id}`
      : step.kind === "ask" || step.kind === "record"
        ? `${step.kind}:${step.suspect.id}:${step.topic.id}`
        : `${step.kind}:${step.suspect.id}:${step.evidenceId}`;
  const level: 1 | 2 = st.prior.some((h) => h.target === target) ? 2 : 1;

  const evName = (id: string) => caseDef.evidence.find((e) => e.id === id)?.name ?? id;
  let text: string;
  if (!step) {
    text =
      level === 1
        ? "You have what you need, Detective. Read the statements against the evidence, mind the timeline — and ask who profits from the lie that fits them all."
        : "Pin your strongest exhibits to the board and string them to the person they point at. When one name collects all the string, bring me the warrant.";
  } else if (step.kind === "search") {
    const where = cityName(step.locationId);
    text =
      level === 1
        ? `Something that matters is still waiting at ${where}. Work that scene properly before the rain gets to it.`
        : `${where}. Look again at “${step.hotspot.label}.” Don't leave without it.`;
  } else if (step.kind === "ask") {
    text =
      level === 1
        ? `${step.suspect.name} knows more than they've told you. Keep them talking.`
        : `Ask ${step.suspect.name} about ${topicKeyword(step.topic)} — and if the first answer is thin, ask again.`;
  } else if (step.kind === "press") {
    text =
      level === 1
        ? `${step.suspect.name} is sitting on something. The right exhibit will shake it loose.`
        : `Put the “${evName(step.evidenceId)}” in front of ${step.suspect.name} and watch their hands.`;
  } else if (step.kind === "record") {
    text =
      level === 1
        ? `${step.suspect.name} hasn't committed to a story yet. Get them on the record — then hold it up against what you've found.`
        : `Ask ${step.suspect.name} about ${topicKeyword(step.topic)}. Once it's on the record, you can break it.`;
  } else {
    text =
      level === 1
        ? `You're holding evidence that contradicts something ${step.suspect.name} told you. Confront them with it.`
        : `Present the “${evName(step.evidenceId)}” to ${step.suspect.name}. Their story won't survive it.`;
  }
  return { target, level, text };
}
