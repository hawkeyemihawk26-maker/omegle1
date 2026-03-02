-- Run this in your Supabase SQL Editor

-- 1. Create the queue table
create table if not exists queue (
  id uuid default gen_random_uuid() primary key,
  client_id text not null,
  interests text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create the matches table
create table if not exists matches (
  id uuid default gen_random_uuid() primary key,
  host_id text not null,
  peer_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'active'
);

-- 3. Enable Realtime for these tables
alter publication supabase_realtime add table queue;
alter publication supabase_realtime add table matches;

-- 4. Set up RLS (Row Level Security) - Optional for dev but good practice
alter table queue enable row level security;
alter table matches enable row level security;

-- Allow anyone to read/write (since we don't have auth)
create policy "Public Access Queue" on queue for all using (true) with check (true);
create policy "Public Access Matches" on matches for all using (true) with check (true);
