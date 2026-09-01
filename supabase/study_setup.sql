begin;
create table public.courses (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (length(trim(title)) between 1 and 160),
 institution text not null default '' check (length(institution) <= 120),
 hours numeric(8,2) not null default 0 check (hours between 0 and 100000),
 url text check (url is null or url ~ '^https?://[^/[:space:]]+'),
 progress integer not null default 0 check (progress between 0 and 100),
 created_at timestamptz not null default now(),
 unique (id, user_id)
);
create table public.tasks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 course_id uuid,
 title text not null check (length(trim(title)) between 1 and 160),
 due_date date,
 priority text not null default 'medium' check (priority in ('low','medium','high')),
 status text not null default 'pending' check (status in ('pending','doing','done')),
 created_at timestamptz not null default now(),
 foreign key (course_id, user_id) references public.courses(id, user_id) on delete cascade
);
create index courses_owner_created_idx on public.courses(user_id, created_at desc);
create index tasks_owner_due_idx on public.tasks(user_id, due_date);
create index tasks_course_owner_idx on public.tasks(course_id, user_id);
alter table public.courses enable row level security;
alter table public.tasks enable row level security;
revoke all on public.courses, public.tasks from anon, authenticated;
grant select, delete on public.courses, public.tasks to authenticated;
grant insert(user_id,title,institution,hours,url,progress), update(title,institution,hours,url,progress) on public.courses to authenticated;
grant insert(user_id,course_id,title,due_date,priority,status), update(course_id,title,due_date,priority,status) on public.tasks to authenticated;
create policy courses_read on public.courses for select to authenticated using ((select auth.uid()) = user_id);
create policy courses_create on public.courses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy courses_edit on public.courses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy courses_delete on public.courses for delete to authenticated using ((select auth.uid()) = user_id);
create policy tasks_read on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy tasks_create on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy tasks_edit on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy tasks_delete on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);
commit;
