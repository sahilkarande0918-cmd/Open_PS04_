"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { AudioLines, Code2 } from "lucide-react";
import { apiFetch, useBackend } from "@/lib/backend";
import { createClient } from "@/lib/supabase/client";

/** Only finished, authorized renders are used as project artwork. */
export function ProjectPreview({ projectId, mode }: { projectId: string; mode: string }) {
  const backend = useBackend();
  const base = backend.data?.state === "online" ? backend.data.url : null;
  const thumbnail = useQuery<string | null>({
    queryKey: ["project-thumbnail", projectId, base],
    enabled: !!base,
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await createClient().from("render_jobs").select("id").eq("project_id", projectId).eq("status", "ready").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const response = await apiFetch(base!, `/renders/${data.id}/urls`);
      if (!response.ok) throw new Error("Preview is unavailable");
      const urls = await response.json();
      return `${base!.replace(/\/$/, "")}${urls.thumb}`;
    },
  });
  return <div className="relative flex h-36 items-center justify-between overflow-hidden bg-surface-2 px-5">
    <div><span className="studio-eyebrow">{mode === "topic" ? "Topic studio" : "Recording studio"}</span><p className="mt-2 max-w-[18ch] text-[12px] leading-5 text-muted">{mode === "topic" ? "Script · Voice · Code" : "Transcript · Highlights · Reels"}</p>{thumbnail.data && <span className="studio-pill mt-3 !bg-surface">Latest export</span>}</div>
    {thumbnail.data ? <div className="relative h-full w-24 shrink-0"><Image src={thumbnail.data} alt="Latest rendered reel" fill sizes="96px" unoptimized className="object-cover object-center" /></div> : mode === "topic" ? <Code2 size={40} strokeWidth={1} className="shrink-0 text-accent" aria-hidden /> : <AudioLines size={40} strokeWidth={1} className="shrink-0 text-accent" aria-hidden />}
  </div>;
}
