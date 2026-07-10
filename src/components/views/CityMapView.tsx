"use client";

import { motion } from "framer-motion";
import PixelStage from "@/components/PixelStage";
import { useGame, activeCase } from "@/lib/engine/store";
import { cityLocation, CITY_NAME } from "@/lib/city/veilport";
import { Label } from "@/components/ui/bits";
import { audio } from "@/lib/audio/engine";

export default function CityMapView() {
  const caseDef = useGame((s) => activeCase(s));
  const progress = useGame((s) => (s.activeCaseId ? s.progress[s.activeCaseId] : null));
  const goToLocation = useGame((s) => s.goToLocation);
  if (!caseDef || !progress) return null;

  const found = progress.foundEvidence;

  return (
    <div className="absolute inset-0">
      <PixelStage scene="skyline" weather={caseDef.weather} timeOfDay={caseDef.timeOfDay} seedKey={caseDef.id} dim={0.72} animated />
      <div className="vignette" />

      <div className="absolute inset-0 flex flex-col px-4 pb-28 pt-[7vh] md:px-10">
        <header className="flex items-end justify-between">
          <div>
            <Label>THE CITY OF {CITY_NAME.toUpperCase()}</Label>
            <h2 className="mt-1 font-display text-xl text-[var(--paper)] md:text-2xl">
              {caseDef.title}
            </h2>
          </div>
          <Label className="hidden md:block">
            {caseDef.weather.kind.toUpperCase()} · {caseDef.timeOfDay.toUpperCase()} · CHOOSE A DESTINATION
          </Label>
        </header>

        {/* map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="glass relative mx-auto mt-6 aspect-[16/10] w-full max-w-4xl flex-shrink rounded-sm"
        >
          {/* blueprint texture */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 62" preserveAspectRatio="none" aria-hidden>
            <defs>
              <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M5 0H0v5" fill="none" stroke="rgba(138,151,168,0.10)" strokeWidth="0.15" />
              </pattern>
            </defs>
            <rect width="100" height="62" fill="url(#grid)" />
            {/* the bay */}
            <path
              d="M0,34 C10,36 12,44 8,52 C6,58 2,60 0,62 L0,34 Z M0,34 C6,32 10,28 8,20 L0,16 Z"
              fill="rgba(46,90,110,0.25)"
              stroke="rgba(79,216,196,0.3)"
              strokeWidth="0.3"
            />
            <path d="M2 40 h3 M3 46 h4 M2 52 h3" stroke="rgba(79,216,196,0.25)" strokeWidth="0.3" />
            {/* rail line */}
            <path
              d="M14,58 C30,48 44,44 58,37 C70,32 84,22 96,12"
              fill="none"
              stroke="rgba(232,226,212,0.16)"
              strokeWidth="0.4"
              strokeDasharray="1.4 1"
            />
            {/* district hints */}
            <text x="16" y="45" fill="rgba(138,151,168,0.4)" fontSize="2.2" letterSpacing="0.4">OLD HARBOR</text>
            <text x="48" y="24" fill="rgba(138,151,168,0.4)" fontSize="2.2" letterSpacing="0.4">FINANCIAL</text>
            <text x="66" y="12" fill="rgba(138,151,168,0.4)" fontSize="2.2" letterSpacing="0.4">UNIVERSITY HILL</text>
            <text x="40" y="38" fill="rgba(138,151,168,0.4)" fontSize="2.2" letterSpacing="0.4">DOWNTOWN</text>
            <text x="20" y="57" fill="rgba(138,151,168,0.4)" fontSize="2.2" letterSpacing="0.4">INDUSTRIAL</text>
            <text x="76" y="40" fill="rgba(138,151,168,0.4)" fontSize="2.2" letterSpacing="0.4">ROWAN HEIGHTS</text>
          </svg>

          {/* location nodes */}
          {caseDef.locations.map((loc, i) => {
            const city = cityLocation(loc.locationId);
            const locked = loc.locked && !found.includes(loc.locked.untilEvidence);
            const visited = progress.visitedLocations.includes(loc.locationId);
            const peopleCount = loc.peopleHere.length;
            const evidenceLeft = loc.hotspots.filter(
              (h) => h.evidenceId && !found.includes(h.evidenceId)
            ).length;
            return (
              <motion.button
                key={loc.locationId}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300, damping: 22 }}
                onClick={() => {
                  if (locked) {
                    audio.ui("wrong");
                    return;
                  }
                  goToLocation(loc.locationId);
                }}
                onMouseEnter={() => audio.ui("hover")}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${city.mapX}%`, top: `${city.mapY * 0.92 + 4}%` }}
                aria-label={`${city.name}${locked ? " (locked)" : ""}`}
              >
                <span
                  className={`block h-3.5 w-3.5 rotate-45 border transition-all duration-300 group-hover:scale-125 ${
                    locked
                      ? "border-[var(--steel-dim)] bg-transparent"
                      : visited && evidenceLeft === 0
                        ? "border-[var(--steel)] bg-[rgba(138,151,168,0.4)]"
                        : "border-[var(--amber)] bg-[rgba(232,168,73,0.35)]"
                  } ${!visited && !locked ? "pulse-soft" : ""}`}
                />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap text-center opacity-80 transition-all duration-300 group-hover:opacity-100">
                  <span className={`font-label block ${locked ? "text-[var(--steel-dim)]" : "text-[var(--paper)]"}`}>
                    {city.name}
                  </span>
                  <span className="font-label block text-[9px] text-[var(--steel)]">
                    {locked
                      ? "◇ NO ACCESS YET"
                      : `${peopleCount > 0 ? `${peopleCount} PERSON${peopleCount > 1 ? "S" : ""} · ` : ""}${
                          evidenceLeft > 0 ? `${evidenceLeft} LEAD${evidenceLeft > 1 ? "S" : ""}` : "SEARCHED"
                        }`}
                  </span>
                </span>
                {locked && (
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-sm bg-[rgba(4,6,10,0.95)] p-2 text-[11px] leading-snug text-[var(--paper-dim)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {loc.locked!.note}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
