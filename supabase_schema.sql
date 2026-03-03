-- Run this in your Supabase SQL Editor

-- Run this in your Supabase SQL Editor to reset and update your database

-- 1. Drop existing tables to start fresh (this avoids column mismatch errors)
drop table if exists queue;
drop table if exists matches;

-- 2. Create the queue table with new fields
create table queue (
  id uuid default gen_random_uuid() primary key,
  client_id text not null,
  display_name text,
  gender text,
  interests text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create the matches table with new fields
create table matches (
  id uuid default gen_random_uuid() primary key,
  host_id text not null,
  host_name text,
  host_gender text,
  peer_id text not null,
  peer_name text,
  peer_gender text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'active'
);

-- 4. Enable Realtime (Only if not already enabled)
-- We use a DO block to safely handle the publication part
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'queue'
  ) then
    alter publication supabase_realtime add table queue;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table matches;
  end if;
end $$;

-- 5. Set up RLS
alter table queue enable row level security;
alter table matches enable row level security;

create policy "Public Access Queue" on queue for all using (true) with check (true);
create policy "Public Access Matches" on matches for all using (true) with check (true);
