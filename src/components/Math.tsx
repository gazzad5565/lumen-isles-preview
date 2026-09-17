"use client";

import katex from "katex";
import { Fragment, useMemo, type ReactNode } from "react";

function render(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: "ignore", output: "html" });
  } catch {
    return tex;
  }
}

/** Render a single TeX string */
export function Tex({ tex, display = false, className, label }: { tex: string; display?: boolean; className?: string; label?: string }) {
  const html = useMemo(() => render(tex, display), [tex, display]);
  return (
    <span
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Rich tutor text: inline $…$ maths rendered with KaTeX, **bold** for emphasis.
 * Everything else is plain text.
 */
export function Rich({ text, className, as: Tag = "span" }: { text: string; className?: string; as?: "span" | "p" | "div" | "li" | "h1" | "h2" }) {
  const parts = useMemo(() => splitRich(text), [text]);
  return <Tag className={className}>{parts}</Tag>;
}

function splitRich(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\$([^$]+)\$|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1] !== undefined) out.push(<Tex key={i++} tex={m[1]} />);
    else out.push(<strong key={i++}>{m[2]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return out;
}
