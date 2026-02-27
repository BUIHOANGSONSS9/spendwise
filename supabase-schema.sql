-- SpendWise Schema
-- Chạy file này trong Supabase Dashboard > SQL Editor

-- 1. Bảng categories
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon text default '💰',
  color text default '#6366f1',
  type text check (type in ('income', 'expense')) not null,
  created_at timestamptz default now()
);
alter table categories enable row level security;
create policy "Users manage own categories" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Bảng transactions
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  type text check (type in ('income', 'expense')) not null,
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);
alter table transactions enable row level security;
create policy "Users manage own transactions" on transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Bảng budgets
create table if not exists budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  month integer not null check (month between 1 and 12),
  year integer not null,
  created_at timestamptz default now(),
  unique(user_id, category_id, month, year)
);
alter table budgets enable row level security;
create policy "Users manage own budgets" on budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
