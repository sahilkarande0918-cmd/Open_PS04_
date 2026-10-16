import { Code2 } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { ProjectGrid } from "@/components/app/project-grid";
import { requireOrg } from "@/lib/supabase/server";
import { TopicStart } from "./topic-start";

export default async function TopicsPage() {
  const { supabase, org } = await requireOrg();
  const { data, error } = await supabase.from("projects").select("id, name, mode, status, updated_at").eq("organization_id", org.id).eq("mode", "topic").order("updated_at", { ascending: false });
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Topic → Video" title="Topic Studio">Describe a concept. A local AI writes the script and code, records the voiceover and renders a captioned 9:16 video.</PageHeader>
      {org.role !== "viewer" && <TopicStart />}
      <section>
        <h2 className="mb-4 text-[17px] font-semibold tracking-[-.02em]">Your topic videos</h2>
        {error && <p role="alert" className="text-danger">Topic videos could not load. Refresh to try again.</p>}
        {data && (data.length ? <ProjectGrid projects={data} /> : <EmptyState icon={<Code2 size={26} aria-hidden />} title="No topic videos yet">Type a topic above to create your first explainer.</EmptyState>)}
      </section>
    </div>
  );
}
