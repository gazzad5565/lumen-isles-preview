import type { Item, Misconception } from "@/content/types";

export interface CheckResult {
  correct: boolean;
  /** Empty / unparseable input — not counted as a wrong attempt */
  invalid?: boolean;
  message?: string;
  misconception?: Misconception;
}

/* ------------------------------------------------------------------ */
/* Numeric                                                             */
/* ------------------------------------------------------------------ */

const UNIT_RE = /(cm²|cm2|m²|m2|mm²|mm2|km|cm|mm|m|kg|min|h|°)\s*$/i;

/** Normalise SA comma decimals, spaces and a trailing unit → JS number */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(UNIT_RE, "").trim();
  // thousands spaces like "1 256" → "1256"; then comma → dot
  s = s.replace(/\s+/g, "");
  s = s.replace(",", ".");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) {
    // allow simple fraction like 22/7 or 1/2
    const frac = s.match(/^([-+]?\d+)\/(\d+)$/);
    if (frac) {
      const d = Number(frac[2]);
      if (d === 0) return null;
      return Number(frac[1]) / d;
    }
    return null;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Normalise "18π", "18 pi", "18\pi", "π×18" → canonical for form comparison */
export function normalisePiForm(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\\pi|pi/g, "π")
    .replace(/[×x*·]/g, "")
    .replace(/\s+/g, "")
    .replace(",", ".")
    .replace(UNIT_RE, "");
}

function roundTo(n: number, dp: number) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function checkNumeric(item: Extract<Item, { type: "numeric" }>, raw: string): CheckResult {
  const trimmed = raw.trim();
  if (!trimmed) return { correct: false, invalid: true, message: "Type a value first — even a rough one gives us something to work with." };

  const { value, tolerance, range, acceptAlso } = item.answer;

  if (acceptAlso?.length) {
    const norm = normalisePiForm(trimmed);
    if (acceptAlso.some((a) => normalisePiForm(a) === norm)) return { correct: true };
  }

  let n = parseNumber(trimmed);
  if (n === null) {
    // "36π" / "π×36" → numeric value, so π-form slips can still be diagnosed
    const piForm = normalisePiForm(trimmed).match(/^(\d*\.?\d+)π$|^π(\d*\.?\d+)$/);
    if (piForm) n = Number(piForm[1] ?? piForm[2]) * Math.PI;
  }
  if (n === null) {
    return {
      correct: false,
      invalid: true,
      message: "I couldn’t read that as a number. Try digits, with a comma or point for decimals (e.g. 31,4).",
    };
  }

  if (range) {
    if (n >= range[0] && n <= range[1]) return { correct: true };
  } else {
    const tol = tolerance ?? 0.00005;
    if (Math.abs(roundTo(n, 4) - roundTo(value, 4)) <= tol) return { correct: true };
  }

  const mis = item.misconceptions?.find((m) => typeof m.when === "number" && Math.abs(m.when - n) <= 0.00005);
  return { correct: false, misconception: mis };
}

/* ------------------------------------------------------------------ */
/* Expressions — bounded Grade 7 equivalence (no CAS)                  */
/* ------------------------------------------------------------------ */

type Tok =
  | { t: "num"; v: number }
  | { t: "var"; v: string }
  | { t: "op"; v: string }
  | { t: "lp" }
  | { t: "rp" };

const SUPERSCRIPTS: Record<string, string> = { "²": "^2", "³": "^3" };

