"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type BackendStatus =
  | { state: "online"; url: string; capabilities: Record<string, boolean> }
  | { state: "offline"; reason: string };

const STALE_MS = 90_000;

/** Finds the local processing API: explicit env override, else the URL it last heartbeated to Supabase. */
async function discover(): Promise<BackendStatus> {
  let url = process.env.NEXT_PUBLIC_API_URL || "";
  if (!url) {
    const { data, error } = await createClient()
      .from("backend_endpoints")
      .select("url, last_seen_at")
      .eq("id", "primary")
      .maybeSingle();
    if (error) return { state: "offline", reason: error.message };
    if (!data) return { state: "offline", reason: "The processing backend has never connected." };
    if (Date.now() - new Date(data.last_seen_at).getTime() > STALE_MS)
      return { state: "offline", reason: `Last seen ${new Date(data.last_seen_at).toLocaleString()}.` };
    url = data.url;
  }
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return { state: "offline", reason: `Health check returned ${r.status}.` };
    const body = await r.json();
    return { state: "online", url, capabilities: body.capabilities ?? {} };
  } catch {
    return { state: "offline", reason: "Health check did not respond." };
  }
}

export function useBackend() {
  return useQuery({ queryKey: ["backend"], queryFn: discover, refetchInterval: 20_000, staleTime: 0 });
}

/** Authenticated call to the local API. */
export async function apiFetch(base: string, path: string, init: RequestInit = {}) {
  const { data } = await createClient().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${base.replace(/\/$/, "")}${path}`, { ...init, headers });
}
