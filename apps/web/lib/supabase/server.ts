import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: proxy.ts refreshes the session instead.
        }
      },
    },
  });
}

/** Verified current user (claims checked against the project's signing keys) or redirect to /login. */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");
  return { supabase, userId: data.claims.sub as string, email: (data.claims.email as string) ?? "" };
});

export const ORG_COOKIE = "rs_org";

export type Org = { id: string; name: string; slug: string; role: "owner" | "admin" | "editor" | "viewer" };

/** Workspaces the user belongs to and the active one (cookie, else first). Redirects to onboarding if none. */
export const requireOrg = cache(async () => {
  const { supabase, userId, email } = await requireUser();
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name, slug)")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw new Error(error.message);
  const orgs: Org[] = (data ?? []).flatMap((m) => {
    const o = m.organizations as unknown as { id: string; name: string; slug: string } | null;
    return o ? [{ ...o, role: m.role as Org["role"] }] : [];
  });
  if (orgs.length === 0) redirect("/onboarding");
  const wanted = (await cookies()).get(ORG_COOKIE)?.value;
  const org = orgs.find((o) => o.id === wanted) ?? orgs[0];
  return { supabase, userId, email, orgs, org };
});
