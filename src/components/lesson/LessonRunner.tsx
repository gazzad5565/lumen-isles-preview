"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Item, Lesson, Screen, SkillState } from "@/content/types";
import { getLesson } from "@/content";
import { useStore } from "@/lib/store";
import { chipClass, effectiveState, skillOf, type Collectible, type LessonSession } from "@/lib/progress";
import { Rich, Tex } from "../Math";
import { Diagram } from "../Diagram";
import { Brand, PiBadge, StageIndicator, TutorCard, Loading } from "../ui";
import { ItemRunner, screenTitle } from "./ItemRunner";

function screensFor(lesson: Lesson, mode: LessonSession["mode"]): Screen[] {
  if (mode === "refresh") return ["recall", "independent", "recap"];
  const all: Screen[] = ["recall", "goalVisual", "worked", "guided", "independent", "transfer", "recap"];
  return all.filter((s) => {
    if (s === "recall" && lesson.recall.length === 0) return false;
    if (s === "transfer" && (lesson.kind === "bridge" || lesson.transfer.length === 0)) return false;
    return true;
  });
}

function itemsFor(lesson: Lesson, screen: Screen, mode: LessonSession["mode"]): Item[] {
  switch (screen) {
    case "recall":
      return mode === "refresh" ? lesson.recall.slice(0, 1) : lesson.recall;
    case "guided":
      return lesson.guided;
    case "independent":
      return mode === "refresh" ? lesson.independent.slice(0, 3) : lesson.independent;
    case "transfer":
      return lesson.transfer;
    default:
      return [];
  }
}

export function LessonRunner({ lessonId }: { lessonId: string }) {
  const store = useStore();
  const router = useRouter();
  const lesson = getLesson(lessonId);
  const { progress, hydrated } = store;

  if (!hydrated) return <Loading />;
  if (!lesson) return <UnderConstruction />;
  if (!progress.onboarded) {
    router.replace("/");
    return <Loading />;
  }

  const session = progress.session?.lessonId === lessonId ? progress.session : null;
  if (!session) return <Entry lesson={lesson} />;
  return <Runner lesson={lesson} session={session} />;
}

/* ---------------- Entry card (frame 07) ---------------- */

