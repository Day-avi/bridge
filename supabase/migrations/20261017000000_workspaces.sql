-- Phase 0: workspaces, members and audit log, all tenant-scoped with RLS.
-- A workspace is one seller's business. Every later table hangs off workspace_id
-- and reuses private.is_workspace_member() in its policies.

create type public.workspace_role as enum ('owner', 'member');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- The primary key covers lookups by workspace; this one covers "my workspaces".
create index members_user_id_idx on public.members (user_id);

create table public.audit_log (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (char_length(action) between 1 and 100),
  target text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_workspace_created_idx on public.audit_log (workspace_id, created_at desc);

-- Helpers live in a schema the Data API does not expose, so they can only be
-- used inside policies and database functions.
create schema if not exists private;
grant usage on schema private to authenticated;

-- security definer so the membership lookup is not itself filtered by the
-- members policy (which would recurse).
create function private.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.workspace_id = ws and m.user_id = (select auth.uid())
  );
$$;

create function private.is_workspace_owner(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.workspace_id = ws and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

revoke all on function private.is_workspace_member(uuid) from public;
revoke all on function private.is_workspace_owner(uuid) from public;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.is_workspace_owner(uuid) to authenticated;

-- Table privileges: signed-out visitors get nothing; signed-in users get only
-- the operations the policies below are written for.
revoke all on public.workspaces, public.members, public.audit_log from anon, authenticated;

grant select on public.workspaces to authenticated;
grant update (name) on public.workspaces to authenticated;

grant select, delete on public.members to authenticated;
grant insert (workspace_id, user_id, role) on public.members to authenticated;
grant update (role) on public.members to authenticated;

grant select on public.audit_log to authenticated;

alter table public.workspaces enable row level security;
alter table public.members enable row level security;
alter table public.audit_log enable row level security;

create policy "members can read their workspaces"
  on public.workspaces for select to authenticated
  using ((select private.is_workspace_member(id)));

create policy "owners can rename their workspaces"
  on public.workspaces for update to authenticated
  using ((select private.is_workspace_owner(id)))
  with check ((select private.is_workspace_owner(id)));

create policy "members can see who is in their workspaces"
  on public.members for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy "owners can add members"
  on public.members for insert to authenticated
  with check ((select private.is_workspace_owner(workspace_id)));

create policy "owners can change member roles"
  on public.members for update to authenticated
  using ((select private.is_workspace_owner(workspace_id)))
  with check ((select private.is_workspace_owner(workspace_id)));

create policy "owners can remove members"
  on public.members for delete to authenticated
  using ((select private.is_workspace_owner(workspace_id)));

create policy "members can read their audit log"
  on public.audit_log for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

-- A workspace must always keep at least one owner.
create function private.keep_one_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role <> 'owner' then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE' and new.role = 'owner' then
    return new;
  end if;
  -- The workspace itself is being deleted (cascade): nothing to protect.
  if not exists (select 1 from public.workspaces w where w.id = old.workspace_id) then
    return old;
  end if;
  if not exists (
    select 1 from public.members m
    where m.workspace_id = old.workspace_id
      and m.role = 'owner'
      and m.user_id <> old.user_id
  ) then
    raise exception 'A workspace must keep at least one owner'
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger members_keep_one_owner
  before update of role or delete on public.members
  for each row execute function private.keep_one_owner();

-- Creating a workspace is the only way in: it makes the caller the owner and
-- records the action, all in one transaction.
create function public.create_workspace(workspace_name text)
returns public.workspaces
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  clean_name text := btrim(workspace_name);
  base_slug text;
  ws public.workspaces;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if clean_name is null or char_length(clean_name) not between 1 and 80 then
    raise exception 'Workspace name must be 1 to 80 characters' using errcode = 'check_violation';
  end if;

  base_slug := left(btrim(regexp_replace(lower(clean_name), '[^a-z0-9]+', '-', 'g'), '-'), 40);
  if base_slug = '' then
    base_slug := 'workspace';
  end if;

  -- A random suffix keeps slugs unique without revealing how many exist.
  for attempt in 1..5 loop
    begin
      insert into public.workspaces (name, slug, created_by)
      values (clean_name, base_slug || '-' || substr(md5(gen_random_uuid()::text), 1, 6), uid)
      returning * into ws;
      exit;
    exception when unique_violation then
      if attempt = 5 then
        raise;
      end if;
    end;
  end loop;

  insert into public.members (workspace_id, user_id, role) values (ws.id, uid, 'owner');
  insert into public.audit_log (workspace_id, actor_id, action, target)
  values (ws.id, uid, 'workspace.created', ws.id::text);

  return ws;
end;
$$;

revoke all on function public.create_workspace(text) from public, anon;
grant execute on function public.create_workspace(text) to authenticated;
