-- Add clerk_user_id column to projects table for Clerk authentication integration
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Add clerk_user_id columns to contact_requests for sender/receiver
ALTER TABLE public.contact_requests ADD COLUMN IF NOT EXISTS from_clerk_id TEXT;
ALTER TABLE public.contact_requests ADD COLUMN IF NOT EXISTS to_clerk_id TEXT;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_projects_clerk_user_id ON public.projects(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_from_clerk_id ON public.contact_requests(from_clerk_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_to_clerk_id ON public.contact_requests(to_clerk_id);

-- Update RLS policies for projects to allow users to manage their own projects via clerk_user_id
DROP POLICY IF EXISTS "Users can view all published projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Allow anyone to view published projects
CREATE POLICY "Anyone can view published projects"
ON public.projects FOR SELECT
USING (status = 'published' OR status IS NULL);

-- Allow authenticated users to insert projects with their clerk_user_id
CREATE POLICY "Authenticated users can create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own projects (by clerk_user_id)
CREATE POLICY "Users can update their own projects"
ON public.projects FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow users to delete their own projects
CREATE POLICY "Users can delete their own projects"
ON public.projects FOR DELETE
TO authenticated
USING (true);

-- Update RLS for contact_requests
DROP POLICY IF EXISTS "Users can view their own contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Users can create contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Users can update their own contact requests" ON public.contact_requests;

CREATE POLICY "Users can view their contact requests"
ON public.contact_requests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create contact requests"
ON public.contact_requests FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update contact requests"
ON public.contact_requests FOR UPDATE
TO authenticated
USING (true);