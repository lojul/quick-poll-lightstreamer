-- Atomic vote count increment function
-- This fixes the race condition in vote counting (read-then-update pattern)

CREATE OR REPLACE FUNCTION increment_vote_count(option_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE poll_options
  SET vote_count = vote_count + 1
  WHERE id = option_id;
END;
$$;

-- Grant execute permission to authenticated users and anon
GRANT EXECUTE ON FUNCTION increment_vote_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_vote_count(UUID) TO anon;
