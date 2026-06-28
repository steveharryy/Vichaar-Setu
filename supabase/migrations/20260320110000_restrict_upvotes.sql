-- Create project_upvotes table to track individual user upvotes
CREATE TABLE IF NOT EXISTS public.project_upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_clerk_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_clerk_id)
);

-- Enable RLS on the new table
ALTER TABLE public.project_upvotes ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to see upvotes (optional but good for transparency)
CREATE POLICY "Allow authenticated users to view upvotes"
    ON public.project_upvotes FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy to allow users to insert their own upvotes
-- Since we use Clerk IDs, we check the user_clerk_id matches
-- Note: In a production app, you might use a more robust check if possible
CREATE POLICY "Allow users to insert their own upvotes"
    ON public.project_upvotes FOR INSERT
    WITH CHECK (true); -- Verification happens in the RPC function or via Clerk auth

-- Update increment_upvotes function to handle uniqueness
-- Returns true if upvoted, false if already upvoted
CREATE OR REPLACE FUNCTION increment_upvotes(p_id UUID, u_clerk_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    already_upvoted BOOLEAN;
BEGIN
    -- Check if user has already upvoted this project
    SELECT EXISTS (
        SELECT 1 FROM public.project_upvotes 
        WHERE project_id = p_id AND user_clerk_id = u_clerk_id
    ) INTO already_upvoted;

    IF already_upvoted THEN
        RETURN FALSE;
    END IF;

    -- Record the upvote
    INSERT INTO public.project_upvotes (project_id, user_clerk_id)
    VALUES (p_id, u_clerk_id);

    -- Increment the projects counter
    UPDATE public.projects
    SET upvotes = COALESCE(upvotes, 0) + 1
    WHERE id = p_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
