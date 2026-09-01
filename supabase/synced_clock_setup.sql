begin;
create table public.study_clocks (
 user_id uuid primary key references auth.users(id) on delete cascade,
 accumulated integer not null default 0 check(accumulated between 0 and 43200),
 started_at timestamptz,
 version bigint not null default 0,
 run_id uuid not null default gen_random_uuid()
);
alter table public.study_clocks enable row level security;
revoke all on public.study_clocks from anon,authenticated;
grant select,insert,update on public.study_clocks to authenticated;
create policy own_clock on public.study_clocks to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create function public.study_clock_command(p_action text, p_version bigint default null, p_run_id uuid default null, p_date date default null, p_course uuid default null, p_note text default '') returns jsonb
language plpgsql security invoker set search_path='' as $$
declare c public.study_clocks; total integer; uid uuid:=auth.uid(); stamp timestamptz:=clock_timestamp();
begin
 if uid is null then raise exception 'not_authenticated'; end if;
 if p_action not in ('read','start','pause','finish','reset') then raise exception 'invalid_action'; end if;
 insert into public.study_clocks(user_id) values(uid) on conflict(user_id) do nothing;
 select * into c from public.study_clocks where user_id=uid for update;
 if p_action='finish' and exists(select 1 from public.study_sessions where id=p_run_id and user_id=uid) then
  return to_jsonb(c)||jsonb_build_object('server_now',stamp,'already_saved',true);
 end if;
 if p_action<>'read' and (p_version is null or p_version<>c.version or p_run_id is distinct from c.run_id) then raise exception 'clock_conflict'; end if;
 total:=least(43200,c.accumulated+case when c.started_at is null then 0 else greatest(0,floor(extract(epoch from (stamp-c.started_at)))::integer) end);
 if p_action='start' and c.started_at is null and total<43200 then c.started_at:=stamp;c.version:=c.version+1;
 elsif p_action='pause' and c.started_at is not null then c.accumulated:=total;c.started_at:=null;c.version:=c.version+1;
 elsif p_action='reset' then c.accumulated:=0;c.started_at:=null;c.run_id:=gen_random_uuid();c.version:=c.version+1;
 elsif p_action='finish' then
  if c.started_at is not null or total<60 or p_date is null then raise exception 'pause_before_saving'; end if;
  insert into public.study_sessions(id,user_id,course_id,studied_on,minutes,note) values(c.run_id,uid,p_course,p_date,total/60,coalesce(p_note,''));
  c.accumulated:=0;c.started_at:=null;c.run_id:=gen_random_uuid();c.version:=c.version+1;
 end if;
 if p_action<>'read' then update public.study_clocks set accumulated=c.accumulated,started_at=c.started_at,version=c.version,run_id=c.run_id where user_id=uid; end if;
 return to_jsonb(c)||jsonb_build_object('server_now',stamp);
end;
$$;
revoke all on function public.study_clock_command(text,bigint,uuid,date,uuid,text) from public,anon;
grant execute on function public.study_clock_command(text,bigint,uuid,date,uuid,text) to authenticated;
commit;
