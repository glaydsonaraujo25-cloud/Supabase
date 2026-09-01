-- SQL Editor: tests run in a transaction and leave no records.
begin;
insert into auth.users(id,email,raw_user_meta_data,created_at,updated_at) values
('b3000000-0000-4000-8000-000000000001','cert-a@example.invalid','{"full_name":"A"}',now(),now()),
('b3000000-0000-4000-8000-000000000002','cert-b@example.invalid','{"full_name":"B"}',now(),now());
set local role authenticated;
select set_config('request.jwt.claim.sub','b3000000-0000-4000-8000-000000000001',true);
insert into public.courses(user_id,title) values(auth.uid(),'Certificate test');
select set_config('study.test_course',(select id::text from public.courses limit 1),true);
insert into public.certificates(user_id,course_id,title,file_path,file_name,mime_type,file_size)
values(auth.uid(),current_setting('study.test_course')::uuid,'Test',auth.uid()::text||'/test.pdf','test.pdf','application/pdf',5);
insert into storage.objects(bucket_id,name) values('certificates',auth.uid()::text||'/test.pdf');
update public.certificates set title='Updated';
do $$ begin
 if (select count(*) from public.certificates where title='Updated')<>1 then raise exception 'Own CRUD failed'; end if;
 begin update public.certificates set file_path='changed'; raise exception 'File path mutation allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','b3000000-0000-4000-8000-000000000002',true);
do $$ declare n integer; begin
 if exists(select 1 from public.certificates) then raise exception 'Certificate read leak'; end if;
 if exists(select 1 from storage.objects where bucket_id='certificates') then raise exception 'Storage read leak'; end if;
 update public.certificates set title='Forbidden'; get diagnostics n=row_count; if n<>0 then raise exception 'Cross update'; end if;
 delete from public.certificates; get diagnostics n=row_count; if n<>0 then raise exception 'Cross delete'; end if;
 begin insert into storage.objects(bucket_id,name) values('certificates','b3000000-0000-4000-8000-000000000001/forbidden.pdf'); raise exception 'Cross upload'; exception when insufficient_privilege then null; end;
 begin insert into public.certificates(user_id,course_id,title,file_path,file_name,mime_type,file_size) values(auth.uid(),current_setting('study.test_course')::uuid,'Bad',auth.uid()::text||'/bad.pdf','bad.pdf','application/pdf',5); raise exception 'Cross course'; exception when foreign_key_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub','b3000000-0000-4000-8000-000000000001',true);
delete from public.courses;
do $$ begin
 if (select count(*) from public.certificates where course_id is null)<>1 then raise exception 'Certificate lost with course'; end if;
end $$;
delete from public.certificates;
reset role;
do $$ begin if (select public from storage.buckets where id='certificates') then raise exception 'Public bucket'; end if; end $$;
set local role anon;
do $$ begin
 begin perform * from public.certificates; raise exception 'Anonymous access'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: certificate ownership, private storage, cross-course protection, course deletion preservation, anonymous denial' as result;
