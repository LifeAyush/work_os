-- Per-user tasks (mandatory): run in Supabase SQL Editor after m1_schema.sql.
-- Deletes every existing task row, then requires user_id on all future rows.

delete from public.tasks;

alter table public.tasks
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.tasks
  alter column user_id set not null;

create index if not exists tasks_user_id_idx on public.tasks (user_id);
