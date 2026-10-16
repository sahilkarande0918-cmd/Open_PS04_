-- Phase 04: institute brand kits. Edited from the browser (RLS: editors write, members read); each render
-- snapshots the chosen kit into its timeline, so later edits never change finished renders.
-- ponytail: the logo lives in the row as a ≤300 KB data URL (no Storage bucket/policies, works with the
-- processing backend offline); move to a private Storage bucket if kits need larger assets.

create table public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  is_default boolean not null default false,
  colors jsonb not null default '{"background":"#0d0f12","text":"#ffffff","accent":"#f5a524"}',
  fonts jsonb not null default '{"body":"Archivo","code":"JetBrains Mono"}',
  logo text check (
    logo is null
    or (char_length(logo) <= 400000 and logo ~ '^data:image/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$')
  ),
  handle text not null default '' check (char_length(handle) <= 40),
  watermark jsonb not null default '{"enabled":true,"position":"top-right"}',
  caption_preset text not null default 'highlight-word'
    check (caption_preset in ('highlight-word', 'karaoke', 'boxed')),
  intro jsonb not null default '{"enabled":true,"duration":2,"title":"{title}"}',
  outro jsonb not null default '{"enabled":true,"duration":3,"cta":"Follow for more"}',
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    colors ->> 'background' ~ '^#[0-9a-fA-F]{6}$'
    and colors ->> 'text' ~ '^#[0-9a-fA-F]{6}$'
    and colors ->> 'accent' ~ '^#[0-9a-fA-F]{6}$'
  ),
  check (fonts ->> 'body' in ('Archivo', 'Poppins', 'Noto Sans') and fonts ->> 'code' in ('JetBrains Mono', 'Fira Code')),
  check (watermark ->> 'position' in ('top-left', 'top-right', 'bottom-left', 'bottom-right')),
  check ((intro ->> 'duration')::numeric between 1 and 5 and char_length(intro ->> 'title') <= 80),
  check ((outro ->> 'duration')::numeric between 1 and 6 and char_length(outro ->> 'cta') <= 80)
);
create unique index brand_kits_one_default on public.brand_kits (organization_id) where is_default;
create index on public.brand_kits (organization_id);
create trigger brand_kits_touch before update on public.brand_kits
  for each row execute function private.touch_updated_at();

alter table public.brand_kits enable row level security;
create policy "brand: members read" on public.brand_kits for select to authenticated
  using (private.is_member(organization_id));
create policy "brand: editors create" on public.brand_kits for insert to authenticated
  with check (private.has_role(organization_id, '{owner,admin,editor}'));
create policy "brand: editors update" on public.brand_kits for update to authenticated
  using (private.has_role(organization_id, '{owner,admin,editor}'))
  with check (private.has_role(organization_id, '{owner,admin,editor}'));
create policy "brand: editors delete" on public.brand_kits for delete to authenticated
  using (private.has_role(organization_id, '{owner,admin,editor}'));

-- explicit grants (D-025); service_role reads kits when building a render
grant select, insert, update, delete on public.brand_kits to authenticated;
grant select, insert, update, delete on public.brand_kits to service_role;

-- which kit a render used (the timeline holds the snapshot itself)
alter table public.render_jobs add column brand_kit_id uuid references public.brand_kits (id) on delete set null;
