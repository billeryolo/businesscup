-- ReadBuddy schema. Run once in the Supabase SQL editor (see docs/SETUP.md).
-- Every table is private to the signed-in parent through row-level security.

-- One row per parent account, created on sign-up.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Consent to have the child's voice processed by the browser's speech service.
  consent_version text,
  consent_at timestamptz,
  -- Interest test: the plan the parent chose at the paywall (no charge during the beta).
  trial_plan text check (trial_plan in ('yearly', 'monthly')),
  trial_requested_at timestamptz
);

alter table public.profiles enable row level security;

create policy "Parents manage their own profile" on public.profiles
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Children a parent checks (the app allows up to three).
create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 40),
  grade smallint not null check (grade between 1 and 4),
  created_at timestamptz not null default now()
);

create index children_parent_idx on public.children (parent_id);

alter table public.children enable row level security;

create policy "Parents manage their own children" on public.children
  for all to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));

-- One-minute readings. No audio and no transcript: only the scores and, per attempted word,
-- whether it was read correctly (c), misread (m) or skipped (s).
create table public.readings (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  read_at timestamptz not null default now(),
  passage_id text not null,
  grade smallint not null check (grade between 1 and 4),
  season text not null check (season in ('fall', 'winter', 'spring')),
  mode text not null check (mode in ('live', 'manual', 'demo')),
  seconds real not null check (seconds > 0 and seconds <= 60),
  attempted integer not null check (attempted >= 0),
  errors integer not null check (errors >= 0 and errors <= attempted),
  wcpm integer not null check (wcpm between 0 and 400),
  accuracy real not null check (accuracy between 0 and 1),
  verdict text not null check (verdict in ('onTrack', 'practice', 'talkToTeacher')),
  band text not null,
  patterns text[] not null default '{}',
  word_statuses text not null default '' check (word_statuses ~ '^[cms]*$'),
  summary jsonb
);

create index readings_child_idx on public.readings (child_id, read_at desc);
create index readings_parent_idx on public.readings (parent_id);

alter table public.readings enable row level security;

create policy "Parents read their own readings" on public.readings
  for select to authenticated
  using (parent_id = (select auth.uid()));

create policy "Parents add readings for their own children" on public.readings
  for insert to authenticated
  with check (
    parent_id = (select auth.uid())
    and exists (select 1 from public.children c where c.id = child_id and c.parent_id = (select auth.uid()))
  );

create policy "Parents update their own readings" on public.readings
  for update to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));

create policy "Parents delete their own readings" on public.readings
  for delete to authenticated
  using (parent_id = (select auth.uid()));

-- Interest test: every "start free trial" click, signed in or not. Write-only for the app;
-- read the numbers in the Supabase dashboard.
create table public.trial_interest (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  plan text not null check (plan in ('yearly', 'monthly')),
  grade smallint check (grade between 1 and 4),
  verdict text check (verdict in ('onTrack', 'practice', 'talkToTeacher')),
  user_id uuid default auth.uid() references auth.users (id) on delete set null
);

alter table public.trial_interest enable row level security;

create policy "Anyone can record interest" on public.trial_interest
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

-- Lets a parent delete their account; everything above cascades from auth.users.
create function public.delete_my_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = (select auth.uid());
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
