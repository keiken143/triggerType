-- Enable Realtime for established tactical tables
BEGIN;
  -- Ensure the publication exists
  DO $$ 
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      CREATE PUBLICATION supabase_realtime;
    END IF;
  END $$;

  -- Add tables to the realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.relationships;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_tests;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ghost_races;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_dna;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

  -- Set replica identity to FULL for detailed change tracking
  ALTER TABLE public.relationships REPLICA IDENTITY FULL;
  ALTER TABLE public.typing_tests REPLICA IDENTITY FULL;
  ALTER TABLE public.ghost_races REPLICA IDENTITY FULL;
  ALTER TABLE public.user_dna REPLICA IDENTITY FULL;
  ALTER TABLE public.profiles REPLICA IDENTITY FULL;
COMMIT;