function Entry({ lesson }: { lesson: Lesson }) {
  const store = useStore();
  const rec = skillOf(store.progress, lesson.id);
  const state = effectiveState(rec);
  const otherSession = store.progress.session;
  const otherLesson = otherSession ? getLesson(otherSession.lessonId) : undefined;
  const isRefresh = state === "Needs refresh";
  const done = store.progress.lessons[lesson.id]?.completions ?? 0;

  const start = (mode: LessonSession["mode"]) => {
    store.startSession(lesson.id, mode);
  };

  return (
    <div className="li-app li-bg-isles" style={{ alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div className="li-card li-card--glow li-anim-enter" style={{ maxWidth: 560, width: "100%", padding: 40 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <span className={chipClass(state)}>{state}</span>
          <PiBadge mode={lesson.piMode} />
          {lesson.kind === "bridge" && <span className="li-chip li-chip--practising">Bridge · compact loop</span>}
        </div>
        <h1 className="li-display" style={{ fontSize: "var(--li-text-3xl)", margin: "0 0 12px" }}>
          {lesson.title}
        </h1>
        {isRefresh ? (
          <p className="li-tutor-voice">Quick tune-up — keeps the island lights steady. A short recall, two or three items on your own, then a recap. Or run the full path again if you’d rather.</p>
        ) : (
          <Rich as="p" className="li-tutor-voice" text={lesson.intro} />
        )}
        <ul className="li-tutor-voice" style={{ margin: "20px 0", paddingLeft: 20 }}>
          {lesson.introBullets.map((b) => (
            <Rich key={b} as="li" text={b} />
          ))}
        </ul>
        {otherSession && otherLesson && otherSession.lessonId !== lesson.id && (
          <p className="li-note" style={{ marginBottom: 12 }}>
            Starting this path will set aside your unfinished {otherLesson.short} session. You can always return to it from the map.
          </p>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
          {isRefresh ? (
            <>
              <button className="li-btn li-btn--primary li-btn--lg" style={{ flex: 1 }} autoFocus onClick={() => start("refresh")}>
                Quick tune-up
              </button>
              <button className="li-btn li-btn--secondary" onClick={() => start("full")}>
                Full path
              </button>
            </>
          ) : (
            <button className="li-btn li-btn--primary li-btn--lg" style={{ flex: 1 }} autoFocus onClick={() => start(done === 0 && lesson.id === "A4" ? "starter" : "full")}>
              {done > 0 ? "Walk the path again" : "Start short path"}
            </button>
          )}
          <Link href="/map" className="li-btn li-btn--secondary">
            Maybe later
          </Link>
        </div>
        <p className="li-note" style={{ marginTop: 16 }}>
          About {lesson.minutes} minutes · Esc never wipes progress · your work saves as you go
        </p>
      </div>
    </div>
  );
}

/* ---------------- Runner ---------------- */

function Runner({ lesson, session }: { lesson: Lesson; session: LessonSession }) {
  const store = useStore();
  const router = useRouter();
  const screens = useMemo(() => screensFor(lesson, session.mode), [lesson, session.mode]);
  const screenIdx = Math.max(0, screens.indexOf(session.screen));
  const screen = screens[screenIdx] ?? screens[0];
  const items = itemsFor(lesson, screen, session.mode);
  const item = items[session.itemIndex];
  const [hintRequest, setHintRequest] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  const save = useCallback((patch: Partial<LessonSession>) => store.saveSession({ ...session, ...patch }), [store, session]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [screen, session.itemIndex]);

  const goNextScreen = () => {
    const next = screens[screenIdx + 1];
    if (next) save({ screen: next, itemIndex: 0, workedStep: 0 });
  };
  const goPrevScreen = () => {
    const prev = screens[screenIdx - 1];
    if (prev) save({ screen: prev, itemIndex: 0 });
  };

  const onItemDone = (attempt: LessonSession["attempts"][string]) => {
    if (item) store.recordAttempt(lesson, item.id, screen, attempt);
    const attempts = item ? { ...session.attempts, [item.id]: attempt } : session.attempts;
    if (session.itemIndex + 1 < items.length) save({ attempts, itemIndex: session.itemIndex + 1 });
    else {
      const next = screens[screenIdx + 1];
      save({ attempts, screen: next ?? "recap", itemIndex: 0, workedStep: 0 });
    }
  };

  const onSkip = () => {
    if (session.itemIndex + 1 < items.length) save({ itemIndex: session.itemIndex + 1 });
    else goNextScreen();
  };

  const onBridge = (bridgeId: string) => {
    // Pause here; the bridge session carries this session so we can resume at the failed item.
    store.startSession(bridgeId, "full", { lessonId: lesson.id, screen, itemIndex: session.itemIndex });
    router.push(`/lesson/${bridgeId}`);
  };

  const hasItems = screen === "recall" || screen === "guided" || screen === "independent" || screen === "transfer";
  const showHint = hasItems;

  return (
    <div className="li-app li-bg-lesson">
      <header className="li-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/map" className="li-icon-btn" aria-label="Back to map" title="Back to map">
            ←
          </Link>
          <Brand text={`${lesson.title.split(" · ")[0]} · ${lesson.code}`} />
        </div>
        <StageIndicator screen={screen} skipTransfer={!screens.includes("transfer")} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <PiBadge mode={item?.piMode ?? lesson.piMode} />
          {showHint && (
            <button type="button" className="li-btn li-btn--ghost li-btn--sm" onClick={() => setHintRequest((n) => n + 1)} aria-label="Reveal the next hint">
              Hint
            </button>
          )}
        </div>
      </header>

      <div className="li-lesson-body li-anim-enter" ref={bodyRef} key={`${screen}-${session.itemIndex}`}>
        {session.returnTo && (
          <p className="li-note" style={{ margin: "0 0 12px" }}>
            Bridge side-path · we’ll return to {getLesson(session.returnTo.lessonId)?.short ?? "your lesson"} when this is done.
          </p>
        )}
        {hasItems && item && (
          <ItemRunner
            lesson={lesson}
            item={item}
            screen={screen}
            index={session.itemIndex}
            total={items.length}
            onDone={({ attempt }) => onItemDone(attempt)}
            onSkip={screen === "recall" ? onSkip : undefined}
            onBridge={onBridge}
            declinedBridges={session.declinedBridges}
            completedBridges={session.completedBridges}
            hintRequest={hintRequest}
          />
        )}
        {hasItems && !item && (
          <div className="li-panel">
            <p className="li-tutor-voice">Nothing to practise on this stage — let’s move on.</p>
          </div>
        )}
        {screen === "goalVisual" && <GoalVisual lesson={lesson} />}
        {screen === "worked" && <Worked lesson={lesson} step={session.workedStep} onStep={(s) => save({ workedStep: s })} />}
        {screen === "recap" && <Recap lesson={lesson} session={session} />}
      </div>

      {screen !== "recap" && (
        <footer className="li-lesson-footer">
          <div>
            {screenIdx > 0 && !hasItems && (
              <button type="button" className="li-btn li-btn--ghost" onClick={goPrevScreen}>
                Back
              </button>
            )}
            {hasItems && !item && (
              <button type="button" className="li-btn li-btn--ghost" onClick={goPrevScreen}>
                Back
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span className="li-note">
              {screenTitle(screen)} · stage {Math.min(...stageNumbers(screen))} of 8
            </span>
            {!hasItems && screen === "goalVisual" && (
              <button type="button" className="li-btn li-btn--primary" onClick={goNextScreen} autoFocus>
                Continue to worked example
              </button>
            )}
            {!hasItems && screen === "worked" && (
              <button type="button" className="li-btn li-btn--primary" onClick={goNextScreen} disabled={session.workedStep < lesson.worked.steps.length - 1}>
                Try guided practice
              </button>
            )}
            {hasItems && !item && (
              <button type="button" className="li-btn li-btn--primary" onClick={goNextScreen}>
                Continue
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

function stageNumbers(s: Screen): number[] {
  return ({ recall: [1], goalVisual: [2, 3], worked: [4], guided: [5], independent: [6], transfer: [7], recap: [8] } as Record<Screen, number[]>)[s];
}

/* ---------------- Goal + Visual (one combined stage) ---------------- */

function GoalVisual({ lesson }: { lesson: Lesson }) {
  const g = lesson.goal;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 32, alignItems: "start" }} className="li-split">
      <div>
        <p className="li-eyebrow li-eyebrow--gold">Today’s goal</p>
        <Rich as="h1" className="li-display" text={g.statement} />
        <style>{`.li-split h1 { font-size: var(--li-text-2xl); margin: 0 0 16px; }`}</style>
        <TutorCard label="Your tutor · here’s what we’re aiming for" copy={g.tutor} mode="Goal + visual" gold />
        {g.formula && (
          <div className="li-katex-display" style={{ margin: "24px 0", padding: 20, background: "var(--li-gold-50)", borderRadius: "var(--li-radius-lg)", border: "1px solid var(--li-gold-200)", textAlign: "center" }}>
            <Tex tex={g.formula} display label={g.formulaPlain} />
          </div>
        )}
        {g.formulaPlain && <p className="li-note">Plain language: {g.formulaPlain}</p>}
        {g.after && <Rich as="p" className="li-tutor-voice" text={g.after} />}
      </div>
      <div className="li-card" style={{ padding: 24 }}>
        <p style={{ fontWeight: 600, margin: "0 0 8px", color: "var(--li-teal-400)" }}>{g.visualTitle}</p>
        <Diagram spec={g.visual} />
        <p className="li-note" style={{ marginTop: 8 }}>
          Stylised teaching diagram — the picture behind the formula.
        </p>
      </div>
      <style>{`@media (max-width: 1000px){ .li-split { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

/* ---------------- Worked example (I do) ---------------- */

function Worked({ lesson, step, onStep }: { lesson: Lesson; step: number; onStep: (s: number) => void }) {
  const w = lesson.worked;
  const last = w.steps.length - 1;
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    nextRef.current?.focus();
  }, []);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,0.9fr)", gap: 32 }} className="li-split">
      <div>
        <p className="li-eyebrow">Worked example · step {Math.min(step + 1, w.steps.length)} of {w.steps.length}</p>
        <h1 className="li-display" style={{ fontSize: "var(--li-text-2xl)", margin: "0 0 8px" }}>
          Worked example — show working
        </h1>
        <TutorCard label="Your tutor · I’ll model it" copy={w.tutor} mode="I do" gold className="li-worked-tutor" />
        <style>{`.li-worked-tutor{ margin: 12px 0 18px; }`}</style>
        <div className="li-panel" style={{ margin: "20px 0" }}>
          <Rich as="p" className="li-prompt" text={w.problem} />
        </div>
        <ol style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none", margin: 0, padding: 0 }} aria-live="polite">
          {w.steps.map((s, i) => {
            const status = i < step ? "is-done" : i === step ? "is-current" : "is-upcoming";
            return (
              <li key={i} className={`li-step ${status}`} aria-current={i === step ? "step" : undefined}>
                <div className="li-step__n" aria-hidden="true">
                  {i < step ? "✓" : i + 1}
                </div>
                <div style={{ minWidth: 0 }}>
                  <strong>{s.title}</strong>
                  {i <= step && s.latex && (
                    <div className="li-katex-large" style={{ marginTop: 8 }}>
                      <Tex tex={s.latex} />
                    </div>
                  )}
                  {i <= step && s.note && <Rich as="p" className="li-note" text={s.note} />}
                  {i > step && <p className="li-note" style={{ margin: "4px 0 0" }}>Revealed with the next step.</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="li-card" style={{ padding: 24, alignSelf: "start", position: "sticky", top: 8 }}>
        {w.visual && <Diagram spec={w.visual} />}
        <div className="li-hint li-hint--l1" style={{ margin: "8px 0 16px" }}>
          <strong>Why this route?</strong>
          <Rich as="p" className="li-hint__body" text={w.why} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="li-btn li-btn--secondary li-btn--sm" disabled={step === 0} onClick={() => onStep(step - 1)}>
            ← Prev step
          </button>
          <button ref={nextRef} type="button" className="li-btn li-btn--primary li-btn--sm" disabled={step >= last} onClick={() => onStep(Math.min(last, step + 1))}>
            {step >= last ? "All steps shown" : "Next step →"}
          </button>
        </div>
      </div>
      <style>{`@media (max-width: 1000px){ .li-split { grid-template-columns: 1fr !important; } .li-split > .li-card { position: static !important; } }`}</style>
    </div>
  );
}

/* ---------------- Recap + soft reward ---------------- */

function Recap({ lesson, session }: { lesson: Lesson; session: LessonSession }) {
  const store = useStore();
  const router = useRouter();
  const [result, setResult] = useState<{ collectible: Collectible; newState: SkillState } | null>(null);
  const completed = useRef(false);

  useEffect(() => {
    if (completed.current) return;
    completed.current = true;
    setResult(store.completeLesson(lesson, session));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const returnTo = session.returnTo;
  const parentLesson = returnTo ? getLesson(returnTo.lessonId) : undefined;

  const leave = () => {
    if (returnTo && session.parentSession) {
      const parent = session.parentSession;
      store.saveSession({ ...parent, completedBridges: [...parent.completedBridges, lesson.id] });
      router.push(`/lesson/${returnTo.lessonId}`);
      return;
    }
    store.clearSession();
    router.push("/map");
  };

  const state: SkillState = result?.newState ?? "Practising";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(0,0.8fr)", gap: 40, alignItems: "center", padding: "20px 0" }} className="li-split">
      <div>
        <h1 className="li-display" style={{ fontSize: "var(--li-text-3xl)", margin: "0 0 16px" }}>
          {lesson.recap.headline}
        </h1>
        <TutorCard label="Your tutor · pack these for the next path" copy={lesson.recap.tutor} mode="Recap" gold />
        <p className="li-eyebrow li-eyebrow--gold" style={{ marginTop: 16 }}>
          Three things to keep
        </p>
        <ul className="li-tutor-voice" style={{ fontSize: "var(--li-text-lg)", lineHeight: 1.8, paddingLeft: 24, margin: 0 }}>
          {lesson.recap.bullets.map((b) => (
            <Rich key={b} as="li" text={b} />
          ))}
        </ul>
        {lesson.recap.nextPath && (
          <div className="li-panel" style={{ padding: "12px 16px", marginTop: 16 }}>
            <span className="li-tutor-label" style={{ color: "var(--li-violet-400)" }}>
              When you’re ready
            </span>
            <Rich as="p" className="li-tutor-copy" text={lesson.recap.nextPath} />
          </div>
        )}
        <p className="li-tutor-voice" style={{ marginTop: 16 }}>
          {returnTo && parentLesson ? `Shore-up done. Let’s pick up ${parentLesson.short} exactly where we paused.` : "See you back on the Isles — when you return, I’ll start with a quick recall before anything new."}
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
          <button type="button" className={`li-btn ${returnTo ? "li-btn--teal" : "li-btn--primary"} li-btn--lg`} autoFocus onClick={leave}>
            {returnTo && parentLesson ? `Resume ${parentLesson.short}` : "Return to map"}
          </button>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div className="li-badge-collect li-anim-badge" style={{ margin: "0 auto 16px", width: 120, height: 120, fontSize: 48 }} aria-label={`Soft collectible: ${lesson.recap.collectible.name}`} role="img">
          {lesson.recap.collectible.glyph}
        </div>
        <p style={{ fontWeight: 600, color: "var(--li-gold-500)", margin: 0 }}>{lesson.recap.collectible.name}</p>
        <p className="li-note">{lesson.recap.collectible.blurb}</p>
        <span className={chipClass(state)} style={{ marginTop: 12 }}>
          Skill · {state}
        </span>
        {lesson.kind === "core" && (
          <p className="li-note" style={{ marginTop: 12 }}>
            {lesson.short} on the map now glows.
          </p>
        )}
      </div>
      <style>{`@media (max-width: 1000px){ .li-split { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function UnderConstruction() {
  return (
    <div className="li-app li-bg-isles" style={{ alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div className="li-card" style={{ padding: 28, textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.6 }} aria-hidden="true">
          🗺
        </div>
        <h1 className="li-display" style={{ fontSize: "var(--li-text-xl)", margin: "0 0 8px" }}>
          Path under construction
        </h1>
        <p className="li-tutor-voice" style={{ fontSize: "var(--li-text-sm)" }}>
          This trail isn’t open yet. The Isles grow carefully — try a lit path on the starter isle for now.
        </p>
        <Link href="/map" className="li-btn li-btn--secondary li-btn--sm" style={{ marginTop: 16 }}>
          Back to map
        </Link>
      </div>
    </div>
  );
}
