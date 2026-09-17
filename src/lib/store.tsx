"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Lesson, Screen, SkillState } from "@/content/types";
import { getLesson, PLACEMENT } from "@/content";
import type { PlacementChoice } from "@/content";
import {
  emptyProgress,
  hashPin,
  skillOf,
  STORAGE_KEY,
  type Collectible,
  type ItemAttempt,
  type LessonSession,
  type Progress,
} from "./progress";

interface StoreApi {
  progress: Progress;
  hydrated: boolean;
  update: (fn: (p: Progress) => Progress) => void;
  /* onboarding */
  setLearner: (name: string, avatar: string) => void;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  applyPlacement: (choices: Record<string, { choice: PlacementChoice; probeCorrect?: boolean }>) => void;
  finishOnboarding: () => void;
  /* sessions */
  startSession: (lessonId: string, mode: LessonSession["mode"], returnTo?: LessonSession["returnTo"]) => LessonSession;
  saveSession: (session: LessonSession) => void;
  clearSession: () => void;
  recordAttempt: (lesson: Lesson, itemId: string, screen: Screen, attempt: ItemAttempt) => void;
  completeLesson: (lesson: Lesson, session: LessonSession) => { collectible: Collectible; newState: SkillState };
  restoreNode: (nodeId: string, collectible: Omit<Collectible, "id" | "at" | "source">) => void;
  /* parent */
  registerPinFailure: () => void;
  resetPinFailures: () => void;
  resetAll: () => void;
}

/* ---------------- External store (useSyncExternalStore) ----------------
   Server snapshot is a stable empty state (hydrated=false); the first client
   snapshot loads localStorage once. React re-renders with client data after
   hydration, so the UI shows a calm loading state instead of mismatching. */

interface State {
  progress: Progress;
  hydrated: boolean;
}

const SERVER_STATE: State = { progress: { ...emptyProgress(), createdAt: 0, updatedAt: 0 }, hydrated: false };
let clientState: State | null = null;
const listeners = new Set<() => void>();

function load(): Progress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Progress;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getSnapshot(): State {
  if (!clientState) clientState = { progress: load() ?? emptyProgress(), hydrated: true };
  return clientState;
}

function getServerSnapshot(): State {
  return SERVER_STATE;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function setProgress(next: Progress) {
  clientState = { progress: next, hydrated: true };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — progress stays in memory for this visit */
  }
  listeners.forEach((l) => l());
}

function current(): Progress {
  return getSnapshot().progress;
}

