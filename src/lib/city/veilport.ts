import type { CityLocation, PortraitDef } from "@/lib/engine/types";

/**
 * VEILPORT — the city.
 *
 * One persistent city, sixteen districts and landmarks, returning across
 * every episode. The map coordinates place each location on the stylized
 * city map (0..100 in both axes).
 */

export const CITY_NAME = "Veilport";

export const CITY_LOCATIONS: CityLocation[] = [
  {
    id: "old-harbor",
    name: "Old Harbor",
    district: "Old Harbor",
    blurb: "Salt, rust and gull-cry. The oldest working waterfront on the coast.",
    scene: "harbor",
    mapX: 18,
    mapY: 72,
  },
  {
    id: "financial",
    name: "Financial District",
    district: "Financial District",
    blurb: "Glass towers that never sleep and money that never rests.",
    scene: "highrise",
    mapX: 52,
    mapY: 38,
  },
  {
    id: "university",
    name: "Halloway University",
    district: "University Hill",
    blurb: "Ivy, archives, and ambition. The city's memory lives here.",
    scene: "university",
    mapX: 78,
    mapY: 24,
  },
  {
    id: "downtown",
    name: "Historic Downtown",
    district: "Historic Downtown",
    blurb: "Neon over cobblestone. Every doorway has a story it won't tell twice.",
    scene: "street",
    mapX: 44,
    mapY: 52,
  },
  {
    id: "suburbs",
    name: "Rowan Heights",
    district: "The Suburbs",
    blurb: "Porch lights and drawn curtains. Quiet is not the same as peaceful.",
    scene: "apartment",
    mapX: 84,
    mapY: 58,
  },
  {
    id: "industrial",
    name: "Industrial Zone",
    district: "Industrial Zone",
    blurb: "Smokestacks against the sky. Half of it works. Half of it waits.",
    scene: "warehouse",
    mapX: 28,
    mapY: 88,
  },
  {
    id: "station",
    name: "Grand Veilport Station",
    district: "Historic Downtown",
    blurb: "Every arrival is a beginning. Every departure is an alibi.",
    scene: "station",
    mapX: 58,
    mapY: 60,
  },
  {
    id: "precinct",
    name: "Precinct Seven",
    district: "Civic Quarter",
    blurb: "Your desk is the third one back, under the clock that runs four minutes slow.",
    scene: "precinct",
    mapX: 38,
    mapY: 44,
  },
  {
    id: "hospital",
    name: "St. Maren's Hospital",
    district: "Civic Quarter",
    blurb: "The night shift sees everything and signs for none of it.",
    scene: "morgue",
    mapX: 66,
    mapY: 40,
  },
  {
    id: "morgue",
    name: "City Morgue",
    district: "Civic Quarter",
    blurb: "Dr. Rook keeps the coldest office in Veilport, and the warmest kettle.",
    scene: "morgue",
    mapX: 62,
    mapY: 48,
  },
  {
    id: "hotel",
    name: "Hotel Meridian",
    district: "Financial District",
    blurb: "Twelve floors of velvet and secrets. The bar pours heavy after midnight.",
    scene: "hotel",
    mapX: 48,
    mapY: 30,
  },
  {
    id: "museum",
    name: "Veilport Museum",
    district: "University Hill",
    blurb: "Four centuries under one leaking roof. The map room smells of cedar and dust.",
    scene: "museum",
    mapX: 70,
    mapY: 18,
  },
  {
    id: "cannery",
    name: "Abandoned Cannery",
    district: "Industrial Zone",
    blurb: "Closed in '09. The padlocks are newer than they should be.",
    scene: "warehouse",
    mapX: 16,
    mapY: 84,
  },
  {
    id: "docks",
    name: "Pier 9 Docks",
    district: "Old Harbor",
    blurb: "Cranes, containers, and a harbormaster's office with a very good view.",
    scene: "docks",
    mapX: 10,
    mapY: 64,
  },
  {
    id: "forest",
    name: "Blackpine Forest",
    district: "Outskirts",
    blurb: "The pines keep their own counsel. Phones die two miles in.",
    scene: "forest",
    mapX: 90,
    mapY: 10,
  },
  {
    id: "mountain-road",
    name: "Mirror Pass Road",
    district: "Outskirts",
    blurb: "Switchbacks over the bay. Beautiful at dusk, treacherous in rain.",
    scene: "forest",
    mapX: 94,
    mapY: 30,
  },
  {
    id: "bluehour",
    name: "The Blue Hour",
    district: "Historic Downtown",
    blurb: "Sal's bar. Jazz on vinyl, tabs on trust, and nothing repeated.",
    scene: "bar",
    mapX: 40,
    mapY: 58,
  },
  {
    id: "ledger",
    name: "The Veilport Ledger",
    district: "Historic Downtown",
    blurb: "The city's paper of record. Marlowe's desk is the messy one.",
    scene: "newsroom",
    mapX: 50,
    mapY: 46,
  },
];

