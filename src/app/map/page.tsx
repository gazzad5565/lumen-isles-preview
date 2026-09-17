"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Brand, Loading, Toast } from "@/components/ui";
import { avatarGlyph } from "@/components/Onboarding";
import { getLesson } from "@/content";
import { RING_NODE_ID, WORLD_NODES, WORLD_PATHS, type WorldNode } from "@/content/world";
import { effectiveState, skillOf } from "@/lib/progress";

type NodeState = "locked" | "available" | "restored" | "refresh";

export default function MapPage() {
  const { progress, hydrated } = useStore();
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  if (!hydrated) return <Loading />;
  if (!progress.onboarded) {
    router.replace("/");
    return <Loading />;
  }

  const restored = new Set(progress.restoredNodes);
  const stateOf = (n: WorldNode): NodeState => {
    if (restored.has(n.id)) {
      if (n.lessonId && effectiveState(skillOf(progress, n.lessonId)) === "Needs refresh") return "refresh";
      return "restored";
    }
    if (n.requires.every((r) => restored.has(r))) return "available";
    return "locked";
  };

  const firstLanding = progress.restoredNodes.length === 0;
  const session = progress.session;
  const continueLesson = session ? getLesson(session.lessonId) : undefined;
  const ringRestored = restored.has(RING_NODE_ID);
  const litCount = progress.restoredNodes.length;

  const onNode = (n: WorldNode) => {
    const s = stateOf(n);
    if (s === "locked") {
      const need = n.requires.filter((r) => !restored.has(r)).map((r) => getLesson(r)?.short ?? r);
      setToast(`${n.label} stays dim for now — it opens after ${need.join(" and ")}. No rush.`);
      window.setTimeout(() => setToast(null), 4200);
      return;
    }
    if (n.kind === "ring") router.push("/ring");
    else router.push(`/lesson/${n.lessonId}`);
  };

  const nodeById = Object.fromEntries(WORLD_NODES.map((n) => [n.id, n]));

  return (
    <div className="li-app li-bg-isles" style={{ position: "relative", overflow: "hidden" }}>
      <header className="li-topbar" style={{ position: "relative", zIndex: 5 }}>
        <Brand href="/" />
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {continueLesson ? (
            <Link href={`/lesson/${continueLesson.id}`} className="li-btn li-btn--primary li-btn--sm">
              Continue · {continueLesson.short}
            </Link>
          ) : (
            <span className="li-chip li-chip--new">
              <span aria-hidden="true">{avatarGlyph(progress.learner?.avatar)}</span> Explorer · {progress.learner?.name}
            </span>
          )}
          <Link href="/" className="li-btn li-btn--ghost li-btn--sm">
            Home
          </Link>
          <Link href="/parent" className="li-btn li-btn--ghost li-btn--sm">
            Parent
          </Link>
        </div>
      </header>

      <main style={{ position: "relative", flex: 1, minHeight: 560 }} aria-label="World map">
        <svg viewBox="0 0 1440 780" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F0D9A8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#F0D9A8" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Starter isle */}
          <ellipse cx="800" cy="400" rx="440" ry="230" fill="#E8DCC8" opacity="0.45" />
          <path d="M420 400 Q600 220 800 350 Q1000 200 1220 400 Q1120 560 800 590 Q480 560 420 400Z" fill="#A8D4C8" opacity={firstLanding ? 0.35 : 0.55} />
          <path d="M500 400 Q660 300 800 370 Q960 280 1120 410 Q1020 500 800 530 Q580 500 500 400Z" fill="#7EB8A8" opacity={firstLanding ? 0.5 : 0.75} />
          {/* Garden shore */}
          <ellipse cx="380" cy="700" rx="360" ry="110" fill="#E8DCC8" opacity="0.4" />
          <path d="M80 690 Q240 600 420 660 Q560 620 700 700 Q560 760 380 770 Q200 760 80 690Z" fill="#A8D4C8" opacity={restored.has("B1") ? 0.6 : 0.3} />
          {/* Cipher cove */}
          <ellipse cx="1080" cy="110" rx="380" ry="110" fill="#E8DCC8" opacity="0.4" />
          <path d="M760 120 Q900 30 1080 80 Q1260 20 1380 130 Q1260 190 1080 200 Q900 190 760 120Z" fill="#C4B5D0" opacity={restored.has("C1") ? 0.5 : 0.25} />
          {/* Paths */}
          {WORLD_PATHS.map(([a, b]) => {
            const na = nodeById[a];
            const nb = nodeById[b];
            if (!na || !nb) return null;
            const lit = restored.has(a) && restored.has(b);
            const half = restored.has(a) || restored.has(b);
            return (
              <line
                key={`${a}-${b}`}
                x1={(na.x / 100) * 1440}
                y1={(na.y / 100) * 780}
                x2={(nb.x / 100) * 1440}
                y2={(nb.y / 100) * 780}
                stroke={lit ? "#5B9A8B" : half ? "#C4894A" : "#8A8498"}
                strokeWidth={lit ? 5 : 4}
                strokeLinecap="round"
                strokeDasharray={lit ? undefined : "8 12"}
                opacity={lit ? 0.9 : half ? 0.75 : 0.3}
              />
            );
          })}
          {/* Beacon glow */}
          <circle cx="720" cy="390" r="60" fill="url(#glow)" />
        </svg>

        {WORLD_NODES.map((n) => {
          const s = stateOf(n);
          const lesson = n.lessonId ? getLesson(n.lessonId) : undefined;
          const stateWord = s === "refresh" ? "needs a refresh" : s;
          return (
            <div key={n.id} style={{ position: "absolute", left: `${n.x}%`, top: `${n.y}%` }}>
              <button
                type="button"
                className={`li-map-node li-map-node--${s}`}
                aria-label={`${n.label}${lesson ? `, ${lesson.short}` : ""}, ${stateWord}`}
                aria-disabled={s === "locked"}
                onClick={() => onNode(n)}
                title={n.label}
              >
                {s === "restored" ? "✓" : n.glyph}
              </button>
              {(s !== "locked" || n.island === "starter") && <span className="li-map-label">{n.label}</span>}
            </div>
          );
        })}

        {firstLanding ? (
          <div className="li-card li-card--glow li-anim-enter" style={{ position: "absolute", bottom: 40, left: 48, width: 380, padding: 28, zIndex: 5 }}>
            <p style={{ margin: "0 0 8px", fontWeight: 600, color: "var(--li-gold-500)" }}>Beacon</p>
            <p className="li-tutor-voice" style={{ margin: "0 0 20px" }}>
              Welcome ashore, {progress.learner?.name}. One short path will restore the first light — a short win to begin. Ready when you are; I’ll teach as we go.
            </p>
            <Link href="/lesson/A4" className="li-btn li-btn--primary" style={{ width: "100%" }}>
              Take the short path
            </Link>
          </div>
        ) : (
          <div className="li-card li-anim-enter" style={{ position: "absolute", bottom: 40, right: 48, width: 300, padding: "20px 24px", zIndex: 5 }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Starter isle</p>
            <p className="li-tutor-voice" style={{ margin: "8px 0 0", fontSize: "var(--li-text-sm)" }}>
              {litCount} {litCount === 1 ? "light" : "lights"} restored.{" "}
              {ringRestored ? "The bridge ring glows." : restored.has("A4") ? "The bridge ring awaits your circumference; dim paths will stay here until you’re ready." : "Dim paths will stay here until you’re ready."}
            </p>
          </div>
        )}
        <div style={{ position: "absolute", top: 12, left: 48, display: "flex", gap: 8, zIndex: 5 }} aria-hidden="true">
          <span className="li-chip li-chip--practising">◉ available</span>
          <span className="li-chip li-chip--ready">✓ restored</span>
          <span className="li-chip li-chip--new">· not yet</span>
        </div>
      </main>
      {toast && <Toast text={toast} />}
    </div>
  );
}
