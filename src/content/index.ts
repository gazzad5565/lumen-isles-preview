import type { Lesson, TrackId } from "./types";
import { CIRCLES } from "./lessons/circles";
import { BRIDGES } from "./lessons/bridges";
import { ALGEBRA } from "./lessons/algebra";
import { MEASURE } from "./lessons/measure";

export const LESSON_LIST: Lesson[] = [...CIRCLES, ...MEASURE, ...ALGEBRA, ...BRIDGES];

export const LESSONS: Record<string, Lesson> = Object.fromEntries(LESSON_LIST.map((l) => [l.id, l]));

export function getLesson(id: string): Lesson | undefined {
  return LESSONS[id];
}

export const TRACKS: Record<TrackId, { name: string; blurb: string; island: string }> = {
  A: { name: "Circles", blurb: "Parts, circumference and area with π = 3,14 and 22/7", island: "Beacon Isle" },
  B: { name: "Perimeter & area", blurb: "Squares, rectangles, triangles and a composite", island: "Garden Shore" },
  C: { name: "Algebra", blurb: "Words → expressions, like terms, substitution", island: "Cipher Cove" },
  BR: { name: "Bridges", blurb: "Short side-lessons that shore up a prerequisite", island: "Bridge planks" },
};

/** Core skills shown in learner/parent skill tables (bridges shown separately) */
export const CORE_LESSONS = LESSON_LIST.filter((l) => l.kind === "core");

/** Starter lesson — first session lands here (design frame 07) */
export const STARTER_LESSON_ID = "A4";

/* ---------------- Placement (gentle, self-report + light probe) ---------------- */

export interface PlacementCluster {
  id: string;
  track: TrackId;
  title: string;
  question: string;
  formula?: string;
  /** Skills marked by this cluster’s answer */
  skills: string[];
  probe: {
    prompt: string;
    options: string[];
    correctIndex: number;
  };
}

export const PLACEMENT: PlacementCluster[] = [
  {
    id: "circles",
    track: "A",
    title: "Circumference — how familiar?",
    question: "Finding the distance around a circle from its radius or diameter.",
    formula: "C = \\pi d \\quad\\text{or}\\quad C = 2\\pi r",
    skills: ["A1", "A2", "A3", "A4"],
    probe: {
      prompt: "A circle has diameter $10\\,\\text{cm}$. With $\\pi = 3{,}14$, its circumference is…",
      options: ["15,7 cm", "31,4 cm", "62,8 cm", "314 cm"],
      correctIndex: 1,
    },
  },
  {
    id: "area",
    track: "B",
    title: "Perimeter and area — how familiar?",
    question: "Perimeter of squares and rectangles; area of rectangles and triangles.",
    formula: "P = 2(l + b) \\qquad A = l \\times b",
    skills: ["B1", "B2"],
    probe: {
      prompt: "A rectangle is $6\\,\\text{cm}$ by $4\\,\\text{cm}$. Its **area** is…",
      options: ["10 cm²", "20 cm²", "24 cm²", "48 cm²"],
      correctIndex: 2,
    },
  },
  {
    id: "algebra",
    track: "C",
    title: "Algebra expressions — how familiar?",
    question: "Writing expressions from words and collecting like terms.",
    formula: "5h + h - 2h = 4h",
    skills: ["C1", "C2"],
    probe: {
      prompt: "Simplified, $3x + 5x - x$ is…",
      options: ["$7x$", "$8x$", "$9x$", "$7$"],
      correctIndex: 0,
    },
  },
];

export const PLACEMENT_OPTIONS = [
  { id: "okay", label: "I’ve used this and feel okay" },
  { id: "refresher", label: "I’ve seen it but need a refresher" },
  { id: "new", label: "I haven’t learned this yet", strong: true },
  { id: "skip", label: "Skip this cluster for now" },
] as const;

export type PlacementChoice = (typeof PLACEMENT_OPTIONS)[number]["id"];
