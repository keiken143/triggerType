-- TACTICAL PATCH 001: Authorization & Discovery
BEGIN;

-- 1. Safely fix Realtime Publication
DO $$
DECLARE
  target_table text;
  tables_to_add text[] := ARRAY['relationships', 'typing_tests', 'ghost_races', 'user_dna', 'profiles'];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH target_table IN ARRAY tables_to_add
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = target_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', target_table);
    END IF;
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', target_table);
  END LOOP;
END $$;

-- 2. Unlock Profile Discovery (Fixes the empty search bug)
-- Drop restricted select policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create public (authenticated) select policy
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 3. Ensure Auto-Profile Creation captures username if provided in metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'display_name',
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1) || floor(random()*1000)::text)
  );
  RETURN NEW;
END;
$$;

COMMIT;