export function cityLocation(id: string): CityLocation {
  const loc = CITY_LOCATIONS.find((l) => l.id === id);
  if (!loc) throw new Error(`Unknown city location: ${id}`);
  return loc;
}

/* ------------------------------------------------------------------ */
/* Recurring cast                                                      */
/* ------------------------------------------------------------------ */

export interface RecurringCharacter {
  id: string;
  name: string;
  role: string;
  portrait: PortraitDef;
  bio: string;
}

export const RECURRING_CAST: Record<string, RecurringCharacter> = {
  voss: {
    id: "voss",
    name: "Captain Mara Voss",
    role: "Chief of Detectives, Precinct Seven",
    portrait: {
      skin: "#b98a6a",
      hair: "#3a3f4a",
      hairStyle: "bun",
      accent: "#2c4a6e",
      outfit: "uniform",
      age: "mid",
    },
    bio: "Twenty-two years on the force. Reads people the way others read weather. Believes in you more than she will ever say out loud.",
  },
  rook: {
    id: "rook",
    name: "Dr. Elias Rook",
    role: "Chief Medical Examiner",
    portrait: {
      skin: "#e2b49a",
      hair: "#c9c2b0",
      hairStyle: "short",
      accent: "#4fd8c4",
      outfit: "labcoat",
      glasses: true,
      age: "old",
    },
    bio: "The dead tell him everything, eventually. Keeps a kettle in the morgue and insists the tea helps them talk.",
  },
  reyes: {
    id: "reyes",
    name: "Nadia Reyes",
    role: "Senior Forensic Technician",
    portrait: {
      skin: "#9a6b4f",
      hair: "#1e1a18",
      hairStyle: "ponytail",
      accent: "#8b7cc8",
      outfit: "labcoat",
      glasses: true,
      age: "young",
    },
    bio: "If it left a fiber, a print, or a residue, Nadia has already bagged it. Do not touch her light table.",
  },
  marlowe: {
    id: "marlowe",
    name: "Felix Marlowe",
    role: "Crime Desk, The Veilport Ledger",
    portrait: {
      skin: "#e2b49a",
      hair: "#7a4a2e",
      hairStyle: "curly",
      accent: "#a97a35",
      outfit: "vest",
      hat: "fedora",
      age: "mid",
    },
    bio: "Knows everyone's second secret. Trades information like currency and always pays his tab at The Blue Hour.",
  },
  sal: {
    id: "sal",
    name: "Sam “Sal” Okafor",
    role: "Owner, The Blue Hour",
    portrait: {
      skin: "#5c3a28",
      hair: "#14100e",
      hairStyle: "buzz",
      accent: "#2e6e5e",
      outfit: "apron",
      beard: true,
      age: "mid",
    },
    bio: "Pours doubles for the grieving and coffee for the working. Hears everything. Repeats nothing — unless it matters.",
  },
  demir: {
    id: "demir",
    name: "Yusuf Demir",
    role: "Night Taxi, Medallion 7-7-4",
    portrait: {
      skin: "#c99a72",
      hair: "#2a2622",
      hairStyle: "short",
      accent: "#c9a22e",
      outfit: "sweater",
      hat: "cap",
      beard: true,
      age: "mid",
    },
    bio: "Drives the night shift by choice. His logbook is more accurate than most police reports.",
  },
  lindqvist: {
    id: "lindqvist",
    name: "Officer Petra Lindqvist",
    role: "Patrol, Precinct Seven",
    portrait: {
      skin: "#ecc5aa",
      hair: "#d8b66a",
      hairStyle: "short",
      accent: "#2c4a6e",
      outfit: "uniform",
      age: "young",
    },
    bio: "First on scene more often than chance allows. Writes the tightest incident reports in the precinct.",
  },
};
