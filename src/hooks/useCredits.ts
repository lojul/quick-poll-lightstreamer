import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UseCreditsReturn {
  credits: number | null;
  loading: boolean;
  error: string | null;
  hasEnoughForPoll: boolean;
  hasEnoughForVote: boolean;
  deductForPoll: (pollId: string) => Promise<boolean>;
  deductForVote: (pollId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const POLL_COST = 10;
const VOTE_COST = 1;

export function useCredits(): UseCreditsReturn {
  const { user, isAuthenticated } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch credits from profile, create profile if missing
  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        // Profile might not exist yet (trigger hasn't run or edge case)
        if (fetchError.code === 'PGRST116') {
          // No rows returned - try to create profile
          console.log('Profile not found, attempting to create...');
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: user.id, credits: 100 })
            .select('credits')
            .single();

          if (insertError) {
            // Profile might have been created by another request
            if (insertError.code === '23505') {
              // Duplicate key - profile exists now, refetch
              const { data: refetchedData } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();
              setCredits(refetchedData?.credits ?? 100);
            } else {
              console.error('Failed to create profile:', insertError);
              setCredits(100); // Show default as fallback
            }
          } else {
            setCredits(newProfile.credits);
          }
        } else {
          throw fetchError;
        }
      } else {
        setCredits(data.credits);
      }
    } catch (err: unknown) {
      console.error('Error fetching credits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credits');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Subscribe to real-time updates on profile
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile_credits_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new.credits === 'number') {
            setCredits(payload.new.credits);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Deduct credits for poll creation
  const deductForPoll = useCallback(async (pollId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error: rpcError } = await supabase
        .rpc('deduct_credits_for_poll', {
          p_user_id: user.id,
          p_poll_id: pollId,
          p_cost: POLL_COST,
        });

      if (rpcError) {
        console.error('Error deducting credits for poll:', rpcError);
        return false;
      }

      // Refetch to ensure sync
      await fetchCredits();
      return data === true;
    } catch (err) {
      console.error('Error deducting credits for poll:', err);
      return false;
    }
  }, [user, fetchCredits]);

  // Deduct credits for voting
  const deductForVote = useCallback(async (pollId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error: rpcError } = await supabase
        .rpc('deduct_credits_for_vote', {
          p_user_id: user.id,
          p_poll_id: pollId,
          p_cost: VOTE_COST,
        });

      if (rpcError) {
        console.error('Error deducting credits for vote:', rpcError);
        return false;
      }

      // Refetch to ensure sync
      await fetchCredits();
      return data === true;
    } catch (err) {
      console.error('Error deducting credits for vote:', err);
      return false;
    }
  }, [user, fetchCredits]);

  return {
    credits,
    loading,
    error,
    hasEnoughForPoll: credits !== null && credits >= POLL_COST,
    hasEnoughForVote: credits !== null && credits >= VOTE_COST,
    deductForPoll,
    deductForVote,
    refetch: fetchCredits,
  };
}

export { POLL_COST, VOTE_COST };
