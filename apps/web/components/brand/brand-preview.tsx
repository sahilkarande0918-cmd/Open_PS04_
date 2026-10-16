import { CaptionPage, rgba, type CaptionWord } from "@/components/brand/caption-page";
import { CAPTION_ZONES, fontFaces, type BrandKit } from "@/lib/brand";

// 20 % scale of the 1080×1920 render; sizes and positions mirror apps/api/app/services/rendering/compose.py
const S = 0.2;
const W = 1080 * S, H = 1920 * S;
// sample page with the third word "being spoken"
const SAMPLE: CaptionWord[][] = [
  [{ text: "Ab", isCode: false, state: "said" }, { text: "hum", isCode: false, state: "said" }],
  [{ text: "AbortController", isCode: true, state: "spoken" }, { text: "use", isCode: false, state: "upcoming" }, { text: "karenge", isCode: false, state: "upcoming" }],
];

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
  const shadow = "0 0.6px 0 rgba(0,0,0,.7), 0 0 4px rgba(0,0,0,.8)";
  const logo = (max: [number, number]) =>
    // eslint-disable-next-line @next/next/no-img-element -- data-URL logo, nothing to optimise
    kit.logo ? <img src={kit.logo} alt="" style={{ maxWidth: max[0] * S, maxHeight: max[1] * S, objectFit: "contain" }} /> : null;
  const card: React.CSSProperties = {
    position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 36 * S, padding: `0 ${90 * S}px`, textAlign: "center",
  };
  const h1: React.CSSProperties = { margin: 0, font: `700 ${84 * S}px/1.12 ${body}`, color: text };

  const [zoneTop, zoneBottom] = CAPTION_ZONES[kit.caption_position ?? "lower"];
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
        <div style={{ position: "absolute", left: 48 * S, right: 48 * S, top: zoneTop * S, height: (zoneBottom - zoneTop) * S, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CaptionPage lines={SAMPLE} look={{ colors: kit.colors, fonts: kit.fonts, preset: kit.caption_preset }} scale={S} />
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
