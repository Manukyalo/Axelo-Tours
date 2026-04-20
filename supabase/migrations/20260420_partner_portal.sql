-- ============================================================
-- Phase 13: Enterprise Partner Portal Migration
-- ============================================================

-- Add missing columns to partners table
alter table partners
  add column if not exists annual_pax integer,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists notes text,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text;

-- Group Quotes table
create table if not exists group_quotes (
  id uuid primary key default uuid_generate_v4(),
  partner_id uuid references partners(id) on delete cascade,
  quote_ref text unique not null,
  destination text,
  travel_date date,
  return_date date,
  pax_count integer,
  accommodation_requests jsonb default '[]',
  activities jsonb default '[]',
  transport_included boolean default true,
  total_net_usd numeric(12,2),
  total_sell_usd numeric(12,2),
  margin_usd numeric(12,2),
  margin_pct numeric(5,2),
  valid_until timestamptz,
  status text default 'draft'
    check (status in ('draft','submitted','approved','confirmed','cancelled')),
  line_items jsonb default '[]',
  notes text,
  pdf_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Shore Excursions table
create table if not exists shore_excursions (
  id uuid primary key default uuid_generate_v4(),
  port text not null check (port in ('Mombasa','Zanzibar','Dar es Salaam')),
  name text not null,
  description text,
  duration_hours numeric(4,1),
  price_per_pax_usd numeric(8,2),
  min_pax integer default 10,
  max_pax integer default 200,
  departure_time time,
  return_time time,
  highlights text[],
  images text[] default '{}',
  available boolean default true,
  category text default 'cultural'
    check (category in ('cultural','wildlife','adventure','beach','historical')),
  created_at timestamptz default now()
);

-- Shore Excursion Bookings table
create table if not exists shore_excursion_bookings (
  id uuid primary key default uuid_generate_v4(),
  partner_id uuid references partners(id) on delete cascade,
  excursion_id uuid references shore_excursions(id) on delete restrict,
  ship_name text not null,
  port_call_date date not null,
  estimated_pax integer not null,
  confirmed_pax integer,
  total_usd numeric(10,2),
  status text default 'pending'
    check (status in ('pending','confirmed','cancelled')),
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table group_quotes enable row level security;
alter table shore_excursions enable row level security;
alter table shore_excursion_bookings enable row level security;

-- Group quotes: partners see only their own
create policy "Partners view own quotes" on group_quotes
  for select using (
    partner_id in (
      select id from partners where user_id = auth.uid()
    )
  );

create policy "Partners create own quotes" on group_quotes
  for insert with check (
    partner_id in (
      select id from partners where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Partners update own draft quotes" on group_quotes
  for update using (
    partner_id in (
      select id from partners where user_id = auth.uid()
    )
  );

-- Shore excursions: public read
create policy "Public view available excursions" on shore_excursions
  for select using (available = true);

-- Shore excursion bookings: partner-scoped
create policy "Partners view own excursion bookings" on shore_excursion_bookings
  for select using (
    partner_id in (
      select id from partners where user_id = auth.uid()
    )
  );

create policy "Partners create excursion bookings" on shore_excursion_bookings
  for insert with check (
    partner_id in (
      select id from partners where user_id = auth.uid() and status = 'active'
    )
  );

-- ============================================================
-- Seed Shore Excursions
-- ============================================================

insert into shore_excursions (port, name, description, duration_hours, price_per_pax_usd, min_pax, max_pax, departure_time, return_time, highlights, category) values
(
  'Mombasa',
  'Old Town & Fort Jesus Discovery',
  'Explore the UNESCO-listed Fort Jesus fortress and wander the labyrinthine streets of Mombasa''s 16th-century Old Town, with its Swahili architecture, Arab merchants, and vibrant spice markets.',
  4.0, 45.00, 10, 150,
  '08:00', '12:00',
  ARRAY['Fort Jesus Museum','Old Town maze walk','Spice market visit','Dhow harbour views'],
  'historical'
),
(
  'Mombasa',
  'Shimba Hills Safari & Coast Adventure',
  'A full-day wildlife excursion into the Shimba Hills National Reserve — home to rare Sable antelopes, elephants, and spectacular coastal forest scenery.',
  8.0, 120.00, 10, 80,
  '06:30', '15:00',
  ARRAY['Sable antelope sighting','Elephant herds','Sheldrick Falls waterfall','Coastal forest canopy walk'],
  'wildlife'
),
(
  'Mombasa',
  'Haller Park & Bamburi Nature Trail',
  'Visit the award-winning Haller Park ecological rehabilitation project, home to resident hippos, giraffes, crocodiles and the famous tortoise sanctuary.',
  3.5, 35.00, 10, 200,
  '09:00', '12:30',
  ARRAY['Tortoise sanctuary','Hippo pool','Giraffe feeding','Fish farm tour'],
  'wildlife'
),
(
  'Mombasa',
  'Mombasa City & Elephant Tusk Drive',
  'A panoramic city tour taking in the iconic crossed elephant tusks, Mombasa Island, the harbour, Mama Ngina Drive seafront, and local markets.',
  3.0, 28.00, 10, 200,
  '09:30', '12:30',
  ARRAY['Elephant Tusk Monument','Mama Ngina Waterfront','Mombasa Harbour viewpoint','Local kiosks'],
  'cultural'
),
(
  'Zanzibar',
  'Stone Town Heritage Walk',
  'Wander through Zanzibar''s UNESCO Stone Town with an expert guide: narrow winding alleys, the spice trade history, the House of Wonders, and the poignant slave market memorial.',
  4.5, 55.00, 10, 120,
  '08:30', '13:00',
  ARRAY['House of Wonders','Slave Market Memorial','Forodhani Gardens','Spice trade history'],
  'historical'
),
(
  'Zanzibar',
  'Spice Farm Tour & Jozani Forest',
  'A sensory journey through organic spice plantations followed by a guided walk through Jozani Forest — the only natural habitat of the endangered Zanzibar Red Colobus monkey.',
  6.0, 75.00, 10, 100,
  '08:00', '14:00',
  ARRAY['Spice farm tasting','Coconut tree climbing demo','Red Colobus monkeys','Mangrove boardwalk'],
  'cultural'
),
(
  'Zanzibar',
  'Dolphin Swimming & Mnemba Snorkel',
  'Morning dolphin encounter in the waters off Kizimkazi, followed by world-class snorkelling around the Mnemba Island atoll coral reef.',
  7.0, 95.00, 10, 60,
  '06:00', '13:00',
  ARRAY['Wild dolphin encounter','Mnemba coral reef snorkel','Seafood lunch on beach','Crystal clear waters'],
  'adventure'
),
(
  'Zanzibar',
  'Prison Island & Aldabra Giant Tortoises',
  'Boat trip to historic Prison Island (Changuu), home to a sanctuary of Aldabra giant tortoises, followed by a snorkelling session on the surrounding reef.',
  4.0, 65.00, 10, 150,
  '09:00', '13:00',
  ARRAY['Giant Aldabra tortoises','Prison Island history','Coral reef snorkel','Dhow boat ride'],
  'adventure'
);

-- Update timestamp trigger for group_quotes
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger group_quotes_updated_at
  before update on group_quotes
  for each row execute procedure update_updated_at_column();
