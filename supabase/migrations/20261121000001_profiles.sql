-- Gather: profiles
-- One row per account, created automatically when a user signs up.
--
-- username      unique handle chosen at sign-up (3–20 chars: a–z, 0–9, _), case-insensitive.
-- display_name  "Name" from Create profile (required there; NULL until then).
-- date_of_birth optional, private (only the owner can read it).
-- avatar_url    optional, set in Create profile (step 4).
-- availability_updated_at  set when the user edits their free days (later step).

create extension if not exists citext with schema extensions;

create table public.profiles (
  id                      uuid primary key references auth.users (id) on delete cascade,
  username                extensions.citext not null unique
                            constraint username_format check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name            text
                            constraint display_name_length check (char_length(btrim(display_name)) between 1 and 50),
  date_of_birth           date
                            constraint date_of_birth_range check (date_of_birth >= date '1900-01-01'),
  avatar_url              text,
  availability_updated_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.profiles is 'One row per user. Created by the on_auth_user_created trigger.';
comment on column public.profiles.date_of_birth is 'Optional and private: never exposed to friends.';

-- ---------------------------------------------------------------------------
-- Keep updated_at current, and reject birthdays in the future
-- (CHECK constraints cannot use current_date reliably).
-- ---------------------------------------------------------------------------
create function public.profiles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.date_of_birth is not null and new.date_of_birth > current_date then
    raise exception 'date_of_birth cannot be in the future'
      using errcode = 'check_violation';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_before_write
  before insert or update on public.profiles
  for each row execute function public.profiles_before_write();

-- ---------------------------------------------------------------------------
-- Create the profile row when an auth user is created.
-- The username comes from sign-up metadata (options.data.username).
-- Users without one (e.g. Google sign-in later) get "user_" + 8 hex chars.
-- An invalid or taken username makes the sign-up fail (the app checks first).
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
begin
  if wanted = '' then
    wanted := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, username)
  values (new.id, wanted);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts created before this migration (e.g. test users added in the
-- dashboard) get a profile too.
insert into public.profiles (id, username)
select u.id,
       case
         when lower(u.raw_user_meta_data ->> 'username') ~ '^[a-z0-9_]{3,20}$'
          and not exists (select 1 from public.profiles p where p.username = lower(u.raw_user_meta_data ->> 'username'))
         then lower(u.raw_user_meta_data ->> 'username')
         else 'user_' || substr(replace(u.id::text, '-', ''), 1, 8)
       end
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Username availability, callable before sign-in (Sign-up form).
-- Returns only true/false; reveals nothing else.
-- ---------------------------------------------------------------------------
create function public.username_available(name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select name ~ '^[a-z0-9_]{3,20}$'
     and not exists (
       select 1 from public.profiles p
       where p.username = name::extensions.citext
     );
$$;

revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- Trigger functions are not meant to be called directly.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.profiles_before_write() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Signed-out visitors get nothing.
revoke all on public.profiles from anon;

-- Signed-in users: read and update only their own row (friends' visibility
-- comes in the Friends step). Rows are created by the trigger only and
-- deleted only via the auth user (cascade).
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
-- Column-level: id, username, created_at, updated_at cannot be changed by users.
grant update (display_name, date_of_birth, avatar_url, availability_updated_at)
  on public.profiles to authenticated;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
