import { brandInk, fontFaces, type BrandKit } from "@/lib/brand";

// 20 % scale of the 1080×1920 render; sizes and positions mirror apps/api/app/services/rendering/compose.py
const S = 0.2;
const W = 1080 * S, H = 1920 * S;
const SAMPLE = [
  { t: "Ab", code: false },
  { t: "hum", code: false },
  { t: "AbortController", code: true },
  { t: "use", code: false },
  { t: "karenge", code: false },
];
const SPOKEN = 2; // the word shown as "being spoken"

function rgba(hex: string, a: number) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function Frame({ label, bg, children }: { label: string; bg: string; children: React.ReactNode }) {
  return (
    <figure className="space-y-1.5">
      <div className="relative overflow-hidden rounded-[6px]" style={{ width: W, height: H, background: bg }}>{children}</div>
      <figcaption className="text-[12px] text-muted">{label}</figcaption>
    </figure>
  );
}

export function BrandPreview({ kit }: { kit: BrandKit }) {
  const { background: bg, text, accent } = kit.colors;
  const body = `"${kit.fonts.body} Brand", sans-serif`;
  const code = `"${kit.fonts.code} Brand", monospace`;
  const ink = brandInk(accent);
  const shadow = "0 0.6px 0 rgba(0,0,0,.7), 0 0 4px rgba(0,0,0,.8)";
  const logo = (max: [number, number]) =>
    // eslint-disable-next-line @next/next/no-img-element -- data-URL logo, nothing to optimise
    kit.logo ? <img src={kit.logo} alt="" style={{ maxWidth: max[0] * S, maxHeight: max[1] * S, objectFit: "contain" }} /> : null;
  const card: React.CSSProperties = {
    position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 36 * S, padding: `0 ${90 * S}px`, textAlign: "center",
  };
  const h1: React.CSSProperties = { margin: 0, font: `700 ${84 * S}px/1.12 ${body}`, color: text };

  function word(w: (typeof SAMPLE)[number], i: number) {
    const spoken = i === SPOKEN, said = i < SPOKEN;
    const style: React.CSSProperties = {
      font: w.code ? `700 ${52 * S}px/1.2 ${code}` : `700 ${60 * S}px/1.2 ${body}`,
      padding: `${2 * S}px ${12 * S}px`, borderRadius: 12 * S, color: text,
      textShadow: kit.caption_preset === "boxed" ? "none" : shadow,
    };
    if (w.code) Object.assign(style, spoken ? { background: accent, color: ink } : { background: rgba(bg, 0.85), color: accent, textShadow: "none" });
    else if (kit.caption_preset === "highlight-word" && spoken) Object.assign(style, { background: accent, color: ink, textShadow: "none" });
    else if (kit.caption_preset === "karaoke" && (spoken || said)) style.color = accent;
    else if (kit.caption_preset === "boxed" && spoken) style.color = accent;
    return <span key={i} style={style}>{w.t}</span>;
  }

  const [vert, horiz] = kit.watermark.position.split("-") as ["top" | "bottom", "left" | "right"];
  return (
    <div aria-label="Brand preview" className="flex flex-wrap gap-3 lg:w-[460px]">
      <style>{fontFaces}</style>
      {kit.intro.enabled && (
        <Frame label={`Intro · ${kit.intro.duration} s`} bg={bg}>
          <div style={card}>
            {logo([520, 300])}
            <div style={{ width: 140 * S, height: 10 * S, borderRadius: 5 * S, background: accent }} />
            <h1 style={h1}>{kit.intro.title.replace("{title}", "Cleanup with AbortController")}</h1>
          </div>
        </Frame>
      )}
      <Frame label="Clip (your recording)" bg="#1e1e1e">
        <div className="absolute inset-0 p-2 font-mono text-[7px] leading-[11px] text-[#9cdcfe]" aria-hidden>
          {["useEffect(() => {", "  const ctrl = new AbortController();", "  fetch(url, { signal: ctrl.signal })", "  return () => ctrl.abort();", "}, [url]);"].map((l) => <div key={l} className="whitespace-pre">{l}</div>)}
        </div>
        {kit.watermark.enabled && (kit.logo || kit.handle) && (
          <div style={{ position: "absolute", [vert]: 150 * S, [horiz]: 44 * S, display: "flex", alignItems: "center", gap: 14 * S, padding: `${10 * S}px ${18 * S}px`, borderRadius: 18 * S, background: rgba(bg, 0.72) }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- data-URL logo */}
            {kit.logo && <img src={kit.logo} alt="" style={{ height: 84 * S, maxWidth: 260 * S, objectFit: "contain" }} />}
            {kit.handle && <span style={{ font: `700 ${34 * S}px/1 ${body}`, color: text, textShadow: shadow }}>{kit.handle}</span>}
          </div>
        )}
        <div style={{ position: "absolute", left: 48 * S, right: 48 * S, top: 1350 * S, height: 300 * S, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 10 * S, ...(kit.caption_preset === "boxed" ? { background: rgba(bg, 0.82), borderRadius: 24 * S, padding: `${22 * S}px ${18 * S}px` } : {}) }}>
            {SAMPLE.map(word)}
          </div>
        </div>
      </Frame>
      {kit.outro.enabled && (
        <Frame label={`Outro · ${kit.outro.duration} s`} bg={bg}>
          <div style={card}>
            {logo([520, 300])}
            <h1 style={h1}>{kit.outro.cta}</h1>
            {kit.handle && <p style={{ margin: 0, font: `700 ${52 * S}px/1.2 ${body}`, color: accent }}>{kit.handle}</p>}
          </div>
        </Frame>
      )}
    </div>
  );
}
