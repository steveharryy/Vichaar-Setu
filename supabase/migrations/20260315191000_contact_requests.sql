-- Migration to create contact_requests table and its policies
CREATE TABLE IF NOT EXISTS public.contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_clerk_id TEXT NOT NULL,
    to_clerk_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view contact requests sent to them" ON public.contact_requests;
DROP POLICY IF EXISTS "Users can view contact requests they sent" ON public.contact_requests;
DROP POLICY IF EXISTS "Users can insert their own contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Users can update status of contact requests sent to them" ON public.contact_requests;
DROP POLICY IF EXISTS "Allow select contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Allow insert contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Allow update contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Allow delete contact requests" ON public.contact_requests;

-- Create permissive policies for Clerk-based authentication
CREATE POLICY "Allow select contact requests" 
ON public.contact_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert contact requests" 
ON public.contact_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update contact requests" 
ON public.contact_requests 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete contact requests" 
ON public.contact_requests 
FOR DELETE 
USING (true);
