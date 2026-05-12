
-- ============ Roles ============
create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles viewable by authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can read own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can read all roles"
  on public.user_roles for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ Auto-create profile + role on signup ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;

  -- Make the very first signed-up user the admin
  select not exists (select 1 from public.user_roles) into is_first;

  insert into public.user_roles (user_id, role)
  values (new.id, case when is_first then 'admin'::public.app_role else 'user'::public.app_role end)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at trigger for profiles
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

-- ============ Tighten exams + questions RLS ============
drop policy if exists "Public read exams" on public.exams;
drop policy if exists "Public write exams" on public.exams;
drop policy if exists "Public update exams" on public.exams;
drop policy if exists "Public delete exams" on public.exams;

create policy "Authenticated can read exams"
  on public.exams for select
  to authenticated using (true);

create policy "Admins can insert exams"
  on public.exams for insert
  to authenticated with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update exams"
  on public.exams for update
  to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete exams"
  on public.exams for delete
  to authenticated using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Public read questions" on public.questions;
drop policy if exists "Public write questions" on public.questions;
drop policy if exists "Public update questions" on public.questions;
drop policy if exists "Public delete questions" on public.questions;

create policy "Authenticated can read questions"
  on public.questions for select
  to authenticated using (true);

create policy "Admins can insert questions"
  on public.questions for insert
  to authenticated with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update questions"
  on public.questions for update
  to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete questions"
  on public.questions for delete
  to authenticated using (public.has_role(auth.uid(), 'admin'));
