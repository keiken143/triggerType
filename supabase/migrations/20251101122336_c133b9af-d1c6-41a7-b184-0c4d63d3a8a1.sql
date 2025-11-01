-- Add column to store individual key errors as JSONB
ALTER TABLE typing_tests 
ADD COLUMN key_errors jsonb DEFAULT '{}'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN typing_tests.key_errors IS 'Stores error count per key, e.g. {"a": 5, "s": 3, "shift": 2}';

-- Create index for better query performance on key_errors
CREATE INDEX idx_typing_tests_key_errors ON typing_tests USING gin(key_errors);