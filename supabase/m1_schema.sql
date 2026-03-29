-- M1: extend tasks for tags, priority, due date, description, attachments.
-- Run in Supabase SQL Editor after tasks.sql (idempotent-ish).

alter table public.tasks
  add column if not exists primary_tag text not null default 'general';

alter table public.tasks
  add column if not exists priority text not null default 'med';

alter table public.tasks
  add column if not exists due_at timestamptz;

alter table public.tasks
  add column if not exists description text not null default '';

alter table public.tasks
  add column if not exists attachments text not null default '';

alter table public.tasks
  add column if not exists updated_at timestamptz not null default now();

alter table public.tasks drop constraint if exists tasks_primary_tag_check;
alter table public.tasks
  add constraint tasks_primary_tag_check
  check (primary_tag in ('breathe', 'freelance', 'general'));

alter table public.tasks drop constraint if exists tasks_priority_check;
alter table public.tasks
  add constraint tasks_priority_check
  check (priority in ('low', 'med', 'high'));

alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks
  add constraint tasks_status_check
  check (status in ('todo', 'in_progress', 'done', 'blocked', 'archived'));
