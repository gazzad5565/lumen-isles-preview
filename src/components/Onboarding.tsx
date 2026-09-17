"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PLACEMENT, PLACEMENT_OPTIONS, type PlacementChoice } from "@/content";
import { Rich, Tex } from "./Math";
import { Brand, PinPad, Eyebrow } from "./ui";

export const AVATARS = [
  { id: "pathfinder", glyph: "🧭", name: "Pathfinder" },
  { id: "dawn", glyph: "🌅", name: "Dawn" },
  { id: "beacon", glyph: "🔮", name: "Beacon" },
  { id: "grove", glyph: "🌿", name: "Grove" },
  { id: "voyager", glyph: "⛵", name: "Voyager" },
  { id: "lumen", glyph: "✨", name: "Lumen" },
];

export function avatarGlyph(id: string | undefined) {
  return AVATARS.find((a) => a.id === id)?.glyph ?? "✦";
}
export function avatarName(id: string | undefined) {
  return AVATARS.find((a) => a.id === id)?.name ?? "Explorer";
}

type Step = "splash" | "name" | "avatar" | "pin" | "placement";

export function Onboarding() {
  const router = useRouter();
  const store = useStore();
  const [step, setStep] = useState<Step>("splash");
  const [name, setName] = useState(store.progress.learner?.name ?? "");
  const [avatar, setAvatar] = useState(store.progress.learner?.avatar ?? "pathfinder");

  const wrapClass = "li-app li-bg-isles";

  if (step === "splash")
    return (
      <div className={wrapClass} style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: 48, position: "relative" }}>
        <div style={{ position: "absolute", top: 28, left: 40 }}>
          <Brand />
        </div>
        <div className="li-anim-enter" style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 640 }}>
          <IslandArt />
          <h1 className="li-display" style={{ fontSize: "var(--li-text-5xl)", margin: 0 }}>
            Lumen Isles
          </h1>
          <p className="li-tutor-voice" style={{ fontSize: "1.25rem", maxWidth: 520, margin: "16px 0 40px", textAlign: "center" }}>
            Warm adventure maths — restore light to the islands by mastering what you need for Grade 7. I’m here with you, step by step. Not a worksheet. A real tutor on a real path.
          </p>
          <button className="li-btn li-btn--primary li-btn--lg" autoFocus onClick={() => setStep("name")}>
            Begin your voyage
          </button>
          <p className="li-note" style={{ marginTop: 24 }}>
            Mac · desktop · your progress stays on this device
          </p>
        </div>
      </div>
    );

  if (step === "name")
    return (
      <div className={wrapClass} style={{ alignItems: "center", justifyContent: "center", padding: 32 }}>
        <form
          className="li-card li-anim-enter"
          style={{ maxWidth: 480, width: "100%", padding: 40 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim().length === 0) return;
            setStep("avatar");
          }}
        >
          <Eyebrow>First steps</Eyebrow>
          <h1 className="li-display" style={{ fontSize: "var(--li-text-3xl)", margin: "0 0 12px" }}>
            What should I call you?
          </h1>
          <p className="li-tutor-voice" style={{ margin: "0 0 28px" }}>
            This name appears on your explorer card and when we celebrate soft wins together. You can change it later.
          </p>
          <label htmlFor="name" style={{ fontWeight: 600, fontSize: "var(--li-text-sm)", display: "block", marginBottom: 8 }}>
            Display name
          </label>
          <input id="name" className="li-input" type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus autoComplete="off" maxLength={24} placeholder="Your name" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
            <button type="button" className="li-btn li-btn--ghost" onClick={() => setStep("splash")}>
              Back
            </button>
            <button type="submit" className="li-btn li-btn--primary" disabled={name.trim().length === 0}>
              Continue
            </button>
          </div>
        </form>
      </div>
    );

  if (step === "avatar")
    return (
      <div className={wrapClass} style={{ alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div className="li-card li-anim-enter" style={{ maxWidth: 640, width: "100%", padding: 40 }}>
          <h1 className="li-display" style={{ fontSize: "var(--li-text-3xl)", margin: "0 0 8px" }}>
            Pick your explorer
          </h1>
          <p className="li-tutor-voice" style={{ margin: "0 0 28px" }}>
            A small curated set — polish over clutter. Choose the one that feels like you on the Isles.
          </p>
          <AvatarGrid value={avatar} onChange={setAvatar} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
            <button type="button" className="li-btn li-btn--ghost" onClick={() => setStep("name")}>
              Back
            </button>
            <button
              type="button"
              className="li-btn li-btn--primary"
              onClick={() => {
                store.setLearner(name, avatar);
                setStep("pin");
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );

  if (step === "pin") return <PinSetup onBack={() => setStep("avatar")} onDone={() => setStep("placement")} />;

  return (
    <Placement
      onDone={() => {
        store.finishOnboarding();
        router.push("/map");
      }}
    />
  );
}

function AvatarGrid({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div
      role="radiogroup"
      aria-label="Avatar"
      style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}
      onKeyDown={(e) => {
        const idx = AVATARS.findIndex((a) => a.id === value);
        let next = idx;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % AVATARS.length;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + AVATARS.length) % AVATARS.length;
        if (next !== idx) {
          e.preventDefault();
          onChange(AVATARS[next].id);
          refs.current[next]?.focus();
        }
      }}
    >
      {AVATARS.map((a, i) => (
        <button
          key={a.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={value === a.id}
          tabIndex={value === a.id ? 0 : -1}
          className={`li-mcq__opt ${value === a.id ? "is-selected" : ""}`}
          style={{ flexDirection: "column", gap: 8, padding: 20, justifyContent: "center" }}
          onClick={() => onChange(a.id)}
        >
          <span style={{ fontSize: 36 }} aria-hidden="true">
            {a.glyph}
          </span>
          <span style={{ fontWeight: 600 }}>{a.name}</span>
        </button>
      ))}
    </div>
  );
}

function PinSetup({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const store = useStore();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phase, setPhase] = useState<"enter" | "confirm">("enter");
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    if (phase === "enter") {
      setPhase("confirm");
      setMsg(null);
      return;
    }
    if (confirm === pin) {
      await store.setPin(pin);
      onDone();
    } else {
      setMsg("Those two didn’t match — no problem. Let’s enter the PIN once more.");
      setPin("");
      setConfirm("");
      setPhase("enter");
    }
  };

  return (
    <div className="li-app li-bg-isles" style={{ alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 40, maxWidth: 1100, width: "100%", alignItems: "center" }} className="li-pin-grid">
        <div className="li-anim-enter">
          <Eyebrow tone="violet">For a parent / guardian</Eyebrow>
          <h1 className="li-display" style={{ fontSize: "var(--li-text-3xl)", margin: "0 0 16px" }}>
            Set a 4-digit parent PIN
          </h1>
          <p className="li-tutor-voice">
            This unlocks the <strong>parent progress area</strong> — skill states, lesson list, and school PDF citations. It stays on this Mac only. No cloud account.
          </p>
          <p className="li-tutor-voice" style={{ marginTop: 12 }}>
            The explorer roams freely; the parent view stays calmly gated. Wrong PIN just means try again — no email reset needed.
          </p>
        </div>
        <div className="li-card" style={{ padding: 36, textAlign: "center" }}>
          <p style={{ fontWeight: 600, margin: "0 0 16px" }} aria-live="polite">
            {phase === "enter" ? "Enter a 4-digit PIN" : "Enter it once more to confirm"}
          </p>
          <PinPad value={phase === "enter" ? pin : confirm} onChange={phase === "enter" ? setPin : setConfirm} onSubmit={submit} label={phase === "enter" ? "PIN keypad" : "Confirm PIN keypad"} />
          {msg && (
            <p className="li-feedback-retry" style={{ marginTop: 16, textAlign: "left" }} role="status">
              {msg}
            </p>
          )}
          <button className="li-btn li-btn--primary" style={{ marginTop: 28, width: "100%" }} disabled={(phase === "enter" ? pin : confirm).length !== 4} onClick={submit}>
            {phase === "enter" ? "Continue" : "Confirm PIN"}
          </button>
          <button className="li-btn li-btn--ghost" style={{ marginTop: 8 }} onClick={phase === "enter" ? onBack : () => setPhase("enter")}>
            Back
          </button>
        </div>
      </div>
      <style>{`@media (max-width: 900px){ .li-pin-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function Placement({ onDone }: { onDone: () => void }) {
  const store = useStore();
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState<PlacementChoice | null>(null);
  const [probe, setProbe] = useState<number | null>(null);
  const [showProbe, setShowProbe] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { choice: PlacementChoice; probeCorrect?: boolean }>>({});
  const cluster = PLACEMENT[idx];
  const total = PLACEMENT.length;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [idx, showProbe]);

  const commit = (c: PlacementChoice, probeCorrect?: boolean) => {
    const next = { ...answers, [cluster.id]: { choice: c, probeCorrect } };
    setAnswers(next);
    setChoice(null);
    setProbe(null);
    setShowProbe(false);
    if (idx + 1 < total) setIdx(idx + 1);
    else {
      store.applyPlacement(next);
      onDone();
    }
  };

  const next = () => {
    if (!choice) return;
    if (choice === "okay" && !showProbe) {
      setShowProbe(true);
      return;
    }
    if (showProbe) {
      commit("okay", probe === cluster.probe.correctIndex);
      return;
    }
    commit(choice);
  };

  return (
    <div className="li-app li-bg-isles" style={{ alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div className="li-card li-anim-enter" style={{ maxWidth: 720, width: "100%", padding: 40 }} key={`${idx}-${showProbe}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p className="li-eyebrow" style={{ margin: 0 }}>
            Placement · {cluster.title.split(" — ")[0]} · {idx + 1} of {total}
          </p>
          <span className="li-chip li-chip--new">Not a test</span>
        </div>
        {!showProbe ? (
          <>
            <h1 ref={headingRef} tabIndex={-1} className="li-display" style={{ fontSize: "var(--li-text-2xl)", margin: "0 0 12px", outline: "none" }}>
              {cluster.title}
            </h1>
            <p className="li-tutor-voice" style={{ margin: "0 0 8px" }}>
              Honest answers help me start you in the right place. There’s no score and no shame. You can always say you haven’t learned it yet — that’s agency, not a gap to hide.
            </p>
            <p className="li-note">{cluster.question}</p>
            {cluster.formula && (
              <div className="li-katex-large" style={{ margin: "20px 0", padding: 16, background: "var(--li-cream-200)", borderRadius: "var(--li-radius-md)", textAlign: "center" }}>
                <Tex tex={cluster.formula} />
              </div>
            )}
            <div className="li-mcq" role="radiogroup" aria-label="Familiarity">
              {PLACEMENT_OPTIONS.map((o, i) => (
                <button key={o.id} type="button" role="radio" aria-checked={choice === o.id} className={`li-mcq__opt ${choice === o.id ? "is-selected" : ""}`} onClick={() => setChoice(o.id)}>
                  <span className="li-mcq__letter">{"ABCD"[i]}</span> {"strong" in o && o.strong ? <strong>{o.label}</strong> : o.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 ref={headingRef} tabIndex={-1} className="li-display" style={{ fontSize: "var(--li-text-2xl)", margin: "0 0 12px", outline: "none" }}>
              One light probe
            </h1>
            <p className="li-tutor-voice" style={{ margin: "0 0 20px" }}>
              Just to place your starting point — either answer is useful information, nothing more.
            </p>
            <div className="li-panel" style={{ marginBottom: 20 }}>
              <Rich as="p" className="li-tutor-voice" text={cluster.probe.prompt} />
            </div>
            <div className="li-mcq" role="radiogroup" aria-label="Probe options">
              {cluster.probe.options.map((o, i) => (
                <button key={i} type="button" role="radio" aria-checked={probe === i} className={`li-mcq__opt ${probe === i ? "is-selected" : ""}`} onClick={() => setProbe(i)}>
                  <span className="li-mcq__letter">{"ABCD"[i]}</span> <Rich text={o} />
                </button>
              ))}
            </div>
          </>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
          <button type="button" className="li-btn li-btn--secondary" onClick={() => commit("skip")}>
            Skip cluster
          </button>
          <button type="button" className="li-btn li-btn--primary" disabled={showProbe ? probe === null : !choice} onClick={next}>
            {idx + 1 === total && (showProbe || choice !== "okay") ? "Enter the Isles" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

function IslandArt() {
  return (
    <svg width="420" height="200" viewBox="0 0 420 200" aria-hidden="true" style={{ marginBottom: 32, maxWidth: "100%" }}>
      <ellipse cx="210" cy="170" rx="160" ry="18" fill="#D4A574" opacity="0.35" />
      <path d="M60 150 Q120 80 180 140 Q210 100 250 145 Q300 70 360 150 Z" fill="#7EB8A8" opacity="0.85" />
      <path d="M100 150 Q150 110 200 148 Q230 120 280 150 Z" fill="#5B9A8B" />
      <circle cx="210" cy="70" r="28" fill="#F0D9A8" opacity="0.9" />
      <circle cx="210" cy="70" r="18" fill="#C4894A" opacity="0.5" />
      <path d="M210 98 L210 130" stroke="#E8C99B" strokeWidth="3" strokeLinecap="round" />
      <circle cx="120" cy="100" r="6" fill="#F0D9A8" opacity="0.7" />
      <circle cx="310" cy="90" r="5" fill="#F0D9A8" opacity="0.6" />
    </svg>
  );
}
