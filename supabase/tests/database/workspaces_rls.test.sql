-- Tenant isolation tests for workspaces, members and audit_log.
-- Each operation has an allowed case and a denied case.
begin;
create extension if not exists pgtap with schema extensions;

select plan(37);

-- Fixtures: Asha owns workspace A, Ben owns workspace B, Chitra is a plain member of A.
insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-0000-0000-00000000000a', 'asha@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'ben@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000c', 'chitra@example.com', 'authenticated', 'authenticated');

-- Helpers live in a throwaway schema; the whole file runs in a rolled-back transaction.
create schema tests;

-- RESET ROLE first so switching between users always starts from the test runner.
create function tests.act_as(uid uuid) returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create function tests.act_as_anon() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end;
$$;

grant usage on schema tests to authenticated, anon;
grant execute on all functions in schema tests to authenticated, anon;

select tests.act_as('00000000-0000-0000-0000-00000000000a');
select lives_ok($$ select public.create_workspace('Asha Handlooms') $$, 'Asha can create a workspace');
select tests.act_as('00000000-0000-0000-0000-00000000000b');
select lives_ok($$ select public.create_workspace('Ben''s Jewellery!') $$, 'Ben can create a workspace');

reset role;
create table tests.ids as
  select (select id from public.workspaces where created_by = '00000000-0000-0000-0000-00000000000a') as a,
         (select id from public.workspaces where created_by = '00000000-0000-0000-0000-00000000000b') as b;
grant select on tests.ids to authenticated, anon;
insert into public.members (workspace_id, user_id, role)
  select a, '00000000-0000-0000-0000-00000000000c', 'member' from tests.ids;

-- create_workspace wiring
select matches((select slug from public.workspaces where id = (select a from tests.ids)),
  '^asha-handlooms-[a-f0-9]{6}$', 'slug is derived from the name');
select is((select role::text from public.members where workspace_id = (select a from tests.ids)
  and user_id = '00000000-0000-0000-0000-00000000000a'), 'owner', 'creator becomes owner');
select is((select count(*)::int from public.audit_log where workspace_id = (select a from tests.ids)
  and action = 'workspace.created'), 1, 'creation is audited');

-- workspaces: select
select tests.act_as('00000000-0000-0000-0000-00000000000a');
select results_eq($$ select name from public.workspaces $$, array['Asha Handlooms'],
  'ALLOWED: Asha sees only her own workspace');
select is_empty($$ select 1 from public.workspaces where id = (select b from tests.ids) $$,
  'DENIED: Asha cannot read Ben''s workspace');

-- workspaces: update
select lives_ok($$ update public.workspaces set name = 'Asha Weaves' where id = (select a from tests.ids) $$,
  'ALLOWED: owner renames her workspace');
select is((select name from public.workspaces where id = (select a from tests.ids)), 'Asha Weaves', 'rename took effect');
update public.workspaces set name = 'Hacked' where id = (select b from tests.ids);
select tests.act_as('00000000-0000-0000-0000-00000000000b');
select is((select name from public.workspaces where id = (select b from tests.ids)), 'Ben''s Jewellery!',
  'DENIED: Asha''s update of Ben''s workspace changed nothing');
select throws_ok($$ update public.workspaces set slug = 'taken' where id = (select b from tests.ids) $$,
  '42501', null, 'DENIED: even an owner cannot change the slug');

select tests.act_as('00000000-0000-0000-0000-00000000000c');
update public.workspaces set name = 'Chitra was here' where id = (select a from tests.ids);
select tests.act_as('00000000-0000-0000-0000-00000000000a');
select is((select name from public.workspaces where id = (select a from tests.ids)), 'Asha Weaves',
  'DENIED: a plain member cannot rename the workspace');

-- workspaces: insert and delete
select throws_ok($$ insert into public.workspaces (name, slug) values ('Direct', 'direct') $$,
  '42501', null, 'DENIED: workspaces can only be created through create_workspace');
select throws_ok($$ delete from public.workspaces where id = (select a from tests.ids) $$,
  '42501', null, 'DENIED: nobody can delete a workspace in Phase 0');

-- members: select
select tests.act_as('00000000-0000-0000-0000-00000000000c');
select is((select count(*)::int from public.members where workspace_id = (select a from tests.ids)), 2,
  'ALLOWED: a member sees everyone in her workspace');
select is_empty($$ select 1 from public.members where workspace_id = (select b from tests.ids) $$,
  'DENIED: a member cannot see another workspace''s members');

