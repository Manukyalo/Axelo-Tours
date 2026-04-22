-- ============================================================
-- Axelo Tours: KWS Park Fees Update (Gazette Oct 2025)
-- ============================================================

-- Drop constraints FIRST
ALTER TABLE park_fees DROP CONSTRAINT IF EXISTS park_fees_client_type_check;
ALTER TABLE cost_sheets DROP CONSTRAINT IF EXISTS cost_sheets_client_type_check;

-- 1. Migrate client_type in existing tables
UPDATE park_fees SET client_type = 'eac_citizen' WHERE client_type IN ('east_african', 'citizen');
UPDATE park_fees SET client_type = 'kenya_resident' WHERE client_type = 'resident';

UPDATE cost_sheets SET client_type = 'eac_citizen' WHERE client_type IN ('east_african', 'citizen');
UPDATE cost_sheets SET client_type = 'kenya_resident' WHERE client_type = 'resident';

-- Re-add constraints
ALTER TABLE park_fees ADD CONSTRAINT park_fees_client_type_check CHECK (client_type IN ('eac_citizen', 'kenya_resident', 'non_resident', 'african_citizen'));
ALTER TABLE cost_sheets ADD CONSTRAINT cost_sheets_client_type_check CHECK (client_type IN ('eac_citizen', 'kenya_resident', 'non_resident', 'african_citizen'));

-- 2. Alter park_fees table schema
ALTER TABLE park_fees 
ADD COLUMN IF NOT EXISTS adult_fee NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS child_fee NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS currency TEXT CHECK (currency IN ('USD', 'KES')),
ADD COLUMN IF NOT EXISTS park_group TEXT,
ADD COLUMN IF NOT EXISTS kws_fees_effective_date DATE,
ADD COLUMN IF NOT EXISTS kws_fees_source TEXT;

-- 3. Migrate existing columns in park_fees
UPDATE park_fees 
SET 
  currency = CASE WHEN client_type IN ('non_resident', 'african_citizen') THEN 'USD' ELSE 'KES' END,
  adult_fee = CASE WHEN client_type IN ('non_resident', 'african_citizen') THEN fee_usd ELSE fee_kes END,
  child_fee = CASE WHEN client_type IN ('non_resident', 'african_citizen') THEN fee_usd / 2 ELSE fee_kes / 2 END
WHERE adult_fee IS NULL;

-- 4. Clean up old columns
ALTER TABLE park_fees 
ALTER COLUMN adult_fee SET NOT NULL,
ALTER COLUMN adult_fee SET DEFAULT 0,
ALTER COLUMN child_fee SET NOT NULL,
ALTER COLUMN child_fee SET DEFAULT 0,
ALTER COLUMN currency SET NOT NULL,
ALTER COLUMN currency SET DEFAULT 'USD';

ALTER TABLE park_fees DROP COLUMN IF EXISTS fee_usd;
ALTER TABLE park_fees DROP COLUMN IF EXISTS fee_kes;

-- 5. Delete old KWS parks to make room for fresh data
DELETE FROM park_fees WHERE notes ILIKE '%KWS%' OR park_name IN (
    'Amboseli National Park', 'Tsavo East NP', 'Tsavo West NP', 
    'Lake Nakuru NP', 'Mt Kenya NP'
);

-- 6. Insert new KWS Park Fees Data (Effective Oct 2025)

-- A helper function or DO block could make this cleaner, but we can just use a large insert.
INSERT INTO park_fees (
    park_name, destination, client_type, adult_fee, child_fee, currency, park_group, season, notes, kws_fees_effective_date, kws_fees_source
) VALUES

