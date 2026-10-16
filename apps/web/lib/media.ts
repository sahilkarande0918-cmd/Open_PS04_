"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch, useBackend } from "@/lib/backend";

/** Short-lived signed playback URL for a recording on the processing backend. */
export function useMediaUrl(recordingId: string) {
  const backend = useBackend();
  const base = backend.data?.state === "online" ? backend.data.url : null;
  const q = useQuery({
    queryKey: ["media", recordingId, base],
    enabled: !!base,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const r = await apiFetch(base!, `/recordings/${recordingId}/media-url`);
      if (!r.ok) throw new Error("media link refused");
      return `${base!.replace(/\/$/, "")}${(await r.json()).path}`;
    },
  });
  return { url: q.data, base, offline: !base && !backend.isLoading };
}
