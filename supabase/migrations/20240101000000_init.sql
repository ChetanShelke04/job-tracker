// ==============================================================================
-- JOB TRACKER - SUPABASE DATABASE MIGRATION
-- Multi-user HR Calling Tracker & Job Application CRM with Row Level Security (RLS)
-- ==============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Contacts Table
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  company text not null,
  phone text not null,
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
  constraint contacts_user_id_phone_key_key unique (user_id, phone_key)
);

-- Calls Table
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  outcome text not null,
  notes text,
  followup_date date,
  called_at timestamptz not null default now()
);

-- Job Applications Table
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

-- Activities Table
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

-- Indexes
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

-- Updated_at triggers
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
  for each row execute function public.handle_updated_at();

drop trigger if exists set_job_apps_updated_at on public.job_applications;
create trigger set_job_apps_updated_at
  before update on public.job_applications
  for each row execute function public.handle_updated_at();

-- Enable RLS
alter table public.contacts enable row level security;
alter table public.calls enable row level security;
alter table public.job_applications enable row level security;
alter table public.activities enable row level security;

-- Contacts RLS Policies
drop policy if exists "contacts_select_policy" on public.contacts;
create policy "contacts_select_policy" on public.contacts for select using (auth.uid() = user_id);

drop policy if exists "contacts_insert_policy" on public.contacts;
create policy "contacts_insert_policy" on public.contacts for insert with check (auth.uid() = user_id);

drop policy if exists "contacts_update_policy" on public.contacts;
create policy "contacts_update_policy" on public.contacts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "contacts_delete_policy" on public.contacts;
create policy "contacts_delete_policy" on public.contacts for delete using (auth.uid() = user_id);

-- Calls RLS Policies
drop policy if exists "calls_select_policy" on public.calls;
create policy "calls_select_policy" on public.calls for select using (auth.uid() = user_id);

drop policy if exists "calls_insert_policy" on public.calls;
create policy "calls_insert_policy" on public.calls for insert with check (
  auth.uid() = user_id and
  exists (select 1 from public.contacts c where c.id = calls.contact_id and c.user_id = auth.uid())
);

drop policy if exists "calls_update_policy" on public.calls;
create policy "calls_update_policy" on public.calls for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "calls_delete_policy" on public.calls;
create policy "calls_delete_policy" on public.calls for delete using (auth.uid() = user_id);

-- Job Applications RLS Policies
drop policy if exists "job_apps_select_policy" on public.job_applications;
create policy "job_apps_select_policy" on public.job_applications for select using (auth.uid() = user_id);

drop policy if exists "job_apps_insert_policy" on public.job_applications;
create policy "job_apps_insert_policy" on public.job_applications for insert with check (auth.uid() = user_id);

drop policy if exists "job_apps_update_policy" on public.job_applications;
create policy "job_apps_update_policy" on public.job_applications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "job_apps_delete_policy" on public.job_applications;
create policy "job_apps_delete_policy" on public.job_applications for delete using (auth.uid() = user_id);

-- Activities RLS Policies
drop policy if exists "activities_select_policy" on public.activities;
create policy "activities_select_policy" on public.activities for select using (auth.uid() = user_id);

drop policy if exists "activities_insert_policy" on public.activities;
create policy "activities_insert_policy" on public.activities for insert with check (auth.uid() = user_id);

drop policy if exists "activities_update_policy" on public.activities;
create policy "activities_update_policy" on public.activities for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "activities_delete_policy" on public.activities;
create policy "activities_delete_policy" on public.activities for delete using (auth.uid() = user_id);

-- log_call transactional function
create or replace function public.log_call(
  p_contact_id uuid,
  p_outcome text,
  p_notes text default null,
  p_followup date default null
)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_user_id uuid := auth.uid();
  v_call_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.contacts
    where id = p_contact_id and user_id = v_user_id and deleted_at is null
  ) then
    raise exception 'Contact not found or unauthorized';
  end if;

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

  update public.contacts
  set
    status = p_outcome,
    last_call_at = now(),
    followup_date = coalesce(p_followup, followup_date),
    updated_at = now()
  where id = p_contact_id and user_id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'call_id', v_call_id,
    'contact_id', p_contact_id,
    'outcome', p_outcome,
    'followup_date', p_followup
  );
end;
$$;

grant execute on function public.log_call(uuid, text, text, date) to authenticated;

