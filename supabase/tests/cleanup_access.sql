begin;
insert into auth.users(id,email,raw_user_meta_data,created_at,updated_at) values
('b7000000-0000-4000-8000-000000000001','cleanup-a@example.invalid','{"full_name":"A"}',now(),now()),
('b7000000-0000-4000-8000-000000000002','cleanup-b@example.invalid','{"full_name":"B"}',now(),now());
set local role authenticated;
select set_config('request.jwt.claim.sub','b7000000-0000-4000-8000-000000000001',true);
insert into public.storage_cleanup_claims(bucket_id,path,user_id) values('avatars',auth.uid()::text||'/old.png',auth.uid()),('certificates',auth.uid()::text||'/old.pdf',auth.uid());
do $$ begin
 if public.claim_unused_file('avatars',auth.uid()::text||'/missing.png') then raise exception 'Missing object claimed';end if;
 begin update public.profiles set avatar_url=auth.uid()::text||'/old.png' where id=auth.uid();raise exception 'Claimed avatar linked';exception when raise_exception then if sqlerrm<>'file_pending_cleanup' then raise;end if;end;
 begin insert into public.certificates(user_id,title,file_path,file_name,mime_type,file_size) values(auth.uid(),'Test',auth.uid()::text||'/old.pdf','old.pdf','application/pdf',5);raise exception 'Claimed certificate linked';exception when raise_exception then if sqlerrm<>'file_pending_cleanup' then raise;end if;end;
end $$;
select set_config('request.jwt.claim.sub','b7000000-0000-4000-8000-000000000002',true);
do $$ begin
 if exists(select 1 from public.storage_cleanup_claims) then raise exception 'Claim leak';end if;
 begin perform public.claim_unused_file('avatars','b7000000-0000-4000-8000-000000000001/old.png');raise exception 'Cross claim';exception when raise_exception then if sqlerrm<>'not_allowed' then raise;end if;end;
end $$;
reset role;
rollback;
select 'PASS: cleanup isolation and prevention of linking reserved files; no Storage metadata mutated' as result;
