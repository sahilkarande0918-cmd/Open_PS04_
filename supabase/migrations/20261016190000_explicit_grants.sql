-- Security fix: Supabase's default privileges give `authenticated` ALL on new public tables, including
-- TRUNCATE (not subject to RLS — any signed-in user could empty every organization's tables) and
-- table-wide UPDATE (which made the column-level grants below meaningless). Reset to explicit grants.
-- RLS policies are unchanged; these grants are the second layer the policies assume.

revoke all on all tables in schema public from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;

-- identity and workspace
grant select, update on public.profiles to authenticated;
grant select, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.projects to authenticated;

-- jobs and operations: written by the processing backend (service role) only
grant select on public.jobs, public.job_events, public.backend_endpoints, public.audit_events to authenticated;

-- recordings and transcripts: editors correct words; raw text and timing stay as recognised
grant select on public.source_recordings, public.transcripts, public.transcript_segments, public.transcript_words
  to authenticated;
grant update (corrected_text, metadata) on public.transcript_words to authenticated;
grant select, insert, update, delete on public.technical_glossaries to authenticated;

-- highlights: editors select/reject, retime and override framing; scores and reasons stay as computed
grant select on public.highlight_candidates to authenticated;
grant update (status, start_s, end_s, boundaries_edited, crop_keyframes, crop_overridden, title)
  on public.highlight_candidates to authenticated;

-- renders: created and finished by the backend only
grant select on public.render_jobs to authenticated;
