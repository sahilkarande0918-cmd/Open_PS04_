"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useProjectJobs } from "@/lib/realtime";
import { JobProgress } from "./job-progress";
import { TranscriptView } from "./transcript-view";
import { Uploader } from "./uploader";

type Recording = {
  id: string;
  filename: string;
  status: string;
  size_bytes: number;
  duration_s: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  video_codec: string | null;
  audio_codec: string | null;
  error: string | null;
};

export function RecordingStudio({ projectId, canEdit }: { projectId: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const jobs = useProjectJobs(projectId);
  const recording = useQuery({
    queryKey: ["recording", projectId],
    queryFn: async () => {
      const sb = createClient();
      const { data: rec, error } = await sb
        .from("source_recordings")
        .select("id, filename, status, size_bytes, duration_s, width, height, fps, video_codec, audio_codec, error")
        .eq("project_id", projectId)
        .neq("status", "uploading")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!rec) return null;
      const { data: tr } = await sb
        .from("transcripts")
        .select("id, model, language, processing_s, duration_s")
        .eq("recording_id", rec.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { rec: rec as Recording, transcript: tr };
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["recording", projectId] });
    qc.invalidateQueries({ queryKey: ["jobs", projectId] });
  };

  const latestJob = jobs.data?.find((j) => j.job_type === "transcribe");
  const rec = recording.data?.rec;
  const tr = recording.data?.transcript;

  if (recording.isLoading) return <p className="text-muted">Loading…</p>;

  return (
    <div className="space-y-6">
      {(!rec || rec.status === "failed") && canEdit && (
        <>
          {rec?.status === "failed" && <p className="text-[14px] text-danger">Last upload failed: {rec.error}</p>}
          <Uploader projectId={projectId} onDone={refresh} />
        </>
      )}
      {!rec && !canEdit && <p className="text-muted">No recording uploaded yet.</p>}
      {rec && (
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-muted">
          <div><dt className="inline">File </dt><dd className="inline text-ink">{rec.filename}</dd></div>
          {rec.duration_s && <div><dt className="inline">Duration </dt><dd className="inline tabular-nums text-ink">{Math.floor(rec.duration_s / 60)} min {Math.round(rec.duration_s % 60)} s</dd></div>}
          {rec.width && <div><dt className="inline">Video </dt><dd className="inline tabular-nums text-ink">{rec.width}×{rec.height} · {rec.fps} fps · {rec.video_codec}</dd></div>}
          <div><dt className="inline">Audio </dt><dd className="inline text-ink">{rec.audio_codec}</dd></div>
          <div><dt className="inline">Size </dt><dd className="inline tabular-nums text-ink">{(rec.size_bytes / 1024 ** 2).toFixed(1)} MB</dd></div>
          {tr && <div><dt className="inline">Transcript </dt><dd className="inline text-ink">{tr.model} · language {tr.language}</dd></div>}
        </dl>
      )}
      {rec && latestJob && (latestJob.status !== "succeeded" || !tr) && (
        <JobProgress job={latestJob} recordingId={rec.id} onChange={refresh} />
      )}
      {rec && tr && <TranscriptView recordingId={rec.id} transcriptId={tr.id} canEdit={canEdit} />}
    </div>
  );
}
