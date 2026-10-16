import Link from "next/link";
import { ArrowUpRight, FolderOpen } from "lucide-react";
import { ProjectPreview } from "@/components/app/project-preview";
import { requireOrg } from "@/lib/supabase/server";
import { NewProjectForm } from "./new-project-form";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { supabase, org } = await requireOrg();
  const { mode } = await searchParams;
  const { data: projects, error } = await supabase.from("projects").select("id, name, mode, status, updated_at").eq("organization_id", org.id).order("updated_at", { ascending: false });
  return (
    <div className="space-y-7">
      <div><p className="studio-eyebrow mb-2">The work, all together</p><h1 className="studio-heading">Your projects</h1><p className="mt-2 text-[14px] text-muted">A home for every recording, idea and finished reel.</p></div>
      {org.role !== "viewer" && <NewProjectForm key={mode} mode={mode === "topic" ? "topic" : "recording"} />}
      {error && <p role="alert" className="text-danger">Projects could not load: {error.message}</p>}
      {projects && projects.length === 0 && <div className="studio-panel py-14 text-center"><FolderOpen size={30} className="mx-auto mb-4 text-accent" aria-hidden /><h2 className="text-[18px] font-semibold">Your next lesson starts here.</h2><p className="mt-2 text-[14px] text-muted">{org.role === "viewer" ? "This workspace has no projects yet." : "Name a project above and choose your starting point."}</p></div>}
      {!!projects?.length && <section><div className="mb-4 flex items-center justify-between"><h2 className="text-[17px] font-semibold">Project library</h2><span className="text-[12px] text-muted">{projects.length} projects</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => <Link key={p.id} href={`/projects/${p.id}`} className="studio-panel group overflow-hidden transition-colors hover:border-accent"><ProjectPreview projectId={p.id} mode={p.mode} /><div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="min-w-0 truncate text-[17px] font-semibold tracking-[-.025em] group-hover:text-accent">{p.name}</h3><ArrowUpRight size={16} className="shrink-0 text-muted" aria-hidden /></div><div className="mt-5 flex flex-wrap items-center justify-between gap-2"><span className="studio-pill">{p.status}</span><time dateTime={p.updated_at} className="text-[11px] text-muted">Updated {new Date(p.updated_at).toLocaleDateString("en", { month: "short", day: "numeric" })}</time></div></div></Link>)}
      </div></section>}
    </div>
  );
}
