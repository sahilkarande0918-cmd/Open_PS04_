import Link from "next/link";
import { Plus } from "lucide-react";
import { BackendBadge } from "@/components/app/backend-badge";
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
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-[var(--bg)]/85 px-4 backdrop-blur sm:px-6 lg:px-8">
            <span className="truncate text-[13px] text-muted">Workspace<span className="mx-2 text-line">/</span><span className="font-semibold text-ink">{org.name}</span></span>
            <div className="flex items-center gap-3">
              <BackendBadge />
              {org.role !== "viewer" && <Link href="/projects#new-project" className="studio-button !py-2"><Plus size={15} aria-hidden /><span className="hidden sm:inline">New project</span></Link>}
            </div>
          </header>
          <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
