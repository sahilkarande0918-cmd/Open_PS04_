create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  platform text not null check (platform in ('instagram','youtube')),
  platform_user_id text not null,
  username text not null,
  status text not null default 'connected' check (status in ('connected','expired','disconnected')),
  scopes jsonb not null default '[]',
  expires_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,platform,platform_user_id)
);
create table public.social_credentials (
  account_id uuid primary key references public.social_accounts(id) on delete cascade,
  ciphertext text not null,
  updated_at timestamptz not null default now()
);
create table public.oauth_states (
  state_hash text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  platform text not null,
  redirect_uri text not null,
  expires_at timestamptz not null
);
create table public.publish_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  render_id uuid not null references public.render_jobs(id),
  account_id uuid not null references public.social_accounts(id),
  platform text not null check(platform in ('instagram','youtube')),
  caption text not null default '' check(length(caption)<=2200),
  scheduled_at timestamptz not null,
  status text not null default 'scheduled'
    check(status in ('scheduled','processing','publishing','published','failed','cancelled','needs_review')),
  job_id uuid references public.jobs(id),
  container_id text,
  platform_post_id text,
  platform_url text,
  error text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- A render is sent once to an account. Retry the same row instead of scheduling duplicates.
create unique index publish_once on public.publish_jobs(render_id,account_id) where status <> 'cancelled';
create index on public.publish_jobs(organization_id,scheduled_at);
create table public.platform_metrics (
  account_id uuid primary key references public.social_accounts(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  metrics jsonb not null default '[]',
  unavailable jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.social_accounts enable row level security;
alter table public.social_credentials enable row level security;
alter table public.oauth_states enable row level security;
alter table public.publish_jobs enable row level security;
alter table public.platform_metrics enable row level security;
revoke all on public.social_accounts,public.social_credentials,public.oauth_states,public.publish_jobs,
  public.platform_metrics from anon,authenticated;
grant select on public.social_accounts,public.publish_jobs,public.platform_metrics to authenticated;
grant select,insert,update,delete on public.social_accounts,public.social_credentials,public.oauth_states,
  public.publish_jobs,public.platform_metrics to service_role;
create policy "social: members read" on public.social_accounts for select to authenticated
  using(private.is_member(organization_id));
create policy "publishing: members read" on public.publish_jobs for select to authenticated
  using(private.is_member(organization_id));
create policy "metrics: members read" on public.platform_metrics for select to authenticated
  using(private.is_member(organization_id));
alter publication supabase_realtime add table public.publish_jobs;

create function public.consume_oauth_state(p_hash text,p_user uuid,p_platform text)
returns setof public.oauth_states language sql set search_path='' as $$
  delete from public.oauth_states where state_hash=p_hash and user_id=p_user
    and platform=p_platform and expires_at>now() returning *;
$$;
revoke all on function public.consume_oauth_state(text,uuid,text) from public,anon,authenticated;
grant execute on function public.consume_oauth_state(text,uuid,text) to service_role;

create function public.enqueue_publication(p_render uuid,p_account uuid,p_user uuid,p_caption text,p_when timestamptz)
returns public.publish_jobs language plpgsql set search_path='' as $$
declare r public.render_jobs; a public.social_accounts; p public.publish_jobs; jid uuid; pid uuid:=gen_random_uuid();
begin
  select * into r from public.render_jobs where id=p_render for update;
  select * into a from public.social_accounts where id=p_account;
  if r.id is null or a.id is null or r.status<>'ready' or a.status<>'connected'
    or r.organization_id<>a.organization_id or not exists(
      select 1 from public.organization_members where organization_id=r.organization_id
        and user_id=p_user and role in ('owner','admin','editor')
    ) then raise exception 'Export or account not available'; end if;
  select * into p from public.publish_jobs where render_id=p_render and account_id=p_account and status<>'cancelled';
  if found then return p; end if;
  insert into public.jobs(organization_id,project_id,created_by,job_type,payload,current_stage,run_after)
    values(r.organization_id,r.project_id,p_user,'publish',jsonb_build_object('publish_id',pid),'scheduled',p_when)
    returning id into jid;
  insert into public.publish_jobs(id,organization_id,project_id,render_id,account_id,platform,caption,
    scheduled_at,created_by,job_id) values(pid,r.organization_id,r.project_id,r.id,a.id,a.platform,p_caption,
    p_when,p_user,jid) returning * into p;
  return p;
end;
$$;
revoke all on function public.enqueue_publication(uuid,uuid,uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.enqueue_publication(uuid,uuid,uuid,text,timestamptz) to service_role;

create function private.sync_publish_job() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.job_type='publish' then
    update public.publish_jobs set status=case
      when status='publishing' then 'needs_review'
      when new.status::text='cancelled' then 'cancelled' else 'failed' end,
      error=case when status='publishing' then 'Publish outcome unknown. Reconcile with Instagram before retrying.'
        else new.error end, updated_at=now()
    where job_id=new.id and new.status::text in ('failed','cancelled') and status not in ('published','needs_review');
  end if;
  return new;
end;
$$;
revoke all on function private.sync_publish_job() from public,anon,authenticated;
create trigger sync_publish_job after update of status on public.jobs
  for each row execute function private.sync_publish_job();

create function public.change_publication(p_id uuid,p_action text,p_user uuid)
returns public.publish_jobs language plpgsql set search_path='' as $$
declare p public.publish_jobs; j public.jobs;
begin
  select * into p from public.publish_jobs where id=p_id;
  if not found then return null; end if;
  -- Same queue-row lock used by claim_next_job; cancellation cannot race a worker claim.
  select * into j from public.jobs where id=p.job_id for update;
  select * into p from public.publish_jobs where id=p_id for update;
  if not exists(select 1 from public.organization_members where organization_id=p.organization_id
    and user_id=p_user and role in ('owner','admin','editor')) then return null; end if;
  if p_action='cancel' and j.status::text='queued' and p.status in ('scheduled','processing') then
    update public.jobs set status='cancelled',cancel_requested=true where id=j.id;
    update public.publish_jobs set status='cancelled',updated_at=now() where id=p_id returning * into p;
    return p;
  elsif p_action='retry' and j.status::text='failed' and p.status='failed' and p.platform_post_id is null then
    update public.jobs set status='queued',attempts=0,cancel_requested=false,run_after=now(),error=null where id=j.id;
    update public.publish_jobs set status='scheduled',scheduled_at=now(),error=null,updated_at=now()
      where id=p_id returning * into p;
    return p;
  end if;
  return null;
end;
$$;
revoke all on function public.change_publication(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.change_publication(uuid,text,uuid) to service_role;
