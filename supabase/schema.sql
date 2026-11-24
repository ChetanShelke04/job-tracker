-- ==============================================================================
-- JOB TRACKER - SUPABASE DATABASE SCHEMA
-- Multi-user HR Calling Tracker & Job Application CRM with Row Level Security (RLS)
-- Cost: ₹0 / Free Tier Compatible
-- Run this in Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. TABLE: profiles (User & HR Account Profiles)
-- ==============================================================================
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

-- ==============================================================================
-- 3. TABLE: contacts (HR / Recruiter Directory)
-- ==============================================================================
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  company text not null,
  phone text not null,
  -- phone_key stores the rightmost 10 digits to normalize phone numbers for deduplication
  phone_key text generated always as (right(regexp_replace(phone, '\D', '', 'g'), 10)) stored,
  email text,
  status text not null default 'Not Called',
  followup_date date,
  interview_date date,
  interview_time text,
  next_action text,
  notes text,
  last_call_at timestamptz,
  deleted_at timestamptz default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Unique constraint per user: two different users may save the same HR number,
  -- but a single user cannot duplicate the same 10-digit phone key.
  constraint contacts_user_id_phone_key_key unique (user_id, phone_key)
);

-- ==============================================================================
-- 3. TABLE: calls (Chronological Call Log History)
-- ==============================================================================
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  outcome text not null,
  notes text,
  followup_date date,
  called_at timestamptz not null default now()
);

-- ==============================================================================
-- 4. TABLE: job_applications (Job Search & Interview Pipeline)
-- ==============================================================================
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company_name text not null,
  job_title text not null,
  location text,
  job_url text,
  application_date date default current_date,
  expected_ctc numeric,
  offered_ctc numeric,
  application_status text not null default 'Applied',
  interview_date timestamptz,
  recruiter_name text,
  recruiter_phone text,
  notes text,
  deleted_at timestamptz default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 5. TABLE: activities (Scheduled reminders, interviews, tasks)
-- ==============================================================================
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  activity_type text not null default 'followup',
  scheduled_at timestamptz,
  notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 6. INDEXES for fast client-side synchronization and server filtering
-- ==============================================================================
create index if not exists idx_contacts_user_id on public.contacts(user_id);
create index if not exists idx_contacts_user_followup on public.contacts(user_id, followup_date);
create index if not exists idx_contacts_user_status on public.contacts(user_id, status);
create index if not exists idx_contacts_deleted_at on public.contacts(user_id, deleted_at);

create index if not exists idx_calls_user_id on public.calls(user_id);
create index if not exists idx_calls_contact_id on public.calls(contact_id);
create index if not exists idx_calls_called_at on public.calls(called_at desc);

create index if not exists idx_job_apps_user_id on public.job_applications(user_id);
create index if not exists idx_job_apps_status on public.job_applications(user_id, application_status);
create index if not exists idx_job_apps_deleted_at on public.job_applications(user_id, deleted_at);

create index if not exists idx_activities_user_id on public.activities(user_id);
create index if not exists idx_activities_contact_id on public.activities(contact_id);
create index if not exists idx_activities_scheduled on public.activities(scheduled_at);

-- ==============================================================================
-- 7. AUTOMATIC updated_at TRIGGERS
-- ==============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
  before update on public.contacts
  for each row
  execute function public.handle_updated_at();

drop trigger if exists set_job_apps_updated_at on public.job_applications;
create trigger set_job_apps_updated_at
  before update on public.job_applications
  for each row
  execute function public.handle_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Automatic profile creation on auth.users registration
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
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  v_role := coalesce(new.raw_user_meta_data->>'role', 'user');

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

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict multi-tenant isolation: every operation requires user_id = auth.uid()
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.calls enable row level security;
alter table public.job_applications enable row level security;
alter table public.activities enable row level security;

-- Profiles Policies
drop policy if exists "profiles_select_policy" on public.profiles;
create policy "profiles_select_policy" on public.profiles
  for select using (
    auth.uid() = id or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'hr')
  );

