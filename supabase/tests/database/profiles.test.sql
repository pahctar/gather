-- RLS and trigger tests for public.profiles.
-- Run against a local Supabase stack with:  supabase test db
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(23);

-- Two users, created the way Supabase Auth does it.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'mild@example.com', '{"username":"Mild_01"}'),
  ('22222222-2222-2222-2222-222222222222', 'pop@example.com',  '{"username":"pop"}'),
  ('33333333-3333-3333-3333-333333333333', 'g@example.com',    '{}');

-- Trigger ---------------------------------------------------------------------
select is((select username::text from profiles where id = '11111111-1111-1111-1111-111111111111'),
          'mild_01', 'trigger creates a profile with the lower-cased username');
select is((select display_name from profiles where id = '11111111-1111-1111-1111-111111111111'),
          null, 'display_name starts empty (filled in Create profile)');
select matches((select username::text from profiles where id = '33333333-3333-3333-3333-333333333333'),
          '^user_[0-9a-f]{8}$', 'users without a username get user_xxxxxxxx');

select throws_ok(
  $$insert into auth.users (id, email, raw_user_meta_data)
    values ('44444444-4444-4444-4444-444444444444', 'x@example.com', '{"username":"MILD_01"}')$$,
  '23505', null, 'sign-up fails when the username is taken (case-insensitive)');
select throws_ok(
  $$insert into auth.users (id, email, raw_user_meta_data)
    values ('55555555-5555-5555-5555-555555555555', 'y@example.com', '{"username":"no spaces!"}')$$,
  '23514', null, 'sign-up fails when the username format is invalid');

-- username_available ------------------------------------------------------------
set local role anon;
select is(username_available('mild_01'), false, 'anon: taken username is unavailable');
select is(username_available('newname'), true,  'anon: free username is available');
select is(username_available('ab'),      false, 'anon: too short is unavailable');
select is(username_available('Bad-Name'), false, 'anon: invalid characters are unavailable');

-- Anonymous visitors see nothing ------------------------------------------------
select throws_ok($$select * from profiles$$, '42501', null, 'anon cannot read profiles');
reset role;

-- Signed in as Mild ---------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is((select count(*)::int from profiles), 1, 'a user sees only their own profile');
select is((select username::text from profiles), 'mild_01', '…and it is theirs');

update profiles set display_name = 'Mild', date_of_birth = '2000-02-20'
  where id = '11111111-1111-1111-1111-111111111111';
select is((select display_name from profiles), 'Mild', 'a user can update their own name');

select lives_ok(
  $$update profiles set date_of_birth = null where id = '11111111-1111-1111-1111-111111111111'$$,
  'date of birth is optional (can be cleared)');

update profiles set display_name = 'Hacked' where id = '22222222-2222-2222-2222-222222222222';
reset role;
select is((select display_name from profiles where id = '22222222-2222-2222-2222-222222222222'),
          null, 'a user cannot update someone else''s profile');
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok(
  $$update profiles set username = 'renamed' where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501', null, 'username cannot be changed');
select throws_ok(
  $$update profiles set id = '99999999-9999-9999-9999-999999999999' where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501', null, 'id cannot be changed');
select throws_ok(
  $$insert into profiles (id, username) values ('66666666-6666-6666-6666-666666666666', 'sneaky')$$,
  '42501', null, 'users cannot insert profiles directly');
select throws_ok(
  $$delete from profiles where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501', null, 'users cannot delete profiles');

select throws_ok(
  $$update profiles set display_name = '   ' where id = '11111111-1111-1111-1111-111111111111'$$,
  '23514', null, 'name cannot be blank');
select throws_ok(
  $$update profiles set date_of_birth = current_date + 1 where id = '11111111-1111-1111-1111-111111111111'$$,
  '23514', null, 'date of birth cannot be in the future');
select throws_ok(
  $$update profiles set date_of_birth = '1850-01-01' where id = '11111111-1111-1111-1111-111111111111'$$,
  '23514', null, 'date of birth cannot be before 1900');
reset role;

-- Deleting the auth user removes the profile ----------------------------------------
delete from auth.users where id = '22222222-2222-2222-2222-222222222222';
select is((select count(*)::int from profiles where id = '22222222-2222-2222-2222-222222222222'), 0,
          'deleting the account deletes the profile');

select * from finish();
rollback;
