import { BODY_FONTS, CODE_FONTS } from "@reel-studio/timeline-schema";

export { BODY_FONTS, CODE_FONTS };
export type BodyFont = (typeof BODY_FONTS)[number];
export type CodeFont = (typeof CODE_FONTS)[number];
export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type CaptionPreset = "highlight-word" | "karaoke" | "boxed";

/** A `brand_kits` row (see supabase/migrations/20261017010000_brand_kits.sql). */
export type BrandKit = {
  id: string;
  name: string;
  is_default: boolean;
  colors: { background: string; text: string; accent: string };
  fonts: { body: BodyFont; code: CodeFont };
  logo: string | null;
  handle: string;
  watermark: { enabled: boolean; position: Corner };
  caption_preset: CaptionPreset;
  intro: { enabled: boolean; duration: number; title: string };
  outro: { enabled: boolean; duration: number; cta: string };
};

/** Same files the renderer bundles (apps/api/app/services/rendering/fonts), served from /brand-fonts. */
export const FONT_FILES: Record<BodyFont | CodeFont, [string, number]> = {
  Archivo: ["archivo-800.woff2", 800],
  Poppins: ["poppins-700.woff2", 700],
  "Noto Sans": ["noto-sans-700.woff2", 700],
  "JetBrains Mono": ["jetbrains-mono-700.woff2", 700],
  "Fira Code": ["fira-code-600.woff2", 600],
};
export const fontFaces = Object.entries(FONT_FILES)
  .map(([f, [file, w]]) => `@font-face{font-family:"${f} Brand";src:url("/brand-fonts/${file}") format("woff2");font-weight:${w};}`)
  .join("");

export const LOGO_MAX_BYTES = 300 * 1024;
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio (1–21). */
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Text colour the renderer puts on the accent pill (matches compose.brand_ink). */
export const brandInk = (accent: string) => (luminance(accent) > 0.35 ? "#141005" : "#ffffff");
