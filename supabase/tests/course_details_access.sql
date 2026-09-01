begin;
insert into auth.users(id,email,raw_user_meta_data,created_at,updated_at) values
('c3000000-0000-4000-8000-000000000001','detail-a@example.invalid','{"full_name":"A"}',now(),now()),
('c3000000-0000-4000-8000-000000000002','detail-b@example.invalid','{"full_name":"B"}',now(),now());
insert into public.courses(id,user_id,title,progress,auto_progress) values
('c3000000-0000-4000-8000-000000000010','c3000000-0000-4000-8000-000000000001','Test',40,true);
insert into public.course_modules(id,user_id,course_id,title) values
('c3000000-0000-4000-8000-000000000020','c3000000-0000-4000-8000-000000000001','c3000000-0000-4000-8000-000000000010','Module');
set local role authenticated;
select set_config('request.jwt.claim.sub','c3000000-0000-4000-8000-000000000001',true);
insert into public.course_lessons(user_id,course_id,module_id,title,completed) values
('c3000000-0000-4000-8000-000000000001','c3000000-0000-4000-8000-000000000010','c3000000-0000-4000-8000-000000000020','One',true),
('c3000000-0000-4000-8000-000000000001','c3000000-0000-4000-8000-000000000010','c3000000-0000-4000-8000-000000000020','Two',false);
insert into public.course_notes(user_id,course_id,title,body) values
('c3000000-0000-4000-8000-000000000001','c3000000-0000-4000-8000-000000000010','Note','Private text');
do $$ begin if (select progress from public.study_courses where title='Test') <> 50 then raise exception 'Auto progress incorrect'; end if; end $$;
update public.course_lessons set completed=true;
do $$ begin if (select progress from public.study_courses where title='Test') <> 100 then raise exception 'Completion incorrect'; end if; end $$;
update public.courses set auto_progress=false;
do $$ begin if (select progress from public.study_courses where title='Test') <> 40 then raise exception 'Manual value lost'; end if; end $$;
update public.courses set auto_progress=true;
select set_config('request.jwt.claim.sub','c3000000-0000-4000-8000-000000000002',true);
do $$ declare n integer; begin
 if (select count(*) from public.study_courses)<>0 or (select count(*) from public.course_modules)<>0 or (select count(*) from public.course_lessons)<>0 or (select count(*) from public.course_notes)<>0 then raise exception 'Isolation failed'; end if;
 update public.course_lessons set completed=false; get diagnostics n=row_count; if n<>0 then raise exception 'Cross update allowed'; end if;
 delete from public.course_notes; get diagnostics n=row_count; if n<>0 then raise exception 'Cross delete allowed'; end if;
 begin insert into public.course_notes(user_id,course_id,title) values ('c3000000-0000-4000-8000-000000000002','c3000000-0000-4000-8000-000000000010','Forbidden'); raise exception 'Cross link allowed'; exception when foreign_key_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub','c3000000-0000-4000-8000-000000000001',true);
delete from public.course_modules;
do $$ begin if (select count(*) from public.course_lessons)<>0 or (select progress from public.study_courses where title='Test')<>0 then raise exception 'Cascade or empty progress incorrect'; end if; end $$;
reset role;
set local role anon;
do $$ begin begin perform * from public.study_courses; raise exception 'Anon view access'; exception when insufficient_privilege then null; end; end $$;
reset role;
rollback;
select 'PASS: auto/manual progress, ownership isolation, cross-course linking, module cascade, private view' as result;
