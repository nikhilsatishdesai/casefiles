import type { CaseDef, CaseScore } from "./types";

export interface ScoreInput {
  caseDef: CaseDef;
  accusedId: string;
  motiveId: string;
  citedEvidence: string[];
  foundEvidence: string[];
  contradictions: number;
  wrongAccusations: number;
  hintsUsed: number;
  minutes: number;
}

export const RANKS: { xp: number; title: string }[] = [
  { xp: 0, title: "Probationary Detective" },
  { xp: 150, title: "Junior Detective" },
  { xp: 400, title: "Detective" },
  { xp: 800, title: "Detective Sergeant" },
  { xp: 1400, title: "Inspector" },
  { xp: 2200, title: "Chief Inspector" },
  { xp: 3200, title: "Detective Superintendent" },
  { xp: 4500, title: "The Commissioner's Right Hand" },
];

export function rankForXp(xp: number): string {
  let title = RANKS[0].title;
  for (const r of RANKS) if (xp >= r.xp) title = r.title;
  return title;
}

export function nextRank(xp: number): { title: string; xp: number } | null {
  for (const r of RANKS) if (xp < r.xp) return { title: r.title, xp: r.xp };
  return null;
}

/** Every line of the rating, so the screen can show where points came from. */
export interface ScoreBreakdown {
  culprit: number;
  motive: number;
  proof: number;
  supporting: number;
  contradictions: number;
  thoroughness: number;
  time: number;
  wrongAccusations: number;
  hints: number;
}

export function scoreBreakdown(input: ScoreInput): ScoreBreakdown {
  const { caseDef } = input;
  const correct = input.accusedId === caseDef.solution.culpritId;
  const motiveCorrect = correct && input.motiveId === caseDef.solution.motiveId;
  const keySet = new Set(caseDef.solution.keyEvidence);
  const citedCorrect = input.citedEvidence.filter((e) => keySet.has(e)).length;
  // exhibits the case file flags as incriminating, beyond the four that close it
  const supporting = input.citedEvidence.filter(
    (e) => !keySet.has(e) && caseDef.evidence.find((x) => x.id === e)?.keyEvidence
  ).length;
  const proofRatio = keySet.size ? citedCorrect / keySet.size : 0;
  // time bonus: full at <=20 active minutes, fading to 0 at 90 — and only
  // as large as the proof you brought. Fast guesses earn nothing.
  const timeFactor = Math.max(0, 1 - Math.max(0, input.minutes - 20) / 70);
  return {
    culprit: correct ? 500 : 0,
    motive: motiveCorrect ? 150 : 0,
    proof: citedCorrect * 75,
    supporting: supporting * 30,
    contradictions: input.contradictions * 60,
    thoroughness: Math.round((input.foundEvidence.length / Math.max(1, caseDef.evidence.length)) * 200),
    time: correct ? Math.round(150 * timeFactor * proofRatio) : 0,
    wrongAccusations: -input.wrongAccusations * 150,
    hints: -input.hintsUsed * 50,
  };
}

export function computeScore(input: ScoreInput): CaseScore {
  const { caseDef } = input;
  const correct = input.accusedId === caseDef.solution.culpritId;
  const motiveCorrect = correct && input.motiveId === caseDef.solution.motiveId;

  const keySet = new Set(caseDef.solution.keyEvidence);
  const citedCorrect = input.citedEvidence.filter((e) => keySet.has(e)).length;

  const evidenceTotal = caseDef.evidence.length;
  const evidenceFound = input.foundEvidence.length;

  const b = scoreBreakdown(input);
  const points = Math.max(0, Object.values(b).reduce((a, v) => a + v, 0));

  // Stars reward a case you can stand behind in court, not a lucky name.
  let stars: CaseScore["stars"] = 1;
  if (correct) {
    stars = 2;
    if ((motiveCorrect && citedCorrect >= 1) || citedCorrect >= Math.min(3, keySet.size)) stars = 3;
    if (motiveCorrect && citedCorrect >= Math.min(3, keySet.size)) stars = 4;
    if (
      motiveCorrect &&
      citedCorrect >= keySet.size &&
      input.wrongAccusations === 0 &&
      input.hintsUsed === 0
    ) {
      stars = 5;
    }
  }

  const rankTitle =
    stars === 5
      ? "Flawless Deduction"
      : stars === 4
        ? "Masterful Casework"
        : stars === 3
          ? "Sound Conviction"
          : stars === 2
            ? "Conviction on Instinct"
            : "Case Closed — Wrongly";

  return {
    accused: input.accusedId,
    correct,
    motiveCorrect,
    evidenceCited: input.citedEvidence.length,
    evidenceCitedCorrect: citedCorrect,
    evidenceFound,
    evidenceTotal,
    contradictions: input.contradictions,
    wrongAccusations: input.wrongAccusations,
    hintsUsed: input.hintsUsed,
    minutes: input.minutes,
    stars,
    rankTitle,
    points,
  };
}
