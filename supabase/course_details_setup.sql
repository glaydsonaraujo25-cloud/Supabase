begin;
alter table public.courses add column description text not null default '' check(length(description)<=5000), add column auto_progress boolean not null default false;
grant update(description,auto_progress), insert(description,auto_progress) on public.courses to authenticated;
create table public.course_modules (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 course_id uuid not null, title text not null check(length(trim(title)) between 1 and 160),
 position integer not null default 0 check(position>=0), created_at timestamptz not null default now(),
 foreign key(course_id,user_id) references public.courses(id,user_id) on delete cascade,
 unique(id,course_id,user_id)
);
create table public.course_lessons (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 course_id uuid not null, module_id uuid not null, title text not null check(length(trim(title)) between 1 and 160),
 completed boolean not null default false, position integer not null default 0 check(position>=0), created_at timestamptz not null default now(),
 foreign key(module_id,course_id,user_id) references public.course_modules(id,course_id,user_id) on delete cascade
);
create table public.course_notes (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 course_id uuid not null, title text not null check(length(trim(title)) between 1 and 160),
 body text not null default '' check(length(body)<=20000), created_at timestamptz not null default now(),
 foreign key(course_id,user_id) references public.courses(id,user_id) on delete cascade
);
create index course_modules_owner_course on public.course_modules(user_id,course_id);
create index course_modules_course_owner on public.course_modules(course_id,user_id);
create index course_lessons_owner_course on public.course_lessons(user_id,course_id);
create index course_lessons_module_course_owner on public.course_lessons(module_id,course_id,user_id);
create index course_notes_owner_course on public.course_notes(user_id,course_id);
create index course_notes_course_owner on public.course_notes(course_id,user_id);
alter table public.course_modules enable row level security;
revoke all on public.course_modules from anon, authenticated;
grant select,delete on public.course_modules to authenticated;
grant insert(user_id,course_id,title,position),update(title,position) on public.course_modules to authenticated;
create policy own_read on public.course_modules for select to authenticated using ((select auth.uid())=user_id);
create policy own_insert on public.course_modules for insert to authenticated with check ((select auth.uid())=user_id);
create policy own_update on public.course_modules for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy own_delete on public.course_modules for delete to authenticated using ((select auth.uid())=user_id);
alter table public.course_lessons enable row level security;
revoke all on public.course_lessons from anon, authenticated;
grant select,delete on public.course_lessons to authenticated;
grant insert(user_id,course_id,module_id,title,completed,position),update(title,completed,position) on public.course_lessons to authenticated;
create policy own_read on public.course_lessons for select to authenticated using ((select auth.uid())=user_id);
create policy own_insert on public.course_lessons for insert to authenticated with check ((select auth.uid())=user_id);
create policy own_update on public.course_lessons for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy own_delete on public.course_lessons for delete to authenticated using ((select auth.uid())=user_id);
alter table public.course_notes enable row level security;
revoke all on public.course_notes from anon, authenticated;
grant select,delete on public.course_notes to authenticated;
grant insert(user_id,course_id,title,body),update(title,body) on public.course_notes to authenticated;
create policy own_read on public.course_notes for select to authenticated using ((select auth.uid())=user_id);
create policy own_insert on public.course_notes for insert to authenticated with check ((select auth.uid())=user_id);
create policy own_update on public.course_notes for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy own_delete on public.course_notes for delete to authenticated using ((select auth.uid())=user_id);
create view public.study_courses with (security_invoker=true) as
select c.id,c.user_id,c.title,c.institution,c.hours,c.url,c.created_at,c.description,c.auto_progress,
c.progress as manual_progress,
case when c.auto_progress then coalesce(round(100.0*counts.done/nullif(counts.total,0)),0)::integer else c.progress end as progress,
coalesce(counts.total,0)::integer as lesson_count, coalesce(counts.done,0)::integer as completed_count
from public.courses c left join (
 select course_id,user_id,count(*) as total,count(*) filter(where completed) as done
 from public.course_lessons group by course_id,user_id
) counts on counts.course_id=c.id and counts.user_id=c.user_id;
revoke all on public.study_courses from anon,authenticated;
grant select on public.study_courses to authenticated;
commit;
