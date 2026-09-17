/**
 * Lumen Isles world shell — starter isle + two extension shores.
 * Node positions are percentages of the map canvas (desktop-first, 1440×780 reference).
 * A node is available when every lesson in `requires` is restored (completed).
 */

export type NodeKind = "lesson" | "ring";

export interface WorldNode {
  id: string;
  kind: NodeKind;
  lessonId?: string;
  x: number;
  y: number;
  label: string;
  glyph: string;
  island: "starter" | "garden" | "cipher";
  requires: string[];
}

export const RING_NODE_ID = "bridge-ring";

export const WORLD_NODES: WorldNode[] = [
  // Starter isle — Circles
  { id: "A4", kind: "lesson", lessonId: "A4", x: 50, y: 50, label: "Starter beacon · A4", glyph: "✦", island: "starter", requires: [] },
  { id: "A1", kind: "lesson", lessonId: "A1", x: 34, y: 64, label: "Lantern cove · A1", glyph: "◎", island: "starter", requires: ["A4"] },
  { id: "A2", kind: "lesson", lessonId: "A2", x: 27, y: 50, label: "Twin rocks · A2", glyph: "∞", island: "starter", requires: ["A4"] },
  { id: "A3", kind: "lesson", lessonId: "A3", x: 36, y: 36, label: "Rim walk · A3", glyph: "○", island: "starter", requires: ["A4"] },
  { id: RING_NODE_ID, kind: "ring", x: 62, y: 40, label: "Bridge ring", glyph: "◯", island: "starter", requires: ["A4"] },
  { id: "A5", kind: "lesson", lessonId: "A5", x: 72, y: 32, label: "Wheel path · A5", glyph: "⁷", island: "starter", requires: ["A4"] },
  { id: "A6", kind: "lesson", lessonId: "A6", x: 74, y: 52, label: "Light-garden · A6", glyph: "●", island: "starter", requires: ["A4"] },
  { id: "A7", kind: "lesson", lessonId: "A7", x: 82, y: 66, label: "Half-moon bay · A7", glyph: "◗", island: "starter", requires: ["A6"] },
  { id: "A8", kind: "lesson", lessonId: "A8", x: 90, y: 50, label: "Quarter cliff · A8", glyph: "◔", island: "starter", requires: ["A7"] },

  // Garden shore — Perimeter & area
  { id: "B1", kind: "lesson", lessonId: "B1", x: 12, y: 80, label: "Fence line · B1", glyph: "▭", island: "garden", requires: ["A4"] },
  { id: "B2", kind: "lesson", lessonId: "B2", x: 22, y: 88, label: "Tile field · B2", glyph: "▦", island: "garden", requires: ["B1"] },
  { id: "B3", kind: "lesson", lessonId: "B3", x: 34, y: 86, label: "Sail rock · B3", glyph: "◭", island: "garden", requires: ["B2"] },
  { id: "B4", kind: "lesson", lessonId: "B4", x: 46, y: 90, label: "Mosaic pier · B4", glyph: "⬡", island: "garden", requires: ["B3"] },

  // Cipher cove — Algebra
  { id: "C1", kind: "lesson", lessonId: "C1", x: 56, y: 14, label: "Cipher stone · C1", glyph: "𝑥", island: "cipher", requires: ["A4"] },
  { id: "C2", kind: "lesson", lessonId: "C2", x: 66, y: 8, label: "Sorting shelf · C2", glyph: "≡", island: "cipher", requires: ["C1"] },
  { id: "C3", kind: "lesson", lessonId: "C3", x: 76, y: 14, label: "Story ledge · C3", glyph: "✎", island: "cipher", requires: ["C1"] },
  { id: "C4", kind: "lesson", lessonId: "C4", x: 84, y: 8, label: "Key ridge · C4", glyph: "⚿", island: "cipher", requires: ["C2"] },
  { id: "C5", kind: "lesson", lessonId: "C5", x: 92, y: 20, label: "Model point · C5", glyph: "⟐", island: "cipher", requires: ["C3", "C4"] },
];

export const WORLD_PATHS: [string, string][] = [
  ["A4", "A1"],
  ["A4", "A2"],
  ["A4", "A3"],
  ["A4", RING_NODE_ID],
  [RING_NODE_ID, "A5"],
  ["A4", "A6"],
  ["A6", "A7"],
  ["A7", "A8"],
  ["A1", "B1"],
  ["B1", "B2"],
  ["B2", "B3"],
  ["B3", "B4"],
  ["A3", "C1"],
  ["C1", "C2"],
  ["C1", "C3"],
  ["C2", "C4"],
  ["C3", "C5"],
  ["C4", "C5"],
];

/** Maths-driven world interaction: the ring needs the true circumference (A5 skill, π = 22/7) */
export const BRIDGE_RING = {
  diameter: 14,
  piLabel: "22/7",
  answer: 44,
  collectible: { name: "Ring-bridge light", glyph: "◯", blurb: "Your circumference fitted the ring exactly." },
  hints: [
    "The ring gives a diameter, so start from $C = \\pi d$.",
    "Write $C = \\tfrac{22}{7} \\times 14$. Cancel the 7 with a factor in 14 before multiplying.",
    "$14 \\div 7 = 2$. Now multiply 22 by that 2 and add cm.",
  ] as [string, string, string],
  misconceptions: [
    { when: 88, say: "That is $2\\pi d$ — the 2 belongs with the radius. The ring gave you a diameter." },
    { when: 22, say: "That is $\\pi \\times r$ — half the ring. Use the full diameter." },
    { when: 154, say: "That is the **area** ($\\pi r^{2}$). The ring needs the distance around — circumference." },
  ],
};
