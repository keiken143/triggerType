-- Create typing_tests table to store test results
CREATE TABLE public.typing_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wpm INTEGER NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  test_duration INTEGER NOT NULL, -- in seconds
  language VARCHAR(50) NOT NULL,
  character_count INTEGER NOT NULL,
  correct_characters INTEGER NOT NULL,
  errors INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.typing_tests ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own typing tests" 
ON public.typing_tests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own typing tests" 
ON public.typing_tests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_typing_tests_updated_at
BEFORE UPDATE ON public.typing_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance on user queries
CREATE INDEX idx_typing_tests_user_id_created_at ON public.typing_tests(user_id, created_at DESC);

-- Enable realtime for typing_tests table
ALTER TABLE public.typing_tests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_tests;