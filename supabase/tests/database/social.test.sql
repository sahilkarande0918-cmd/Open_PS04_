begin;
create extension if not exists pgtap with schema extensions;
select plan(12);
insert into auth.users(id,email) values
 ('33333333-3333-3333-3333-333333333333','social-owner@test.local'),
 ('44444444-4444-4444-4444-444444444444','social-outsider@test.local');
insert into public.organizations(id,name,slug,created_by) values
 ('33333333-3333-3333-3333-333333333330','Social test','social-test','33333333-3333-3333-3333-333333333333');
insert into public.organization_members(organization_id,user_id,role) values
 ('33333333-3333-3333-3333-333333333330','33333333-3333-3333-3333-333333333333','owner');
insert into public.projects(id,organization_id,created_by,name,mode) values
 ('33333333-3333-3333-3333-333333333331','33333333-3333-3333-3333-333333333330',
  '33333333-3333-3333-3333-333333333333','Topic test','topic');
set local role service_role;
select lives_ok($$select public.enqueue_topic_generation('33333333-3333-3333-3333-333333333331',
 '33333333-3333-3333-3333-333333333333','JSON vs XML','{}')$$,'backend queues topic atomically');
select public.enqueue_topic_generation('33333333-3333-3333-3333-333333333331',
 '33333333-3333-3333-3333-333333333333','JSON vs XML','{}');
select is((select count(*)::int from public.topic_generations where project_id='33333333-3333-3333-3333-333333333331'),
 1,'duplicate generate clicks reuse one job');
reset role;
insert into public.social_accounts(id,organization_id,created_by,platform,platform_user_id,username) values
 ('33333333-3333-3333-3333-333333333332','33333333-3333-3333-3333-333333333330',
  '33333333-3333-3333-3333-333333333333','instagram','test-account','test');
insert into public.social_credentials(account_id,ciphertext) values
 ('33333333-3333-3333-3333-333333333332','encrypted-test-placeholder');
insert into public.oauth_states(state_hash,organization_id,user_id,platform,redirect_uri,expires_at) values
 ('state-test','33333333-3333-3333-3333-333333333330','33333333-3333-3333-3333-333333333333',
 'instagram','https://example.test/callback',now()+interval '10 minutes');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}',true);
select is((select count(*)::int from public.social_accounts),1,'owner sees connected account');
select throws_ok($$select * from public.social_credentials$$,'42501',null,'owner cannot read encrypted credentials');
select throws_ok($$select * from public.oauth_states$$,'42501',null,'owner cannot read OAuth state');
select throws_ok($$update public.social_accounts set status='connected'$$,'42501',null,'client cannot forge connection');
select throws_ok($$select public.consume_oauth_state('state-test','33333333-3333-3333-3333-333333333333','instagram')$$,
 '42501',null,'client cannot consume OAuth state directly');
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}',true);
select is((select count(*)::int from public.social_accounts),0,'outsider sees no account');
select is((select count(*)::int from public.topic_generations),0,'outsider sees no generation');
reset role;
set local role service_role;
select is((select count(*)::int from public.consume_oauth_state('state-test',
 '44444444-4444-4444-4444-444444444444','instagram')),0,'state bound to requesting user');
select is((select count(*)::int from public.consume_oauth_state('state-test',
 '33333333-3333-3333-3333-333333333333','instagram')),1,'correct user consumes state');
select is((select count(*)::int from public.consume_oauth_state('state-test',
 '33333333-3333-3333-3333-333333333333','instagram')),0,'state cannot be replayed');
reset role;
select * from finish();
rollback;
