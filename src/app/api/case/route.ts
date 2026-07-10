import { NextResponse } from "next/server";
import { generateValidatedCase } from "@/lib/ai/provider";
import { dayIndex } from "@/lib/engine/rng";

/**
 * GET /api/case            → tonight's validated episode
 * GET /api/case?seed=xyz   → a validated episode for an arbitrary seed
 *
 * With no AI key configured this serves the hand-authored season (mock
 * provider). With OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY set,
 * the configured provider authors a complete CaseDef which must pass
 * validation (one culprit, every key clue reachable, no dangling facts)
 * before it is ever served — otherwise the authored season stands in.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seed = searchParams.get("seed") ?? `daily-${dayIndex()}`;
  const caseDef = await generateValidatedCase(seed);
  return NextResponse.json(
    { seed, case: caseDef },
    { headers: { "cache-control": "public, max-age=300" } }
  );
}
