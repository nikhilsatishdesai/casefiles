"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Portrait from "@/components/Portrait";
import type { IsoStageApi, TargetState } from "@/components/IsoStage";
import { useGame, activeCase } from "@/lib/engine/store";
import { cityLocation } from "@/lib/city/veilport";
import { Label, GhostButton } from "@/components/ui/bits";
import { audio } from "@/lib/audio/engine";
import type { HotspotDef } from "@/lib/engine/types";
import type { IsoTarget } from "@/lib/iso/types";
import { buildScene } from "@/lib/iso/build";
import { useEscapeLayer } from "@/components/ui/escape";

const IsoStage = dynamic(() => import("@/components/IsoStage"), { ssr: false });

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
  useEscapeLayer(!!openSpot, () => setOpenSpot(null));
  const apiRef = useRef<IsoStageApi | null>(null);

  const loc = caseDef?.locations.find((l) => l.locationId === locationId);
  const city = useMemo(() => (loc ? cityLocation(loc.locationId) : null), [loc]);
  const scene = useMemo(() => (caseDef && loc ? buildScene(caseDef, loc) : null), [caseDef, loc]);

  const found = progress?.foundEvidence;
  const inspected = progress?.inspectedHotspots;
  const runtimes = progress?.suspectRuntimes;
  const states = useMemo(() => {
    const st: Record<string, TargetState> = {};
    if (!loc || !found || !inspected) return st;
    for (const h of loc.hotspots) {
      st[h.id] = {
        visible: !h.requiresEvidence || h.requiresEvidence.every((e) => found.includes(e)),
        inspected: inspected.includes(h.id),
        evidence: !!h.evidenceId && !found.includes(h.evidenceId),
      };
    }
    for (const pid of loc.peopleHere) st[pid] = { visible: true, inspected: false, evidence: false, talked: !!runtimes?.[pid]?.greeted };
    return st;
  }, [loc, found, inspected, runtimes]);

  const openHotspot = useCallback(
    (h: HotspotDef) => {
      audio.ui("paper");
      inspectHotspot(h.id);
      setOpenSpot(h);
      setShowArrival(false);
      if (h.evidenceId) collectEvidence(h.evidenceId);
    },
    [inspectHotspot, collectEvidence]
  );

  const onInteract = useCallback(
    (t: IsoTarget) => {
      if (!loc) return;
      if (t.kind === "exit") {
        audio.ui("travel");
        setView("citymap");
        return;
      }
      if (t.kind === "npc") {
        audio.ui("click");
        talkTo(t.id);
        return;
      }
      const h = loc.hotspots.find((x) => x.id === t.id);
      if (h) openHotspot(h);
    },
    [loc, setView, talkTo, openHotspot]
  );

  const onActivity = useCallback(() => setShowArrival(false), []);

  if (!caseDef || !loc || !city || !progress || !scene) return null;

  const visibleSpots = loc.hotspots.filter((h) => states[h.id]?.visible);
  const remaining = visibleSpots.filter((h) => h.evidenceId && !progress.foundEvidence.includes(h.evidenceId)).length;
  const unseen = visibleSpots.filter((h) => !progress.inspectedHotspots.includes(h.id)).length;

  return (
    <div className="absolute inset-0">
      <IsoStage
        scene={scene}
        states={states}
        weather={caseDef.weather}
        timeOfDay={caseDef.timeOfDay}
        paused={!!openSpot}
        onInteract={onInteract}
        onActivity={onActivity}
        apiRef={apiRef}
      />
      <div className="vignette pointer-events-none" />

      {/* header */}
      <div className="pointer-events-none absolute left-0 right-0 top-[6vh] z-10 px-4 md:px-10">
        <div className="flex items-start justify-between gap-4">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <Label className="text-[#5af0ff]">{city.district.toUpperCase()}</Label>
            <h2 className="mt-1 font-display text-lg text-[var(--paper)] [text-shadow:0_0_18px_rgba(255,46,136,0.45)] md:text-2xl">{city.name}</h2>
            {loc.sublabel && <div className="mt-1 text-sm text-[#ffc46b]">{loc.sublabel}</div>}
            <div className="font-label mt-3 flex flex-wrap gap-2 text-[var(--paper-dim)]">
              {remaining > 0 ? (
                <span className="marker border-[rgba(255,196,107,0.5)] text-[#ffc46b]">◆ {remaining} to find here</span>
              ) : (
                <span className="marker border-[rgba(90,240,255,0.35)] text-[#7af4ff]">◆ scene searched</span>
              )}
              {unseen > 0 && <span className="marker border-[var(--line-strong)]">{unseen} unexamined</span>}
            </div>
          </motion.div>
          <div className="pointer-events-auto">
            <GhostButton onClick={() => setView("citymap")}>← CITY MAP</GhostButton>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="font-label pointer-events-none absolute right-4 top-[calc(6vh+52px)] z-10 hidden text-right leading-6 text-[var(--steel)] md:right-10 md:block">
        <div>
          <span className="iso-key mr-2">WASD</span>
          <span className="iso-key mr-2">↑↓←→</span>walk
        </div>
        <div>
          <span className="iso-key mr-2">CLICK</span>walk / use
        </div>
        <div>
          <span className="iso-key mr-2">SPACE</span>inspect · talk
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
            className="glass absolute bottom-[calc(var(--hud-clear)+12px)] left-1/2 z-20 w-[min(92%,640px)] -translate-x-1/2 cursor-pointer rounded-sm border-[rgba(255,46,136,0.25)] p-5 text-left"
          >
            <p className="text-[15px] italic leading-relaxed text-[var(--paper-dim)]">{loc.arrivalText}</p>
            <div className="font-label mt-3 text-right text-[var(--steel-dim)]">MOVE OR CLICK TO BEGIN</div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* people here — tap to walk over and talk */}
      {loc.peopleHere.length > 0 && (
        <div className="absolute bottom-[calc(var(--hud-clear)+64px)] right-3 z-10 flex flex-col gap-2 md:right-8">
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
                onClick={() => {
                  setShowArrival(false);
                  if (apiRef.current) apiRef.current.walkTo(pid);
                  else talkTo(pid);
                }}
                onMouseEnter={() => audio.ui("hover")}
                className="glass group flex items-center gap-2 rounded-sm p-1.5 pr-3 text-left transition-all duration-300 hover:border-[rgba(255,46,136,0.55)]"
                aria-label={`Talk to ${person.name}`}
              >
                <Portrait def={person.portrait} seed={person.id} size={36} mood={(rt?.mood as never) ?? "neutral"} />
                <span className="hidden sm:block">
                  <span className="block text-xs text-[var(--paper)]">{person.name}</span>
                  <span className="font-label block text-[var(--steel)]">
                    {person.isWitness ? "WITNESS" : "SUSPECT"} · {rt?.greeted ? "TALK AGAIN" : "TALK"}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* inspection panel */}
      <AnimatePresence>
        {openSpot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(6,3,14,0.55)] p-4"
            onClick={() => setOpenSpot(null)}
          >
            <motion.div
              initial={{ y: 30, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="glass-bright w-full max-w-lg rounded-sm border-[rgba(90,240,255,0.25)] p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <Label className={openSpot.evidenceId ? "text-[#ffc46b]" : "text-[#7af4ff]"}>
                {openSpot.evidenceId ? "◆ EVIDENCE SECURED" : "OBSERVATION"}
              </Label>
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
