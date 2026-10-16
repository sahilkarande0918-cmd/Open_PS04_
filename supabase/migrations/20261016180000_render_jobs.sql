-- Phase 04: rendered exports. One row per render: the canonical timeline snapshot that was rendered,
-- its hash (render cache key) and the verified output. Files live on the processing machine's disk
-- (DATA_DIR/orgs/<org>/renders/<id>/) and are served through short-lived signed URLs.
-- The master prompt's render_jobs + export_assets are one table until a render has several outputs.

create table public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  recording_id uuid references public.source_recordings (id) on delete set null,
  highlight_id uuid references public.highlight_candidates (id) on delete set null,
  job_id uuid references public.jobs (id) on delete set null,
  created_by uuid not null references auth.users (id),
  status text not null default 'queued'
    check (status in ('queued', 'rendering', 'ready', 'failed', 'cancelled')),
  quality text not null default 'looks' check (quality in ('draft', 'looks', 'delivery')),
  timeline jsonb not null,
  timeline_hash text not null,
  output_path text,          -- relative to DATA_DIR; server-generated, never user input
  thumbnail_path text,
  duration_s real,
  width int,
  height int,
  fps real,
  size_bytes bigint,
  render_s real,             -- measured wall-clock render time
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.render_jobs (highlight_id, created_at desc);
create index on public.render_jobs (organization_id, timeline_hash);
create trigger render_jobs_touch before update on public.render_jobs
  for each row execute function private.touch_updated_at();

alter table public.render_jobs enable row level security;
create policy "renders: members read" on public.render_jobs for select to authenticated
  using (private.is_member(organization_id));
-- created and updated only by the processing API / worker (service role): no write grants
grant select on public.render_jobs to authenticated;

alter publication supabase_realtime add table public.render_jobs;
