"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CaseScore } from "@/lib/engine/types";

/**
 * Cloud persistence — Supabase.
 *
 * CASEFILES is fully playable offline as a guest: every save lives in
 * localStorage. When NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are configured,
 * accounts (Google, GitHub, email magic link) and the global leaderboard
 * light up automatically. Nothing in the game hard-depends on the cloud.
 *
 * Expected schema (see README for SQL):
 *   table scores (id, created_at, case_id text, detective text,
 *                 points int, stars int, minutes int, user_id uuid null)
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isCloudEnabled = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isCloudEnabled) return null;
  if (!client) client = createClient(url!, anonKey!);
  return client;
}

export async function signInWithProvider(provider: "google" | "github") {
  const sb = getSupabase();
  if (!sb) return { error: "Cloud accounts aren't configured on this deployment." };
  const { error } = await sb.auth.signInWithOAuth({
    provider,
    options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
  });
  return { error: error?.message ?? null };
}

export async function signInWithEmail(email: string) {
  const sb = getSupabase();
  if (!sb) return { error: "Cloud accounts aren't configured on this deployment." };
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
  });
  return { error: error?.message ?? null };
}

export async function signOut() {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
}

export async function getSessionEmail(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user?.email ?? null;
}

export async function syncScoreToCloud(
  caseId: string,
  detective: string,
  score: CaseScore
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { data } = await sb.auth.getSession();
    await sb.from("scores").insert({
      case_id: caseId,
      detective: detective || "Detective",
      points: score.points,
      stars: score.stars,
      minutes: score.minutes,
      user_id: data.session?.user?.id ?? null,
    });
  } catch {
    // Leaderboard sync is strictly best-effort; play continues offline.
  }
}

export interface CloudScoreRow {
  detective: string;
  points: number;
  stars: number;
  minutes: number;
}

export async function fetchCloudScores(caseId: string): Promise<CloudScoreRow[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from("scores")
      .select("detective, points, stars, minutes")
      .eq("case_id", caseId)
      .order("points", { ascending: false })
      .limit(25);
    if (error) return null;
    return data as CloudScoreRow[];
  } catch {
    return null;
  }
}
