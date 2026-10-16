"use client";

import { BookA, FolderKanban, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { switchWorkspace } from "@/app/onboarding/actions";
import type { Org } from "@/lib/supabase/server";
import { BackendBadge } from "./backend-badge";

// Pages are added here as they are built; nothing links to an unbuilt screen.
const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/glossary", label: "Glossary", icon: BookA },
];

export function Sidebar({ orgs, org, email }: { orgs: Org[]; org: Org; email: string }) {
  const path = usePathname();
  return (
    <aside className="flex w-full flex-col gap-6 bg-surface p-4 md:sticky md:top-0 md:h-svh md:w-60">
      <Link href="/dashboard" className="px-2 text-[16px] font-semibold">
        Reel Studio
      </Link>
      <form action={switchWorkspace}>
        <label className="block px-2 text-[12px] text-muted" htmlFor="org-switch">
          Workspace
        </label>
        <select
          id="org-switch"
          name="org"
          defaultValue={org.id}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="mt-1 w-full rounded-[4px] bg-surface-2 px-2 py-2 text-[14px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <Link href="/onboarding" className="mt-1.5 block px-2 text-[13px] text-muted hover:text-ink">
          New workspace
        </Link>
      </form>
      <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-[4px] px-2 py-2 text-[14px] transition-colors ${
                active ? "bg-surface-3 text-ink" : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <Icon size={16} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-4 px-2">
        <BackendBadge />
        <div className="text-[13px] text-muted">
          <span className="block truncate">{email}</span>
          <form action={signOut}>
            <button type="submit" className="mt-1 flex items-center gap-1.5 text-ink hover:text-accent">
              <LogOut size={14} aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
