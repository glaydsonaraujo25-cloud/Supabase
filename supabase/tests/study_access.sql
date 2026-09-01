-- Execute in SQL Editor. All test users and records are rolled back.
begin;
insert into auth.users(id,email,raw_user_meta_data,created_at,updated_at) values
('b2000000-0000-4000-8000-000000000001','study-a@example.invalid','{"full_name":"Study A"}',now(),now()),
('b2000000-0000-4000-8000-000000000002','study-b@example.invalid','{"full_name":"Study B"}',now(),now());
set local role authenticated;
select set_config('request.jwt.claim.sub','b2000000-0000-4000-8000-000000000001',true);
insert into public.courses(user_id,title) values ('b2000000-0000-4000-8000-000000000001','Course A');
insert into public.tasks(user_id,course_id,title) select user_id,id,'Task A' from public.courses;
update public.courses set progress=50;
update public.tasks set status='done';
do $$ begin
 if (select count(*) from public.tasks where status='done') <> 1 then raise exception 'Own CRUD failed'; end if;
 begin insert into public.courses(user_id,title) values ('b2000000-0000-4000-8000-000000000002','Forbidden'); raise exception 'Owner spoof allowed'; exception when insufficient_privilege then null; end;
 begin update public.courses set progress=101; raise exception 'Invalid progress allowed'; exception when check_violation then null; end;
end $$;
-- Store the other course ID in a transaction-local setting to test linking.
select set_config('study.test_course',(select id::text from public.courses limit 1),true);
select set_config('request.jwt.claim.sub','b2000000-0000-4000-8000-000000000002',true);
do $$ declare n integer; begin
 if (select count(*) from public.courses) <> 0 or (select count(*) from public.tasks) <> 0 then raise exception 'Read isolation failed'; end if;
 update public.courses set title='Forbidden'; get diagnostics n = row_count; if n<>0 then raise exception 'Cross update allowed'; end if;
 delete from public.tasks; get diagnostics n = row_count; if n<>0 then raise exception 'Cross delete allowed'; end if;
 begin insert into public.tasks(user_id,course_id,title) values ('b2000000-0000-4000-8000-000000000002',current_setting('study.test_course')::uuid,'Forbidden link'); raise exception 'Cross course link allowed'; exception when foreign_key_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub','b2000000-0000-4000-8000-000000000001',true);
delete from public.courses;
do $$ begin if (select count(*) from public.tasks) <> 0 then raise exception 'Cascade failed'; end if; end $$;
reset role;
set local role anon;
do $$ begin
 begin perform * from public.courses; raise exception 'Anon access allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: owner CRUD, isolation, cross-owner foreign key, cascade, anon denied' as result;
