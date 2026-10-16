-- Reel Studio — identity, organizations, projects, jobs, backend discovery.
-- RLS is enabled on every table. Membership checks go through SECURITY DEFINER helpers in
-- the `private` schema (not exposed by the Data API) to avoid recursive policies.

create schema if not exists private;

-- ---------------------------------------------------------------- types
create type public.org_role as enum ('owner', 'admin', 'editor', 'viewer');
create type public.project_mode as enum ('recording', 'topic');
create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');

-- ---------------------------------------------------------------- tables
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,47}$'),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.org_role not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index on public.organization_members (user_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  mode public.project_mode not null,
  status text not null default 'draft',
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.projects (organization_id, updated_at desc);

-- Section 18 "Processing Job" contract.
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  job_type text not null,
  status public.job_status not null default 'queued',
  progress real not null default 0 check (progress between 0 and 1),
  current_stage text,
  error text,
  payload jsonb not null default '{}',
  result jsonb,
  attempts int not null default 0,
  max_attempts int not null default 3,
  run_after timestamptz not null default now(),
  locked_by text,
  locked_at timestamptz,
  idempotency_key text unique,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index jobs_claim_idx on public.jobs (status, run_after) where status = 'queued';
create index on public.jobs (project_id, created_at desc);

create table public.job_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.jobs (id) on delete cascade,
  stage text,
  message text not null,
  progress real,
  created_at timestamptz not null default now()
);
create index on public.job_events (job_id, id);

-- The local backend publishes its current tunnel URL here (DECISIONS D-004).
create table public.backend_endpoints (
  id text primary key default 'primary',
  url text not null check (url ~ '^https?://'),
  version text,
  capabilities jsonb not null default '{}',
  last_seen_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations (id) on delete cascade,
  actor_id uuid references auth.users (id),
  action text not null,
  target text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.audit_events (organization_id, created_at desc);

-- ---------------------------------------------------------------- helpers
create or replace function private.is_member(org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_role(org uuid, roles public.org_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org and m.user_id = (select auth.uid()) and m.role = any (roles)
  );
$$;

create or replace function private.shares_org(other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_members a
    join public.organization_members b on a.organization_id = b.organization_id
    where a.user_id = (select auth.uid()) and b.user_id = other
  );
$$;

grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;

-- touch updated_at
create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger projects_touch before update on public.projects
  for each row execute function private.touch_updated_at();
create trigger jobs_touch before update on public.jobs
  for each row execute function private.touch_updated_at();

-- profile row for every new auth user
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- Atomically create an organization and make the caller its owner.
create or replace function public.create_organization(org_name text, org_slug text)
returns public.organizations language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  org public.organizations;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  insert into public.organizations (name, slug, created_by)
  values (trim(org_name), lower(trim(org_slug)), uid)
  returning * into org;
  insert into public.organization_members (organization_id, user_id, role) values (org.id, uid, 'owner');
  insert into public.audit_events (organization_id, actor_id, action, target)
  values (org.id, uid, 'organization.created', org.id::text);
  return org;
end;
$$;
revoke execute on function public.create_organization(text, text) from public, anon;
grant execute on function public.create_organization(text, text) to authenticated;

-- Worker job claim (service role only). SKIP LOCKED makes concurrent workers safe.
create or replace function public.claim_next_job(worker text, job_types text[] default null)
returns public.jobs language plpgsql security definer set search_path = '' as $$
declare
  j public.jobs;
begin
  select * into j from public.jobs
  where status = 'queued' and run_after <= now()
    and (job_types is null or job_type = any (job_types))
  order by created_at
  for update skip locked
  limit 1;
  if not found then
    return null;
  end if;
  update public.jobs
  set status = 'running', locked_by = worker, locked_at = now(), attempts = attempts + 1
  where id = j.id
  returning * into j;
  return j;
end;
$$;
revoke execute on function public.claim_next_job(text, text[]) from public, anon, authenticated;

-- Re-queue jobs whose worker died (lock older than `stale`). Never marks them succeeded.
create or replace function public.requeue_stale_jobs(stale interval default interval '10 minutes')
returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update public.jobs
  set status = case when attempts >= max_attempts then 'failed'::public.job_status else 'queued' end,
      error = case when attempts >= max_attempts then 'worker lost; max attempts reached' else error end,
      locked_by = null, locked_at = null
  where status = 'running' and locked_at < now() - stale;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function public.requeue_stale_jobs(interval) from public, anon, authenticated;

-- ---------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.jobs enable row level security;
alter table public.job_events enable row level security;
alter table public.backend_endpoints enable row level security;
alter table public.audit_events enable row level security;

create policy "profiles: self or shared org" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_org(id));
create policy "profiles: update self" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "orgs: members read" on public.organizations for select to authenticated
  using (private.is_member(id));
create policy "orgs: admins update" on public.organizations for update to authenticated
  using (private.has_role(id, '{owner,admin}')) with check (private.has_role(id, '{owner,admin}'));
create policy "orgs: owners delete" on public.organizations for delete to authenticated
  using (private.has_role(id, '{owner}'));

create policy "members: members read" on public.organization_members for select to authenticated
  using (private.is_member(organization_id));
create policy "members: admins add" on public.organization_members for insert to authenticated
  with check (private.has_role(organization_id, '{owner,admin}') and role <> 'owner');
create policy "members: admins change" on public.organization_members for update to authenticated
  using (private.has_role(organization_id, '{owner,admin}'))
  with check (private.has_role(organization_id, '{owner,admin}') and role <> 'owner');
create policy "members: admins remove or self leave" on public.organization_members for delete to authenticated
  using ((private.has_role(organization_id, '{owner,admin}') and role <> 'owner') or (user_id = (select auth.uid()) and role <> 'owner'));

create policy "projects: members read" on public.projects for select to authenticated
  using (private.is_member(organization_id));
create policy "projects: editors create" on public.projects for insert to authenticated
  with check (private.has_role(organization_id, '{owner,admin,editor}') and created_by = (select auth.uid()));
create policy "projects: editors update" on public.projects for update to authenticated
  using (private.has_role(organization_id, '{owner,admin,editor}'))
  with check (private.has_role(organization_id, '{owner,admin,editor}'));
create policy "projects: admins delete" on public.projects for delete to authenticated
  using (private.has_role(organization_id, '{owner,admin}'));

-- Jobs are created and updated by the backend (service role). Members can read progress.
create policy "jobs: members read" on public.jobs for select to authenticated
  using (private.is_member(organization_id));
create policy "job_events: members read" on public.job_events for select to authenticated
  using (exists (select 1 from public.jobs j where j.id = job_id and private.is_member(j.organization_id)));

create policy "backend: signed-in users read" on public.backend_endpoints for select to authenticated
  using (true);

create policy "audit: admins read" on public.audit_events for select to authenticated
  using (private.has_role(organization_id, '{owner,admin}'));

-- Explicit grants (do not rely on project-level defaults).
revoke all on all tables in schema public from anon;
grant select, update on public.profiles to authenticated;
grant select, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select on public.jobs, public.job_events, public.backend_endpoints, public.audit_events to authenticated;

-- Realtime job progress.
alter publication supabase_realtime add table public.jobs;
