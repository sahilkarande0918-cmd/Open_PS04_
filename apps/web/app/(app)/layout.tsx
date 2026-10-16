import { Providers } from "@/components/app/providers";
import { Sidebar } from "@/components/app/sidebar";
import { requireOrg } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { orgs, org, email } = await requireOrg();
  return (
    <Providers>
      <div className="studio-app flex min-h-svh flex-col md:flex-row">
        <Sidebar orgs={orgs} org={org} email={email} />
        <div className="min-w-0 flex-1">
          <header className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-5 py-3 md:px-8">
            <span className="text-[13px] text-muted">Workspace <span className="mx-2 text-line">/</span> <span className="font-semibold text-ink">{org.name}</span></span>
            <span className="studio-pill">{org.role}</span>
          </header>
          <main className="mx-auto max-w-[1680px] px-4 py-7 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
