-- Add foreign key from ghost_races.user_id to profiles.user_id
-- This allows PostgREST to resolve the join: ghost_races -> profiles
ALTER TABLE public.ghost_races
ADD CONSTRAINT ghost_races_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
