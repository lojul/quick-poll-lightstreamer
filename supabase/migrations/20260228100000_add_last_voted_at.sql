-- Add last_voted_at column to track when a poll was last voted on
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS last_voted_at TIMESTAMP WITH TIME ZONE;

-- Create function to update last_voted_at when a vote is inserted
CREATE OR REPLACE FUNCTION public.update_poll_last_voted_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.polls
  SET last_voted_at = now()
  WHERE id = NEW.poll_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on votes table
DROP TRIGGER IF EXISTS update_poll_last_voted_at_trigger ON public.votes;
CREATE TRIGGER update_poll_last_voted_at_trigger
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_poll_last_voted_at();

-- Initialize last_voted_at for existing polls based on their latest vote
UPDATE public.polls p
SET last_voted_at = (
  SELECT MAX(v.created_at)
  FROM public.votes v
  WHERE v.poll_id = p.id
)
WHERE EXISTS (
  SELECT 1 FROM public.votes v WHERE v.poll_id = p.id
);
