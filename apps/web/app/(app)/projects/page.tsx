import { requireOrg } from "@/lib/supabase/server";
import { NewProjectForm } from "./new-project-form";

const MODE = { recording: "Recording → Reels", topic: "Topic → Video" } as const;

export default async function ProjectsPage() {
  const { supabase, org } = await requireOrg();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, mode, status, updated_at")
    .eq("organization_id", org.id)
    .order("updated_at", { ascending: false });
  return (
    <div className="max-w-[960px] space-y-8">
      <h1 className="text-[28px] tracking-[-0.02em]">Projects</h1>
      {org.role !== "viewer" && <NewProjectForm />}
      {error && <p className="text-danger">{error.message}</p>}
      {projects && projects.length === 0 && (
        <p className="text-[15px] text-muted">No projects in {org.name} yet. Create one above.</p>
      )}
      {projects && projects.length > 0 && (
        <table className="w-full text-left text-[14px]">
          <thead className="text-[13px] text-muted">
            <tr>
              <th className="pb-2 font-normal">Name</th>
              <th className="pb-2 font-normal">Mode</th>
              <th className="pb-2 font-normal">Status</th>
              <th className="pb-2 text-right font-normal">Updated</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="py-2.5">{p.name}</td>
                <td className="text-muted">{MODE[p.mode as keyof typeof MODE]}</td>
                <td className="text-muted">{p.status}</td>
                <td className="text-right tabular-nums text-muted">{new Date(p.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
