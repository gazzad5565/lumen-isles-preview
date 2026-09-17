"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { STAGES, type PiMode, type Screen } from "@/content/types";
import { Rich } from "./Math";

/* ---------------- Brand ---------------- */

export function Brand({ text = "Lumen Isles", href }: { text?: string; href?: string }) {
  const inner = (
    <>
      <div className="li-brand__mark" aria-hidden="true" />
      <span>{text}</span>
    </>
  );
  if (href)
    return (
      <Link href={href} className="li-brand" aria-label={`${text} — home`}>
        {inner}
      </Link>
    );
  return <div className="li-brand">{inner}</div>;
}

/* ---------------- Stage indicator (8 dots; Goal+Visual light together) ---------------- */

const SCREEN_TO_STAGES: Record<Screen, number[]> = {
  recall: [0],
  goalVisual: [1, 2],
  worked: [3],
  guided: [4],
  independent: [5],
  transfer: [6],
  recap: [7],
};

const STAGE_LABELS = ["Recall", "Goal", "Visual", "Worked", "Guided", "Indep.", "Transfer", "Recap"];

export function StageIndicator({ screen, skipTransfer }: { screen: Screen; skipTransfer?: boolean }) {
  const active = SCREEN_TO_STAGES[screen];
  const firstActive = Math.min(...active);
  return (
    <ol className="li-stages" aria-label={`Teaching loop: stage ${firstActive + 1} of 8, ${STAGE_LABELS[firstActive]}`} style={{ margin: 0, listStyle: "none" }}>
      {STAGES.map((s, i) => {
        const isActive = active.includes(i);
        const isDone = i < firstActive || (skipTransfer && i === 6 && firstActive > 6);
        const skipped = skipTransfer && i === 6;
        const connectorDone = i < firstActive;
        const connectorCurrent = i === 1 && screen === "goalVisual";
        return (
          <li key={s} style={{ display: "contents" }}>
            {i > 0 && <div className={`li-stage-connector ${connectorDone ? "is-done" : ""} ${connectorCurrent ? "is-current" : ""}`} aria-hidden="true" />}
            <div className={`li-stage-dot ${isActive ? "is-active" : ""} ${isDone && !isActive ? "is-done" : ""}`} aria-current={isActive ? "step" : undefined} style={skipped ? { opacity: 0.4 } : undefined}>
              <div className="li-stage-dot__n" aria-hidden="true">
                {isDone && !isActive ? "✓" : i + 1}
              </div>
              <div className="li-stage-dot__label">
                {STAGE_LABELS[i]}
                <span className="li-sr-only">{isActive ? " (current)" : isDone ? " (done)" : ""}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------- π badge ---------------- */

export function PiBadge({ mode }: { mode: PiMode }) {
  if (mode === "none") return null;
  const val = mode === "both" ? "3,14 · 22/7" : mode;
  return (
    <span className="li-pi-badge" aria-label={`Pi mode ${val}`}>
      π mode · <span className="li-pi-badge__val">{val}</span>
    </span>
  );
}

/* ---------------- Tutor card (static teaching voice; I do / We do / You do) ---------------- */

export function TutorCard({ label, copy, mode, gold, className }: { label: string; copy: string; mode?: string; gold?: boolean; className?: string }) {
  return (
    <div className={`li-tutor-card ${gold ? "li-tutor-card--gold" : ""} ${className ?? ""}`} role="note" aria-label={`Tutor: ${label}`}>
      <div className="li-tutor-mark" aria-hidden="true">
        ✦
      </div>
      <div style={{ minWidth: 0 }}>
        <span className="li-tutor-label">{label}</span>
        <Rich as="p" className="li-tutor-copy" text={copy} />
      </div>
      {mode ? <span className="li-tutor-mode">{mode}</span> : <span />}
    </div>
  );
}

/* ---------------- Modal (focus trap; Escape = secondary action) ---------------- */

export function Modal({ title, children, onEscape, labelledBy }: { title?: string; children: ReactNode; onEscape?: () => void; labelledBy: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const focusables = () => Array.from(el.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')).filter((f) => !f.hasAttribute("disabled"));
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        onEscape();
      }
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onEscape]);
  return (
    <div className="li-modal-backdrop">
      <div className="li-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={ref}>
        {title && (
          <h2 id={labelledBy} className="li-display" style={{ fontSize: "var(--li-text-2xl)", margin: "0 0 12px" }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}

/* ---------------- PIN pad ---------------- */

export function PinPad({ value, onChange, onSubmit, disabled, label }: { value: string; onChange: (v: string) => void; onSubmit: () => void; disabled?: boolean; label: string }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"];
  const press = (k: string) => {
    if (disabled) return;
    if (k === "⌫") onChange(value.slice(0, -1));
    else if (k === "✓") {
      if (value.length === 4) onSubmit();
    } else if (value.length < 4) onChange(value + k);
  };
  return (
    <div
      role="group"
      aria-label={label}
      onKeyDown={(e) => {
        if (disabled) return;
        if (/^\d$/.test(e.key)) {
          e.preventDefault();
          press(e.key);
        } else if (e.key === "Backspace") {
          e.preventDefault();
          press("⌫");
        } else if (e.key === "Enter" && value.length === 4) {
          e.preventDefault();
          onSubmit();
        }
      }}
    >
      <div className="li-pin-dots" aria-live="polite" aria-label={`PIN digit ${value.length} of 4 entered`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`li-pin-dot ${i < value.length ? "is-filled" : ""}`} />
        ))}
      </div>
      <div className="li-pin-pad">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            className="li-pin-key"
            onClick={() => press(k)}
            disabled={disabled || (k === "✓" && value.length < 4)}
            aria-label={k === "⌫" ? "Delete last digit" : k === "✓" ? "Confirm PIN" : `Digit ${k}`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Misc ---------------- */

export function Eyebrow({ children, tone = "teal" }: { children: ReactNode; tone?: "teal" | "gold" | "violet" }) {
  return <p className={`li-eyebrow ${tone === "gold" ? "li-eyebrow--gold" : tone === "violet" ? "li-eyebrow--violet" : ""}`}>{children}</p>;
}

export function Loading({ text = "Lighting the lanterns…" }: { text?: string }) {
  return (
    <div className="li-app li-bg-isles" style={{ alignItems: "center", justifyContent: "center" }} aria-busy="true" aria-live="polite">
      <div className="li-brand" style={{ fontSize: "var(--li-text-xl)" }}>
        <div className="li-brand__mark" /> {text}
      </div>
    </div>
  );
}

export function Toast({ text }: { text: string }) {
  return (
    <div className="li-toast" role="status" aria-live="polite">
      {text}
    </div>
  );
}
