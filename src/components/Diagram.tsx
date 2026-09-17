import type { VisualSpec } from "@/content/types";

const INK = "#4A4258";
const GOLD = "#C4894A";
const GOLD_D = "#A8723A";
const TEAL = "#5B9A8B";
const TEAL_L = "#EEF7F4";
const TEAL_M = "#A8D4C8";
const VIOLET = "#6B5B7A";
const CREAM = "#F5EDE0";

const T = { fontFamily: "inherit", fontWeight: 600 } as const;

/** Stylised teaching diagrams — original SVG, never scanned exam pages. */
export function Diagram({ spec, className }: { spec: VisualSpec; className?: string }) {
  return (
    <figure className={className} style={{ margin: 0 }}>
      <Svg spec={spec} />
      {"caption" in spec && spec.caption ? <figcaption className="li-note" style={{ marginTop: 8 }}>{spec.caption}</figcaption> : null}
    </figure>
  );
}

function Svg({ spec }: { spec: VisualSpec }) {
  switch (spec.kind) {
    case "circle": {
      const { radius, diameter, chord, arc, centre, labels = {}, shadeArea } = spec;
      return (
        <svg viewBox="0 0 320 290" width="100%" role="img" aria-label={describeCircle(spec)}>
          <circle cx="160" cy="150" r="100" fill={shadeArea ? TEAL_M : TEAL_L} stroke={TEAL} strokeWidth="3" opacity={shadeArea ? 0.85 : 1} />
          {arc && <path d="M60 150 A100 100 0 0 1 260 150" fill="none" stroke="#D4A574" strokeWidth="5" strokeLinecap="round" opacity="0.8" />}
          {diameter && <line x1="60" y1="150" x2="260" y2="150" stroke={GOLD} strokeWidth="3" />}
          {radius && <line x1="160" y1="150" x2={diameter ? 260 : 231} y2={diameter ? 150 : 79} stroke={VIOLET} strokeWidth="3" strokeDasharray={diameter ? "6 4" : undefined} />}
          {chord && <line x1="100" y1="230" x2="245" y2="205" stroke={TEAL} strokeWidth="3" />}
          {centre && <circle cx="160" cy="150" r="5" fill="#2C2438" />}
          {centre && (
            <text x="160" y="138" textAnchor="middle" fontSize="14" fill={INK} style={T}>
              O
            </text>
          )}
          {radius && (
            <text x={diameter ? 210 : 208} y={diameter ? 138 : 105} textAnchor="middle" fontSize="15" fill={VIOLET} style={T}>
              {labels.r ?? "r"}
            </text>
          )}
          {diameter && (
            <text x="160" y="176" textAnchor="middle" fontSize="15" fill={GOLD} style={T}>
              {labels.d ?? "d"}
            </text>
          )}
          {chord && (
            <text x="185" y="240" textAnchor="middle" fontSize="13" fill={TEAL} style={T}>
              {labels.chord ?? "chord"}
            </text>
          )}
          {arc && (
            <text x="160" y="36" textAnchor="middle" fontSize="13" fill={GOLD_D} style={T}>
              {labels.C ?? "circumference"}
            </text>
          )}
          {shadeArea && (
            <text x="160" y="215" textAnchor="middle" fontSize="13" fill="#2F5F55" style={T}>
              area A
            </text>
          )}
        </svg>
      );
    }
    case "semicircle":
      return (
        <svg viewBox="0 0 320 200" width="100%" role="img" aria-label="Semicircle with its curved arc and straight diameter labelled">
          <path d="M40 160 A120 120 0 0 1 280 160 Z" fill={spec.shade ? TEAL_M : TEAL_L} stroke={TEAL} strokeWidth="3" />
          <path d="M40 160 A120 120 0 0 1 280 160" fill="none" stroke="#D4A574" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
          <line x1="40" y1="160" x2="280" y2="160" stroke={GOLD} strokeWidth="4" />
          <text x="160" y="182" textAnchor="middle" fontSize="14" fill={GOLD} style={T}>
            {spec.label ?? "d"} · straight edge
          </text>
          <text x="160" y="32" textAnchor="middle" fontSize="13" fill={GOLD_D} style={T}>
            arc = ½ circumference
          </text>
        </svg>
      );
    case "quarter":
      return (
        <svg viewBox="0 0 320 240" width="100%" role="img" aria-label="Quarter circle with two radii and a curved arc">
          <path d="M60 200 L60 40 A160 160 0 0 1 220 200 Z" fill={spec.shade ? TEAL_M : TEAL_L} stroke={TEAL} strokeWidth="3" />
          <path d="M60 40 A160 160 0 0 1 220 200" fill="none" stroke="#D4A574" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
          <line x1="60" y1="200" x2="60" y2="40" stroke={GOLD} strokeWidth="4" />
          <line x1="60" y1="200" x2="220" y2="200" stroke={GOLD} strokeWidth="4" />
          <rect x="60" y="188" width="12" height="12" fill="none" stroke={INK} strokeWidth="1.5" />
          <text x="40" y="125" textAnchor="middle" fontSize="14" fill={GOLD} style={T} transform="rotate(-90 40 125)">
            {spec.label ?? "r"}
          </text>
          <text x="140" y="222" textAnchor="middle" fontSize="14" fill={GOLD} style={T}>
            {spec.label ?? "r"}
          </text>
          <text x="200" y="90" textAnchor="middle" fontSize="13" fill={GOLD_D} style={T}>
            arc = ¼ circumference
          </text>
        </svg>
      );
    case "diameters-around":
      return (
        <svg viewBox="0 0 340 260" width="100%" role="img" aria-label="A circle whose circumference is a little more than three diameters laid end to end">
          <circle cx="110" cy="120" r="80" fill={TEAL_L} stroke={TEAL} strokeWidth="3" />
          <line x1="30" y1="120" x2="190" y2="120" stroke={GOLD} strokeWidth="4" />
          <text x="110" y="145" textAnchor="middle" fontSize="14" fill={GOLD} style={T}>
            d
          </text>
          <path d="M30 120 A80 80 0 0 1 190 120 A80 80 0 0 1 30 120" fill="none" stroke="#D4A574" strokeWidth="5" opacity="0.8" />
          <text x="110" y="24" textAnchor="middle" fontSize="13" fill={GOLD_D} style={T}>
            unroll the rim…
          </text>
          <line x1="20" y1="230" x2="322" y2="230" stroke="#D4A574" strokeWidth="6" strokeLinecap="round" />
          {[20, 116, 212].map((x) => (
            <line key={x} x1={x} y1="222" x2={x + 96} y2="222" stroke={GOLD} strokeWidth="4" strokeLinecap="round" />
          ))}
          <line x1="308" y1="222" x2="322" y2="222" stroke={VIOLET} strokeWidth="4" strokeLinecap="round" />
          <text x="68" y="212" textAnchor="middle" fontSize="12" fill={GOLD} style={T}>
            d
          </text>
          <text x="164" y="212" textAnchor="middle" fontSize="12" fill={GOLD} style={T}>
            d
          </text>
          <text x="260" y="212" textAnchor="middle" fontSize="12" fill={GOLD} style={T}>
            d
          </text>
          <text x="315" y="252" textAnchor="end" fontSize="12" fill={VIOLET} style={T}>
            + a bit (π ≈ 3,14)
          </text>
        </svg>
      );
    case "wheel":
      return (
        <svg viewBox="0 0 340 220" width="100%" role="img" aria-label="A wheel rolling once forward, covering one circumference">
          <line x1="10" y1="190" x2="330" y2="190" stroke="#D4A574" strokeWidth="3" />
          <circle cx="80" cy="120" r="70" fill={TEAL_L} stroke={TEAL} strokeWidth="4" />
          {[0, 45, 90, 135].map((a) => (
            <line key={a} x1="80" y1="120" x2={80 + 70 * Math.cos((a * Math.PI) / 180)} y2={120 + 70 * Math.sin((a * Math.PI) / 180)} stroke={TEAL_M} strokeWidth="2" transform={`rotate(${a} 80 120)`} />
          ))}
          <circle cx="80" cy="120" r="6" fill="#2C2438" />
          <line x1="80" y1="120" x2="150" y2="120" stroke={VIOLET} strokeWidth="3" />
          <text x="115" y="110" textAnchor="middle" fontSize="13" fill={VIOLET} style={T}>
            {spec.label ?? "r"}
          </text>
          <path d="M160 200 L300 200" stroke={GOLD} strokeWidth="5" strokeLinecap="round" strokeDasharray="10 8" />
          <text x="230" y="215" textAnchor="middle" fontSize="12" fill={GOLD_D} style={T}>
            one turn = one circumference
          </text>
          <path d="M290 60 q30 30 0 60" fill="none" stroke={GOLD} strokeWidth="3" />
          <path d="M282 112 L290 122 L298 112" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "garden":
      return (
        <svg viewBox="0 0 260 220" width="100%" role="img" aria-label="A circular light-garden with a path around its edge">
          <ellipse cx="130" cy="200" rx="100" ry="12" fill="#D4A574" opacity="0.3" />
          <circle cx="130" cy="110" r="70" fill={TEAL_M} opacity="0.55" stroke={TEAL} strokeWidth="3" />
          <circle cx="130" cy="110" r="20" fill="#F0D9A8" />
          <path d="M60 110 A70 70 0 1 1 200 110" fill="none" stroke={GOLD} strokeWidth="4" strokeDasharray="6 6" />
          <line x1="130" y1="110" x2="200" y2="110" stroke={VIOLET} strokeWidth="2.5" />
          <text x="166" y="100" textAnchor="middle" fontSize="12" fill={VIOLET} style={T}>
            {spec.label ?? "r"}
          </text>
        </svg>
      );
    case "rectangle":
      return (
        <svg viewBox="0 0 320 200" width="100%" role="img" aria-label={`Rectangle ${spec.w} by ${spec.h}`}>
          <rect x="50" y="40" width="220" height="120" fill={spec.shade ? TEAL_M : TEAL_L} stroke={TEAL} strokeWidth="3" />
          {spec.shade &&
            Array.from({ length: 5 }).map((_, i) => <line key={`v${i}`} x1={50 + (i + 1) * (220 / 6)} y1="40" x2={50 + (i + 1) * (220 / 6)} y2="160" stroke="#fff" strokeWidth="1" opacity="0.6" />)}
          {spec.shade && Array.from({ length: 3 }).map((_, i) => <line key={`h${i}`} x1="50" y1={40 + (i + 1) * 30} x2="270" y2={40 + (i + 1) * 30} stroke="#fff" strokeWidth="1" opacity="0.6" />)}
          <text x="160" y="184" textAnchor="middle" fontSize="14" fill={GOLD} style={T}>
            {spec.w}
          </text>
          <text x="32" y="104" textAnchor="middle" fontSize="14" fill={GOLD} style={T} transform="rotate(-90 32 104)">
            {spec.h}
          </text>
        </svg>
      );
    case "square":
      return (
        <svg viewBox="0 0 240 220" width="100%" role="img" aria-label={`Square with side ${spec.s}`}>
          <rect x="50" y="30" width="140" height="140" fill={TEAL_L} stroke={TEAL} strokeWidth="3" />
          <text x="120" y="194" textAnchor="middle" fontSize="14" fill={GOLD} style={T}>
            {spec.s}
          </text>
        </svg>
      );
    case "triangle": {
      const ext = spec.external;
      const apexX = ext ? 250 : 150;
      return (
        <svg viewBox="0 0 320 220" width="100%" role="img" aria-label={`Triangle with base ${spec.base} and perpendicular height ${spec.height}${ext ? " drawn outside the triangle" : ""}`}>
          <polygon points={`40,180 200,180 ${apexX},50`} fill={TEAL_L} stroke={TEAL} strokeWidth="3" />
          <line x1={apexX} y1="50" x2={apexX} y2="180" stroke={VIOLET} strokeWidth="2.5" strokeDasharray="6 4" />
          {ext && <line x1="200" y1="180" x2={apexX} y2="180" stroke={INK} strokeWidth="1.5" strokeDasharray="4 4" />}
          <rect x={apexX - 12} y="168" width="12" height="12" fill="none" stroke={INK} strokeWidth="1.5" />
          <text x="120" y="204" textAnchor="middle" fontSize="14" fill={GOLD} style={T}>
            base {spec.base}
          </text>
          <text x={apexX + 14} y="118" textAnchor="start" fontSize="13" fill={VIOLET} style={T}>
            h = {spec.height}
          </text>
          {spec.side && (
            <text x="235" y="110" textAnchor="end" fontSize="12" fill={INK} style={T} transform={ext ? "rotate(-69 235 110)" : undefined}>
              {spec.side}
            </text>
          )}
        </svg>
      );
    }
    case "composite-rect-tri":
      return (
        <svg viewBox="0 0 340 200" width="100%" role="img" aria-label="A rectangle 10 by 4 with a right triangle of legs 4 and 3 and hypotenuse 5 attached to its right side">
          <rect x="30" y="60" width="200" height="80" fill={TEAL_L} stroke={TEAL} strokeWidth="3" />
          <polygon points="230,60 230,140 290,140" fill={TEAL_M} stroke={TEAL} strokeWidth="3" />
          <line x1="230" y1="60" x2="230" y2="140" stroke={INK} strokeWidth="2" strokeDasharray="5 4" />
          <rect x="230" y="128" width="12" height="12" fill="none" stroke={INK} strokeWidth="1.5" />
          <text x="130" y="50" textAnchor="middle" fontSize="13" fill={GOLD} style={T}>
            10 cm
          </text>
          <text x="18" y="104" textAnchor="middle" fontSize="13" fill={GOLD} style={T} transform="rotate(-90 18 104)">
            4 cm
          </text>
          <text x="260" y="160" textAnchor="middle" fontSize="13" fill={GOLD} style={T}>
            3 cm
          </text>
          <text x="272" y="92" textAnchor="middle" fontSize="13" fill={GOLD} style={T}>
            5 cm
          </text>
          <text x="245" y="104" textAnchor="middle" fontSize="11" fill={INK} style={T}>
            4
          </text>
          <text x="170" y="190" textAnchor="middle" fontSize="12" fill={VIOLET} style={T}>
            dashed edge is inside — not part of the perimeter
          </text>
        </svg>
      );
    case "words-to-symbols":
      return (
        <svg viewBox="0 0 340 220" width="100%" role="img" aria-label="Table mapping words to operation symbols">
          {[
            ["sum · more than · total", "+"],
            ["difference · less than", "−"],
            ["product · of · times", "×"],
            ["quotient · shared · per", "÷"],
          ].map(([w, s], i) => (
            <g key={s} transform={`translate(0 ${20 + i * 48})`}>
              <rect x="20" y="0" width="210" height="38" rx="10" fill="#fff" stroke="#E8DCC8" />
              <text x="32" y="25" fontSize="13" fill={INK} style={T}>
                {w}
              </text>
              <path d="M240 19 L262 19" stroke={GOLD} strokeWidth="2" />
              <circle cx="298" cy="19" r="18" fill={CREAM} stroke={GOLD} strokeWidth="2" />
              <text x="298" y="25" textAnchor="middle" fontSize="17" fill={GOLD_D} style={T}>
                {s}
              </text>
            </g>
          ))}
        </svg>
      );
    case "like-terms":
      return (
        <svg viewBox="0 0 340 200" width="100%" role="img" aria-label="Terms sorted into two groups: h-terms and plain numbers">
          <rect x="20" y="30" width="150" height="140" rx="14" fill={TEAL_L} stroke={TEAL} strokeWidth="2" />
          <rect x="190" y="30" width="130" height="140" rx="14" fill="#FDF6EB" stroke={GOLD} strokeWidth="2" />
          <text x="95" y="56" textAnchor="middle" fontSize="13" fill="#2F5F55" style={T}>
            h-terms
          </text>
          <text x="255" y="56" textAnchor="middle" fontSize="13" fill={GOLD_D} style={T}>
            plain numbers
          </text>
          {["5h", "+h", "−2h"].map((t, i) => (
            <text key={t} x={50 + i * 45} y="105" textAnchor="middle" fontSize="18" fill={INK} style={T}>
              {t}
            </text>
          ))}
          <text x="95" y="150" textAnchor="middle" fontSize="20" fill={TEAL} style={T}>
            = 4h
          </text>
          {["9", "+3"].map((t, i) => (
            <text key={t} x={225 + i * 55} y="105" textAnchor="middle" fontSize="18" fill={INK} style={T}>
              {t}
            </text>
          ))}
          <text x="255" y="150" textAnchor="middle" fontSize="20" fill={GOLD_D} style={T}>
            = 12
          </text>
        </svg>
      );
    case "substitute":
      return (
        <svg viewBox="0 0 340 160" width="100%" role="img" aria-label="Substitution: the letter m is replaced by the number 5 in brackets">
          <text x="60" y="70" textAnchor="middle" fontSize="30" fill={INK} style={T}>
            3
          </text>
          <rect x="82" y="40" width="44" height="44" rx="10" fill={TEAL_L} stroke={TEAL} strokeWidth="2" />
          <text x="104" y="72" textAnchor="middle" fontSize="26" fill={TEAL} style={T}>
            m
          </text>
          <text x="160" y="70" textAnchor="middle" fontSize="30" fill={INK} style={T}>
            + 4
          </text>
          <path d="M104 96 L104 120" stroke={GOLD} strokeWidth="2.5" />
          <text x="104" y="145" textAnchor="middle" fontSize="15" fill={GOLD_D} style={T}>
            m = 5
          </text>
          <text x="250" y="70" textAnchor="middle" fontSize="30" fill={INK} style={T}>
            3(5) + 4
          </text>
          <text x="250" y="120" textAnchor="middle" fontSize="15" fill={VIOLET} style={T}>
            brackets keep 3 × 5 apart from “35”
          </text>
        </svg>
      );
    case "order-ops":
      return (
        <svg viewBox="0 0 340 200" width="100%" role="img" aria-label="Order of operations ladder: brackets, powers, multiply and divide, add and subtract">
          {[
            ["( )", "brackets"],
            ["x²", "powers"],
            ["× ÷", "multiply · divide"],
            ["+ −", "add · subtract"],
          ].map(([s, w], i) => (
            <g key={s} transform={`translate(${20 + i * 30} ${20 + i * 42})`}>
              <rect x="0" y="0" width="200" height="34" rx="8" fill={i === 0 ? "#FDF6EB" : "#fff"} stroke={i === 0 ? GOLD : "#E8DCC8"} strokeWidth="2" />
              <text x="16" y="23" fontSize="15" fill={GOLD_D} style={T}>
                {s}
              </text>
              <text x="70" y="23" fontSize="13" fill={INK} style={T}>
                {w}
              </text>
            </g>
          ))}
          <text x="300" y="120" textAnchor="middle" fontSize="12" fill={VIOLET} style={T} transform="rotate(90 300 120)">
            first → last
          </text>
        </svg>
      );
    case "number-line":
      return (
        <svg viewBox="0 0 340 120" width="100%" role="img" aria-label="Number line from minus five to five showing 5 minus 7 landing at minus 2">
          <line x1="20" y1="70" x2="320" y2="70" stroke={INK} strokeWidth="2" />
          {Array.from({ length: 11 }).map((_, i) => {
            const v = i - 5;
            const x = 20 + i * 30;
            return (
              <g key={v}>
                <line x1={x} y1="64" x2={x} y2="76" stroke={INK} strokeWidth="2" />
                <text x={x} y="96" textAnchor="middle" fontSize="12" fill={INK} style={T}>
                  {v}
                </text>
              </g>
            );
          })}
          <path d="M320 50 Q 215 5 110 50" fill="none" stroke={GOLD} strokeWidth="3" />
          <circle cx="320" cy="70" r="6" fill={TEAL} />
          <circle cx="110" cy="70" r="6" fill={GOLD} />
          <text x="215" y="22" textAnchor="middle" fontSize="13" fill={GOLD_D} style={T}>
            5 − 7 → −2
          </text>
        </svg>
      );
    case "fraction-decimal":
      return (
        <svg viewBox="0 0 340 160" width="100%" role="img" aria-label="Two forms of pi: the fraction 22 over 7 and the decimal 3,14, both a little more than 3">
          <rect x="20" y="30" width="130" height="100" rx="14" fill={TEAL_L} stroke={TEAL} strokeWidth="2" />
          <rect x="190" y="30" width="130" height="100" rx="14" fill="#FDF6EB" stroke={GOLD} strokeWidth="2" />
          <text x="85" y="78" textAnchor="middle" fontSize="30" fill="#2F5F55" style={T}>
            22⁄7
          </text>
          <text x="85" y="112" textAnchor="middle" fontSize="12" fill="#2F5F55" style={T}>
            cancel the 7 first
          </text>
          <text x="255" y="78" textAnchor="middle" fontSize="30" fill={GOLD_D} style={T}>
            3,14
          </text>
          <text x="255" y="112" textAnchor="middle" fontSize="12" fill={GOLD_D} style={T}>
            move the comma
          </text>
          <text x="170" y="84" textAnchor="middle" fontSize="22" fill={VIOLET} style={T}>
            ≈
          </text>
          <text x="170" y="150" textAnchor="middle" fontSize="13" fill={VIOLET} style={T}>
            both mean π · a little more than 3
          </text>
        </svg>
      );
    case "formula-cards":
      return (
        <svg viewBox="0 0 340 220" width="100%" role="img" aria-label="Formula cards for square, rectangle, triangle and circle">
          {[
            ["Square", "P = 4s · A = s²"],
            ["Rectangle", "P = 2(l + b) · A = l × b"],
            ["Triangle", "A = ½ b h"],
            ["Circle", "C = πd · A = πr²"],
          ].map(([n, f], i) => (
            <g key={n} transform={`translate(${20 + (i % 2) * 160} ${20 + Math.floor(i / 2) * 95})`}>
              <rect x="0" y="0" width="140" height="76" rx="12" fill="#fff" stroke="#E8DCC8" strokeWidth="2" />
              <text x="14" y="26" fontSize="13" fill={GOLD_D} style={T}>
                {n}
              </text>
              <text x="14" y="54" fontSize="12" fill={INK} style={T}>
                {f}
              </text>
            </g>
          ))}
        </svg>
      );
  }
}

function describeCircle(spec: Extract<VisualSpec, { kind: "circle" }>): string {
  const parts: string[] = [];
  if (spec.centre) parts.push("centre O");
  if (spec.radius) parts.push(`radius ${spec.labels?.r ?? ""}`.trim());
  if (spec.diameter) parts.push(`diameter ${spec.labels?.d ?? ""}`.trim());
  if (spec.chord) parts.push("a chord");
  if (spec.arc) parts.push("the circumference highlighted");
  if (spec.shadeArea) parts.push("the inside shaded to show area");
  return `Circle diagram with ${parts.join(", ")}`;
}
