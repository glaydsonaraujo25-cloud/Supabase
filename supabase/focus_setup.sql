begin;
create table public.study_sessions (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 course_id uuid,
 studied_on date not null,
 minutes integer not null check(minutes between 1 and 720),
 note text not null default '' check(length(note)<=500),
 created_at timestamptz not null default now(),
 foreign key(course_id,user_id) references public.courses(id,user_id) on delete set null(course_id)
);
create index study_sessions_owner_date on public.study_sessions(user_id,studied_on);
create index study_sessions_course_owner on public.study_sessions(course_id,user_id);
create table public.study_goals (
 user_id uuid primary key references auth.users(id) on delete cascade,
 weekly_minutes integer not null check(weekly_minutes between 0 and 10080)
);
alter table public.study_sessions enable row level security;
alter table public.study_goals enable row level security;
revoke all on public.study_sessions,public.study_goals from anon,authenticated;
grant select,delete on public.study_sessions to authenticated;
grant insert(id,user_id,course_id,studied_on,minutes,note) on public.study_sessions to authenticated;
grant select on public.study_goals to authenticated;
grant insert(user_id,weekly_minutes),update(user_id,weekly_minutes) on public.study_goals to authenticated;
create policy own_read on public.study_sessions for select to authenticated using((select auth.uid())=user_id);
create policy own_insert on public.study_sessions for insert to authenticated with check((select auth.uid())=user_id);
create policy own_delete on public.study_sessions for delete to authenticated using((select auth.uid())=user_id);
create policy own_read on public.study_goals for select to authenticated using((select auth.uid())=user_id);
create policy own_insert on public.study_goals for insert to authenticated with check((select auth.uid())=user_id);
create policy own_update on public.study_goals for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
commit;
