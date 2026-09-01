begin;
alter table public.tasks add column repeat_days integer not null default 0 check(repeat_days in (0,1,7));
alter table public.tasks add column recurrence_spawned boolean not null default false;
alter table public.tasks add constraint recurring_task_date check(repeat_days=0 or due_date is not null);
grant insert(repeat_days),update(repeat_days) on public.tasks to authenticated;
create function public.spawn_next_task() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.status='done' and new.repeat_days>0 and not new.recurrence_spawned then
  insert into public.tasks(user_id,course_id,title,due_date,priority,status,repeat_days)
  values(new.user_id,new.course_id,new.title,new.due_date+new.repeat_days,new.priority,'pending',new.repeat_days);
  new.recurrence_spawned:=true;
 end if;
 return new;
end;
$$;
revoke all on function public.spawn_next_task() from public,anon,authenticated;
create trigger spawn_next_task before insert or update on public.tasks for each row execute function public.spawn_next_task();
grant update(course_id,studied_on,minutes,note) on public.study_sessions to authenticated;
create policy own_update on public.study_sessions for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
commit;
