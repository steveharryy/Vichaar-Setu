-- Enable realtime for projects table so Explore/Investor views update instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;