export function useStore(): StoreApi {
  const { progress, hydrated } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((fn: (p: Progress) => Progress) => {
    setProgress({ ...fn(current()), updatedAt: Date.now() });
  }, []);

  const api = useMemo<StoreApi>(() => {
    const touchSkill = (p: Progress, id: string, patch: Partial<Progress["skills"][string]>) => {
      const rec = skillOf(p, id);
      return { ...p, skills: { ...p.skills, [id]: { ...rec, ...patch } } };
    };

    return {
      progress,
      hydrated,
      update,

      setLearner: (name, avatar) => update((p) => ({ ...p, learner: { name: name.trim(), avatar } })),

      setPin: async (pin) => {
        const pinHash = await hashPin(pin);
        update((p) => ({ ...p, pinHash }));
      },

      verifyPin: async (pin) => {
        const h = await hashPin(pin);
        return h === current().pinHash;
      },

      applyPlacement: (choices) =>
        update((p) => {
          let next = { ...p, placementDone: true };
          const now = Date.now();
          for (const cluster of PLACEMENT) {
            const c = choices[cluster.id];
            if (!c || c.choice === "skip") continue;
            for (const skill of cluster.skills) {
              const rec = skillOf(next, skill);
              // Placement only ever sets a starting point; it never awards Ready independently.
              const state = c.choice === "okay" && c.probeCorrect ? "Practising" : "New";
              next = touchSkill(next, skill, { ...rec, state, placement: c.choice, lastActivity: state === "Practising" ? now : rec.lastActivity });
            }
          }
          return next;
        }),

      finishOnboarding: () => update((p) => ({ ...p, onboarded: true })),

      startSession: (lessonId, mode, returnTo) => {
        const lesson = getLesson(lessonId);
        const startScreen: Screen = mode === "refresh" ? "recall" : lesson && lesson.recall.length ? "recall" : "goalVisual";
        const parentSession = returnTo ? (current().session ?? undefined) : undefined;
        const session: LessonSession = {
          lessonId,
          screen: startScreen,
          itemIndex: 0,
          workedStep: 0,
          attempts: {},
          declinedBridges: [],
          completedBridges: [],
          returnTo,
          parentSession,
          mode,
          startedAt: Date.now(),
        };
        update((p) => ({ ...p, session, lastLessonId: lessonId }));
        return session;
      },

      saveSession: (session) => update((p) => ({ ...p, session })),

      clearSession: () => update((p) => ({ ...p, session: null })),

      recordAttempt: (lesson, itemId, screen, attempt) =>
        update((p) => {
          const now = Date.now();
          const rec = skillOf(p, lesson.id);
          let state = rec.state;
          let successes = rec.successes;
          if (attempt.correct && (screen === "guided" || screen === "independent" || screen === "transfer")) {
            successes += 1;
            if (state === "New") state = "Practising";
            if (state === "Needs refresh" && screen !== "guided") state = "Ready independently";
          }
          if (!attempt.correct && attempt.wrong >= 2 && state === "Ready independently") {
            state = "Needs refresh";
          }
          return touchSkill(p, lesson.id, { state, successes, lastActivity: now });
        }),

      completeLesson: (lesson, session) => {
        const now = Date.now();
        const judged =
          session.mode === "refresh" ? lesson.independent.slice(0, 3) : lesson.kind === "bridge" ? lesson.independent : [...lesson.independent, ...lesson.transfer];
        const clean =
          judged.length > 0 &&
          judged.every((it) => {
            const a = session.attempts[it.id];
            return a?.correct && a.firstTryClean;
          });
        const collectible: Collectible = {
          id: `${lesson.id}-${now}`,
          name: lesson.recap.collectible.name,
          glyph: lesson.recap.collectible.glyph,
          blurb: lesson.recap.collectible.blurb,
          at: now,
          source: lesson.id,
        };
        let newState: SkillState = "Practising";
        update((p) => {
          const rec = skillOf(p, lesson.id);
          let state = rec.state;
          let cleanCompletions = rec.cleanCompletions;
          if (lesson.kind === "core") {
            if (state === "New") state = "Practising";
            if (clean) {
              cleanCompletions += 1;
              state = "Ready independently";
            } else if (state === "Needs refresh") {
              state = "Practising";
            }
          } else {
            state = clean ? "Ready independently" : "Practising";
          }
          newState = state;
          const lessonRec = p.lessons[lesson.id] ?? { completions: 0, lastAt: 0, clean: false };
          const alreadyHas = p.collectibles.some((c) => c.source === lesson.id);
          const next: Progress = {
            ...p,
            skills: { ...p.skills, [lesson.id]: { ...rec, state, cleanCompletions, lastActivity: now, successes: rec.successes } },
            lessons: { ...p.lessons, [lesson.id]: { completions: lessonRec.completions + 1, lastAt: now, clean: lessonRec.clean || clean } },
            collectibles: alreadyHas ? p.collectibles : [...p.collectibles, collectible],
            restoredNodes: p.restoredNodes.includes(lesson.id) ? p.restoredNodes : [...p.restoredNodes, lesson.id],
          };
          return next;
        });
        return { collectible, newState };
      },

      restoreNode: (nodeId, c) =>
        update((p) => {
          if (p.restoredNodes.includes(nodeId)) return p;
          const now = Date.now();
          return {
            ...p,
            restoredNodes: [...p.restoredNodes, nodeId],
            collectibles: [...p.collectibles, { ...c, id: `${nodeId}-${now}`, at: now, source: nodeId }],
          };
        }),

      registerPinFailure: () =>
        update((p) => {
          const failed = p.parentGate.failed + 1;
          const lockedUntil = failed >= 3 ? Date.now() + 60_000 : 0;
          return { ...p, parentGate: { failed: failed >= 3 ? 0 : failed, lockedUntil } };
        }),

      resetPinFailures: () => update((p) => ({ ...p, parentGate: { failed: 0, lockedUntil: 0 } })),

      resetAll: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        setProgress(emptyProgress());
      },
    };
  }, [progress, hydrated, update]);

  return api;
}