export function tokenize(src: string): Tok[] | null {
  let s = src.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/[²³]/g, (m) => SUPERSCRIPTS[m]);
  s = s.replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/−|–/g, "-");
  s = s.replace(/\\pi|pi|π/g, "π");
  // comma decimal only when between digits
  s = s.replace(/(\d),(\d)/g, "$1.$2");
  s = s.replace(/\s+/g, "");
  const toks: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\d|\./.test(c)) {
      let j = i;
      while (j < s.length && /[\d.]/.test(s[j])) j++;
      const v = Number(s.slice(i, j));
      if (!Number.isFinite(v)) return null;
      toks.push({ t: "num", v });
      i = j;
      continue;
    }
    if (/[a-zπ]/.test(c)) {
      toks.push({ t: "var", v: c });
      i++;
      continue;
    }
    if ("+-*/^".includes(c)) {
      toks.push({ t: "op", v: c });
      i++;
      continue;
    }
    if (c === "(" || c === "[") {
      toks.push({ t: "lp" });
      i++;
      continue;
    }
    if (c === ")" || c === "]") {
      toks.push({ t: "rp" });
      i++;
      continue;
    }
    return null;
  }
  // implicit multiplication: num var | var var | rp lp | num lp | var lp | rp var | rp num
  const out: Tok[] = [];
  for (let k = 0; k < toks.length; k++) {
    const a = toks[k];
    const prev = out[out.length - 1];
    if (prev) {
      const prevEnds = prev.t === "num" || prev.t === "var" || prev.t === "rp";
      const curStarts = a.t === "num" || a.t === "var" || a.t === "lp";
      const numAfterVal = a.t === "num" && (prev.t === "var" || prev.t === "rp");
      if (prevEnds && curStarts && !(prev.t === "num" && a.t === "num")) {
        if (numAfterVal) return null; // "h15" is not a valid Grade 7 form
        out.push({ t: "op", v: "*" });
      }
    }
    out.push(a);
  }
  return out;
}

type Node =
  | { k: "num"; v: number }
  | { k: "var"; v: string }
  | { k: "neg"; a: Node }
  | { k: "bin"; op: string; a: Node; b: Node };

const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3 };

export function parse(toks: Tok[]): Node | null {
  let pos = 0;
  const peek = () => toks[pos];
  const next = () => toks[pos++];

  function primary(): Node | null {
    const t = next();
    if (!t) return null;
    if (t.t === "num") return { k: "num", v: t.v };
    if (t.t === "var") return { k: "var", v: t.v };
    if (t.t === "lp") {
      const e = expr(0);
      const r = next();
      if (!e || !r || r.t !== "rp") return null;
      return e;
    }
    if (t.t === "op" && t.v === "-") {
      const a = expr(2.5);
      return a ? { k: "neg", a } : null;
    }
    if (t.t === "op" && t.v === "+") {
      return expr(2.5);
    }
    return null;
  }

  function expr(minPrec: number): Node | null {
    let lhs = primary();
    if (!lhs) return null;
    for (;;) {
      const t = peek();
      if (!t || t.t !== "op") break;
      const p = PREC[t.v];
      if (p === undefined || p < minPrec) break;
      next();
      const rhs = expr(t.v === "^" ? p : p + 1);
      if (!rhs) return null;
      lhs = { k: "bin", op: t.v, a: lhs, b: rhs };
    }
    return lhs;
  }

  const root = expr(0);
  if (!root || pos !== toks.length) return null;
  return root;
}

function evaluate(n: Node, env: Record<string, number>): number {
  switch (n.k) {
    case "num":
      return n.v;
    case "var":
      if (n.v === "π") return Math.PI;
      if (!(n.v in env)) return NaN;
      return env[n.v];
    case "neg":
      return -evaluate(n.a, env);
    case "bin": {
      const a = evaluate(n.a, env);
      const b = evaluate(n.b, env);
      switch (n.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          return a / b;
        case "^":
          return a ** b;
      }
    }
  }
  return NaN;
}

function collectVars(n: Node, acc: Set<string>) {
  if (n.k === "var") acc.add(n.v);
  else if (n.k === "neg") collectVars(n.a, acc);
  else if (n.k === "bin") {
    collectVars(n.a, acc);
    collectVars(n.b, acc);
  }
}

/** Count top-level additive terms (for "is it simplified?") */
export function countTerms(n: Node): number {
  if (n.k === "bin" && (n.op === "+" || n.op === "-")) return countTerms(n.a) + countTerms(n.b);
  if (n.k === "neg") return countTerms(n.a);
  return 1;
}

