begin;
insert into auth.users(id,email,raw_user_meta_data,created_at,updated_at) values
('b5000000-0000-4000-8000-000000000001','repeat-a@example.invalid','{"full_name":"A"}',now(),now()),
('b5000000-0000-4000-8000-000000000002','repeat-b@example.invalid','{"full_name":"B"}',now(),now());
set local role authenticated;
select set_config('request.jwt.claim.sub','b5000000-0000-4000-8000-000000000001',true);
insert into public.tasks(user_id,title,due_date,repeat_days) values(auth.uid(),'Daily','2024-02-29',1),(auth.uid(),'Weekly','2024-12-30',7);
update public.tasks set status='done';
do $$ begin
 if (select count(*) from public.tasks)<>4 then raise exception 'Spawn failed'; end if;
 if not exists(select 1 from public.tasks where title='Daily' and due_date='2024-03-01' and status='pending') then raise exception 'Leap day failed'; end if;
 if not exists(select 1 from public.tasks where title='Weekly' and due_date='2025-01-06' and status='pending') then raise exception 'Weekly failed'; end if;
end $$;
update public.tasks set status='pending' where recurrence_spawned;
update public.tasks set status='done' where recurrence_spawned;
do $$ begin
 if (select count(*) from public.tasks)<>4 then raise exception 'Duplicate recurrence'; end if;
 begin update public.tasks set recurrence_spawned=false; raise exception 'Internal flag writable'; exception when insufficient_privilege then null; end;
 begin insert into public.tasks(user_id,title,repeat_days) values(auth.uid(),'No date',1); raise exception 'Missing date allowed'; exception when check_violation then null; end;
end $$;
insert into public.study_sessions(id,user_id,studied_on,minutes) values(gen_random_uuid(),auth.uid(),current_date,25);
update public.study_sessions set minutes=50,note='Updated';
select set_config('request.jwt.claim.sub','b5000000-0000-4000-8000-000000000002',true);
do $$ declare n integer; begin
 if exists(select 1 from public.tasks) then raise exception 'Task leak'; end if;
 update public.study_sessions set minutes=1;get diagnostics n=row_count;if n<>0 then raise exception 'Cross session edit'; end if;
 update public.tasks set status='done';get diagnostics n=row_count;if n<>0 then raise exception 'Cross task completion'; end if;
end $$;
reset role;
rollback;
select 'PASS: recurrence daily/weekly, no duplicates after reopen, protected flags, dates, session edit isolation' as result;
