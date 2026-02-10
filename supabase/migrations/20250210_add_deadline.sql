-- Add deadline column to polls table with default 3 days from creation
ALTER TABLE public.polls
ADD COLUMN deadline TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '3 days');

-- Update existing polls to have a deadline (3 days from their creation)
UPDATE public.polls
SET deadline = created_at + interval '3 days'
WHERE deadline IS NULL;

-- Make deadline NOT NULL after setting existing values
ALTER TABLE public.polls
ALTER COLUMN deadline SET NOT NULL;
