-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies (DROP first to avoid conflicts if they exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists before creating
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create typing_tests table to store test results
CREATE TABLE IF NOT EXISTS public.typing_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wpm INTEGER NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  test_duration INTEGER NOT NULL, -- in seconds
  language VARCHAR(50) NOT NULL,
  character_count INTEGER NOT NULL,
  correct_characters INTEGER NOT NULL,
  errors INTEGER NOT NULL,
  key_errors JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Safely attempt to add key_errors if the table already existed but didn't have the column
DO $$ 
BEGIN
  ALTER TABLE public.typing_tests ADD COLUMN key_errors JSONB DEFAULT '{}'::jsonb;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Enable Row Level Security
ALTER TABLE public.typing_tests ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
DROP POLICY IF EXISTS "Users can view their own typing tests" ON public.typing_tests;
CREATE POLICY "Users can view their own typing tests" 
ON public.typing_tests 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own typing tests" ON public.typing_tests;
CREATE POLICY "Users can create their own typing tests" 
ON public.typing_tests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_typing_tests_updated_at ON public.typing_tests;
CREATE TRIGGER update_typing_tests_updated_at
BEFORE UPDATE ON public.typing_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
DROP INDEX IF EXISTS idx_typing_tests_user_id_created_at;
CREATE INDEX idx_typing_tests_user_id_created_at ON public.typing_tests(user_id, created_at DESC);

-- Create index for key errors
DROP INDEX IF EXISTS idx_typing_tests_key_errors;
CREATE INDEX idx_typing_tests_key_errors ON public.typing_tests USING gin(key_errors);

-- Enable realtime for typing_tests table
ALTER TABLE public.typing_tests REPLICA IDENTITY FULL;
-- Note: PUBLICATION might error if it already tracks it, but usually safe to re-run in Supabase UI.
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.typing_tests;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for avatar uploads
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create the User DNA table to store heatmap latencies and error rates
CREATE TABLE IF NOT EXISTS public.user_dna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    language_mode TEXT NOT NULL, 
    difficulty_map JSONB NOT NULL DEFAULT '{}'::jsonb, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_dna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own dna" ON public.user_dna;
CREATE POLICY "Users can view their own dna"
    ON public.user_dna FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own dna" ON public.user_dna;
CREATE POLICY "Users can insert their own dna"
    ON public.user_dna FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own dna" ON public.user_dna;
CREATE POLICY "Users can update their own dna"
    ON public.user_dna FOR UPDATE
    USING (auth.uid() = user_id);

-- Create Ghost Races table to store array of timestamped cursor positions
CREATE TABLE IF NOT EXISTS public.ghost_races (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wpm_achieved DECIMAL NOT NULL,
    accuracy_achieved DECIMAL NOT NULL,
    language_mode TEXT NOT NULL,
    trajectory_data JSONB NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ghost_races ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ghosts are readable by everyone" ON public.ghost_races;
CREATE POLICY "Ghosts are readable by everyone"
    ON public.ghost_races FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert their own ghosts" ON public.ghost_races;
CREATE POLICY "Users can insert their own ghosts"
    ON public.ghost_races FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create Relationships table for friends system
CREATE TABLE IF NOT EXISTS public.relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(requester_id, recipient_id)
);

ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relationships they are part of" ON public.relationships;
CREATE POLICY "Users can view relationships they are part of"
    ON public.relationships FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can insert friendships" ON public.relationships;
CREATE POLICY "Users can insert friendships"
    ON public.relationships FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update friendships they receive" ON public.relationships;
CREATE POLICY "Users can update friendships they receive"
    ON public.relationships FOR UPDATE
    USING (auth.uid() = recipient_id OR auth.uid() = requester_id);

