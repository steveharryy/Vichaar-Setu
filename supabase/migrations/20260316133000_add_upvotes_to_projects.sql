-- Add upvotes column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;

-- Update RLS policies to allow authenticated users to upvote (increment)
-- Since upvoting is a simple increment, we can allow updates to this specific column
-- or just allow all updates if the user is authenticated.
-- For simplicity, we'll allow any authenticated user to increment upvotes via a function later
-- or just allow direct update if needed.

CREATE OR REPLACE FUNCTION increment_upvotes(project_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.projects
  SET upvotes = upvotes + 1
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
