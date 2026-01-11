-- Add founder display fields to projects table for showcase purposes
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS founder_name TEXT,
ADD COLUMN IF NOT EXISTS founder_avatar TEXT,
ADD COLUMN IF NOT EXISTS founder_university TEXT;