import type { Screen, SkillState } from "@/content/types";

/**
 * Skill-state heuristics (v1, documented in README):
 * - New → Practising: first correct answer in guided or independent.
 * - Practising → Ready independently: lesson completed with every independent + transfer
 *   item correct on the first attempt and without hints (sustained independent success).
 * - Ready independently → Needs refresh: ≥ REFRESH_IDLE_DAYS without activity, or a miss on
 *   an item owned by the skill.
 * - Failures while New / Practising never demote.
 */
export const REFRESH_IDLE_DAYS = 14;

export interface SkillRecord {
  state: SkillState;
  lastActivity: number;
  successes: number;
  cleanCompletions: number;
  placement?: "okay" | "refresher" | "new" | "skip";
}

export interface ItemAttempt {
  wrong: number;
  hintsUsed: number;
  correct: boolean;
  usedAlt: boolean;
  firstTryClean: boolean;
}

export interface LessonSession {
  lessonId: string;
  screen: Screen;
  itemIndex: number;
  workedStep: number;
  attempts: Record<string, ItemAttempt>;
  declinedBridges: string[];
  completedBridges: string[];
  /** Set when this session is a bridge launched from another lesson — the paused parent session */
  returnTo?: { lessonId: string; screen: Screen; itemIndex: number };
  parentSession?: LessonSession;
  mode: "full" | "refresh" | "starter";
  startedAt: number;
}

export interface Collectible {
  id: string;
  name: string;
  glyph: string;
  blurb: string;
  at: number;
  source: string;
}

export interface LessonRecord {
  completions: number;
  lastAt: number;
  clean: boolean;
}

export interface Progress {
  version: 1;
  learner: { name: string; avatar: string } | null;
  pinHash: string | null;
  onboarded: boolean;
  placementDone: boolean;
  skills: Record<string, SkillRecord>;
  lessons: Record<string, LessonRecord>;
  collectibles: Collectible[];
  restoredNodes: string[];
  session: LessonSession | null;
  lastLessonId: string | null;
  parentGate: { failed: number; lockedUntil: number };
  createdAt: number;
  updatedAt: number;
}

export const STORAGE_KEY = "lumen-isles:v1";

export function emptyProgress(): Progress {
  const now = Date.now();
  return {
    version: 1,
    learner: null,
    pinHash: null,
    onboarded: false,
    placementDone: false,
    skills: {},
    lessons: {},
    collectibles: [],
    restoredNodes: [],
    session: null,
    lastLessonId: null,
    parentGate: { failed: 0, lockedUntil: 0 },
    createdAt: now,
    updatedAt: now,
  };
}

export function skillOf(p: Progress, id: string): SkillRecord {
  return p.skills[id] ?? { state: "New", lastActivity: 0, successes: 0, cleanCompletions: 0 };
}

/** Apply the idle heuristic when reading a skill for display / entry */
export function effectiveState(rec: SkillRecord, now = Date.now()): SkillState {
  if (rec.state === "Ready independently" && rec.lastActivity > 0) {
    const idleDays = (now - rec.lastActivity) / (1000 * 60 * 60 * 24);
    if (idleDays >= REFRESH_IDLE_DAYS) return "Needs refresh";
  }
  return rec.state;
}

export function chipClass(state: SkillState): string {
  switch (state) {
    case "New":
      return "li-chip li-chip--new";
    case "Practising":
      return "li-chip li-chip--practising";
    case "Ready independently":
      return "li-chip li-chip--ready";
    case "Needs refresh":
      return "li-chip li-chip--refresh";
  }
}

/* ---------------- PIN (local deterrent, documented limitation) ---------------- */

const PIN_SALT = "lumen-isles-parent-pin";

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${PIN_SALT}:${pin}`);
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback for non-secure contexts: simple deterministic hash (deterrent only)
  let h = 2166136261;
  for (const b of data) {
    h ^= b;
    h = Math.imul(h, 16777619);
  }
  return `fnv-${(h >>> 0).toString(16)}`;
}
