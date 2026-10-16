"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CaptionPage, type CaptionLook, type CaptionWord } from "@/components/brand/caption-page";
import { apiFetch, useBackend } from "@/lib/backend";
import { fontFaces, type CaptionPreset } from "@/lib/brand";
import { useMediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";
import { Renders } from "./renders";

export type Keyframe = {
  t: number;
  crop_x: number;
  crop_y: number;
  crop_width: number;
  crop_height: number;
  layout: "crop" | "panel";
  region: string;
  transition_mode: "start" | "ease" | "hold" | "cut" | "manual";
};

type Highlight = {
  id: string;
  rank: number;
  start_s: number;
  end_s: number;
  score: number;
  score_kind: string;
  title: string;
  summary: string;
  transcript_excerpt: string;
  reasons: string[];
  crop_keyframes: Keyframe[];
  crop_overridden: boolean;
  status: "proposed" | "selected" | "rejected";
  boundaries_edited: boolean;
};

/** Panel centre as a fraction of frame height when no preview data yet (renderer default: captions lower). */
const PANEL_CENTER = 0.4;
const RENDER_H = 1920;

type PageWord = { text: string; start: number; end: number; isCode: boolean };
type SubtitlePreview = {
  pages: { start: number; end: number; lines: PageWord[][] }[];
  captionStyle: { preset: CaptionPreset; safeTop: number; safeBottom: number };
  colors: CaptionLook["colors"];
  fonts: CaptionLook["fonts"];
  panelCenter: number;
  brandKit: string | null;
};

/** Caption page on screen at clip time t, with each word's state (same on/off rules as the renderer). */
function pageAt(preview: SubtitlePreview | undefined, t: number): CaptionWord[][] | null {
  const page = preview?.pages.find((p) => p.start <= t && t < p.end);
  if (!page) return null;
  const flat = page.lines.flat();
  return page.lines.map((line) =>
    line.map((w) => {
      const next = flat[flat.indexOf(w) + 1];
      const off = Math.max(next ? next.start : page.end, w.start + 0.05);
      return { text: w.text, isCode: w.isCode, state: t < w.start ? "upcoming" : t < off ? "spoken" : "said" };
    }),
  );
}
const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;

/** Crop box at clip-relative time t: eased between keyframes, stepped at cuts. */
export function cropAt(kfs: Keyframe[], t: number): Keyframe {
  let i = 0;
  while (i + 1 < kfs.length && kfs[i + 1].t <= t) i++;
  const a = kfs[i], b = kfs[i + 1];
  if (!b || b.transition_mode === "cut" || b.layout !== a.layout) return a;
  const p = Math.min(1, Math.max(0, (t - a.t) / Math.max(b.t - a.t, 0.001)));
  const lerp = (x: number, y: number) => Math.round(x + (y - x) * p);
  return { ...a, crop_x: lerp(a.crop_x, b.crop_x), crop_y: lerp(a.crop_y, b.crop_y), crop_width: lerp(a.crop_width, b.crop_width), crop_height: lerp(a.crop_height, b.crop_height) };
}

function Preview({ h, mediaUrl, srcW, srcH, onOverride }: { h: Highlight; mediaUrl?: string; srcW: number; srcH: number; onOverride: (t: number, x: number) => void }) {
  const portrait = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLCanvasElement>(null);
  const [t, setT] = useState(0);
  // the source frame behind the crop box (drawing a cross-origin video is allowed; reading pixels is not)
  const drawFrame = () => {
    const v = portrait.current, c = frame.current;
    if (v && c && v.readyState >= 2) c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
  };
  const W = 216, H = 384; // 9:16 preview
  const S = H / RENDER_H;
  const k = h.crop_keyframes.length ? cropAt(h.crop_keyframes, t) : null;
  const backend = useBackend();
  const base = backend.data?.state === "online" ? backend.data.url : null;
  const subtitles = useQuery({
    queryKey: ["subtitle-preview", h.id, h.start_s, h.end_s],
    enabled: !!base,
    queryFn: async () => {
      const r = await apiFetch(base!, `/highlights/${h.id}/preview`);
      if (!r.ok) throw new Error("preview refused");
      return (await r.json()) as SubtitlePreview;
    },
  });
  const panelCenter = subtitles.data?.panelCenter ?? PANEL_CENTER;
  const page = pageAt(subtitles.data, t);
  // follow playback every frame (timeupdate fires only ~4×/s, too coarse for word highlighting)
  const tick = useRef(0);
  function follow() {
    const v = portrait.current;
    if (!v || v.paused) return;
    setT(Math.max(0, v.currentTime - h.start_s));
    tick.current = requestAnimationFrame(follow);
  }
  useEffect(() => () => cancelAnimationFrame(tick.current), []);
  // same geometry as the renderer (apps/api/app/services/rendering/compose.py `camera`)
  let style: React.CSSProperties = {};
  let win = { top: 0, height: H };
  if (k) {
    const s = k.layout === "panel" ? W / k.crop_width : H / k.crop_height;
    if (k.layout === "panel") {
      const ph = k.crop_height * s;
      win = { top: Math.min(Math.max(panelCenter * H - ph / 2, 0), H - ph), height: ph };
    }
    style = { position: "absolute", width: srcW * s, height: srcH * s, left: -k.crop_x * s, top: -k.crop_y * s, maxWidth: "none" };
  }
  const box = k ? { left: (k.crop_x / srcW) * 100, width: (k.crop_width / srcW) * 100, top: (k.crop_y / srcH) * 100, height: (k.crop_height / srcH) * 100 } : null;

  function dragTo(e: React.PointerEvent<HTMLDivElement>) {
    if (!k || e.buttons !== 1) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * srcW - k.crop_width / 2);
    onOverride(t, Math.max(0, Math.min(srcW - k.crop_width, x)));
  }

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className="relative shrink-0 overflow-hidden rounded-[6px] bg-black" style={{ width: W, height: H }}>
        {mediaUrl ? (
          <div className="absolute left-0 w-full overflow-hidden" style={win}>
          <video
            ref={portrait}
            src={mediaUrl}
            controls={false}
            playsInline
            preload="auto"
            muted={false}
            onLoadedMetadata={(e) => { e.currentTarget.currentTime = h.start_s; }}
            onSeeked={drawFrame}
            onPlay={() => { tick.current = requestAnimationFrame(follow); }}
            style={style}
            onTimeUpdate={(e) => {
              const ct = e.currentTarget.currentTime;
              if (ct >= h.end_s) e.currentTarget.pause();
              setT(Math.max(0, ct - h.start_s));
              drawFrame();
            }}
          />
          </div>
        ) : (
          <p className="p-4 text-[13px] text-muted">Preview needs the processing backend online.</p>
        )}
        {k?.layout === "panel" && <span className="absolute left-2 top-2 rounded-[3px] bg-black/70 px-1.5 text-[11px] text-white">code panel</span>}
        {subtitles.data && page && (
          <div aria-live="off" style={{ position: "absolute", left: 48 * S, right: 48 * S, top: subtitles.data.captionStyle.safeTop * S,
            height: (subtitles.data.captionStyle.safeBottom - subtitles.data.captionStyle.safeTop) * S, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <style>{fontFaces}</style>
            <CaptionPage lines={page} scale={S}
              look={{ colors: subtitles.data.colors, fonts: subtitles.data.fonts, preset: subtitles.data.captionStyle.preset }} />
          </div>
        )}
      </div>
      <div className="min-w-[260px] flex-1 space-y-3">
        <div className="flex items-center gap-3 text-[13px]">
          <button type="button" className="rounded-[4px] bg-surface-3 px-3 py-1.5 hover:bg-surface-2" onClick={() => {
            const v = portrait.current; if (!v) return;
            if (v.paused) { if (v.currentTime < h.start_s || v.currentTime >= h.end_s) v.currentTime = h.start_s; v.play(); } else v.pause();
          }}>
            Play / pause clip
          </button>
          <span className="tabular-nums text-muted">{fmt(t)} / {fmt(h.end_s - h.start_s)}</span>
        </div>
        {subtitles.data && (
          <p className="text-[12px] text-muted">
            Captions as they will render ({subtitles.data.brandKit ? `brand kit “${subtitles.data.brandKit}”` : "no brand kit"}, {subtitles.data.captionStyle.preset}). Fix wording in the transcript below.
          </p>
        )}
        {box && (
          <div>
            <p className="mb-1.5 text-[13px] text-muted">Source frame — drag to move the crop at this moment{h.crop_overridden ? " (manually adjusted)" : ""}</p>
            <div className="relative aspect-video w-full max-w-[420px] cursor-ew-resize overflow-hidden rounded-[4px] bg-surface-2" onPointerDown={dragTo} onPointerMove={dragTo}>
              <canvas ref={frame} width={480} height={270} className="absolute inset-0 h-full w-full" aria-hidden />
              <div className="absolute border-2 border-accent bg-accent/10" style={{ left: `${box.left}%`, width: `${box.width}%`, top: `${box.top}%`, height: `${box.height}%` }} />
              <span className="absolute bottom-1 right-2 text-[11px] text-muted">{k?.layout} · x {k?.crop_x} · {k?.crop_width}×{k?.crop_height}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Highlights({ recordingId, projectId, srcW, srcH, canEdit, words }: {
  recordingId: string; projectId: string; srcW: number; srcH: number; canEdit: boolean;
  words: { start_s: number; end_s: number }[];
}) {
  const qc = useQueryClient();
  const backend = useBackend();
  const { url } = useMediaUrl(recordingId);
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = ["highlights", recordingId];
  const list = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("highlight_candidates")
        .select("id, rank, start_s, end_s, score, score_kind, title, summary, transcript_excerpt, reasons, crop_keyframes, crop_overridden, status, boundaries_edited")
        .eq("recording_id", recordingId)
        .order("rank");
      if (error) throw error;
      return data as Highlight[];
    },
  });
  useEffect(() => {
    const sb = createClient();
    const ch = sb.channel(`hl:${recordingId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "highlight_candidates", filter: `recording_id=eq.${recordingId}` }, () => qc.invalidateQueries({ queryKey: key }))
      .subscribe();
    return () => { sb.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingId]);

  const items = useMemo(() => list.data ?? [], [list.data]);
  const current = items.find((h) => h.id === active) ?? items[0];

  async function patch(id: string, fields: Partial<Highlight>) {
    qc.setQueryData<Highlight[]>(key, (old) => old?.map((h) => (h.id === id ? { ...h, ...fields } : h)));
    const { error } = await createClient().from("highlight_candidates").update(fields).eq("id", id);
    setError(error?.message ?? null);
    if (error) qc.invalidateQueries({ queryKey: key });
  }

  // Boundaries snap to word edges so a clip never cuts through a word.
  function snap(t: number, edge: "start" | "end") {
    if (!words.length) return t;
    const pts = words.map((w) => (edge === "start" ? w.start_s : w.end_s));
    return pts.reduce((best, p) => (Math.abs(p - t) < Math.abs(best - t) ? p : best), pts[0]);
  }

  async function rerun() {
    if (backend.data?.state !== "online") return setError("The processing backend is offline.");
    const r = await apiFetch(backend.data.url, `/recordings/${recordingId}/analyze`, { method: "POST" });
    if (!r.ok) setError((await r.json()).detail ?? "Could not start analysis");
    qc.invalidateQueries({ queryKey: ["jobs", projectId] });
  }

  if (list.isLoading) return null;
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[20px]">Highlights</h2>
        {canEdit && (
          <button type="button" onClick={rerun} className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
            <RefreshCw size={13} aria-hidden /> Re-run analysis
          </button>
        )}
      </div>
      {error && <p className="text-[13px] text-danger">{error}</p>}
      {items.length === 0 && <p className="text-[14px] text-muted">No highlights yet. They appear after analysis finishes.</p>}
      {items.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <ol className="space-y-2">
            {items.map((h) => (
              <li key={h.id}>
                <button type="button" onClick={() => setActive(h.id)}
                  className={`w-full rounded-[6px] p-3 text-left transition-colors ${current?.id === h.id ? "bg-surface-3" : "bg-surface hover:bg-surface-2"} ${h.status === "rejected" ? "opacity-50" : ""}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[15px]">{h.title}</span>
                    <span className="shrink-0 text-[12px] tabular-nums text-muted" title={`${h.score_kind} score — a ranking aid, not a probability`}>
                      {h.score_kind} {h.score.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-3 text-[12px] tabular-nums text-muted">
                    <span>{fmt(h.start_s)}–{fmt(h.end_s)}</span>
                    <span>{(h.end_s - h.start_s).toFixed(1)} s</span>
                    {h.status !== "proposed" && <span className={h.status === "selected" ? "text-success" : ""}>{h.status}</span>}
                    {h.boundaries_edited && <span>edited</span>}
                  </div>
                </button>
              </li>
            ))}
          </ol>
          {current && (
            <div className="space-y-4 rounded-[6px] bg-surface p-4">
              <Preview key={current.id} h={current} mediaUrl={url} srcW={srcW} srcH={srcH}
                onOverride={(t, x) => {
                  if (!canEdit) return;
                  const k = cropAt(current.crop_keyframes, t);
                  const kfs = [...current.crop_keyframes.filter((f) => Math.abs(f.t - t) > 0.25), { ...k, t: +t.toFixed(2), crop_x: x, transition_mode: "manual" as const }].sort((a, b) => a.t - b.t);
                  patch(current.id, { crop_keyframes: kfs, crop_overridden: true });
                }} />
              {current.summary && <p className="text-[14px]">{current.summary}</p>}
              <ul className="list-disc space-y-1 pl-5 text-[13px] text-muted">
                {current.reasons.map((r, i) => <li key={i} className={r.startsWith("Check the") ? "text-accent" : ""}>{r}</li>)}
              </ul>
              <details className="text-[13px]">
                <summary className="cursor-pointer text-muted">Transcript of this clip</summary>
                <p className="mt-2 leading-6">{current.transcript_excerpt}</p>
              </details>
              {canEdit && (
                <div className="flex flex-wrap items-end gap-3 text-[13px]">
                  {(["start_s", "end_s"] as const).map((f) => (
                    <label key={f} className="text-muted">
                      {f === "start_s" ? "Start" : "End"} (s)
                      <input type="number" step="0.1" defaultValue={current[f].toFixed(2)} key={`${current.id}-${f}-${current[f]}`}
                        className="ml-2 w-24 rounded-[4px] bg-surface-2 px-2 py-1.5 tabular-nums text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        onBlur={(e) => {
                          const v = snap(Number(e.currentTarget.value), f === "start_s" ? "start" : "end");
                          const s = f === "start_s" ? v : current.start_s, en = f === "end_s" ? v : current.end_s;
                          if (en - s < 5) return setError("A clip must be at least 5 seconds long.");
                          if (v !== current[f]) patch(current.id, { [f]: +v.toFixed(2), boundaries_edited: true });
                        }} />
                    </label>
                  ))}
                  <button type="button" onClick={() => patch(current.id, { status: "selected" })} className="flex items-center gap-1.5 rounded-[4px] bg-accent px-3 py-1.5 font-semibold text-accent-ink hover:brightness-110">
                    <Check size={14} aria-hidden /> Select
                  </button>
                  <button type="button" onClick={() => patch(current.id, { status: "rejected" })} className="flex items-center gap-1.5 rounded-[4px] bg-surface-3 px-3 py-1.5 hover:bg-surface-2">
                    <X size={14} aria-hidden /> Reject
                  </button>
                </div>
              )}
              <Renders highlightId={current.id} projectId={projectId} selected={current.status === "selected"} canEdit={canEdit} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
