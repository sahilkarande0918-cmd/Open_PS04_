-- RLS isolation tests. Run: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(34);

-- two users, each in their own org
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local', '{"full_name":"Alice"}'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local', '{"full_name":"Bob"}');

select is((select full_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Alice', 'profile auto-created from signup metadata');

create function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- Alice creates org A
select pg_temp.login('11111111-1111-1111-1111-111111111111');
select lives_ok($$ select public.create_organization('Alpha Institute', 'alpha') $$, 'alice creates org');
select is((select role::text from public.organization_members where user_id = auth.uid()), 'owner', 'creator is owner');
select lives_ok($$ insert into public.projects (organization_id, name, mode, created_by)
  select id, 'Alpha project', 'recording', auth.uid() from public.organizations where slug = 'alpha' $$,
  'owner creates project');
reset role;

select set_config('test.alpha', (select id::text from public.organizations where slug = 'alpha'), true);

-- Bob creates org B
select pg_temp.login('22222222-2222-2222-2222-222222222222');
select lives_ok($$ select public.create_organization('Beta Academy', 'beta') $$, 'bob creates org');

-- Bob cannot see Alice's org, members, or projects
select is((select count(*)::int from public.organizations), 1, 'bob sees only his org');
select is((select count(*)::int from public.projects), 0, 'bob sees no alpha projects');
select is((select count(*)::int from public.organization_members where user_id = '11111111-1111-1111-1111-111111111111'),
  0, 'bob cannot see alpha memberships');
select is((select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  0, 'bob cannot read alice profile');

-- Bob cannot write into Alice's org
select throws_ok($$ insert into public.projects (organization_id, name, mode, created_by)
  values (current_setting('test.alpha')::uuid, 'Intrusion', 'topic', auth.uid()) $$,
  '42501', null, 'bob cannot insert a project into alpha org');
select throws_ok($$ insert into public.organization_members (organization_id, user_id, role)
  values ((select id from public.organizations where slug = 'beta'), '11111111-1111-1111-1111-111111111111', 'owner') $$,
  '42501', null, 'admins cannot grant owner role directly');
-- an update on an invisible row silently affects 0 rows
update public.projects set name = 'hacked';
reset role;
select is((select name from public.projects where name = 'Alpha project'), 'Alpha project', 'bob could not rename alpha project');

-- Jobs: backend inserts, members read, outsiders do not; workers only via service role
insert into public.jobs (organization_id, job_type)
  select id, 'ingest' from public.organizations where slug = 'alpha';
select pg_temp.login('11111111-1111-1111-1111-111111111111');
select is((select count(*)::int from public.jobs), 1, 'alice sees her org job');
select throws_ok($$ select public.claim_next_job('w1') $$, '42501', null, 'authenticated users cannot claim jobs');
reset role;
select pg_temp.login('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from public.jobs), 0, 'bob cannot see alpha jobs');
reset role;

-- Render exports: members read their org's renders; outsiders see nothing and nobody writes via the API key
insert into public.render_jobs (organization_id, project_id, created_by, timeline, timeline_hash)
  select p.organization_id, p.id, '11111111-1111-1111-1111-111111111111', '{}', 'h1'
  from public.projects p where p.name = 'Alpha project';
select pg_temp.login('11111111-1111-1111-1111-111111111111');
select is((select count(*)::int from public.render_jobs), 1, 'alice sees her org render');
select throws_ok($$ update public.render_jobs set status = 'ready' $$, '42501', null, 'members cannot mark renders ready');
reset role;
select pg_temp.login('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from public.render_jobs), 0, 'bob cannot see alpha renders');
reset role;

-- Grants: TRUNCATE bypasses RLS and must never be available; locked columns stay locked
select pg_temp.login('11111111-1111-1111-1111-111111111111');
select throws_ok($$ truncate public.jobs $$, '42501', null, 'signed-in users cannot truncate jobs');
select throws_ok($$ truncate public.projects $$, '42501', null, 'signed-in users cannot truncate projects');
select throws_ok($$ update public.highlight_candidates set score = 1 $$, '42501', null, 'highlight scores are not user-editable');
reset role;
-- the publishable key is public: the anon role must hold no table privileges at all
set local role anon;
select throws_ok($$ truncate public.source_recordings $$, '42501', null, 'anonymous callers cannot truncate recordings');
reset role;
select is((select count(*)::int from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public'),
  0, 'anon holds no table grants in public');

-- the worker's RPCs must be executable with the service_role key (not the default on hosted projects)
select ok(has_function_privilege('service_role', 'public.claim_next_job(text, text[])', 'execute'), 'service_role can claim jobs');
select ok(has_function_privilege('service_role', 'public.requeue_stale_jobs(interval)', 'execute'), 'service_role can requeue stale jobs');

select ok(has_table_privilege('service_role', 'public.backend_endpoints', 'select, insert, update'), 'service_role can write the backend heartbeat');
select ok(has_table_privilege('service_role', 'public.render_jobs', 'select, insert, update, delete'), 'service_role can manage renders');

-- Brand kits: editors write their own org's kits, one default per org, values validated, outsiders see nothing
select pg_temp.login('11111111-1111-1111-1111-111111111111');
select lives_ok($$ insert into public.brand_kits (organization_id, name, is_default)
  values (current_setting('test.alpha')::uuid, 'Alpha brand', true) $$, 'owner creates a brand kit');
select throws_ok($$ insert into public.brand_kits (organization_id, name, is_default)
  values (current_setting('test.alpha')::uuid, 'Second default', true) $$, '23505', null, 'only one default kit per org');
select throws_ok($$ insert into public.brand_kits (organization_id, name, colors)
  values (current_setting('test.alpha')::uuid, 'Bad colour', '{"background":"red","text":"#ffffff","accent":"#000000"}') $$,
  '23514', null, 'colours must be #rrggbb');
select throws_ok($$ insert into public.brand_kits (organization_id, name, logo)
  values (current_setting('test.alpha')::uuid, 'Script logo', 'data:text/html;base64,PHNjcmlwdD4=') $$,
  '23514', null, 'logo must be an image data URL');
reset role;
select pg_temp.login('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from public.brand_kits), 0, 'bob cannot see alpha brand kits');
select throws_ok($$ insert into public.brand_kits (organization_id, name)
  values (current_setting('test.alpha')::uuid, 'Intrusion') $$, '42501', null, 'bob cannot add a kit to alpha');
reset role;

-- claim works for the service path and is exclusive
select is((select (public.claim_next_job('w1')).status::text), 'running', 'worker claims queued job');

select * from finish();
rollback;