-- PREMIUM_PARKS: Amboseli NP (Destination: Amboseli)
('Amboseli National Park', 'Amboseli', 'eac_citizen',     1500,  750, 'KES', 'PREMIUM_PARKS', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Amboseli National Park', 'Amboseli', 'kenya_resident',  2025, 1050, 'KES', 'PREMIUM_PARKS', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Amboseli National Park', 'Amboseli', 'non_resident',      90,   45, 'USD', 'PREMIUM_PARKS', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Amboseli National Park', 'Amboseli', 'african_citizen',   50,   25, 'USD', 'PREMIUM_PARKS', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),

-- PREMIUM_PARKS: Lake Nakuru NP (Destination: Lake Nakuru)
('Lake Nakuru NP', 'Lake Nakuru', 'eac_citizen',     1500,  750, 'KES', 'PREMIUM_PARKS', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Lake Nakuru NP', 'Lake Nakuru', 'kenya_resident',  2025, 1050, 'KES', 'PREMIUM_PARKS', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Lake Nakuru NP', 'Lake Nakuru', 'non_resident',      90,   45, 'USD', 'PREMIUM_PARKS', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Lake Nakuru NP', 'Lake Nakuru', 'african_citizen',   50,   25, 'USD', 'PREMIUM_PARKS', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),

-- URBAN_PARK: Nairobi NP (Destination: Nairobi)
('Nairobi NP', 'Nairobi', 'eac_citizen',     1000, 500, 'KES', 'URBAN_PARK', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Nairobi NP', 'Nairobi', 'kenya_resident',  1350, 675, 'KES', 'URBAN_PARK', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Nairobi NP', 'Nairobi', 'non_resident',      80,  40, 'USD', 'URBAN_PARK', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Nairobi NP', 'Nairobi', 'african_citizen',   40,  20, 'USD', 'URBAN_PARK', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),

-- URBAN_PARK_PACKAGE: Nairobi NP + Orphanage + Safari Walk
('Nairobi NP + Orphanage + Safari Walk', 'Nairobi', 'eac_citizen',     1300, 700, 'KES', 'URBAN_PARK_PACKAGE', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Nairobi NP + Orphanage + Safari Walk', 'Nairobi', 'kenya_resident',  1750, 950, 'KES', 'URBAN_PARK_PACKAGE', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Nairobi NP + Orphanage + Safari Walk', 'Nairobi', 'non_resident',     105,  55, 'USD', 'URBAN_PARK_PACKAGE', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Nairobi NP + Orphanage + Safari Walk', 'Nairobi', 'african_citizen',   55,  20, 'USD', 'URBAN_PARK_PACKAGE', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),

-- WILDERNESS_A: Tsavo East NP (Destination: Tsavo)
('Tsavo East NP', 'Tsavo', 'eac_citizen',     1000, 500, 'KES', 'WILDERNESS_A', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Tsavo East NP', 'Tsavo', 'kenya_resident',  1350, 675, 'KES', 'WILDERNESS_A', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Tsavo East NP', 'Tsavo', 'non_resident',      80,  40, 'USD', 'WILDERNESS_A', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Tsavo East NP', 'Tsavo', 'african_citizen',   40,  20, 'USD', 'WILDERNESS_A', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),

-- WILDERNESS_A: Tsavo West NP (Destination: Tsavo)
('Tsavo West NP', 'Tsavo', 'eac_citizen',     1000, 500, 'KES', 'WILDERNESS_A', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Tsavo West NP', 'Tsavo', 'kenya_resident',  1350, 675, 'KES', 'WILDERNESS_A', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Tsavo West NP', 'Tsavo', 'non_resident',      80,  40, 'USD', 'WILDERNESS_A', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Tsavo West NP', 'Tsavo', 'african_citizen',   40,  20, 'USD', 'WILDERNESS_A', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),

-- WILDERNESS_B: Meru NP, Kora NP, Aberdare NP
('Meru NP', 'Meru', 'eac_citizen',     800, 500, 'KES', 'WILDERNESS_B', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Meru NP', 'Meru', 'kenya_resident',  1100, 675, 'KES', 'WILDERNESS_B', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Meru NP', 'Meru', 'non_resident',      70,  40, 'USD', 'WILDERNESS_B', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Meru NP', 'Meru', 'african_citizen',   40,  20, 'USD', 'WILDERNESS_B', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),

('Kora NP', 'Kora', 'eac_citizen',     800, 500, 'KES', 'WILDERNESS_B', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Kora NP', 'Kora', 'kenya_resident',  1100, 675, 'KES', 'WILDERNESS_B', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Kora NP', 'Kora', 'non_resident',      70,  40, 'USD', 'WILDERNESS_B', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Kora NP', 'Kora', 'african_citizen',   40,  20, 'USD', 'WILDERNESS_B', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),

('Aberdare NP', 'Aberdares', 'eac_citizen',     800, 500, 'KES', 'WILDERNESS_B', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Aberdare NP', 'Aberdares', 'kenya_resident',  1100, 675, 'KES', 'WILDERNESS_B', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Aberdare NP', 'Aberdares', 'non_resident',      70,  40, 'USD', 'WILDERNESS_B', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Aberdare NP', 'Aberdares', 'african_citizen',   40,  20, 'USD', 'WILDERNESS_B', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),

-- MOUNTAIN_PARK: Mt. Kenya NP
('Mt. Kenya NP', 'Mt. Kenya', 'eac_citizen',     800, 400, 'KES', 'MOUNTAIN_PARK', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Mt. Kenya NP', 'Mt. Kenya', 'kenya_resident',  1100, 550, 'KES', 'MOUNTAIN_PARK', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Mt. Kenya NP', 'Mt. Kenya', 'non_resident',      70,  35, 'USD', 'MOUNTAIN_PARK', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Mt. Kenya NP', 'Mt. Kenya', 'african_citizen',   30,  15, 'USD', 'MOUNTAIN_PARK', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),

-- MULTI-PARK PACKAGES
('Tsavo West + Amboseli Package', 'Tsavo West + Amboseli', 'eac_citizen',     2200, 1100, 'KES', 'MULTI_PARK_PACKAGE', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Tsavo West + Amboseli Package', 'Tsavo West + Amboseli', 'kenya_resident',  2900, 1550, 'KES', 'MULTI_PARK_PACKAGE', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Tsavo West + Amboseli Package', 'Tsavo West + Amboseli', 'non_resident',     150,   80, 'USD', 'MULTI_PARK_PACKAGE', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Tsavo West + Amboseli Package', 'Tsavo West + Amboseli', 'african_citizen',   80,   45, 'USD', 'MULTI_PARK_PACKAGE', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),

('Tsavo East + Tsavo West + Amboseli Package', 'Tsavo East + Tsavo West + Amboseli', 'eac_citizen',     3000, 1500, 'KES', 'MULTI_PARK_PACKAGE', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Tsavo East + Tsavo West + Amboseli Package', 'Tsavo East + Tsavo West + Amboseli', 'kenya_resident',  4000, 2150, 'KES', 'MULTI_PARK_PACKAGE', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Tsavo East + Tsavo West + Amboseli Package', 'Tsavo East + Tsavo West + Amboseli', 'non_resident',     215,  115, 'USD', 'MULTI_PARK_PACKAGE', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025'),
('Tsavo East + Tsavo West + Amboseli Package', 'Tsavo East + Tsavo West + Amboseli', 'african_citizen',  115,   60, 'USD', 'MULTI_PARK_PACKAGE', 'all', 'KWS 2025', '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025 — Legal Notice Oct 2025');

-- Create a small table for vehicle fees since it's flat per capacity
CREATE TABLE IF NOT EXISTS vehicle_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL UNIQUE,
    capacity_min INT,
    capacity_max INT,
    fee_kes NUMERIC(10,2) NOT NULL DEFAULT 0,
    kws_fees_effective_date DATE,
    kws_fees_source TEXT
);

INSERT INTO vehicle_fees (category, capacity_min, capacity_max, fee_kes, kws_fees_effective_date, kws_fees_source) VALUES
('less_than_6_seats', 1, 5, 600, '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025'),
('6_to_12_seats', 6, 12, 1500, '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025'),
('13_to_24_seats', 13, 24, 3000, '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025'),
('25_to_44_seats', 25, 44, 4500, '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025'),
('45_seats_and_above', 45, 999, 5000, '2025-10-01', 'Wildlife Conservation & Management (Fees) Regulations, 2025')
ON CONFLICT (category) DO UPDATE SET 
  fee_kes = EXCLUDED.fee_kes, 
  kws_fees_effective_date = EXCLUDED.kws_fees_effective_date,
  kws_fees_source = EXCLUDED.kws_fees_source;

-- Refresh Supabase schemas cache
NOTIFY pgrst, 'reload schema';
