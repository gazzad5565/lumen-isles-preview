"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Onboarding, avatarGlyph, avatarName } from "@/components/Onboarding";
import { Brand, Loading } from "@/components/ui";
import { CORE_LESSONS, getLesson, STARTER_LESSON_ID } from "@/content";
import { WORLD_NODES } from "@/content/world";
import { chipClass, effectiveState, skillOf } from "@/lib/progress";
import { Rich } from "@/components/Math";

export default function HomePage() {
  const { progress, hydrated } = useStore();
  if (!hydrated) return <Loading />;
  if (!progress.onboarded) return <Onboarding />;
  return <LearnerHome />;
}

function LearnerHome() {
  const { progress } = useStore();
  const session = progress.session;
  const sessionLesson = session ? getLesson(session.lessonId) : undefined;
  const restored = new Set(progress.restoredNodes);

  // Suggest the next available lesson on the map (first unrestored node whose requirements are met)
  const nextNode = WORLD_NODES.find((n) => n.kind === "lesson" && !restored.has(n.id) && n.requires.every((r) => restored.has(r)));
  const nextLesson = nextNode?.lessonId ? getLesson(nextNode.lessonId) : getLesson(STARTER_LESSON_ID);

  const firstVisit = progress.restoredNodes.length === 0 && !session;

  const snapshot = CORE_LESSONS.map((l) => ({ lesson: l, state: effectiveState(skillOf(progress, l.id)) })).filter((s) => s.state !== "New" || progress.lessons[s.lesson.id]).slice(0, 6);

  return (
    <div className="li-app li-bg-isles">
      <header className="li-topbar">
        <Brand />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="li-chip li-chip--practising" aria-label={`Explorer ${progress.learner?.name}, avatar ${avatarName(progress.learner?.avatar)}`}>
            <span aria-hidden="true">{avatarGlyph(progress.learner?.avatar)}</span> {avatarName(progress.learner?.avatar)} · {progress.learner?.name}
          </span>
          <Link href="/parent" className="li-btn li-btn--ghost li-btn--sm">
            Parent
          </Link>
        </div>
      </header>
      <main style={{ padding: "24px 48px 48px", display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(0,0.8fr)", gap: 32, maxWidth: 1440, margin: "0 auto", width: "100%" }} className="li-home-grid li-stagger">
        <section className="li-card li-card--glow" style={{ padding: 32 }} aria-labelledby="continue-h">
          {session && sessionLesson ? (
            <>
              <p style={{ margin: 0, color: "var(--li-gold-500)", fontWeight: 600 }}>Continue</p>
              <h1 id="continue-h" className="li-display" style={{ fontSize: "var(--li-text-3xl)", margin: "8px 0 12px" }}>
                {sessionLesson.title}
              </h1>
              <p className="li-tutor-voice">
                You’re mid-path on {sessionLesson.short}. Pick up where you left the {screenName(session.screen)} — I’ll remind you of the goal.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                <Link href={`/lesson/${sessionLesson.id}`} className="li-btn li-btn--primary li-btn--lg">
                  Continue lesson
                </Link>
                <Link href="/map" className="li-btn li-btn--secondary">
                  Open map
                </Link>
              </div>
            </>
          ) : firstVisit ? (
            <>
              <p style={{ margin: 0, color: "var(--li-gold-500)", fontWeight: 600 }}>Beacon</p>
              <h1 id="continue-h" className="li-display" style={{ fontSize: "var(--li-text-3xl)", margin: "8px 0 12px" }}>
                Welcome ashore, {progress.learner?.name}
              </h1>
              <p className="li-tutor-voice">One short path will restore the first light — a short win to begin. Ready when you are; I’ll teach as we go.</p>
              <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                <Link href="/map" className="li-btn li-btn--primary li-btn--lg">
                  Open the map
                </Link>
              </div>
            </>
          ) : nextLesson ? (
            <>
              <p style={{ margin: 0, color: "var(--li-gold-500)", fontWeight: 600 }}>Next on the path</p>
              <h1 id="continue-h" className="li-display" style={{ fontSize: "var(--li-text-3xl)", margin: "8px 0 12px" }}>
                {nextLesson.title}
              </h1>
              <Rich as="p" className="li-tutor-voice" text={nextLesson.intro} />
              <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                <Link href={`/lesson/${nextLesson.id}`} className="li-btn li-btn--primary li-btn--lg">
                  Start this path
                </Link>
                <Link href="/map" className="li-btn li-btn--secondary">
                  Open map
                </Link>
              </div>
            </>
          ) : (
            <>
              <p style={{ margin: 0, color: "var(--li-gold-500)", fontWeight: 600 }}>All lit</p>
              <h1 id="continue-h" className="li-display" style={{ fontSize: "var(--li-text-3xl)", margin: "8px 0 12px" }}>
                Every path on the Isles glows
              </h1>
              <p className="li-tutor-voice">Revisit any lesson for a quick tune-up whenever you like — the lights stay steady.</p>
              <Link href="/map" className="li-btn li-btn--primary li-btn--lg" style={{ marginTop: 24 }}>
                Open map
              </Link>
            </>
          )}
        </section>
        <aside>
          <div className="li-panel" style={{ marginBottom: 16 }}>
            <p style={{ fontWeight: 600, margin: "0 0 12px" }}>Skills snapshot</p>
            {snapshot.length === 0 ? (
              <p className="li-tutor-voice" style={{ fontSize: "var(--li-text-sm)", margin: 0 }}>
                Fresh shores — your first lesson will light up here.
              </p>
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", margin: 0, padding: 0 }}>
                {snapshot.map(({ lesson, state }) => (
                  <li key={lesson.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, fontSize: "var(--li-text-sm)" }}>
                    <span>
                      {lesson.code} {lesson.short}
                    </span>
                    <span className={chipClass(state)}>{state}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {progress.collectibles.length > 0 && (
            <div className="li-panel" style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 600, margin: "0 0 12px" }}>Collected light</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }} aria-label="Collectibles">
                {progress.collectibles.map((c) => (
                  <span key={c.id} className="li-badge-collect" style={{ width: 48, height: 48, fontSize: 20 }} title={`${c.name} — ${c.blurb}`} aria-label={c.name}>
                    {c.glyph}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="li-note">Progress is saved locally on this Mac.</p>
        </aside>
      </main>
      <style>{`@media (max-width: 900px){ .li-home-grid { grid-template-columns: 1fr !important; padding: 16px !important; } }`}</style>
    </div>
  );
}

function screenName(s: string) {
  return (
    {
      recall: "warm-up",
      goalVisual: "goal and visual",
      worked: "worked example",
      guided: "guided practice",
      independent: "independent practice",
      transfer: "transfer task",
      recap: "recap",
    } as Record<string, string>
  )[s] ?? s;
}
