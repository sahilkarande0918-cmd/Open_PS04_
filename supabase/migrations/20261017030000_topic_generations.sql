-- Mode B uses the existing jobs queue and render_jobs output model.
create table public.topic_generations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  topic text not null check (length(topic) between 3 and 500),
  settings jsonb not null,
  brand_snapshot jsonb,
  storyboard jsonb,
  timeline jsonb,
  render_id uuid references public.render_jobs(id) on delete set null,
  job_id uuid not null references public.jobs(id),
  status text not null default 'queued'
    check (status in ('queued','generating','rendering','ready','failed','cancelled')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.topic_generations(project_id, created_at desc);
create index on public.topic_generations(organization_id);
create unique index topic_one_active on public.topic_generations(project_id)
  where status in ('queued','generating','rendering');
create trigger topic_generations_touch before update on public.topic_generations
  for each row execute function private.touch_updated_at();
alter table public.topic_generations enable row level security;
revoke all on public.topic_generations from anon, authenticated;
grant select on public.topic_generations to authenticated;
grant select, insert, update, delete on public.topic_generations to service_role;
create policy "generations: members read" on public.topic_generations for select to authenticated
  using (private.is_member(organization_id));
alter publication supabase_realtime add table public.topic_generations;

-- Atomic queue insert, including duplicate-click protection. Only the authenticated backend calls it.
create function public.enqueue_topic_generation(
  p_project uuid, p_user uuid, p_topic text, p_settings jsonb, p_brand jsonb default null
) returns jsonb language plpgsql set search_path = '' as $$
declare p public.projects; g public.topic_generations; gid uuid := gen_random_uuid(); jid uuid;
begin
  select * into p from public.projects where id = p_project for update;
  if not found or p.mode <> 'topic' or not exists (
    select 1 from public.organization_members m where m.organization_id = p.organization_id
      and m.user_id = p_user and m.role in ('owner','admin','editor')
  ) then raise exception 'Project not found or access denied'; end if;
  select * into g from public.topic_generations where project_id = p_project
    and status in ('queued','generating','rendering') limit 1;
  if found then
    return jsonb_build_object('generation_id', g.id, 'job_id', g.job_id);
  end if;
  insert into public.jobs(organization_id,project_id,created_by,job_type,payload,current_stage)
    values(p.organization_id,p.id,p_user,'generate',jsonb_build_object('generation_id',gid),'queued')
    returning id into jid;
  insert into public.topic_generations(id,organization_id,project_id,created_by,topic,settings,brand_snapshot,job_id)
    values(gid,p.organization_id,p.id,p_user,p_topic,p_settings,p_brand,jid);
  return jsonb_build_object('generation_id',gid,'job_id',jid);
end;
$$;
revoke all on function public.enqueue_topic_generation(uuid,uuid,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.enqueue_topic_generation(uuid,uuid,text,jsonb,jsonb) to service_role;

-- A crashed/cancelled queue job must not leave a permanently active generation blocking new work.
create function private.sync_generation_job() returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  if new.job_type = 'generate' then
    update public.topic_generations set
      status = case new.status::text when 'failed' then 'failed' when 'cancelled' then 'cancelled'
        when 'queued' then 'queued' else status end,
      error = new.error
    where job_id = new.id and new.status::text in ('failed','cancelled','queued');
  end if;
  return new;
end;
$$;
revoke all on function private.sync_generation_job() from public,anon,authenticated;
create trigger sync_generation_job after update of status on public.jobs
  for each row execute function private.sync_generation_job();
