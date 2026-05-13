
-- Ensure the protected admin always has the admin role (if account exists)
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where lower(u.email) = 'dhriti.haringhata@gmail.com'
on conflict (user_id, role) do nothing;

-- Update signup trigger to always promote the protected email to admin
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
  is_protected boolean;
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;

  select not exists (select 1 from public.user_roles) into is_first;
  is_protected := lower(coalesce(new.email, '')) = 'dhriti.haringhata@gmail.com';

  insert into public.user_roles (user_id, role)
  values (
    new.id,
    case when is_first or is_protected then 'admin'::public.app_role else 'user'::public.app_role end
  )
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

-- Make sure trigger exists on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Grant admin to a user by email (admin only)
create or replace function public.grant_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'Only admins can grant admin role';
  end if;

  select id into target_id from auth.users where lower(email) = lower(target_email) limit 1;
  if target_id is null then
    raise exception 'No user found with email %', target_email;
  end if;

  insert into public.user_roles (user_id, role)
  values (target_id, 'admin'::public.app_role)
  on conflict (user_id, role) do nothing;
end;
$$;

-- Revoke admin (cannot revoke yourself; cannot revoke protected email)
create or replace function public.revoke_admin(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_email text;
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'Only admins can revoke admin role';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'You cannot revoke your own admin role';
  end if;

  select email into target_email from auth.users where id = target_user_id;
  if lower(coalesce(target_email, '')) = 'dhriti.haringhata@gmail.com' then
    raise exception 'Cannot revoke the protected admin';
  end if;

  delete from public.user_roles where user_id = target_user_id and role = 'admin'::public.app_role;
end;
$$;

-- List users with email + role (admin only)
create or replace function public.list_users()
returns table(user_id uuid, email text, display_name text, is_admin boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'Only admins can list users';
  end if;

  return query
  select
    u.id,
    u.email::text,
    p.display_name,
    exists(select 1 from public.user_roles r where r.user_id = u.id and r.role = 'admin'::public.app_role) as is_admin
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  order by u.created_at;
end;
$$;

revoke all on function public.grant_admin(text) from public, anon;
revoke all on function public.revoke_admin(uuid) from public, anon;
revoke all on function public.list_users() from public, anon;
grant execute on function public.grant_admin(text) to authenticated;
grant execute on function public.revoke_admin(uuid) to authenticated;
grant execute on function public.list_users() to authenticated;
