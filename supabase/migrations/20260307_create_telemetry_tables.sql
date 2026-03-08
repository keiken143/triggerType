-- Create the User DNA table to store heatmap latencies and error rates
CREATE TABLE IF NOT EXISTS public.user_dna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    language_mode TEXT NOT NULL, -- e.g., 'simple', 'javascript'
    difficulty_map JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g., {"a": {"latency": 150, "errors": 2}}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Protect user_dna with RLS
ALTER TABLE public.user_dna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dna"
    ON public.user_dna FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dna"
    ON public.user_dna FOR INSERT
    WITH CHECK (auth.uid() = user_id);

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
    trajectory_data JSONB NOT NULL, -- Array of [timestamp, char_index]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ghost_races ENABLE ROW LEVEL SECURITY;

-- Ghosts are public to everyone authenticated so friends can race them
CREATE POLICY "Ghosts are readable by everyone"
    ON public.ghost_races FOR SELECT
    USING (auth.role() = 'authenticated');

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

CREATE POLICY "Users can view relationships they are part of"
    ON public.relationships FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert friendships"
    ON public.relationships FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they receive"
    ON public.relationships FOR UPDATE
    USING (auth.uid() = recipient_id OR auth.uid() = requester_id);

