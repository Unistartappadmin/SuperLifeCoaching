-- Run this script inside the Supabase SQL editor or via `supabase db push`.
-- It creates the core tables required for the booking platform together with
-- helper types, triggers, indexes, and RLS policies.

begin;

-- Helper enum for service types to keep the data consistent.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'service_type') then
    create type service_type as enum (
      'free-call',
      'clarifying-session',
      'breakthrough-package',
      'transformational-package'
    );
  end if;
end
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null check (start_time < end_time),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  service_type service_type not null,
  session_date date not null,
  session_time time not null,
  duration integer not null check (duration > 0),
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  stripe_payment_intent_id text,
  google_calendar_event_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_session_idx on public.bookings (session_date, session_time);
create index if not exists bookings_user_idx on public.bookings (user_id);

create table if not exists public.package_sessions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  session_number integer not null check (session_number > 0),
  session_date date,
  session_time time,
  status text not null default 'pending' check (status in ('pending','scheduled','completed','cancelled')),
  google_calendar_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists package_sessions_booking_idx on public.package_sessions (booking_id);

create table if not exists public.integration_tokens (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  token_type text not null default 'oauth',
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_tokens_provider_type_unique unique (provider, token_type)
);

-- Trigger to keep updated_at columns in sync.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_timestamp_users
  before update on public.users
  for each row execute procedure public.set_updated_at();

create trigger set_timestamp_availability_slots
  before update on public.availability_slots
  for each row execute procedure public.set_updated_at();

create trigger set_timestamp_blocked_dates
  before update on public.blocked_dates
  for each row execute procedure public.set_updated_at();

create trigger set_timestamp_bookings
  before update on public.bookings
  for each row execute procedure public.set_updated_at();

create trigger set_timestamp_package_sessions
  before update on public.package_sessions
  for each row execute procedure public.set_updated_at();

create trigger set_timestamp_integration_tokens
  before update on public.integration_tokens
  for each row execute procedure public.set_updated_at();

-- Enable Row Level Security everywhere.
alter table public.users enable row level security;
alter table public.availability_slots enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.bookings enable row level security;
alter table public.package_sessions enable row level security;
alter table public.integration_tokens enable row level security;

-- Users: an authenticated user can manage their own profile.
create policy if not exists "Users can view self"
  on public.users
  for select
  using (auth.uid() = id);

create policy if not exists "Users can update self"
  on public.users
  for update
  using (auth.uid() = id);

create policy if not exists "Users can insert self"
  on public.users
  for insert
  with check (auth.uid() = id);

-- Availability slots & blocked dates:
-- everyone can read (booking UI needs it), only service_role can write.
create policy if not exists "Availability readable by anyone"
  on public.availability_slots
  for select
  using (true);

create policy if not exists "Availability managed by service role"
  on public.availability_slots
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "Blocked dates readable by anyone"
  on public.blocked_dates
  for select
  using (true);

create policy if not exists "Blocked dates managed by service role"
  on public.blocked_dates
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Bookings: authenticated users can manage their own records, service role can do anything.
create policy if not exists "Bookings readable by owner"
  on public.bookings
  for select
  using (auth.uid() = user_id);

create policy if not exists "Bookings insert by owner"
  on public.bookings
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "Bookings update by owner"
  on public.bookings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Bookings deletable by owner"
  on public.bookings
  for delete
  using (auth.uid() = user_id);

create policy if not exists "Bookings managed by service role"
  on public.bookings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Package sessions follow the parent booking ownership.
create policy if not exists "Package sessions readable by owner"
  on public.package_sessions
  for select
  using (
    exists (
      select 1
      from public.bookings b
      where b.id = package_sessions.booking_id
        and b.user_id = auth.uid()
    )
  );

create policy if not exists "Package sessions manageable by owner"
  on public.package_sessions
  for all
  using (
    exists (
      select 1
      from public.bookings b
      where b.id = package_sessions.booking_id
        and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.bookings b
      where b.id = package_sessions.booking_id
        and b.user_id = auth.uid()
    )
  );

create policy if not exists "Package sessions managed by service role"
  on public.package_sessions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Integration tokens accessible only to privileged service clients.
create policy if not exists "Integration tokens managed by service role"
  on public.integration_tokens
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

commit;
