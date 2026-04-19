-- SQL for creating the Zara Chat Sessions table in Supabase
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.chat_sessions (
    session_token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    messages JSONB DEFAULT '[]'::jsonb,
    message_count INT DEFAULT 0,
    last_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous upsert for the public chat widget
-- This allows the API route to save messages
CREATE POLICY "Allow all access for service role" ON public.chat_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous read/write" ON public.chat_sessions
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON public.chat_sessions(updated_at DESC);
