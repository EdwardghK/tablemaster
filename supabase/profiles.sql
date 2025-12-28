-- Profiles table for storing user metadata (name, phone, email) alongside auth.users
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- Simple role-based edit request queue so non-admins can request elevated access
create extension if not exists "pgcrypto";

create table if not exists public.edit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  full_name text,
  reason text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_id uuid references auth.users(id),
  reviewer_email text,
  decision_notes text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

create index if not exists idx_edit_requests_user on public.edit_requests(user_id);
create index if not exists idx_edit_requests_status on public.edit_requests(status);

-- Change approval queue for submitted edits (non-admins)
create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  full_name text,
  entity_type text not null, -- e.g., table, menu_item, prefixed_menu
  entity_id text,
  action text not null check (action in ('create', 'update', 'delete', 'availability')),
  before_data jsonb,
  after_data jsonb,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_id uuid references auth.users(id),
  reviewer_email text,
  decision_notes text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

create index if not exists idx_change_requests_status on public.change_requests(status);
create index if not exists idx_change_requests_entity on public.change_requests(entity_type, entity_id);
