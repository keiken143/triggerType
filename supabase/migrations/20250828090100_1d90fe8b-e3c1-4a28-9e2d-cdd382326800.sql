-- Remove the overly permissive policy that allows everyone to view all profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a more secure policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Optional: If you need authenticated users to view basic profile info of others
-- (uncomment the line below if needed for social features)
-- CREATE POLICY "Authenticated users can view basic profile info" 
-- ON public.profiles 
-- FOR SELECT 
-- USING (auth.role() = 'authenticated');