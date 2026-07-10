"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PixelStage, { StageOverlay } from "@/components/PixelStage";
import Portrait from "@/components/Portrait";
import { useGame, activeCase } from "@/lib/engine/store";
import { cityLocation } from "@/lib/city/veilport";
import { Label, GhostButton } from "@/components/ui/bits";
import { audio } from "@/lib/audio/engine";
import type { HotspotDef } from "@/lib/engine/types";

export default function LocationView() {
  const caseDef = useGame((s) => activeCase(s));
  const locationId = useGame((s) => s.activeLocationId);
  const progress = useGame((s) => (s.activeCaseId ? s.progress[s.activeCaseId] : null));
  const inspectHotspot = useGame((s) => s.inspectHotspot);
  const collectEvidence = useGame((s) => s.collectEvidence);
  const talkTo = useGame((s) => s.talkTo);
  const setView = useGame((s) => s.setView);

  const [openSpot, setOpenSpot] = useState<HotspotDef | null>(null);
  const [showArrival, setShowArrival] = useState(true);

  const loc = caseDef?.locations.find((l) => l.locationId === locationId);
  const city = useMemo(() => (loc ? cityLocation(loc.locationId) : null), [loc]);
  if (!caseDef || !loc || !city || !progress) return null;

  const found = progress.foundEvidence;
  const visibleSpots = loc.hotspots.filter(
    (h) => !h.requiresEvidence || h.requiresEvidence.every((e) => found.includes(e))
  );

  const openHotspot = (h: HotspotDef) => {
    audio.ui("paper");
    inspectHotspot(h.id);
    setOpenSpot(h);
    setShowArrival(false);
    if (h.evidenceId) collectEvidence(h.evidenceId);
  };

  return (
    <div className="absolute inset-0">
      <PixelStage
        scene={city.scene}
        weather={caseDef.weather}
        timeOfDay={caseDef.timeOfDay}
        seedKey={`${caseDef.id}:${loc.locationId}`}
      />
      <div className="vignette" />

      {/* header */}
      <div className="absolute left-0 right-0 top-[6vh] z-10 px-6 md:px-10">
        <div className="flex items-start justify-between">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <Label>{city.district.toUpperCase()}</Label>
            <h2 className="mt-1 font-display text-xl text-[var(--paper)] md:text-2xl">{city.name}</h2>
            {loc.sublabel && <div className="mt-1 text-sm text-[var(--amber)]">{loc.sublabel}</div>}
          </motion.div>
          <GhostButton onClick={() => setView("citymap")}>← CITY MAP</GhostButton>
        </div>
      </div>

      {/* arrival narration */}
      <AnimatePresence>
        {showArrival && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            onClick={() => setShowArrival(false)}
            className="glass absolute bottom-28 left-1/2 z-10 w-[min(92%,640px)] -translate-x-1/2 cursor-pointer rounded-sm p-5 text-left"
          >
            <p className="text-[15px] italic leading-relaxed text-[var(--paper-dim)]">{loc.arrivalText}</p>
            <div className="font-label mt-3 text-right text-[var(--steel-dim)]">CLICK TO DISMISS</div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* hotspots — glued to the scene rectangle */}
      <StageOverlay className="z-10">
      {visibleSpots.map((h, i) => {
        const inspected = progress.inspectedHotspots.includes(h.id);
        const hasEvidence = h.evidenceId && !found.includes(h.evidenceId);
        return (
          <motion.button
            key={h.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => openHotspot(h)}
            onMouseEnter={() => audio.ui("hover")}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            aria-label={`Inspect: ${h.label}`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-300 group-hover:scale-110 ${
                hasEvidence
                  ? "border-[var(--amber)] bg-[rgba(232,168,73,0.14)] pulse-soft"
                  : inspected
                    ? "border-[rgba(138,151,168,0.4)] bg-[rgba(10,14,20,0.4)]"
                    : "border-[var(--paper-dim)] bg-[rgba(10,14,20,0.5)]"
              }`}
            >
              <span className={`text-xs ${hasEvidence ? "text-[var(--amber)]" : "text-[var(--paper-dim)]"}`}>
                {inspected && !hasEvidence ? "·" : "+"}
              </span>
            </span>
            <span className="font-label pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-[var(--paper)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {h.label}
            </span>
          </motion.button>
        );
      })}
      </StageOverlay>

      {/* people here */}
      <div className="absolute bottom-24 right-4 z-10 flex flex-col gap-3 md:right-8">
        {loc.peopleHere.map((pid, i) => {
          const person = caseDef.suspects.find((x) => x.id === pid);
          if (!person) return null;
          const rt = progress.suspectRuntimes[pid];
          return (
            <motion.button
              key={pid}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.15, duration: 0.5 }}
              onClick={() => talkTo(pid)}
              onMouseEnter={() => audio.ui("hover")}
              className="glass group flex items-center gap-3 rounded-sm p-2 pr-4 text-left transition-all duration-300 hover:border-[rgba(232,168,73,0.5)]"
              aria-label={`Talk to ${person.name}`}
            >
              <Portrait def={person.portrait} seed={person.id} size={44} mood={(rt?.mood as never) ?? "neutral"} />
              <span>
                <span className="block text-sm text-[var(--paper)]">{person.name}</span>
                <span className="font-label block text-[var(--steel)]">
                  {person.isWitness ? "WITNESS" : "SUSPECT"} · TALK
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* inspection panel */}
      <AnimatePresence>
        {openSpot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(4,6,10,0.6)] p-4"
            onClick={() => setOpenSpot(null)}
          >
            <motion.div
              initial={{ y: 30, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="glass-bright w-full max-w-lg rounded-sm p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <Label className="text-[var(--amber)]">{openSpot.evidenceId ? "◈ EVIDENCE SECURED" : "OBSERVATION"}</Label>
              <h3 className="mt-2 font-display text-lg text-[var(--paper)]">{openSpot.label}</h3>
              <p className="mt-4 leading-relaxed text-[var(--paper-dim)]">{openSpot.description}</p>
              <div className="mt-6 flex justify-end gap-3">
                {openSpot.evidenceId && (
                  <GhostButton
                    onClick={() => {
                      setOpenSpot(null);
                      useGame.getState().openEvidence(openSpot.evidenceId!);
                      setView("evidence");
                    }}
                  >
                    EXAMINE IN CASE FILE
                  </GhostButton>
                )}
                <GhostButton onClick={() => setOpenSpot(null)}>CLOSE</GhostButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
