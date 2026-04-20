-- ============================================================
-- Axelo Tours: Costing & Vouchers Schema
-- Created: 2026-04-20
-- ============================================================

-- Park Fees (KWS/TANAPA rates by park, client type, season)
CREATE TABLE IF NOT EXISTS park_fees (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  park_name     TEXT NOT NULL,
  destination   TEXT NOT NULL,
  client_type   TEXT NOT NULL CHECK (client_type IN ('non_resident', 'resident', 'east_african')),
  fee_usd       NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee_kes       NUMERIC(12,2) NOT NULL DEFAULT 0,
  season        TEXT NOT NULL DEFAULT 'all' CHECK (season IN ('all', 'high', 'low', 'peak', 'shoulder')),
  notes         TEXT,
  last_verified TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cost Sheets (one per trip quote)
CREATE TABLE IF NOT EXISTS cost_sheets (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Trip details
  title                TEXT NOT NULL DEFAULT 'Untitled Quote',
  destination          TEXT NOT NULL,
  duration_days        INTEGER NOT NULL DEFAULT 3,
  duration_nights      INTEGER NOT NULL DEFAULT 2,
  num_adults           INTEGER NOT NULL DEFAULT 2,
  num_children         INTEGER NOT NULL DEFAULT 0,
  client_type          TEXT NOT NULL DEFAULT 'non_resident' CHECK (client_type IN ('non_resident', 'resident', 'east_african')),
  -- Accommodation
  property_id          UUID REFERENCES properties(id) ON DELETE SET NULL,
  lodge_tier           TEXT DEFAULT 'mid_range' CHECK (lodge_tier IN ('budget', 'mid_range', 'luxury', 'ultra_luxury')),
  meal_plan            TEXT DEFAULT 'FB' CHECK (meal_plan IN ('RO', 'BB', 'HB', 'FB', 'AI')),
  rate_per_person_night NUMERIC(10,2) DEFAULT 0,
  season               TEXT DEFAULT 'high',
  -- Transport
  transport_type       TEXT DEFAULT 'road' CHECK (transport_type IN ('road', 'charter', 'scheduled')),
  transport_km         NUMERIC(10,2) DEFAULT 0,
  transport_total_kes  NUMERIC(12,2) DEFAULT 0,
  transport_charter_usd NUMERIC(10,2) DEFAULT 0,
  driver_days          INTEGER DEFAULT 0,
  -- Additional costs (stored as JSONB array of line items)
  additional_costs     JSONB DEFAULT '[]',
  -- Park fees snapshot
  park_fees_snapshot   JSONB DEFAULT '[]',
  -- Margins
  b2c_margin_pct       NUMERIC(5,2) DEFAULT 25,
  b2b_margin_pct       NUMERIC(5,2) DEFAULT 12,
  contingency_pct      NUMERIC(5,2) DEFAULT 5,
  -- Calculated totals (cached)
  net_total_usd        NUMERIC(10,2) DEFAULT 0,
  b2c_per_person_usd   NUMERIC(10,2) DEFAULT 0,
  b2b_per_person_usd   NUMERIC(10,2) DEFAULT 0,
  gross_margin_usd     NUMERIC(10,2) DEFAULT 0,
  gross_margin_pct     NUMERIC(5,2) DEFAULT 0,
  -- AI analysis
  ai_analysis          TEXT,
  ai_analysed_at       TIMESTAMPTZ,
  -- Meta
  status               TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'saved', 'quoted', 'booked', 'archived')),
  created_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vouchers (accommodation vouchers sent to lodges)
CREATE TABLE IF NOT EXISTS vouchers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_ref          TEXT NOT NULL UNIQUE,
  booking_id           UUID REFERENCES bookings(id) ON DELETE CASCADE,
  -- Snapshot of booking data at time of generation
  client_names         TEXT[] NOT NULL DEFAULT '{}',
  client_nationality   TEXT,
  client_passport      TEXT,
  property_id          UUID REFERENCES properties(id) ON DELETE SET NULL,
  property_name        TEXT NOT NULL,
  property_email       TEXT,
  check_in             DATE NOT NULL,
  check_out            DATE NOT NULL,
  nights               INTEGER NOT NULL,
  room_type            TEXT,
  meal_plan            TEXT DEFAULT 'FB',
  num_adults           INTEGER NOT NULL DEFAULT 1,
  num_children         INTEGER NOT NULL DEFAULT 0,
  services_included    TEXT[],
  payment_status       TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid', 'deposit_paid', 'pending')),
  payment_amount       NUMERIC(10,2),
  payment_ref          TEXT,
  special_requests     TEXT,
  lodge_notes          TEXT,
  -- Document
  pdf_url              TEXT,
  -- Status
  status               TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'lodge_confirmed', 'checked_in')),
  sent_at              TIMESTAMPTZ,
  sent_to_email        TEXT,
  confirmed_at         TIMESTAMPTZ,
  -- Auth
  authorised_by        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_park_fees_destination ON park_fees(destination);
CREATE INDEX IF NOT EXISTS idx_park_fees_last_verified ON park_fees(last_verified);
CREATE INDEX IF NOT EXISTS idx_cost_sheets_status ON cost_sheets(status);
CREATE INDEX IF NOT EXISTS idx_cost_sheets_destination ON cost_sheets(destination);
CREATE INDEX IF NOT EXISTS idx_vouchers_booking_id ON vouchers(booking_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_check_in ON vouchers(check_in);

-- RLS
ALTER TABLE park_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Admin-only access (service role or authenticated admin)
CREATE POLICY "admin_all_park_fees" ON park_fees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_cost_sheets" ON cost_sheets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_vouchers" ON vouchers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed: Initial KWS park fees (non-resident rates, 2025)
INSERT INTO park_fees (park_name, destination, client_type, fee_usd, fee_kes, season, notes, last_verified) VALUES
  ('Maasai Mara National Reserve', 'Maasai Mara', 'non_resident', 200, 26000, 'high', 'MMNR rates. Verify at maasamara.go.ke', '2025-12-01'),
  ('Maasai Mara National Reserve', 'Maasai Mara', 'non_resident', 80,  10400, 'low',  'MMNR low season Oct-Jun excl peak', '2025-12-01'),
  ('Maasai Mara National Reserve', 'Maasai Mara', 'resident',     35,  4550,  'all',  'Kenyan resident rate', '2025-12-01'),
  ('Maasai Mara National Reserve', 'Maasai Mara', 'east_african', 25,  3250,  'all',  'East African community rate', '2025-12-01'),
  ('Amboseli National Park', 'Amboseli', 'non_resident', 90, 11700, 'all', 'KWS rate. Verify at kws.go.ke', '2025-12-01'),
  ('Amboseli National Park', 'Amboseli', 'resident', 30, 3900, 'all', 'Kenyan resident rate', '2025-12-01'),
  ('Tsavo East NP', 'Tsavo', 'non_resident', 52, 6760, 'all', 'KWS combined Tsavo rate', '2025-12-01'),
  ('Tsavo West NP', 'Tsavo', 'non_resident', 52, 6760, 'all', 'KWS combined Tsavo rate', '2025-12-01'),
  ('Lake Nakuru NP', 'Lake Nakuru', 'non_resident', 60, 7800, 'all', 'KWS rate', '2025-12-01'),
  ('Serengeti NP', 'Serengeti', 'non_resident', 82, 0, 'all', 'TANAPA rate USD only', '2025-12-01'),
  ('Ngorongoro Conservation', 'Ngorongoro', 'non_resident', 200, 0, 'all', 'NCAA crater fee', '2025-12-01')
ON CONFLICT DO NOTHING;