drop policy if exists "profiles_update_policy" on public.profiles;
create policy "profiles_update_policy" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id and
    role = (select p.role from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "profiles_insert_policy" on public.profiles;
create policy "profiles_insert_policy" on public.profiles
  for insert with check (auth.uid() = id);

-- Contacts Policies (HR role restricted)
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

-- Calls Policies (Also verifies that referenced contact belongs to current user)
drop policy if exists "calls_select_policy" on public.calls;
create policy "calls_select_policy" on public.calls
  for select using (auth.uid() = user_id);

drop policy if exists "calls_insert_policy" on public.calls;
create policy "calls_insert_policy" on public.calls
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.contacts c
      where c.id = calls.contact_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "calls_update_policy" on public.calls;
create policy "calls_update_policy" on public.calls
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "calls_delete_policy" on public.calls;
create policy "calls_delete_policy" on public.calls
  for delete using (auth.uid() = user_id);

-- Job Applications Policies
drop policy if exists "job_apps_select_policy" on public.job_applications;
create policy "job_apps_select_policy" on public.job_applications
  for select using (auth.uid() = user_id);

drop policy if exists "job_apps_insert_policy" on public.job_applications;
create policy "job_apps_insert_policy" on public.job_applications
  for insert with check (auth.uid() = user_id);

drop policy if exists "job_apps_update_policy" on public.job_applications;
create policy "job_apps_update_policy" on public.job_applications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "job_apps_delete_policy" on public.job_applications;
create policy "job_apps_delete_policy" on public.job_applications
  for delete using (auth.uid() = user_id);

-- Activities Policies
drop policy if exists "activities_select_policy" on public.activities;
create policy "activities_select_policy" on public.activities
  for select using (auth.uid() = user_id);

drop policy if exists "activities_insert_policy" on public.activities;
create policy "activities_insert_policy" on public.activities
  for insert with check (auth.uid() = user_id);

drop policy if exists "activities_update_policy" on public.activities;
create policy "activities_update_policy" on public.activities
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "activities_delete_policy" on public.activities;
create policy "activities_delete_policy" on public.activities
  for delete using (auth.uid() = user_id);

-- ==============================================================================
-- 9. TRANSACTIONAL RPC FUNCTION: log_call
-- Inserts a call log and updates contact's status, last_call_at & followup_date atomically
-- ==============================================================================
create or replace function public.log_call(
  p_contact_id uuid,
  p_outcome text,
  p_notes text default null,
  p_followup date default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_call_id uuid;
begin
  -- 1. Ensure user is authenticated
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- 2. Ensure contact exists and belongs to this user (not soft-deleted)
  if not exists (
    select 1 from public.contacts
    where id = p_contact_id and user_id = v_user_id and deleted_at is null
  ) then
    raise exception 'Contact not found or unauthorized';
  end if;

  -- 3. Insert call history entry
  insert into public.calls (
    user_id,
    contact_id,
    outcome,
    notes,
    followup_date,
    called_at
  )
  values (
    v_user_id,
    p_contact_id,
    p_outcome,
    p_notes,
    p_followup,
    now()
  )
  returning id into v_call_id;

  -- 4. Atomically update contact status, timestamp, and followup date
  update public.contacts
  set
    status = p_outcome,
    last_call_at = now(),
    followup_date = coalesce(p_followup, followup_date),
    updated_at = now()
  where id = p_contact_id and user_id = v_user_id;

  -- 5. Return success payload
  return jsonb_build_object(
    'success', true,
    'call_id', v_call_id,
    'contact_id', p_contact_id,
    'outcome', p_outcome,
    'followup_date', p_followup
  );
end;
$$;

-- Revoke execution from public/anon, grant exclusively to authenticated
revoke execute on function public.log_call(uuid, text, text, date) from public, anon;
grant execute on function public.log_call(uuid, text, text, date) to authenticated;

-- ==============================================================================
-- 10. SECURE USERNAME RESOLUTION & AVAILABILITY FUNCTIONS
-- ==============================================================================
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

-- ==============================================================================
-- 11. LEAST-PRIVILEGE GRANTS FOR SUPABASE ROLES
-- anon: Only USAGE on public schema (cannot select, insert, update, or delete tables)
-- authenticated: SELECT, INSERT, UPDATE, DELETE on tables (enforced by RLS)
-- ==============================================================================
grant usage on schema public to anon, authenticated;

-- Only authenticated users have table-level access (RLS enforces row-level isolation)
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all routines in schema public to authenticated;
revoke all on table public.profiles from anon;

alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
alter default privileges in schema public grant execute on routines to authenticated;

-- ==============================================================================
-- 12. SAFE MIGRATION BACKFILL (Existing Users to Profiles)
-- ==============================================================================
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

-- ==============================================================================
-- 13. MULTI-USER ISOLATION VERIFICATION TEST SNIPPET
-- (Run this snippet in SQL Editor to test and verify RLS isolation between User A & User B)
-- ==============================================================================
/*
DO $$
DECLARE
  user_a uuid := '11111111-1111-1111-1111-111111111111';
  user_b uuid := '22222222-2222-2222-2222-222222222222';
  c_id uuid;
  found_count int;
BEGIN
  -- Insert contact as User A
  INSERT INTO public.contacts (id, user_id, name, company, phone)
  VALUES (gen_random_uuid(), user_a, 'Priya HR', 'TechCorp', '+91 9876543210')
  RETURNING id INTO c_id;

  -- Switch context to User B and try reading User A's contact
  PERFORM set_config('request.jwt.claim.sub', user_b::text, true);

  -- Count rows visible to User B with contact id c_id
  SELECT count(*) INTO found_count FROM public.contacts WHERE id = c_id;

  IF found_count > 0 THEN
    RAISE EXCEPTION 'TEST FAILED: User B was able to read User A contact!';
  ELSE
    RAISE NOTICE 'TEST PASSED: User B cannot see User A data. Row Level Security is active and isolating tenants properly.';
  END IF;

  -- Clean up test row
  DELETE FROM public.contacts WHERE id = c_id;
END;
$$;
*/

