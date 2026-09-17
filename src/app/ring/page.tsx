"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Loading, Toast } from "@/components/ui";
import { Rich, Tex } from "@/components/Math";
import { checkAnswer } from "@/lib/checker";
import { BRIDGE_RING, RING_NODE_ID } from "@/content/world";
import type { Item } from "@/content/types";

const RING_ITEM: Item = {
  id: "ring",
  type: "numeric",
  prompt: "",
  hints: BRIDGE_RING.hints,
  success: "",
  answer: { value: BRIDGE_RING.answer },
  misconceptions: BRIDGE_RING.misconceptions,
};

export default function RingPage() {
  const { progress, hydrated, restoreNode } = useStore();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [hints, setHints] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!hydrated) return <Loading />;
  if (!progress.onboarded) {
    router.replace("/");
    return <Loading />;
  }
  const already = progress.restoredNodes.includes(RING_NODE_ID);
  const available = progress.restoredNodes.includes("A4");

  if (!available && !already) {
    return (
      <div className="li-app li-bg-isles" style={{ alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div className="li-card" style={{ padding: 28, textAlign: "center", maxWidth: 440 }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.6 }} aria-hidden="true">
            ◯
          </div>
          <h1 className="li-display" style={{ fontSize: "var(--li-text-xl)", margin: "0 0 8px" }}>
            The ring is still dim
          </h1>
          <p className="li-tutor-voice" style={{ fontSize: "var(--li-text-sm)" }}>
            Restore the starter beacon first (Circles · A4) and the ring will be ready for your circumference.
          </p>
          <Link href="/map" className="li-btn li-btn--secondary li-btn--sm" style={{ marginTop: 16 }}>
            Back to map
          </Link>
        </div>
      </div>
    );
  }

  if (restored || already) return <Celebration fresh={restored} />;

  const fit = () => {
    const res = checkAnswer(RING_ITEM, value);
    if (res.invalid) {
      setMsg(res.message ?? "Enter a value first.");
      return;
    }
    if (res.correct) {
      restoreNode(RING_NODE_ID, BRIDGE_RING.collectible);
      setRestored(true);
      return;
    }
    const w = wrong + 1;
    setWrong(w);
    setHints((h) => Math.min(3, Math.max(h, w)));
    setMsg(res.misconception?.say ?? "Not yet — the ring needs the exact distance around. The next hint is open.");
  };

  return (
    <div className="li-app li-bg-isles">
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", flex: 1 }} className="li-ring-grid">
        <div style={{ position: "relative", padding: "72px 40px 40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <RingArt lit={false} />
          <Link href="/map" className="li-icon-btn" aria-label="Back to map" style={{ position: "absolute", top: 20, left: 24 }}>
            ←
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", padding: 48, background: "rgba(255,251,245,0.85)" }}>
          <form
            className="li-anim-enter"
            style={{ width: "100%", maxWidth: 560 }}
            onSubmit={(e) => {
              e.preventDefault();
              fit();
            }}
          >
            <span className="li-chip li-chip--practising">Maths drives the world</span>
            <h1 className="li-display" style={{ fontSize: "var(--li-text-3xl)", margin: "16px 0 12px" }}>
              Bridge ring
            </h1>
            <Rich
              as="p"
              className="li-tutor-voice"
              text={`The ring’s diameter is $${BRIDGE_RING.diameter}\\,\\text{cm}$. Use $\\pi = \\dfrac{22}{7}$ to find the circumference that fits. Fit it now, or leave the ring dim and return when you’re ready.`}
            />
            <div className="li-katex-display" style={{ margin: "24px 0", textAlign: "center" }}>
              <Tex tex={`C = \\pi d = \\dfrac{22}{7} \\times ${BRIDGE_RING.diameter}`} display label="C equals pi d equals twenty-two sevenths times fourteen" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <input ref={inputRef} className={`li-math-field ${wrong ? "is-retry" : ""}`} placeholder="Answer" style={{ width: 160 }} aria-label="Circumference in centimetres" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} aria-describedby="ring-feedback" />
              <span>cm</span>
              <button type="submit" className="li-btn li-btn--primary">
                Fit the ring
              </button>
            </div>
            <div id="ring-feedback" aria-live="polite" style={{ marginTop: 16 }}>
              {msg && (
                <div className="li-feedback-retry">
                  <span aria-hidden="true">↻</span>
                  <div>
                    <Rich text={msg} />
                  </div>
                </div>
              )}
              {hints > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {BRIDGE_RING.hints.slice(0, hints).map((h, i) => (
                    <div key={i} className={`li-hint li-hint--l${i + 1}`}>
                      <strong style={{ fontSize: "var(--li-text-sm)" }}>Hint {i + 1}</strong>
                      <Rich as="p" className="li-hint__body" text={h} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 20, alignItems: "center" }}>
              <button type="button" className="li-btn li-btn--ghost li-btn--sm" onClick={() => setHints((h) => Math.min(3, h + 1))} disabled={hints >= 3}>
                Hint
              </button>
              <Link href="/map" className="li-btn li-btn--ghost li-btn--sm">
                Defer for now
              </Link>
              <Link href="/lesson/A5" className="li-btn li-btn--ghost li-btn--sm">
                Learn 22/7 first (A5)
              </Link>
            </div>
          </form>
        </div>
      </div>
      <style>{`@media (max-width: 900px){ .li-ring-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function Celebration({ fresh }: { fresh: boolean }) {
  const [toast, setToast] = useState(fresh);
  useEffect(() => {
    if (!fresh) return;
    const t = window.setTimeout(() => setToast(false), 3200);
    return () => window.clearTimeout(t);
  }, [fresh]);
  return (
    <div className="li-app li-bg-isles" style={{ alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative", padding: 32 }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }} aria-hidden="true">
        {[
          [12, 20, "#F0D9A8"],
          [85, 25, "#A8D4C8"],
          [28, 78, "#C4B5D0"],
          [76, 72, "#F0D9A8"],
          [50, 12, "#7EB8A8"],
          [63, 58, "#E8C99B"],
          [20, 50, "#A8D4C8"],
          [90, 55, "#C4B5D0"],
        ].map(([x, y, c], i) => (
          <circle key={i} cx={`${x}%`} cy={`${y}%`} r={3 + (i % 3)} fill={c as string} />
        ))}
      </svg>
      <div className="li-anim-float" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <RingArt lit small />
        <div className="li-badge-collect li-anim-badge" style={{ width: 120, height: 120, fontSize: 48, margin: "16px 0 24px" }} role="img" aria-label={`Collectible: ${BRIDGE_RING.collectible.name}`}>
          {BRIDGE_RING.collectible.glyph}
        </div>
        <h1 className="li-display" style={{ fontSize: "var(--li-text-4xl)", margin: "0 0 12px" }}>
          Ring-bridge restored
        </h1>
        <p className="li-tutor-voice" style={{ maxWidth: 520 }}>
          Your circumference fitted the ring exactly — <Tex tex="\tfrac{22}{7} \times 14 = 44" /> cm. The bridge catches the light, and the next path glows a little warmer.
        </p>
        <Link href="/map" className="li-btn li-btn--primary" style={{ marginTop: 32 }} autoFocus>
          Back to map
        </Link>
      </div>
      {toast && <Toast text="Light restored on the ring-bridge" />}
    </div>
  );
}

function RingArt({ lit, small }: { lit: boolean; small?: boolean }) {
  const c = lit ? "#5B9A8B" : "#8A8498";
  return (
    <svg viewBox="0 0 520 600" width={small ? 220 : "100%"} height={small ? 250 : "85%"} style={{ maxWidth: 520 }} role="img" aria-label={lit ? "Bridge ring glowing with restored light" : "Dim bridge ring awaiting the true circumference"}>
      <ellipse cx="260" cy="520" rx="180" ry="30" fill="#D4A574" opacity="0.25" />
      <path d="M80 400 Q140 200 260 180 Q380 200 440 400" fill="none" stroke={c} strokeWidth="20" strokeLinecap="round" opacity={lit ? 0.9 : 0.4} />
      <circle cx="260" cy="320" r="110" fill="none" stroke={c} strokeWidth="16" opacity={lit ? 0.95 : 0.45} />
      {!lit && <circle cx="260" cy="320" r="110" fill="none" stroke="#C4894A" strokeWidth="4" strokeDasharray="8 12" opacity="0.7" />}
      {lit && <circle cx="260" cy="320" r="110" fill="none" stroke="#F0D9A8" strokeWidth="6" strokeDasharray="691" strokeDashoffset="691" style={{ animation: "li-draw 700ms var(--li-ease) forwards" }} />}
      {!lit && (
        <>
          <text x="260" y="310" textAnchor="middle" fill="#6B6478" fontSize="14" fontWeight="600">
            ring needs
          </text>
          <text x="260" y="332" textAnchor="middle" fill="#6B6478" fontSize="14" fontWeight="700">
            true circumference
          </text>
        </>
      )}
    </svg>
  );
}
