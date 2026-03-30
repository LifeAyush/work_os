-- M3: Categories + tasks.category_id (replaces primary_tag). Run after m2_tasks_user_id.sql.
-- Per-category accent is color_hex (#RRGGBB only, enforced below).

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null,
  color_hex text not null default '#71717a',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_user_slug_unique unique (user_id, slug),
  constraint categories_color_hex_check check (color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

-- Case-insensitive unique name per user (expressions are not allowed inline in UNIQUE; use an index.)
create unique index if not exists categories_user_name_lower_idx
  on public.categories (user_id, (lower(trim(name))));

create index if not exists categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;

-- Tasks → categories (restrict delete if tasks still reference)
alter table public.tasks
  add column if not exists category_id uuid references public.categories (id) on delete restrict;

-- Seed three default categories per user who already has tasks
insert into public.categories (user_id, name, slug, color_hex)
select distinct t.user_id, v.name, v.slug, v.color_hex
from public.tasks t
cross join (
  values
    ('Breathe', 'breathe', '#3b82f6'),
    ('Freelance', 'freelance', '#22c55e'),
    ('General', 'general', '#a855f7')
) as v(name, slug, color_hex)
on conflict (user_id, slug) do nothing;

-- Point tasks at the matching category row
update public.tasks t
set category_id = c.id
from public.categories c
where c.user_id = t.user_id
  and c.slug = t.primary_tag
  and t.category_id is null;

-- Fail loudly if any task could not be linked (unexpected primary_tag)
do $$
begin
  if exists (select 1 from public.tasks where category_id is null) then
    raise exception 'm3_categories: some tasks have no matching category row; fix primary_tag data before re-running';
  end if;
end $$;

alter table public.tasks
  alter column category_id set not null;

alter table public.tasks drop constraint if exists tasks_primary_tag_check;
alter table public.tasks drop column if exists primary_tag;
