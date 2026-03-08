-- FIX: Establish direct FKs to profiles for better PostgREST joining
BEGIN;

-- 1. Fix relationships table
ALTER TABLE public.relationships DROP CONSTRAINT IF EXISTS relationships_requester_id_fkey;
ALTER TABLE public.relationships DROP CONSTRAINT IF EXISTS relationships_recipient_id_fkey;

ALTER TABLE public.relationships
  ADD CONSTRAINT relationships_requester_id_fkey 
  FOREIGN KEY (requester_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.relationships
  ADD CONSTRAINT relationships_recipient_id_fkey 
  FOREIGN KEY (recipient_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 2. Fix ghost_races table (redundancy check)
-- First drop any existing to avoid conflicts
ALTER TABLE public.ghost_races DROP CONSTRAINT IF EXISTS ghost_races_user_id_fkey;
ALTER TABLE public.ghost_races DROP CONSTRAINT IF EXISTS ghost_races_user_id_profiles_fkey;

ALTER TABLE public.ghost_races
  ADD CONSTRAINT ghost_races_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

COMMIT;
