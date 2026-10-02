/**
 * CASEFILES — core case schema.
 *
 * A case is a fully authored, closed world: every fact, statement,
 * contradiction and piece of evidence exists before the player begins.
 * The interrogation engine may only ever surface what is written here —
 * it can never invent, change or contradict a stored fact.
 */

export type SceneId =
  | "skyline"
  | "harbor"
  | "hotel"
  | "museum"
  | "morgue"
  | "precinct"
  | "bar"
  | "station"
  | "apartment"
  | "warehouse"
  | "office"
  | "street"
  | "forest"
  | "university"
  | "newsroom"
  | "docks"
  | "highrise"
  | "citymap";

export interface Weather {
  kind: "rain" | "storm" | "fog" | "snow" | "clear" | "wind";
  intensity: number; // 0..1
}

export type TimeOfDay = "dusk" | "night" | "dawn";

/* ------------------------------------------------------------------ */
/* City                                                                */
/* ------------------------------------------------------------------ */

export interface CityLocation {
  id: string;
  name: string;
  district: string;
  blurb: string;
  scene: SceneId;
  mapX: number; // 0..100 on the city map
  mapY: number;
}

/* ------------------------------------------------------------------ */
/* Evidence                                                            */
/* ------------------------------------------------------------------ */

export type EvidenceType =
  | "physical"
  | "document"
  | "photo"
  | "forensic"
  | "record"
  | "statement";

export type EvidenceIcon =
  | "vial"
  | "letter"
  | "photo"
  | "print"
  | "phone"
  | "bank"
  | "key"
  | "knife"
  | "glass"
  | "watch"
  | "tape"
  | "ledger"
  | "ticket"
  | "badge"
  | "cloth"
  | "pill"
  | "rope"
  | "camera"
  | "folder"
  | "ring";

export interface DocumentDef {
  kind:
    | "letter"
    | "report"
    | "autopsy"
    | "phone"
    | "bank"
    | "news"
    | "cctv"
    | "note"
    | "ticket"
    | "ledger";
  title: string;
  meta?: string;
  body: string; // plain text, \n separated
}

export interface EvidenceItem {
  id: string;
  name: string;
  type: EvidenceType;
  icon: EvidenceIcon;
  foundAt: string; // location id, or "forensics" / "interview"
  summary: string;
  detail: string;
  document?: DocumentDef;
  keyEvidence?: boolean;
}

export interface HotspotDef {
  id: string;
  label: string;
  x: number; // % across the scene, 0..100
  y: number;
  description: string;
  evidenceId?: string;
  requiresEvidence?: string[]; // hidden until player holds all of these
  flavor?: boolean; // pure environmental storytelling
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export interface PortraitDef {
  skin: string;
  hair: string;
  hairStyle: "short" | "long" | "bun" | "bald" | "slick" | "curly" | "ponytail" | "buzz";
  accent: string;
  outfit: "coat" | "suit" | "uniform" | "sweater" | "dress" | "apron" | "labcoat" | "vest";
  hat?: "fedora" | "cap" | "beanie" | "none";
  glasses?: boolean;
  beard?: boolean;
  earrings?: boolean;
  age: "young" | "mid" | "old";
}

export type Mood =
  | "neutral"
  | "nervous"
  | "angry"
  | "sad"
  | "smug"
  | "afraid"
  | "calm"
  | "defensive";

export interface TopicResponse {
  text: string;
  mood?: Mood;
  stress?: number; // added to suspect stress meter (0..100)
  revealsEvidence?: string; // evidence id granted
  statementId?: string; // recorded as a formal statement
}

export interface Topic {
  id: string;
  /** lowercase keywords / phrases; multi-word phrases match as substrings */
  triggers: string[];
  /** played in order across repeated hits; last one repeats */
  responses: TopicResponse[];
  /** topic only matches once the player holds all of these */
  requiresEvidence?: string[];
  /** topic only matches after these topics have been hit */
  requiresTopics?: string[];
}

export interface EvidencePress {
  evidenceId: string;
  response: TopicResponse;
  /** statement id this press exposes as a lie */
  contradictsStatement?: string;
  unlocksTopics?: string[];
}

export interface SuspectDef {
  id: string;
  name: string;
  role: string;
  portrait: PortraitDef;
  recurring?: boolean;
  isWitness?: boolean; // witnesses can be interviewed but not accused
  presence: string; // location id where they can be found
  personality: string;
  demeanor: string;
  alibi: string;
  motiveHint: string;
  greeting: TopicResponse;
  farewell: string;
  topics: Topic[];
  presses: EvidencePress[];
  fallbacks: {
    neutral: string[];
    nervous: string[];
    angry: string[];
  };
  stressThresholds: { nervous: number; breaking: number };
  breakLine?: TopicResponse; // said once when stress crosses "breaking"
}

export interface StatementDef {
  id: string;
  suspectId: string;
  text: string;
}

/* ------------------------------------------------------------------ */
/* Case                                                                */
/* ------------------------------------------------------------------ */

export interface CaseLocation {
  locationId: string;
  sublabel?: string;
  arrivalText: string;
  hotspots: HotspotDef[];
  peopleHere: string[];
  locked?: { untilEvidence: string; note: string };
}

export interface TimelineEvent {
  time: string;
  label: string;
}

export interface Solution {
  culpritId: string;
  motiveId: string;
  methodSummary: string;
  keyEvidence: string[]; // evidence the player should cite
  explanation: string[]; // the cinematic reveal, paragraph by paragraph
}

export interface CaseDef {
  id: string;
  number: number;
  title: string;
  hook: string;
  difficulty: 1 | 2 | 3;
  weather: Weather;
  timeOfDay: TimeOfDay;
  newspaper: {
    date: string;
    headline: string;
    subhead: string;
    body: string[];
    sidebar: { title: string; body: string };
  };
  briefing: { officerId: string; lines: string[] };
  victim: {
    name: string;
    role: string;
    portrait: PortraitDef;
    bio: string;
    foundAt: string;
    initialFinding: string;
  };
  locations: CaseLocation[];
  suspects: SuspectDef[];
  evidence: EvidenceItem[];
  statements: StatementDef[];
  motives: { id: string; label: string }[];
  timelineTruth: TimelineEvent[];
  solution: Solution;
  epilogue: string[];
  rewards: { xp: number; unlockId?: string };
}

/* ------------------------------------------------------------------ */
/* Player-facing runtime state                                         */
/* ------------------------------------------------------------------ */

export interface CaseScore {
  accused: string;
  correct: boolean;
  motiveCorrect: boolean;
  evidenceCited: number;
  evidenceCitedCorrect: number;
  evidenceFound: number;
  evidenceTotal: number;
  contradictions: number;
  wrongAccusations: number;
  hintsUsed: number;
  minutes: number;
  stars: 1 | 2 | 3 | 4 | 5;
  rankTitle: string;
  points: number;
}

export interface OfficeItemDef {
  id: string;
  name: string;
  description: string;
  category: "desk" | "wall" | "shelf" | "floor" | "music" | "wardrobe";
  unlockedBy: string; // "start" | case id | rank
}
