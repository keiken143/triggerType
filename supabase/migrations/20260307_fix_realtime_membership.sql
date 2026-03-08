-- Safely add tables to publication one by one to avoid collisions
DO $$
DECLARE
  target_table text;
  tables_to_add text[] := ARRAY['relationships', 'typing_tests', 'ghost_races', 'user_dna', 'profiles'];
BEGIN
  -- Ensure publication exists
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add each table if not already a member
  FOREACH target_table IN ARRAY tables_to_add
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = target_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', target_table);
    END IF;
    
    -- Always ensure replica identity is FULL for components to get old/new data deltas
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', target_table);
  END LOOP;
END $$;
