"use client";

import { motion } from "framer-motion";
import PixelStage from "@/components/PixelStage";
import Portrait from "@/components/Portrait";
import { useGame, activeCase } from "@/lib/engine/store";
import { RECURRING_CAST } from "@/lib/city/veilport";
import { PrimaryButton, Label, TypeLines } from "@/components/ui/bits";

/* ------------------------------------------------------------------ */
/* The morning paper                                                   */
/* ------------------------------------------------------------------ */

export function NewspaperView() {
  const setView = useGame((s) => s.setView);
  const caseDef = useGame((s) => activeCase(s));
  if (!caseDef) return null;
  const paper = caseDef.newspaper;

  return (
    <div className="absolute inset-0">
      <PixelStage
        scene="street"
        weather={caseDef.weather}
        timeOfDay={caseDef.timeOfDay}
        seedKey={caseDef.id}
        dim={0.55}
      />
      <div className="vignette" />
      <div className="absolute inset-0 flex items-center justify-center overflow-y-auto scroll-thin px-4 py-[6vh]">
        <motion.article
          initial={{ opacity: 0, y: 60, rotate: -1.5, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="paper-doc my-auto w-full max-w-2xl rounded-[2px] px-8 py-8 md:px-12 md:py-10"
        >
          <header className="border-b-2 border-[#211c14] pb-3 text-center">
            <div className="font-serif-doc text-3xl font-bold tracking-wide md:text-4xl">
              The Veilport Ledger
            </div>
            <div className="mt-1 flex justify-between font-mono-doc text-[10px] uppercase tracking-widest text-[#5a5142]">
              <span>{paper.date}</span>
              <span>City Edition · 5¢</span>
              <span>Since 1871</span>
            </div>
          </header>

          <h1 className="font-serif-doc mt-6 text-2xl font-black leading-tight md:text-4xl">
            {paper.headline}
          </h1>
          <p className="font-serif-doc mt-2 text-sm italic text-[#4a4234] md:text-base">
            {paper.subhead}
          </p>
          <div className="mt-2 font-mono-doc text-[10px] uppercase tracking-widest text-[#5a5142]">
            By F. Marlowe, Crime Desk
          </div>

          <div className="mt-5 gap-6 md:columns-2">
            {paper.body.map((p, i) => (
              <p key={i} className="font-serif-doc mb-3 text-justify text-[13px] leading-relaxed md:text-sm">
                {i === 0 ? (
                  <>
                    <span className="float-left mr-1 font-serif-doc text-4xl font-black leading-[0.85]">
                      {p.charAt(0)}
                    </span>
                    {p.slice(1)}
                  </>
                ) : (
                  p
                )}
              </p>
            ))}
            <aside className="mt-4 border border-[#5a5142] p-3">
              <div className="font-mono-doc text-[10px] font-bold uppercase tracking-widest">
                {paper.sidebar.title}
              </div>
              <p className="font-serif-doc mt-1 text-[12px] italic leading-snug">{paper.sidebar.body}</p>
            </aside>
          </div>

          <div className="mt-8 flex justify-center border-t border-[#5a5142] pt-6">
            <PrimaryButton className="btn-on-paper" onClick={() => setView("briefing")}>
              REPORT TO CAPTAIN VOSS →
            </PrimaryButton>
          </div>
        </motion.article>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The captain's briefing                                              */
/* ------------------------------------------------------------------ */

export function BriefingView() {
  const setView = useGame((s) => s.setView);
  const caseDef = useGame((s) => activeCase(s));
  if (!caseDef) return null;
  const officer = RECURRING_CAST[caseDef.briefing.officerId];

  return (
    <div className="absolute inset-0">
      <PixelStage scene="precinct" weather={caseDef.weather} timeOfDay={caseDef.timeOfDay} seedKey={caseDef.id} dim={0.35} />
      <div className="vignette" />
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="glass-bright flex w-full max-w-3xl flex-col gap-6 rounded-sm p-8 md:flex-row md:p-10"
        >
          <div className="flex flex-col items-center gap-3 md:w-48">
            <Portrait def={officer.portrait} seed={officer.id} size={120} mood="calm" />
            <div className="text-center">
              <div className="text-sm text-[var(--paper)]">{officer.name}</div>
              <div className="mt-0.5 font-label text-[var(--steel)]">{officer.role}</div>
            </div>
          </div>
          <div className="flex-1">
            <Label className="text-[var(--amber)]">CASE BRIEFING · EPISODE {String(caseDef.number).padStart(2, "0")}</Label>
            <h2 className="mt-2 font-display text-2xl text-[var(--paper)]">{caseDef.title}</h2>
            <TypeLines
              lines={caseDef.briefing.lines}
              className="mt-5 text-[15px] text-[var(--paper-dim)]"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + caseDef.briefing.lines.length * 0.55 }}
              className="mt-6"
            >
              <PrimaryButton onClick={() => setView("citymap")}>TAKE THE CASE →</PrimaryButton>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
