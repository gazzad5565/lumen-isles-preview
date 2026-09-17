"use client";

/**
 * Labelled-diagram interaction: click (or Tab + Enter) the circle part named in the prompt.
 * Targets: diameter AC (through O), radius OD, chord BC. Original teaching diagram.
 */
export function CirclePartsHotspot({
  selected,
  onSelect,
  correctTarget,
  locked,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  correctTarget?: string;
  locked?: boolean;
}) {
  const targets = [
    { id: "diameter", label: "Line AC through the centre", x: 60, y: 130, w: 200, h: 34 },
    { id: "radius", label: "Line OD from the centre to the edge", x: 150, y: 58, w: 96, h: 70, rotate: true },
    { id: "chord", label: "Line BC joining two edge points", x: 96, y: 196, w: 154, h: 48 },
  ];

  const state = (id: string) => {
    if (locked && correctTarget === id && selected === id) return "is-correct";
    if (selected === id) return "is-selected";
    return "";
  };

  return (
    <svg viewBox="0 0 320 290" width="100%" style={{ maxWidth: 380 }} role="group" aria-label="Circle with lines AC, OD and BC. Choose the part named in the question.">
      <circle cx="160" cy="150" r="100" fill="#EEF7F4" stroke="#5B9A8B" strokeWidth="3" />
      <line x1="60" y1="150" x2="260" y2="150" stroke="#C4894A" strokeWidth="4" />
      <line x1="160" y1="150" x2="231" y2="79" stroke="#6B5B7A" strokeWidth="4" />
      <line x1="100" y1="230" x2="245" y2="205" stroke="#5B9A8B" strokeWidth="4" />
      <circle cx="160" cy="150" r="5" fill="#2C2438" />
      <text x="160" y="140" textAnchor="middle" fontSize="14" fill="#4A4258" fontWeight="600">
        O
      </text>
      <text x="48" y="155" textAnchor="middle" fontSize="14" fill="#4A4258" fontWeight="600">
        A
      </text>
      <text x="273" y="155" textAnchor="middle" fontSize="14" fill="#4A4258" fontWeight="600">
        C
      </text>
      <text x="242" y="72" textAnchor="middle" fontSize="14" fill="#4A4258" fontWeight="600">
        D
      </text>
      <text x="88" y="240" textAnchor="middle" fontSize="14" fill="#4A4258" fontWeight="600">
        B
      </text>
      {targets.map((t) => (
        <g
          key={t.id}
          className={`li-hotspot ${state(t.id)}`}
          role="button"
          tabIndex={locked ? -1 : 0}
          aria-label={`${t.label}${selected === t.id ? " (selected)" : ""}`}
          aria-pressed={selected === t.id}
          onClick={() => !locked && onSelect(t.id)}
          onKeyDown={(e) => {
            if (locked) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(t.id);
            }
          }}
        >
          <rect className="li-hotspot__hit" x={t.x} y={t.y} width={t.w} height={t.h} rx="8" />
        </g>
      ))}
    </svg>
  );
}
