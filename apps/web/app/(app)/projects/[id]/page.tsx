import Link from "next/link";
import { notFound } from "next/navigation";
import { RecordingStudio } from "@/components/studio/recording-studio";
import { TopicStudio } from "@/components/studio/topic-studio";
import { requireOrg } from "@/lib/supabase/server";

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const { supabase, org } = await requireOrg();
  const { data: project } = await supabase.from("projects").select("id, name, mode, status, organization_id").eq("id", id).maybeSingle();
  if (!project || project.organization_id !== org.id) notFound();
  return (
    <div className="max-w-[1280px] space-y-6">
      <div>
        <Link href="/projects" className="text-[13px] text-muted hover:text-ink">
          Projects
        </Link>
        <h1 className="studio-heading mt-2">{project.name}</h1>
        <p className="text-[14px] text-muted">{project.mode === "recording" ? "Recording → Reels" : "Topic → Video"} · {project.status}</p>
      </div>
      {project.mode === "recording" ? (
        <RecordingStudio projectId={project.id} canEdit={org.role !== "viewer"} />
      ) : (
        <TopicStudio projectId={project.id} canEdit={org.role !== "viewer"} />
      )}
    </div>
  );
}
