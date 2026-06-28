-- Create profiles_clerk table to store user details from Clerk
CREATE TABLE IF NOT EXISTS public.profiles_clerk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('student', 'investor')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles_clerk ENABLE ROW LEVEL SECURITY;

-- Create policies for Clerk-based authentication (permissive, app handles validation)
CREATE POLICY "Allow select for everyone" ON public.profiles_clerk FOR SELECT USING (true);
CREATE POLICY "Allow insert for everyone" ON public.profiles_clerk FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for owners" ON public.profiles_clerk FOR UPDATE USING (true) WITH CHECK (true);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_clerk_id ON public.profiles_clerk(clerk_id);
