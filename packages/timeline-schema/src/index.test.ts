import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Composition, jsonSchema, parseComposition } from "./index.ts";

const valid = () => ({
  id: "render-1",
  schemaVersion: 1,
  width: 1080,
  height: 1920,
  duration: 10,
  assets: { src: { id: "src", kind: "video", src: "source.mp4", width: 1920, height: 1080 } },
  tracks: [
    {
      id: "v",
      kind: "video",
      items: [
        {
          id: "clip",
          type: "video",
          assetId: "src",
          start: 0,
          duration: 10,
          sourceStart: 14.66,
          sourceEnd: 24.66,
          cropKeyframes: [{ t: 0, crop_x: 656, crop_y: 0, crop_width: 608, crop_height: 1080, layout: "crop", region: "active", transition_mode: "start" }],
        },
      ],
    },
    { id: "c", kind: "caption", items: [{ id: "cap", type: "caption", start: 0, duration: 10, words: [{ text: "AbortController", start: 1, end: 1.6, isCode: true }] }] },
  ],
  brand: { colors: { background: "#0d0f12", text: "#ffffff", accent: "#ffcc00" }, fonts: { body: "Archivo", code: "JetBrains Mono" } },
  captionStyle: {},
  renderSettings: {},
});

describe("Composition", () => {
  it("parses a valid document and fills defaults", () => {
    const c = parseComposition(valid());
    expect(c.fps).toBe(30);
    expect(c.captionStyle).toMatchObject({ safeTop: 1350, safeBottom: 1650, maxLines: 2 });
    expect(c.renderSettings.quality).toBe("looks");
  });

  it("round-trips through JSON unchanged", () => {
    const c = parseComposition(valid());
    expect(parseComposition(JSON.parse(JSON.stringify(c)))).toEqual(c);
  });

  it("rejects an unknown crop layout", () => {
    const doc = valid();
    (doc.tracks[0].items[0] as { cropKeyframes: { layout: string }[] }).cropKeyframes[0].layout = "zoom";
    expect(() => parseComposition(doc)).toThrow();
  });

  it("rejects items that end after the composition or point at missing assets", () => {
    const late = valid();
    late.duration = 5;
    expect(Composition.safeParse(late).error?.issues[0].message).toMatch(/ends after/);
    const orphan = valid();
    (orphan.tracks[0].items[0] as { assetId: string }).assetId = "nope";
    expect(Composition.safeParse(orphan).error?.issues.some((i) => /unknown asset/.test(i.message))).toBe(true);
  });

  it("rejects asset paths that could escape the render directory", () => {
    const doc = valid();
    doc.assets.src.src = "../../etc/passwd";
    expect(() => parseComposition(doc)).toThrow();
  });

  it("fills brand defaults: no watermark, intro or outro unless the kit asks", () => {
    const c = parseComposition(valid());
    expect(c.brand.watermark.enabled).toBe(false);
    expect(c.brand.intro.enabled).toBe(false);
    expect(c.brand.outro.enabled).toBe(false);
    expect(c.title).toBe("");
  });

  it("only allows bundled fonts and existing logo assets", () => {
    const font = valid();
    (font.brand.fonts as { body: string }).body = "Comic Sans MS";
    expect(() => parseComposition(font)).toThrow();
    const logo = valid() as ReturnType<typeof valid> & { brand: { logoAssetId?: string } };
    logo.brand.logoAssetId = "logo";
    expect(Composition.safeParse(logo).error?.issues[0].message).toMatch(/unknown asset logo/);
    (logo.assets as Record<string, unknown>).logo = { id: "logo", kind: "image", src: "logo.png" };
    expect(Composition.safeParse(logo).success).toBe(true);
  });

  it("committed timeline.schema.json matches the Zod schema", () => {
    const committed = JSON.parse(readFileSync(new URL("../timeline.schema.json", import.meta.url), "utf8"));
    expect(committed).toEqual(JSON.parse(JSON.stringify(jsonSchema())));
  });
});
