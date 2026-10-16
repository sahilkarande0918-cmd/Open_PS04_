import Link from "next/link";
import { ArrowRight, AudioLines, Code2, Film, FolderOpen, Plus, Users, Workflow } from "lucide-react";
import { ProjectPreview } from "@/components/app/project-preview";
import { requireOrg } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { supabase, org } = await requireOrg();
  const [projects, members, activeJobs, renders, activity] = await Promise.all([
    supabase.from("projects").select("id, name, mode, status, updated_at", { count: "exact" }).eq("organization_id", org.id).order("updated_at", { ascending: false }).limit(4),
    supabase.from("organization_members").select("user_id", { count: "exact", head: true }).eq("organization_id", org.id),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("organization_id", org.id).in("status", ["queued", "running"]),
    supabase.from("render_jobs").select("id", { count: "exact", head: true }).eq("organization_id", org.id).eq("status", "ready"),
    supabase.from("jobs").select("id, project_id, job_type, status, current_stage, progress, created_at").eq("organization_id", org.id).order("created_at", { ascending: false }).limit(6),
  ]);
  const stats = [
    { label: "Projects", result: projects, icon: FolderOpen },
    { label: "Ready exports", result: renders, icon: Film },
    { label: "Processing jobs", result: activeJobs, icon: Workflow },
    { label: "Workspace members", result: members, icon: Users },
  ];
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="studio-eyebrow mb-2">Your production desk</p><h1 className="studio-heading">Make the lesson last.</h1><p className="mt-2 text-[14px] text-muted">Pick up a project, or turn your next idea into a reel.</p></div>
        {org.role !== "viewer" && <Link href="/projects#new-project" className="studio-button"><Plus size={16} aria-hidden /> New project</Link>}
      </div>
      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ label, result, icon: Icon }) => <div key={label} className="studio-panel flex items-start justify-between p-4 sm:p-5"><div><dt className="text-[12px] text-muted">{label}</dt><dd className="mt-3 text-[32px] leading-none tracking-[-.04em] tabular-nums">{result.error ? "—" : result.count ?? 0}</dd>{result.error && <p className="mt-2 text-[11px] text-danger">Could not load</p>}</div><Icon size={19} className="text-accent" strokeWidth={1.5} aria-hidden /></div>)}
      </dl>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-[18px] font-semibold tracking-[-.025em]">Recent projects</h2><Link href="/projects" className="flex items-center gap-1 text-[12px] text-muted hover:text-accent">View all <ArrowRight size={14} aria-hidden /></Link></div>
          {projects.error ? <div role="alert" className="studio-panel p-6 text-[14px] text-danger">Projects could not load: {projects.error.message}</div> : !projects.data?.length ? <div className="studio-panel px-6 py-12"><FolderOpen size={30} className="mb-5 text-accent" aria-hidden /><h3 className="text-[20px] font-semibold">Room for your first lesson.</h3><p className="mt-2 max-w-[40ch] text-[14px] leading-6 text-muted">Start with a class recording or a topic. Your scripts, clips and finished exports stay together here.</p><Link href="/projects#new-project" className="studio-button mt-6">Create a project <ArrowRight size={15} aria-hidden /></Link></div> : <div className="grid gap-4 sm:grid-cols-2">
            {projects.data.map((p) => <Link href={`/projects/${p.id}`} key={p.id} className="studio-panel group block overflow-hidden transition-colors hover:border-accent"><ProjectPreview projectId={p.id} mode={p.mode} /><div className="p-5"><h3 className="truncate text-[16px] font-semibold group-hover:text-accent">{p.name}</h3><div className="mt-4 flex flex-wrap items-center justify-between gap-2"><span className="studio-pill">{p.status}</span><time className="text-[11px] text-muted" dateTime={p.updated_at}>{new Date(p.updated_at).toLocaleDateString("en", { month: "short", day: "numeric" })}</time></div></div></Link>)}
          </div>}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/projects?mode=recording#new-project" className="flex items-center gap-3 rounded-xl border border-line p-4 transition-colors hover:bg-surface"><AudioLines size={22} className="shrink-0 text-accent" aria-hidden /><div><h3 className="text-[13px] font-semibold">Recording → Reels</h3><p className="mt-1 text-[12px] text-muted">Find the teachable moments.</p></div><ArrowRight size={15} className="ml-auto shrink-0 text-muted" aria-hidden /></Link>
            <Link href="/projects?mode=topic#new-project" className="flex items-center gap-3 rounded-xl border border-line p-4 transition-colors hover:bg-surface"><Code2 size={22} className="shrink-0 text-accent" aria-hidden /><div><h3 className="text-[13px] font-semibold">Topic → Video</h3><p className="mt-1 text-[12px] text-muted">An idea, explained in a minute.</p></div><ArrowRight size={15} className="ml-auto shrink-0 text-muted" aria-hidden /></Link>
          </div>
        </section>
        <section className="studio-panel self-start p-5"><h2 className="text-[16px] font-semibold">Production activity</h2><p className="mt-1 text-[12px] text-muted">Latest jobs in this workspace</p>
          {activity.error ? <p role="alert" className="mt-5 text-[13px] text-danger">Activity could not load.</p> : !activity.data?.length ? <p className="py-8 text-[13px] leading-6 text-muted">No processing jobs yet. Upload a recording or generate your first topic video to get started.</p> : <ul className="mt-4 divide-y divide-line">{activity.data.map((job) => <li key={job.id} className="py-4"><Link href={job.job_type === "insights" ? "/analytics" : job.job_type === "publish" ? "/publishing" : job.project_id ? `/projects/${job.project_id}` : "/projects"} className="flex items-center justify-between gap-2 text-[13px] font-semibold hover:text-accent"><span className="capitalize">{job.job_type.replaceAll("_", " ")}</span><span className={`text-[11px] font-normal ${job.status === "failed" ? "text-danger" : "text-muted"}`}>{job.status}</span></Link><p className="mt-1 text-[11px] text-muted">{job.current_stage?.replaceAll("_", " ") || "Waiting for worker"}</p>{["queued", "running"].includes(job.status) && <progress aria-label={`${job.job_type} progress`} value={job.progress} max={1} className="mt-2 h-1.5 w-full" />}</li>)}</ul>}
        </section>
      </div>
    </div>
  );
}
