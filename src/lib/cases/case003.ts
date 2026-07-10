import type { CaseDef } from "@/lib/engine/types";

/**
 * EPISODE 3 — THE ARCHIVIST
 *
 * Truth of the case:
 * Curator Dr. Miriam Volk spent three years selling original charts from
 * the museum's Ashford Bequest to a private buyer in Prague, hanging expert
 * forgeries in their place. Senior archivist Edwin Hale, re-cataloguing the
 * bequest for its anniversary exhibition, found titanium white — a pigment
 * that did not exist before 1921 — in a "1687" chart. On the night of the
 * storm he confronted Volk and gave her until morning to confess. At 9:13 PM
 * she opened the maintenance panel with her curator's master key and pulled
 * the main breaker. In the blackout she struck Hale with a bronze bookend,
 * toppled the astrolabe stand over the body to stage an accident, and took
 * Folio VII — the one chart whose replacement forgery wasn't finished —
 * to her storage unit in the industrial zone.
 */

export const CASE_003: CaseDef = {
  id: "the-archivist",
  number: 3,
  title: "The Archivist",
  hook: "A blackout, a fallen astrolabe, and a folio missing from a locked room.",
  difficulty: 3,
  weather: { kind: "storm", intensity: 0.9 },
  timeOfDay: "night",

  newspaper: {
    date: "Tuesday Edition",
    headline: "ARCHIVIST DIES IN MUSEUM BLACKOUT",
    subhead: "Edwin Hale found beneath a toppled display in the map room as storm cuts power across University Hill.",
    body: [
      "Edwin Hale, 58, senior archivist of the Veilport Museum for thirty-one years, was found dead in the museum's map room last night, apparently struck by a falling bronze astrolabe when Monday's storm knocked out power across University Hill.",
      "Hale had been working late on the Ashford Bequest — the celebrated collection of seventeenth-century harbor charts — ahead of its 250th-anniversary exhibition next month.",
      "Museum director's office called the death 'a heartbreaking accident.' Precinct Seven, notably, has not. The map room remains sealed, and a detective has been assigned.",
      "Hale is remembered by colleagues as 'the museum's conscience.' The anniversary exhibition has been postponed indefinitely.",
    ],
    sidebar: {
      title: "STORM WARNING",
      body: "Monday's storm cut power to 4,000 homes. University Hill went dark 9:14–9:52 PM. More weather coming, Veilport. Candles and patience.",
    },
  },

  briefing: {
    officerId: "voss",
    lines: [
      "Edwin Hale. Thirty-one years cataloguing this city's memory, found under a display stand the museum is very eager to call an accident.",
      "Here's my problem, Detective. The power on University Hill went out at 9:14. The museum's own log says Hale signed a visitor OUT of the archive at 9:05 — so he was alive, working, nine minutes before the dark. Rook says the astrolabe story has arithmetic trouble. I'll let him tell you.",
      "And one more thing: the folio he was working on — number seven of the Ashford charts — is missing. Accidents don't steal, in my experience.",
      "The museum board meets Thursday and wants this closed as weather. Storms knock down power lines, Detective. Storms do not, as a rule, take the paperwork with them.",
    ],
  },

  victim: {
    name: "Edwin Hale",
    role: "Senior Archivist, Veilport Museum, 58",
    portrait: {
      skin: "#e8c0a4",
      hair: "#a8a094",
      hairStyle: "short",
      accent: "#6e5a3a",
      outfit: "sweater",
      glasses: true,
      age: "old",
    },
    bio: "Thirty-one years in the archive. Wore a jeweler's loupe on a neck chain, knew every fiber in the building, and once delayed a royal visit over a mis-dated caption. 'The record,' he liked to say, 'outlives the embarrassment.'",
    foundAt: "museum",
    initialFinding: "Found at 10:05 PM beneath a toppled astrolabe stand in the map room. Museum calls it a storm accident. The map room door was locked from the inside — staff keys only.",
  },

  motives: [
    { id: "acquisition", label: "Obsession — a collector who would not take no" },
    { id: "forgery", label: "Concealment — he uncovered forgeries in the collection" },
    { id: "thesis", label: "Desperation — academic theft gone wrong" },
    { id: "negligence", label: "Cover-up — hiding a fatal security failure" },
    { id: "inheritance", label: "Money — a bequest worth killing for" },
  ],

  locations: [
    {
      locationId: "museum",
      sublabel: "The Map Room",
      arrivalText:
        "The map room holds its breath under emergency lighting. Cedar cabinets to the ceiling, the Ashford charts glowing in their cases — and a chalk outline beneath a toppled bronze astrolabe, its stand lying like a felled mast. Rain hammers the skylight. Thunder rolls somewhere over University Hill.",
      peopleHere: ["volk", "pike"],
      hotspots: [
        {
          id: "body-position",
          label: "The toppled display",
          x: 44,
          y: 60,
          description:
            "The astrolabe stand lies across the chalk outline — plausible, at a glance. But the stand fell east and Hale fell west, and heavy things don't usually strike a man on opposite sides of himself. You photograph everything.",
          evidenceId: "photo-archivist",
        },
        {
          id: "work-desk",
          label: "Hale's work desk",
          x: 68,
          y: 52,
          description:
            "His loupe, his cotton gloves, his notebook open to the last page he ever wrote. The handwriting is calm until the final line, which is pressed hard enough to emboss the next three pages.",
          evidenceId: "hale-note",
        },
        {
          id: "folio-case",
          label: "Ashford case — Folio VII",
          x: 30,
          y: 42,
          description:
            "Twelve numbered folio cases. Eleven occupied. The seventh case is open, empty, and unforced — opened with a key, by someone with clean, quick hands. Folio VII: the 1687 harbor charts. Gone.",
          flavor: true,
        },
        {
          id: "bookend",
          label: "Bronze bookend",
          x: 82,
          y: 66,
          description:
            "A pair of bronze ship bookends holds the reference shelf — except the pair is a single. Its twin sits two shelves down, subtly misplaced, freshly wiped. Wiped things interest you. You bag it for Reyes.",
          evidenceId: "bookend",
        },
        {
          id: "maintenance-panel",
          label: "Maintenance panel",
          x: 10,
          y: 36,
          description:
            "The corridor breaker panel, behind a keyed steel door. The museum's electrician is adamant: the storm took the street, but the museum has a backup feed — the map room only goes dark if someone pulls the main. The panel lock logs its keys.",
          evidenceId: "breaker-log",
        },
        {
          id: "satchel",
          label: "Abandoned satchel",
          x: 56,
          y: 74,
          description:
            "Wedged behind the reading table: a student's canvas satchel — annotated thesis drafts, a cheese sandwich, and a camera loaded with half-shot film. Property tag: T. AOKI. Someone left in a great hurry.",
          evidenceId: "tessa-film",
        },
        {
          id: "skylight",
          label: "The skylight",
          x: 90,
          y: 20,
          description:
            "Rain crawls across the glass in long silver roots. Hale requested this skylight blacked out for conservation reasons, twice a year, for thirty-one years. The board always refused. It seems important to notice things he cared about.",
          flavor: true,
        },
      ],
    },
    {
      locationId: "university",
      sublabel: "Halloway University — Cartography Dept.",
      arrivalText:
        "The cartography department smells of old paper and older radiators. Storm-drowned quiet. Tessa Aoki's carrel is a fortress of map facsimiles, sticky notes, and cold coffee — currently occupied by Tessa Aoki, pretending magnificently to be working.",
      peopleHere: ["tessa"],
      hotspots: [
        {
          id: "thesis-wall",
          label: "Tessa's carrel wall",
          x: 60,
          y: 48,
          description:
            "Her thesis map, pinned corner to corner: 'Coastal Drift — The 1687 Ashford Surveys Reconsidered.' Every reference is to the folios. Access requests to the archive, seven of them, are pinned in a row. Six are stamped DENIED — D. VOLK. The word 'restricted' has been underlined, furiously, in red.",
          flavor: true,
        },
      ],
    },
    {
      locationId: "morgue",
      sublabel: "Examination Room 2",
      arrivalText:
        "Rook has the astrolabe's weight and fall arc chalked on his blackboard like a physics lecture. 'Sit, Detective,' he says, tapping the board. 'Tonight the arithmetic itself is the witness.'",
      peopleHere: ["rook"],
      hotspots: [
        {
          id: "autopsy-file3",
          label: "Autopsy report",
          x: 70,
          y: 55,
          description:
            "Rook's report, with diagrams. Two impacts, one story between them — and the story isn't 'accident.'",
          evidenceId: "autopsy3",
        },
      ],
    },
    {
      locationId: "precinct",
      sublabel: "Precinct Seven — Detectives' Floor",
      arrivalText:
        "The storm has half the precinct's lights flickering in sympathy. Reyes has the lab annex glowing steady — she rigged her own circuit years ago, on the grounds that evidence doesn't wait for the grid.",
      peopleHere: ["reyes"],
      hotspots: [
        {
          id: "records-desk3",
          label: "Records desk",
          x: 20,
          y: 60,
          description:
            "Hale's phone records, and — because you asked nicely and Voss signed loudly — the museum's dealings pulled from the registrar of companies. Paper answers, waiting for questions.",
          evidenceId: "phone-records3",
        },
        {
          id: "film-bench",
          label: "Photo development bench",
          x: 74,
          y: 52,
          description:
            "Reyes developed the student's film in forty minutes flat. The strip hangs like a tiny filmstrip of the storm — timestamped frames, and one of them matters enormously.",
          evidenceId: "tessa-photos",
          requiresEvidence: ["tessa-film"],
        },
        {
          id: "uv-bench",
          label: "UV examination bench",
          x: 50,
          y: 40,
          description:
            "Two Ashford folios, borrowed under seal, glow strangely under ultraviolet. Reyes's pigment report sits beside them, and it rewrites three centuries in a paragraph.",
          evidenceId: "uv-analysis",
          requiresEvidence: ["hale-note"],
        },
      ],
    },
    {
      locationId: "hotel",
      sublabel: "Hotel Meridian — Executive Suite 9",
      arrivalText:
        "Bram Callas receives you amid room-service silver and rolled maps in archival tubes — his own, he clarifies, before you can ask. The suite smells of cigar smoke and acquisitiveness.",
      peopleHere: ["callas"],
      hotspots: [
        {
          id: "offer-file",
          label: "Correspondence folder",
          x: 66,
          y: 54,
          description:
            "Callas hands it over unprompted — 'transparency, Detective.' Three years of offers for the Ashford charts, each larger, each refused. The last is not a letter so much as an ultimatum with a number on it.",
          evidenceId: "callas-letters",
        },
      ],
    },
    {
      locationId: "industrial",
      sublabel: "Ironway Self-Storage, Unit 44",
      arrivalText:
        "Rows of steel shutters under sodium light, rain drumming the corrugated roofs. Unit 44's padlock is new, bright, and no match for a warrant and a bolt cutter.",
      peopleHere: [],
      locked: {
        untilEvidence: "storage-receipt",
        note: "Ironway Self-Storage won't open a unit on a hunch. Find something that ties a name in this case to a unit number, and Voss will have the warrant inside the hour.",
      },
      hotspots: [
        {
          id: "unit-shelf",
          label: "Archival shelf",
          x: 50,
          y: 50,
          description:
            "Climate box, silica packs, museum-grade tissue — a thief who loves what she steals. Inside: Folio VII, the 1687 harbor charts, immaculate. And beneath it, banded correspondence postmarked Prague.",
          evidenceId: "folio-found",
        },
        {
          id: "prague-box",
          label: "Correspondence bundle",
          x: 74,
          y: 58,
          description:
            "Three years of letters from a private collector's agent in Prague. Purchases, wire instructions, and — in the latest — impatience: 'The seventh folio was promised for spring.'",
          evidenceId: "prague-letters",
          requiresEvidence: ["folio-found"],
        },
      ],
    },
    {
      locationId: "bluehour",
      sublabel: "The Blue Hour",
      arrivalText:
        "Storm trade at Sal's: wet coats, hot coffee, low talk. Sal nods you to the quiet end of the bar. 'Museum people drink here Thursdays,' he says. 'You'll want to hear about last Thursday.'",
      peopleHere: ["sal"],
      hotspots: [],
    },
    {
      locationId: "ledger",
      sublabel: "The Veilport Ledger — City Desk",
      arrivalText:
        "Marlowe has the arts pages spread across two desks and a look of professional vindication. 'I flagged this eighteen months ago,' he says, tapping a clipping. 'Nobody prints stories about paper. Sit down, Detective. Let me tell you about paper.'",
      peopleHere: ["marlowe"],
      hotspots: [
        {
          id: "auction-file",
          label: "Auction catalogues",
          x: 70,
          y: 52,
          description:
            "Marlowe's stack of private-sale catalogues, one page flagged: 'Harbor chart, Northern European, 17th c., exceptional provenance — private treaty sale.' The plate photograph shows a chart that should be sleeping in a Veilport museum case.",
          evidenceId: "auction-catalog",
        },
      ],
    },
    {
      locationId: "station",
      sublabel: "Taxi Rank, Grand Veilport Station",
      arrivalText:
        "Demir watches the storm from behind the wheel, wipers off, engine warm. 'University Hill, Monday night,' he says before you speak. 'Yes. I had a fare. You'll want the log.'",
      peopleHere: ["demir"],
      hotspots: [
        {
          id: "logbook3",
          label: "Demir's logbook",
          x: 55,
          y: 58,
          description:
            "Monday's page, rain-spotted, exact. One entry flagged with the usual matchstick: a pickup two streets from the museum, twenty minutes after the blackout began. The passenger carried a flat case and paid too much to skip the conversation.",
          evidenceId: "taxi-log3",
        },
      ],
    },
  ],

  evidence: [
    {
      id: "photo-archivist",
      name: "Scene photograph",
      type: "photo",
      icon: "camera",
      foundAt: "museum",
      summary: "The stand fell east. Hale fell west. Accidents don't work in opposite directions.",
      detail:
        "Framed wide, the staging almost holds. Framed close, it collapses: the astrolabe stand lies east of the outline, but Hale's wound and fall face west — struck from behind by something that was later arranged to have 'fallen' on him from in front.",
      document: {
        kind: "report",
        title: "SCENE PHOTOGRAPH — MAP ROOM",
        meta: "VPD FORENSICS · CASE 26-0139 · FRAME 09",
        body: "Display stand: fallen EAST of body position.\nVictim orientation: face-down, heading WEST.\nAstrolabe: resting against victim's left shoulder —\nplacement inconsistent with fall arc (see M.E. board).\nFolio case VII: open, unforced, EMPTY.\nMap room door: locked from inside. Staff keys only.",
      },
    },
    {
      id: "autopsy3",
      name: "Autopsy report",
      type: "forensic",
      icon: "folder",
      foundAt: "morgue",
      summary: "Two impacts. The fatal one came first, from behind — the astrolabe arrived after death.",
      detail:
        "Rook's blackboard arithmetic, formalized: a lethal depressed fracture from a compact, edged mass swung from behind — then, minutes later, the broad shallow contact of the astrolabe, placed against a body that no longer bled properly. The accident happened second. Accidents never happen second.",
      document: {
        kind: "autopsy",
        title: "POST-MORTEM EXAMINATION — HALE, EDWIN",
        meta: "OFFICE OF THE CHIEF MEDICAL EXAMINER · DR. E. ROOK",
        body: "Impact A (fatal): occipital, compact edged mass ~2kg,\nswung from behind/above. Ante-mortem.\nImpact B: broad contact, left shoulder/skull, minimal\nvital reaction — POST-MORTEM by several minutes.\nAstrolabe mass/fall arc CANNOT produce Impact A\nfrom any position of the stand (see appendix).\nTime of death: 21:10 — 21:30.\n\nRemark (E.R.): 'The astrolabe is an alibi for a bookshelf.\nFind the object that made Impact A. It will be modest,\nheavy, and recently very well cleaned.'",
      },
    },
    {
      id: "hale-note",
      name: "Hale's final notebook page",
      type: "document",
      icon: "letter",
      foundAt: "museum",
      summary: "'Titanium white in VII. Impossible before 1921. XII and XV suspect. M. knows I know — morning, or I go to the board.'",
      detail:
        "The last page of a careful life. Hale found a twentieth-century pigment in a seventeenth-century chart, checked two more folios, and gave someone until morning. The 'M' is unadorned — a colleague of thirty years doesn't need a surname. He pressed the final words hard enough to emboss three pages.",
      document: {
        kind: "note",
        title: "NOTEBOOK — E. HALE — FINAL ENTRY",
        meta: "Recovered from work desk, map room",
        body: "Folio VII, lower cartouche: TITANIUM WHITE.\nPigment unavailable before 1921. IMPOSSIBLE.\nRe-examined XII, XV under loupe — both suspect.\nThe originals are gone. These are copies. Superb,\nloving, criminal copies.\n\nM. knows I know. Told her: morning, or I go\nto the board myself.\n\n(final line, embossed through three pages)\nThe record outlives the embarrassment.",
      },
      keyEvidence: true,
    },
    {
      id: "bookend",
      name: "Bronze bookend",
      type: "physical",
      icon: "knife",
      foundAt: "museum",
      summary: "One of a pair, misplaced two shelves down and freshly wiped. Weight: 2.1 kilograms.",
      detail:
        "Rook asked for a modest, heavy, recently cleaned object. This is bronze, ship-shaped, 2.1 kilos, and someone wiped it well but re-shelved it wrong — a cleaner's diligence undone by a stranger's shelving. The archive would never misfile its own bronze. Reyes gets it next.",
    },
    {
      id: "breaker-log",
      name: "Maintenance panel key log",
      type: "record",
      icon: "key",
      foundAt: "museum",
      summary: "The blackout wasn't the storm. The main breaker panel was opened at 9:13 PM — with a curator's master key.",
      detail:
        "The street lost power at 9:14. The museum, on backup feed, should not have. The panel's key-lock log shows it opened at 9:13:41 — one minute before the 'storm' blackout — using key set C-1. The museum issues exactly one C-1: to the office of the curator.",
      document: {
        kind: "report",
        title: "PANEL ACCESS LOG — MAIN DISTRIBUTION",
        meta: "MUSEUM FACILITIES · ELECTRICIAN'S EXTRACT",
        body: "21:13:41 — PANEL OPENED — key set C-1 (curator's master).\n21:13:58 — MAIN BREAKER: OPEN (manual).\n21:52:19 — MAIN BREAKER: CLOSED (manual, same key).\n\nElectrician's note: 'Street feed failed 21:14. Museum\nbackup would have held ALL galleries lit. The dark\nwas made in-house, Detective. One minute early.'",
      },
      keyEvidence: true,
    },
    {
      id: "tessa-film",
      name: "Undeveloped film",
      type: "physical",
      icon: "camera",
      foundAt: "museum",
      summary: "A student's camera, half a roll shot, abandoned with her satchel behind the reading table.",
      detail:
        "Property of T. Aoki, cartography department — whose access requests Dr. Volk denied six times. The film needs developing before it can testify. Reyes has a bench for exactly this.",
    },
    {
      id: "tessa-photos",
      name: "Developed photographs",
      type: "photo",
      icon: "photo",
      foundAt: "precinct",
      summary: "Timestamped frames from inside the archive, 8:52–9:12 PM — the last one catches a lit doorway and a figure's shadow.",
      detail:
        "Tessa was photographing restricted folios — sixteen frames of quiet academic crime. Frame 16, stamped 9:12 PM, changes everything: shot toward the corridor at the sound of voices, it catches the maintenance-panel doorway lit, a keyring's glitter, and a shadowed figure in a long cardigan reaching into the panel. One minute later, the dark.",
      document: {
        kind: "cctv",
        title: "DEVELOPED FILM — T. AOKI — FRAME LOG",
        meta: "VPD PHOTO BENCH · N. REYES",
        body: "Frames 1–15 (20:52–21:10): Ashford folios II, V, IX,\nphotographed on reading table. (Unauthorized, noted.)\nFRAME 16 (21:12): corridor doorway, maintenance panel\nOPEN, figure reaching in. Long cardigan, keyring\nvisible. Face out of frame.\nNo further exposures.",
      },
      keyEvidence: false,
    },
    {
      id: "uv-analysis",
      name: "UV pigment analysis",
      type: "forensic",
      icon: "print",
      foundAt: "precinct",
      summary: "Folios XII and XV are forgeries. Modern pigments, modern paper sizing, old frames. Hale was right.",
      detail:
        "Under ultraviolet, three centuries dissolve: titanium white in the cartouches, optical brighteners in the paper sizing — chemistry that did not exist before the twentieth century. The Ashford Bequest on display is, at minimum, three-parts replica. The originals went somewhere. Originals always go somewhere.",
      document: {
        kind: "report",
        title: "PIGMENT & SUBSTRATE ANALYSIS — ASHFORD FOLIOS XII, XV",
        meta: "VPD FORENSICS · N. REYES",
        body: "Folio XII: titanium white (post-1921) in cartouche;\noptical brighteners in sizing (post-1950s).\nFolio XV: identical profile.\nExecution: expert. Materials: fatally modern.\nConclusion: DISPLAYED FOLIOS ARE FORGERIES.\nNote (N.R.): 'Whoever painted these loved the originals.\nWhoever commissioned them had access, time, and keys.'",
      },
      keyEvidence: true,
    },
    {
      id: "phone-records3",
      name: "Hale's phone records",
      type: "record",
      icon: "phone",
      foundAt: "precinct",
      summary: "5:40 PM: an authentication service. 8:50 PM: a four-minute call to Dr. Volk's office. His last.",
      detail:
        "In the afternoon he called Meridian Fine Art Authentication — 'preliminary inquiry, seventeenth-century pigments.' At 8:50 PM he called the curator's office and spoke for four minutes. At 9:13 the lights went out. The sequence reads like a countdown.",
      document: {
        kind: "phone",
        title: "SUBSCRIBER RECORD — HALE, E.",
        meta: "VEILPORT TELEPHONE EXCHANGE · FINAL DAY",
        body: "17:40 — CALL — Meridian Fine Art Authentication — 6 min\n  (svc. note: 'inquiry re: C17 pigment verification,\n   apptmt requested for Wednesday')\n20:50 — CALL — VEILPORT MUSEUM, CURATOR'S OFFICE — 4 min\n21:13 — (no further activity)",
      },
      keyEvidence: false,
    },
    {
      id: "callas-letters",
      name: "Callas's offer file",
      type: "document",
      icon: "letter",
      foundAt: "hotel",
      summary: "Three years of escalating offers for the Ashford charts — the last one reads like a threat with a comma in it.",
      detail:
        "Bram Callas wanted the Ashford folios with a collector's hunger: offers rising from generous to obscene, all refused by the board. The final letter — 'every collection changes hands eventually, Doctor; the only variable is dignity' — was addressed not to the board, but to Dr. Volk personally. Interesting, that she never reported it.",
      document: {
        kind: "letter",
        title: "CALLAS TO VOLK — FINAL OFFER",
        meta: "Surrendered voluntarily, Suite 9",
        body: "Doctor,\n\nMy fourth and final figure is enclosed. It will fund\nyour museum's leaking roof for a decade.\n\nEvery collection changes hands eventually. The only\nvariable is dignity. I offer a great deal of it.\n\n— B. Callas\n\n(enclosed figure: redacted at owner's counsel's request)",
      },
    },
    {
      id: "guard-log",
      name: "Night patrol log",
      type: "record",
      icon: "badge",
      foundAt: "interview",
      summary: "Pike's log: '21:15 — all floors patrolled, all quiet.' The photographs say the corridor was anything but.",
      detail:
        "The patrol log is neat, punctual, and fictional. At 9:15 Pike logged a full round 'all quiet' — while the maintenance panel stood open, a student hid in the archive, and a man lay dying in the map room. Either the guard is the killer, or the log is a lie with an innocent explanation. Guards with radios usually have the second kind.",
      document: {
        kind: "report",
        title: "NIGHT PATROL LOG — O. PIKE",
        meta: "MUSEUM SECURITY · MONDAY",
        body: "20:15 — round complete, all quiet.\n21:15 — round complete, all quiet.  ← (ink pressure\n         differs; entry written over-neatly)\n22:00 — (blank)\n22:05 — EMERGENCY — map room — body discovered.",
      },
    },
    {
      id: "storage-receipt",
      name: "Storage unit receipt",
      type: "record",
      icon: "ticket",
      foundAt: "interview",
      summary: "Ironway Self-Storage, Unit 44 — rented under 'M. Weiss,' paid in cash, in a curator's handwriting.",
      detail:
        "Surrendered by a night guard buying back his conscience: a receipt he found in the loading bay last month and kept 'in case it mattered.' Unit 44, Ironway Self-Storage, rented to 'M. Weiss.' The handwriting on the signature line has catalogued forty exhibitions. It matters.",
      document: {
        kind: "ticket",
        title: "IRONWAY SELF-STORAGE — RECEIPT",
        meta: "UNIT 44 · CASH · 'M. WEISS'",
        body: "Unit 44 — climate tier.\n12 months, paid cash.\nContact: (none given)\nSignature: 'M. Weiss'\n\n(Handwriting comparison, N.R.: matches accession\ncards written by DR. M. VOLK. Same looped 'M',\nsame museum-trained baseline. It's her hand.)",
      },
      keyEvidence: false,
    },
    {
      id: "folio-found",
      name: "Folio VII — recovered",
      type: "physical",
      icon: "folder",
      foundAt: "industrial",
      summary: "The missing 1687 harbor charts, archivally boxed in Unit 44 — the one folio whose forgery wasn't ready.",
      detail:
        "Wrapped like a relic, stored like a hostage. Folio VII is the genuine article — the chart with titanium white was the half-finished replica meant to replace it. Hale caught the scheme one folio too early, and the folio had to vanish with him. It vanished into a unit rented in a dead woman's maiden name. Curators remember everything. That's the job.",
      keyEvidence: true,
    },
    {
      id: "prague-letters",
      name: "Prague correspondence",
      type: "document",
      icon: "letter",
      foundAt: "industrial",
      summary: "Three years of purchases by a private collector's agent in Prague. Nine folios sold. 'The seventh was promised for spring.'",
      detail:
        "The whole architecture, banded and dated: wire instructions, courier arrangements, connoisseur's praise — nine original Ashford folios sold abroad while forgeries kept their cases warm. The latest letter is impatient about Folio VII. The scheme had a schedule. Edwin Hale interrupted it.",
      document: {
        kind: "letter",
        title: "AGENT (PRAGUE) TO 'M. WEISS' — LATEST",
        meta: "Recovered, Unit 44",
        body: "Madam,\n\nMy principal's patience, like his wall space, is not\ninfinite. The seventh folio was promised for spring.\n\nThe usual terms. The usual courier. Do not make me\nwrite again in a less friendly hand.\n\n— K.",
      },
      keyEvidence: true,
    },
    {
      id: "auction-catalog",
      name: "Private sale catalogue",
      type: "document",
      icon: "folder",
      foundAt: "ledger",
      summary: "A 'seventeenth-century harbor chart, exceptional provenance' sold privately eighteen months ago. Marlowe recognized the coastline.",
      detail:
        "Marlowe flagged it long before anyone died: a private-treaty sale of a chart whose engraved coastline is unmistakably Veilport's — while the museum's 'complete' Ashford Bequest hung serenely in its cases. Either there are two of a unique thing, or the museum's copy stopped being real.",
      document: {
        kind: "news",
        title: "PRIVATE TREATY SALE — LOT 12",
        meta: "CONTINENTAL CATALOGUE · 18 MONTHS AGO",
        body: "Harbor chart, Northern European school, 17th c.\n'Exceptional provenance; property of a private\ncollection.' Price on application.\n\nMarlowe's margin note: 'That's OUR coastline.\nThat's Ashford. So what's hanging in the museum?'",
      },
    },
    {
      id: "taxi-log3",
      name: "Demir's fare log",
      type: "record",
      icon: "ticket",
      foundAt: "station",
      summary: "9:34 PM, two streets from the museum: a fare to the industrial zone carrying a flat case. 'Storm's good cover,' she said.",
      detail:
        "Twenty minutes after the blackout began, a woman flagged Demir two streets from the museum — dry under a long cardigan, carrying a flat portfolio case she wouldn't surrender to the trunk. Destination: Ironway Self-Storage. She waited eleven minutes and rode back to University Hill. Demir remembers because she overpaid and said, of the weather, 'storm's good cover.' He wrote it down. He writes everything down.",
      document: {
        kind: "ledger",
        title: "MEDALLION 7-7-4 — MONDAY LOG",
        meta: "Y. DEMIR",
        body: "21:34 — Ashcroft St (2 blocks off museum) →\n  IRONWAY SELF-STORAGE, industrial zone.\n  Pax: woman, 50s, long cardigan, flat case —\n  kept it on her knees. \n21:49 — waited (11 min, meter running).\n22:00 — return → University Hill, Godwin Gate.\n  Overpaid. Said: 'storm's good cover.' Wrote it down.",
      },
      keyEvidence: false,
    },
    {
      id: "tessa-statement",
      name: "Tessa's statement",
      type: "statement",
      icon: "badge",
      foundAt: "interview",
      summary: "8:55 PM, through the archive shelves: Hale and Dr. Volk, arguing. 'The Prague buyer.' 'You'll return every one of them.'",
      detail:
        "Once the trespass stopped being worth the silence, Tessa gave up the argument she overheard: Hale's voice, level and terrible, saying he'd found the pigment; a woman answering — a voice she has heard deny six access requests; the words 'the Prague buyer' and 'you'll return every one of them, Miriam, starting with the seventh.' Then footsteps, and Tessa hid, and the world went dark.",
      document: {
        kind: "report",
        title: "WITNESS STATEMENT — T. AOKI",
        meta: "TAKEN UNDER CAUTION · WITNESSED",
        body: "'I was photographing folios I wasn't allowed to see.\nI'll take whatever that costs.\nAt about 8:55 I heard Mr. Hale through the stacks —\ncalm, awful-calm: \"titanium white, Miriam. In the\nseventh folio.\" A woman's voice answered. I know\nthat voice. It has told me no six times.\nHe said: \"the Prague buyer\" — and \"you'll return\nevery one of them, starting with the seventh.\"\nShe said morning was \"acceptable.\" Then footsteps.\nThen the dark. Then I ran and left everything.'",
      },
      keyEvidence: false,
    },
    {
      id: "lab-bookend",
      name: "Bookend analysis",
      type: "forensic",
      icon: "print",
      foundAt: "precinct",
      summary: "Blood in the hinge-seam the wipe-down missed. Hale's. And a cotton conservation-glove fiber, museum grade.",
      detail:
        "The bookend was wiped by someone thorough — but bronze ships have seams, and seams keep faith with the dead. Trace blood in the hull joint: Hale's. Snagged on the keel: a single cotton fiber, conservation-glove grade, the kind the museum orders by the gross — and the kind a curator wears without thinking, even to a murder.",
      document: {
        kind: "report",
        title: "LAB ANALYSIS — ITEM 04 (BRONZE BOOKEND)",
        meta: "VPD FORENSICS · N. REYES",
        body: "Mass: 2.1kg — consistent with Impact A (see M.E.).\nSurface: wiped, recent. Hinge-seam residue: BLOOD —\nmatch HALE, E.\nFiber (keel snag): cotton, conservation-glove grade,\nmuseum supply standard.\nNote (N.R.): 'Your astrolabe is innocent. This is the\nweapon. It was handled with the museum's own gloves.'",
      },
      keyEvidence: true,
    },
  ],

  statements: [
    {
      id: "s-mv-office",
      suspectId: "volk",
      text: "“When the power failed I was in my office, cataloguing accession cards. I never left it until the alarm was raised.”",
    },
    {
      id: "s-mv-authentic",
      suspectId: "volk",
      text: "“The Ashford folios are authentic. Edwin verified the bequest himself last spring — his signature is on the condition reports.”",
    },
    {
      id: "s-mv-prague",
      suspectId: "volk",
      text: "“I know no buyers in Prague, Detective. This museum does not deal privately. It never has under my tenure.”",
    },
    {
      id: "s-op-patrol",
      suspectId: "pike",
      text: "“Nine-fifteen round, done and logged. All floors, all quiet. I was where the log says I was.”",
    },
    {
      id: "s-ta-left",
      suspectId: "tessa",
      text: "“I left the museum at five, when the reading room closes. I was home before the storm broke.”",
    },
    {
      id: "s-bc-boardroom",
      suspectId: "callas",
      text: "“During the blackout I was in the boardroom with eleven trustees and a very good Margaux. Candlelit, memorably.”",
    },
  ],

  suspects: [
    /* ---------------- DR. MIRIAM VOLK — curator (guilty) ------------- */
    {
      id: "volk",
      name: "Dr. Miriam Volk",
      role: "Chief Curator, Veilport Museum",
      portrait: {
        skin: "#e6bfa0",
        hair: "#6e6458",
        hairStyle: "bun",
        accent: "#4a3a5e",
        outfit: "suit",
        glasses: true,
        age: "old",
      },
      presence: "museum",
      personality:
        "Brilliant, glacial, institutional to the marrow. Speaks of the museum as 'we' and of herself almost never. Grief rendered as administration.",
      demeanor: "Managing the tragedy like an exhibition — every answer already framed and lit.",
      alibi: "In her office cataloguing accession cards when the power failed; stayed until the alarm.",
      motiveHint: "Thirty years of custody. If the collection has secrets, they are her secrets — every key in the building answers to her.",
      greeting: {
        text: "Detective. Dr. Miriam Volk — I have the honor of this museum, and as of last night, the grief of it. Edwin Hale was the finest archivist in the country and my colleague for thirty years. I will assist you completely. I ask only that you handle the collection — and him — with care.",
        mood: "calm",
      },
      farewell: "The record outlives the embarrassment, Detective. Edwin taught us all that. Do close the cabinet on your way out.",
      stressThresholds: { nervous: 30, breaking: 78 },
      topics: [
        {
          id: "t-mv-alibi",
          triggers: ["where were you", "blackout", "alibi", "that night", "whereabouts", "power", "monday", "your evening"],
          responses: [
            {
              text: "When the power failed I was in my office, cataloguing accession cards. I never left it until the alarm was raised. The storm took the whole hill, as I understand — one sat in the dark and waited, as one does.",
              mood: "calm",
              statementId: "s-mv-office",
            },
            {
              text: "My office, Detective, as I said. Accession cards do not catalogue themselves, blackout or no.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-mv-victim",
          triggers: ["hale", "edwin", "victim", "archivist", "colleague"],
          responses: [
            {
              text: "Thirty years. He mistrusted electricity, adored vellum, and corrected two of my captions a decade ago in a manner I have not yet forgiven. The museum's conscience — that's what the staff called him, and consciences, Detective, are famously inconvenient and utterly irreplaceable.",
              mood: "sad",
              stress: 4,
            },
          ],
        },
        {
          id: "t-mv-folio",
          triggers: ["folio", "seventh", "vii", "missing", "charts", "ashford", "stolen"],
          responses: [
            {
              text: "Folio VII's absence distresses me more than I can politely express. The case is unforced — a staff key, which the director will tell you means six people, and I will tell you means six people and thirty years of unreturned copies. I have inventoried the rest of the bequest personally this morning. Nothing else is gone.",
              mood: "calm",
              stress: 8,
            },
          ],
        },
        {
          id: "t-mv-forgery",
          triggers: ["forgery", "forger", "fake", "authentic", "pigment", "titanium", "copy", "replica"],
          responses: [
            {
              text: "The Ashford folios are authentic. Edwin verified the bequest himself last spring — his signature is on the condition reports. I would stake my tenure on those charts, Detective. I effectively have, for thirty years.",
              mood: "defensive",
              statementId: "s-mv-authentic",
              stress: 14,
            },
            {
              text: "You keep pronouncing 'pigment' like a verdict. Conservation science is a subtle discipline and forgery is an extraordinary claim. Extraordinary claims, Detective, require more than a dead man's marginalia.",
              mood: "defensive",
              stress: 10,
            },
          ],
        },
        {
          id: "t-mv-prague",
          triggers: ["prague", "buyer", "sale", "sold", "private", "collector", "abroad", "weiss"],
          responses: [
            {
              text: "I know no buyers in Prague, Detective. This museum does not deal privately. It never has under my tenure. If Mr. Callas has been whispering about continental appetites, I suggest you examine his correspondence rather than my acquaintance.",
              mood: "calm",
              statementId: "s-mv-prague",
              stress: 12,
            },
          ],
        },
        {
          id: "t-mv-call",
          triggers: ["call", "phone", "8:50", "spoke", "rang", "office phone"],
          responses: [
            {
              text: "Edwin called my office at ten to nine, yes — exhibition matters. Caption approvals, case humidity, the eternal skylight complaint. Four minutes of housekeeping. I wish, now, that I had kept him on the line an hour.",
              mood: "sad",
              stress: 10,
            },
          ],
        },
        {
          id: "t-mv-keys",
          triggers: ["key", "master", "c-1", "panel", "breaker", "maintenance", "access"],
          responses: [
            {
              text: "The curator's master set opens everything; that is what 'curator' means. It hangs in my office when it is not on my person, and my office was occupied — by me — throughout. If a key was used somewhere it oughtn't have been, Detective, look to the copies this building has leaked over three decades.",
              mood: "defensive",
              stress: 12,
            },
          ],
        },
        {
          id: "t-mv-callas",
          triggers: ["callas", "bram", "donor", "offers"],
          responses: [
            {
              text: "Mr. Callas has spent three years mistaking a museum for a marketplace. His offers were refused — by the board, with my enthusiastic assistance. A man that hungry for a thing, Detective, rarely waits politely forever. I'd sit with him at length.",
              mood: "smug",
            },
          ],
        },
        {
          id: "t-mv-tessa",
          triggers: ["tessa", "aoki", "student", "satchel"],
          responses: [
            {
              text: "Miss Aoki. Persistent child — six access requests, six refusals. The folios are too fragile for a doctoral candidate's enthusiasm; that is policy, not cruelty. If she was in my archive after hours, then she has answered for herself what she was willing to do for those charts. Haven't you found that interesting?",
              mood: "calm",
              stress: 4,
            },
          ],
        },
        {
          id: "t-mv-pike",
          triggers: ["pike", "guard", "oren", "security", "patrol"],
          responses: [
            {
              text: "Mr. Pike patrols with the diligence of a man paid what we pay him. If his log says all quiet, Detective, it means the radio was on and the boxing was close. I've meant to raise it with the board for a year. Now I suppose the board will raise it with me.",
              mood: "neutral",
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "hale-note",
          response: {
            text: "'M knows I know.' M. How economical of Edwin — thirty years and I am an initial. Detective, a museum is an alphabet of M's: Margaret in conservation, Marcus on the board, Miss Aoki when he was feeling formal... You will need considerably more than a consonant.",
            mood: "nervous",
            stress: 16,
          },
        },
        {
          evidenceId: "uv-analysis",
          response: {
            text: "...Optical brighteners. In the sizing. That's— no. Your technician has contaminated the samples, or the conservation lab's records will show legitimate facsimile rotation for loan purposes, there are ALWAYS facsimiles in a working collection— I will need to see the chain of custody. I will need to see it TODAY.",
            mood: "afraid",
            stress: 22,
          },
          contradictsStatement: "s-mv-authentic",
        },
        {
          evidenceId: "breaker-log",
          response: {
            text: "C-1... My set was in my office. With me. In the dark, which you now inform me I manufactured, with a key that never left my— One minute early. You're hanging thirty years of my life on sixty seconds of a storm and a lock's opinion.",
            mood: "afraid",
            stress: 22,
          },
          contradictsStatement: "s-mv-office",
        },
        {
          evidenceId: "tessa-statement",
          response: {
            text: "So the trespasser heard voices through half a building of oak shelving and has assigned mine to the villain of her— 'You'll return every one of them.' ...He actually said it gently, you know. That was the unbearable part. Thirty years, and he offered me until MORNING, like a library fine.",
            mood: "afraid",
            stress: 20,
          },
          contradictsStatement: "s-mv-prague",
        },
        {
          evidenceId: "taxi-log3",
          response: {
            text: "A woman in a cardigan in a storm — half the faculty wives of University Hill, Detective... Ironway. He wrote Ironway. And 'storm's good cover' — I said that to a TAXI DRIVER. Thirty years of discretion and I annotated my own crime for a man with a logbook.",
            mood: "afraid",
            stress: 24,
          },
          contradictsStatement: "s-mv-office",
        },
        {
          evidenceId: "folio-found",
          response: {
            text: "You opened the unit. ...Is it safe? The seventh folio — was it HANDLED properly, was the box kept level— (a long silence) You think that concern is performance. It isn't, and that is the whole tragedy of me, Detective. I sold nine of my children to keep the roof over the rest, and I could not have loved them more.",
            mood: "sad",
            stress: 24,
          },
          contradictsStatement: "s-mv-prague",
        },
        {
          evidenceId: "lab-bookend",
          response: {
            text: "The gloves. One wears the gloves near the folios, always, it isn't even a decision after thirty years, it's— I wiped the bronze. I reshelved it. I forgot that this building notices a misfiled object the way other buildings notice fire. Edwin would have caught it in an hour. Edwin caught everything. That was always the problem.",
            mood: "afraid",
            stress: 25,
          },
        },
      ],
      breakLine: {
        text: "The board let the roof leak over the Flemish room for nine years, Detective. NINE YEARS. I wrote the grant letters, I begged, I hosted Callas and his cigar through four dinners — and one spring an agent in Prague offered me, for a single folio, what the city budgets this museum in two years. Nine folios. Nine, for climate systems and conservation staff and the roof. The forgeries were superb; nobody living could tell — nobody except Edwin, with his loupe and his conscience and his 'morning, Miriam, or I go to the board.' I only meant to make the dark and take the seventh, buy a month. But he came out of the map room with that GENTLE face and I had the bronze in my hand and thirty years, Detective, thirty years came down with the storm. ...He never even raised his voice. The record outlives the embarrassment. Well. Here is the record.",
        mood: "sad",
      },
      fallbacks: {
        neutral: [
          "Frame the question precisely, Detective. Precision is the courtesy this building runs on.",
          "I have given three decades to this institution. There is no question about it I cannot answer — test that.",
        ],
        nervous: [
          "Forgive me — the last day has been... Say it again, more slowly.",
          "You examine me the way Edwin examined paper, Detective. It is not a comfortable light.",
        ],
        angry: [
          "I have a museum in mourning and a board in revolt. Ask something worthy of the interruption.",
        ],
      },
    },

    /* ---------------- BRAM CALLAS — the collector (red herring) ------ */
    {
      id: "callas",
      name: "Bram Callas",
      role: "Financier & collector; museum donor",
      portrait: {
        skin: "#d8a988",
        hair: "#3a3430",
        hairStyle: "slick",
        accent: "#7a6428",
        outfit: "suit",
        beard: true,
        age: "mid",
      },
      presence: "hotel",
      personality:
        "Appetite in a tailored suit. Collects maps the way other men collect grievances — completely, and with lawyers.",
      demeanor: "Expansive, amused, entirely too comfortable.",
      alibi: "In the museum boardroom with eleven trustees throughout the blackout.",
      motiveHint: "Three years of refused offers for the Ashford charts. Men like Callas rarely accept 'no' as a permanent arrangement.",
      greeting: {
        text: "Detective! Sit, sit — the Margaux is breathing and the lawyers said I shouldn't see you, which is precisely why I insisted. Yes, I wanted the Ashford charts. Yes, I was in the building. No, I did not brain the one man in Veilport who loved them as much as I do. Now — what shall we actually talk about?",
        mood: "smug",
      },
      farewell: "When this is over, Detective, tell the museum my offer stands. Tragedy, I find, concentrates a board's mind wonderfully. ...Too soon? Too soon. The exit's past the cigars.",
      stressThresholds: { nervous: 45, breaking: 85 },
      topics: [
        {
          id: "t-bc-alibi",
          triggers: ["where were you", "blackout", "alibi", "boardroom", "that night", "whereabouts"],
          responses: [
            {
              text: "During the blackout I was in the boardroom with eleven trustees and a very good Margaux. Candlelit, memorably. Eleven witnesses, Detective — twelve if you count the sommelier, and you should; sommeliers notice everything.",
              mood: "smug",
              statementId: "s-bc-boardroom",
            },
          ],
        },
        {
          id: "t-bc-offers",
          triggers: ["offer", "buy", "charts", "ashford", "acquisition", "money", "letters", "collection"],
          responses: [
            {
              text: "Three years, four offers, each refused with escalating sanctimony. You've seen the file — I gave it to you, which the guilty famously don't. I wanted those charts legitimately, on paper, with a press release and my name on the gallery. Where is the pleasure in a map you cannot show anyone, Detective? Collecting is applause. Theft is solitaire.",
              mood: "calm",
              stress: 4,
            },
          ],
        },
        {
          id: "t-bc-hale",
          triggers: ["hale", "edwin", "victim", "archivist"],
          responses: [
            {
              text: "Hale once let me hold Folio II for four minutes under supervision, wearing gloves he inspected personally. Finest four minutes of my collecting life, and he charged me a donation to the roof fund for the privilege. I'd have endowed his chair, his archive, and his kettle to get those charts honestly. His death costs me the one broker of 'honestly' that building had.",
              mood: "sad",
            },
          ],
        },
        {
          id: "t-bc-volk",
          triggers: ["volk", "curator", "miriam", "doctor"],
          responses: [
            {
              text: "Dr. Volk. Now there's a portrait in two pigments. Refuses my money for the museum with one hand — and yet, Detective, at dinner four months ago I mentioned a Continental sale of a 'seventeenth-century harbor chart' I'd been outbid on, and she went the color of her accession cards. A curator surprised by the market is ordinary. A curator FRIGHTENED by it is a fascinating acquisition indeed.",
              mood: "smug",
            },
          ],
        },
        {
          id: "t-bc-forgery",
          triggers: ["forgery", "fake", "prague", "private sale", "copy"],
          responses: [
            {
              text: "Forgeries in the Ashford cases? (he is quiet for a moment, and for the first time nothing about him is performing) If that's true, Detective, then somebody has been selling the originals into exactly the private market I swim in — and I never smelled it. Which offends me professionally. Find what sold and I'll tell you what it went for. That world has perhaps nine addresses, and I dine at all of them.",
              mood: "neutral",
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "callas-letters",
          response: {
            text: "'The only variable is dignity' — yes, my prose runs purple after the second bottle. It was addressed to Volk personally because the board is a rubber stamp and she is the museum, everyone knows that. A vulgar letter, Detective. Vulgarity is legal. I checked.",
            mood: "smug",
            stress: 6,
          },
        },
        {
          evidenceId: "auction-catalog",
          response: {
            text: "...I bid on this lot. Anonymously, eighteen months ago — and lost, to a phone bidder nobody could place. Detective, I bid nine hundred thousand on a chart that, if your pigment people are right, was WALKED OUT of the collection I was simultaneously begging to buy. Somebody sold me a rejection and kept the merchandise. Find them before I do; my lawyers are less gentle than your courts.",
            mood: "angry",
            stress: 10,
          },
        },
      ],
      fallbacks: {
        neutral: [
          "Ask boldly, Detective — timidity wastes both our vintages.",
          "I answer best to nouns with price tags. Try me.",
        ],
        nervous: [
          "Hm — say that again? The storm's kept me from my sleep and the Margaux from its potential.",
        ],
        angry: [
          "Careful, Detective. I collect grievances too, and I frame them expensively.",
        ],
      },
    },

    /* ---------------- TESSA AOKI — the grad student ------------------ */
    {
      id: "tessa",
      name: "Tessa Aoki",
      role: "Doctoral candidate, cartography",
      portrait: {
        skin: "#ecc9b2",
        hair: "#1a1614",
        hairStyle: "long",
        accent: "#2e5e6e",
        outfit: "sweater",
        glasses: true,
        age: "young",
      },
      presence: "university",
      personality:
        "Fierce, broke, and eighteen months from a doctorate that lives or dies on charts she's forbidden to see. Guilt and terror in a borrowed cardigan.",
      demeanor: "Over-prepared answers, under-slept eyes.",
      alibi: "Claims she left the museum at five when the reading room closed.",
      motiveHint: "Six denied access requests. A thesis starving for the folios. And her satchel was behind the reading table after hours.",
      greeting: {
        text: "You're the detective. I heard about Mr. Hale and I— sorry, sit, there's a chair under those facsimiles somewhere. I don't know what I can possibly tell you. I'm just a student. I was barely ever— I'm just a student.",
        mood: "nervous",
      },
      farewell: "Mr. Hale once re-shelved a folio I'd been denied so it faced the reading room glass. So I could at least SEE it. Please — whoever did this. Please.",
      stressThresholds: { nervous: 15, breaking: 45 },
      topics: [
        {
          id: "t-ta-alibi",
          triggers: ["where were you", "monday", "alibi", "that night", "whereabouts", "blackout", "storm"],
          responses: [
            {
              text: "I left the museum at five, when the reading room closes. I was home before the storm broke. Working here, I mean — then home. It's all a bit blurred, the storm and the news and—  Five o'clock. I left at five.",
              mood: "nervous",
              statementId: "s-ta-left",
              stress: 14,
            },
          ],
        },
        {
          id: "t-ta-thesis",
          triggers: ["thesis", "research", "access", "denied", "requests", "folios", "charts", "ashford"],
          responses: [
            {
              text: "My whole dissertation is the 1687 surveys — coastal drift, the original soundings. Six requests for supervised access. Six denials, all signed Volk, all 'conservation grounds.' Detective, she let a DONOR hold Folio II. I've seen the visitor book. Conservation grounds have a net worth, apparently.",
              mood: "angry",
              stress: 6,
            },
          ],
        },
        {
          id: "t-ta-hale",
          triggers: ["hale", "edwin", "victim", "archivist"],
          responses: [
            {
              text: "Mr. Hale was the only one who was kind about it. He'd pull reference facsimiles for me, flag the sounding tables, leave them at my carrel with no note. Last month he said something strange — he said, 'Patience, Miss Aoki. The folios may need friends who love them for free before long.' I didn't understand it. I think about it constantly now.",
              mood: "sad",
              stress: 4,
            },
          ],
        },
        {
          id: "t-ta-volk",
          triggers: ["volk", "curator", "miriam"],
          responses: [
            {
              text: "Dr. Volk guards that bequest like— no. Not guards. Guarding is for showing people. She HIDES it. New glass with UV film you can't photograph through, folios rotated off display with no schedule, condition reports nobody may read. I used to think she loved them too much. Lately I'd started to wonder what loving them too much was hiding.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-ta-satchel",
          triggers: ["satchel", "bag", "camera", "film", "left behind", "archive"],
          responses: [
            {
              text: "My satchel? I— it must be at the department somewhere, I lose it weekly, ask anyone— (she is looking at the window, at the rain, at anything that is not you) Was there something else, Detective?",
              mood: "afraid",
              stress: 16,
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "tessa-film",
          response: {
            text: "(she goes very still) You developed it. Of course you developed it. ...Okay. OKAY. I was there. After closing — I hid in the stacks at five and I photographed folios I've been refused for two years, because my funding ends in June and the truth was RIGHT THERE in a cedar drawer. Expel me, charge me, fine. But Detective — before the lights went out, I heard them. I heard everything. Please write this down properly.",
            mood: "afraid",
            stress: 18,
            revealsEvidence: "tessa-statement",
          },
          contradictsStatement: "s-ta-left",
        },
        {
          evidenceId: "tessa-photos",
          response: {
            text: "Frame sixteen. I took that at the voices — I thought it was the guard and I panicked and shot toward the light like an idiot. That's the maintenance panel. That's a keyring. Detective, I've printed contact sheets for three years; I know what my own frame shows. It shows someone MAKING the blackout. One minute before the whole world says the storm did it.",
            mood: "nervous",
            stress: 8,
          },
        },
      ],
      breakLine: {
        text: "I ran. That's the part I can't— he was my friend, the only friend my thesis had in that building, and when the dark came down I grabbed nothing and I RAN, and he was maybe already— I left my satchel, I left HIM. So take the statement, take the film, take the degree if it comes to that. Just make it count for him.",
        mood: "sad",
      },
      fallbacks: {
        neutral: [
          "Sorry — could you ask that more specifically? I do better with specific. Footnotes ruined me.",
          "I'm trying to be helpful. I'm also terrified, if that's useful context.",
        ],
        nervous: [
          "I— sorry. Again? The last two days have been a lot of policemen.",
          "Is this the part where I should have someone with me? A supervisor, or a— sorry. Ask again.",
        ],
        angry: [
          "I'm a student, not a suspect. ...I'm both, aren't I. Okay. Ask.",
        ],
      },
    },

    /* ---------------- OREN PIKE — the night guard --------------------- */
    {
      id: "pike",
      name: "Oren Pike",
      role: "Night security, Veilport Museum",
      portrait: {
        skin: "#c9a488",
        hair: "#2e2a26",
        hairStyle: "buzz",
        accent: "#3a4a2e",
        outfit: "uniform",
        age: "mid",
      },
      presence: "museum",
      personality:
        "Eleven years of quiet rounds and one radio he shouldn't listen to. Not a bad man. A comfortable one — until Monday.",
      demeanor: "Standing too straight, the way the recently ashamed do.",
      alibi: "The patrol log says: 9:15 round, all floors, all quiet.",
      motiveHint: "His log is the official record of the night — and at least one line of it is written over-neatly.",
      greeting: {
        text: "Detective. Pike, night security. Eleven years, no incidents — well. Eleven years and one incident, now, and it's the whole world. I've given my log to your officer. Everything's in the log.",
        mood: "nervous",
      },
      farewell: "Eleven years I told people this job was 'guarding the city's memory.' Fancy words for a man with a radio. Get her justice, Detective — his, I mean. His.",
      stressThresholds: { nervous: 18, breaking: 50 },
      topics: [
        {
          id: "t-op-patrol",
          triggers: ["patrol", "round", "log", "9:15", "where were you", "alibi", "that night", "whereabouts", "blackout"],
          responses: [
            {
              text: "Nine-fifteen round, done and logged. All floors, all quiet. I was where the log says I was. Then the power went and I did the torch circuit, and at ten I found... at ten-oh-five I found him. It's in the log. It's all in the log.",
              mood: "nervous",
              statementId: "s-op-patrol",
              stress: 14,
            },
          ],
        },
        {
          id: "t-op-hale",
          triggers: ["hale", "edwin", "victim", "archivist"],
          responses: [
            {
              text: "Mr. Hale worked late Mondays, regular as the tide. Always signed the after-hours book, always made me a cocoa at midnight like I was the one doing him the favor. Eleven years of midnight cocoas, Detective. You don't guard a building that long. You guard the people who stay late in it. And Monday I didn't.",
              mood: "sad",
              stress: 8,
            },
          ],
        },
        {
          id: "t-op-visitors",
          triggers: ["visitor", "sign", "book", "who was in", "building", "after hours"],
          responses: [
            {
              text: "After-hours book Monday: Mr. Hale in the archive. Dr. Volk in her office — she's in most nights lately. Board dinner up top, eleven trustees plus Mr. Callas and the wine man. And Mr. Hale signed a visitor OUT at 9:05 — didn't catch who from my desk, just the door. That's everyone. Officially.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-op-radio",
          triggers: ["radio", "boxing", "loading bay", "match", "fight", "listen"],
          responses: [
            {
              text: "Radio? There's... a radio in the loading bay, sure. For deliveries. Reception's good down there is all. Was there a question in that, Detective?",
              mood: "afraid",
              stress: 14,
            },
          ],
        },
        {
          id: "t-op-volk",
          triggers: ["volk", "curator", "miriam", "storage", "receipt"],
          responses: [
            {
              text: "Dr. Volk... eleven years she's been fair to me. Distant, but fair. (he hesitates, longer than an innocent pause) Lately she takes deliveries herself. Flat cases, evenings, signs my sheet before I can read the courier's. It's her museum, I always figured. Curators take deliveries. That's... that's a thing they do. Right?",
              mood: "nervous",
              stress: 10,
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "guard-log",
          response: {
            text: "(he looks at the over-neat 9:15 entry for a long time) ...Middleweight title eliminator, Detective. Loading bay radio, rounds six through nine, and I wrote up the 9:15 patrol at ten to ten from memory, neat as I could, because neat is what a lie looks like when you're ashamed of it. I've never missed a round in eleven years. I missed the one that mattered. Whatever you need from me now — it's yours, and it's the truth.",
            mood: "afraid",
            stress: 18,
          },
          contradictsStatement: "s-op-patrol",
        },
        {
          evidenceId: "tessa-photos",
          response: {
            text: "That's the maintenance corridor — and that's a keyring on a long lanyard, curator-style, we wear ours on belts... Detective, since we're past my dignity anyway: last month I found a receipt in the loading bay after one of Dr. Volk's evening deliveries. Storage place in the industrial zone, cash, funny name. I kept it. Don't ask me why I kept it — eleven years in a museum, you learn everything's evidence eventually. It's in my locker. Take it.",
            mood: "nervous",
            stress: 10,
            revealsEvidence: "storage-receipt",
          },
        },
      ],
      breakLine: {
        text: "You want the whole confession? Here it is: I'm a fifty-one-year-old man who listened to a boxing match while the kindest soul in this building died two floors up. The law's got nothing for that. But I do — I've got a receipt, a memory for flat cases, and eleven years of knowing every sound this building makes. Use me, Detective. Please.",
        mood: "sad",
      },
      fallbacks: {
        neutral: [
          "It's in the log, Detective. And if it's not in the log... ask me anyway. New policy. As of Monday.",
          "Eleven years of nights here. Ask me about the building — the building I know cold.",
        ],
        nervous: [
          "I— say again? Been a long week of being awake at the wrong hours.",
        ],
        angry: [
          "I'm cooperating, Detective. Man can cooperate and still have his hands shake.",
        ],
      },
    },

    /* ================= WITNESSES (recurring cast) ===================== */

    {
      id: "rook",
      name: "Dr. Elias Rook",
      role: "Chief Medical Examiner",
      isWitness: true,
      recurring: true,
      portrait: {
        skin: "#e2b49a",
        hair: "#c9c2b0",
        hairStyle: "short",
        accent: "#4fd8c4",
        outfit: "labcoat",
        glasses: true,
        age: "old",
      },
      presence: "morgue",
      personality: "Gentle, exact, quietly devastating.",
      demeanor: "Chalk dust on his cuffs, physics on the blackboard.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective — mind the chalk. The museum sent over the astrolabe's specifications, hoping to be helpful. They have been enormously helpful. Not, I suspect, in the direction the museum hoped. Tea?",
        mood: "calm",
      },
      farewell: "Arithmetic never lies, Detective. It merely waits for someone patient enough to ask it questions.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-rk3-cause",
          triggers: ["cause", "death", "how did he die", "autopsy", "astrolabe", "accident", "findings", "impact"],
          responses: [
            {
              text: "Two impacts, Detective, and they refuse to share a story. The first — fatal — from a compact edged mass, about two kilos, swung from behind. The second, your famous astrolabe, arrived minutes AFTER death, laid against a man past bleeding for it. The report's on the table. The 'accident' is on the blackboard, failing its own physics.",
              mood: "calm",
            },
          ],
        },
        {
          id: "t-rk3-weapon",
          triggers: ["weapon", "bookend", "bronze", "object", "what struck"],
          responses: [
            {
              text: "Modest, heavy, edged, and — if your killer had any sense — recently very well cleaned. Museums are full of such objects, Detective; that's rather what museums are. Look for the one that's been wiped and put back a shelf wrong. Institutions notice misfiled things. Use that.",
              mood: "calm",
            },
          ],
        },
        {
          id: "t-rk3-time",
          triggers: ["when", "time", "window", "died", "blackout"],
          responses: [
            {
              text: "Between ten past nine and half past — which brackets your blackout with almost theatrical precision. He died in the manufactured dark, Detective, within minutes of it falling. Whoever pulled that breaker wasn't hiding from the storm. They were scheduling it.",
              mood: "calm",
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "bookend",
          response: {
            text: "Ah — bronze, two-point-one kilos, edged at the keel. Detective, this is Impact A wearing a dust jacket. Get it to Nadia before you get your hopes up, but between us: the arithmetic just stood up and applauded.",
            mood: "calm",
          },
        },
      ],
      fallbacks: {
        neutral: ["The blackboard and I are at your disposal, Detective.", "Ask the body's questions. The living lie; tissue merely understates."],
        nervous: ["Hm?"],
        angry: ["Hm."],
      },
    },

    {
      id: "reyes",
      name: "Nadia Reyes",
      role: "Senior Forensic Technician",
      isWitness: true,
      recurring: true,
      portrait: {
        skin: "#9a6b4f",
        hair: "#1e1a18",
        hairStyle: "ponytail",
        accent: "#8b7cc8",
        outfit: "labcoat",
        glasses: true,
        age: "young",
      },
      presence: "precinct",
      personality: "Fast, exact, allergic to speculation.",
      demeanor: "UV lamp humming, gloves on, faintly triumphant.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective. Three benches running tonight — film, pigments, and bronze. The storm knocked out half the grid and none of my results. Pick a bench.",
        mood: "neutral",
      },
      farewell: "Paper, pigment, and bronze, Detective. Everything else is theater.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-nr3-uv",
          triggers: ["uv", "pigment", "forgery", "titanium", "folios", "analysis", "fake"],
          responses: [
            {
              text: "Hale was right, and he was right with a loupe and no lab. Titanium white and optical brighteners in folios XII and XV — that's twentieth-century chemistry in seventeenth-century clothing. The displayed bequest is forged, expertly, by someone with long museum access. Report's on the bench. It rewrites three centuries in a paragraph.",
              mood: "neutral",
            },
          ],
          requiresEvidence: ["uv-analysis"],
        },
        {
          id: "t-nr3-film",
          triggers: ["film", "photos", "frame", "student", "camera", "develop"],
          responses: [
            {
              text: "The student's film developed clean. Frames one to fifteen are her thesis felony — folios on a reading table. Frame sixteen is yours: maintenance panel open, a keyring, a figure reaching in, timestamped one minute before the blackout. Somebody made that dark by hand, Detective, and a terrified doctoral candidate photographed them doing it.",
              mood: "neutral",
            },
          ],
          requiresEvidence: ["tessa-photos"],
        },
        {
          id: "t-nr3-bookend",
          triggers: ["bookend", "bronze", "weapon", "blood", "fiber", "glove"],
          responses: [
            {
              text: "Your bronze ship: wiped by somebody thorough, betrayed by a hinge-seam. Blood in the hull joint — Hale's. And one cotton fiber snagged on the keel, conservation-glove grade. Museum supply standard, Detective. The killer wore the museum's own gloves. Habit, probably. Thirty-year habits don't pause for murder.",
              mood: "neutral",
            },
          ],
          requiresEvidence: ["lab-bookend"],
        },
      ],
      presses: [
        {
          evidenceId: "bookend",
          response: {
            text: "Leave it — gloves, Detective, GLOVES. ...Right. Give me two hours with the seams. Wiped bronze always keeps something in the seams. Come back for the report.",
            mood: "neutral",
            revealsEvidence: "lab-bookend",
          },
        },
      ],
      fallbacks: {
        neutral: ["Pick a bench: film, pigment, bronze. I don't do hunches.", "Specifics, Detective. The lamps are expensive."],
        nervous: ["Hm?"],
        angry: ["Busy."],
      },
    },

    {
      id: "sal",
      name: "Sam “Sal” Okafor",
      role: "Owner, The Blue Hour",
      isWitness: true,
      recurring: true,
      portrait: {
        skin: "#5c3a28",
        hair: "#14100e",
        hairStyle: "buzz",
        accent: "#2e6e5e",
        outfit: "apron",
        beard: true,
        age: "mid",
      },
      presence: "bluehour",
      personality: "Hears everything, repeats what matters.",
      demeanor: "Storm trade, low lights, lower voices.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective. Museum crowd drinks here Thursdays — archivists at the bar, curators at the corner table, never together. You'll be wanting last Thursday. Coffee first. It's a two-coffee story.",
        mood: "calm",
      },
      farewell: "Buildings keep secrets better than people, Detective. But people drink here. Come back any Thursday.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-sal3-thursday",
          triggers: ["thursday", "hale", "museum", "heard", "argument", "curator", "volk"],
          responses: [
            {
              text: "Last Thursday, Hale took the end stool — unusual, he's a half-pint-and-home man. Drank two. Said to me, quiet: 'Sal, if you found out the thing you'd guarded your whole life was already gone — years gone — what would you do?' I said depends who took it. He said, 'That's the trouble. The thief is the other guard.' Paid, left his gloves on the bar, came back for them shaking his head. The other guard, Detective. I've been chewing that phrase since Monday night.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-sal3-volk",
          triggers: ["miriam", "corner table", "drinks"],
          responses: [
            {
              text: "The curator? Corner table, Thursdays, one sherry, papers out — always working. Except the last month or so: no papers. Just the sherry and the window. People stop bringing their work to a bar when the work's become the thing they're drinking about.",
              mood: "neutral",
            },
          ],
        },
      ],
      presses: [],
      fallbacks: {
        neutral: ["Thursdays, Detective. Everything this city knows, it says on a Thursday.", "Ask me about people. Buildings don't order."],
        nervous: ["Mm."],
        angry: ["Easy. House rules."],
      },
    },

    {
      id: "demir",
      name: "Yusuf Demir",
      role: "Night taxi, Medallion 7-7-4",
      isWitness: true,
      recurring: true,
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
      presence: "station",
      personality: "Sees the whole city through a windshield.",
      demeanor: "Wipers off, watching the storm.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective. Storms are good business and bad company. Monday night I had one fare worth your time — and she said one sentence worth your notebook. The log's flagged.",
        mood: "calm",
      },
      farewell: "In a storm everybody thinks nobody's watching. Taxis, Detective. Taxis are always watching.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-yd3-fare",
          triggers: ["fare", "monday", "storm", "woman", "cardigan", "ironway", "storage", "case", "museum"],
          responses: [
            {
              text: "Twenty minutes after University Hill went dark: a woman, two streets from the museum, dry as a hymnbook under a long cardigan. Flat case on her knees the whole ride — wouldn't trust it to the trunk of a taxi, which tells you what it was worth to her. Ironway Self-Storage, eleven minutes inside, back to the Hill. Overpaid me and said, 'storm's good cover.' People confess to taxis, Detective. They think the meter makes it a different country.",
              mood: "calm",
            },
          ],
        },
      ],
      presses: [],
      fallbacks: {
        neutral: ["The log knows Monday better than Monday does. Ask through me.", "Aim your question, Detective. Twenty years of nights in here."],
        nervous: ["Hm."],
        angry: ["Peace. Meter's off."],
      },
    },

    {
      id: "marlowe",
      name: "Felix Marlowe",
      role: "Crime desk, The Veilport Ledger",
      isWitness: true,
      recurring: true,
      portrait: {
        skin: "#e2b49a",
        hair: "#7a4a2e",
        hairStyle: "curly",
        accent: "#a97a35",
        outfit: "vest",
        hat: "fedora",
        age: "mid",
      },
      presence: "ledger",
      personality: "Charm, ink, and a ledger of favors.",
      demeanor: "Professionally vindicated, personally furious about it.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective! Eighteen months ago I pitched 'WHOSE CHART IS IT ANYWAY?' and my editor spiked it for a councilman's parking scandal. Now the archivist's dead and suddenly everyone loves paper. Sit — I kept everything. I always keep everything.",
        mood: "smug",
      },
      farewell: "This one's front page with a black border, Detective. Hale read this paper every morning for forty years. Go earn his subscription.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-fm3-sale",
          triggers: ["auction", "sale", "catalogue", "chart", "private", "prague", "market"],
          responses: [
            {
              text: "Eighteen months ago a 'seventeenth-century harbor chart, exceptional provenance' moved by private treaty — and the plate photograph is Veilport's own coastline, Detective, I'd know that headland in my sleep. The buyer was a phone number. The seller was 'a private collection.' And the Ashford Bequest hung in its cases the whole time, smiling. Either miracles duplicate maps, or somebody's been swapping the city's memory for copies. The catalogue's flagged on my desk. Take it.",
              mood: "smug",
            },
          ],
        },
        {
          id: "t-fm3-volk",
          triggers: ["volk", "curator", "miriam", "museum", "roof", "budget"],
          responses: [
            {
              text: "Volk, Miriam — thirty years, unimpeachable, married to the building. Here's what the arts pages won't tell you: that museum's maintenance budget has been cut five straight years, and yet — new climate systems in the map room, two conservation hires, the Flemish-room roof finally fixed. I asked the bursar where the money came from. 'Anonymous benefaction.' Museums don't get anonymous benefactions in five figures annually, Detective. They get laundering with a donor plaque.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-fm3-callas",
          triggers: ["callas", "bram", "collector", "donor"],
          responses: [
            {
              text: "Callas wants everything loudly, which is exactly why I like him less for this. Men who bid nine hundred thousand at auction don't swing bookends — they hire lawyers and wait for museums to go broke. Besides, my society stringer had him in the candlelit boardroom all through the blackout, holding forth about Margaux. Twelve witnesses and a wine bore's alibi. Airtight and insufferable.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-fm3-hale",
          triggers: ["hale", "edwin", "victim", "archivist"],
          responses: [
            {
              text: "Hale called the city desk once in thirty years — to correct our 1897 lighthouse feature. Stayed on the line forty minutes and was right about all of it. A man like that finds a wrong thing in his own archive, Detective, he doesn't call a journalist. He gives the institution one chance to fix itself. I'd bet the front page that's exactly what got him killed — the courtesy.",
              mood: "sad",
            },
          ],
        },
      ],
      presses: [],
      fallbacks: {
        neutral: ["Names and paper, Detective — my two food groups.", "Ask me about a person. I keep files the morgue would envy."],
        nervous: ["Hm?"],
        angry: ["Off the record, then."],
      },
    },
  ],

  timelineTruth: [
    { time: "3 years ago", label: "The first Ashford original is sold to Prague; a forgery takes its case. Eight more will follow. The roof gets fixed." },
    { time: "Last Thursday", label: "Hale, at The Blue Hour: 'The thief is the other guard.'" },
    { time: "Mon 5:40 PM", label: "Hale calls an authentication service — appointment Wednesday. The clock is now running for two people." },
    { time: "Mon 8:50 PM", label: "Hale calls Volk's office: titanium white, Folio VII. Morning, or the board." },
    { time: "Mon 8:55 PM", label: "They argue in the archive. Tessa Aoki, hidden in the stacks, hears 'the Prague buyer.'" },
    { time: "Mon 9:05 PM", label: "Hale signs his 'visitor' out of the archive. He returns to the map room to work. He believes he has until morning." },
    { time: "Mon 9:12 PM", label: "Frame 16: a figure at the maintenance panel. Tessa shoots toward the light." },
    { time: "Mon 9:13 PM", label: "The main breaker opens — key set C-1. One minute later the storm obligingly takes the street." },
    { time: "Mon ~9:20 PM", label: "In the dark: the bronze bookend, from behind. The astrolabe stand is toppled over the body. Folio VII leaves its case." },
    { time: "Mon 9:34 PM", label: "A woman with a flat case flags Medallion 7-7-4, two streets away. 'Storm's good cover.'" },
    { time: "Mon 9:52 PM", label: "The breaker closes. The lights return to a museum with one fewer conscience." },
    { time: "Mon 10:05 PM", label: "Pike finds him. The log's 9:15 entry is already a lie." },
  ],

  solution: {
    culpritId: "volk",
    motiveId: "forgery",
    methodSummary:
      "A blackout manufactured with the curator's master key, a bronze bookend swung in the dark, an astrolabe toppled to stage an accident — and Folio VII spirited to a storage unit rented in a false name.",
    keyEvidence: ["uv-analysis", "breaker-log", "lab-bookend", "prague-letters"],
    explanation: [
      "The museum was robbed years before anyone died in it. That is the whole shape of this case: the murder was only the theft finally defending itself.",
      "For three years, Dr. Miriam Volk sold the city's memory to Prague, one folio at a time — nine originals gone, nine loving forgeries hung in their cases, and the proceeds laundered home as 'anonymous benefactions' that fixed the roof and paid the conservators. She robbed the collection to save the institution, and called it stewardship.",
      "Then Edwin Hale, re-cataloguing the bequest with a loupe and a lifetime of knowing better, found titanium white in a 'seventeenth-century' cartouche — a pigment born in 1921. He checked two more folios. Both wrong. And being the museum's conscience, he did the conscientious, courteous, fatal thing: he gave her until morning.",
      "She spent his courtesy on logistics. At 9:13 PM, key set C-1 — the curator's own master — opened the maintenance panel and pulled the main breaker, one minute before the storm obligingly took the street and gave the dark an alibi. A hidden doctoral student photographed the keyring in the doorway; frame sixteen, one minute to midnight for three centuries of provenance.",
      "In the manufactured blackout she took the bronze bookend from the reference shelf — wearing, by thirty years of habit, the museum's own conservation gloves — and struck him from behind. Then she staged the storm's verdict: the astrolabe stand toppled over a man already gone, an accident arranged in the dark by someone who had spent her life arranging objects to be believed.",
      "But institutions notice misfiled things. The bookend went back a shelf wrong, wiped clean everywhere except the hinge-seam that kept Hale's blood. The stand fell east while the wound faced west. And Folio VII — the one original whose replacement forgery wasn't finished — rode across the city on a killer's knees to a unit rented as 'M. Weiss,' past a taxi driver who writes everything down. 'Storm's good cover,' she told him. It covered nothing.",
      "Callas's hunger was loud, lawyered, and candlelit in front of twelve witnesses. Tessa's crime was a camera. Pike's was a boxing match. The lie that mattered wore conservation gloves, spoke of the museum as 'we' — and murdered the only other person who loved those charts for free.",
      "He gave her until morning, Detective. She made sure morning came for the record instead. It did. The record outlives the embarrassment — he wrote it hard enough to emboss three pages, and it held.",
    ],
  },

  epilogue: [
    "Dr. Miriam Volk was arrested in the map room, among the cases. She asked to be allowed to close the cabinets first, and did so perfectly.",
    "Folio VII went home under police escort. Six of the nine sold originals have since been traced through the Prague correspondence; lawyers in three countries are aging rapidly.",
    "Tessa Aoki received a formal reprimand, a legal caution — and, by unanimous board vote, the museum's first Hale Fellowship, with unrestricted supervised access to the Ashford Bequest. Her thesis is dedicated to E.H.",
    "Oren Pike still works nights. There is no radio in the loading bay. There is, on the map room's reference shelf, a small brass plate beneath a pair of bronze bookends: THE RECORD OUTLIVES THE EMBARRASSMENT.",
  ],

  rewards: { xp: 320, unlockId: "astrolabe" },
};
