import { brandInk, type CaptionPreset } from "@/lib/brand";

export type CaptionWord = { text: string; isCode: boolean; state: "said" | "spoken" | "upcoming" };
export type CaptionLook = {
  colors: { background: string; text: string; accent: string };
  fonts: { body: string; code: string };
  preset: CaptionPreset;
};

export function rgba(hex: string, a: number) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * One caption page at `scale` × render size. Word states follow compose.word_states in the renderer:
 * highlight-word = spoken word on an accent pill; karaoke = spoken and said words in accent; boxed = panel
 * behind the page, spoken word in accent. Code words are always a chip (accent pill while spoken).
 */
export function CaptionPage({ lines, look, scale }: { lines: CaptionWord[][]; look: CaptionLook; scale: number }) {
  const { background: bg, text, accent } = look.colors;
  const body = `"${look.fonts.body} Brand", sans-serif`;
  const code = `"${look.fonts.code} Brand", monospace`;
  const shadow = `0 ${3 * scale}px 0 rgba(0,0,0,.7), 0 0 ${20 * scale}px rgba(0,0,0,.8)`;
  const boxed = look.preset === "boxed";

  function style(w: CaptionWord): React.CSSProperties {
    const s: React.CSSProperties = {
      font: w.isCode ? `700 ${52 * scale}px/1.2 ${code}` : `700 ${60 * scale}px/1.2 ${body}`,
      padding: `${2 * scale}px ${12 * scale}px`,
      borderRadius: 12 * scale,
      color: text,
      textShadow: boxed ? "none" : shadow,
    };
    if (w.isCode) return { ...s, textShadow: "none", ...(w.state === "spoken" ? { background: accent, color: brandInk(accent) } : { background: rgba(bg, 0.85), color: accent }) };
    if (look.preset === "highlight-word" && w.state === "spoken") return { ...s, background: accent, color: brandInk(accent), textShadow: "none" };
    if (look.preset === "karaoke" && w.state !== "upcoming") return { ...s, color: accent };
    if (boxed && w.state === "spoken") return { ...s, color: accent };
    return s;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 * scale,
      ...(boxed ? { background: rgba(bg, 0.82), borderRadius: 24 * scale, padding: `${22 * scale}px ${18 * scale}px` } : {}) }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 10 * scale }}>
          {line.map((w, j) => <span key={j} style={style(w)}>{w.text}</span>)}
        </div>
      ))}
    </div>
  );
}
