-- Run in Supabase SQL Editor (Dashboard → SQL → New query) once per project.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  status text not null default 'todo',
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

-- No policies yet: use the service role from the app for server-side access.
-- After m1_schema.sql, run m2_tasks_user_id.sql to add mandatory user_id → auth.users.
