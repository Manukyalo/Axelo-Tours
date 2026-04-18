create extension if not exists "uuid-ossp";

create table packages (
  id uuid primary key default uuid_generate_v4(),
  name text not null, slug text unique not null,
  destination text not null, duration_days integer not null,
  price_usd numeric(10,2) not null, price_kes numeric(12,2) not null,
  group_size_min integer default 1, group_size_max integer default 12,
  highlights text[] default '{}', inclusions text[] default '{}',
  exclusions text[] default '{}', images text[] default '{}',
  available boolean default true,
  category text check (category in ('budget','standard','luxury','custom')) default 'standard',
  difficulty text check (difficulty in ('easy','moderate','challenging')) default 'easy',
  best_season text[] default '{}', created_at timestamptz default now()
);

create table clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  full_name text not null, email text unique not null,
  phone text, nationality text, passport_no text,
  created_at timestamptz default now()
);

create table bookings (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  package_id uuid references packages(id) on delete restrict,
  travel_date date not null, return_date date not null,
  num_adults integer default 1, num_children integer default 0,
  total_amount numeric(12,2) not null,
  currency text check (currency in ('KES','USD')) default 'KES',
  status text check (status in ('pending','confirmed','completed','cancelled')) default 'pending',
  payment_status text check (payment_status in ('unpaid','partial','paid','refunded')) default 'unpaid',
  special_requests text, created_at timestamptz default now()
);

create table payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  provider text check (provider in ('intasend','stripe')) not null,
  amount numeric(12,2) not null, currency text not null,
  reference text unique not null,
  status text check (status in ('pending','completed','failed','refunded')) default 'pending',
  metadata jsonb default '{}', created_at timestamptz default now()
);

create table chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  session_token text unique not null,
  messages jsonb default '[]',
  created_at timestamptz default now()
);

create table properties (
  id uuid primary key default uuid_generate_v4(),
  name text not null, location text not null, destination text not null,
  category text check (category in ('budget','midrange','luxury','ultra-luxury')),
  contact_name text, contact_email text, website text,
  status text default 'prospect', notes text,
  created_at timestamptz default now()
);

create table contracts (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id),
  start_date date not null, end_date date not null,
  document_url text, status text default 'active',
  created_at timestamptz default now()
);

create table net_rates (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id),
  contract_id uuid references contracts(id),
  room_type text not null,
  season text check (season in ('low','shoulder','high','peak')) not null,
  net_rate_usd numeric(10,2) not null, net_rate_kes numeric(12,2),
  valid_from date not null, valid_to date not null,
  created_at timestamptz default now()
);

create table park_fees (
  id uuid primary key default uuid_generate_v4(),
  park_name text not null, park_code text unique not null,
  non_resident_adult_usd numeric(8,2) not null,
  non_resident_child_usd numeric(8,2) not null,
  resident_adult_kes numeric(10,2) not null,
  resident_child_kes numeric(10,2) not null,
  vehicle_fee_kes numeric(8,2) default 200,
  last_verified date not null, source_url text default 'https://kws.go.ke',
  created_at timestamptz default now()
);

create table cost_sheets (
  id uuid primary key default uuid_generate_v4(),
  name text not null, package_id uuid references packages(id),
  destination text not null, park_code text references park_fees(park_code),
  duration_days integer not null, num_adults integer not null,
  num_children integer default 0,
  client_type text check (client_type in ('non_resident','resident','east_african')) default 'non_resident',
  lodge_tier text, property_id uuid references properties(id),
  transport_type text check (transport_type in ('road','charter_flight','scheduled_flight')),
  line_items jsonb default '[]', total_cost_usd numeric(12,2),
  markup_b2c_pct integer default 25, markup_b2b_pct integer default 12,
  contingency_pct integer default 5,
  selling_price_b2c_usd numeric(12,2), selling_price_b2b_usd numeric(12,2),
  margin_usd numeric(12,2), margin_pct numeric(5,2),
  ai_analysis text, created_at timestamptz default now()
);

