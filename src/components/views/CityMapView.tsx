"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import type { Beacon, CityLayout } from "@/components/CityStage";
import { useGame, activeCase } from "@/lib/engine/store";
import { cityLocation, CITY_NAME } from "@/lib/city/veilport";
import { Label } from "@/components/ui/bits";
import { audio } from "@/lib/audio/engine";

const CityStage = dynamic(() => import("@/components/CityStage"), { ssr: false });

interface Row {
  id: string;
  name: string;
  district: string;
  sublabel?: string;
  locked: boolean;
  note?: string;
  visited: boolean;
  leads: number;
  people: number;
  color: string;
  status: string;
}

const COLORS = { locked: "#7a7a9a", leads: "#ffb43d", fresh: "#ff2e88", searched: "#5af0ff" };

export default function CityMapView() {
  const caseDef = useGame((s) => activeCase(s));
  const progress = useGame((s) => (s.activeCaseId ? s.progress[s.activeCaseId] : null));
  const goToLocation = useGame((s) => s.goToLocation);
  const [layout, setLayout] = useState<CityLayout | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [note, setNote] = useState<{ name: string; text: string } | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const rows: Row[] = useMemo(() => {
    if (!caseDef || !progress) return [];
    const found = progress.foundEvidence;
    return caseDef.locations.map((loc) => {
      const city = cityLocation(loc.locationId);
      const locked = !!loc.locked && !found.includes(loc.locked.untilEvidence);
      const visited = progress.visitedLocations.includes(loc.locationId);
      // only count what can actually be found right now
      const leads = loc.hotspots.filter(
        (h) => h.evidenceId && !found.includes(h.evidenceId) && (!h.requiresEvidence || h.requiresEvidence.every((e) => found.includes(e)))
      ).length;
      const people = loc.peopleHere.length;
      const color = locked ? COLORS.locked : leads > 0 ? COLORS.leads : !visited ? COLORS.fresh : COLORS.searched;
      const status = locked
        ? "NO ACCESS YET"
        : [people ? `${people} ${people > 1 ? "PEOPLE" : "PERSON"}` : "", leads ? `${leads} LEAD${leads > 1 ? "S" : ""}` : visited ? "SEARCHED" : "UNVISITED"]
            .filter(Boolean)
            .join(" · ");
      return { id: loc.locationId, name: city.name, district: city.district, sublabel: loc.sublabel, locked, note: loc.locked?.note, visited, leads, people, color, status };
    });
  }, [caseDef, progress]);

  const beacons: Beacon[] = useMemo(
    () => rows.map((r) => ({ id: r.id, color: r.color, strength: r.locked ? 0.3 : r.leads > 0 || !r.visited ? 1 : 0.55 })),
    [rows]
  );

  // keep labels from piling on each other
  const placed = useMemo(() => {
    if (!layout) return [];
    const boxes: { x: number; y: number; w: number; h: number }[] = [];
    const out: { row: Row; mx: number; my: number; lx: number; ly: number }[] = [];
    const items = rows
      .map((row) => {
        const sp = layout.spots[row.id];
        if (!sp) return null;
        return { row, mx: sp.x * layout.scale + layout.x, my: sp.y * layout.scale + layout.y };
      })
      .filter(Boolean) as { row: Row; mx: number; my: number }[];
    items.sort((a, b) => a.my - b.my);
    // every marker is an obstacle, so no label ever hides a destination
    for (const it of items) boxes.push({ x: it.mx - 13, y: it.my - 13, w: 26, h: 26 });
    const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
    const panel = vw >= 768 ? { x: vw - 340, y: 0, w: 340, h: 99999 } : null;
    if (panel) boxes.push(panel);
    for (const it of items) {
      const w = Math.max(it.row.name.length * 9, it.row.status.length * 7.4) + 20;
      const h = 34;
      const cands = [
        { x: it.mx - w / 2, y: it.my - h - 16 },
        { x: it.mx + 14, y: it.my - h / 2 },
        { x: it.mx - w - 14, y: it.my - h / 2 },
        { x: it.mx - w / 2, y: it.my + 14 },
        { x: it.mx + 14, y: it.my - h - 6 },
        { x: it.mx - w - 14, y: it.my - h - 6 },
        { x: it.mx + 14, y: it.my + 6 },
        { x: it.mx - w - 14, y: it.my + 6 },
        { x: it.mx - w / 2, y: it.my - h - 52 },
        { x: it.mx - w / 2, y: it.my + 50 },
      ];
      const hit = (c: { x: number; y: number }) =>
        c.x < 4 || c.x + w > vw - 4 || boxes.some((b) => c.x < b.x + b.w && c.x + w > b.x && c.y < b.y + b.h && c.y + h > b.y);
      const c = cands.find((cc) => !hit(cc)) ?? cands[0];
      boxes.push({ x: c.x, y: c.y, w, h });
      out.push({ ...it, lx: c.x, ly: c.y });
    }
    return out;
  }, [layout, rows]);

  if (!caseDef || !progress) return null;

  const travel = (r: Row) => {
    if (r.locked) {
      audio.ui("wrong");
      setNote({ name: r.name, text: r.note ?? "" });
      return;
    }
    audio.ui("travel");
    goToLocation(r.id);
  };

  return (
    <div className="absolute inset-0">
      <CityStage weather={caseDef.weather} beacons={beacons} hovered={hovered} onLayout={setLayout} insetRight={300} />
      <div className="vignette pointer-events-none" />

      {/* header */}
      <header className="pointer-events-none absolute left-0 right-0 top-[6vh] z-10 flex items-start justify-between px-4 md:px-10">
        <div>
          <Label className="text-[#5af0ff]">THE CITY OF {CITY_NAME.toUpperCase()}</Label>
          <h2 className="mt-1 font-display text-xl text-[var(--paper)] [text-shadow:0_0_18px_rgba(255,46,136,0.45)] md:text-2xl">{caseDef.title}</h2>
          <div className="font-label mt-1 text-[var(--steel)]">
            {caseDef.weather.kind.toUpperCase()} · {caseDef.timeOfDay.toUpperCase()} · CHOOSE A DESTINATION
          </div>
        </div>
        <div className="font-label hidden gap-4 text-[var(--steel)] lg:flex">
          {(
            [
              [COLORS.leads, "LEADS"],
              [COLORS.fresh, "UNVISITED"],
              [COLORS.searched, "SEARCHED"],
              [COLORS.locked, "NO ACCESS"],
            ] as const
          ).map(([c, l]) => (
            <span key={l} className="flex items-center gap-1.5">
              <i className="inline-block h-2 w-2 rotate-45" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
              {l}
            </span>
          ))}
        </div>
      </header>

      {/* labels, then markers above them — a destination is never buried */}
      <div className="absolute inset-0 z-10">
        {placed.map(({ row, lx, ly }, i) => (
          <motion.button
            key={`l-${row.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 + i * 0.06 }}
            onClick={() => travel(row)}
            onMouseEnter={() => setHovered(row.id)}
            onMouseLeave={() => setHovered(null)}
            tabIndex={-1}
            className={`absolute hidden whitespace-nowrap rounded-sm px-2 py-1 text-left backdrop-blur-sm transition-colors duration-200 sm:block ${
              hovered === row.id ? "bg-[rgba(20,10,36,0.92)]" : "bg-[rgba(10,6,20,0.72)]"
            }`}
            style={{ left: lx, top: ly, border: `1px solid ${row.color}${hovered === row.id ? "cc" : "55"}` }}
          >
            <span className={`font-label block ${row.locked ? "text-[var(--steel)]" : "text-[var(--paper)]"}`}>{row.name}</span>
            <span className="block text-[9px] tracking-[0.16em]" style={{ color: row.color }}>
              {row.status}
            </span>
          </motion.button>
        ))}
        {placed.map(({ row, mx, my }, i) => (
          <motion.button
            key={row.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + i * 0.06, type: "spring", stiffness: 320, damping: 20 }}
            onClick={() => travel(row)}
            onMouseEnter={() => {
              setHovered(row.id);
              audio.ui("hover");
            }}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(row.id)}
            onBlur={() => setHovered(null)}
            className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{ left: mx, top: my }}
            aria-label={`${row.name}${row.locked ? " (locked)" : ""}`}
          >
            <span
              className="block h-3 w-3 border-2 transition-transform duration-200"
              style={{
                borderColor: row.color,
                background: row.locked ? "transparent" : `${row.color}55`,
                boxShadow: `0 0 ${hovered === row.id ? 18 : 10}px ${row.color}`,
                transform: `rotate(45deg) scale(${hovered === row.id ? 1.35 : 1})`,
              }}
            />
          </motion.button>
        ))}
      </div>

      {/* destinations */}
      <aside className="absolute bottom-[calc(var(--hud-clear)+8px)] right-3 z-20 w-[min(92vw,300px)] md:right-8">
        <button
          onClick={() => setListOpen((v) => !v)}
          className="glass font-label flex w-full items-center justify-between rounded-sm px-3 py-2 text-[var(--paper-dim)] hover:text-[var(--paper)] md:hidden"
        >
          DESTINATIONS ({rows.length}) <span>{listOpen ? "▾" : "▴"}</span>
        </button>
        <div className={`glass mt-1 max-h-[46vh] overflow-y-auto rounded-sm p-2 scroll-thin md:mt-0 md:block ${listOpen ? "block" : "hidden"}`}>
          <Label className="hidden px-2 pb-1 pt-1 md:block">DESTINATIONS</Label>
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => travel(r)}
              onMouseEnter={() => setHovered(r.id)}
              onMouseLeave={() => setHovered(null)}
              className={`flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left transition-colors ${hovered === r.id ? "bg-[rgba(255,255,255,0.06)]" : ""}`}
            >
              <i className="inline-block h-2 w-2 shrink-0 rotate-45" style={{ background: r.color, boxShadow: `0 0 8px ${r.color}` }} />
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[13px] ${r.locked ? "text-[var(--steel)]" : "text-[var(--paper)]"}`}>{r.name}</span>
                <span className="font-label block truncate text-[9px]" style={{ color: r.color }}>
                  {r.status}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* why a door is shut */}
      <AnimatePresence>
        {note && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="glass-bright absolute left-1/2 top-[22vh] z-30 w-[min(92vw,420px)] -translate-x-1/2 rounded-sm border-[rgba(122,122,154,0.5)] p-5"
            onClick={() => setNote(null)}
          >
            <Label className="text-[var(--steel)]">◇ NO ACCESS YET · {note.name.toUpperCase()}</Label>
            <p className="mt-2 text-sm leading-relaxed text-[var(--paper-dim)]">{note.text}</p>
            <div className="font-label mt-3 text-right text-[var(--steel-dim)]">TAP TO DISMISS</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
