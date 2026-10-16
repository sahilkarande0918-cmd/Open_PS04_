"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, ChartNoAxesCombined, LoaderCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useBackend } from "@/lib/backend";
import { createClient } from "@/lib/supabase/client";
import { platformName, socialRequest, type AccountInsights, type SocialAccount } from "@/lib/social";

const METRIC_NAMES: Record<string, string> = {
  views: "Views", reach: "Accounts reached", impressions: "Impressions", likes: "Likes", comments: "Comments", shares: "Shares", saved: "Saves", saves: "Saves", total_interactions: "Total interactions", accounts_engaged: "Accounts engaged", follower_count: "Followers", follows_and_unfollows: "Follows & unfollows", profile_views: "Profile views", plays: "Plays", ig_reels_video_view_total_time: "Total watch time", ig_reels_avg_watch_time: "Average watch time",
};
type RefreshJob = { status: string; error: string | null; progress: number; current_stage: string | null };

export function AnalyticsStudio({ organizationId, canEdit }: { organizationId: string; canEdit: boolean }) {
  const backend = useBackend();
  const base = backend.data?.state === "online" ? backend.data.url : null;
  const qc = useQueryClient();
  const [accountId, setAccountId] = useState("");
  const [refreshJobs, setRefreshJobs] = useState<Record<string, string>>({});
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accounts = useQuery({ queryKey: ["social-accounts", organizationId, base], enabled: !!base, queryFn: () => socialRequest<SocialAccount[]>(base!, `/social/accounts?organization_id=${encodeURIComponent(organizationId)}`) });
  const selected = accounts.data?.find((a) => a.id === accountId) ?? accounts.data?.[0];
  const insights = useQuery({ queryKey: ["social-insights", selected?.id, base], enabled: !!base && !!selected, queryFn: () => socialRequest<AccountInsights>(base!, `/social/accounts/${selected!.id}/insights`) });
  const jobId = selected ? refreshJobs[selected.id] : undefined;
  const job = useQuery<RefreshJob>({
    queryKey: ["insights-job", jobId], enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await createClient().from("jobs").select("status,error,progress,current_stage").eq("id", jobId!).single();
      if (error) throw error;
      return data as RefreshJob;
    },
    refetchInterval: (q) => ["succeeded", "failed", "cancelled"].includes(q.state.data?.status ?? "") ? false : 3000,
  });
  useEffect(() => {
    if (job.data?.status === "succeeded" && selected) qc.invalidateQueries({ queryKey: ["social-insights", selected.id] });
  }, [job.data?.status, selected, qc]);
  const running = requesting || (!!jobId && (!job.data || ["queued", "running"].includes(job.data.status)));

  async function refresh() {
    if (!base || !selected || !canEdit || running) return;
    const id = selected.id;
    setError(null); setRequesting(true);
    try {
      const result = await socialRequest<{ job_id: string }>(base, `/social/accounts/${id}/insights`, {});
      if (!result.job_id) throw new Error("The backend did not return a metrics refresh job.");
      setRefreshJobs((previous) => ({ ...previous, [id]: result.job_id }));
    } catch (e) { setError(e instanceof Error ? e.message : "Metrics refresh could not start."); }
    finally { setRequesting(false); }
  }
  const metrics = insights.data?.metrics ?? [];

  return <div className="space-y-7">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="studio-eyebrow mb-2">Learn from what you share</p><h1 className="studio-heading">Performance</h1><p className="mt-2 text-[14px] text-muted">Actual metrics from your connected accounts, with their limits in view.</p></div><Link href="/publishing" className="studio-button studio-button-secondary">Manage accounts<ArrowUpRight size={14} aria-hidden /></Link></header>
    {!base && <div className="studio-panel p-4 text-[13px] text-muted">{backend.isLoading ? "Connecting to the processing machine…" : "The processing machine is offline. Connect it to load or refresh platform metrics."}</div>}
    {accounts.error && <p role="alert" className="text-[13px] text-danger">Accounts could not load: {accounts.error.message}</p>}
    {accounts.data?.length === 0 ? <section className="studio-panel p-8 sm:p-12"><ChartNoAxesCombined size={34} strokeWidth={1.3} className="mb-6 text-accent" aria-hidden /><h2 className="text-[23px] font-semibold tracking-[-.03em]">Your work needs an audience first.</h2><p className="mt-3 max-w-[55ch] text-[14px] leading-7 text-muted">Connect an account and publish a reel. Available platform metrics will appear here after a refresh.</p><Link href="/publishing" className="studio-button mt-6">Connect an account</Link></section> : <>
      <section className="studio-panel flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6"><label className="studio-label min-w-0 flex-1 sm:max-w-[360px]">Account<select className="studio-input" value={selected?.id ?? ""} onChange={(e) => { setAccountId(e.target.value); setError(null); }} disabled={!accounts.data?.length}><option value="" disabled>Select an account</option>{accounts.data?.map((a) => <option key={a.id} value={a.id}>{platformName(a.platform)} · {a.username}</option>)}</select></label><div className="flex flex-wrap items-center gap-4"><span className="text-[11px] text-muted">{insights.data?.updated_at ? `Updated ${new Date(insights.data.updated_at).toLocaleString()}` : "No refresh recorded"}</span>{canEdit && <button type="button" disabled={!base || !selected || running} onClick={refresh} className="studio-button">{running ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : <RefreshCw size={14} aria-hidden />}{running ? "Refreshing metrics…" : "Refresh from platform"}</button>}</div></section>
      {running && <div className="studio-panel p-4 text-[13px] text-muted" role="status">{job.data?.current_stage?.replaceAll("_", " ") || "Metrics refresh is queued on the processing machine."}{job.data && <progress aria-label="Metrics refresh progress" value={job.data.progress} max={1} className="mt-3 block h-2 w-full" />}</div>}
      {(error || insights.error || job.error || job.data?.error) && <p role="alert" className="text-[13px] leading-6 text-danger">{error || insights.error?.message || job.error?.message || job.data?.error}</p>}
      {metrics.length ? <section aria-label="Platform metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map((metric, i) => <article key={`${metric.name}-${metric.period}-${i}`} className="studio-panel p-5"><h2 className="text-[12px] font-semibold text-muted">{metric.title || METRIC_NAMES[metric.name] || metric.name.replaceAll("_", " ")}</h2><p className="mt-4 text-[34px] leading-none tracking-[-.04em] tabular-nums">{typeof metric.value === "number" && Number.isFinite(metric.value) ? metric.value.toLocaleString() : "—"}</p><p className="mt-3 text-[11px] text-muted">{metric.period ? metric.period.replaceAll("_", " ") : "Platform reporting period"}{metric.as_of ? ` · ${new Date(metric.as_of).toLocaleDateString()}` : ""}</p>{metric.description && <p className="mt-3 text-[12px] leading-6 text-muted">{metric.description}</p>}</article>)}</section> : selected && <section className="studio-panel p-8"><ChartNoAxesCombined size={28} strokeWidth={1.4} className="mb-4 text-accent" aria-hidden /><h2 className="text-[18px] font-semibold">No metrics to show yet.</h2><p className="mt-2 text-[13px] leading-6 text-muted">{insights.isFetching ? "Loading the saved platform response…" : "Refresh this account to request its available metrics. Empty or unavailable results are not counted as zero."}</p></section>}
      {!!insights.data?.unavailable.length && <section className="studio-panel p-5 sm:p-6"><h2 className="text-[15px] font-semibold">Metrics the platform did not provide</h2><ul className="mt-3 list-inside list-disc space-y-2 text-[13px] leading-6 text-muted">{insights.data.unavailable.map((reason, i) => <li key={i}>{reason}</li>)}</ul></section>}
      {selected && <p className="max-w-[85ch] text-[12px] leading-6 text-muted">Source: {platformName(selected.platform)} for {selected.username}. Availability depends on account eligibility, granted permissions and the platform’s reporting window. Ranking feedback is not applied automatically from this view.</p>}
    </>}
  </div>;
}
