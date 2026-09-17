/**
 * Lumen Isles content model.
 * Text fields accept inline KaTeX between $…$ (SA comma decimals as 3{,}14).
 * All practice items are original — inspired by Herzlia paper skills, never copied.
 */

export type TrackId = "A" | "B" | "C" | "BR";

export type PiMode = "3,14" | "22/7" | "both" | "none";

export type SkillState =
  | "New"
  | "Practising"
  | "Ready independently"
  | "Needs refresh";

export interface Citation {
  file: string;
  page: number;
  note?: string;
}

/* ---------- Visuals (stylised SVG teaching diagrams) ---------- */

export type VisualSpec =
  | {
      kind: "circle";
      /** Which parts to draw/label */
      radius?: boolean;
      diameter?: boolean;
      chord?: boolean;
      arc?: boolean;
      centre?: boolean;
      labels?: { r?: string; d?: string; C?: string; chord?: string };
      shadeArea?: boolean;
      caption?: string;
    }
  | { kind: "semicircle"; label?: string; shade?: boolean; caption?: string }
  | { kind: "quarter"; label?: string; shade?: boolean; caption?: string }
  | { kind: "diameters-around"; caption?: string }
  | { kind: "wheel"; label?: string; caption?: string }
  | { kind: "garden"; label?: string; caption?: string }
  | { kind: "rectangle"; w: string; h: string; shade?: boolean; caption?: string }
  | { kind: "square"; s: string; caption?: string }
  | { kind: "triangle"; base: string; height: string; external?: boolean; side?: string; caption?: string }
  | { kind: "composite-rect-tri"; caption?: string }
  | { kind: "words-to-symbols"; caption?: string }
  | { kind: "like-terms"; caption?: string }
  | { kind: "substitute"; caption?: string }
  | { kind: "order-ops"; caption?: string }
  | { kind: "number-line"; caption?: string }
  | { kind: "fraction-decimal"; caption?: string }
  | { kind: "formula-cards"; caption?: string };

/* ---------- Items ---------- */

export interface Hint {
  text: string;
}

export interface Misconception {
  /** Numeric value or normalised expression string that identifies the slip */
  when: string | number;
  say: string;
  /** Offer this bridge side-lesson when matched */
  bridge?: string;
}

interface ItemBase {
  id: string;
  prompt: string;
  /** Plain-language alternative for the maths in the prompt (a11y) */
  plain?: string;
  /** Exactly three hints: nudge → structure → approach (method, never the answer) */
  hints: [string, string, string];
  /** Shown after a correct check: informative feedback with working */
  success: string;
  misconceptions?: Misconception[];
  /** Bridge side-lesson to offer after repeated struggle on this item */
  bridge?: string;
  visual?: VisualSpec;
  /** Mode shown in π badge if it differs from the lesson default */
  piMode?: PiMode;
}

export interface NumericItem extends ItemBase {
  type: "numeric";
  unit?: string;
  /** Label before the field, e.g. "C =" */
  lead?: string;
  answer: {
    value: number;
    /** Absolute tolerance (default exact after rounding to 4 dp) */
    tolerance?: number;
    /** Accept any value in [min, max] (estimation items) */
    range?: [number, number];
    /** Additional accepted textual forms, e.g. "18π", "18 pi" */
    acceptAlso?: string[];
  };
}

export interface ExpressionItem extends ItemBase {
  type: "expression";
  answer: {
    /** Canonical expression, e.g. "h-15" or "(3+7a)/(2b)" */
    canonical: string;
    /** Variables that may appear */
    vars: string[];
    /** For simplify tasks: max number of top-level terms allowed */
    maxTerms?: number;
    /** Extra accepted written forms documented for QA */
    acceptedForms?: string[];
  };
}

export interface McqItem extends ItemBase {
  type: "mcq";
  options: string[];
  correctIndex: number;
}

export interface HotspotItem extends ItemBase {
  type: "hotspot";
  diagram: "circle-parts";
  /** Id of the correct hotspot target */
  correctTarget: string;
}

export type Item = NumericItem | ExpressionItem | McqItem | HotspotItem;

/* ---------- Lesson ---------- */

export interface WorkedStep {
  title: string;
  latex?: string;
  note?: string;
}

export interface Lesson {
  id: string;
  code: string;
  track: TrackId;
  kind: "core" | "bridge";
  title: string;
  /** Short title for map / chips */
  short: string;
  minutes: number;
  piMode: PiMode;
  prereqs: string[];
  citations: Citation[];
  /** Entry copy (starter card) */
  intro: string;
  introBullets: string[];
  recall: Item[];
  goal: {
    statement: string;
    tutor: string;
    formula?: string;
    formulaPlain?: string;
    visual: VisualSpec;
    visualTitle: string;
    after?: string;
  };
  worked: {
    problem: string;
    steps: WorkedStep[];
    why: string;
    visual?: VisualSpec;
    tutor: string;
  };
  guided: Item[];
  independent: Item[];
  transfer: Item[];
  recap: {
    headline: string;
    tutor: string;
    bullets: [string, string, string];
    nextPath?: string;
    collectible: { name: string; glyph: string; blurb: string };
  };
  alt?: {
    title: string;
    tutor: string;
    pathA: { title: string; body: string };
    pathB: { title: string; body: string };
  };
}

export const STAGES = [
  "recall",
  "goal",
  "visual",
  "worked",
  "guided",
  "independent",
  "transfer",
  "recap",
] as const;

export type StageId = (typeof STAGES)[number];

/** Screens the engine walks through — Goal and Visual are one combined screen */
export type Screen =
  | "recall"
  | "goalVisual"
  | "worked"
  | "guided"
  | "independent"
  | "transfer"
  | "recap";
