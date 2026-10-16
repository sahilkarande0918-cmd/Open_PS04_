"use client";

import { BookA, FolderKanban, LayoutDashboard, LogOut, Palette, Aperture, Plus, ArrowUpRight, CalendarDays, ChartNoAxesCombined } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { switchWorkspace } from "@/app/onboarding/actions";
import type { Org } from "@/lib/supabase/server";
import { BackendBadge } from "./backend-badge";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "All projects", icon: FolderKanban },
  { href: "/publishing", label: "Publishing", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/brand", label: "Brand kit", icon: Palette },
  { href: "/glossary", label: "Technical glossary", icon: BookA },
];

export function Sidebar({ orgs, org, email }: { orgs: Org[]; org: Org; email: string }) {
  const path = usePathname();
  return (
    <aside className="studio-rail flex w-full shrink-0 flex-col gap-5 p-4 md:sticky md:top-0 md:h-svh md:w-[224px] md:gap-7 md:overflow-y-auto md:p-5">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-1 py-1 text-[19px] font-semibold tracking-[-.04em]">
        <Aperture size={27} strokeWidth={1.5} aria-hidden /> Reel Studio<span className="text-[var(--rail-muted)]">.</span>
      </Link>
      <form action={switchWorkspace}>
        <label className="text-[10px] font-semibold uppercase tracking-[.15em] text-muted" htmlFor="org-switch">Your workspace</label>
        <select id="org-switch" name="org" defaultValue={org.id} onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="mt-2 w-full rounded-lg px-3 py-3 text-[13px]">
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <Link href="/onboarding" className="mt-2 flex items-center gap-1 text-[11px] text-muted hover:underline"><Plus size={12} aria-hidden /> New workspace</Link>
      </form>
      {org.role !== "viewer" && <Link href="/projects#new-project" className="hidden items-center justify-center gap-2 rounded-lg border border-[var(--rail-muted)] px-3 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[var(--rail-active)] md:flex"><Plus size={16} aria-hidden /> Create a project</Link>}
      <nav aria-label="Workspace navigation" className="grid grid-cols-2 gap-1 md:flex md:flex-col">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-[13px] transition-colors ${active ? "bg-[var(--rail-active)] text-[var(--rail-ink)]" : "text-[var(--rail-muted)] hover:bg-[var(--rail-active)] hover:text-[var(--rail-ink)]"}`}>
            <Icon size={17} strokeWidth={1.7} aria-hidden />{label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current" />}
          </Link>;
        })}
      </nav>
      <div className="mt-auto space-y-5 border-t border-[var(--rail-active)] pt-5">
        <div className="hidden md:block"><BackendBadge /></div>
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--rail-active)] text-[12px] font-semibold">{email.slice(0, 1).toUpperCase()}</span>
          <div className="min-w-0 flex-1"><span className="block truncate text-[12px]">{email}</span><span className="text-[10px] capitalize text-muted">{org.role}</span></div>
          <form action={signOut}><button type="submit" aria-label="Sign out" title="Sign out" className="p-2 text-muted hover:text-[var(--rail-ink)]"><LogOut size={15} aria-hidden /></button></form>
        </div>
        <Link href="/" className="hidden items-center justify-between text-[11px] text-muted hover:underline md:flex">About Reel Studio<ArrowUpRight size={13} aria-hidden /></Link>
      </div>
    </aside>
  );
}
