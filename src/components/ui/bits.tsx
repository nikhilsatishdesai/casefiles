"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { audio } from "@/lib/audio/engine";
import { useGame } from "@/lib/engine/store";

/* ------------------------------------------------------------------ */
/* Buttons & labels                                                    */
/* ------------------------------------------------------------------ */

export function GhostButton({
  children,
  onClick,
  className = "",
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={() => {
        audio.ui("click");
        onClick?.();
      }}
      onMouseEnter={() => audio.ui("hover")}
      className={`btn-ghost font-label rounded-sm px-4 py-2.5 disabled:opacity-30 disabled:pointer-events-none ${className}`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={() => {
        audio.ui("click");
        onClick?.();
      }}
      onMouseEnter={() => audio.ui("hover")}
      className={`btn-primary font-label rounded-sm px-5 py-3 disabled:opacity-30 disabled:pointer-events-none ${className}`}
    >
      {children}
    </button>
  );
}

export function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-label text-[var(--steel)] ${className}`}>{children}</div>;
}

export function Kbd({ k }: { k: string }) {
  return (
    <span className="inline-block min-w-[1.4em] rounded-sm border border-[var(--line-strong)] px-1 text-center font-mono-doc text-[10px] leading-4 text-[var(--paper-dim)]">
      {k}
    </span>
  );
}

export function StarRow({ n, size = 18 }: { n: number; size?: number }) {
  return (
    <div className="flex gap-1" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <path
            d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.3 1.3-6.5L2.5 9.4l6.6-.8z"
            fill={i <= n ? "var(--amber)" : "transparent"}
            stroke={i <= n ? "var(--amber)" : "var(--steel-dim)"}
            strokeWidth="1.2"
          />
        </svg>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* First-time tips                                                     */
/* ------------------------------------------------------------------ */

/** A one-time pointer, remembered per detective once dismissed. */
export function Tip({
  id,
  title,
  children,
  className = "",
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const seen = useGame((s) => s.profile.seenTips.includes(id));
  const markTipSeen = useGame((s) => s.markTipSeen);
  return (
    <AnimatePresence>
      {!seen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ delay: 0.9, duration: 0.45 }}
          role="note"
          className={`glass-bright pointer-events-auto z-30 w-[min(92vw,380px)] rounded-sm border-[rgba(58,240,255,0.4)] p-4 shadow-[0_0_30px_rgba(58,240,255,0.15)] ${className}`}
        >
          <div className="font-label text-[var(--cyan)]">◆ {title}</div>
          <div className="mt-2 text-sm leading-relaxed text-[var(--paper-dim)]">{children}</div>
          <div className="mt-3 text-right">
            <button
              className="font-label text-[var(--amber)] hover:text-[var(--paper)]"
              onClick={() => {
                audio.ui("click");
                markTipSeen(id);
              }}
            >
              GOT IT
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */

export function ToastLayer() {
  const toast = useGame((s) => s.toast);
  const clearToast = useGame((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3400);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  const color =
    toast?.kind === "contradiction"
      ? "var(--rose)"
      : toast?.kind === "statement"
        ? "var(--teal)"
        : "var(--amber)";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 z-50 flex justify-center">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.text}
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="glass-bright rounded-sm px-5 py-2.5"
            style={{ borderColor: color }}
          >
            <span className="font-label" style={{ color }}>
              {toast.kind === "contradiction" ? "✕ " : toast.kind === "evidence" ? "◈ " : "▸ "}
              {toast.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* View scaffolding                                                    */
/* ------------------------------------------------------------------ */

export function ViewFade({ children, k }: { children: React.ReactNode; k: string }) {
  return (
    <motion.div
      key={k}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0"
    >
      {children}
    </motion.div>
  );
}

export function TypeLines({
  lines,
  className = "",
  cps = 40,
  onDone,
}: {
  lines: string[];
  className?: string;
  cps?: number;
  onDone?: () => void;
}) {
  // Renders lines with a staggered rise; typing sound flavor handled by CSS caret.
  return (
    <div className={className}>
      {lines.map((line, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 + i * 0.55, duration: 0.6, ease: "easeOut" }}
          onAnimationComplete={i === lines.length - 1 ? onDone : undefined}
          className="mb-4 leading-relaxed"
        >
          {line}
        </motion.p>
      ))}
    </div>
  );
}

