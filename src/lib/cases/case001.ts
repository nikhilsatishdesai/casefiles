import type { CaseDef } from "@/lib/engine/types";

/**
 * EPISODE 1 — THE GLASS SONATA
 *
 * Truth of the case (never shown directly to the player):
 * Isabelle Verne, concert pianist, announced her farewell concert and her
 * move to Vienna. Her manager of eleven years, Charlotte Meer, had been
 * quietly draining the Verne Trust through a shell company. Isabelle found
 * the discrepancies and booked a forensic audit for the morning after the
 * concert. On the night before, Charlotte laced Isabelle's honey-lemon
 * throat tea with digoxin taken from her mother's prescription, delivered
 * the thermos to the green room at 10:14 PM using a staff master key card,
 * and left through the service corridor — caught once, at 10:12 PM, on the
 * corridor camera. Isabelle drank the tea during her final rehearsal and
 * died at the piano shortly after 11:30 PM.
 */

export const CASE_001: CaseDef = {
  id: "glass-sonata",
  number: 1,
  title: "The Glass Sonata",
  hook: "The city's greatest pianist dies at her piano, twelve hours before her farewell.",
  difficulty: 1,
  weather: { kind: "rain", intensity: 0.7 },
  timeOfDay: "night",

  newspaper: {
    date: "Thursday Edition",
    headline: "ISABELLE VERNE DEAD AT THE MERIDIAN",
    subhead: "Pianist found at her instrument on the eve of her farewell concert. Police withhold cause of death.",
    body: [
      "Isabelle Verne, 34, the pianist whose 'Glass Sonata' recordings carried Veilport's name into every concert hall in Europe, was found dead late last night in the Grand Ballroom of the Hotel Meridian.",
      "Verne had been rehearsing alone ahead of tonight's sold-out farewell performance — her last before an announced move to Vienna. A hotel porter discovered her shortly before midnight, slumped over the keys of the ballroom's Bösendorfer.",
      "Precinct Seven has sealed the ballroom and declined to state a cause of death. 'We are treating the circumstances as unexplained,' said Captain Mara Voss. 'Detectives are on scene.'",
      "Verne leaves behind a city that loved her, a concert that will never be played, and — as of press time — more questions than answers.",
    ],
    sidebar: {
      title: "WEATHER",
      body: "Rain continuing through the night. Harbor fog by morning. Umbrella weather, Veilport — and keep your collar up.",
    },
  },

  briefing: {
    officerId: "voss",
    lines: [
      "Detective. Isabelle Verne — yes, that Isabelle Verne — dead at her piano in the Meridian ballroom, eleven forty last night.",
      "House doctor called it heart failure. She was thirty-four and swam every morning, so forgive me if I'm not signing that.",
      "Rook has the body at the morgue. Reyes is processing the scene. The hotel is holding four people who were close to her last night — and every one of them says they loved her.",
      "The concert was tonight. The whole city is watching us. Work the scene, work the people, and bring me something I can stand behind.",
    ],
  },

  victim: {
    name: "Isabelle Verne",
    role: "Concert pianist, 34",
    portrait: {
      skin: "#e8c0a4",
      hair: "#26201c",
      hairStyle: "long",
      accent: "#8b7cc8",
      outfit: "dress",
      age: "young",
    },
    bio: "Veilport's brightest export. Announced three weeks ago that tonight's concert would be her last before moving to Vienna. Practiced alone every night from ten until midnight — everyone who knew her knew that.",
    foundAt: "hotel",
    initialFinding: "Found at 11:40 PM slumped at the ballroom piano. No visible wounds. House doctor suggested cardiac arrest.",
  },

  motives: [
    { id: "jealousy", label: "Professional jealousy — removing a rival" },
    { id: "betrayal", label: "Wounded devotion — punished for leaving" },
    { id: "embezzlement", label: "Concealment — she was about to expose a theft" },
    { id: "inheritance", label: "Money — profiting from her estate" },
    { id: "passion", label: "A love affair gone wrong" },
  ],

  /* ------------------------------------------------------------------ */
  /* Locations                                                           */
  /* ------------------------------------------------------------------ */

  locations: [
    {
      locationId: "hotel",
      sublabel: "Grand Ballroom & Green Room",
      arrivalText:
        "The Meridian's ballroom is a held breath. Chandeliers dimmed to embers, chairs in perfect rows for a concert that will never begin. Rain streaks the tall windows. The piano waits under a single work light.",
      peopleHere: ["raymond"],
      hotspots: [
        {
          id: "piano",
          label: "The Bösendorfer",
          x: 46,
          y: 58,
          description:
            "The keys still carry the ghost of her hands. The fallboard is up. A pencil rests in the crease of the sheet music, mid-annotation — she stopped playing all at once, not gradually.",
          evidenceId: "photo-scene",
        },
        {
          id: "thermos",
          label: "Thermos on the piano lid",
          x: 55,
          y: 50,
          description:
            "A steel thermos, still faintly warm when the porter found her. Honey-lemon tea — her throat ritual before every performance. Half drunk. Better let Reyes have this.",
          evidenceId: "thermos",
        },
        {
          id: "sheetmusic",
          label: "Sheet music",
          x: 42,
          y: 48,
          description:
            "The Glass Sonata, her own hand-copied score. In the top margin, in pencil, dated yesterday: 'After tonight — free.' She underlined 'free' twice.",
          evidenceId: "sheet-music",
        },
        {
          id: "greenroom-door",
          label: "Green room door",
          x: 78,
          y: 44,
          description:
            "The performers' green room, off the ballroom's east wall. Electronic lock, staff key cards only. Her coat hangs inside; a kettle, cups, and a dressing mirror ringed in warm bulbs. The thermos would have been prepared or delivered here.",
          flavor: true,
        },
        {
          id: "concierge-desk",
          label: "Concierge desk",
          x: 14,
          y: 62,
          description:
            "Raymond Aldous's marble kingdom. The key card terminal behind the desk logs every staff-card use in the building. You have the authority to pull last night's record.",
          evidenceId: "keycard-log",
        },
        {
          id: "security-room",
          label: "Security office",
          x: 8,
          y: 40,
          description:
            "A wall of monitors, one chair, cold coffee. The service corridor camera covers the only unwatched route to the green room. You scrub back through last night's tape.",
          evidenceId: "cctv-still",
        },
        {
          id: "window",
          label: "Rain-streaked window",
          x: 90,
          y: 30,
          description:
            "Twelve floors of the Financial District glitter through the rain. Somewhere out there, someone slept soundly last night. You intend to change that.",
          flavor: true,
        },
        {
          id: "note-basket",
          label: "Fan letters basket",
          x: 26,
          y: 66,
          description:
            "A wicker basket of admirer's letters, delivered to the green room daily. Among the perfume and praise: one unsigned card in a fast, furious hand. It reads like a threat.",
          evidenceId: "viktor-note",
        },
      ],
    },
    {
      locationId: "morgue",
      sublabel: "Examination Room 2",
      arrivalText:
        "The City Morgue hums with refrigeration and radio jazz turned low. Dr. Rook stands over the table, kettle steaming behind him, glasses pushed up into his white hair.",
      peopleHere: ["rook"],
      hotspots: [
        {
          id: "autopsy-file",
          label: "Autopsy report",
          x: 70,
          y: 55,
          description:
            "Rook's findings, typed and signed. Cause of death is not what the house doctor guessed.",
          evidenceId: "autopsy",
        },
        {
          id: "kettle",
          label: "Rook's kettle",
          x: 88,
          y: 40,
          description:
            "'Assam. The dead prefer it,' Rook says without looking up. 'And the living detectives, in my experience, need it.'",
          flavor: true,
        },
      ],
    },
    {
      locationId: "precinct",
      sublabel: "Precinct Seven — Detectives' Floor",
      arrivalText:
        "Precinct Seven at night: typewriter percussion, the radiator's complaint, rain on the tall windows. Your desk lamp is the warmest light on the floor. Nadia Reyes has claimed the light table in the lab annex.",
      peopleHere: ["reyes"],
      hotspots: [
        {
          id: "records-desk",
          label: "Records desk",
          x: 20,
          y: 60,
          description:
            "Warrants and phone company subpoenas move fast when the whole city is watching. Isabelle Verne's phone records for her final week land on your desk within the hour.",
          evidenceId: "phone-records",
        },
        {
          id: "lab-table",
          label: "Forensics light table",
          x: 74,
          y: 52,
          description:
            "Reyes's domain — evidence bags in ranked rows, each tagged in her small, exact hand. The thermos results are clipped to the board.",
          evidenceId: "lab-thermos",
          requiresEvidence: ["thermos"],
        },
        {
          id: "pharmacy-check",
          label: "Pharmacy registry terminal",
          x: 50,
          y: 42,
          description:
            "Every controlled prescription in the city, indexed. You run 'digoxin' against every name in the case file — and one household lights up.",
          evidenceId: "pharmacy-record",
          requiresEvidence: ["autopsy", "lab-thermos"],
        },
        {
          id: "your-desk",
          label: "Your desk",
          x: 40,
          y: 70,
          description:
            "Third desk back, under the clock that runs four minutes slow. A cold coffee, a city map, and a photograph of the pier you still mean to fish from someday.",
          flavor: true,
        },
      ],
    },
    {
      locationId: "bluehour",
      sublabel: "The Blue Hour",
      arrivalText:
        "Sal's place breathes vinyl crackle and low amber light. A saxophone record turns behind the bar. Viktor Casta sits at the end of the counter, coat collar up, a glass he isn't drinking in front of him.",
      peopleHere: ["sal", "viktor"],
      hotspots: [
        {
          id: "bar-tab",
          label: "Last night's tabs",
          x: 30,
          y: 55,
          description:
            "Sal keeps paper tabs on a brass spike, timestamped in his own shorthand. Last night's spike is right there, and Sal slides it across without being asked.",
          evidenceId: "bar-tab",
        },
        {
          id: "jukebox",
          label: "The record player",
          x: 82,
          y: 48,
          description:
            "A Verne recording, as it happens — the Glass Sonata, second movement. Sal put it on when he heard. The whole bar has been quieter since.",
          flavor: true,
        },
      ],
    },
    {
      locationId: "financial",
      sublabel: "Meer Artist Management, 14th Floor",
      arrivalText:
        "Charlotte Meer's office is all glass and dove-gray: awards on the shelves, Isabelle's face on every wall. Eleven years of two careers braided into one. The rain writes long lines down the window behind her desk.",
      peopleHere: ["charlotte"],
      locked: {
        untilEvidence: "phone-records",
        note: "Meer Artist Management is closed to visitors. You'll need investigative grounds — something that ties this office to Isabelle's final night.",
      },
      hotspots: [
        {
          id: "filing",
          label: "Locked filing drawer",
          x: 70,
          y: 58,
          description:
            "The drawer marked VERNE TRUST gives up eleven years of statements. Most are immaculate. The last three years are not — a steady bleed of payments to a company you've never heard of.",
          evidenceId: "bank-records",
        },
        {
          id: "desk-calendar",
          label: "Desk calendar",
          x: 40,
          y: 62,
          description:
            "Tomorrow's date — this morning, now — circled hard enough to tear the paper: 'I.V. + auditor, 9:00.' Under it, a letter confirming the appointment, addressed to Isabelle, copied to no one.",
          evidenceId: "audit-letter",
        },
        {
          id: "coat-rack",
          label: "Coat rack",
          x: 12,
          y: 44,
          description:
            "A dove-gray wool coat, still damp at the shoulders from last night's rain. Elegant. Distinctive. Familiar, somehow, in a way that itches at you.",
          flavor: true,
        },
        {
          id: "awards",
          label: "Award shelf",
          x: 88,
          y: 36,
          description:
            "Manager of the Year, twice. Every framed photo is the two of them — stage doors, signings, airports. In the earliest one they are both laughing. In the latest, only Isabelle is.",
          flavor: true,
        },
      ],
    },
    {
      locationId: "suburbs",
      sublabel: "Hartwell House, Rowan Heights",
      arrivalText:
        "Dame Ottilie Hartwell's parlor smells of lilies and old money. A concert poster from Isabelle's debut — HARTWELL FOUNDATION PRESENTS — hangs over the fireplace in a museum-quality frame.",
      peopleHere: ["ottilie"],
      hotspots: [
        {
          id: "writing-desk",
          label: "Writing desk",
          x: 68,
          y: 56,
          description:
            "Heavy cream stationery, a fountain pen, and — unsent, unfinished, unhidden — a letter to Isabelle that begins with love and curdles into something colder by the second page.",
          evidenceId: "ottilie-letter",
        },
        {
          id: "debut-poster",
          label: "Debut concert poster",
          x: 30,
          y: 38,
          description:
            "Isabelle at nineteen, all nerves and borrowed gown. Ottilie found her, funded her, built her. Patrons write checks; this one built a cathedral and called it a career.",
          flavor: true,
        },
      ],
    },
    {
      locationId: "station",
      sublabel: "Taxi Rank, Grand Veilport Station",
      arrivalText:
        "Under the station's iron canopy, Yusuf Demir polishes the mirror of Medallion 7-7-4 while the last trains sigh in and out. He nods as you approach — he's been expecting somebody like you.",
      peopleHere: ["demir"],
      hotspots: [
        {
          id: "logbook",
          label: "Demir's logbook",
          x: 55,
          y: 58,
          description:
            "Every fare, every address, every time — in handwriting neater than most warrants. Last night's page is already flagged with a matchstick. 'I thought you might come,' Demir says.",
          evidenceId: "taxi-log",
        },
      ],
    },
    {
      locationId: "ledger",
      sublabel: "The Veilport Ledger — City Desk",
      arrivalText:
        "The Ledger's newsroom is a weather system of paper and cigarette smoke. Felix Marlowe has his feet on the desk and tomorrow's front page half-written. 'Detective,' he grins. 'I was hoping it'd be you.'",
      peopleHere: ["marlowe"],
      hotspots: [
        {
          id: "clippings",
          label: "Marlowe's clipping file",
          x: 70,
          y: 52,
          description:
            "VERNE, ISABELLE — three inches of clippings. Triumphs, mostly. One business-page brief from last spring catches your eye: 'Verne cancels European tour, citing management restructuring.' Restructuring. Interesting word.",
          flavor: true,
        },
      ],
    },
  ],

  /* ------------------------------------------------------------------ */
  /* Evidence                                                            */
  /* ------------------------------------------------------------------ */

  evidence: [
    {
      id: "photo-scene",
      name: "Crime scene photograph",
      type: "photo",
      icon: "camera",
      foundAt: "hotel",
      summary: "Isabelle at the piano, mid-phrase. No struggle, no wound, no warning.",
      detail:
        "She fell forward onto the keys. The pencil is still in her right hand. Whatever took her, took her between one bar of music and the next — fast, quiet, and from the inside.",
      document: {
        kind: "report",
        title: "SCENE PHOTOGRAPH — GRAND BALLROOM",
        meta: "VPD FORENSICS · CASE 26-0114 · FRAME 04",
        body: "Subject found seated at piano, collapsed forward.\nNo defensive marks. No disturbance to room.\nFallboard up, work light on, doors secured.\nBeverage container (steel thermos) on piano lid — TAGGED.\nTime of discovery: 23:40, by hotel porter.",
      },
    },
    {
      id: "thermos",
      name: "Honey-lemon thermos",
      type: "physical",
      icon: "vial",
      foundAt: "hotel",
      summary: "Her pre-concert throat tea. Half drunk. Still faintly warm at discovery.",
      detail:
        "Everyone who knew Isabelle knew the ritual: honey-lemon tea in this same steel thermos before every performance, prepared and waiting in the green room. Whoever filled it knew the ritual too.",
    },
    {
      id: "sheet-music",
      name: "Annotated score",
      type: "document",
      icon: "letter",
      foundAt: "hotel",
      summary: "'After tonight — free.' Underlined twice, dated yesterday.",
      detail:
        "Her own hand-copied Glass Sonata. The margin note isn't despairing — the hand is quick, light, almost joyful. She was leaving something behind, and she couldn't wait.",
      document: {
        kind: "note",
        title: "MARGINALIA — VERNE'S SCORE",
        meta: "Pencil, victim's handwriting, dated day of death",
        body: "\"After tonight — free.\"\n\nThe word 'free' underlined twice.\nBeneath it, lighter: \"9:00 — bring everything.\"",
      },
    },
    {
      id: "viktor-note",
      name: "Unsigned threat",
      type: "document",
      icon: "letter",
      foundAt: "hotel",
      summary: "'You never deserved the stage. Tonight it takes itself back.'",
      detail:
        "Furious, fast handwriting on a concert-hall comp card. No signature. Delivered with the fan mail sometime yesterday. The phrase 'tonight it takes itself back' reads very differently with a body in the room.",
      document: {
        kind: "letter",
        title: "UNSIGNED CARD — FAN MAIL BASKET",
        meta: "Recovered from green room deliveries",
        body: "\"You never deserved the stage.\nYou were handed what others bled for.\nEnjoy your farewell.\nTonight the stage takes itself back.\"",
      },
    },
    {
      id: "autopsy",
      name: "Autopsy report",
      type: "forensic",
      icon: "folder",
      foundAt: "morgue",
      summary: "Not a heart attack. Acute digoxin poisoning — ingested roughly an hour before death.",
      detail:
        "Rook is unambiguous: a healthy heart, stopped by a massive dose of digoxin — a cardiac medication, lethal in quantity, nearly tasteless in sweet tea. Ingestion window centers on 10:30 PM. This was measured, prepared, and personal.",
      document: {
        kind: "autopsy",
        title: "POST-MORTEM EXAMINATION — VERNE, ISABELLE",
        meta: "OFFICE OF THE CHIEF MEDICAL EXAMINER · DR. E. ROOK",
        body: "Cause of death: acute cardiac glycoside toxicity (digoxin).\nEstimated dose: 40–60x therapeutic. Unsurvivable.\nRoute: oral. Gastric contents: tea, honey, lemon.\nIngestion window: 22:15 — 22:45.\nDeath: approx. 23:30.\nCardiac tissue: healthy. No natural disease.\nNo injection sites. No defensive injuries.\n\nRemark (E.R.): 'Digoxin hides beautifully in anything sweet.\nWhoever chose it knew her habits — and had access to the drug.'",
      },
      keyEvidence: false,
    },
    {
      id: "lab-thermos",
      name: "Thermos lab results",
      type: "forensic",
      icon: "print",
      foundAt: "precinct",
      summary: "Digoxin in the tea. Isabelle's prints — and one partial that isn't hers, on the inner lid.",
      detail:
        "Reyes found digoxin concentrated in the tea itself, meaning it was dissolved when the thermos was filled — not added to her cup. The inner lid carries a single foreign partial print. Whoever poured this, poisoned it.",
      document: {
        kind: "report",
        title: "LAB ANALYSIS — ITEM 02 (THERMOS)",
        meta: "VPD FORENSICS · N. REYES",
        body: "Contents: tea (honey, lemon). Digoxin present, uniformly dissolved.\nConcentration: consistent with dissolution at time of preparation.\nExterior prints: victim's.\nInner lid: ONE (1) foreign partial print, ulnar loop, left thumb.\nRun against staff exclusion set: NO MATCH to hotel staff.\nNote (N.R.): 'Get me a comparison print and I'll get you a name.'",
      },
      keyEvidence: true,
    },
    {
      id: "cctv-still",
      name: "Service corridor CCTV",
      type: "photo",
      icon: "tape",
      foundAt: "hotel",
      summary: "10:12 PM — a figure in a dove-gray coat enters the corridor to the green room.",
      detail:
        "The only unwatched route to the green room, watched after all. The figure keeps their face from the lens with a practiced tilt — but the coat is distinctive: long, pale gray, expensive. They return the same way at 10:19, carrying nothing.",
      document: {
        kind: "cctv",
        title: "CCTV EXPORT — SERVICE CORRIDOR CAM 3",
        meta: "HOTEL MERIDIAN SECURITY · TIMESTAMPED",
        body: "22:12:06 — Figure enters corridor from loading stair.\nLong pale gray coat. Face averted from camera.\nCarrying small insulated container.\n22:14:11 — Green room door opens (off-frame audio: lock chime).\n22:19:40 — Figure exits corridor. Hands empty.\nNo other corridor traffic 21:00–24:00.",
      },
      keyEvidence: true,
    },
    {
      id: "keycard-log",
      name: "Key card access log",
      type: "record",
      icon: "key",
      foundAt: "hotel",
      summary: "Green room opened 10:14 PM by staff master card M-11 — signed out that afternoon to 'C. Meer.'",
      detail:
        "Staff master cards must be signed for at the concierge desk. Card M-11 was issued at 3:05 PM against the events register — signature line reads 'C. Meer, mgr., for soundcheck access.' It was never returned.",
      document: {
        kind: "report",
        title: "STAFF ACCESS LOG — HOTEL MERIDIAN",
        meta: "CONCIERGE REGISTER + ELECTRONIC LOCK RECORD",
        body: "15:05 — Master card M-11 issued. Register signature: 'C. Meer, mgr. — soundcheck access.'\n...\n22:14 — GREEN ROOM: opened with card M-11.\n22:18 — GREEN ROOM: door secured.\n—\nCard M-11: NOT RETURNED.",
      },
      keyEvidence: true,
    },
    {
      id: "phone-records",
      name: "Isabelle's phone records",
      type: "record",
      icon: "phone",
      foundAt: "precinct",
      summary: "9:52 PM: four-minute call to Charlotte Meer. 9:58 PM: text to an auditor — 'See you at 9. Bring everything.'",
      detail:
        "Her last call, forty minutes before the poisoned tea was delivered, was to her manager. Her last text was to Halden Forensic Accounting. She wasn't just leaving the stage. She was opening the books.",
      document: {
        kind: "phone",
        title: "SUBSCRIBER RECORD — VERNE, I.",
        meta: "VEILPORT TELEPHONE EXCHANGE · FINAL 24 HOURS",
        body: "14:31 — CALL — Hartwell residence — 11 min\n18:02 — CALL — Hotel Meridian front desk — 2 min\n21:52 — CALL — MEER, C. (mobile) — 4 min\n21:58 — TEXT — HALDEN FORENSIC ACCOUNTING:\n  'See you at 9. Bring everything.'\n22:40 — (no further activity)",
      },
      keyEvidence: true,
    },
    {
      id: "bank-records",
      name: "Verne Trust statements",
      type: "record",
      icon: "bank",
      foundAt: "financial",
      summary: "Three years of payments to 'Aria Artist Services' — a shell with one signatory: Charlotte Meer.",
      detail:
        "€612,000 over three years, invoiced as 'European booking retainers' to a company that has no office, no staff, and no clients. The incorporation papers are in the same drawer. The sole signatory is the woman sitting across the room.",
      document: {
        kind: "bank",
        title: "VERNE TRUST — STATEMENT EXTRACT",
        meta: "MERIDIAN PRIVATE BANK · 36 MONTHS",
        body: "ARIA ARTIST SERVICES — 'European retainer' — recurring:\n  Year 1: €148,000\n  Year 2: €204,000\n  Year 3: €260,000\nTOTAL: €612,000\n\nARIA ARTIST SERVICES — incorporation extract:\n  Registered agent: (nominee)\n  Sole account signatory: MEER, CHARLOTTE",
      },
      keyEvidence: true,
    },
    {
      id: "audit-letter",
      name: "Audit appointment letter",
      type: "document",
      icon: "letter",
      foundAt: "financial",
      summary: "Forensic audit of the Verne Trust — scheduled for 9:00 AM the morning after her death.",
      detail:
        "Halden Forensic Accounting confirms 'a comprehensive review of trust disbursements, at Ms. Verne's request, prior to her relocation.' The copy on Charlotte's desk is creased from being folded and unfolded many, many times.",
      document: {
        kind: "letter",
        title: "HALDEN FORENSIC ACCOUNTING",
        meta: "Re: Verne Trust — Engagement Confirmation",
        body: "Dear Ms. Verne,\n\nConfirming our engagement to conduct a full forensic review of Verne Trust disbursements (36 months), commencing 9:00 AM Friday at our offices.\n\nPer your instruction, management has not been copied on this correspondence.\n\nYours,\nR. Halden, CFE",
      },
    },
    {
      id: "ottilie-letter",
      name: "Ottilie's unsent letter",
      type: "document",
      icon: "letter",
      foundAt: "suburbs",
      summary: "A patron's love letter that turns bitter: 'You were my life's work, and you are leaving it.'",
      detail:
        "Two pages. The first is grief dressed as pride. The second is colder: 'A cathedral does not get to walk away from its architect.' It was never sent. Bitterness on paper is not poison in a thermos — but it is motive, written in fountain pen.",
      document: {
        kind: "letter",
        title: "UNSENT LETTER — HARTWELL TO VERNE",
        meta: "Recovered from writing desk, Hartwell House",
        body: "My dearest Isabelle,\n\nI have decided to be proud of you, since you have left me no other dignified option...\n\n...You were my life's work, and you are leaving it. A cathedral does not get to walk away from its architect. But then, I suppose I always knew you were never mine — only borrowed from the music.\n\n(unsigned, unsent)",
      },
    },
    {
      id: "taxi-log",
      name: "Demir's fare log",
      type: "record",
      icon: "ticket",
      foundAt: "station",
      summary: "10:47 PM: Dame Hartwell, museum gala → Rowan Heights, arrived 11:10 PM.",
      detail:
        "Demir's handwriting, contemporaneous, unimpeachable: he collected Ottilie Hartwell from the museum gala at 10:47 and delivered her home at 11:10. During the poisoning window she was giving a toast in front of two hundred witnesses.",
      document: {
        kind: "ledger",
        title: "MEDALLION 7-7-4 — NIGHT LOG",
        meta: "Y. DEMIR · YESTERDAY",
        body: "21:14 — Station → Financial Dist. (2 pax)\n22:47 — VEILPORT MUSEUM → ROWAN HEIGHTS\n  Fare: Dame O. Hartwell (regular)\n  'Gala toast ran long,' she said. Tipped well. Sad about something.\n23:10 — Drop: Hartwell House.\n23:36 — Station rank. Rain heavier.",
      },
    },
    {
      id: "bar-tab",
      name: "Blue Hour bar tab",
      type: "record",
      icon: "glass",
      foundAt: "bluehour",
      summary: "Viktor Casta: at Sal's bar from 9:15 PM to just past 11:00, in full view.",
      detail:
        "Sal's spike doesn't lie: Viktor's tab opens at 9:15, orders at 9:40, 10:05, 10:30, 10:55 — closed at 11:05. Sal adds, unprompted: 'He watched the door all night like he was hoping someone would walk in. Nobody did.'",
      document: {
        kind: "ledger",
        title: "TAB — 'V.C.' — THE BLUE HOUR",
        meta: "Sal's spike, yesterday night",
        body: "21:15 — open. rye, neat.\n21:40 — rye.\n22:05 — rye. (talking about her. again.)\n22:30 — coffee. cut him off.\n22:55 — coffee.\n23:05 — closed. walked, not driving. good.",
      },
    },
    {
      id: "pharmacy-record",
      name: "Pharmacy registry hit",
      type: "record",
      icon: "pill",
      foundAt: "precinct",
      summary: "Digoxin, 60 tablets, dispensed two weeks ago — to Edith Meer. Collected by her daughter, Charlotte.",
      detail:
        "Edith Meer, 81, heart patient, Rowan Heights. Her digoxin refill was collected by her daughter fourteen days ago. A welfare check finds Edith healthy — and her new bottle short by nearly forty tablets. Rook's math says forty is more than enough.",
      document: {
        kind: "report",
        title: "CONTROLLED PRESCRIPTION REGISTRY",
        meta: "QUERY: DIGOXIN × CASE NAMES",
        body: "MEER, EDITH (81) — digoxin 0.25mg × 60\nDispensed: 14 days ago, Rowan Pharmacy.\nCollected by: MEER, CHARLOTTE (daughter, on file).\n\nWelfare check addendum (Ofc. Lindqvist):\nPatient well. Current bottle counted: 23 of 60.\nPatient states daughter 'manages all my medicines.'",
      },
      keyEvidence: true,
    },
    {
      id: "raymond-statement",
      name: "Raymond's revised statement",
      type: "statement",
      icon: "badge",
      foundAt: "interview",
      summary: "The concierge finally admits it: a woman in a dove-gray coat in the service corridor, around ten past ten.",
      detail:
        "Once his own little wine-cellar sideline stopped mattering, Raymond's memory improved remarkably: a tall woman, pale gray coat, moving 'like she belonged there,' entering the service corridor at roughly 10:10 PM. He'd seen the coat before — on Ms. Verne's manager.",
      document: {
        kind: "report",
        title: "SUPPLEMENTARY STATEMENT — R. ALDOUS",
        meta: "TAKEN ON SCENE · WITNESSED",
        body: "'Around ten past ten I was near the loading stair — never mind why — and a woman went past into the service corridor. Long gray coat, moved quick, knew the way.\n\nI've seen that coat at every soundcheck for three years. It's Ms. Meer's. I didn't say before because of... the wine thing. I'm saying it now.'",
      },
    },
  ],

  /* ------------------------------------------------------------------ */
  /* Statements                                                          */
  /* ------------------------------------------------------------------ */

  statements: [
    {
      id: "s-cm-left",
      suspectId: "charlotte",
      text: "“I left the Meridian at half past nine and went straight home. I never went back.”",
    },
    {
      id: "s-cm-money",
      suspectId: "charlotte",
      text: "“I book concerts. The trust is handled by the bank — I've never had signing authority over Isabelle's money.”",
    },
    {
      id: "s-cm-tea",
      suspectId: "charlotte",
      text: "“Her tea? The green room staff saw to it. That ritual was hers alone — I never touched it.”",
    },
    {
      id: "s-vc-note",
      suspectId: "viktor",
      text: "“Threaten her? I never wrote to her. Not once in ten years.”",
    },
    {
      id: "s-ra-corridor",
      suspectId: "raymond",
      text: "“The service corridor was empty all night. Nobody goes back there after nine. Nobody.”",
    },
    {
      id: "s-oh-gala",
      suspectId: "ottilie",
      text: "“I was at the museum gala until nearly eleven, and a taxi took me home. Hundreds of people saw me.”",
    },
  ],

  /* ------------------------------------------------------------------ */
  /* Suspects & witnesses                                                */
  /* ------------------------------------------------------------------ */

  suspects: [
    /* ---------------- CHARLOTTE MEER — the manager (guilty) ---------- */
    {
      id: "charlotte",
      name: "Charlotte Meer",
      role: "Isabelle's manager, 11 years",
      portrait: {
        skin: "#e6bfa0",
        hair: "#8a8378",
        hairStyle: "slick",
        accent: "#b9b2a4",
        outfit: "suit",
        age: "mid",
      },
      presence: "financial",
      personality:
        "Immaculate, controlled, fluent in the language of devotion. Grief worn like tailoring — perfectly fitted, and you cannot tell what is underneath it.",
      demeanor: "Composed. Too composed.",
      alibi: "Claims she left the hotel at 9:30 PM and went straight home.",
      motiveHint: "Eleven years managing a career — and, perhaps, its money.",
      greeting: {
        text: "Detective. Forgive the office — I haven't been able to touch anything of hers yet. Ask me whatever you need. Isabelle was... she was my life's work, and I intend to help you finish yours.",
        mood: "calm",
      },
      farewell: "Find who did this, Detective. Whatever it costs. Whoever it costs.",
      stressThresholds: { nervous: 30, breaking: 75 },
      topics: [
        {
          id: "t-cm-alibi",
          triggers: ["where were you", "last night", "alibi", "9:30", "leave", "left", "whereabouts", "that night", "your evening"],
          responses: [
            {
              text: "I was at the hotel through the afternoon for soundcheck arrangements, and I left at half past nine. Straight home — Isabelle liked her final rehearsals private. I never went back.",
              mood: "calm",
              statementId: "s-cm-left",
            },
            {
              text: "As I said: gone by nine thirty. Home. Alone, before you ask — eleven years of tour schedules are hard on a private life.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-cm-relationship",
          triggers: ["relationship", "close", "friend", "how long", "eleven years", "work together", "manager", "know her"],
          responses: [
            {
              text: "I found her playing weddings in Rowan Heights and I built the rest, room by room, year by year. People say I managed her career. I *was* her career. And she was mine.",
              mood: "sad",
            },
            {
              text: "You don't spend eleven years that close to someone and keep the seams of your lives separate. There were no seams left, Detective.",
              mood: "sad",
            },
          ],
        },
        {
          id: "t-cm-vienna",
          triggers: ["vienna", "leaving", "farewell", "quit", "retire", "moving", "last concert", "europe"],
          responses: [
            {
              text: "Vienna. Yes. She told me three weeks ago, over breakfast, the way you'd mention a change of hairdresser. Eleven years, and I got it between the coffee and the bill.",
              mood: "defensive",
              stress: 8,
            },
            {
              text: "Was I hurt? Of course I was hurt. Managers don't move to Vienna with their artists, Detective. I was being retired without the courtesy of the word.",
              mood: "angry",
              stress: 6,
            },
          ],
        },
        {
          id: "t-cm-money",
          triggers: ["money", "trust", "finances", "accounts", "bank", "payments", "financial", "embezzle", "aria"],
          responses: [
            {
              text: "I book concerts. The trust is handled by the bank — I've never had signing authority over Isabelle's money. You can check, of course.",
              mood: "calm",
              statementId: "s-cm-money",
              stress: 10,
            },
            {
              text: "Detective, artists' finances are boring and mine are more boring still. Shall we return to who might have wanted her dead?",
              mood: "defensive",
              stress: 6,
            },
          ],
        },
        {
          id: "t-cm-audit",
          triggers: ["audit", "auditor", "accountant", "halden", "review", "books", "nine o'clock", "meeting"],
          responses: [
            {
              text: "An audit? Before a relocation there's always paperwork. Routine. I'd have handed over the files myself, gladly — I keep everything.",
              mood: "nervous",
              stress: 14,
            },
            {
              text: "You keep circling the word 'audit' as if it were a knife, Detective. It's bookkeeping. It frightens no one.",
              mood: "defensive",
              stress: 10,
            },
          ],
        },
        {
          id: "t-cm-tea",
          triggers: ["tea", "thermos", "honey", "lemon", "drink", "poison", "digoxin", "ritual"],
          responses: [
            {
              text: "Her tea? The green room staff saw to it. That ritual was hers alone — I never touched it. Honey, lemon, the same steel thermos since her debut. Everyone who loved her knew it.",
              mood: "calm",
              statementId: "s-cm-tea",
              stress: 8,
            },
            {
              text: "If something was in that thermos, then someone used the gentlest thing about her against her. I hope you take that personally, Detective. I do.",
              mood: "sad",
            },
          ],
        },
        {
          id: "t-cm-call",
          triggers: ["call", "phone", "9:52", "spoke", "talked", "rang"],
          responses: [
            {
              text: "She called me around ten to ten, yes. Concert-eve nerves — timings, the encore, whether the hall was too cold. Ordinary things. The last ordinary things.",
              mood: "sad",
              stress: 6,
            },
          ],
        },
        {
          id: "t-cm-viktor",
          triggers: ["viktor", "casta", "rival"],
          responses: [
            {
              text: "Viktor Casta has hated her gorgeously and publicly for a decade. If resentment were lethal at range, he'd have cleared every concert hall in Europe. Look at him hard, Detective.",
              mood: "smug",
            },
          ],
        },
        {
          id: "t-cm-ottilie",
          triggers: ["ottilie", "hartwell", "patron", "dame"],
          responses: [
            {
              text: "Ottilie built Isabelle a pedestal and then couldn't forgive her for stepping off it. Patrons love the way collectors love, Detective. Ownership with better manners.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-cm-raymond",
          triggers: ["raymond", "aldous", "concierge"],
          responses: [
            {
              text: "The concierge? Smiles too much, notices everything, sells half of it. Harmless, I'd have said. But then I'd have said this whole city was harmless, yesterday.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-cm-coat",
          triggers: ["coat", "gray coat", "grey coat", "dove"],
          responses: [
            {
              text: "My coat? Dove gray, yes — I've worn it to every venue for years. Detective, is there a reason my wardrobe is of investigative interest?",
              mood: "nervous",
              stress: 12,
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "cctv-still",
          response: {
            text: "That could be anyone. Half the women at the Meridian own gray... You can't see a face. You cannot possibly see a face. This proves the corridor was used, nothing more.",
            mood: "nervous",
            stress: 20,
          },
          contradictsStatement: "s-cm-left",
        },
        {
          evidenceId: "keycard-log",
          response: {
            text: "I signed for a card at three for the soundcheck, which I told... which is normal. If it was used at ten fourteen then someone took it from my bag. Someone took it. Write that down.",
            mood: "afraid",
            stress: 22,
          },
          contradictsStatement: "s-cm-left",
          unlocksTopics: ["t-cm-coat"],
        },
        {
          evidenceId: "bank-records",
          response: {
            text: "...Aria was — it was structural. Every management company has vehicles like it. She never wanted the details, she never ONCE asked for the details, and now you people crawl through eleven years of my work looking for—  I built her. Whatever moved between our accounts, I had earned ten times over.",
            mood: "angry",
            stress: 25,
          },
          contradictsStatement: "s-cm-money",
        },
        {
          evidenceId: "pharmacy-record",
          response: {
            text: "I collect my mother's prescriptions because I am a good daughter. Count her pills again. Count them AGAIN. This is grotesque — you are building a gallows out of groceries and errands.",
            mood: "afraid",
            stress: 25,
          },
          contradictsStatement: "s-cm-tea",
        },
        {
          evidenceId: "phone-records",
          response: {
            text: "She told you nothing in that call because there was nothing— it was timings, it was the encore—  'Bring everything.' She texted that after speaking to me. After. She already knew, didn't she. She spent four minutes letting me lie to her and she already knew.",
            mood: "afraid",
            stress: 18,
          },
        },
        {
          evidenceId: "raymond-statement",
          response: {
            text: "The concierge. The wine thief, that's my accuser — a man who was robbing the cellar while he claims to have been studying coats. This city is full of gray coats, Detective. Full of them.",
            mood: "angry",
            stress: 15,
          },
          contradictsStatement: "s-cm-left",
        },
      ],
      breakLine: {
        text: "Do you know what she said on that call? 'Whatever the auditor finds, Charlotte, we'll resolve it quietly. I owe you that much.' She OWED me that much. Eleven years, and I was a line item to be resolved quietly... I brought her the tea the way I brought her everything. Every stage, every ovation, every cup. She never once asked what any of it cost me.",
        mood: "afraid",
        stress: 0,
      },
      fallbacks: {
        neutral: [
          "Ask me about Isabelle, Detective. Everything I know about anything is about Isabelle.",
          "I've answered police questions all morning. Be specific and I'll be useful.",
          "I don't follow. In eleven years I've learned to answer only the question that's actually asked.",
        ],
        nervous: [
          "I— forgive me. Rephrase that? The last day has rather disassembled me.",
          "You keep watching my hands, Detective. Ask your question.",
        ],
        angry: [
          "Is this an interview or an ambush? Ask something worth answering.",
          "My lawyer's name is Bellamy Price. Shall I spell it, or is there a real question coming?",
        ],
      },
    },

    /* ---------------- VIKTOR CASTA — the rival ----------------------- */
    {
      id: "viktor",
      name: "Viktor Casta",
      role: "Concert pianist, longtime rival",
      portrait: {
        skin: "#d8a988",
        hair: "#14100e",
        hairStyle: "slick",
        accent: "#5e2c38",
        outfit: "suit",
        beard: true,
        age: "mid",
      },
      presence: "bluehour",
      personality:
        "Brilliant, bitter, theatrical. Has spent ten years being the second-best pianist in Veilport and it has cost him everything gentle.",
      demeanor: "Wounded arrogance, drinking coffee he wishes were rye.",
      alibi: "At The Blue Hour from 9:15 PM to just after 11:00.",
      motiveHint: "A decade in her shadow. Her farewell should have been his dawn.",
      greeting: {
        text: "So the city sends its detective to the bar to collect the jealous rival. How efficient. Sit. Ask your questions — I've been rehearsing the answers all night, the way I rehearse everything I'll never get to perform.",
        mood: "smug",
      },
      farewell: "When you find them — whoever it was — tell them they didn't beat her either. Nobody did. That was the whole problem with her.",
      stressThresholds: { nervous: 35, breaking: 70 },
      topics: [
        {
          id: "t-vc-alibi",
          triggers: ["where were you", "last night", "alibi", "whereabouts", "that night", "blue hour", "bar"],
          responses: [
            {
              text: "Here. This stool, that glass, from a quarter past nine until Sal poured me onto the street after eleven. Ask him — the man logs drinks like a customs office.",
              mood: "calm",
            },
          ],
        },
        {
          id: "t-vc-rivalry",
          triggers: ["rival", "hate", "jealous", "shadow", "second", "career", "compete", "feud"],
          responses: [
            {
              text: "Hate her? I *needed* her. What is a knife without a whetstone? For ten years every review of my work was really a review of the distance between us. Her leaving didn't free me, Detective. It made the distance permanent.",
              mood: "sad",
              stress: 8,
            },
            {
              text: "You want jealousy, and yes, I had it — the good kind, the kind that makes you practice until your hands ache. Not the kind that reaches for... whatever this was.",
              mood: "defensive",
            },
          ],
        },
        {
          id: "t-vc-note",
          triggers: ["note", "letter", "threat", "wrote", "card", "fan mail", "stage takes itself back"],
          responses: [
            {
              text: "Threaten her? I never wrote to her. Not once in ten years. We insulted each other properly — in interviews, like professionals.",
              mood: "defensive",
              statementId: "s-vc-note",
              stress: 10,
            },
          ],
        },
        {
          id: "t-vc-victim",
          triggers: ["isabelle", "verne", "victim", "her playing", "think of her"],
          responses: [
            {
              text: "She played like the instrument owed her money and she'd come to collect. Effortless. Infuriating. I have perfect technique, Detective — perfect — and she had *that*. Ask me who'd want that gone. Everyone who ever shared a stage with her. Starting with me. Ending, apparently, with someone worse.",
              mood: "sad",
            },
          ],
        },
        {
          id: "t-vc-charlotte",
          triggers: ["charlotte", "meer", "manager"],
          responses: [
            {
              text: "The manager. You know what struck me always? Isabelle earned like an empire and lived like a graduate student. Rented flat, ten-year-old car. I used to joke that Meer kept her in a jar. Perhaps I wasn't joking.",
              mood: "neutral",
              stress: 0,
            },
          ],
        },
        {
          id: "t-vc-ottilie",
          triggers: ["ottilie", "hartwell", "patron", "dame"],
          responses: [
            {
              text: "Dame Hartwell once told a reporter that discovering Isabelle was 'the great composition of my life.' People who talk about other people as their compositions worry me, Detective. And I'm the theatrical one.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-vc-vienna",
          triggers: ["vienna", "farewell", "leaving", "retire", "last concert"],
          responses: [
            {
              text: "Her farewell should have been the start of my season. Instead I sat here rehearsing what I'd say if she walked in. 'Good luck in Vienna.' Three words, ten years in the practicing. She never walked in.",
              mood: "sad",
              stress: 6,
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "viktor-note",
          response: {
            text: "...Yes. Fine. Yes, my hand, my venom, three in the morning and a bottle deep. 'The stage takes itself back' — it was RHETORIC, it was a bad metaphor from a bitter man. I posted it before I sobered up and I've been sick about it since I heard. That note is the worst thing I've ever written, Detective, and I include my second symphony.",
            mood: "afraid",
            stress: 20,
          },
          contradictsStatement: "s-vc-note",
        },
        {
          evidenceId: "bar-tab",
          response: {
            text: "There — you see? Sal's spike. From a quarter past nine I was exactly where sad men are supposed to be. Whatever happened in that ballroom, it happened without me.",
            mood: "calm",
            stress: -10,
          },
        },
      ],
      breakLine: {
        text: "You want the whole of it? I loved her. Somewhere under ten years of losing to her, the way you love the north star for proving you're pointed somewhere. I wrote her one letter in my life and it was a threat. That is who I am, Detective. A coward with perfect technique. But I am not this.",
        mood: "sad",
      },
      fallbacks: {
        neutral: [
          "Phrase it like a critic, Detective — precisely, so I can resent it precisely.",
          "Ask me about music or ask me about that night. Everything else is intermission.",
        ],
        nervous: [
          "I don't— say it again. Slower. The coffee hasn't caught up with the rye.",
          "You have a policeman's talent for questions that sound like verdicts.",
        ],
        angry: [
          "I've buried a rival today, Detective. Waste someone else's grief.",
          "No. Next question, and make it a real one.",
        ],
      },
    },

    /* ---------------- RAYMOND ALDOUS — the concierge ------------------ */
    {
      id: "raymond",
      name: "Raymond Aldous",
      role: "Head concierge, Hotel Meridian",
      portrait: {
        skin: "#eac4a6",
        hair: "#3c2e22",
        hairStyle: "short",
        accent: "#7a2c2c",
        outfit: "uniform",
        age: "young",
      },
      presence: "hotel",
      personality:
        "Professionally charming, constitutionally evasive. The kind of man who knows every secret in the building and the market rate for each.",
      demeanor: "Helpful in the way of a man steering you away from something.",
      alibi: "On duty in the lobby all evening — mostly.",
      motiveHint: "None apparent. But he is lying about something, and lies have gravity.",
      greeting: {
        text: "Detective — Raymond Aldous, head concierge. Terrible, terrible business. The Meridian is at your complete disposal. As am I. Within, you understand, the bounds of guest confidentiality.",
        mood: "nervous",
      },
      farewell: "The Meridian remembers its friends, Detective. Do count me among yours.",
      stressThresholds: { nervous: 20, breaking: 55 },
      topics: [
        {
          id: "t-ra-night",
          triggers: ["where were you", "last night", "alibi", "duty", "evening", "whereabouts", "that night"],
          responses: [
            {
              text: "At my desk, Detective, the entire evening. The lobby is my post and my post is my life. Six to midnight, present and correct.",
              mood: "nervous",
              stress: 6,
            },
          ],
        },
        {
          id: "t-ra-corridor",
          triggers: ["corridor", "service", "back way", "loading", "hallway", "green room", "anyone go", "see anyone"],
          responses: [
            {
              text: "The service corridor was empty all night. Nobody goes back there after nine. Nobody. Staff use the main lifts after the kitchen closes — house policy.",
              mood: "nervous",
              statementId: "s-ra-corridor",
              stress: 12,
            },
          ],
        },
        {
          id: "t-ra-victim",
          triggers: ["isabelle", "verne", "victim", "pianist", "rehears"],
          responses: [
            {
              text: "Ms. Verne was the loveliest guest this house ever kept. Rehearsed every night, ten till midnight, ballroom to herself — standing arrangement. Her tea went to the green room at nine thirty sharp. House kitchen, every night. Except...",
              mood: "sad",
            },
            {
              text: "Except last night the kitchen tells me the tea order was called off. 'Already handled,' someone told them. I assumed Ms. Meer had arranged it — she arranged everything else in that woman's life.",
              mood: "nervous",
              stress: 8,
            },
          ],
        },
        {
          id: "t-ra-keycard",
          triggers: ["key card", "keycard", "master card", "m-11", "access", "sign", "card"],
          responses: [
            {
              text: "Master cards are signed at my desk, yes. Ms. Meer took M-11 at three for soundcheck — routine, she's had cards a hundred times. I'd have to check whether it came back. Things were... it was not an ordinary night for returns.",
              mood: "nervous",
              stress: 8,
            },
          ],
        },
        {
          id: "t-ra-charlotte",
          triggers: ["charlotte", "meer", "manager"],
          responses: [
            {
              text: "Ms. Meer practically lives here during concert weeks. Gray coat, black coffee, tips like clockwork and remembers your name wrong on purpose. You always knew when she was in the building. One simply... felt supervised.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-ra-wine",
          triggers: ["wine", "cellar", "stealing", "skim", "side", "loading stair", "what were you doing"],
          responses: [
            {
              text: "I'm sure I don't know what you mean. The cellar inventory is the food and beverage manager's concern, not mine. Was there anything else?",
              mood: "defensive",
              stress: 15,
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "cctv-still",
          response: {
            text: "...That camera was supposed to be— I mean. Detective. All right. ALL RIGHT. I wasn't at my desk every minute. I was moving six cases of Margaux through the loading stair at ten, which is a *personnel matter*, not a police one — and yes. Yes, I saw her. A woman went past me into the corridor. Gray coat. Quick. Like she owned the walls. I've seen that coat at every soundcheck for three years, Detective. It belongs to Ms. Meer.",
            mood: "afraid",
            stress: 25,
            revealsEvidence: "raymond-statement",
          },
          contradictsStatement: "s-ra-corridor",
        },
        {
          evidenceId: "keycard-log",
          response: {
            text: "Ten fourteen — that's the green room lock, that's M-11... Ms. Meer's signature is right there at three o'clock, I watched her sign it. Detective, if that card opened that door at ten fourteen, then either she was there or her card walked itself.",
            mood: "nervous",
            stress: 10,
          },
        },
      ],
      breakLine: {
        text: "I move a little wine, Detective. Cases, not bottles — fine, cases. It buys my mother's flat in Rowan Heights and it never hurt a living soul. But I will not carry a murder to protect a cellar key. Ask me anything. Ask me again.",
        mood: "afraid",
      },
      fallbacks: {
        neutral: [
          "The Meridian's discretion is legendary, Detective, but do try me.",
          "I hear everything in this lobby. Whether I *heard* it officially is another matter. Ask precisely.",
        ],
        nervous: [
          "I— could we perhaps keep our voices down? The guests. The guests, Detective.",
          "That's rather a large question for a lobby, wouldn't you say?",
        ],
        angry: [
          "I have cooperated fully and my shift ended an hour ago. Precision, please, or a warrant.",
        ],
      },
    },

    /* ---------------- DAME OTTILIE HARTWELL — the patron -------------- */
    {
      id: "ottilie",
      name: "Dame Ottilie Hartwell",
      role: "Arts patron; funded Isabelle's career",
      portrait: {
        skin: "#ecc9b2",
        hair: "#dcd6ca",
        hairStyle: "bun",
        accent: "#5e3a6e",
        outfit: "dress",
        earrings: true,
        age: "old",
      },
      presence: "suburbs",
      personality:
        "Grande dame of the Veilport arts. Generous, imperial, and honest to the point of cruelty — mostly with herself.",
      demeanor: "Regal grief. Answers questions like she's granting them.",
      alibi: "At the museum gala until 10:47 PM, then home by taxi.",
      motiveHint: "Her life's work was leaving her. Patrons have disinherited for less.",
      greeting: {
        text: "So you're the one Voss trusts. Sit — no, that chair, the light is kinder there and you look tired. Ask me your questions, Detective. I have buried a husband and outlived my critics; I am not afraid of a police interview.",
        mood: "calm",
      },
      farewell: "Find them, Detective. And when you do — tell me first. An old woman is allowed one uncharitable hour.",
      stressThresholds: { nervous: 45, breaking: 85 },
      topics: [
        {
          id: "t-oh-alibi",
          triggers: ["where were you", "last night", "alibi", "gala", "museum", "whereabouts", "that night"],
          responses: [
            {
              text: "I was at the museum gala until nearly eleven, and a taxi took me home. Hundreds of people saw me. I gave the closing toast — to Isabelle, as it happens. 'To the ones who outgrow us.' I did not know I was giving a eulogy.",
              mood: "sad",
              statementId: "s-oh-gala",
            },
          ],
        },
        {
          id: "t-oh-isabelle",
          triggers: ["isabelle", "verne", "victim", "discover", "found her", "protégé", "protege"],
          responses: [
            {
              text: "I heard her at a wedding twenty-six years old and playing a rented upright like it was sacred. I bought her a Steinway that week and a career within the year. People call it patronage. It was closer to motherhood, with better paperwork.",
              mood: "sad",
            },
          ],
        },
        {
          id: "t-oh-vienna",
          triggers: ["vienna", "leaving", "farewell", "abandon", "betray", "move"],
          responses: [
            {
              text: "Was I wounded? Detective, I was *demolished*. One does not spend a quarter century building a cathedral to have it announce, at breakfast, that it prefers Austria. I said things to her I am glad the papers never heard. And then I booked the best seat at her farewell, because that is what love does with its dignity.",
              mood: "angry",
              stress: 8,
            },
          ],
        },
        {
          id: "t-oh-letter",
          triggers: ["letter", "wrote", "unsent", "writing desk", "cathedral"],
          responses: [
            {
              text: "You found the letter. Of course you did; I left it in plain sight because hiding it felt like a confession. Yes, I wrote it. No, I never sent it. One writes the cruel draft to discover one doesn't mean it, Detective. Surely even the police do that.",
              mood: "defensive",
              stress: 6,
            },
          ],
        },
        {
          id: "t-oh-charlotte",
          triggers: ["charlotte", "meer", "manager"],
          responses: [
            {
              text: "Charlotte Meer. Hm. Competent — relentlessly competent. But I shall tell you a thing I noticed years ago and dismissed as an old woman's cattiness: whenever the foundation offered to endow Isabelle directly, Meer redirected it. Everything through the management company. Everything through *her*. Water finds the sea, Detective. Money finds its keeper.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-oh-viktor",
          triggers: ["viktor", "casta", "rival"],
          responses: [
            {
              text: "Casta. A splendid pianist ruined by proximity to a sublime one. He sent my foundation his recordings every season for ten years. I never funded him. Perhaps I should have — men need something to lose.",
              mood: "calm",
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "ottilie-letter",
          response: {
            text: "Read it aloud, then, if you must — no. No, I'll spare us both. 'A cathedral does not get to walk away from its architect.' I wrote that about a woman I loved like a daughter, Detective, and she died before I could be ashamed of it in front of her. That is my punishment. It is adequate. It does not require your handcuffs to complete it.",
            mood: "sad",
            stress: 10,
          },
        },
        {
          evidenceId: "taxi-log",
          response: {
            text: "Mr. Demir's little book. Yes — ten forty-seven, and he had the kindness not to talk. You may verify me down to the minute, Detective; I have reached the age where one's whereabouts are always accounted for and never interesting.",
            mood: "calm",
            stress: -10,
          },
        },
      ],
      fallbacks: {
        neutral: [
          "Speak plainly, Detective. I've sat through forty years of galas; I can smell an indirect question.",
          "Ask what you actually wish to ask. I promise to survive it.",
        ],
        nervous: [
          "You'll forgive me — my attention wanders to her empty chair. Again, please.",
        ],
        angry: [
          "Young person, I have donated three wings to this city. I will not be barked at in my own parlor.",
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
      demeanor: "Making tea for the both of you.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective. Tea's just drawn — Assam, sit. She's been telling me things all morning, our pianist. The dead are chatty, you know. It's only that everyone stops listening.",
        mood: "calm",
      },
      farewell: "Mind the rain, Detective. And eat something — deduction burns calories, whatever Voss thinks.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-rk-cause",
          triggers: ["cause", "death", "how did she die", "poison", "digoxin", "heart", "autopsy", "findings"],
          responses: [
            {
              text: "The house doctor said cardiac arrest, and he was right the way a stopped clock is right. Her heart didn't fail, Detective — it was *stopped*. Digoxin. A heart drug, kind at a whisper, merciless at a shout. She swallowed forty doses of a shout.",
              mood: "calm",
            },
            {
              text: "The full report's on the side table there. Take it — I typed it twice so the second copy would be yours.",
              mood: "calm",
            },
          ],
        },
        {
          id: "t-rk-timing",
          triggers: ["when", "time", "window", "ingest", "how long"],
          responses: [
            {
              text: "She drank it between a quarter past ten and a quarter to eleven — the tea was warm, the dose enormous, the arithmetic sadly simple. Death a little after half eleven. She'd have felt unwell for perhaps twenty minutes and blamed the nerves. Pianists always blame the nerves.",
              mood: "sad",
            },
          ],
        },
        {
          id: "t-rk-digoxin",
          triggers: ["where", "source", "get digoxin", "prescription", "drug", "medication", "access"],
          responses: [
            {
              text: "Digoxin doesn't come from alleyways, Detective — it comes from pharmacies, with names attached. Someone in her orbit has a heart patient in the family, or a very foolish doctor. The registry at your precinct will know. Registries always know.",
              mood: "calm",
            },
          ],
        },
        {
          id: "t-rk-victim",
          triggers: ["isabelle", "verne", "victim", "tell me about her"],
          responses: [
            {
              text: "Pianist's hands — genuinely remarkable extensor development. Healthy as a lighthouse. She had thirty good years owed to her, Detective. Somebody has run up a debt.",
              mood: "sad",
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "thermos",
          response: {
            text: "The famous thermos. Get it to Nadia, not to me — but I'll wager my kettle it's the vehicle. Sweet tea, Detective. Digoxin hides beautifully in anything sweet.",
            mood: "calm",
          },
        },
      ],
      fallbacks: {
        neutral: [
          "Hm. Ask me about the body, Detective — the living are your department.",
          "The tea's getting cold, and so is the trail. Ask away.",
        ],
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
      demeanor: "Three evidence bags deep, gloves on.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective. Don't touch the light table. Talk to me while I work — what do you need?",
        mood: "neutral",
      },
      farewell: "Bring me physical things. Theories are your half of the office.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-nr-thermos",
          triggers: ["thermos", "tea", "results", "lab", "print", "fingerprint"],
          responses: [
            {
              text: "The thermos is the whole case in a steel jacket. Digoxin dissolved evenly through the tea — that means it went in at preparation, not after. And there's a foreign partial on the *inner* lid. You don't touch an inner lid unless you filled it. Results are pinned to my board — take the copy.",
              mood: "neutral",
            },
            {
              text: "One partial, left thumb, ulnar loop. Not hotel staff — I ran the exclusion set myself, twice. Get me a named comparison and I'll get you a court exhibit.",
              mood: "neutral",
            },
          ],
          requiresEvidence: ["thermos"],
        },
        {
          id: "t-nr-scene",
          triggers: ["scene", "ballroom", "piano", "anything else", "trace"],
          responses: [
            {
              text: "Scene's clean — unnervingly clean. No forced doors, no stranger fibers, nothing moved. Whoever did this didn't break in, Detective. They were *expected*. That narrows your world considerably.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-nr-cctv",
          triggers: ["cctv", "camera", "footage", "corridor", "coat"],
          responses: [
            {
              text: "I enhanced the corridor still as far as physics allows. No face — the tilt is deliberate, they knew the camera. But the coat reads as wool, full length, pale gray, tailored. That's not a disguise. That's somebody's everyday armor.",
              mood: "neutral",
            },
          ],
          requiresEvidence: ["cctv-still"],
        },
      ],
      presses: [
        {
          evidenceId: "pharmacy-record",
          response: {
            text: "Digoxin in the tea, digoxin missing from a bottle her hands collected. Detective, I don't do conclusions — but I ran the partial from the inner lid against the print card Meer gave for her manager's license renewal. Left thumb. Ulnar loop. It's her. Flag it, file it, go get her.",
            mood: "neutral",
          },
        },
      ],
      fallbacks: {
        neutral: [
          "Specifics, Detective. Evidence in, analysis out — that's the whole machine.",
          "If it's not on this table, I haven't got it. What else?",
        ],
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
      demeanor: "Polishing a glass that's already clean.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective. Coffee's fresh, stool's free. Heard about the pianist an hour after it happened — bad news drinks here too. What do you need?",
        mood: "calm",
      },
      farewell: "Door's always open past dark, Detective. That's when the truth gets thirsty.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-sal-viktor",
          triggers: ["viktor", "casta", "rival", "pianist", "here last night"],
          responses: [
            {
              text: "Casta? That stool, quarter past nine till just after eleven. Four ryes — I cut him to coffee at half ten. Talked about her the whole time, the way men talk about the war they lost. He watched the door all night like he was hoping someone would walk in. Nobody did. Take the tab off the spike if you want it in writing.",
              mood: "calm",
            },
          ],
        },
        {
          id: "t-sal-charlotte",
          triggers: ["charlotte", "meer", "manager"],
          responses: [
            {
              text: "The manager drinks here maybe twice a year — always alone, always after a contract closes. Last time, month or so back, she asked me a strange one: whether I thought people can tell when they're being managed. I said the good ones always find out. She didn't finish the drink.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-sal-isabelle",
          triggers: ["isabelle", "verne", "victim"],
          responses: [
            {
              text: "She came in once, years back, after a concert — sat where you're sitting, drank hot water with lemon, tipped like a senator. Sweetest famous person I ever poured for. This city's poorer tonight, Detective, and I don't mean money.",
              mood: "sad",
            },
          ],
        },
      ],
      presses: [],
      fallbacks: {
        neutral: [
          "Ask around the bar, Detective — the bar's where the city talks.",
          "Names, dates, drinks. That's my filing system. Try me.",
        ],
        nervous: ["Mm."],
        angry: ["Easy, Detective. House rules — everybody easy."],
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
      demeanor: "Unhurried, precise, half-smiling.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective. I keep the log, the log keeps me honest, and honest people sleep well — even on the night shift. Ask.",
        mood: "calm",
      },
      farewell: "Anywhere you need to go, 7-7-4 knows the way. Mind the rain.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-yd-ottilie",
          triggers: ["ottilie", "hartwell", "dame", "gala", "fare", "museum"],
          responses: [
            {
              text: "The Dame, yes. Ten forty-seven from the museum steps, home by ten past eleven. Regular of mine, twenty years. Quiet last night. Sad-quiet, not guilty-quiet — a driver learns the difference. It's in the log, page is flagged for you.",
              mood: "calm",
            },
          ],
        },
        {
          id: "t-yd-hotel",
          triggers: ["hotel", "meridian", "see anything", "notice", "that night"],
          responses: [
            {
              text: "I passed the Meridian twice that night. Second time, maybe half past ten, a woman came out the loading side into the rain — gray coat, no umbrella, walking like the weather was somebody else's problem. Didn't flag me. People who don't want taxis at night, Detective — they don't want witnesses either.",
              mood: "neutral",
            },
          ],
        },
      ],
      presses: [],
      fallbacks: {
        neutral: [
          "The log answers better than I do, Detective. But ask.",
          "Twenty years of nights in this city. Somewhere in there is your answer — aim the question.",
        ],
        nervous: ["Hm."],
        angry: ["Peace, Detective. The meter's not running."],
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
      demeanor: "Feet on desk, pencil behind ear, delighted to see you.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective! Sit, sit — mind the clippings. You give me a quote, I give you ten years of homework on everyone in that hotel. The Ledger's morgue knows this city better than the real one. Trade?",
        mood: "smug",
      },
      farewell: "Front page holds till midnight, Detective. Solve it by then and I'll spell your name right.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-fm-charlotte",
          triggers: ["charlotte", "meer", "manager", "finances", "money", "trust"],
          responses: [
            {
              text: "Meer, Charlotte. Now *there's* a filing cabinet with a locked drawer. Two springs ago Verne cancelled a European tour — 'management restructuring,' the release said. My business-desk pal heard the real story: a promoter in Amsterdam refused to route fees through Meer's side company and got frozen out. Side company, Detective. Called something pretty. Aria, I think.",
              mood: "smug",
            },
            {
              text: "Follow the retainers. Artists starve on paper while managements dine — oldest song in the songbook, and Meer conducts it beautifully.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-fm-viktor",
          triggers: ["viktor", "casta", "rival"],
          responses: [
            {
              text: "Casta's feud with Verne sold me forty columns over the years — all bark, all box office. Here's the unprintable part: he anonymously paid her debut-hall deposit fifteen years ago. Hated her in public, banked her in private. People are novels, Detective, not headlines.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-fm-ottilie",
          triggers: ["ottilie", "hartwell", "patron", "dame"],
          responses: [
            {
              text: "The Dame's given this city three museum wings and one pianist. Word at the gala: she'd rewritten her will last month — the Verne endowment redirected to a conservatory scholarship *in Isabelle's name*. You don't memorialize someone you're planning to murder, Detective. You memorialize someone you've already forgiven.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-fm-victim",
          triggers: ["isabelle", "verne", "victim", "background"],
          responses: [
            {
              text: "Verne, Isabelle — the city's one true unanimous vote. No enemies worth the ink, no scandals, paid her cleaner's daughter through nursing school and swore me to silence about it. Whoever did this, Detective, it wasn't hatred of her. It was fear of something she was about to *do*.",
              mood: "neutral",
            },
          ],
        },
      ],
      presses: [],
      fallbacks: {
        neutral: [
          "Names, Detective, give me names — I'm a search engine that runs on gossip.",
          "Ask me about a person. Buildings don't talk, but everyone in them does.",
        ],
        nervous: ["Hm?"],
        angry: ["Off the record, then. Sheesh."],
      },
    },
  ],

  /* ------------------------------------------------------------------ */
  /* Truth & resolution                                                  */
  /* ------------------------------------------------------------------ */

  timelineTruth: [
    { time: "3:05 PM", label: "Charlotte signs out master key card M-11 'for soundcheck access.'" },
    { time: "9:30 PM", label: "The kitchen's nightly tea order is cancelled — 'already handled.'" },
    { time: "9:52 PM", label: "Isabelle calls Charlotte. Four minutes. She hints at the audit; Charlotte promises to 'resolve it quietly.'" },
    { time: "9:58 PM", label: "Isabelle texts the auditor: 'See you at 9. Bring everything.'" },
    { time: "10:12 PM", label: "Charlotte enters the service corridor carrying the thermos — caught once on Camera 3." },
    { time: "10:14 PM", label: "Green room opened with card M-11. The poisoned thermos is left in Isabelle's ritual spot." },
    { time: "10:19 PM", label: "Charlotte exits, hands empty, passing Raymond at the loading stair." },
    { time: "10:25 PM", label: "Isabelle breaks rehearsal, collects her tea, returns to the piano." },
    { time: "11:30 PM", label: "The Glass Sonata stops mid-phrase." },
    { time: "11:40 PM", label: "A porter finds her. The rain keeps falling." },
  ],

  solution: {
    culpritId: "charlotte",
    motiveId: "embezzlement",
    methodSummary:
      "Digoxin from her mother's prescription, dissolved into Isabelle's ritual honey-lemon tea and delivered to the green room with a staff master card at 10:14 PM.",
    keyEvidence: ["lab-thermos", "keycard-log", "bank-records", "pharmacy-record"],
    explanation: [
      "It was never about the music. It was about the ledger behind the music.",
      "For three years, Charlotte Meer bled the Verne Trust through a shell called Aria Artist Services — €612,000 of 'European retainers' flowing to an account only she controlled. It worked because Isabelle never looked. And then Vienna: a new life, a clean break — and a forensic audit, booked for nine o'clock the morning after the farewell concert.",
      "At 9:52 PM Isabelle called her manager and, kindly, fatally, gave her a warning: whatever the auditor found, they would 'resolve it quietly.' Charlotte understood then that the eleven years were already over. Only the sentence remained unwritten.",
      "She had prepared anyway. Two weeks earlier she had collected her mother's digoxin — forty tablets' worth now missing from the bottle. She cancelled the kitchen's tea order, filled the ritual thermos herself, and at 10:12 PM carried it down the one corridor she believed unwatched, in the dove-gray coat everyone in that hotel knew on sight.",
      "Card M-11 opened the green room at 10:14. Her thumb pressed the inner lid — the single partial print Reyes matched. Isabelle drank her tea at the piano, blamed the flutter on nerves, and played on. The Glass Sonata stopped mid-phrase at half past eleven.",
      "The threat note was only a rival's drunken self-pity. The bitter letter was only a patron's cruel first draft. The lie that mattered wore a gray coat, kept immaculate books, and said 'I never went back' while the corridor camera said otherwise.",
      "Eleven years of devotion, Detective — and in the end she poisoned the one ritual that was purely Isabelle's own. Love that keeps accounts isn't love. It's inventory.",
    ],
  },

  epilogue: [
    "Charlotte Meer was arraigned on Friday morning — at nine o'clock, as it happened, in the hour reserved for the audit.",
    "The farewell concert went ahead as a memorial. Viktor Casta played the Glass Sonata from her hand-copied score, and for once in his life did not read his reviews.",
    "Dame Hartwell endowed the Verne Scholarship the following week. The first recipient plays a rented upright, beautifully.",
    "At The Blue Hour, Sal kept her recording on the turntable through closing time. Nobody asked him to take it off.",
  ],

  rewards: { xp: 200, unlockId: "record-player" },
};
