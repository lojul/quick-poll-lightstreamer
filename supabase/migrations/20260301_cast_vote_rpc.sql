-- Cast vote RPC function
-- Combines vote insert + count increment into single atomic operation
-- Returns the new vote count

CREATE OR REPLACE FUNCTION public.cast_vote(
  p_poll_id UUID,
  p_option_id UUID,
  p_voter_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  -- Insert vote (will fail on duplicate due to unique constraint)
  INSERT INTO public.votes (poll_id, option_id, voter_id)
  VALUES (p_poll_id, p_option_id, p_voter_id);

  -- Increment vote count and return new value
  UPDATE public.poll_options
  SET vote_count = vote_count + 1
  WHERE id = p_option_id
  RETURNING vote_count INTO v_new_count;

  RETURN v_new_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.cast_vote(UUID, UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.cast_vote IS 'Atomic vote casting: inserts vote record and increments count in single transaction';
