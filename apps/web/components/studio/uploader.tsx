"use client";

import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { apiFetch, useBackend } from "@/lib/backend";

const ACCEPT = [".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"];
const MAX_BYTES = 4 * 1024 ** 3;
const resumeKey = (projectId: string, f: File) => `rs-upload:${projectId}:${f.name}:${f.size}:${f.lastModified}`;

type State =
  | { phase: "idle" }
  | { phase: "uploading"; name: string; sent: number; total: number; rate: number }
  | { phase: "validating"; name: string }
  | { phase: "error"; message: string };

function fmtBytes(n: number) {
  return n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(2)} GB` : `${(n / 1024 ** 2).toFixed(1)} MB`;
}

export function Uploader({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const backend = useBackend();
  const [state, setState] = useState<State>({ phase: "idle" });
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const online = backend.data?.state === "online";
  const base = backend.data?.state === "online" ? backend.data.url : "";

  async function upload(file: File) {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPT.includes(ext)) return setState({ phase: "error", message: `Unsupported type ${ext}. Use ${ACCEPT.join(", ")}.` });
    if (file.size > MAX_BYTES) return setState({ phase: "error", message: "Files up to 4 GB are supported." });
    try {
      const key = resumeKey(projectId, file);
      let id = localStorage.getItem(key);
      let sent = 0;
      let chunk = 8 * 1024 * 1024; // matches the API's CHUNK_MAX
      if (id) {
        const r = await apiFetch(base, `/recordings/${id}`);
        if (r.ok && (await r.clone().json()).status === "uploading") sent = (await r.json()).received_bytes;
        else id = null;
      }
      if (!id) {
        const r = await apiFetch(base, "/recordings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: projectId, filename: file.name, size_bytes: file.size }),
        });
        if (!r.ok) throw new Error((await r.json()).detail ?? `Upload refused (${r.status})`);
        const body = await r.json();
        id = body.id as string;
        chunk = body.chunk_size;
        localStorage.setItem(key, id);
      }
      const startedAt = performance.now();
      const startSent = sent;
      setState({ phase: "uploading", name: file.name, sent, total: file.size, rate: 0 });
      let failures = 0;
      while (sent < file.size) {
        const r = await apiFetch(base, `/recordings/${id}/chunk?offset=${sent}`, {
          method: "PUT",
          headers: { "Content-Type": "application/octet-stream" },
          body: file.slice(sent, sent + chunk),
        }).catch(() => null);
        if (r?.ok) {
          sent = (await r.json()).received_bytes;
          failures = 0;
        } else if (r?.status === 409) {
          sent = (await r.json()).detail.received_bytes; // server tells us where to resume
        } else {
          if (++failures > 5) throw new Error("Connection to the processing backend keeps failing. Retry to resume.");
          await new Promise((res) => setTimeout(res, 1000 * 2 ** failures));
        }
        const rate = ((sent - startSent) / (performance.now() - startedAt)) * 1000;
        setState({ phase: "uploading", name: file.name, sent, total: file.size, rate });
      }
      setState({ phase: "validating", name: file.name });
      const done = await apiFetch(base, `/recordings/${id}/complete`, { method: "POST" });
      if (!done.ok) {
        const d = (await done.json()).detail;
        throw new Error(typeof d === "string" ? d : (d?.message ?? "Validation failed"));
      }
      localStorage.removeItem(key);
      setState({ phase: "idle" });
      onDone();
    } catch (e) {
      setState({ phase: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  const busy = state.phase === "uploading" || state.phase === "validating";
  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f && online && !busy) upload(f);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[6px] px-6 py-14 text-center transition-colors ${
          drag ? "bg-surface-3" : "bg-surface hover:bg-surface-2"
        } ${!online || busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <UploadCloud size={28} aria-hidden className="text-muted" />
        <span className="text-[16px]">Drop a class recording here, or choose a file</span>
        <span className="text-[13px] text-muted">MP4, MOV, MKV, WebM, AVI · up to 4 GB and 4 hours · stays on the processing machine</span>
        <input
          ref={input}
          type="file"
          accept={ACCEPT.join(",") + ",video/*"}
          className="sr-only"
          disabled={!online || busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </label>
      {!online && !backend.isLoading && (
        <p className="text-[14px] text-danger">
          Uploads go straight to the processing backend, which is offline right now.
          {backend.data?.state === "offline" && ` ${backend.data.reason}`}
        </p>
      )}
      {state.phase === "uploading" && (
        <div className="space-y-1.5" aria-live="polite">
          <div className="flex justify-between text-[13px]">
            <span className="truncate">{state.name}</span>
            <span className="tabular-nums text-muted">
              {fmtBytes(state.sent)} / {fmtBytes(state.total)}
              {state.rate > 0 && ` · ${fmtBytes(state.rate)}/s`}
            </span>
          </div>
          <progress className="h-2 w-full accent-[var(--accent)]" value={state.sent} max={state.total} />
        </div>
      )}
      {state.phase === "validating" && <p className="text-[14px] text-muted">Checking the file with FFprobe…</p>}
      {state.phase === "error" && (
        <p role="alert" className="text-[14px] text-danger">
          {state.message}
        </p>
      )}
    </div>
  );
}