/** Count numeric and variable leaves — a simplified form never needs more than the canonical one */
export function countLeaves(n: Node): number {
  if (n.k === "num" || n.k === "var") return 1;
  if (n.k === "neg") return countLeaves(n.a);
  return countLeaves(n.a) + countLeaves(n.b);
}

export function parseExpression(src: string): Node | null {
  const toks = tokenize(src);
  if (!toks) return null;
  return parse(toks);
}

const SAMPLE_POINTS = [1.3, 2.7, -1.9, 0.6, 4.4, -3.1, 7.2, 0.15];

export function expressionsEquivalent(a: Node, b: Node, vars: string[]): boolean {
  let compared = 0;
  for (let i = 0; i < SAMPLE_POINTS.length; i++) {
    const env: Record<string, number> = {};
    vars.forEach((v, j) => {
      env[v] = SAMPLE_POINTS[(i + j * 3) % SAMPLE_POINTS.length];
    });
    const x = evaluate(a, env);
    const y = evaluate(b, env);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    compared++;
    const scale = Math.max(1, Math.abs(x), Math.abs(y));
    if (Math.abs(x - y) > 1e-7 * scale) return false;
  }
  return compared >= 4;
}

function checkExpression(item: Extract<Item, { type: "expression" }>, raw: string): CheckResult {
  const trimmed = raw.trim();
  if (!trimmed) return { correct: false, invalid: true, message: "Type an expression first — even a first guess helps us see your thinking." };

  const learner = parseExpression(trimmed);
  if (!learner) {
    return {
      correct: false,
      invalid: true,
      message: "I couldn’t read that as an expression. Use letters, numbers, + − × ÷ and brackets, e.g. 2h+3 or (a+8)/3.",
    };
  }
  const canon = parseExpression(item.answer.canonical);
  if (!canon) return { correct: false, invalid: true, message: "Content error: canonical expression unreadable." };

  const used = new Set<string>();
  collectVars(learner, used);
  used.delete("π");
  const stray = [...used].filter((v) => !item.answer.vars.includes(v));
  if (stray.length) {
    return {
      correct: false,
      message: `The letter “${stray[0]}” isn’t in this question. Stick to ${item.answer.vars.join(", ")}.`,
    };
  }

  const equivalent = expressionsEquivalent(learner, canon, item.answer.vars);
  if (equivalent) {
    const notSimplified =
      item.answer.maxTerms !== undefined &&
      (countTerms(learner) > item.answer.maxTerms || countLeaves(learner) > countLeaves(canon));
    if (notSimplified) {
      return {
        correct: false,
        message: "That’s equal in value — but not simplified yet. Collect the like terms into as few terms as possible.",
      };
    }
    return { correct: true };
  }

  const normLearner = trimmed.toLowerCase().replace(/\s+/g, "").replace(/−/g, "-");
  const mis = item.misconceptions?.find((m) => {
    if (typeof m.when !== "string") return false;
    const target = parseExpression(m.when);
    if (!target) return m.when.toLowerCase().replace(/\s+/g, "") === normLearner;
    return expressionsEquivalent(learner, target, item.answer.vars);
  });
  return { correct: false, misconception: mis };
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

export function checkAnswer(item: Item, raw: string): CheckResult {
  switch (item.type) {
    case "numeric":
      return checkNumeric(item, raw);
    case "expression":
      return checkExpression(item, raw);
    case "mcq": {
      if (raw === "") return { correct: false, invalid: true, message: "Pick an option first." };
      const idx = Number(raw);
      if (idx === item.correctIndex) return { correct: true };
      const mis = item.misconceptions?.find((m) => String(m.when) === raw);
      return { correct: false, misconception: mis };
    }
    case "hotspot": {
      if (!raw) return { correct: false, invalid: true, message: "Click a part of the diagram first." };
      if (raw === item.correctTarget) return { correct: true };
      const mis = item.misconceptions?.find((m) => String(m.when) === raw);
      return { correct: false, misconception: mis };
    }
  }
}
