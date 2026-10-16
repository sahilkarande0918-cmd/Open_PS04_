-- Phase 03: highlight candidates with reasons, heuristic/LLM scores and crop keyframes.

create table public.highlight_candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  recording_id uuid not null references public.source_recordings (id) on delete cascade,
  transcript_id uuid references public.transcripts (id) on delete set null,
  rank int not null,
  start_s real not null,
  end_s real not null check (end_s > start_s),
  score real not null,
  score_kind text not null default 'heuristic',        -- 'heuristic' | 'heuristic+llm' (never a probability)
  title text not null default '',
  summary text not null default '',
  transcript_excerpt text not null default '',
  reasons jsonb not null default '[]',
  features jsonb not null default '{}',
  llm jsonb,                                          -- raw local-LLM judgment, if it ran
  crop_keyframes jsonb not null default '[]',         -- Section 18 Crop Keyframe list, times relative to start_s
  crop_overridden boolean not null default false,
  status text not null default 'proposed' check (status in ('proposed', 'selected', 'rejected')),
  boundaries_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.highlight_candidates (recording_id, rank);
create trigger highlight_candidates_touch before update on public.highlight_candidates
  for each row execute function private.touch_updated_at();

alter table public.highlight_candidates enable row level security;
create policy "highlights: members read" on public.highlight_candidates for select to authenticated
  using (private.is_member(organization_id));
create policy "highlights: editors update" on public.highlight_candidates for update to authenticated
  using (private.has_role(organization_id, '{owner,admin,editor}'))
  with check (private.has_role(organization_id, '{owner,admin,editor}'));

grant select on public.highlight_candidates to authenticated;
-- editors may select/reject, retime and override framing; scores and reasons stay as computed
grant update (status, start_s, end_s, boundaries_edited, crop_keyframes, crop_overridden, title)
  on public.highlight_candidates to authenticated;

alter publication supabase_realtime add table public.highlight_candidates;
