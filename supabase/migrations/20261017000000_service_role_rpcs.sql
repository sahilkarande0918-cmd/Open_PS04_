-- The processing backend uses the secret (service_role) key. Hosted projects created with Supabase's
-- secure-by-default privileges give service_role only REFERENCES/TRIGGER/TRUNCATE/MAINTAIN on new tables
-- and no EXECUTE on new functions (the local stack grants everything), so production saw
-- "permission denied" on every table and on the worker RPCs. Grant exactly what the backend uses.

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to service_role;

grant execute on function public.claim_next_job(text, text[]) to service_role;
grant execute on function public.requeue_stale_jobs(interval) to service_role;
