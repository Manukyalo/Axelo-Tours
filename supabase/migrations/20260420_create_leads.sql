-- Create leads table for Newsletter and Exit-Intent lead capture
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'Website',
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous users to insert their emails (for Newsletter)
CREATE POLICY "Enable public lead insertion" 
ON public.leads 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Allow service role to manage everything
CREATE POLICY "Enable service role full access" 
ON public.leads 
FOR ALL 
TO service_role 
USING (true);

-- Allow admin role to view/manage
-- Note: Reusing the admin check if possible, or just relying on service role for now.
-- If the system uses a specific admin role/uid, we'd add it here.
