-- ==============================================================================
-- JOB TRACKER - AUTHENTICATION & PROFILES UPGRADE MIGRATION
-- Multi-user Auth with Profiles, Roles (User / HR), Secure Username Resolution
-- ==============================================================================

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text not null,
  email text not null,
  role text not null default 'user' check (role in ('user', 'hr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive unique indexes for username and email
create unique index if not exists idx_profiles_username_lower on public.profiles(lower(username));
create unique index if not exists idx_profiles_email_lower on public.profiles(lower(email));
create index if not exists idx_profiles_role on public.profiles(role);

-- Updated_at trigger for profiles
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- 2. Trigger on auth.users to automatically create profile on sign up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_full_name text;
  v_username text;
  v_role text;
begin
  -- Extract values from user metadata passed during registration
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  v_role := coalesce(new.raw_user_meta_data->>'role', 'user');

  -- Ensure role is valid
  if v_role not in ('user', 'hr') then
    v_role := 'user';
  end if;

  insert into public.profiles (id, full_name, username, email, role)
  values (
    new.id,
    v_full_name,
    v_username,
    new.email,
    v_role
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    username = excluded.username,
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 3. Row Level Security on profiles
alter table public.profiles enable row level security;

-- Select policy: User can view their own profile, or HR can view profiles
drop policy if exists "profiles_select_policy" on public.profiles;
create policy "profiles_select_policy" on public.profiles
  for select using (
    auth.uid() = id or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'hr'
    )
  );

-- Update policy: User can update their own profile, but CANNOT change role to escalate privileges
drop policy if exists "profiles_update_policy" on public.profiles;
create policy "profiles_update_policy" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id and
    role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- Insert policy: Handled by trigger, fallback for authenticated user
drop policy if exists "profiles_insert_policy" on public.profiles;
create policy "profiles_insert_policy" on public.profiles
  for insert with check (auth.uid() = id);

-- 4. Secure RPC for username login: get_login_email
-- Securely resolves a single username to an email without exposing profiles to anon
create or replace function public.get_login_email(p_username text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text;
begin
  if p_username is null or trim(p_username) = '' then
    return null;
  end if;

  select email into v_email
  from public.profiles
  where lower(username) = lower(trim(p_username))
  limit 1;

  return v_email;
end;
$$;

revoke execute on function public.get_login_email(text) from public;
grant execute on function public.get_login_email(text) to anon, authenticated;

-- 5. Secure RPC to check username availability before registration
create or replace function public.check_username_available(p_username text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_username is null or length(trim(p_username)) < 3 then
    return false;
  end if;

  return not exists (
    select 1 from public.profiles
    where lower(username) = lower(trim(p_username))
  );
end;
$$;

revoke execute on function public.check_username_available(text) from public;
grant execute on function public.check_username_available(text) to anon, authenticated;

-- 6. Role separation for HR-specific tables
-- HR accounts manage recruiter contacts & calling workflows; Users track job applications
drop policy if exists "contacts_select_policy" on public.contacts;
create policy "contacts_select_policy" on public.contacts
  for select using (
    auth.uid() = user_id and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'hr')
  );

drop policy if exists "contacts_insert_policy" on public.contacts;
create policy "contacts_insert_policy" on public.contacts
  for insert with check (
    auth.uid() = user_id and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'hr')
  );

drop policy if exists "contacts_update_policy" on public.contacts;
create policy "contacts_update_policy" on public.contacts
  for update using (
    auth.uid() = user_id and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'hr')
  ) with check (
    auth.uid() = user_id and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'hr')
  );

drop policy if exists "contacts_delete_policy" on public.contacts;
create policy "contacts_delete_policy" on public.contacts
  for delete using (
    auth.uid() = user_id and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'hr')
  );

-- Table grants for profiles
grant select, insert, update on table public.profiles to authenticated;
revoke all on table public.profiles from anon;

-- 7. Safe Migration Backfill for existing auth.users into profiles
insert into public.profiles (id, full_name, username, email, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  u.email,
  case
    when exists (select 1 from public.contacts c where c.user_id = u.id) then 'hr'
    else coalesce(u.raw_user_meta_data->>'role', 'user')
  end
from auth.users u
on conflict (id) do nothing;
