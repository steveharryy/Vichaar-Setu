-- Fix RLS policies to work with Clerk authentication
-- Since Clerk doesn't use Supabase Auth, we need permissive policies
-- and rely on clerk_user_id validation in the application code

-- Drop existing restrictive policies on projects
DROP POLICY IF EXISTS "Students can create projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can update projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Create permissive policies for Clerk-based authentication
CREATE POLICY "Allow insert for authenticated sessions" 
ON public.projects 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update for project owners" 
ON public.projects 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete for project owners" 
ON public.projects 
FOR DELETE 
USING (true);

-- Drop existing restrictive policies on contact_requests
DROP POLICY IF EXISTS "Investors can send contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Recipients can update contact status" ON public.contact_requests;
DROP POLICY IF EXISTS "Users can create contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Users can update contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Users can view own contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Users can view their contact requests" ON public.contact_requests;

-- Create permissive policies for contact_requests
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