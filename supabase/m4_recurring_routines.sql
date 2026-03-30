-- M4: Recurring routines (templates) + per-period completions. Run after m3_categories.sql.

create table public.recurring_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  frequency text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_tasks_frequency_check
    check (frequency in ('daily', 'weekly', 'monthly'))
);

create index recurring_tasks_user_id_idx on public.recurring_tasks (user_id);

create table public.recurring_task_completions (
  id uuid primary key default gen_random_uuid(),
  recurring_task_id uuid not null references public.recurring_tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  period_key text not null,
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint recurring_task_completions_task_period_unique unique (recurring_task_id, period_key)
);

create index recurring_task_completions_user_period_idx
  on public.recurring_task_completions (user_id, period_key);

create index recurring_task_completions_task_id_idx
  on public.recurring_task_completions (recurring_task_id);

alter table public.recurring_tasks enable row level security;
alter table public.recurring_task_completions enable row level security;
