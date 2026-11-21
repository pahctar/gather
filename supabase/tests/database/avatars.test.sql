-- RLS tests for the avatars storage bucket.
-- Run against a local Supabase stack with:  supabase test db
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

select is((select public from storage.buckets where id = 'avatars'), true, 'avatars bucket exists and is public');
select is((select file_size_limit from storage.buckets where id = 'avatars'), 5242880::bigint, 'files are limited to 5 MB');
select is((select allowed_mime_types from storage.buckets where id = 'avatars'),
          array['image/jpeg', 'image/png', 'image/webp'], 'only JPG, PNG and WebP are allowed');

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'mild@example.com', '{"username":"mild"}'),
  ('22222222-2222-2222-2222-222222222222', 'pop@example.com',  '{"username":"pop"}');

-- Pop already has an avatar.
insert into storage.objects (bucket_id, name, owner)
values ('avatars', '22222222-2222-2222-2222-222222222222/avatar.jpg', '22222222-2222-2222-2222-222222222222');

-- Signed in as Mild -------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('avatars', '11111111-1111-1111-1111-111111111111/avatar-1.jpg')$$,
  'a user can upload into their own folder');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('avatars', '22222222-2222-2222-2222-222222222222/evil.jpg')$$,
  '42501', null, 'a user cannot upload into someone else''s folder');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('avatars', 'avatar.jpg')$$,
  '42501', null, 'a user cannot upload outside a folder');

delete from storage.objects where name = '22222222-2222-2222-2222-222222222222/avatar.jpg';
update storage.objects set name = '11111111-1111-1111-1111-111111111111/stolen.jpg'
  where name = '22222222-2222-2222-2222-222222222222/avatar.jpg';
select is((select count(*)::int from storage.objects where name like '2222%'), 0,
          'a user cannot see someone else''s files through the API');
reset role;
select is((select count(*)::int from storage.objects where name = '22222222-2222-2222-2222-222222222222/avatar.jpg'), 1,
          'a user cannot delete or move someone else''s avatar');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$delete from storage.objects where name = '11111111-1111-1111-1111-111111111111/avatar-1.jpg'$$,
  'a user can delete their own avatar');
reset role;

select * from finish();
rollback;
