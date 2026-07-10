import type { CaseDef } from "@/lib/engine/types";
import { dayIndex } from "@/lib/engine/rng";
import { CASE_001 } from "./case001";
import { CASE_002 } from "./case002";
import { CASE_003 } from "./case003";

export const ALL_CASES: CaseDef[] = [CASE_001, CASE_002, CASE_003];

export function caseById(id: string): CaseDef | undefined {
  return ALL_CASES.find((c) => c.id === id);
}

/**
 * Tonight's Episode — one global mystery per day.
 * Everyone in the world gets the same case on the same date.
 */
export function dailyCase(date = new Date()): CaseDef {
  return ALL_CASES[dayIndex(date) % ALL_CASES.length];
}

export function dailyLabel(date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
