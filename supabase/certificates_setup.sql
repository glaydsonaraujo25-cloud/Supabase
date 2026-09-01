begin;
create table public.certificates (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 course_id uuid,
 title text not null check(length(trim(title)) between 1 and 160),
 institution text not null default '' check(length(institution)<=120),
 hours numeric(8,2) not null default 0 check(hours between 0 and 100000),
 issued_on date,
 file_path text not null unique check(split_part(file_path,'/',1)=user_id::text),
 file_name text not null check(length(file_name) between 1 and 255),
 mime_type text not null check(mime_type in ('application/pdf','image/jpeg','image/png','image/webp')),
 file_size integer not null check(file_size between 1 and 10485760),
 created_at timestamptz not null default now(),
 foreign key(course_id,user_id) references public.courses(id,user_id) on delete set null (course_id)
);
create index certificates_owner_created on public.certificates(user_id,created_at desc);
create index certificates_course_owner on public.certificates(course_id,user_id);
alter table public.certificates enable row level security;
revoke all on public.certificates from anon,authenticated;
grant select,delete on public.certificates to authenticated;
grant insert(user_id,course_id,title,institution,hours,issued_on,file_path,file_name,mime_type,file_size),update(course_id,title,institution,hours,issued_on) on public.certificates to authenticated;
create policy own_read on public.certificates for select to authenticated using ((select auth.uid())=user_id);
create policy own_create on public.certificates for insert to authenticated with check ((select auth.uid())=user_id);
create policy own_edit on public.certificates for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy own_delete on public.certificates for delete to authenticated using ((select auth.uid())=user_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('certificates','certificates',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp']);
create policy certificates_read on storage.objects for select to authenticated using (bucket_id='certificates' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy certificates_upload on storage.objects for insert to authenticated with check (bucket_id='certificates' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy certificates_delete on storage.objects for delete to authenticated using (bucket_id='certificates' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
