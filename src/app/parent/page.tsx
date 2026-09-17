"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Brand, Loading, Modal, PinPad } from "@/components/ui";
import { CORE_LESSONS, LESSON_LIST, TRACKS } from "@/content";
import { PAPERS } from "@/content/sources";
import { chipClass, effectiveState, skillOf, REFRESH_IDLE_DAYS, STORAGE_KEY } from "@/lib/progress";
import type { SkillState, TrackId } from "@/content/types";
import { avatarName } from "@/components/Onboarding";

export default function ParentPage() {
  const store = useStore();
  const router = useRouter();
  const { progress, hydrated } = store;
  const [unlocked, setUnlocked] = useState(false);

  if (!hydrated) return <Loading />;
  if (!progress.onboarded || !progress.pinHash) {
    router.replace("/");
    return <Loading />;
  }
  if (!unlocked) return <Gate onUnlock={() => setUnlocked(true)} />;
  return <Dashboard onLock={() => setUnlocked(false)} />;
}

/* ---------------- PIN gate (frame 24) ---------------- */

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const store = useStore();
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const lockedUntil = store.progress.parentGate.lockedUntil;
  const locked = lockedUntil > now;

  useEffect(() => {
    if (!locked) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [locked]);

  const submit = async () => {
    if (locked) return;
    const ok = await store.verifyPin(pin);
    if (ok) {
      store.resetPinFailures();
      onUnlock();
      return;
    }
    store.registerPinFailure();
    const failed = store.progress.parentGate.failed + 1;
    setPin("");
    if (failed >= 3) {
      setMsg("Three tries didn’t match. The parent area rests for a minute — no email reset, nothing lost. Try again shortly.");
    } else {
      setMsg("That PIN didn’t match — no problem, try again.");
    }
  };

  const secs = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

  return (
    <div className="li-app li-bg-parent" style={{ alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div className="li-card li-anim-enter" style={{ maxWidth: 420, width: "100%", padding: 40, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <Brand text="Parent area" />
        </div>
        <h1 className="li-display" style={{ fontSize: "var(--li-text-2xl)", margin: "0 0 8px" }}>
          Enter parent PIN
        </h1>
        <p className="li-tutor-voice">Four digits set on first launch. Progress and citations stay on this device.</p>
        <div style={{ marginTop: 28 }}>
          <PinPad value={pin} onChange={setPin} onSubmit={submit} disabled={locked} label="Parent PIN keypad" />
        </div>
        <div aria-live="polite" style={{ minHeight: 24, marginTop: 16 }}>
          {locked ? (
            <p className="li-feedback-retry" style={{ textAlign: "left" }}>
              <span aria-hidden="true">·</span>
              <span>Resting for {secs}s. Progress is safe; nothing needs recovering.</span>
            </p>
          ) : (
            msg && (
              <p className="li-feedback-retry" style={{ textAlign: "left" }}>
                <span aria-hidden="true">·</span>
                <span>{msg}</span>
              </p>
            )
          )}
        </div>
        <p className="li-note" style={{ marginTop: 12 }}>
          Wrong PIN → calm retry. No email reset (local-only).
        </p>
        <Link href="/" className="li-btn li-btn--ghost" style={{ marginTop: 12 }}>
          Back to learner home
        </Link>
      </div>
    </div>
  );
}

/* ---------------- Dashboard (frame 25) + export (frame 26, SHOULD) ---------------- */

function Dashboard({ onLock }: { onLock: () => void }) {
  const store = useStore();
  const router = useRouter();
  const { progress } = store;
  const [exportOpen, setExportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [tab, setTab] = useState<"progress" | "skills" | "citations" | "about">("progress");

  const states = CORE_LESSONS.map((l) => ({ lesson: l, rec: skillOf(progress, l.id), state: effectiveState(skillOf(progress, l.id)) }));
  const byTrack = (t: TrackId) => states.filter((s) => s.lesson.track === t);
  const count = (t: TrackId, st: SkillState) => byTrack(t).filter((s) => s.state === st).length;

  const bridgesDone = LESSON_LIST.filter((l) => l.kind === "bridge" && progress.lessons[l.id]);
  const lessonsDone = Object.values(progress.lessons).reduce((a, r) => a + r.completions, 0);

  const fmt = (t: number) => (t ? new Date(t).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—");

  return (
    <div className="li-app li-bg-parent">
      <header className="li-topbar li-no-print">
        <Brand text="Parent · Lumen Isles" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="li-btn li-btn--secondary li-btn--sm" onClick={() => setExportOpen(true)}>
            Export PDF
          </button>
          <button type="button" className="li-btn li-btn--ghost li-btn--sm" onClick={onLock}>
            Lock
          </button>
          <Link href="/" className="li-btn li-btn--ghost li-btn--sm">
            Learner home
          </Link>
        </div>
      </header>

      <main style={{ padding: "8px 48px 40px", maxWidth: 1440, margin: "0 auto", width: "100%" }} className="li-parent-main">
        <div className="li-no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <p className="li-eyebrow li-eyebrow--violet" style={{ marginBottom: 4 }}>
              Explorer
            </p>
            <h1 className="li-display" style={{ fontSize: "var(--li-text-2xl)", margin: 0 }}>
              {progress.learner?.name} · {avatarName(progress.learner?.avatar)}
            </h1>
            <p className="li-note" style={{ marginTop: 4 }}>
              {lessonsDone} lesson {lessonsDone === 1 ? "completion" : "completions"} · {progress.collectibles.length} collectibles · last activity {fmt(progress.updatedAt)}
            </p>
          </div>
          <div className="li-tabbar" role="tablist" aria-label="Parent sections">
            {(["progress", "skills", "citations", "about"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} aria-controls={`panel-${t}`} id={`tab-${t}`} className={`li-tab ${tab === t ? "is-active" : ""}`} onClick={() => setTab(t)}>
                {t === "progress" ? "Progress" : t === "skills" ? "Skills" : t === "citations" ? "Citations" : "About the data"}
              </button>
            ))}
          </div>
        </div>

        {/* Print version shows everything */}
        <div className="li-print-only">
          <h1 className="li-display" style={{ fontSize: 24 }}>
            Lumen Isles — progress snapshot
          </h1>
          <p>
            Learner: {progress.learner?.name} · Generated {new Date().toLocaleString("en-ZA")} · Local device export, no cloud.
          </p>
        </div>

        <section id="panel-progress" role="tabpanel" aria-labelledby="tab-progress" hidden={tab !== "progress"} className="li-print-section">
            <div className="li-panel">
              <h2 className="li-display" style={{ fontSize: "var(--li-text-xl)", margin: "0 0 16px" }}>
                Progress overview
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }} className="li-overview-grid">
                {(["A", "B", "C"] as TrackId[]).map((t) => {
                  const bg = t === "A" ? "var(--li-teal-50)" : t === "B" ? "var(--li-gold-50)" : "var(--li-violet-50)";
                  const fg = t === "A" ? "var(--li-teal-400)" : t === "B" ? "var(--li-gold-500)" : "var(--li-violet-400)";
                  const total = byTrack(t).length;
                  const ready = count(t, "Ready independently");
                  const prac = count(t, "Practising");
                  const refresh = count(t, "Needs refresh");
                  return (
                    <div key={t} style={{ padding: 16, background: bg, borderRadius: 12 }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: fg }}>{t}</div>
                      <div style={{ fontWeight: 600, fontSize: "var(--li-text-sm)" }}>{TRACKS[t].name}</div>
                      <div className="li-note">
                        {ready} ready · {prac} practising · {refresh} refresh · {total - ready - prac - refresh} new
                      </div>
                    </div>
                  );
                })}
                <div style={{ padding: 16, background: "var(--li-cream-200)", borderRadius: 12 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--li-ink-500)" }}>BR</div>
                  <div style={{ fontWeight: 600, fontSize: "var(--li-text-sm)" }}>Bridges</div>
                  <div className="li-note">{bridgesDone.length} of 4 side-lessons used</div>
                </div>
              </div>
              <h3 style={{ margin: "24px 0 12px", fontSize: "var(--li-text-base)" }}>Recent lessons</h3>
              {Object.keys(progress.lessons).length === 0 ? (
                <p className="li-tutor-voice" style={{ fontSize: "var(--li-text-sm)" }}>
                  No lessons completed yet. After the first Circles path, the starter beacon and its citation appear here.
                </p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: "var(--li-text-sm)" }}>
                  {Object.entries(progress.lessons)
                    .sort((a, b) => b[1].lastAt - a[1].lastAt)
                    .slice(0, 8)
                    .map(([id, r]) => {
                      const l = LESSON_LIST.find((x) => x.id === id);
                      if (!l) return null;
                      return (
                        <li key={id} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <span>
                            {l.title} · {r.completions}× · {fmt(r.lastAt)}
                          </span>
                          <span className={chipClass(effectiveState(skillOf(progress, id)))}>{effectiveState(skillOf(progress, id))}</span>
                        </li>
                      );
                    })}
                </ul>
              )}
              <h3 style={{ margin: "24px 0 12px", fontSize: "var(--li-text-base)" }}>Source papers (evidence mapping)</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {PAPERS.map((p) => (
                  <li key={p.file} style={{ fontSize: "var(--li-text-sm)" }}>
                    <span className="li-cite__file">{p.file}</span> — {p.label}
                  </li>
                ))}
              </ul>
            </div>
          </section>

        <section id="panel-skills" role="tabpanel" aria-labelledby="tab-skills" hidden={tab !== "skills"} className="li-print-section">
          <div className="li-panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 20px 12px" }}>
              <h2 className="li-display" style={{ fontSize: "var(--li-text-xl)", margin: 0 }}>
                Skill states
              </h2>
              <p className="li-note" style={{ margin: "8px 0 0" }}>
                New → Practising (first success in guided/independent) → Ready independently (a full lesson with independent + transfer items right first time, no hints) → Needs refresh ({REFRESH_IDLE_DAYS}+ days idle, or a miss on an owned item).
              </p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--li-text-sm)" }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--li-ink-400)" }}>
                  <th style={{ padding: "8px 20px", fontWeight: 600 }}>Skill</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600 }}>Track</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600 }}>State</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600 }}>Placement</th>
                  <th style={{ padding: "8px 20px", fontWeight: 600 }}>Last activity</th>
                </tr>
              </thead>
              <tbody>
                {states.map(({ lesson, rec, state }) => (
                  <tr key={lesson.id} style={{ borderTop: "1px solid var(--li-cream-300)" }}>
                    <td style={{ padding: "10px 20px" }}>
                      <strong>{lesson.code}</strong> {lesson.short}
                    </td>
                    <td style={{ padding: "10px 12px" }}>{TRACKS[lesson.track].name}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span className={chipClass(state)}>{state}</span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--li-ink-500)" }}>{placementLabel(rec.placement)}</td>
                    <td style={{ padding: "10px 20px", color: "var(--li-ink-500)" }}>{fmt(rec.lastActivity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="panel-citations" role="tabpanel" aria-labelledby="tab-citations" hidden={tab !== "citations"} className="li-print-section">
          <div className="li-panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 20px 12px" }}>
              <h2 className="li-display" style={{ fontSize: "var(--li-text-xl)", margin: 0 }}>
                Lesson evidence · citations
              </h2>
              <p className="li-note" style={{ margin: "8px 0 0" }}>
                Each lesson maps to the Herzlia paper page that assesses the skill. Learner practice stays original — nothing is copied from the papers.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, padding: "0 20px 8px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--li-ink-400)", fontWeight: 600 }}>
              <span>Lesson</span>
              <span>State</span>
              <span>Citation</span>
            </div>
            {LESSON_LIST.map((l) => {
              const st = effectiveState(skillOf(progress, l.id));
              return l.citations.map((c, i) => (
                <div key={`${l.id}-${i}`} className="li-cite" tabIndex={0} aria-label={`${l.title}, ${st}, ${c.file} page ${c.page}${c.note ? `, ${c.note}` : ""}`}>
                  <span>
                    {i === 0 ? l.title : <span className="li-note">↳ also</span>}
                    {c.note && <span className="li-note"> · {c.note}</span>}
                  </span>
                  <span className={chipClass(st)}>{l.kind === "bridge" && st === "New" ? "Bridge" : st}</span>
                  <span className="li-cite__file">
                    {c.file} p.{c.page}
                  </span>
                </div>
              ));
            })}
          </div>
        </section>

        <section id="panel-about" role="tabpanel" aria-labelledby="tab-about" hidden={tab !== "about"} className="li-no-print">
          <div className="li-panel">
            <h2 className="li-display" style={{ fontSize: "var(--li-text-xl)", margin: "0 0 12px" }}>
              About the data
            </h2>
            <ul className="li-tutor-voice" style={{ fontSize: "var(--li-text-base)", paddingLeft: 20, margin: 0 }}>
              <li>
                Everything lives in this browser’s local storage under the key <code>{STORAGE_KEY}</code>. No account, no cloud, no analytics.
              </li>
              <li>The parent PIN is stored as a salted SHA-256 hash — a deterrent against casual access, not bank-grade security.</li>
              <li>Clearing site data for this URL resets the app to the first session (expected).</li>
              <li>“Export PDF” uses the browser’s print dialog — choose “Save as PDF”. Generated locally.</li>
            </ul>
            <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="button" className="li-btn li-btn--secondary li-btn--sm" onClick={() => setResetOpen(true)}>
                Reset all progress on this device
              </button>
            </div>
          </div>
        </section>
      </main>

      {exportOpen && (
        <Modal labelledBy="export-title" onEscape={() => setExportOpen(false)}>
          <h2 id="export-title" className="li-display" style={{ fontSize: "var(--li-text-2xl)", margin: "0 0 12px" }}>
            Export progress PDF
          </h2>
          <p className="li-tutor-voice">Optional download for your records. Generated locally — no cloud upload. Includes skill states and citation rows (filename p.N).</p>
          <ul className="li-tutor-voice" style={{ margin: "16px 0", paddingLeft: 20 }}>
            <li>Learner display name</li>
            <li>Track A–C snapshot + bridges</li>
            <li>Lesson list with PDF citations</li>
          </ul>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              type="button"
              className="li-btn li-btn--primary"
              style={{ flex: 1 }}
              onClick={() => {
                setExportOpen(false);
                window.setTimeout(() => window.print(), 150);
              }}
            >
              Download PDF (print dialog)
            </button>
            <button type="button" className="li-btn li-btn--secondary" onClick={() => setExportOpen(false)}>
              Cancel
            </button>
          </div>
          <p className="li-note" style={{ marginTop: 16 }}>
            In the print dialog choose “Save as PDF”. Optional parent export only.
          </p>
        </Modal>
      )}

      {resetOpen && (
        <Modal labelledBy="reset-title" onEscape={() => setResetOpen(false)}>
          <h2 id="reset-title" className="li-display" style={{ fontSize: "var(--li-text-2xl)", margin: "0 0 12px" }}>
            Reset everything on this device?
          </h2>
          <p className="li-tutor-voice">This clears the learner profile, PIN, skill states and collectibles from this browser. The first-session flow starts again. There is no undo.</p>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              type="button"
              className="li-btn li-btn--secondary"
              style={{ flex: 1 }}
              onClick={() => {
                store.resetAll();
                router.push("/");
              }}
            >
              Yes, reset
            </button>
            <button type="button" className="li-btn li-btn--primary" style={{ flex: 1 }} onClick={() => setResetOpen(false)}>
              Keep progress
            </button>
          </div>
        </Modal>
      )}
      <style>{`
        @media (max-width: 1000px){ .li-parent-main { padding: 8px 16px 32px !important; } .li-overview-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; } }
        @media print { .li-print-section[hidden] { display: block !important; margin-top: 16px; } .li-parent-main { padding: 0 !important; } .li-panel { break-inside: avoid; } }
      `}</style>
    </div>
  );
}

function placementLabel(p?: string) {
  switch (p) {
    case "okay":
      return "Felt okay";
    case "refresher":
      return "Wanted a refresher";
    case "new":
      return "Hadn’t learned yet";
    case "skip":
      return "Skipped";
    default:
      return "—";
  }
}
