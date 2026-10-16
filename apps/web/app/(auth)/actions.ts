"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; notice?: string } | undefined;

/** Only same-site relative paths are allowed as post-login destinations. */
function safeNext(v: FormDataEntryValue | null, fallback = "/dashboard") {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : fallback;
}

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const fullName = String(form.get("full_name") ?? "").trim().slice(0, 120);
  if (!email) return { error: "Enter your email." };
  if (password.length < 8) return { error: "Use at least 8 characters for the password." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${site()}/auth/confirm?next=/onboarding` },
  });
  if (error) return { error: error.message };
  if (!data.session) return { notice: `We sent a confirmation link to ${email}. Open it to finish signing up.` };
  redirect("/onboarding");
}

export async function requestReset(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site()}/auth/confirm?next=/reset-password`,
  });
  if (error) return { error: error.message };
  return { notice: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(_: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters for the password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
