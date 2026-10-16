-- Phase 02: source recordings, transcripts (raw + corrected), glossary, job cancellation.
-- Original media lives on the processing machine's disk; only metadata is stored here.

create type public.recording_status as enum ('uploading', 'uploaded', 'processing', 'ready', 'failed');

create table public.source_recordings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  created_by uuid not null references auth.users (id),
  filename text not null check (char_length(filename) between 1 and 255),
  size_bytes bigint not null check (size_bytes > 0),
  received_bytes bigint not null default 0,
  status public.recording_status not null default 'uploading',
  storage_path text,            -- relative to the backend DATA_DIR; never a user-supplied path
  duration_s real,
  width int,
  height int,
  fps real,
  video_codec text,
  audio_codec text,
  probe jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.source_recordings (project_id, created_at desc);
create trigger source_recordings_touch before update on public.source_recordings
  for each row execute function private.touch_updated_at();

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  recording_id uuid not null references public.source_recordings (id) on delete cascade,
  model text not null,
  language text,
  language_probability real,
  duration_s real,
  processing_s real,            -- measured wall-clock transcription time
  word_timing text not null default 'whisper-dtw', -- 'whisper-dtw' | 'whisperx-aligned'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.transcripts (recording_id, created_at desc);
create trigger transcripts_touch before update on public.transcripts
  for each row execute function private.touch_updated_at();

create table public.transcript_segments (
  transcript_id uuid not null references public.transcripts (id) on delete cascade,
  idx int not null,
  start_s real not null,
  end_s real not null,
  raw_text text not null,
  avg_logprob real,
  no_speech_prob real,
  primary key (transcript_id, idx)
);

-- Section 18 "Transcript Word": raw_text is what the model heard, corrected_text what we display.
create table public.transcript_words (
  transcript_id uuid not null references public.transcripts (id) on delete cascade,
  idx int not null,
  segment_idx int not null,
  start_s real not null,
  end_s real not null,
  raw_text text not null,
  corrected_text text not null,
  confidence real,
  metadata jsonb not null default '{}', -- correction source, merged spans, user edits
  primary key (transcript_id, idx)
);

create table public.technical_glossaries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  term text not null check (char_length(term) between 1 and 80),
  aliases text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (organization_id, term)
);

alter table public.jobs add column cancel_requested boolean not null default false;

-- Members may request cancellation of their org's jobs; the worker honours it between stages.
create or replace function public.cancel_job(job uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.jobs set cancel_requested = true,
    status = case when status = 'queued' then 'cancelled'::public.job_status else status end
  where id = job and private.has_role(organization_id, '{owner,admin,editor}')
    and status in ('queued', 'running');
  if not found then raise exception 'job not found or not cancellable' using errcode = '42501'; end if;
end;
$$;
revoke execute on function public.cancel_job(uuid) from public, anon;
grant execute on function public.cancel_job(uuid) to authenticated;

-- RLS
alter table public.source_recordings enable row level security;
alter table public.transcripts enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.transcript_words enable row level security;
alter table public.technical_glossaries enable row level security;

create policy "recordings: members read" on public.source_recordings for select to authenticated
  using (private.is_member(organization_id));
create policy "transcripts: members read" on public.transcripts for select to authenticated
  using (private.is_member(organization_id));
create policy "segments: members read" on public.transcript_segments for select to authenticated
  using (exists (select 1 from public.transcripts t where t.id = transcript_id and private.is_member(t.organization_id)));
create policy "words: members read" on public.transcript_words for select to authenticated
  using (exists (select 1 from public.transcripts t where t.id = transcript_id and private.is_member(t.organization_id)));
-- Editors correct words; raw_text and timing stay as recognised (enforced by column grant below).
create policy "words: editors correct" on public.transcript_words for update to authenticated
  using (exists (select 1 from public.transcripts t where t.id = transcript_id
                 and private.has_role(t.organization_id, '{owner,admin,editor}')))
  with check (exists (select 1 from public.transcripts t where t.id = transcript_id
                 and private.has_role(t.organization_id, '{owner,admin,editor}')));

create policy "glossary: members read" on public.technical_glossaries for select to authenticated
  using (private.is_member(organization_id));
create policy "glossary: editors write" on public.technical_glossaries for all to authenticated
  using (private.has_role(organization_id, '{owner,admin,editor}'))
  with check (private.has_role(organization_id, '{owner,admin,editor}'));

grant select on public.source_recordings, public.transcripts, public.transcript_segments, public.transcript_words
  to authenticated;
grant update (corrected_text, metadata) on public.transcript_words to authenticated;
grant select, insert, update, delete on public.technical_glossaries to authenticated;

alter publication supabase_realtime add table public.source_recordings;
