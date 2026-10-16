"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, useBackend } from "@/lib/backend";
import { createClient } from "@/lib/supabase/client";

type Word = {
  idx: number;
  segment_idx: number;
  start_s: number;
  end_s: number;
  raw_text: string;
  corrected_text: string;
  confidence: number | null;
  metadata: { correction?: { source: string; term: string }; edited?: boolean; merged_into?: number };
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

async function loadWords(transcriptId: string) {
  const sb = createClient();
  const all: Word[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("transcript_words")
      .select("idx, segment_idx, start_s, end_s, raw_text, corrected_text, confidence, metadata")
      .eq("transcript_id", transcriptId)
      .order("idx")
      .range(from, from + 999);
    if (error) throw error;
    all.push(...(data as Word[]));
    if (data.length < 1000) return all;
  }
}

export function TranscriptView({ recordingId, transcriptId, canEdit }: { recordingId: string; transcriptId: string; canEdit: boolean }) {
  const backend = useBackend();
  const video = useRef<HTMLVideoElement>(null);
  const [now, setNow] = useState(0);
  const [query, setQuery] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const words = useQuery({ queryKey: ["words", transcriptId], queryFn: () => loadWords(transcriptId) });
  const [local, setLocal] = useState<Record<number, string>>({});

  const base = backend.data?.state === "online" ? backend.data.url : null;
  const media = useQuery({
    queryKey: ["media", recordingId, base],
    enabled: !!base,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const r = await apiFetch(base!, `/recordings/${recordingId}/media-url`);
      if (!r.ok) throw new Error("media link refused");
      return `${base!.replace(/\/$/, "")}${(await r.json()).path}`;
    },
  });

  const list = useMemo(() => words.data ?? [], [words.data]);
  const segments = useMemo(() => {
    const m = new Map<number, Word[]>();
    for (const w of list) m.set(w.segment_idx, [...(m.get(w.segment_idx) ?? []), w]);
    return [...m.values()];
  }, [list]);
  const active = useMemo(() => {
    let lo = 0, hi = list.length - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid].start_s <= now) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans >= 0 && now <= list[ans].end_s + 0.6 ? list[ans].idx : -1;
  }, [list, now]);
  const q = query.trim().toLowerCase();
  const hits = useMemo(() => (q ? list.filter((w) => (local[w.idx] ?? w.corrected_text).toLowerCase().includes(q) || w.raw_text.toLowerCase().includes(q)) : []), [q, list, local]);

  useEffect(() => {
    document.querySelector(`[data-word="${active}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  function seek(t: number) {
    if (video.current) {
      video.current.currentTime = t;
      video.current.play().catch(() => {});
    }
  }

  async function save(w: Word, text: string) {
    setEditing(null);
    const value = text.trim();
    if (value === (local[w.idx] ?? w.corrected_text)) return;
    setLocal((l) => ({ ...l, [w.idx]: value }));
    const { error } = await createClient()
      .from("transcript_words")
      .update({ corrected_text: value, metadata: { ...w.metadata, edited: true, previous: w.corrected_text } })
      .eq("transcript_id", transcriptId)
      .eq("idx", w.idx);
    setSaveError(error ? `Could not save “${value}”: ${error.message}` : null);
  }

  if (words.isLoading) return <p className="text-muted">Loading transcript…</p>;
  if (words.error) return <p className="text-danger">{String(words.error)}</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-3 lg:sticky lg:top-6 lg:self-start">
        {media.data ? (
          <video ref={video} src={media.data} controls preload="metadata" className="aspect-video w-full rounded-[6px] bg-black" onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)} />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-[6px] bg-surface p-6 text-center text-[14px] text-muted">
            {base ? "Loading video…" : "The original recording plays from the processing backend, which is offline. The transcript below is still available."}
          </div>
        )}
        <p className="text-[13px] text-muted">
          Click a word to jump there. {canEdit && "Double-click to correct it."} Underlined words were corrected automatically.
        </p>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-1 items-center gap-2 rounded-[4px] bg-surface-2 px-3 py-2">
            <Search size={15} aria-hidden className="text-muted" />
            <span className="sr-only">Search transcript</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search words or terms" className="w-full bg-transparent text-[14px] outline-none" />
          </label>
          <label className="flex items-center gap-2 text-[13px] text-muted">
            <input type="checkbox" checked={showRaw} onChange={(e) => setShowRaw(e.target.checked)} /> Show raw ASR
          </label>
        </div>
        {q && (
          <div className="flex flex-wrap gap-2 text-[13px]">
            <span className="text-muted">{hits.length} match{hits.length === 1 ? "" : "es"}</span>
            {hits.slice(0, 30).map((w) => (
              <button key={w.idx} type="button" onClick={() => seek(w.start_s)} className="rounded-[3px] bg-surface-2 px-1.5 tabular-nums hover:bg-surface-3">
                {fmt(w.start_s)}
              </button>
            ))}
          </div>
        )}
        {saveError && <p className="text-[13px] text-danger">{saveError}</p>}
        <div className="max-h-[70svh] space-y-4 overflow-y-auto pr-2">
          {segments.map((seg) => (
            <p key={seg[0].segment_idx} className="text-[15px] leading-7">
              <button type="button" onClick={() => seek(seg[0].start_s)} className="mr-2 align-baseline text-[12px] tabular-nums text-muted hover:text-accent">
                {fmt(seg[0].start_s)}
              </button>
              {seg.map((w) => {
                const text = showRaw ? w.raw_text : (local[w.idx] ?? w.corrected_text);
                if (!text) return null;
                const hit = q && text.toLowerCase().includes(q);
                if (editing === w.idx)
                  return (
                    <input
                      key={w.idx}
                      autoFocus
                      defaultValue={local[w.idx] ?? w.corrected_text}
                      onBlur={(e) => save(w, e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditing(null);
                      }}
                      className="mx-0.5 w-32 rounded-[3px] bg-surface-3 px-1 text-[15px] outline-none ring-2 ring-accent"
                    />
                  );
                const corrected = !showRaw && (w.metadata?.correction || w.metadata?.edited || local[w.idx] !== undefined);
                return (
                  <span
                    key={w.idx}
                    data-word={w.idx}
                    title={`${fmt(w.start_s)}–${fmt(w.end_s)}${w.confidence != null ? ` · confidence ${(w.confidence * 100).toFixed(0)}%` : ""}${corrected ? ` · heard “${w.raw_text}”` : ""}`}
                    onClick={() => seek(w.start_s)}
                    onDoubleClick={() => canEdit && !showRaw && setEditing(w.idx)}
                    className={`cursor-pointer rounded-[2px] px-[1px] ${w.idx === active ? "bg-accent text-accent-ink" : hit ? "bg-surface-3" : "hover:bg-surface-2"} ${corrected ? "underline decoration-accent decoration-2 underline-offset-4" : ""} ${w.confidence != null && w.confidence < 0.5 && !corrected ? "text-muted" : ""}`}
                  >
                    {text}{" "}
                  </span>
                );
              })}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
