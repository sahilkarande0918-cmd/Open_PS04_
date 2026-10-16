import { Providers } from "@/components/app/providers";
import { Sidebar } from "@/components/app/sidebar";
import { requireOrg } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { orgs, org, email } = await requireOrg();
  return (
    <Providers>
      <div className="flex min-h-svh flex-col md:flex-row">
        <Sidebar orgs={orgs} org={org} email={email} />
        <main className="min-w-0 flex-1 px-5 py-8 md:px-10">{children}</main>
      </div>
    </Providers>
  );
}
