"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { BrandPreview } from "@/components/brand/brand-preview";
import {
  BODY_FONTS,
  CODE_FONTS,
  LOGO_MAX_BYTES,
  LOGO_TYPES,
  brandInk,
  contrast,
  type BrandKit,
  type CaptionPosition,
  type CaptionPreset,
  type Corner,
} from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

const COLUMNS =
  "id, name, is_default, colors, fonts, logo, handle, watermark, caption_preset, caption_position, intro, outro";
const PRESETS: { value: CaptionPreset; label: string; hint: string }[] = [
  { value: "highlight-word", label: "Highlight word", hint: "spoken word on an accent pill" },
  { value: "karaoke", label: "Karaoke", hint: "words fill with the accent as they are spoken" },
  { value: "boxed", label: "Boxed", hint: "captions on a solid panel, spoken word in accent" },
];
const CORNERS: Corner[] = ["top-left", "top-right", "bottom-left", "bottom-right"];
const field = "mt-1 block w-full rounded-[4px] bg-surface-2 px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function BrandEditor({ orgId, orgName, canEdit }: { orgId: string; orgName: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const key = ["brand-kits", orgId];
  const kits = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("brand_kits")
        .select(COLUMNS)
        .eq("organization_id", orgId)
        .order("created_at");
      if (error) throw error;
      return data as BrandKit[];
    },
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BrandKit | null>(null);
  const [status, setStatus] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const active = kits.data?.find((k) => k.id === activeId) ?? kits.data?.find((k) => k.is_default) ?? kits.data?.[0];
  // reset the draft whenever the saved kit changes (switch, save, refetch with new data)
  const [base, setBase] = useState<BrandKit | undefined>();
  if (active !== base) {
    setBase(active);
    setDraft(active ? structuredClone(active) : null);
  }

  async function create() {
    const first = !kits.data?.length;
    const { data, error } = await createClient()
      .from("brand_kits")
      .insert({ organization_id: orgId, name: first ? orgName.slice(0, 60) : "New kit", is_default: first })
      .select("id")
      .single();
    if (error) return setStatus({ kind: "error", text: error.message });
    await qc.invalidateQueries({ queryKey: key });
    setActiveId(data.id);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    const sb = createClient();
    // one default per org (unique index): clear the old default before setting a new one
    if (draft.is_default && !active?.is_default) {
      const { error } = await sb.from("brand_kits").update({ is_default: false }).eq("organization_id", orgId).eq("is_default", true);
      if (error) {
        setSaving(false);
        return setStatus({ kind: "error", text: error.message });
      }
    }
    const { id, ...fields } = draft;
    const { error } = await sb.from("brand_kits").update(fields).eq("id", id);
    setSaving(false);
    setStatus(error ? { kind: "error", text: error.message } : { kind: "ok", text: "Saved. New renders use these settings." });
    qc.invalidateQueries({ queryKey: key });
  }

  async function remove() {
    if (!draft || !confirm(`Delete the brand kit “${draft.name}”? Finished renders keep their copy.`)) return;
    const { error } = await createClient().from("brand_kits").delete().eq("id", draft.id);
    if (error) return setStatus({ kind: "error", text: error.message });
    setActiveId(null);
    setDraft(null);
    qc.invalidateQueries({ queryKey: key });
  }

  function pickLogo(file: File | undefined) {
    if (!file || !draft) return;
    if (!LOGO_TYPES.includes(file.type)) return setStatus({ kind: "error", text: "Logo must be PNG, JPEG, WebP or SVG." });
    if (file.size > LOGO_MAX_BYTES) return setStatus({ kind: "error", text: "Logo must be 300 KB or smaller." });
    const reader = new FileReader();
    reader.onload = () => setDraft({ ...draft, logo: String(reader.result) });
    reader.readAsDataURL(file);
  }

  if (kits.isLoading) return <p className="text-muted">Loading…</p>;
  if (kits.error) return <p className="text-danger">{(kits.error as Error).message}</p>;
  if (!kits.data?.length)
    return (
      <div className="space-y-3 rounded-[6px] bg-surface p-6">
        <p className="text-[15px]">No brand kit yet. Renders use neutral colours with no logo, intro or outro.</p>
        {canEdit && (
          <button type="button" onClick={create} className="inline-flex items-center gap-1.5 rounded-[4px] bg-accent px-3 py-2 font-semibold text-accent-ink hover:brightness-110">
            <Plus size={15} aria-hidden /> Create brand kit
          </button>
        )}
      </div>
    );
  if (!draft) return null;

  const set = <K extends keyof BrandKit>(k: K, v: BrandKit[K]) => setDraft({ ...draft, [k]: v });
  const textContrast = contrast(draft.colors.text, draft.colors.background);
  const pillContrast = contrast(brandInk(draft.colors.accent), draft.colors.accent);
  const dirty = JSON.stringify(draft) !== JSON.stringify(active);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
      <fieldset disabled={!canEdit} className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          {kits.data.length > 1 && (
            <label className="text-[13px] text-muted">
              Kit
              <select value={draft.id} onChange={(e) => setActiveId(e.target.value)} className={field}>
                {kits.data.map((k) => <option key={k.id} value={k.id}>{k.name}{k.is_default ? " (default)" : ""}</option>)}
              </select>
            </label>
          )}
          <label className="min-w-[220px] flex-1 text-[13px] text-muted">
            Name
            <input value={draft.name} maxLength={60} onChange={(e) => set("name", e.target.value)} className={field} />
          </label>
          <label className="flex items-center gap-2 pb-2 text-[14px]">
            <input type="checkbox" checked={draft.is_default} onChange={(e) => set("is_default", e.target.checked)} className="accent-[var(--accent)]" />
            Default for new renders
          </label>
        </div>

        <section className="space-y-3">
          <h2 className="text-[16px]">Colours</h2>
          <div className="flex flex-wrap gap-5">
            {(["background", "text", "accent"] as const).map((c) => (
              <label key={c} className="text-[13px] capitalize text-muted">
                {c}
                <span className="mt-1 flex items-center gap-2">
                  <input type="color" value={draft.colors[c]} onChange={(e) => set("colors", { ...draft.colors, [c]: e.target.value })}
                    className="h-9 w-12 cursor-pointer rounded-[4px] bg-surface-2" />
                  <code className="text-[13px] text-ink">{draft.colors[c]}</code>
                </span>
              </label>
            ))}
          </div>
          <p className={`text-[13px] ${textContrast < 4.5 ? "text-danger" : "text-muted"}`}>
            Text on background: {textContrast.toFixed(1)}:1{textContrast < 4.5 ? " — below 4.5:1, intro and outro text will be hard to read." : ""}
            {" · "}Highlighted word on accent: {pillContrast.toFixed(1)}:1
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <label className="text-[13px] text-muted">
            Caption and title font
            <select value={draft.fonts.body} onChange={(e) => set("fonts", { ...draft.fonts, body: e.target.value as BrandKit["fonts"]["body"] })} className={field}>
              {BODY_FONTS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>
          <label className="text-[13px] text-muted">
            Code font
            <select value={draft.fonts.code} onChange={(e) => set("fonts", { ...draft.fonts, code: e.target.value as BrandKit["fonts"]["code"] })} className={field}>
              {CODE_FONTS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>
        </section>

        <section className="space-y-3">
          <h2 className="text-[16px]">Logo and handle</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid h-16 w-28 place-items-center overflow-hidden rounded-[4px] bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- data-URL logo, nothing to optimise */}
              {draft.logo ? <img src={draft.logo} alt="Current logo" className="max-h-14 max-w-24 object-contain" /> : <span className="text-[12px] text-muted">No logo</span>}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[4px] bg-surface-3 px-3 py-2 text-[14px] hover:bg-surface-2">
              <ImageUp size={15} aria-hidden /> Upload logo
              <input type="file" accept={LOGO_TYPES.join(",")} className="sr-only" onChange={(e) => pickLogo(e.target.files?.[0])} />
            </label>
            {draft.logo && <button type="button" onClick={() => set("logo", null)} className="text-[13px] text-muted hover:text-danger">Remove</button>}
            <span className="text-[12px] text-muted">PNG, JPEG, WebP or SVG, up to 300 KB. Transparent PNG/SVG works best.</span>
          </div>
          <label className="block max-w-[320px] text-[13px] text-muted">
            Handle
            <input value={draft.handle} maxLength={40} placeholder="@your.institute" onChange={(e) => set("handle", e.target.value)} className={field} />
          </label>
          <div className="flex flex-wrap items-center gap-4 text-[14px]">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.watermark.enabled} onChange={(e) => set("watermark", { ...draft.watermark, enabled: e.target.checked })} className="accent-[var(--accent)]" />
              Watermark during the clip
            </label>
            <select aria-label="Watermark corner" value={draft.watermark.position} disabled={!draft.watermark.enabled}
              onChange={(e) => set("watermark", { ...draft.watermark, position: e.target.value as Corner })}
              className="rounded-[4px] bg-surface-2 px-2 py-1.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50">
              {CORNERS.map((c) => <option key={c} value={c}>{c.replace("-", " ")}</option>)}
            </select>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-[16px]">Caption style</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {PRESETS.map((p) => (
              <label key={p.value} className={`cursor-pointer rounded-[6px] p-3 text-[14px] ${draft.caption_preset === p.value ? "bg-surface-3 ring-2 ring-accent" : "bg-surface hover:bg-surface-2"}`}>
                <input type="radio" name="preset" value={p.value} checked={draft.caption_preset === p.value} onChange={() => set("caption_preset", p.value)} className="sr-only" />
                {p.label}
                <span className="mt-0.5 block text-[12px] text-muted">{p.hint}</span>
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 pt-1 text-[14px]">
            Position
            <select value={draft.caption_position} onChange={(e) => set("caption_position", e.target.value as CaptionPosition)}
              className="rounded-[4px] bg-surface-2 px-2 py-1.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <option value="lower">Lower third (default)</option>
              <option value="upper">Top (code panels move down)</option>
            </select>
          </label>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[16px]">
              <input type="checkbox" checked={draft.intro.enabled} onChange={(e) => set("intro", { ...draft.intro, enabled: e.target.checked })} className="accent-[var(--accent)]" />
              Intro card
            </label>
            <label className="block text-[13px] text-muted">
              Title — <code>{"{title}"}</code> becomes the highlight&apos;s title
              <input value={draft.intro.title} maxLength={80} disabled={!draft.intro.enabled} onChange={(e) => set("intro", { ...draft.intro, title: e.target.value })} className={field} />
            </label>
            <label className="block text-[13px] text-muted">
              Length: {draft.intro.duration.toFixed(1)} s
              <input type="range" min={1} max={5} step={0.5} value={draft.intro.duration} disabled={!draft.intro.enabled}
                onChange={(e) => set("intro", { ...draft.intro, duration: Number(e.target.value) })} className="mt-1 block w-full accent-[var(--accent)]" />
            </label>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[16px]">
              <input type="checkbox" checked={draft.outro.enabled} onChange={(e) => set("outro", { ...draft.outro, enabled: e.target.checked })} className="accent-[var(--accent)]" />
              Outro card
            </label>
            <label className="block text-[13px] text-muted">
              Call to action
              <input value={draft.outro.cta} maxLength={80} disabled={!draft.outro.enabled} onChange={(e) => set("outro", { ...draft.outro, cta: e.target.value })} className={field} />
            </label>
            <label className="block text-[13px] text-muted">
              Length: {draft.outro.duration.toFixed(1)} s
              <input type="range" min={1} max={6} step={0.5} value={draft.outro.duration} disabled={!draft.outro.enabled}
                onChange={(e) => set("outro", { ...draft.outro, duration: Number(e.target.value) })} className="mt-1 block w-full accent-[var(--accent)]" />
            </label>
          </div>
        </section>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <button type="button" onClick={save} disabled={!dirty || saving || !draft.name.trim()}
              className="rounded-[4px] bg-accent px-4 py-2 font-semibold text-accent-ink hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Saving…" : "Save kit"}
            </button>
            {dirty && <button type="button" onClick={() => setDraft(structuredClone(active!))} className="text-[14px] text-muted hover:text-ink">Discard changes</button>}
            <button type="button" onClick={create} className="inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-ink">
              <Plus size={14} aria-hidden /> New kit
            </button>
            <button type="button" onClick={remove} className="ml-auto inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-danger">
              <Trash2 size={14} aria-hidden /> Delete kit
            </button>
          </div>
        )}
        {status && <p role="status" className={`text-[13px] ${status.kind === "error" ? "text-danger" : "text-success"}`}>{status.text}</p>}
        {!canEdit && <p className="text-[13px] text-muted">Viewers can see the kit; editors and admins can change it.</p>}
      </fieldset>
      <BrandPreview kit={draft} />
    </div>
  );
}
