"use client";

import dynamic from "next/dynamic";

/**
 * The entire game is a client experience — scenes are painted on canvas,
 * audio is synthesized live, and saves live in the browser. We load it
 * dynamically so the shell paints instantly and PixiJS never touches SSR.
 */
const Game = dynamic(() => import("@/components/Game"), {
  ssr: false,
  loading: () => (
    <main className="fixed inset-0 flex items-center justify-center bg-[#0a0714]">
      <div className="text-center">
        <div className="font-display text-2xl tracking-[0.4em] text-[#c9c2b0]">CASEFILES</div>
        <div className="pulse-soft mt-4 font-label text-[#4a5568]">RAIN ON THE WAY…</div>
      </div>
    </main>
  ),
});

export default function Page() {
  return <Game />;
}
