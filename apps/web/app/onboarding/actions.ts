"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ORG_COOKIE, requireUser } from "@/lib/supabase/server";

export type OrgFormState = { error?: string } | undefined;

export async function createWorkspace(_: OrgFormState, form: FormData): Promise<OrgFormState> {
  const name = String(form.get("name") ?? "").trim();
  const slug = String(form.get("slug") ?? "")
    .trim()
    .toLowerCase();
  if (name.length < 2) return { error: "Give the workspace a name (2+ characters)." };
  if (!/^[a-z0-9][a-z0-9-]{1,47}$/.test(slug))
    return { error: "The short name may use lowercase letters, digits and hyphens (2–48)." };
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("create_organization", { org_name: name, org_slug: slug });
  if (error) return { error: error.code === "23505" ? "That short name is taken." : error.message };
  (await cookies()).set(ORG_COOKIE, (data as { id: string }).id, { path: "/", sameSite: "lax", httpOnly: true });
  redirect("/dashboard");
}

export async function switchWorkspace(form: FormData) {
  const id = String(form.get("org") ?? "");
  (await cookies()).set(ORG_COOKIE, id, { path: "/", sameSite: "lax", httpOnly: true });
  redirect("/dashboard");
}
