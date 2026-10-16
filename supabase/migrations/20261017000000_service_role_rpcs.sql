-- The worker calls these RPCs with the secret (service_role) key. Hosted projects do not grant EXECUTE
-- to service_role by default (the local stack does), so state it explicitly; anon/authenticated stay revoked.
grant execute on function public.claim_next_job(text, text[]) to service_role;
grant execute on function public.requeue_stale_jobs(interval) to service_role;
