"use client";

import { useEffect, useRef, useState } from "react";
import type { Item, Lesson, Screen } from "@/content/types";
import { checkAnswer } from "@/lib/checker";
import type { ItemAttempt } from "@/lib/progress";
import { Rich } from "../Math";
import { Diagram } from "../Diagram";
import { CirclePartsHotspot } from "../CirclePartsHotspot";
import { TutorCard, Modal } from "../ui";
import { getLesson } from "@/content";

export interface ItemOutcome {
  attempt: ItemAttempt;
}

const MODE_LABEL: Record<string, { label: string; copy: string; mode: string; gold?: boolean } | undefined> = {
  guided: {
    label: "Your tutor · we’ll do this one together",
    copy: "You choose the next step. If you pause, open one hint at a time and keep the part you already know.",
    mode: "We do",
  },
  independent: {
    label: "Your tutor · I’m nearby",
    copy: "Try your own route first. I’ll check the method as well as the answer, and the Hint control stays available if you need one precise nudge.",
    mode: "You do",
  },
  transfer: {
    label: "Your tutor · new story, same skill",
    copy: "Same maths, fresh setting — so you know it’s yours, not memorised from one picture.",
    mode: "Transfer",
  },
  recall: {
    label: "Your tutor · warm-up",
    copy: "No pressure — just a nudge for what’s already in your toolkit.",
    mode: "Warm-up",
  },
};

