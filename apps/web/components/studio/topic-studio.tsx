"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Code2, Download, Film, LoaderCircle, Mic, RefreshCw } from "lucide-react";
import { useState } from "react";
import { apiErrorMessage, apiFetch, useBackend } from "@/lib/backend";
import { useProjectJobs } from "@/lib/realtime";
import { createClient } from "@/lib/supabase/client";

type Scene = { title: string; narration: string; code: string; code_language: string };
type Generation = { id: string; status: string; topic: string; storyboard: { title: string; scenes: Scene[] } | null; render_id: string | null; job_id: string | null; error: string | null; created_at: string };
const STAGES: Record<string, string> = { queued: "Waiting for the processing machine", storyboard: "Writing the script and storyboard", script: "Writing your script", validate_code: "Checking the code examples", tts: "Recording the narration locally", narration: "Recording the narration locally", align: "Synchronizing captions", timeline: "Building the video timeline", render: "Rendering your video", done: "Generation complete" };

async function responseJson(r: Response) {
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(apiErrorMessage(body, r.status));
  if (body === null) throw new Error("The processing backend returned an invalid response.");
  return body;
}

export function TopicStudio({ projectId, canEdit }: { projectId: string; canEdit: boolean }) {
  const backend = useBackend();
  const base = backend.data?.state === "online" ? backend.data.url : null;
  const qc = useQueryClient();
  const jobs = useProjectJobs(projectId);
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const generations = useQuery<Generation[]>({
    queryKey: ["generations", projectId, base], enabled: !!base,
    queryFn: async () => responseJson(await apiFetch(base!, `/projects/${projectId}/generations`)),
    refetchInterval: 4000,
  });
  const kits = useQuery({
    queryKey: ["brand-kit-names", projectId],
    queryFn: async () => {
      const sb = createClient();
      const { data: project, error: pe } = await sb.from("projects").select("organization_id").eq("id", projectId).single();
      if (pe) throw pe;
      const { data, error } = await sb.from("brand_kits").select("id, name, is_default").eq("organization_id", project.organization_id).order("created_at");
      if (error) throw error;
      return data as { id: string; name: string; is_default: boolean }[];
    }, staleTime: 60_000,
  });
  const latest = generations.data?.find((g) => g.id === selectedId) ?? generations.data?.[0];
  const job = jobs.data?.find((j) => j.id === latest?.job_id);
  const busy = submitting || !!generations.data?.some((g) => !["ready", "failed", "cancelled", "succeeded"].includes(g.status));
  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!base || !canEdit) return;
    const values = new FormData(event.currentTarget);
    setError(null); setSubmitting(true);
    try {
      const result = await responseJson(await apiFetch(base, `/projects/${projectId}/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), audience: values.get("audience"), language: "en", tone: values.get("tone"), difficulty: values.get("difficulty"), voice: values.get("voice"), duration_s: Number(values.get("duration_s")), quality: values.get("quality"), brand_kit_id: values.get("brand_kit_id") || null }),
      }));
      setSelectedId(result.generation_id);
      await Promise.all([qc.invalidateQueries({ queryKey: ["generations", projectId] }), qc.invalidateQueries({ queryKey: ["jobs", projectId] })]);
    } catch (e) { setError(e instanceof Error ? e.message : "Generation request failed."); }
    finally { setSubmitting(false); }
  }
  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.7fr)]">
        <form onSubmit={generate} className="studio-panel p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-3"><div><p className="studio-eyebrow mb-2">01 / The idea</p><h2 className="text-[21px] font-semibold tracking-[-.03em]">What are we explaining?</h2></div><Code2 size={24} strokeWidth={1.5} className="text-accent" aria-hidden /></div>
          <fieldset disabled={!canEdit || submitting} className="space-y-5 disabled:opacity-70">
            <label className="studio-label">Topic & direction<textarea value={topic} onChange={(e) => setTopic(e.target.value)} name="topic" minLength={3} maxLength={500} required rows={4} placeholder="Explain JSON vs XML with a simple example. Show how the same data looks in both formats." className="studio-input resize-y !text-[16px] !leading-7" /></label>
            <div className="flex flex-wrap gap-2">{["JSON vs XML", "Python lists vs tuples", "How HTTP requests work"].map((example) => <button key={example} type="button" onClick={() => setTopic(example)} className="rounded-full border border-line px-3 py-1.5 text-[11px] text-muted transition-colors hover:border-accent hover:text-accent">{example}</button>)}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="studio-label">Who is it for?<input name="audience" defaultValue="Beginners learning to code" required maxLength={120} className="studio-input" /></label>
              <label className="studio-label">Explanation level<select name="difficulty" className="studio-input"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
              <label className="studio-label">Tone<select name="tone" className="studio-input"><option value="clear">Clear & focused</option><option value="conversational">Conversational</option><option value="energetic">Energetic</option></select></label>
              <label className="studio-label">Narrator · English<select name="voice" className="studio-input"><option value="af_heart">Heart</option><option value="af_bella">Bella</option><option value="am_adam">Adam</option></select></label>
              <label className="studio-label">Target duration<select name="duration_s" defaultValue="45" className="studio-input"><option value="30">30 seconds</option><option value="45">45 seconds</option><option value="60">60 seconds</option></select></label>
              <label className="studio-label">Render quality<select name="quality" defaultValue="looks" className="studio-input"><option value="draft">Draft · faster preview</option><option value="looks">Standard</option><option value="delivery">Delivery · best quality</option></select></label>
              <label className="studio-label sm:col-span-2">Brand kit<select name="brand_kit_id" className="studio-input"><option value="">Workspace default</option>{kits.data?.map((kit) => <option key={kit.id} value={kit.id}>{kit.name}{kit.is_default ? " (default)" : ""}</option>)}<option value="none">No branding</option></select></label>
            </div>
          </fieldset>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5"><span className="flex items-center gap-1.5 text-[11px] text-muted"><Mic size={14} aria-hidden /> Local voiceover · 9:16 video</span>{canEdit && <button type="submit" disabled={!base || generations.isPending || busy || topic.trim().length < 3} className="studio-button">{busy ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Film size={16} aria-hidden />}{busy ? "Generation in progress" : "Generate video"}{!busy && <ArrowRight size={15} aria-hidden />}</button>}</div>
          {!canEdit && <p className="mt-3 text-[12px] text-muted">You have view access. An editor can generate a video.</p>}
          {!base && <p className="mt-3 text-[12px] text-muted">{backend.isLoading ? "Connecting to the processing machine…" : "Generation needs the processing machine online. Your project is saved."}</p>}
          {error && <p role="alert" className="mt-3 text-[13px] text-danger">{error}</p>}
          {kits.error && <p role="alert" className="mt-3 text-[12px] text-danger">Brand kits could not load. You can still use the workspace default.</p>}
        </form>
        <section className="studio-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="text-[14px] font-semibold">Your finished reel</h2><span className="studio-pill">9:16</span></div>
          {latest?.render_id ? <TopicExport renderId={latest.render_id} base={base} /> : <div className="px-7 py-10"><div className="mx-auto flex aspect-[9/16] max-h-[340px] flex-col justify-between rounded-xl bg-[var(--canvas)] p-6 text-[var(--canvas-ink)]"><Code2 size={30} strokeWidth={1.3} aria-hidden /><div><p className="text-[10px] uppercase tracking-[.18em] opacity-65">Preview appears after rendering</p><p className="mt-3 text-[24px] leading-tight tracking-[-.03em]">A small video.<br />A clear idea.</p></div><span className="text-[11px] opacity-65">Script → Voice → Code → Reel</span></div><p className="mx-auto mt-5 max-w-[30ch] text-center text-[12px] leading-5 text-muted">Your generated MP4 will appear here, ready to watch and download.</p></div>}
          {latest && <div className="border-t border-line p-5" aria-live="polite"><div className="flex items-center justify-between gap-3"><span className="text-[13px] font-semibold">{STAGES[job?.current_stage ?? ""] ?? job?.current_stage?.replaceAll("_", " ") ?? latest.status.replaceAll("_", " ")}</span><span className="studio-pill">{latest.status}</span></div>{job && ["queued", "running"].includes(job.status) && <div className="mt-3 flex items-center gap-3"><progress aria-label="Video generation progress" value={job.progress} max={1} className="h-2 flex-1" /><span className="text-[11px] tabular-nums text-muted">{Math.round(job.progress * 100)}%</span></div>}{(latest.error || job?.error) && <p role="alert" className="mt-3 text-[12px] text-danger">{latest.error || job?.error}</p>}</div>}
        </section>
      </div>
      <section className="studio-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="studio-eyebrow mb-2">02 / The story</p><h2 className="text-[21px] font-semibold tracking-[-.03em]">Script & storyboard</h2></div><div className="flex items-center gap-2">{!!generations.data?.length && <label className="text-[12px] text-muted"><span className="sr-only">Generation version</span><select className="studio-input !w-auto" value={latest?.id ?? ""} onChange={(e) => setSelectedId(e.target.value)}>{generations.data.map((g, i) => <option key={g.id} value={g.id}>Version {generations.data!.length - i} · {g.status}</option>)}</select></label>}<button type="button" aria-label="Refresh generations" disabled={!base || generations.isFetching} onClick={() => generations.refetch()} className="rounded-lg border border-line p-2.5 text-muted disabled:opacity-40"><RefreshCw size={16} className={generations.isFetching ? "animate-spin" : ""} aria-hidden /></button></div></div>
        {generations.error && <p role="alert" className="mt-4 text-[13px] text-danger">Could not load generations: {generations.error.message}</p>}
        {latest?.storyboard?.scenes?.length ? <div className="mt-6 space-y-4">{latest.storyboard.scenes.map((scene, i) => <article key={i} className="grid gap-5 border-t border-line pt-5 md:grid-cols-[35px_minmax(0,1fr)_minmax(0,.85fr)]"><span className="text-[13px] tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span><div><h3 className="text-[16px] font-semibold">{scene.title}</h3><p className="mt-2 text-[14px] leading-7 text-muted">{scene.narration}</p></div>{scene.code && <div className="min-w-0 rounded-lg bg-[var(--canvas)] p-4 text-[var(--canvas-ink)]"><span className="text-[10px] uppercase tracking-wider opacity-60">{scene.code_language}</span><pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-6"><code>{scene.code}</code></pre></div>}</article>)}<p className="border-t border-line pt-4 text-[12px] text-muted">Review the generated explanation and code before sharing. Generate another version to change the direction.</p></div> : <div className="mt-5 rounded-xl bg-surface-2 p-6"><p className="text-[14px] font-semibold">Every good reel starts with a story.</p><p className="mt-2 max-w-[65ch] text-[13px] leading-6 text-muted">Generate a video to see the scene-by-scene narration and code examples. The local worker writes the script, validates supported code, synthesizes speech and renders the result.</p></div>}
      </section>
    </div>
  );
}

function TopicExport({ renderId, base }: { renderId: string; base: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const render = useQuery({ queryKey: ["topic-render", renderId], queryFn: async () => {
    const { data, error } = await createClient().from("render_jobs").select("id,status,duration_s,size_bytes,error,job:jobs(progress,current_stage)").eq("id", renderId).single();
    if (error) throw error;
    return data;
  }, refetchInterval: (q) => ["ready", "failed", "cancelled"].includes(q.state.data?.status ?? "") ? false : 3000 });
  const urls = useQuery<{ video: string; thumb: string; download: string }>({ queryKey: ["render-urls", renderId, base], enabled: !!base && render.data?.status === "ready", staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const data = await responseJson(await apiFetch(base!, `/renders/${renderId}/urls`));
      return { video: `${base!.replace(/\/$/, "")}${data.video}`, thumb: `${base!.replace(/\/$/, "")}${data.thumb}`, download: `${base!.replace(/\/$/, "")}${data.download}` };
    },
  });
  async function download(format: "mp4" | "srt" | "vtt") {
    setError(null);
    try {
      const r = format === "mp4" ? await fetch(urls.data!.download, { headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" } }) : await apiFetch(base!, `/renders/${renderId}/captions?format=${format}`);
      if (!r.ok) throw new Error("Download failed. Check the processing machine and try again.");
      const url = URL.createObjectURL(await r.blob());
      const a = Object.assign(document.createElement("a"), { href: url, download: `topic-${renderId.slice(0, 8)}.${format}` });
      a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(e instanceof Error ? e.message : "Download failed."); }
  }
  return <div className="p-5">{urls.data ? <video controls playsInline preload="metadata" src={urls.data.video} poster={urls.data.thumb} className="mx-auto aspect-[9/16] max-h-[440px] w-full rounded-xl bg-[var(--canvas)]" /> : <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl bg-surface-2 p-6 text-center"><Film size={32} strokeWidth={1.3} className="text-accent" aria-hidden /><p className="text-[13px] text-muted">{render.data?.status === "failed" ? render.data.error : !base ? "Connect the processing machine to play this export." : render.data?.status === "ready" ? "Loading your video…" : `Render ${render.data?.status ?? "loading"}…`}</p></div>}{render.data?.status === "ready" && <p className="mt-4 flex items-center gap-2 text-[12px] text-muted"><Check size={14} className="text-success" aria-hidden />{render.data.duration_s?.toFixed(1)} seconds · {((render.data.size_bytes ?? 0) / 1024 ** 2).toFixed(1)} MB</p>}{urls.data && <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="studio-button" onClick={() => download("mp4")}><Download size={15} aria-hidden />Download MP4</button>{(["srt", "vtt"] as const).map((f) => <button key={f} type="button" className="studio-button studio-button-secondary uppercase" onClick={() => download(f)}>{f}</button>)}</div>}{(error || render.error || urls.error) && <p role="alert" className="mt-3 text-[12px] text-danger">{error || render.error?.message || urls.error?.message}</p>}</div>;
}
