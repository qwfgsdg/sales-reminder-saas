-- 1. Create Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  is_approved boolean default false,
  role text default 'user', -- 'admin' or 'user'
  created_at timestamp with time zone default now()
);

-- 2. Enable RLS (Security)
alter table public.profiles enable row level security;

-- 3. Create Policies
-- Policy 1: Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using ( auth.uid() = id );

-- Policy 2: Admins can read ALL profiles
create policy "Admins can read all profiles"
  on public.profiles for select
  using ( 
    auth.uid() in (select id from public.profiles where role = 'admin') 
  );

-- Policy 3: Admins can update profiles (to approve users)
create policy "Admins can update profiles"
  on public.profiles for update
  using ( 
    auth.uid() in (select id from public.profiles where role = 'admin') 
  );

-- 4. Create Trigger Function (Auto-create profile on signup)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, is_approved, role)
  values (new.id, new.email, false, 'user');
  return new;
end;
$$ language plpgsql security definer;

-- 5. Attach Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. [CRITICAL] Backfill for Existing Users (Make YOU the Admin)
-- This inserts profiles for current users and sets them as Admin/Approved.
insert into public.profiles (id, email, is_approved, role)
select id, email, true, 'admin' -- FORCE ADMIN for existing users
from auth.users
on conflict (id) do nothing;
