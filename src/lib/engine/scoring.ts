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

export function computeScore(input: ScoreInput): CaseScore {
  const { caseDef } = input;
  const correct = input.accusedId === caseDef.solution.culpritId;
  const motiveCorrect = correct && input.motiveId === caseDef.solution.motiveId;

  const keySet = new Set(caseDef.solution.keyEvidence);
  const citedCorrect = input.citedEvidence.filter((e) => keySet.has(e)).length;

  const evidenceTotal = caseDef.evidence.length;
  const evidenceFound = input.foundEvidence.length;

  let points = 0;
  if (correct) points += 500;
  if (motiveCorrect) points += 150;
  points += citedCorrect * 75;
  points += input.contradictions * 60;
  points += Math.round((evidenceFound / evidenceTotal) * 200);
  points -= input.wrongAccusations * 150;
  points -= input.hintsUsed * 50;
  // time bonus: full at <=20 min, fades to 0 at 90 min
  const timeBonus = Math.max(0, Math.round(150 * (1 - Math.max(0, input.minutes - 20) / 70)));
  points += correct ? timeBonus : 0;
  points = Math.max(0, points);

  let stars: CaseScore["stars"] = 1;
  if (correct) {
    stars = 2;
    if (motiveCorrect) stars = 3;
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
