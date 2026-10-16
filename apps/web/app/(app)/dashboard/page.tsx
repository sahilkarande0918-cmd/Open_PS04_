import Link from "next/link";
import { requireOrg } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { supabase, org, email } = await requireOrg();
  const [projects, members, jobs] = await Promise.all([
    supabase.from("projects").select("id, name, mode, updated_at", { count: "exact" }).eq("organization_id", org.id).order("updated_at", { ascending: false }).limit(5),
    supabase.from("organization_members").select("user_id", { count: "exact", head: true }).eq("organization_id", org.id),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("organization_id", org.id).in("status", ["queued", "running"]),
  ]);
  const stats = [
    ["Projects", projects.count ?? 0],
    ["Members", members.count ?? 0],
    ["Jobs running or queued", jobs.count ?? 0],
  ] as const;
  return (
    <div className="max-w-[960px] space-y-10">
      <div>
        <h1 className="text-[28px] tracking-[-0.02em]">{org.name}</h1>
        <p className="mt-1 text-[15px] text-muted">
          Signed in as {email} · {org.role}
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-[6px] bg-surface p-4">
            <dt className="text-[13px] text-muted">{label}</dt>
            <dd className="mt-1 text-[28px] tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[18px]">Recent projects</h2>
          <Link href="/projects" className="text-[14px] text-muted hover:text-ink">
            All projects
          </Link>
        </div>
        {(projects.data ?? []).length === 0 ? (
          <p className="text-[15px] text-muted">
            Nothing yet.{" "}
            <Link href="/projects" className="text-ink underline underline-offset-4 hover:text-accent">
              Create your first project
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {projects.data!.map((p) => (
              <li key={p.id} className="flex justify-between py-2.5 text-[14px]">
                <span>{p.name}</span>
                <span className="text-muted">{p.mode === "recording" ? "Recording → Reels" : "Topic → Video"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
