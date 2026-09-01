begin;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
-- Clients may only edit presentation fields. IDs and timestamps belong to the database.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "Users can insert own profile" on public.profiles;
-- The trigger, not the browser, creates profiles.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create or replace function public.set_profile_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if length(trim(new.full_name)) < 1 or length(new.full_name) > 120 then
    raise exception 'Invalid profile name';
  end if;
  if new.avatar_url is not null and split_part(new.avatar_url, '/', 1) <> new.id::text then
    raise exception 'Invalid avatar path';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_profile_updated_at() from public, anon, authenticated;
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_profile_updated_at();
-- Backfill only missing profiles without changing existing data.
insert into public.profiles (id, full_name, created_at)
select id, left(trim(coalesce(raw_user_meta_data ->> 'full_name', '')), 120), created_at from auth.users
on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg','image/png','image/webp'];
drop policy if exists "Users can read own avatars" on storage.objects;
create policy "Users can read own avatars" on storage.objects for select to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Users can upload own avatars" on storage.objects;
create policy "Users can upload own avatars" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Users can update own avatars" on storage.objects;
create policy "Users can update own avatars" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Users can delete own avatars" on storage.objects;
create policy "Users can delete own avatars" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
commit;
