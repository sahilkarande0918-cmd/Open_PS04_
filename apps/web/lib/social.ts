"use client";

import { apiFetch } from "@/lib/backend";

export type Platform = "instagram" | "youtube";
export type SocialAccount = {
  id: string;
  platform: Platform;
  username: string;
  status: string;
  expires_at: string | null;
};
export type SocialConfig = Record<Platform, { configured: boolean; missing: string[]; redirect_uri: string | null }>;
export type PublishExport = {
  id: string;
  project_id?: string;
  project_name?: string;
  title?: string;
  duration_s: number | null;
  created_at: string;
};
export type PublishJob = {
  id: string;
  render_id: string;
  account_id: string;
  platform?: Platform;
  caption: string;
  scheduled_at: string | null;
  status: string;
  error: string | null;
  created_at: string;
  platform_post_id?: string | null;
  platform_url?: string | null;
};
export type InsightMetric = {
  name: string;
  value: number | null;
  title?: string;
  description?: string;
  period?: string;
  as_of?: string;
};
export type AccountInsights = {
  metrics: InsightMetric[];
  unavailable: string[];
  updated_at: string | null;
};

/** Keep platform credentials on the API; the browser only sends its Supabase session. */
export async function socialRequest<T>(base: string, path: string, body?: unknown): Promise<T> {
  const response = await apiFetch(base, path, body === undefined ? undefined : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(typeof result?.detail === "string" ? result.detail : `The request failed (${response.status}). Please try again.`);
  }
  if (result === null) throw new Error("The processing backend returned an invalid response.");
  return result as T;
}

export function platformName(platform: string) {
  return platform === "instagram" ? "Instagram" : platform === "youtube" ? "YouTube" : platform;
}

export function accountReady(account: SocialAccount) {
  return ["active", "connected"].includes(account.status) && (!account.expires_at || new Date(account.expires_at).getTime() > Date.now());
}
