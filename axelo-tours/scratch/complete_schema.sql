-- 1. PACKAGES TABLE
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    destination TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    price_usd NUMERIC NOT NULL,
    price_kes NUMERIC NOT NULL,
    highlights TEXT[] DEFAULT '{}',
    inclusions TEXT[] DEFAULT '{}',
    exclusions TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    available BOOLEAN DEFAULT true,
    category TEXT DEFAULT 'standard',
    difficulty TEXT DEFAULT 'easy',
    itinerary JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    nationality TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
    travel_date DATE NOT NULL,
    return_date DATE,
    num_adults INTEGER DEFAULT 1,
    num_children INTEGER DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    payment_status TEXT DEFAULT 'unpaid', -- unpaid, partial, paid
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CHAT SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token TEXT UNIQUE NOT NULL,
    messages JSONB DEFAULT '[]',
    message_count INTEGER DEFAULT 0,
    last_message TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES
-- Packages: Viewable by everyone
CREATE POLICY "Public read packages" ON public.packages FOR SELECT USING (true);

-- Clients: Only readable by the owner
CREATE POLICY "Clients see own record" ON public.clients FOR SELECT USING (auth.uid() = user_id);

-- Bookings: Only readable by the client owner
CREATE POLICY "Clients see own bookings" ON public.bookings FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
);

-- 7. SEED DATA (A Premier Safari)
INSERT INTO public.packages (name, slug, destination, duration_days, price_usd, price_kes, highlights, images)
VALUES (
    'The Great Migration Explorer', 
    'great-migration-explorer', 
    'Maasai Mara', 
    4, 
    1250, 
    165000, 
    '{"Big Five Sightings", "Luxury Tented Camp", "Hot Air Balloon Optional"}',
    '{"https://images.unsplash.com/photo-1516422317778-958bd73a7174?q=80&w=1000"}'
) ON CONFLICT (slug) DO NOTHING;
