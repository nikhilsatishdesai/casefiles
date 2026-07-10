import type { CaseDef } from "@/lib/engine/types";

/**
 * EPISODE 2 — LOW TIDE
 *
 * Truth of the case:
 * Dario Brant, treasurer of Dockworkers Local 9, discovered that containers
 * were leaving Pier 9 at night without duty stamps — a smuggling channel run
 * by harbormaster Ivo Kask, with manifests laundered by clerk Sylvie Odum
 * under duress. Dario tallied container numbers in a pocket notebook and,
 * at 10:31 PM, called Kask to say he was going to the authorities. Kask told
 * him to come to the slipway "to see the paperwork." At about 10:55 he
 * struck Dario from behind with a crane winch handle and slid the body down
 * the slipway — misjudging the tide. It was low. The body stayed.
 */

export const CASE_002: CaseDef = {
  id: "low-tide",
  number: 2,
  title: "Low Tide",
  hook: "A union man floats up by the seawall. The tide says he shouldn't be there.",
  difficulty: 2,
  weather: { kind: "fog", intensity: 0.8 },
  timeOfDay: "dusk",

  newspaper: {
    date: "Sunday Edition",
    headline: "BODY RECOVERED AT OLD HARBOR SEAWALL",
    subhead: "Union treasurer Dario Brant pulled from the water at dawn. Harbor patrol calls the currents 'all wrong for it.'",
    body: [
      "The body of Dario Brant, 41, treasurer of Dockworkers Local 9, was recovered from the water beneath the Old Harbor seawall shortly after six o'clock yesterday morning.",
      "Brant, a second-generation dockworker described by colleagues as 'the honest set of books in a crooked-book town,' was last seen leaving the union hall after a heated meeting on Friday evening.",
      "A harbor patrol source, speaking off the record, noted that overnight currents 'couldn't have carried him ten feet, let alone from wherever he went in.'",
      "Precinct Seven has assigned its senior detective. The docks, as ever, are not talking. Not yet.",
    ],
    sidebar: {
      title: "TIDE TABLES",
      body: "Low water 9:04 PM — 3:12 AM. Dense fog through the night. Mariners advised: what the fog hides, the low tide keeps.",
    },
  },

  briefing: {
    officerId: "voss",
    lines: [
      "Dario Brant. Union treasurer, Local 9, straightest arrow on that waterfront — which on Pier 9 is saying something.",
      "Fished out at the seawall at dawn. Everyone down there is already calling it a drunk's drowning. Rook took one look and stopped them writing that down.",
      "Friday night he had a shouting match at the union hall, made a phone call at half ten, and walked into the fog. Nobody admits to seeing him after.",
      "The docks close ranks faster than any family in this city, Detective. Get down there before the fog and the lawyers roll in together.",
    ],
  },

  victim: {
    name: "Dario Brant",
    role: "Treasurer, Dockworkers Local 9, 41",
    portrait: {
      skin: "#c99a72",
      hair: "#2e241c",
      hairStyle: "short",
      accent: "#8a5a2e",
      outfit: "vest",
      beard: true,
      age: "mid",
    },
    bio: "Kept the union's books clean for nine years and everyone else's honest by example. Carried a pocket notebook everywhere — colleagues joked he'd audit the weather if it came in late.",
    foundAt: "old-harbor",
    initialFinding: "Recovered from the water at 6:10 AM. Presumed drowning. Dr. Rook has flagged the presumption.",
  },

  motives: [
    { id: "pension-theft", label: "Silencing an audit — he found theft in the union's pension fund" },
    { id: "gambling-debt", label: "Family money — debts someone needed forgiven" },
    { id: "smuggling", label: "The containers — he uncovered a smuggling channel" },
    { id: "union-power", label: "Union politics — removing a rival before the election" },
    { id: "affair", label: "A personal betrayal turned violent" },
  ],

  locations: [
    {
      locationId: "old-harbor",
      sublabel: "The Seawall",
      arrivalText:
        "Fog lies on Old Harbor like a held secret. Gulls argue over the recovery site, where the seawall stones are still chalk-marked. The water is glass-flat, low, and telling you something.",
      peopleHere: [],
      hotspots: [
        {
          id: "recovery-site",
          label: "Recovery site",
          x: 42,
          y: 62,
          description:
            "Where the patrol boat brought him up. No current to speak of, no wind overnight. Bodies drift with the water — and this water wasn't going anywhere.",
          evidenceId: "photo-lowtide",
        },
        {
          id: "tide-board",
          label: "Harbor tide board",
          x: 70,
          y: 44,
          description:
            "The harbor authority posts tide tables daily. Friday night: low water from just after nine until three in the morning. You photograph the chart and have the harbor patrol annotate it.",
          evidenceId: "tide-chart",
        },
        {
          id: "seawall-stones",
          label: "Seawall stones",
          x: 20,
          y: 56,
          description:
            "Barnacles, rope scars, a century of initials. Somebody's chalked 'D.B. — solid' on the wall since morning. The docks mourn in shorthand.",
          flavor: true,
        },
      ],
    },
    {
      locationId: "docks",
      sublabel: "Pier 9",
      arrivalText:
        "Pier 9 under fog: crane skeletons, container stacks like a giant's filing cabinet, sodium lamps haloed orange. The harbormaster's office lights are on. Work has stopped, but watching hasn't.",
      peopleHere: ["ivo", "gus", "sylvie"],
      hotspots: [
        {
          id: "slipway",
          label: "The old slipway",
          x: 30,
          y: 70,
          description:
            "A concrete ramp into black water, slick with weed. Halfway down: a fresh scrape through the algae, wide as a man's shoulders, and a boot print — deep tread, harbor-issue, large. Something heavy was slid into the water here.",
          evidenceId: "slipway-cast",
        },
        {
          id: "dario-locker",
          label: "Dario's locker",
          x: 78,
          y: 52,
          description:
            "Spare gloves, a flask of coffee gone cold, a photograph of his brother Enzo in boxing gloves — and, taped behind the door panel where a careful man hides careful things, a pocket notebook full of container numbers.",
          evidenceId: "dario-notebook",
        },
        {
          id: "union-hall",
          label: "Union hall noticeboard",
          x: 60,
          y: 40,
          description:
            "Friday's meeting minutes, posted per the bylaws Dario himself wrote. The last item is an argument — Dario versus Gus Ferro — transcribed by a secretary with a taste for drama.",
          evidenceId: "union-minutes",
        },
        {
          id: "harbor-office",
          label: "Harbormaster's records shelf",
          x: 14,
          y: 38,
          description:
            "Manifests bound by month, immaculate. Kask watches you take Friday's book without a word. Every container accounted for, every stamp in place. Paper this clean is its own kind of suspicious.",
          evidenceId: "manifest-ledger",
        },
        {
          id: "crane-locker",
          label: "Crane equipment locker",
          x: 46,
          y: 30,
          description:
            "Winch handles, shackles, grease guns — every item stenciled PIER 9 in marine green and signed out against a key registry. One winch handle is missing from its bracket. The registry shows a single key holder.",
          evidenceId: "key-log-crane",
          requiresEvidence: ["lab-winch"],
        },
        {
          id: "camera-pole",
          label: "Dock camera",
          x: 88,
          y: 24,
          description:
            "The pier's only camera, covering the slipway and the north stacks. The maintenance tag on the junction box is dated Friday: OFFLINE 22:30–23:30. You pull the work order from the office spike.",
          evidenceId: "cctv-gap",
        },
      ],
    },
    {
      locationId: "morgue",
      sublabel: "Examination Room 2",
      arrivalText:
        "Dr. Rook has the radio on low — a shipping forecast, of all things. 'Seemed fitting,' he says, nodding at the table. 'Our friend here has things to say about water.'",
      peopleHere: ["rook"],
      hotspots: [
        {
          id: "autopsy-file2",
          label: "Autopsy report",
          x: 70,
          y: 55,
          description:
            "Rook's report, signed twice — he does that when he expects an argument. This one ends the word 'drowning' for good.",
          evidenceId: "autopsy2",
        },
      ],
    },
    {
      locationId: "precinct",
      sublabel: "Precinct Seven — Detectives' Floor",
      arrivalText:
        "The precinct smells of wet wool and burnt coffee. Reyes has commandeered two tables — one for what the divers brought up, one for everything else. She looks pleased, which means something matched.",
      peopleHere: ["reyes"],
      hotspots: [
        {
          id: "records-desk2",
          label: "Records desk",
          x: 20,
          y: 60,
          description:
            "Dario Brant's phone records, subpoenaed and stamped. His last evening fits on one page — and one line of it is going to matter very much.",
          evidenceId: "phone-records2",
        },
        {
          id: "divers-table",
          label: "Diver recovery table",
          x: 74,
          y: 52,
          description:
            "The divers gridded the water off the slipway at first light. Item one: a crane winch handle, marine green, eighteen inches of painted steel. Reyes's report is clipped to the bag.",
          evidenceId: "lab-winch",
          requiresEvidence: ["autopsy2", "slipway-cast"],
        },
      ],
    },
    {
      locationId: "bluehour",
      sublabel: "The Blue Hour",
      arrivalText:
        "Sunday quiet at Sal's. The poker table in the back corner is still set from Friday — nobody's had the heart to clear it. Sal lifts his chin toward it as you come in: 'You'll be wanting to hear about that.'",
      peopleHere: ["sal"],
      hotspots: [
        {
          id: "poker-table",
          label: "The poker table",
          x: 72,
          y: 55,
          description:
            "Friday's game, preserved in amber: chips, tallies, and Sal's page of buy-ins with times against every name. Gus Ferro's name enters at 9:30 and doesn't leave until nearly one.",
          evidenceId: "poker-tab",
        },
      ],
    },
    {
      locationId: "cannery",
      sublabel: "Abandoned Cannery",
      arrivalText:
        "The cannery's broken windows watch you park. Inside: pigeons, rust, and one corner recently swept clean around two chairs and an oil-drum table. Somebody holds meetings here. Enzo Brant is sitting in one of the chairs, waiting to be found.",
      peopleHere: ["enzo"],
      hotspots: [
        {
          id: "drum-table",
          label: "Oil-drum table",
          x: 50,
          y: 58,
          description:
            "Cigarette ends, two glasses, and a folded paper wedged under the drum rim: betting slips, all losses, all signed 'E.B.' — and a note in another hand: 'Friday. Bring it all or bring your brother.'",
          evidenceId: "betting-slips",
        },
        {
          id: "boxing-poster",
          label: "Faded boxing poster",
          x: 84,
          y: 36,
          description:
            "ENZO 'THE BELL' BRANT vs. someone long forgotten. Twelve years old. Somebody has kept the rain off it deliberately. In this whole ruin, it's the one thing that's been cared for.",
          flavor: true,
        },
      ],
    },
    {
      locationId: "station",
      sublabel: "Taxi Rank, Grand Veilport Station",
      arrivalText:
        "Demir has the cab's heater running against the fog. He rolls the window down before you knock. 'Old Harbor business,' he says. It isn't a question.",
      peopleHere: ["demir"],
      hotspots: [
        {
          id: "logbook2",
          label: "Demir's logbook",
          x: 55,
          y: 58,
          description:
            "Friday night's page. Two fares stand out, flagged already in Demir's neat hand: a run to the cannery at a quarter past ten, and the same passenger back at five past eleven.",
          evidenceId: "taxi-log2",
        },
      ],
    },
    {
      locationId: "ledger",
      sublabel: "The Veilport Ledger — City Desk",
      arrivalText:
        "Marlowe isn't grinning today. He has a message-slip in his hand and he's been turning it over for hours. 'He called me, Detective,' he says, before you've said a word. 'Friday, six o'clock. And I was on deadline.'",
      peopleHere: ["marlowe"],
      hotspots: [
        {
          id: "tip-slip",
          label: "Tip line message slip",
          x: 70,
          y: 52,
          description:
            "The Ledger's tip line log, Friday 6:02 PM: 'D. Brant, Local 9 — says he has proof of cargo moving off Pier 9 with no duty paid. Wants to meet Monday. Says: it isn't the union, it's bigger.' Marlowe never got to make the meeting.",
          evidenceId: "tip-slip",
        },
      ],
    },
  ],

  evidence: [
    {
      id: "photo-lowtide",
      name: "Recovery photograph",
      type: "photo",
      icon: "camera",
      foundAt: "old-harbor",
      summary: "Brant at the seawall recovery point. Flat water, no current, no drift.",
      detail:
        "The patrol photographer framed the whole basin: fog, slack water, the seawall. A body doesn't travel in water like this. Wherever Dario Brant went in, it was close — and somebody expected the tide to take him out.",
      document: {
        kind: "report",
        title: "RECOVERY PHOTOGRAPH — OLD HARBOR SEAWALL",
        meta: "HARBOR PATROL · 06:10",
        body: "Subject recovered at seawall, north basin.\nOvernight conditions: dense fog, no wind, slack low water.\nPatrol note: 'No drift possible under recorded conditions.\nEntry point local to recovery — est. within 400m.'",
      },
    },
    {
      id: "tide-chart",
      name: "Annotated tide chart",
      type: "record",
      icon: "folder",
      foundAt: "old-harbor",
      summary: "Low water 9:04 PM to 3:12 AM. A body entering after nine stayed where it was put.",
      detail:
        "The harbor patrol's annotation is blunt: anything entering the north basin between nine and three would sit within a few hundred meters of its entry point. The killer knew boats, maybe. Tides, no. Or was in too much of a hurry to check.",
      document: {
        kind: "report",
        title: "TIDE TABLE — FRIDAY (ANNOTATED)",
        meta: "VEILPORT HARBOR AUTHORITY",
        body: "High water: 15:22.\nLOW WATER: 21:04 — 03:12 (slack, neap).\n\nPatrol annotation: 'For entry 21:00–03:00, drift negligible.\nNearest launch/entry structures to recovery point:\n— Pier 9 slipway (310m)\n— Ferry steps (condemned, gated).'",
      },
      keyEvidence: false,
    },
    {
      id: "autopsy2",
      name: "Autopsy report",
      type: "forensic",
      icon: "folder",
      foundAt: "morgue",
      summary: "No water in the lungs. Killed by a blow to the head — then put in the water.",
      detail:
        "Rook's findings close the door on 'drowning': Dario Brant was dead before he touched the water. A single heavy blow to the back of the skull, delivered by a rounded steel object — one that left flecks of marine-grade green paint in the wound.",
      document: {
        kind: "autopsy",
        title: "POST-MORTEM EXAMINATION — BRANT, DARIO",
        meta: "OFFICE OF THE CHIEF MEDICAL EXAMINER · DR. E. ROOK",
        body: "Cause of death: blunt force trauma, occipital region. Single blow, heavy, rounded steel implement.\nLungs: NO aspirated water. Deceased entered water post-mortem.\nWound debris: paint flecks, marine-grade alkyd, GREEN.\nTime of death: 22:30 — 23:30 Friday.\nBlood alcohol: nil. He was stone sober.\n\nRemark (E.R.): 'Struck from behind and slightly above.\nHe was facing the water when it happened. He trusted\nwhoever stood behind him — or never heard them.'",
      },
    },
    {
      id: "slipway-cast",
      name: "Slipway drag marks & boot cast",
      type: "physical",
      icon: "print",
      foundAt: "docks",
      summary: "A body-width scrape through the algae, and one deep boot print. Harbor-issue tread, size 12.",
      detail:
        "The scrape runs from the slipway's head to the waterline — one heavy object, slid once. The boot print beside it pressed deep: someone braced there, taking a load. Harbor-issue safety boot, size 12. The union buys size stamps into every pair it issues.",
      document: {
        kind: "report",
        title: "SCENE CAST — PIER 9 SLIPWAY",
        meta: "VPD FORENSICS · FIELD NOTES",
        body: "Drag mark: single event, 4.1m, consistent with body slide.\nBoot impression: harbor-issue safety pattern, SIZE 12,\ndeep heel strike (load-bearing stance).\nIssue records: Local 9 sizes on file with quartermaster —\nBrant D.: 10 · Ferro G.: 10 · Brant E.: 11 · KASK, I.: 12.",
      },
      keyEvidence: false,
    },
    {
      id: "dario-notebook",
      name: "Dario's pocket notebook",
      type: "document",
      icon: "ledger",
      foundAt: "docks",
      summary: "Weeks of container numbers, tallied at night. Marked: 'moved — no stamp. AGAIN.'",
      detail:
        "Page after page in a treasurer's hand: container IDs, dates, times — all after 10 PM, all marked 'no duty stamp.' The last page: 'CN-4471 Friday. That's eleven. Enough. Calling it in.' He wasn't auditing the union. He was auditing the pier.",
      document: {
        kind: "ledger",
        title: "POCKET NOTEBOOK — D. BRANT",
        meta: "Recovered from locker, Pier 9",
        body: "CN-3308 — Tue 23:10 — gate out — NO STAMP\nCN-3971 — Thu 22:40 — gate out — NO STAMP\nCN-4116 — Sun 23:05 — NO STAMP. manifest says EMPTY. it was not empty.\n...\nCN-4471 — FRIDAY — that's eleven.\nEnough. Calling it in.\nNot the union's shame this time. The office on the water.",
      },
      keyEvidence: false,
    },
    {
      id: "manifest-ledger",
      name: "Official pier manifests",
      type: "record",
      icon: "ledger",
      foundAt: "docks",
      summary: "The harbormaster's books: immaculate. Every container Dario flagged is logged 'empty — repositioning.'",
      detail:
        "Cross-checked against Dario's notebook, the pattern surfaces: every container he tallied leaving at night appears in the official manifest as 'empty — repositioning.' Eleven empty boxes, moved at night, through a gate that charges nothing for air.",
      document: {
        kind: "ledger",
        title: "PIER 9 MANIFEST — EXTRACT",
        meta: "HARBORMASTER'S OFFICE · CERTIFIED",
        body: "CN-3308 — EMPTY, repositioning — no duty.\nCN-3971 — EMPTY, repositioning — no duty.\nCN-4116 — EMPTY, repositioning — no duty.\nCN-4471 — EMPTY, repositioning — no duty.\n\nCertifying clerk: S. ODUM.\nAuthorizing signature: I. KASK.",
      },
    },
    {
      id: "second-ledger",
      name: "Sylvie's true ledger",
      type: "record",
      icon: "ledger",
      foundAt: "interview",
      summary: "The real cargo records, kept in secret. Every 'empty' container: full. Every entry initialed I.K.",
      detail:
        "Sylvie Odum kept an insurance policy — the true weights and contents of every 'empty' container, hidden in a tampon box in the office washroom. Uncustomed liquor and cigarettes, eleven shipments. Each entry bears the authorizing initials I.K., and each terrified page bears witness.",
      document: {
        kind: "ledger",
        title: "SHADOW LEDGER — S. ODUM",
        meta: "Surrendered under caution",
        body: "CN-3308 — 'empty' — actual: spirits, 4.2t — auth I.K.\nCN-3971 — 'empty' — actual: cigarettes, 3.8t — auth I.K.\n...\nCN-4471 — 'empty' — actual: spirits, 4.6t — auth I.K.\n\nMargin note (S.O.): 'He says one more month.\nHe always says one more month.'",
      },
      keyEvidence: true,
    },
    {
      id: "cctv-gap",
      name: "Camera maintenance order",
      type: "record",
      icon: "tape",
      foundAt: "docks",
      summary: "The only dock camera: offline 10:30–11:30 PM Friday. Work order signed by I. Kask.",
      detail:
        "'Preventive maintenance,' scheduled for the exact hour Dario Brant died, on the exact camera covering the slipway — authorized in advance, on Thursday, by the harbormaster. Murder scheduled like a ferry.",
      document: {
        kind: "report",
        title: "WORK ORDER 1187 — CAMERA POLE 1",
        meta: "PIER 9 OPERATIONS",
        body: "Equipment: CCTV, pole 1 (slipway / north stacks).\nAction: preventive maintenance — OFFLINE 22:30–23:30 Fri.\nRaised: Thursday, 16:40.\nAuthorized: I. KASK, Harbormaster.\nContractor note: 'Attended 22:30. No fault found.\nInstructed by office to proceed regardless.'",
      },
      keyEvidence: true,
    },
    {
      id: "lab-winch",
      name: "Winch handle analysis",
      type: "forensic",
      icon: "rope",
      foundAt: "precinct",
      summary: "The murder weapon: a Pier 9 winch handle, recovered off the slipway. Paint match. Blood match.",
      detail:
        "Reyes matched the marine-green paint in the wound to the recovered handle to the batch used on Pier 9 crane equipment — a chemical fingerprint, batch-specific. Blood on the shaft is Dario's. The handle belongs to the crane locker. The crane locker has one key.",
      document: {
        kind: "report",
        title: "LAB ANALYSIS — ITEM 07 (WINCH HANDLE)",
        meta: "VPD FORENSICS · N. REYES",
        body: "Recovered: harbor bed, 9m off slipway head.\nPaint: marine alkyd, green — EXACT batch match to\nPier 9 crane locker inventory (batch VH-119).\nBlood (shaft, guard): BRANT, DARIO.\nPrints: none (immersion + gloves probable).\nNote (N.R.): 'Weapon came from that locker.\nAsk who holds the key. It's a short list.'",
      },
      keyEvidence: true,
    },
    {
      id: "key-log-crane",
      name: "Crane locker key registry",
      type: "record",
      icon: "key",
      foundAt: "docks",
      summary: "One key. One holder. The harbormaster — 'equipment security, single custody: I. Kask.'",
      detail:
        "After a spate of thefts two years ago, crane equipment went to single-key custody. The registry is unambiguous: the only key to the locker that housed the murder weapon lives on the harbormaster's belt. It's on his belt as you read this.",
      document: {
        kind: "report",
        title: "KEY REGISTRY — PIER 9 EQUIPMENT",
        meta: "HARBOR AUTHORITY SECURITY POLICY 11-C",
        body: "CRANE LOCKER (north): single-custody key.\nHolder of record: KASK, IVO — Harbormaster.\nDuplicates: NONE authorized.\nLast audit: 3 weeks ago — 'all items present.'",
      },
      keyEvidence: false,
    },
    {
      id: "phone-records2",
      name: "Dario's phone records",
      type: "record",
      icon: "phone",
      foundAt: "precinct",
      summary: "6:02 PM: the Ledger tip line. 10:31 PM: a two-minute call to the harbormaster's office. His last.",
      detail:
        "At six he called a journalist. At half past ten he called the man he was about to expose — maybe to give him one honest chance to come clean. Two minutes. Twenty-five minutes later, by Rook's window, he was dead at the slipway.",
      document: {
        kind: "phone",
        title: "SUBSCRIBER RECORD — BRANT, D.",
        meta: "VEILPORT TELEPHONE EXCHANGE · FRIDAY",
        body: "18:02 — CALL — Veilport Ledger tip line — 4 min\n19:55 — CALL — BRANT, E. (brother) — 1 min\n22:31 — CALL — PIER 9 HARBORMASTER'S OFFICE — 2 min\n(no further activity)",
      },
      keyEvidence: true,
    },
    {
      id: "union-minutes",
      name: "Union meeting minutes",
      type: "document",
      icon: "folder",
      foundAt: "docks",
      summary: "Friday, 8 PM: Dario and Gus Ferro, shouting. Subject: 'irregularities' — but whose?",
      detail:
        "The secretary transcribed the heat but not the light: Dario demanding 'access to movement records,' Ferro bellowing that the union's books are clean and 'if you're calling me a thief, say it plain.' Read closely — Dario never mentions the pension fund. He says movement records. Cargo.",
      document: {
        kind: "report",
        title: "LOCAL 9 — MEETING MINUTES (EXTRACT)",
        meta: "FRIDAY, 20:00 · UNION HALL",
        body: "D. Brant: requests full access to 'movement records'\nand 'gate logs.' States: 'It's under our noses and it\nwears a collar and tie.'\nG. Ferro: 'The union's books are clean. If you're calling\nme a thief, say it plain, Dario.'\nD. Brant: 'Not you, Gus. For once in your life it's not\nabout you.'\nMeeting adjourned in disorder, 20:25.",
      },
    },
    {
      id: "poker-tab",
      name: "Friday poker record",
      type: "record",
      icon: "glass",
      foundAt: "bluehour",
      summary: "Gus Ferro at Sal's back table 9:30 PM to 12:50 AM, witnessed by five players and the house.",
      detail:
        "Sal logs buy-ins with times because 'money and memory shouldn't share a table.' Ferro bought in at 9:30, rebought at 11:15 — loudly, memorably — and cashed out at ten to one. Five players and Sal put him in that chair through the entire window.",
      document: {
        kind: "ledger",
        title: "BACK TABLE — FRIDAY",
        meta: "Sal's book, The Blue Hour",
        body: "21:30 — G.F. buy-in 50\n22:10 — G.F. loses big to R. (swore, ordered double)\n23:15 — G.F. re-buy 50 ('funeral money,' he said. bad joke, bad night)\n00:50 — G.F. out. walked home with R. and the twins.",
      },
    },
    {
      id: "betting-slips",
      name: "Enzo's betting slips",
      type: "document",
      icon: "ticket",
      foundAt: "cannery",
      summary: "Losses signed E.B. — and a collector's note: 'Friday. Bring it all or bring your brother.'",
      detail:
        "Eleven hundred in losses, a dead man's brother, and a threat with Friday's date on it. It reads like motive — until you learn what the meeting actually was, and who was watching the pier from the cannery windows while it happened.",
      document: {
        kind: "note",
        title: "SLIPS & NOTE — OIL-DRUM TABLE",
        meta: "Abandoned cannery, recent",
        body: "Slips: 14 markers, total 1,140 — all signed E.B.\n\nNote (other hand):\n'FRIDAY. 22:30. usual place.\nbring it all or bring your brother.'",
      },
    },
    {
      id: "taxi-log2",
      name: "Demir's fare log",
      type: "record",
      icon: "ticket",
      foundAt: "station",
      summary: "Friday: a fare to the cannery at 10:15 PM, same passenger back at 11:05. It was Enzo Brant.",
      detail:
        "Demir doesn't editorialize, but his margins do: 'nervous, counted an envelope twice.' Enzo went to the cannery at 10:15 and left at 11:05 — which puts him half a mile from the slipway, in a building with a clear view of it, for the whole of the murder window.",
      document: {
        kind: "ledger",
        title: "MEDALLION 7-7-4 — FRIDAY LOG",
        meta: "Y. DEMIR",
        body: "22:15 — Rowan Hts → CANNERY GATE.\n  Pax: E. Brant (the boxer, once). nervous.\n  counted an envelope twice.\n23:05 — CANNERY GATE → Rowan Hts.\n  same pax. quiet. kept looking at the pier lights.\n  said: 'somebody's working late on nine.' I said\n  in this fog? he said: 'lights on the slipway.'",
      },
    },
    {
      id: "tip-slip",
      name: "Ledger tip line slip",
      type: "record",
      icon: "phone",
      foundAt: "ledger",
      summary: "Friday 6:02 PM — Dario, to the press: 'cargo moving off Pier 9 with no duty paid. It isn't the union. It's bigger.'",
      detail:
        "He did everything right. He gathered proof, he called a reporter, he even exonerated his union in advance. 'Wants to meet Monday.' The killer bought himself a weekend, and Dario paid for it.",
      document: {
        kind: "phone",
        title: "TIP LINE LOG — FRIDAY 18:02",
        meta: "THE VEILPORT LEDGER · CITY DESK",
        body: "Caller: D. Brant, treasurer, Local 9 (gave name freely).\n'Has documentary proof of cargo moving off Pier 9\nwithout duty. Eleven shipments. Says: it isn't the\nunion, it's bigger. It's the office on the water.'\nRequests meeting MONDAY. Declined to say more\non an open line.",
      },
    },
    {
      id: "enzo-statement",
      name: "Enzo's statement",
      type: "statement",
      icon: "badge",
      foundAt: "interview",
      summary: "From the cannery windows at about 10:55: two men at the slipway, lights on — then one man, and the lights out.",
      detail:
        "Once the bookie business stopped being worth protecting, Enzo gave up what he saw: the slipway work lights on around 10:50, two figures — one broad, in the long harbor coat — then a sound he took for a dropped crate. Then one figure. Then no lights at all.",
      document: {
        kind: "report",
        title: "WITNESS STATEMENT — E. BRANT",
        meta: "TAKEN UNDER CAUTION · WITNESSED",
        body: "'From the cannery you see the whole north pier. About\nten to eleven the slipway lights came on. Two men.\nOne was Dario — I'd know my brother in any fog.\nThe other was big, long coat, the harbor coat.\nI heard something like a crate going down. Then there\nwas one man. Then the lights went out.\nI didn't go. I'll carry that. Now ask me again who\nwears the long coat on Pier 9.'",
      },
      keyEvidence: false,
    },
  ],

  statements: [
    {
      id: "s-ik-office",
      suspectId: "ivo",
      text: "“I locked the office at ten and was home by half past. I never spoke to Dario after the afternoon shift.”",
    },
    {
      id: "s-ik-camera",
      suspectId: "ivo",
      text: "“The camera outage? Port authority schedules maintenance, not me. Ask them.”",
    },
    {
      id: "s-ik-manifests",
      suspectId: "ivo",
      text: "“Every container that crosses my pier is on the manifest. Every one. My books balance to the kilo.”",
    },
    {
      id: "s-gf-books",
      suspectId: "gus",
      text: "“The pension fund is airtight and Dario knew it. Our fight was union business, nothing more.”",
    },
    {
      id: "s-eb-home",
      suspectId: "enzo",
      text: "“Friday night I was home in Rowan Heights. All night. Ask my neighbors.”",
    },
    {
      id: "s-so-records",
      suspectId: "sylvie",
      text: "“The manifests are the only records there are. I certify what crosses the scale, nothing else exists.”",
    },
  ],

  suspects: [
    /* ---------------- IVO KASK — harbormaster (guilty) --------------- */
    {
      id: "ivo",
      name: "Ivo Kask",
      role: "Harbormaster, Pier 9",
      portrait: {
        skin: "#d8ab8a",
        hair: "#4a423a",
        hairStyle: "short",
        accent: "#2e4a5e",
        outfit: "coat",
        beard: true,
        age: "old",
      },
      presence: "docks",
      personality:
        "Granite calm, twenty years of tide tables behind his eyes. Runs the pier like a ship and answers questions like a man billing you for his time.",
      demeanor: "Unbothered. Almost bored. Watch the hands, not the face.",
      alibi: "Claims he locked the office at 10 PM and was home by 10:30.",
      motiveHint: "The office on the water. Somebody has been moving cargo past his window for months — or through it.",
      greeting: {
        text: "Detective. Ivo Kask — this pier is mine to run and this mess is yours to clean, so let's not waste each other's tide. Brant was a good man and a worse nuisance. Ask your questions.",
        mood: "calm",
      },
      farewell: "Mind the fog going out. The harbor takes the careless. Always has.",
      stressThresholds: { nervous: 35, breaking: 75 },
      topics: [
        {
          id: "t-ik-alibi",
          triggers: ["where were you", "friday", "alibi", "that night", "whereabouts", "last night", "your evening"],
          responses: [
            {
              text: "Office till ten, locked it myself, home by half past. My wife will say so, and my wife doesn't lie for anyone, least of all me. I never spoke to Dario after the afternoon shift.",
              mood: "calm",
              statementId: "s-ik-office",
            },
          ],
        },
        {
          id: "t-ik-victim",
          triggers: ["dario", "brant", "victim", "treasurer", "think of him"],
          responses: [
            {
              text: "Nine years I watched him count other men's money and never skim a coin. Rare thing on a waterfront. He'd been underfoot lately — asking after gate logs, movement records, things above a treasurer's station. I told him: books are my water, Brant. Swim in your own.",
              mood: "neutral",
              stress: 6,
            },
          ],
        },
        {
          id: "t-ik-containers",
          triggers: ["container", "cargo", "smuggl", "duty", "stamp", "manifest", "empty", "shipment", "cn-"],
          responses: [
            {
              text: "Every container that crosses my pier is on the manifest. Every one. My books balance to the kilo — take them, audit them, frame them if you like. Empty boxes move at night because night moves are cheap. That's economics, Detective, not conspiracy.",
              mood: "defensive",
              statementId: "s-ik-manifests",
              stress: 12,
            },
          ],
        },
        {
          id: "t-ik-camera",
          triggers: ["camera", "cctv", "maintenance", "offline", "footage"],
          responses: [
            {
              text: "The camera outage? Port authority schedules maintenance, not me. Ask them. Equipment ages, fog corrodes, contractors come when they come. You'll find paperwork — there's always paperwork.",
              mood: "calm",
              statementId: "s-ik-camera",
              stress: 10,
            },
          ],
        },
        {
          id: "t-ik-slipway",
          triggers: ["slipway", "ramp", "drag", "boot", "lights"],
          responses: [
            {
              text: "The slipway's been dead since the ferry contract went to the south port. Nobody works it. If you found marks down there, you found kids, scrap thieves, or ghosts. The harbor breeds all three.",
              mood: "neutral",
              stress: 8,
            },
          ],
        },
        {
          id: "t-ik-sylvie",
          triggers: ["sylvie", "odum", "clerk", "certify"],
          responses: [
            {
              text: "Odum certifies weights. Diligent girl, nerves like wet rope, but her stamps are clean. Leave her be, Detective — the docks chew up clerks who talk to police, whatever they say.",
              mood: "neutral",
              stress: 8,
            },
          ],
        },
        {
          id: "t-ik-gus",
          triggers: ["gus", "ferro", "union", "pension", "argument", "meeting"],
          responses: [
            {
              text: "Ferro and Brant went at it Friday, whole hall heard it. Union money, union tempers. My advice? Follow the pension fund. Treasurers who count too loudly usually die of arithmetic.",
              mood: "smug",
            },
          ],
        },
        {
          id: "t-ik-enzo",
          triggers: ["enzo", "brother", "boxer", "debt"],
          responses: [
            {
              text: "The brother's a bruiser with a bookie problem — whole pier knows it. Debts make men do harbor-cold things to their own blood. I'd look there before you look at men with pensions and reputations.",
              mood: "calm",
            },
          ],
        },
        {
          id: "t-ik-call",
          triggers: ["call", "phone", "10:31", "spoke", "rang"],
          responses: [
            {
              text: "A call at half ten? To the office? Office was locked, Detective. Phones ring in empty rooms all over this city. Check your records again.",
              mood: "defensive",
              stress: 14,
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "phone-records2",
          response: {
            text: "Records show a ring, not an answer... Two minutes. Fine. FINE. He called, I answered, he talked his usual audit sermon and I told him to sleep it off. That's the whole of it. A phone call isn't a slipway, Detective.",
            mood: "nervous",
            stress: 18,
          },
          contradictsStatement: "s-ik-office",
        },
        {
          evidenceId: "cctv-gap",
          response: {
            text: "That's... routine paper. My signature goes on forty orders a week, I sign what operations puts in front of— The contractor found no fault because fog trips the sensors, everyone on this water knows fog trips the sensors. You're reading tea leaves.",
            mood: "nervous",
            stress: 20,
          },
          contradictsStatement: "s-ik-camera",
        },
        {
          evidenceId: "second-ledger",
          response: {
            text: "Odum kept WHAT. ...That frightened little— you understand what you're holding? That's a clerk's fantasy, a girl covering her own crooked stamps by initialing them onto me. My books are the books of record. Hers is a tampon-box novel. I'll have her stamp, her job, and her—",
            mood: "angry",
            stress: 25,
          },
          contradictsStatement: "s-ik-manifests",
        },
        {
          evidenceId: "lab-winch",
          response: {
            text: "...Batch-matched. To my locker. One key, and the key is mine, and you knew that before you walked out here. Anyone can force a locker, Detective. Locks are suggestions on a working pier. Anyone. Anyone could have.",
            mood: "afraid",
            stress: 22,
          },
        },
        {
          evidenceId: "enzo-statement",
          response: {
            text: "The gambler saw fog and made a man out of it. The harbor coat — half this pier wears the harbor coat, I BUY the harbor coats, there are forty of— ...He watched. All that time, from the cannery, the little bastard just watched.",
            mood: "afraid",
            stress: 20,
          },
          contradictsStatement: "s-ik-office",
        },
      ],
      breakLine: {
        text: "Twenty years I ran this pier clean. Then the south port took the ferry contract, the authority cut my budget to the bone, and men in better coats than mine explained how empty boxes could keep my crews paid. Eleven boxes. Nobody bled. And then Brant and his little notebook, calling me at half ten to offer me — ME — a chance to 'come forward.' On my own pier. I told him to come see the paperwork. He came. He always came when the numbers called... I checked every table in that office, Detective. Except the tide's.",
        mood: "sad",
      },
      fallbacks: {
        neutral: [
          "Ask it straight, Detective. Fog's for the water, not for questions.",
          "I've run this pier twenty years. There's no question about it I can't answer — try one.",
        ],
        nervous: [
          "...Say again. The fog gets into a man's ears.",
          "You circle like a gull, Detective. Land somewhere.",
        ],
        angry: [
          "I have a pier to run and a man to bury. Make it matter or make it quick.",
        ],
      },
    },

    /* ---------------- GUS FERRO — union boss (red herring) ----------- */
    {
      id: "gus",
      name: "Gus Ferro",
      role: "President, Dockworkers Local 9",
      portrait: {
        skin: "#c98a62",
        hair: "#1e1a16",
        hairStyle: "bald",
        accent: "#8a2e2e",
        outfit: "vest",
        beard: true,
        age: "old",
      },
      presence: "docks",
      personality:
        "Bull-voiced, quick-tempered, sentimental as a dockside ballad underneath. Loved Dario like a difficult son.",
      demeanor: "Grief wearing anger's coat.",
      alibi: "Poker at The Blue Hour, 9:30 PM to nearly 1 AM.",
      motiveHint: "The shouting match. If Dario found rot in the union's books, the president had everything to lose.",
      greeting: {
        text: "You're the detective? Good. GOOD. Because I've got a pier full of grown men crying into their gloves and a city already writing 'union thug' in tomorrow's paper. Ask me anything. I've got nothing to hide and a temper about it — you'll learn to tell the difference.",
        mood: "angry",
      },
      farewell: "Find who put my treasurer in the water, Detective. The Local pays its debts — both kinds.",
      stressThresholds: { nervous: 40, breaking: 80 },
      topics: [
        {
          id: "t-gf-alibi",
          triggers: ["where were you", "friday", "alibi", "that night", "whereabouts", "poker", "blue hour"],
          responses: [
            {
              text: "Sal's back table, half nine till near one. Lost a week's pay to Reggie and the twins and I've got five witnesses and a bar bill to prove it. Worst night of cards in my life — until the phone rang Saturday morning and it became the second worst thing about it.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-gf-argument",
          triggers: ["argument", "fight", "shouting", "meeting", "minutes", "union hall", "8", "eight"],
          responses: [
            {
              text: "The pension fund is airtight and Dario knew it. Our fight was union business, nothing more. He came in Friday demanding gate logs, movement records — I thought he was calling ME crooked and I went up like a flare. You read the minutes? Read the end. 'Not you, Gus. For once in your life it's not about you.' Last thing he ever said to me.",
              mood: "sad",
              statementId: "s-gf-books",
              stress: 6,
            },
            {
              text: "I've turned it over a hundred times since. Gate logs. Movement records. 'It wears a collar and tie.' Dockers don't wear ties, Detective. Management does. Harbormasters do.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-gf-victim",
          triggers: ["dario", "brant", "victim", "treasurer"],
          responses: [
            {
              text: "Nine years he kept our books so clean you could eat off them. Turned down three bribes I know of and reported two of them to me with the money still in the envelope. You want to know who kills a man like that? Somebody he was about to be RIGHT about.",
              mood: "sad",
            },
          ],
        },
        {
          id: "t-gf-kask",
          triggers: ["kask", "ivo", "harbormaster", "container", "smuggl", "cargo"],
          responses: [
            {
              text: "Kask runs his pier like the tide owes him rent. I'll say this and you didn't hear it from me: my night crews joke about the 'ghost boxes' — empties that move at midnight and ride low in the water. Empties don't ride low, Detective. Air's not heavy.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-gf-enzo",
          triggers: ["enzo", "brother", "debt", "boxer"],
          responses: [
            {
              text: "Enzo. Heart like a bell, sense like a mule. Owes half the bookies in the industrial zone. Dario bailed him out twice that I know. But hurt Dario? That boy would sooner drink the harbor. Blood's blood, and theirs was thicker than most.",
              mood: "neutral",
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "union-minutes",
          response: {
            text: "So you read it proper. Then you know — he cleared me in front of the whole hall with his last words to me. 'Not you, Gus.' You put that in your report, Detective. Word for word. I'll be checking.",
            mood: "sad",
            stress: -5,
          },
        },
        {
          evidenceId: "poker-tab",
          response: {
            text: "There it is in Sal's own hand. 'Funeral money.' God forgive me, I said that as a JOKE, rebuying at eleven while somebody was— ...Take the tab. Take whatever you need. Just aim yourself at the right man.",
            mood: "sad",
            stress: -10,
          },
        },
        {
          evidenceId: "dario-notebook",
          response: {
            text: "...That's his hand. That's his little book, the one he'd tap his pencil on and drive us all— 'Not the union's shame this time. The office on the water.' Detective. There is exactly one office on that water and exactly one man in it. Go.",
            mood: "angry",
            stress: 5,
          },
        },
      ],
      fallbacks: {
        neutral: [
          "Ask it plain, Detective. Dockside rules — plain words, plain answers.",
          "I bellow, I don't dodge. Try me with a real question.",
        ],
        nervous: [
          "What? Speak up — twenty years of winches in these ears.",
        ],
        angry: [
          "You're wasting daylight on ME while his killer watches the fog? ASK BETTER.",
        ],
      },
    },

    /* ---------------- ENZO BRANT — the brother (red herring) --------- */
    {
      id: "enzo",
      name: "Enzo Brant",
      role: "Dockworker; the victim's brother",
      portrait: {
        skin: "#c99a72",
        hair: "#2e241c",
        hairStyle: "buzz",
        accent: "#3a5a3a",
        outfit: "sweater",
        age: "mid",
      },
      presence: "cannery",
      personality:
        "Ex-boxer, soft-spoken, all guilt and bad decisions. Loved his brother past the point of being able to look at him.",
      demeanor: "Flinching before the questions land.",
      alibi: "Claims he was home in Rowan Heights all night.",
      motiveHint: "Eleven hundred in gambling debts, a collector's deadline dated Friday — and a brother with savings.",
      greeting: {
        text: "You found me, then. Figured somebody would — I've been sitting here since dawn because I can't... the house has photos of him everywhere, you know? Ask what you're going to ask. I've had worse rounds.",
        mood: "nervous",
      },
      farewell: "When you get him — whoever — don't tell me where the trial is. I don't trust my hands that much. Dario got all the patience in the family.",
      stressThresholds: { nervous: 20, breaking: 55 },
      topics: [
        {
          id: "t-eb-alibi",
          triggers: ["where were you", "friday", "alibi", "that night", "whereabouts", "home"],
          responses: [
            {
              text: "Friday night I was home in Rowan Heights. All night. Ask my neighbors. Watched the fights on the radio, went to bed. That's it. That's the whole night.",
              mood: "nervous",
              statementId: "s-eb-home",
              stress: 12,
            },
          ],
        },
        {
          id: "t-eb-victim",
          triggers: ["dario", "brother", "victim", "close"],
          responses: [
            {
              text: "He was the good one. Straightest man on that water and everybody knew it. He called me Friday — one minute, seven o'clock. Said 'stay off the pier tonight, Enz.' I thought he meant the fog. I thought he meant the FOG.",
              mood: "sad",
              stress: 8,
            },
          ],
        },
        {
          id: "t-eb-debts",
          triggers: ["debt", "bookie", "betting", "gambl", "money", "owe", "slips"],
          responses: [
            {
              text: "Everybody's got a hobby, mine bites back. Yeah, I owe. Dario covered me twice and I swore twice it was done. It wasn't done. But that's my shame, Detective, not his blood. It's got nothing to do with the water.",
              mood: "defensive",
              stress: 10,
            },
          ],
        },
        {
          id: "t-eb-cannery",
          triggers: ["cannery", "meeting", "here", "this place"],
          responses: [
            {
              text: "This place? It's quiet. Pigeons don't ask questions. I come here to think, that's all — since we were kids, this was our ring. Dario'd hold the watch, I'd hit the bags of meal. Long time ago.",
              mood: "nervous",
              stress: 10,
            },
          ],
        },
        {
          id: "t-eb-kask",
          triggers: ["kask", "harbormaster", "ivo", "pier", "slipway", "lights"],
          responses: [
            {
              text: "Kask... look, dockers don't talk about the office. But the night boxes, the 'empties' — Dario asked me about them a month back. Asked if I'd loaded any. I said I don't ask what's in a box, that's how you stay employed on nine. He looked at me like I'd failed a test.",
              mood: "neutral",
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "taxi-log2",
          response: {
            text: "...Demir and his damn book. Okay. OKAY. I wasn't home. I was HERE, Friday night, paying off Ricci's man — every cent, eleven hundred, I had it in an envelope because the note said bring it all or bring my brother and I was never, NEVER letting it touch Dario. I paid at half ten and sat here after, shaking. And Detective — from those windows I saw the slipway. I saw the lights. I have to tell you what I saw.",
            mood: "afraid",
            stress: 20,
            revealsEvidence: "enzo-statement",
          },
          contradictsStatement: "s-eb-home",
        },
        {
          evidenceId: "betting-slips",
          response: {
            text: "You found the note. Then you know why I lied — 'bring it all or bring your brother.' They named HIM, Detective. I'd have carried that debt into the harbor before I let it touch Dario. Instead the harbor took him anyway, for somebody else's ledger. Tell me how I'm supposed to sit with that.",
            mood: "sad",
            stress: 12,
          },
        },
      ],
      breakLine: {
        text: "I watched the lights go out on that slipway and I told myself it was nothing, because I was holding an empty envelope and a skin full of fear. If I'd walked over — thirty seconds, Detective, it's thirty seconds at a jog, I used to run it as a kid — ...Take the statement. Take it twice. It's all I've got left to give him.",
        mood: "sad",
      },
      fallbacks: {
        neutral: [
          "Ask me straight. I was never quick, but I'm honest — mostly. Trying to be.",
          "Go again. My head's still ringing and it's not from any punch.",
        ],
        nervous: [
          "I— what? Sorry. Sorry. Again.",
          "You look at me like the collectors do. Just ask it.",
        ],
        angry: [
          "I've been hit by professionals, Detective. Questions don't scare me. Ask.",
        ],
      },
    },

    /* ---------------- SYLVIE ODUM — the clerk ------------------------ */
    {
      id: "sylvie",
      name: "Sylvie Odum",
      role: "Certifying clerk, Pier 9",
      portrait: {
        skin: "#ecc5aa",
        hair: "#8a3a2e",
        hairStyle: "bun",
        accent: "#5e6e2e",
        outfit: "sweater",
        glasses: true,
        age: "young",
      },
      presence: "docks",
      personality:
        "Precise, exhausted, frightened. Has been keeping two sets of truth for a year and it is eating her alive.",
      demeanor: "Answers arrive a half-second late, pre-checked for safety.",
      alibi: "Left the pier at 6 PM; home with her mother.",
      motiveHint: "Her stamp certifies every manifest. If the books are wrong, she's either a conspirator — or a hostage.",
      greeting: {
        text: "Detective. I— yes. Sylvie Odum, certification. I already gave a statement to the officer, but. Yes. Whatever you need. Only I have weights to file by four, so. Please.",
        mood: "nervous",
      },
      farewell: "Please be careful who you tell that I talked to you. Please. The pier hears everything.",
      stressThresholds: { nervous: 15, breaking: 45 },
      topics: [
        {
          id: "t-so-alibi",
          triggers: ["where were you", "friday", "alibi", "that night", "whereabouts"],
          responses: [
            {
              text: "Home by half six. My mother — I cook for her Fridays. I wasn't anywhere near the water at night, I never am, I do days. Days only.",
              mood: "nervous",
              stress: 5,
            },
          ],
        },
        {
          id: "t-so-manifests",
          triggers: ["manifest", "records", "certify", "stamp", "container", "empty", "cargo", "books"],
          responses: [
            {
              text: "The manifests are the only records there are. I certify what crosses the scale, nothing else exists. If a container is logged empty, it. It weighed empty. The scale doesn't lie and neither do— the scale doesn't lie.",
              mood: "nervous",
              statementId: "s-so-records",
              stress: 15,
            },
          ],
        },
        {
          id: "t-so-victim",
          triggers: ["dario", "brant", "victim"],
          responses: [
            {
              text: "Mr. Brant was kind to me. He brought my mother oranges when she was in St. Maren's. Last month he started standing by my window during the night moves — just standing, with his little book. I wanted to tell him to stop. I wanted to tell him to RUN. I didn't tell him anything.",
              mood: "sad",
              stress: 12,
            },
          ],
        },
        {
          id: "t-so-kask",
          triggers: ["kask", "harbormaster", "ivo", "pressure", "afraid", "boss"],
          responses: [
            {
              text: "Mr. Kask is. He's the harbormaster. He signs, I stamp. That's the whole— that's the job. He's never once raised his voice to me. He doesn't have to. Detective. He doesn't have to.",
              mood: "afraid",
              stress: 15,
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "dario-notebook",
          response: {
            text: "...He wrote them down. All this time he was writing them down, same as— ...Washroom, third stall, there's a box on the cistern shelf nobody ever touches. Inside is my ledger. The real weights. The real cargo. Every 'empty' with his initials, because I decided a year ago that if I was going to drown I'd leave a map to the body. Take it. TAKE it. I'm so tired, Detective. I've been tired for a year.",
            mood: "afraid",
            stress: 20,
            revealsEvidence: "second-ledger",
          },
          contradictsStatement: "s-so-records",
        },
        {
          evidenceId: "manifest-ledger",
          response: {
            text: "Yes. My stamp. Every page my stamp. You see how clean it is? He used to say that — 'keep it clean, Odum, clean paper floats.' I certify air, Detective. Professionally. Ask me what the air weighs.",
            mood: "nervous",
            stress: 15,
          },
        },
      ],
      breakLine: {
        text: "It started with one container. 'A favor for the pier,' he said, 'the budget year is cruel.' Then it was two, then it was a schedule, and my stamp was on all of it, so whose crime is it now, Odum? That's how he never had to threaten me. My own stamp did it for him. Mr. Brant died holding the truth I was too frightened to hand him. So take everything. And Detective — the camera order. Look who signed the camera order.",
        mood: "sad",
      },
      fallbacks: {
        neutral: [
          "I— could you be specific? I'm better with specific.",
          "Numbers I can do. People questions take me longer. Ask again?",
        ],
        nervous: [
          "I don't— is someone watching the office right now? Sorry. Ask again.",
          "Please keep your voice down. Sound carries on the water.",
        ],
        angry: [
          "I'm not— I file papers, Detective. Please. Just ask about the papers.",
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
      demeanor: "Listening to the shipping forecast.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective — good, you're here. Somebody upstairs wanted 'drowning' on this certificate before lunch. I have declined. Sit; the kettle's on and the deceased has been very forthcoming.",
        mood: "calm",
      },
      farewell: "The tide keeps honest records, Detective. Consult it more often than the living.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-rk2-cause",
          triggers: ["cause", "death", "drown", "how did he die", "autopsy", "findings", "wound"],
          responses: [
            {
              text: "Not a drop of harbor water in his lungs, Detective — the man never drew breath in that basin. One blow, back of the skull, rounded steel, delivered with real force from behind and slightly above. He was dead before the splash. The report's on the side table; it's yours.",
              mood: "calm",
            },
          ],
        },
        {
          id: "t-rk2-paint",
          triggers: ["paint", "green", "flecks", "weapon", "steel"],
          responses: [
            {
              text: "Green paint in the wound — marine alkyd, the sort every harbor slaps on its equipment. That's not decoration, that's provenance. Find the tool, match the batch, and the paint will testify better than most witnesses.",
              mood: "calm",
            },
          ],
        },
        {
          id: "t-rk2-time",
          triggers: ["when", "time", "window", "died"],
          responses: [
            {
              text: "Between half ten and half eleven, Friday. Water temperature muddies the arithmetic, but not much — he went in soon after he died. Whoever did it wanted the harbor to do the explaining. The harbor, I'm pleased to report, has refused.",
              mood: "calm",
            },
          ],
        },
      ],
      presses: [
        {
          evidenceId: "tide-chart",
          response: {
            text: "Precisely, Detective — low water, slack, neap. Whoever put him in expected the sea to carry the evidence out and the story with it. They knew their pier and forgot their tide. Professionals of the land, amateurs of the water. Remember that when you're choosing among suspects.",
            mood: "calm",
          },
        },
      ],
      fallbacks: {
        neutral: ["The body's told me what it knows, Detective. Ask along those lines.", "More tea while you think?"],
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
      demeanor: "Two tables of evidence, one raised eyebrow.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective. The divers earned their pay this morning. Ask me about steel, paint, or boot treads — I'm fluent in all three today.",
        mood: "neutral",
      },
      farewell: "Physical things, Detective. Bring me physical things.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-nr2-winch",
          triggers: ["winch", "handle", "weapon", "divers", "paint", "batch"],
          responses: [
            {
              text: "Winch handle, off the slipway head, nine meters out. Paint batch VH-119 — same batch as the Pier 9 crane locker inventory, and batches are effectively fingerprints for industrial paint. Blood on the shaft is your victim's. Report's clipped to the bag; it's the whole case in eighteen inches of steel.",
              mood: "neutral",
            },
          ],
          requiresEvidence: ["lab-winch"],
        },
        {
          id: "t-nr2-boot",
          triggers: ["boot", "print", "cast", "slipway", "size"],
          responses: [
            {
              text: "The slipway cast is a size 12 harbor-issue safety boot, heel-deep — someone braced under load. The union quartermaster keeps issue sizes on file. I attached the list. It's short, and one name on it runs the pier.",
              mood: "neutral",
            },
          ],
          requiresEvidence: ["slipway-cast"],
        },
      ],
      presses: [],
      fallbacks: {
        neutral: ["Specifics. Steel, paint, treads — pick one.", "If the divers didn't bring it up, I don't have it. Next."],
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
      demeanor: "Keeping the poker table like a shrine.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective. Brant drank here maybe once a year — worked too hard for barstools. But Friday's poker table hasn't moved since it happened, and I figured you'd want it exactly as it sat. Coffee?",
        mood: "calm",
      },
      farewell: "Docks bury their own and their secrets in the same hole, Detective. Dig fast.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-sal2-gus",
          triggers: ["gus", "ferro", "poker", "friday", "game", "alibi"],
          responses: [
            {
              text: "Ferro sat that chair from half nine till ten to one. Lost ugly, rebought at quarter past eleven making his bad jokes, walked home with Reggie and the twins. Five players and me — that's six clocks on him, all agreeing. Whatever happened on that water, Gus Ferro was losing at cards while it did.",
              mood: "calm",
            },
          ],
        },
        {
          id: "t-sal2-docks",
          triggers: ["docks", "pier", "kask", "harbor", "smuggl", "talk", "hear"],
          responses: [
            {
              text: "What does a bar hear about Pier 9? Night crews joke about ghost boxes that ride low. And a month back, a drunk clerk from the harbor office sat where you're sitting and said, 'Sal, what do you do when your own stamp is the noose?' Then she paid and left and never came back. I've thought about her every day since Saturday.",
              mood: "neutral",
            },
          ],
        },
      ],
      presses: [],
      fallbacks: {
        neutral: ["Ask the room, Detective. Friday's still sitting right there.", "Names and nights. That's my inventory."],
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
      demeanor: "Heater on against the fog.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective. Bad water business, this one. I drove the fog all Friday night — ask me what the fog was doing, and I'll tell you who was doing it.",
        mood: "calm",
      },
      farewell: "7-7-4, any hour. The fog and I are old partners.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-yd2-enzo",
          triggers: ["enzo", "brant", "cannery", "brother", "fare", "envelope"],
          responses: [
            {
              text: "The boxer. Cannery gate at quarter past ten, back at five past eleven. Nervous going, hollow coming back. He counted an envelope twice on the way out and held nothing on the way home. And he said a thing I wrote down: 'somebody's working late on nine — lights on the slipway.' In that fog, Detective, you only see slipway lights if slipway lights are on.",
              mood: "calm",
            },
          ],
        },
        {
          id: "t-yd2-pier",
          triggers: ["pier", "kask", "harbormaster", "docks", "night moves"],
          responses: [
            {
              text: "I rank at the station, but night fares to the industrial zone, I see the pier gate. Some nights trucks queue at eleven for 'empty' boxes. Heavy trucks, Detective. Air must be getting expensive.",
              mood: "neutral",
            },
          ],
        },
      ],
      presses: [],
      fallbacks: {
        neutral: ["The log remembers better than I do. Ask it through me.", "Aim the question, Detective. Twenty years of nights in here."],
        nervous: ["Hm."],
        angry: ["Peace. The meter's off."],
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
      demeanor: "Turning a message slip over and over.",
      alibi: "—",
      motiveHint: "—",
      greeting: {
        text: "Detective. He called my tip line Friday at six and I let it ride to Monday because I was on deadline. Monday. So whatever you need from me on this one, you have it — no trade, no quote, no games. The slip's on my desk. Take it.",
        mood: "sad",
      },
      farewell: "When it breaks, I'm printing his name over mine. Byline: D. Brant. It's his story. Go finish it.",
      stressThresholds: { nervous: 100, breaking: 100 },
      topics: [
        {
          id: "t-fm2-tip",
          triggers: ["tip", "call", "phone", "friday", "dario", "brant", "story"],
          responses: [
            {
              text: "Six o'clock Friday. Gave his name straight out — tipsters never do that, Detective, that's a man with nothing to hide and everything to show. 'Cargo moving off Pier 9, no duty, eleven shipments. It isn't the union, it's bigger. It's the office on the water.' The office on the water. He'd already solved it. He just needed someone to print it.",
              mood: "sad",
            },
          ],
        },
        {
          id: "t-fm2-kask",
          triggers: ["kask", "harbormaster", "ivo", "office", "smuggl"],
          responses: [
            {
              text: "Kask, Ivo. Twenty years harbormaster, budget slashed three times, ferry contract lost to the south port — a proud man watching his pier become a museum. My shipping-desk friend says Pier 9's night tonnage doesn't match its duty receipts and hasn't for a year. Somebody's running a toll-free lane through that gate, and there's only one man who owns the gate.",
              mood: "neutral",
            },
          ],
        },
        {
          id: "t-fm2-union",
          triggers: ["union", "ferro", "gus", "pension", "local 9"],
          responses: [
            {
              text: "Everyone will sell you 'union corruption' because it's a headline that writes itself. I've audited Ferro from the outside for a decade hoping for that headline — never found so much as a padded lunch. Loud man, clean hands. Look past the shouting, Detective. The quiet ones own offices.",
              mood: "neutral",
            },
          ],
        },
      ],
      presses: [],
      fallbacks: {
        neutral: ["Names, Detective. The morgue downstairs has a file on half this city.", "Ask me about a person, not a feeling."],
        nervous: ["Hm?"],
        angry: ["Off the record, then."],
      },
    },
  ],

  timelineTruth: [
    { time: "Thu 4:40 PM", label: "Kask raises a maintenance order: the slipway camera to go dark Friday, 10:30–11:30 PM." },
    { time: "Fri 6:02 PM", label: "Dario calls the Ledger tip line: eleven shipments, no duty. 'It's the office on the water.'" },
    { time: "Fri 7:55 PM", label: "Dario calls Enzo: 'Stay off the pier tonight.'" },
    { time: "Fri 8:00 PM", label: "The union hall argument. Dario, to Ferro: 'For once in your life it's not about you.'" },
    { time: "Fri 10:31 PM", label: "Dario calls the harbormaster's office — one honest chance to come forward. Kask says: come see the paperwork." },
    { time: "Fri 10:30 PM", label: "The slipway camera goes dark, on schedule." },
    { time: "Fri ~10:55 PM", label: "At the slipway: one blow with a crane winch handle. Enzo, at the cannery windows, sees two figures become one." },
    { time: "Fri ~11:05 PM", label: "The body slides down the ramp into slack, low water. It goes nowhere. The handle is thrown after it." },
    { time: "Sat 6:10 AM", label: "Harbor patrol recovers Dario Brant at the seawall, 310 meters away." },
  ],

  solution: {
    culpritId: "ivo",
    motiveId: "smuggling",
    methodSummary:
      "Lured to the slipway during a pre-scheduled camera blackout, struck from behind with a crane winch handle from the single-key locker, and slid into what Kask believed was an outgoing tide.",
    keyEvidence: ["lab-winch", "cctv-gap", "second-ledger", "phone-records2"],
    explanation: [
      "Dario Brant was killed by paperwork. He was just the last man to touch it.",
      "For a year, 'empty' containers rode low through Pier 9's gate at night — spirits and cigarettes, eleven shipments, duty-free by forgery. Ivo Kask signed the manifests. Sylvie Odum, hostage to her own stamp, certified the air. And a treasurer with a pocket notebook started counting.",
      "By Friday, Dario had eleven container numbers and a journalist on the line. But he was a union man to the bone — so at 10:31 PM he gave the harbormaster the one thing he never gave a crooked ledger: a warning. Come forward. Kask answered with an invitation: come see the paperwork.",
      "The trap was already set. Kask had scheduled the slipway camera 'maintenance' a day in advance — murder filed as preventive upkeep. At the water's edge he stood behind the man who trusted procedure, and swung eighteen inches of marine-green steel from a locker only his key opens.",
      "Then the harbor betrayed him. He slid the body down the ramp into slack, low, neap-tide water — a harbormaster of twenty years who checked every table that night except the tide's. Dario went three hundred meters and waited for the dawn patrol.",
      "The brother's debts were real, and paid in full by 10:30 — from the cannery windows Enzo watched two figures become one. The union fight was real, and ended with an exoneration: 'Not you, Gus.' The lie that mattered wore the long harbor coat and said 'my books balance to the kilo' while a frightened clerk's shadow ledger initialed every crime I.K.",
      "He told you himself, Detective, without meaning to: the harbor takes the careless. It did.",
    ],
  },

  epilogue: [
    "Ivo Kask was arrested at his office window, watching the tide come in. He asked to lock the office himself. Voss allowed it.",
    "Sylvie Odum's shadow ledger convicted eleven shipments' worth of men in better coats. She testified for three days and slept, she says, for four.",
    "The Ledger ran the story under the byline D. BRANT, WITH F. MARLOWE. Marlowe kept the tip slip framed above his desk.",
    "Local 9 renamed the union hall for its treasurer. Gus Ferro gave the speech, plain words, and Enzo Brant held the watch — his brother's — while the whole pier stood quiet at low tide.",
  ],

  rewards: { xp: 260, unlockId: "tide-clock" },
};
