# CASEFILES

**Every Case Has A Story.**

An endless detective series set in the persistent city of **Veilport** — one nightly
mystery, one correct solution, and a rain that never quite stops. You are the detective,
and you walk every scene yourself: an isometric, neon-noir pixel-art city you explore
on foot.

![tech](https://img.shields.io/badge/Next.js-15-black) ![tech](https://img.shields.io/badge/PixiJS-8-e8a849) ![tech](https://img.shields.io/badge/TypeScript-strict-3178c6)

---

## Playing

```bash
npm install
npm run dev        # http://localhost:3000
```

That's the whole setup. No API keys, no database, no accounts required — the game runs
complete out of the box: guest saves persist in your browser, and the hand-authored
season provides tonight's episode.

**The loop:** read the morning paper → take Voss's briefing → pick a destination on
the city model → walk the scene and search it → interrogate suspects in your own
words → press them with evidence → expose contradictions → tie strings on the board →
sign the warrant → watch the reveal → collect your rating → *just one more episode.*

**Walking:** `WASD` / arrow keys, or click (tap) where you want to go — the detective
pathfinds around the furniture. Walk up to anything with a marker and press `Space`
(or `Enter` / `F`), or simply click it: amber markers still hold evidence, speech
bubbles mark people who'll talk, and the chevrons on the floor lead back out. Your
office works the same way — the desk opens tonight's case, the cabinet is the archive,
the cork board the standings, the radio the settings.

**Shortcuts:** `M` map · `E` evidence · `B` board · `N` notebook · `H` hint · `Esc` back.

## Design pillars

- **Determinism.** A case is a closed world authored in full before you begin —
  timeline, evidence, statements, lies, and exactly one solution. The interrogation
  engine can only surface authored facts; it never invents, never contradicts itself,
  and suspects remember everything you've shown them.
- **The city is a character.** Sixteen recurring locations, one recurring cast — Rook
  in the morgue, Reyes at the light table, Sal behind the bar, Demir behind the wheel,
  Marlowe behind on his deadline.
- **Invisible machinery.** Every room is an isometric diorama baked per pixel —
  dithered pools of colored light, neon that lights the walls, glass walls full of the
  night city, ~70 procedural props — and every person is generated from their portrait
  definition, with big readable faces, blinking, walk cycles and rim light from the
  nearest sign. PixiJS brings it to life: rain outside and behind the glass, fog,
  lightning in step with the thunder, breathing neon, traffic and searchlights over the
  city model. The entire score, every footstep and every interaction sound is
  synthesized live in WebAudio. The game ships with zero binary assets.

## Architecture

```
src/
  app/                    Next.js shell, /api/case (provider-backed generation)
  components/
    Game.tsx              view router, HUD, shortcuts, audio direction
    IsoStage.tsx          walkable isometric rooms: movement, pathfinding, depth
                          sorting, lighting, interaction, weather
    CityStage.tsx         the living city model behind the map
    PixelStage.tsx        PixiJS side-view scenes (title, paper, briefing, interviews)
    Portrait.tsx          deterministic pixel portraits with mood expressions
    views/                every screen: title, office, paper, briefing, map,
                          location, interrogation, evidence, board, notebook,
                          accusation, reveal, rating, archive, standings, settings
  lib/
    engine/               CaseDef schema, interrogation engine, scoring, zustand store
    cases/                the authored season (3 full episodes)
    iso/                  the isometric world: room templates for every location,
                          prop library, character sprites, room baking & lighting,
                          A* walking, hotspot → prop binding, the office, the city model
    scenes/               procedural side-view pixel-art scene painters
    audio/                generative lo-fi noir score + ambience + SFX (WebAudio)
    ai/                   provider abstraction (mock / OpenAI / Anthropic / Gemini)
                          + CaseDef validator (unsolvable cases are never served)
    supabase/             optional cloud: auth, global leaderboard, score sync
    city/                 Veilport: districts, locations, recurring cast
```

## Optional: cloud leaderboard & accounts (Supabase)

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`),
enable the Google/GitHub providers in Supabase Auth, and run:

```sql
create table scores (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  case_id text not null,
  detective text not null,
  points int not null,
  stars int not null,
  minutes int not null,
  user_id uuid references auth.users(id)
);
alter table scores enable row level security;
create policy "read scores"  on scores for select using (true);
create policy "write scores" on scores for insert with check (true);
create index scores_case_points on scores (case_id, points desc);
```

Guest mode remains the default; the cloud only adds the global board and sign-in.

## Optional: AI-authored episodes

Set any of `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` and
`GET /api/case?seed=…` will have that provider author a complete `CaseDef`. Every
generated case must pass `validateCase()` — one culprit, every key clue reachable, no
dangling statements — or it is discarded in favor of the authored season. AI is a
writers' room, never an improviser: once a case is served, the deterministic engine
owns every fact.

## Deploying

```bash
npm run build && npm start   # or push to Vercel — zero config
```

## Quality bars

`npm run typecheck` — strict TypeScript across engine, content and UI.
60fps target on the Pixi ticker; reduced-motion honored from both OS and settings;
fully keyboard-playable; tap-to-walk on tablet and mobile.

---

*Dedicated to everyone who ever said "just one more episode."*