export function ItemRunner({
  lesson,
  item,
  screen,
  index,
  total,
  onDone,
  onSkip,
  onBridge,
  declinedBridges,
  completedBridges,
  hintRequest,
}: {
  lesson: Lesson;
  item: Item;
  screen: Screen;
  index: number;
  total: number;
  onDone: (outcome: ItemOutcome) => void;
  onSkip?: () => void;
  onBridge: (bridgeId: string) => void;
  declinedBridges: string[];
  completedBridges: string[];
  /** Incremented by the chrome Hint button */
  hintRequest: number;
}) {
  const [value, setValue] = useState("");
  const [hints, setHints] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [result, setResult] = useState<{ kind: "correct" | "retry" | "invalid" | "revealed"; text: string } | null>(null);
  const [showAlt, setShowAlt] = useState(false);
  const [altUsed, setAltUsed] = useState(false);
  const [bridgeOffer, setBridgeOffer] = useState<string | null>(null);
  const [declined, setDeclined] = useState<string[]>(declinedBridges);
  const inputRef = useRef<HTMLInputElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const [seenHintRequest, setSeenHintRequest] = useState(hintRequest);

  const locked = result?.kind === "correct" || result?.kind === "revealed";

  // The chrome Hint button bumps a counter; derive the next rung during render (no effect needed).
  if (hintRequest !== seenHintRequest) {
    setSeenHintRequest(hintRequest);
    if (!locked) setHints((h) => Math.min(3, h + 1));
  }

  // Each item mounts fresh (keyed by the runner), so only focus management lives in effects.
  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (locked) continueRef.current?.focus();
  }, [locked]);

  const check = () => {
    if (locked) return;
    const res = checkAnswer(item, value);
    if (res.invalid) {
      setResult({ kind: "invalid", text: res.message ?? "Try entering an answer first." });
      return;
    }
    if (res.correct) {
      setResult({ kind: "correct", text: item.success });
      return;
    }
    const w = wrong + 1;
    setWrong(w);
    const nextHints = Math.min(3, Math.max(hints, w));
    setHints(nextHints);
    const text = res.misconception?.say ?? res.message ?? kindRetryLine(w);
    setResult({ kind: "retry", text });
    const bridgeId = res.misconception?.bridge ?? item.bridge;
    if (bridgeId && screen !== "recall" && w >= 2 && !declined.includes(bridgeId) && !completedBridges.includes(bridgeId) && getLesson(bridgeId)) {
      setBridgeOffer(bridgeId);
    }
  };

  const finish = () => {
    onDone({
      attempt: {
        wrong,
        hintsUsed: hints,
        correct: result?.kind === "correct",
        usedAlt: altUsed,
        firstTryClean: result?.kind === "correct" && wrong === 0 && hints === 0,
      },
    });
  };

  const reveal = () => {
    setResult({ kind: "revealed", text: item.success });
  };

  const presence = MODE_LABEL[screen];
  const bridgeLesson = bridgeOffer ? getLesson(bridgeOffer) : undefined;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 28 }} className="li-item-grid">
      <div>
        <p className="li-eyebrow">
          {screenTitle(screen)} · {index + 1} of {total}
        </p>
        <h1 className="li-display" style={{ fontSize: "var(--li-text-2xl)", margin: "0 0 8px" }}>
          {screenHeading(screen)}
        </h1>
        {presence && <TutorCard label={presence.label} copy={presence.copy} mode={presence.mode} className="li-item-tutor" />}

        <form
          className="li-panel"
          style={{ marginTop: 20 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (locked) finish();
            else check();
          }}
        >
          <Rich as="p" text={item.prompt} className="li-prompt" />
          {item.plain && <p className="li-note" style={{ margin: "8px 0 0" }}>Plain language: {item.plain}</p>}

          <div style={{ marginTop: 20 }}>
            {item.type === "numeric" && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {item.lead && <span className="li-katex-large" style={{ fontWeight: 600, fontSize: "1.25rem" }}>{item.lead}</span>}
                <input
                  ref={inputRef}
                  className={`li-math-field ${result?.kind === "correct" ? "is-correct" : result?.kind === "retry" ? "is-retry" : ""}`}
                  style={{ width: 210 }}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="Enter value"
                  aria-label={`Answer${item.unit ? ` in ${item.unit}` : ""}`}
                  aria-describedby="item-feedback"
                  value={value}
                  disabled={locked}
                  onChange={(e) => setValue(e.target.value)}
                />
                {item.unit && <span style={{ fontSize: "var(--li-text-lg)", color: "var(--li-ink-500)" }}>{item.unit}</span>}
              </div>
            )}
            {item.type === "expression" && (
              <div>
                <input
                  ref={inputRef}
                  className={`li-math-field li-math-field--expr ${result?.kind === "correct" ? "is-correct" : result?.kind === "retry" ? "is-retry" : ""}`}
                  style={{ width: 320, maxWidth: "100%" }}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Type an expression"
                  aria-label="Expression"
                  aria-describedby="item-feedback"
                  value={value}
                  disabled={locked}
                  onChange={(e) => setValue(e.target.value)}
                />
                <p className="li-note" style={{ margin: "8px 0 0" }}>
                  Use letters, numbers, + − × ÷ ^ and brackets. Spacing and term order don’t matter.
                </p>
              </div>
            )}
            {item.type === "mcq" && (
              <div className="li-mcq" role="radiogroup" aria-label="Options">
                {item.options.map((opt, i) => {
                  const sel = value === String(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      className={`li-mcq__opt ${sel ? (locked && result?.kind === "correct" ? "is-correct" : "is-selected") : ""}`}
                      disabled={locked}
                      onClick={() => setValue(String(i))}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                          e.preventDefault();
                          setValue(String((i + 1) % item.options.length));
                          (e.currentTarget.parentElement?.children[(i + 1) % item.options.length] as HTMLElement)?.focus();
                        }
                        if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                          e.preventDefault();
                          const j = (i - 1 + item.options.length) % item.options.length;
                          setValue(String(j));
                          (e.currentTarget.parentElement?.children[j] as HTMLElement)?.focus();
                        }
                      }}
                    >
                      <span className="li-mcq__letter">{"ABCD"[i]}</span>
                      <span className="li-katex-large">
                        <Rich text={opt} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {item.type === "hotspot" && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <CirclePartsHotspot selected={value || null} onSelect={(id) => setValue(id)} correctTarget={item.correctTarget} locked={locked} />
              </div>
            )}
          </div>

          <div id="item-feedback" aria-live="polite" style={{ marginTop: 16 }}>
            {result?.kind === "correct" && (
              <div className="li-feedback-soft">
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>Nice work.</strong> <Rich text={result.text} />
                </div>
              </div>
            )}
            {result?.kind === "revealed" && (
              <div className="li-feedback-soft" style={{ background: "var(--li-violet-50)", borderColor: "var(--li-violet-100)" }}>
                <span aria-hidden="true">✦</span>
                <div>
                  <strong style={{ color: "var(--li-violet-400)" }}>Here’s the working.</strong> <Rich text={result.text} /> We’ll meet this idea again — nothing lost.
                </div>
              </div>
            )}
            {result?.kind === "retry" && (
              <div className="li-feedback-retry">
                <span aria-hidden="true">↻</span>
                <div>
                  <strong>Not yet — useful information.</strong> <Rich text={result.text} />
                </div>
              </div>
            )}
            {result?.kind === "invalid" && (
              <div className="li-feedback-retry">
                <span aria-hidden="true">·</span>
                <div>{result.text}</div>
              </div>
            )}
          </div>

          {/* Footer controls live inside the form so Enter submits; primary is last in DOM */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {onSkip && !locked && (
                <button type="button" className="li-btn li-btn--secondary li-btn--sm" onClick={onSkip}>
                  Skip for now
                </button>
              )}
              {!locked && wrong >= 3 && hints >= 3 && (
                <button type="button" className="li-btn li-btn--ghost li-btn--sm" onClick={reveal}>
                  Show me the working
                </button>
              )}
            </div>
            {locked ? (
              <button ref={continueRef} type="submit" className="li-btn li-btn--primary">
                Continue
              </button>
            ) : (
              <button type="submit" className="li-btn li-btn--primary">
                Check
              </button>
            )}
          </div>
        </form>

        {item.visual && (
          <div className="li-card" style={{ marginTop: 20, padding: 20, maxWidth: 420 }}>
            <Diagram spec={item.visual} />
          </div>
        )}
      </div>

      <aside className="li-card" style={{ padding: 20, alignSelf: "start", position: "sticky", top: 8 }} aria-label="Tutor support">
        <p className="li-eyebrow">Tutor support</p>
        <p style={{ fontWeight: 600, margin: "0 0 12px" }}>Reveal only what you need</p>
        {[0, 1, 2].map((lvl) => {
          const open = hints > lvl;
          const canOpen = hints === lvl && !locked;
          const names = ["Nudge", "Structure", "Approach"];
          return (
            <div key={lvl} style={{ marginBottom: 8 }}>
              <button
                type="button"
                className={`li-btn ${open ? "li-btn--secondary" : "li-btn--ghost"}`}
                style={{ width: "100%", justifyContent: "space-between" }}
                disabled={!canOpen && !open}
                aria-expanded={open}
                aria-controls={`hint-${lvl}`}
                onClick={() => canOpen && setHints(lvl + 1)}
              >
                <span>
                  Hint {lvl + 1} · {names[lvl]}
                </span>
                <span aria-hidden="true">{open ? "✓" : canOpen ? "→" : "·"}</span>
              </button>
              {open && (
                <div id={`hint-${lvl}`} className={`li-hint li-hint--l${lvl + 1}`} style={{ marginTop: 6 }} aria-live="polite">
                  <strong style={{ fontSize: "var(--li-text-sm)" }}>Level {lvl + 1} · {names[lvl]}</strong>
                  <Rich as="p" className="li-hint__body" text={item.hints[lvl]} />
                </div>
              )}
            </div>
          );
        })}
        {lesson.alt && (
          <button
            type="button"
            className="li-btn li-btn--ghost"
            style={{ width: "100%" }}
            disabled={locked || (wrong === 0 && hints === 0)}
            aria-expanded={showAlt}
            onClick={() => {
              setShowAlt((s) => !s);
              setAltUsed(true);
            }}
          >
            {showAlt ? "Hide the other way" : "Show another way"}
          </button>
        )}
        <p className="li-note" style={{ marginTop: 16 }}>
          Hints teach the next decision without exposing the answer.
        </p>
      </aside>

      {showAlt && lesson.alt && (
        <section className="li-card li-anim-enter" style={{ gridColumn: "1 / -1", padding: 24 }} aria-labelledby="alt-h">
          <p className="li-eyebrow">Another way · still with you</p>
          <h2 id="alt-h" className="li-display" style={{ fontSize: "var(--li-text-xl)", margin: "0 0 8px" }}>
            {lesson.alt.title}
          </h2>
          <Rich as="p" className="li-tutor-voice" text={lesson.alt.tutor} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 16 }} className="li-alt-grid">
            <div className="li-panel">
              <p style={{ fontWeight: 600, color: "var(--li-gold-500)", margin: "0 0 8px" }}>{lesson.alt.pathA.title}</p>
              <Rich as="p" className="li-katex-large" text={lesson.alt.pathA.body} />
            </div>
            <div className="li-panel" style={{ borderColor: "var(--li-teal-200)", background: "var(--li-teal-50)" }}>
              <p style={{ fontWeight: 600, color: "var(--li-teal-400)", margin: "0 0 8px" }}>{lesson.alt.pathB.title}</p>
              <Rich as="p" className="li-tutor-voice" text={lesson.alt.pathB.body} />
            </div>
          </div>
        </section>
      )}

      {bridgeOffer && bridgeLesson && (
        <Modal
          labelledBy="bridge-title"
          onEscape={() => {
            setDeclined((d) => [...d, bridgeOffer]);
            setBridgeOffer(null);
          }}
        >
          <p className="li-eyebrow li-eyebrow--violet">Side path · optional</p>
          <h2 id="bridge-title" className="li-display" style={{ fontSize: "var(--li-text-2xl)", margin: "0 0 12px" }}>
            Tricky bit — shall we shore up {bridgeLesson.short.toLowerCase()}?
          </h2>
          <p className="li-tutor-voice">
            I noticed a pattern that often means <strong>{bridgeLesson.code}</strong> needs a quick tune-up. A short bridge lesson (~{bridgeLesson.minutes} min) — optional. Accept and we’ll return right here. Decline and we’ll keep richer hints. Your choice; no shame either way.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            <button type="button" className="li-btn li-btn--primary" style={{ flex: 1 }} onClick={() => onBridge(bridgeOffer)}>
              Accept bridge
            </button>
            <button
              type="button"
              className="li-btn li-btn--secondary"
              style={{ flex: 1 }}
              onClick={() => {
                setDeclined((d) => [...d, bridgeOffer]);
                setBridgeOffer(null);
                inputRef.current?.focus();
              }}
            >
              Continue with hints
            </button>
          </div>
        </Modal>
      )}
      <style>{`
        @media (max-width: 1000px) { .li-item-grid { grid-template-columns: 1fr !important; } .li-item-grid aside { position: static !important; } .li-alt-grid { grid-template-columns: 1fr !important; } }
        .li-item-tutor { margin: 12px 0 0; }
      `}</style>
    </div>
  );
}

function kindRetryLine(wrong: number) {
  if (wrong === 1) return "Let’s look at one part of the working together — the first hint is open.";
  if (wrong === 2) return "Still not quite. The structure hint shows the order of steps.";
  return "The approach hint walks through the method — you still enter the final value.";
}

export function screenTitle(s: Screen) {
  return (
    {
      recall: "Warm-up",
      goalVisual: "Goal + visual",
      worked: "Worked example",
      guided: "Guided",
      independent: "Independent",
      transfer: "Transfer",
      recap: "Recap",
    } as Record<Screen, string>
  )[s];
}

function screenHeading(s: Screen) {
  return (
    {
      recall: "Quick recall",
      goalVisual: "Today’s goal",
      worked: "Worked example — show working",
      guided: "Guided practice",
      independent: "Independent practice",
      transfer: "Transfer · new story, same skill",
      recap: "Recap",
    } as Record<Screen, string>
  )[s];
}
