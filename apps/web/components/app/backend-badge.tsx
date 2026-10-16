"use client";

import { useBackend } from "@/lib/backend";

export function BackendBadge() {
  const { data, isLoading } = useBackend();
  const online = data?.state === "online";
  const label = isLoading ? "Checking processing backend…" : online ? "Processing backend online" : "Processing backend offline";
  return (
    <div className="flex items-start gap-2 text-[13px]" title={data?.state === "offline" ? data.reason : undefined}>
      <span
        aria-hidden
        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isLoading ? "bg-muted" : online ? "bg-success" : "bg-danger"}`}
      />
      <span className="text-muted">
        {label}
        {data?.state === "offline" && <span className="block text-[12px] text-muted/80">{data.reason}</span>}
      </span>
    </div>
  );
}
