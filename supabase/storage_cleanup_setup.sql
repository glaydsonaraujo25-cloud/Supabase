begin;
create table public.storage_cleanup_claims (
 bucket_id text not null check(bucket_id in ('avatars','certificates')),
 path text not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 claimed_at timestamptz not null default now(),
 primary key(bucket_id,path),
 check(split_part(path,'/',1)=user_id::text)
);
create index cleanup_claims_owner on public.storage_cleanup_claims(user_id);
alter table public.storage_cleanup_claims enable row level security;
revoke all on public.storage_cleanup_claims from anon,authenticated;
grant select,insert on public.storage_cleanup_claims to authenticated;
create policy own_claim on public.storage_cleanup_claims to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create function public.list_unused_files() returns table(bucket_id text,path text,created_at timestamptz) language sql security invoker set search_path='' as $$
 select o.bucket_id,o.name,o.created_at from storage.objects o
 where o.bucket_id in ('avatars','certificates') and split_part(o.name,'/',1)=auth.uid()::text
 and o.created_at<now()-interval '24 hours'
 and not exists(select 1 from public.profiles p where p.id=auth.uid() and o.bucket_id='avatars' and p.avatar_url=o.name)
 and not exists(select 1 from public.certificates c where c.user_id=auth.uid() and o.bucket_id='certificates' and c.file_path=o.name)
 order by o.created_at,o.id limit 100;
$$;
create function public.claim_unused_file(p_bucket text,p_path text) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or split_part(p_path,'/',1)<>auth.uid()::text or p_bucket not in ('avatars','certificates') then raise exception 'not_allowed'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_bucket||':'||p_path,0));
 if not exists(select 1 from storage.objects where bucket_id=p_bucket and name=p_path and created_at<now()-interval '24 hours') then return false; end if;
 if (p_bucket='avatars' and exists(select 1 from public.profiles where id=auth.uid() and avatar_url=p_path)) or
 (p_bucket='certificates' and exists(select 1 from public.certificates where user_id=auth.uid() and file_path=p_path)) then return false; end if;
 insert into public.storage_cleanup_claims(bucket_id,path,user_id) values(p_bucket,p_path,auth.uid()) on conflict do nothing;
 return true;
end;
$$;
create function public.guard_cleanup_reference() returns trigger language plpgsql security invoker set search_path='' as $$
declare target_bucket text; target_path text;
begin
 if tg_table_name='profiles' then target_bucket:='avatars';target_path:=new.avatar_url; else target_bucket:='certificates';target_path:=new.file_path; end if;
 if target_path is null then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended(target_bucket||':'||target_path,0));
 if exists(select 1 from public.storage_cleanup_claims c where c.bucket_id=target_bucket and c.path=target_path) then raise exception 'file_pending_cleanup'; end if;
 return new;
end;
$$;
create trigger guard_avatar_cleanup before insert or update of avatar_url on public.profiles for each row execute function public.guard_cleanup_reference();
create trigger guard_certificate_cleanup before insert or update of file_path on public.certificates for each row execute function public.guard_cleanup_reference();
revoke all on function public.guard_cleanup_reference() from public,anon,authenticated;
revoke all on function public.list_unused_files(),public.claim_unused_file(text,text) from public,anon;
grant execute on function public.list_unused_files(),public.claim_unused_file(text,text) to authenticated;
commit;
