-- Force schema cache reload so PostgREST recognizes the latest columns
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';