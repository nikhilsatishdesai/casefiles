import type { CaseDef } from "@/lib/engine/types";
import { ALL_CASES } from "@/lib/cases";

/**
 * AI case-generation provider abstraction.
 *
 * CASEFILES treats generative AI as an invisible authoring pipeline, never
 * a live improviser: a provider's only job is to emit a complete CaseDef —
 * timeline, evidence, statements, contradictions and solution — BEFORE the
 * player begins. From that moment the deterministic engine owns every fact.
 *
 * Providers:
 *   - "mock"      — no API key required; serves the hand-authored season.
 *   - "openai"    — OPENAI_API_KEY
 *   - "anthropic" — ANTHROPIC_API_KEY
 *   - "gemini"    — GEMINI_API_KEY
 *
 * Generated cases must pass validateCase() before they are ever shown to a
 * player; a case that fails validation is discarded, never repaired live.
 */

export type ProviderName = "mock" | "openai" | "anthropic" | "gemini";

export interface CaseProvider {
  name: ProviderName;
  generateCase(seed: string): Promise<CaseDef>;
}

export function validateCase(c: CaseDef): string[] {
  const problems: string[] = [];
  const evidenceIds = new Set(c.evidence.map((e) => e.id));
  const suspectIds = new Set(c.suspects.map((s) => s.id));
  const statementIds = new Set(c.statements.map((s) => s.id));

  if (!suspectIds.has(c.solution.culpritId)) problems.push("solution.culpritId unknown");
  if (!c.motives.some((m) => m.id === c.solution.motiveId)) problems.push("solution.motiveId unknown");
  for (const k of c.solution.keyEvidence) {
    if (!evidenceIds.has(k)) problems.push(`key evidence '${k}' missing`);
  }
  for (const loc of c.locations) {
    for (const h of loc.hotspots) {
      if (h.evidenceId && !evidenceIds.has(h.evidenceId)) {
        problems.push(`hotspot '${h.id}' grants unknown evidence '${h.evidenceId}'`);
      }
    }
    for (const p of loc.peopleHere) {
      if (!suspectIds.has(p)) problems.push(`location '${loc.locationId}' lists unknown person '${p}'`);
    }
  }
  for (const s of c.suspects) {
    for (const t of s.topics) {
      for (const r of t.responses) {
        if (r.statementId && !statementIds.has(r.statementId)) {
          problems.push(`topic '${t.id}' records unknown statement '${r.statementId}'`);
        }
        if (r.revealsEvidence && !evidenceIds.has(r.revealsEvidence)) {
          problems.push(`topic '${t.id}' reveals unknown evidence '${r.revealsEvidence}'`);
        }
      }
    }
    for (const p of s.presses) {
      if (!evidenceIds.has(p.evidenceId)) {
        problems.push(`press on unknown evidence '${p.evidenceId}' (${s.id})`);
      }
      if (p.contradictsStatement && !statementIds.has(p.contradictsStatement)) {
        problems.push(`press contradicts unknown statement '${p.contradictsStatement}'`);
      }
    }
  }
  // every character must physically exist somewhere in the city
  const placed = new Set<string>();
  for (const loc of c.locations) for (const p of loc.peopleHere) placed.add(p);
  for (const s of c.suspects) {
    if (!placed.has(s.id)) problems.push(`'${s.id}' is not placed at any location — unreachable`);
  }
  // solvability: every key evidence must actually be reachable
  const reachable = new Set<string>();
  for (const loc of c.locations) for (const h of loc.hotspots) if (h.evidenceId) reachable.add(h.evidenceId);
  for (const s of c.suspects) {
    for (const t of s.topics) for (const r of t.responses) if (r.revealsEvidence) reachable.add(r.revealsEvidence);
    for (const p of s.presses) if (p.response.revealsEvidence) reachable.add(p.response.revealsEvidence);
  }
  for (const k of c.solution.keyEvidence) {
    if (!reachable.has(k)) problems.push(`key evidence '${k}' is unreachable — case unsolvable`);
  }
  return problems;
}

/* ------------------------------------------------------------------ */
/* Mock provider — the hand-authored season                            */
/* ------------------------------------------------------------------ */

class MockProvider implements CaseProvider {
  name = "mock" as const;
  async generateCase(seed: string): Promise<CaseDef> {
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return ALL_CASES[h % ALL_CASES.length];
  }
}

/* ------------------------------------------------------------------ */
/* Remote providers                                                    */
/* ------------------------------------------------------------------ */

const CASE_SCHEMA_PROMPT = `You are the invisible story engine of CASEFILES, a noir detective game set in the persistent city of Veilport. Author ONE complete murder mystery as a single JSON object conforming exactly to the CaseDef TypeScript schema provided. Rules that may never be broken: exactly one culprit; every clue needed to solve the case must exist and be reachable; every contradiction is intentional and paired with evidence; suspects' statements never change; no fact may be left to improvisation. Return ONLY the JSON.`;

class OpenAIProvider implements CaseProvider {
  name = "openai" as const;
  constructor(private apiKey: string, private model = "gpt-4o") {}
  async generateCase(seed: string): Promise<CaseDef> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: CASE_SCHEMA_PROMPT },
          { role: "user", content: `Seed: ${seed}. Author tonight's episode.` },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI: ${res.status}`);
    const json = await res.json();
    return JSON.parse(json.choices[0].message.content) as CaseDef;
  }
}

class AnthropicProvider implements CaseProvider {
  name = "anthropic" as const;
  constructor(private apiKey: string, private model = "claude-sonnet-5") {}
  async generateCase(seed: string): Promise<CaseDef> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 16000,
        system: CASE_SCHEMA_PROMPT,
        messages: [{ role: "user", content: `Seed: ${seed}. Author tonight's episode.` }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic: ${res.status}`);
    const json = await res.json();
    const text = json.content?.[0]?.text ?? "";
    return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as CaseDef;
  }
}

class GeminiProvider implements CaseProvider {
  name = "gemini" as const;
  constructor(private apiKey: string, private model = "gemini-2.0-flash") {}
  async generateCase(seed: string): Promise<CaseDef> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${CASE_SCHEMA_PROMPT}\n\nSeed: ${seed}. Author tonight's episode.` }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini: ${res.status}`);
    const json = await res.json();
    return JSON.parse(json.candidates[0].content.parts[0].text) as CaseDef;
  }
}

export function resolveProvider(): CaseProvider {
  const forced = process.env.CASEFILES_AI_PROVIDER as ProviderName | undefined;
  if (forced === "mock") return new MockProvider();
  if ((forced === "openai" || !forced) && process.env.OPENAI_API_KEY) {
    if (!forced || forced === "openai") return new OpenAIProvider(process.env.OPENAI_API_KEY);
  }
  if ((forced === "anthropic" || !forced) && process.env.ANTHROPIC_API_KEY) {
    return new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
  }
  if ((forced === "gemini" || !forced) && process.env.GEMINI_API_KEY) {
    return new GeminiProvider(process.env.GEMINI_API_KEY);
  }
  return new MockProvider();
}

export async function generateValidatedCase(seed: string): Promise<CaseDef> {
  const provider = resolveProvider();
  const generated = await provider.generateCase(seed);
  const problems = validateCase(generated);
  if (problems.length > 0) {
    // A generated case that breaks determinism is never shown to a player.
    const fallback = await new MockProvider().generateCase(seed);
    return fallback;
  }
  return generated;
}
