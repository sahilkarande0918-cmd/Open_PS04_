/**
 * Canonical timeline — the one document format shared by AI generation (Python emits it), the editor,
 * preview and export. Zod is the source of truth; `timeline.schema.json` is generated from it for Python.
 * Times are seconds on the composition clock unless a field says "source".
 */
import { z } from "zod";

export const SCHEMA_VERSION = 1;

const seconds = z.number().min(0);
const px = z.number().int().min(0);

/** Section 18 crop keyframe; `t` is relative to the item's start. */
export const CropKeyframe = z.object({
  t: seconds,
  crop_x: px,
  crop_y: px,
  crop_width: z.number().int().positive(),
  crop_height: z.number().int().positive(),
  layout: z.enum(["crop", "panel"]),
  region: z.string(),
  transition_mode: z.enum(["start", "hold", "ease", "cut", "manual"]),
});

export const Asset = z.object({
  id: z.string().min(1),
  kind: z.enum(["video", "audio", "image", "font"]),
  /** Path inside the render project directory, never an absolute or user-supplied path. */
  src: z.string().regex(/^[A-Za-z0-9_.-]+$/),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: seconds.optional(),
});

export const VideoItem = z.object({
  id: z.string().min(1),
  type: z.literal("video"),
  assetId: z.string().min(1),
  start: seconds,
  duration: z.number().positive(),
  sourceStart: seconds,
  sourceEnd: z.number().positive(),
  volume: z.number().min(0).max(3.98).default(1),
  cropKeyframes: z.array(CropKeyframe).min(1),
});

export const CaptionWord = z.object({
  text: z.string().min(1),
  start: seconds,
  end: seconds,
  isCode: z.boolean().default(false),
});

export const CaptionItem = z.object({
  id: z.string().min(1),
  type: z.literal("caption"),
  start: seconds,
  duration: z.number().positive(),
  words: z.array(CaptionWord),
});

export const Item = z.discriminatedUnion("type", [VideoItem, CaptionItem]);

export const Track = z.object({
  id: z.string().min(1),
  kind: z.enum(["video", "audio", "caption", "text", "overlay"]),
  items: z.array(Item),
});

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const Brand = z.object({
  name: z.string().max(80).default(""),
  handle: z.string().max(40).default(""),
  colors: z.object({ background: color, text: color, accent: color }),
  fonts: z.object({ body: z.string().min(1), code: z.string().min(1) }),
});

export const CaptionStyle = z.object({
  preset: z.enum(["highlight-word"]).default("highlight-word"),
  fontSize: z.number().int().min(24).max(120).default(64),
  maxCharsPerLine: z.number().int().min(10).max(60).default(32),
  maxLines: z.number().int().min(1).max(3).default(2),
  /** Lower safe zone for 9:16 platforms (clear of the top bar and the bottom UI). */
  safeTop: px.default(1350),
  safeBottom: px.default(1650),
});

export const RenderSettings = z.object({
  quality: z.enum(["draft", "looks", "delivery"]).default("looks"),
});

export const Composition = z
  .object({
    id: z.string().min(1),
    schemaVersion: z.literal(SCHEMA_VERSION),
    fps: z.union([z.literal(24), z.literal(30), z.literal(60)]).default(30),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    duration: z.number().positive(),
    source: z.object({ recordingId: z.string(), highlightId: z.string() }).partial().default({}),
    assets: z.record(z.string(), Asset),
    tracks: z.array(Track),
    brand: Brand,
    captionStyle: CaptionStyle,
    renderSettings: RenderSettings,
  })
  .superRefine((c, ctx) => {
    c.tracks.forEach((track, ti) =>
      track.items.forEach((item, ii) => {
        const path = ["tracks", ti, "items", ii];
        if (item.start + item.duration > c.duration + 1e-3)
          ctx.addIssue({ code: "custom", path, message: "item ends after the composition" });
        if (item.type === "video") {
          if (!c.assets[item.assetId]) ctx.addIssue({ code: "custom", path, message: `unknown asset ${item.assetId}` });
          if (Math.abs(item.sourceEnd - item.sourceStart - item.duration) > 1e-3)
            ctx.addIssue({ code: "custom", path, message: "duration must equal sourceEnd - sourceStart (no speed change yet)" });
        }
      }),
    );
  });

export type Composition = z.infer<typeof Composition>;
export type CropKeyframe = z.infer<typeof CropKeyframe>;
export type CaptionWord = z.infer<typeof CaptionWord>;

/** Parse untrusted JSON into a validated composition (throws ZodError with paths). */
export const parseComposition = (doc: unknown): Composition => Composition.parse(doc);

/** JSON Schema for non-TS consumers. Cross-field rules (superRefine) are enforced again in Python. */
export const jsonSchema = () => z.toJSONSchema(Composition, { target: "draft-2020-12", io: "input" });
