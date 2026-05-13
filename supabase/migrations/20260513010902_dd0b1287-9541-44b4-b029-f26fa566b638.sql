create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  is_first boolean;
  is_protected boolean;
  email_lower text;
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;

  email_lower := lower(coalesce(new.email, ''));
  select not exists (select 1 from public.user_roles) into is_first;
  is_protected := email_lower in ('dhriti.haringhata@gmail.com', 'dhriti@admin.app');

  insert into public.user_roles (user_id, role)
  values (
    new.id,
    case when is_first or is_protected then 'admin'::public.app_role else 'user'::public.app_role end
  )
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();