-- members: insert
select throws_ok($$ insert into public.members (workspace_id, user_id) values ((select b from tests.ids), '00000000-0000-0000-0000-00000000000c') $$,
  '42501', null, 'DENIED: Chitra cannot add herself to Ben''s workspace');
select throws_ok($$ insert into public.members (workspace_id, user_id) values ((select a from tests.ids), '00000000-0000-0000-0000-00000000000b') $$,
  '42501', null, 'DENIED: a plain member cannot add people');
select tests.act_as('00000000-0000-0000-0000-00000000000a');
select lives_ok($$ insert into public.members (workspace_id, user_id) values ((select a from tests.ids), '00000000-0000-0000-0000-00000000000b') $$,
  'ALLOWED: owner adds Ben to her workspace');
select tests.act_as('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from public.workspaces), 2, 'Ben now sees both workspaces');
select tests.act_as('00000000-0000-0000-0000-00000000000a');
delete from public.members where workspace_id = (select a from tests.ids) and user_id = '00000000-0000-0000-0000-00000000000b';

-- members: update
select tests.act_as('00000000-0000-0000-0000-00000000000c');
update public.members set role = 'owner' where workspace_id = (select a from tests.ids) and user_id = '00000000-0000-0000-0000-00000000000c';
select is((select role::text from public.members where workspace_id = (select a from tests.ids)
  and user_id = '00000000-0000-0000-0000-00000000000c'), 'member', 'DENIED: a member cannot promote herself');
select tests.act_as('00000000-0000-0000-0000-00000000000a');
select lives_ok($$ update public.members set role = 'owner' where workspace_id = (select a from tests.ids) and user_id = '00000000-0000-0000-0000-00000000000c' $$,
  'ALLOWED: owner promotes a member');
select is((select role::text from public.members where workspace_id = (select a from tests.ids)
  and user_id = '00000000-0000-0000-0000-00000000000c'), 'owner', 'promotion took effect');
select lives_ok($$ update public.members set role = 'member' where workspace_id = (select a from tests.ids) and user_id = '00000000-0000-0000-0000-00000000000c' $$,
  'ALLOWED: owner demotes a co-owner');
select throws_ok($$ update public.members set role = 'member' where workspace_id = (select a from tests.ids) and user_id = '00000000-0000-0000-0000-00000000000a' $$,
  '23514', null, 'DENIED: the last owner cannot demote herself');
select throws_ok($$ update public.members set user_id = '00000000-0000-0000-0000-00000000000b' where workspace_id = (select a from tests.ids) $$,
  '42501', null, 'DENIED: membership rows cannot be moved to another user');

-- members: delete
select tests.act_as('00000000-0000-0000-0000-00000000000b');
delete from public.members where workspace_id = (select a from tests.ids);
select tests.act_as('00000000-0000-0000-0000-00000000000a');
select is((select count(*)::int from public.members where workspace_id = (select a from tests.ids)), 2,
  'DENIED: Ben''s delete of Asha''s members removed nothing');
select throws_ok($$ delete from public.members where workspace_id = (select a from tests.ids) and user_id = '00000000-0000-0000-0000-00000000000a' $$,
  '23514', null, 'DENIED: the last owner cannot be removed');
select lives_ok($$ delete from public.members where workspace_id = (select a from tests.ids) and user_id = '00000000-0000-0000-0000-00000000000c' $$,
  'ALLOWED: owner removes a member');
select tests.act_as('00000000-0000-0000-0000-00000000000c');
select is_empty($$ select 1 from public.workspaces $$, 'a removed member loses access immediately');

-- audit_log
select tests.act_as('00000000-0000-0000-0000-00000000000a');
select is((select count(*)::int from public.audit_log), 1, 'ALLOWED: Asha reads her own audit log');
select is_empty($$ select 1 from public.audit_log where workspace_id = (select b from tests.ids) $$,
  'DENIED: Asha cannot read Ben''s audit log');
select throws_ok($$ insert into public.audit_log (workspace_id, action) values ((select a from tests.ids), 'forged') $$,
  '42501', null, 'DENIED: users cannot write audit entries directly');
select throws_ok($$ update public.audit_log set action = 'edited' $$,
  '42501', null, 'DENIED: audit entries cannot be edited');
select throws_ok($$ delete from public.audit_log $$,
  '42501', null, 'DENIED: audit entries cannot be deleted');

-- signed-out visitors
select tests.act_as_anon();
select throws_ok($$ select 1 from public.workspaces $$, '42501', null, 'DENIED: signed-out visitors cannot read workspaces');
select throws_ok($$ select public.create_workspace('Anon shop') $$, '42501', null,
  'DENIED: signed-out visitors cannot create workspaces');

select * from finish();
rollback;
