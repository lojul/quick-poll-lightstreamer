-- Add unique constraint to prevent duplicate votes from same user on same poll
-- This ensures database-level protection against race conditions

-- First, remove any existing duplicate votes (keep the earliest one)
DELETE FROM public.votes a
USING public.votes b
WHERE a.id > b.id
  AND a.poll_id = b.poll_id
  AND a.voter_id = b.voter_id
  AND a.voter_id IS NOT NULL;

-- Add unique constraint
ALTER TABLE public.votes
ADD CONSTRAINT votes_poll_voter_unique UNIQUE (poll_id, voter_id);
