-- Add DELETE policy for polls - only creator can delete their polls
CREATE POLICY "Users can delete their own polls"
  ON public.polls
  FOR DELETE
  USING (created_by = auth.uid());

-- Note: poll_options and votes will be deleted automatically via ON DELETE CASCADE
