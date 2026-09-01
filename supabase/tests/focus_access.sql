begin;
insert into auth.users(id,email,raw_user_meta_data,created_at,updated_at) values
('b4000000-0000-4000-8000-000000000001','focus-a@example.invalid','{"full_name":"A"}',now(),now()),
('b4000000-0000-4000-8000-000000000002','focus-b@example.invalid','{"full_name":"B"}',now(),now());
set local role authenticated;
select set_config('request.jwt.claim.sub','b4000000-0000-4000-8000-000000000001',true);
insert into public.courses(user_id,title) values(auth.uid(),'Focus test');
select set_config('focus.course',(select id::text from public.courses limit 1),true);
insert into public.study_goals(user_id,weekly_minutes) values(auth.uid(),120) on conflict(user_id) do update set user_id=excluded.user_id,weekly_minutes=excluded.weekly_minutes;
insert into public.study_goals(user_id,weekly_minutes) values(auth.uid(),180) on conflict(user_id) do update set user_id=excluded.user_id,weekly_minutes=excluded.weekly_minutes;
insert into public.study_sessions(id,user_id,course_id,studied_on,minutes) values(gen_random_uuid(),auth.uid(),current_setting('focus.course')::uuid,current_date,25);
select set_config('request.jwt.claim.sub','b4000000-0000-4000-8000-000000000002',true);
do $$ declare n integer; begin
 if exists(select 1 from public.study_sessions) or exists(select 1 from public.study_goals) then raise exception 'Read isolation failed'; end if;
 update public.study_goals set weekly_minutes=1; get diagnostics n=row_count; if n<>0 then raise exception 'Cross update'; end if;
 delete from public.study_sessions; get diagnostics n=row_count; if n<>0 then raise exception 'Cross delete'; end if;
 begin insert into public.study_sessions(id,user_id,course_id,studied_on,minutes) values(gen_random_uuid(),auth.uid(),current_setting('focus.course')::uuid,current_date,25); raise exception 'Cross course allowed'; exception when foreign_key_violation then null; end;
 begin insert into public.study_goals(user_id,weekly_minutes) values('b4000000-0000-4000-8000-000000000001',10) on conflict(user_id) do update set weekly_minutes=excluded.weekly_minutes; raise exception 'Cross upsert'; exception when insufficient_privilege then null; end;
 begin insert into public.study_sessions(id,user_id,studied_on,minutes) values(gen_random_uuid(),auth.uid(),current_date,0); raise exception 'Invalid minutes'; exception when check_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub','b4000000-0000-4000-8000-000000000001',true);
delete from public.courses;
do $$ begin
 if (select count(*) from public.study_sessions where course_id is null)<>1 then raise exception 'History lost'; end if;
 if (select weekly_minutes from public.study_goals)<>180 then raise exception 'Goal update failed'; end if;
 begin update public.study_goals set user_id='b4000000-0000-4000-8000-000000000002'; raise exception 'Owner change'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform * from public.study_sessions; raise exception 'Anonymous sessions'; exception when insufficient_privilege then null; end;
 begin perform * from public.study_goals; raise exception 'Anonymous goals'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: private sessions, goals, upsert, course isolation, history preservation, minute validation' as result;