create table vouchers (
  id uuid primary key default uuid_generate_v4(),
  voucher_ref text unique not null,
  booking_id uuid references bookings(id),
  property_id uuid references properties(id),
  client_names text[] not null, check_in date not null, check_out date not null,
  num_adults integer not null, num_children integer default 0,
  room_type text not null,
  meal_plan text check (meal_plan in ('BB','HB','FB','AI')) default 'FB',
  special_requests text,
  payment_status text check (payment_status in ('paid_full','deposit_paid','direct_billing')),
  payment_amount_usd numeric(12,2), pdf_url text,
  sent_at timestamptz, lodge_confirmed_at timestamptz,
  sent_to_email text, created_at timestamptz default now()
);

create table call_logs (
  id uuid primary key default uuid_generate_v4(),
  caller_phone text not null, caller_name text,
  duration_seconds integer, transcript jsonb default '[]',
  summary text, booking_intent_score integer check (booking_intent_score between 0 and 10),
  interested_package text, sms_sent boolean default false,
  created_at timestamptz default now()
);

create table competitor_reports (
  id uuid primary key default uuid_generate_v4(),
  report_date date not null, competitor_name text not null,
  data jsonb default '{}', search_trends jsonb default '{}',
  keyword_gaps jsonb default '{}', opportunities jsonb default '[]',
  insights text, created_at timestamptz default now()
);

create table blog_posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null, slug text unique not null,
  meta_description text, content_html text,
  keywords text[], read_time_minutes integer,
  published boolean default false,
  published_at timestamptz, created_at timestamptz default now()
);

create table leads (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null, source text,
  guide_sent boolean default false, created_at timestamptz default now()
);

create table b2b_agencies (
  id uuid primary key default uuid_generate_v4(),
  name text not null, website text, country text, region text,
  contact_name text, contact_email text,
  specialties text[], client_demographic text,
  status text default 'prospect', created_at timestamptz default now()
);

create table b2b_outreach (
  id uuid primary key default uuid_generate_v4(),
  agency_id uuid references b2b_agencies(id),
  subject text, body text, status text default 'draft',
  gmail_message_id text, opened_at timestamptz, replied_at timestamptz,
  follow_up_due timestamptz, created_at timestamptz default now()
);

create table partners (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  company_name text not null,
  company_type text check (company_type in ('travel_agency','cruise_line','charter_airline','wholesaler','ota')),
  country text, contact_name text, contact_email text,
  status text default 'pending', tier text default 'standard',
  net_rate_discount_pct integer default 0,
  api_key text unique, created_at timestamptz default now()
);

-- RLS
alter table packages enable row level security;
alter table bookings enable row level security;
alter table clients enable row level security;
alter table payments enable row level security;
alter table vouchers enable row level security;
alter table cost_sheets enable row level security;
alter table call_logs enable row level security;

create policy "Public view available packages" on packages for select using (available = true);
create policy "Admins manage packages" on packages for all using (auth.role() = 'authenticated');
create policy "Clients view own bookings" on bookings for select
  using (client_id in (select id from clients where user_id = auth.uid()));
create policy "Admins manage all bookings" on bookings for all using (auth.role() = 'authenticated');

-- Pre-populate KWS park fees:
insert into park_fees (park_name,park_code,non_resident_adult_usd,non_resident_child_usd,resident_adult_kes,resident_child_kes,vehicle_fee_kes,last_verified) values
('Maasai Mara','MARA',80,45,600,215,200,now()),
('Amboseli','AMBO',60,35,430,215,200,now()),
('Tsavo East','TSVE',52,35,430,215,200,now()),
('Tsavo West','TSVW',52,35,430,215,200,now()),
('Lake Nakuru','NAKU',60,35,430,215,200,now()),
('Aberdares','ABER',60,35,430,215,200,now()),
('Samburu','SAMB',52,35,430,215,200,now()),
('Lake Naivasha','NAIV',30,20,300,150,200,now()),
('Hells Gate','HELL',30,20,300,150,200,now()),
('Mt Kenya NP','MTKN',52,35,430,215,200,now());
