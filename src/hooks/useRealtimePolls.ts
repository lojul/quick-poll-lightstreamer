import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Poll, PollOption } from '@/types/poll';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

/**
 * Extract all option IDs from polls array
 */
export function getAllOptionIds(polls: Poll[]): string[] {
  return polls.flatMap(poll => poll.poll_options.map(option => option.id));
}

/**
 * Merge vote updates from Lightstreamer into polls state
 */
export function mergeVoteUpdates(polls: Poll[], voteUpdates: Map<string, number>): Poll[] {
  if (voteUpdates.size === 0) return polls;

  return polls.map(poll => ({
    ...poll,
    poll_options: poll.poll_options.map(option => {
      const updatedCount = voteUpdates.get(option.id);
      if (updatedCount !== undefined) {
        return { ...option, vote_count: updatedCount };
      }
      return option;
    })
  }));
}

export const useRealtimePolls = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [totalVotes, setTotalVotes] = useState(0);

  // Use refs to track state without causing re-renders or stale closures
  const hasConnectedRef = useRef(false);
  const pollsRef = useRef<Poll[]>([]);

  // Calculate total votes from all polls
  const calculateTotalVotes = useCallback((pollsData: Poll[]) => {
    return pollsData.reduce((total, poll) => {
      return total + poll.poll_options.reduce((pollTotal, option) => {
        return pollTotal + (option.vote_count || 0);
      }, 0);
    }, 0);
  }, []);

  // Stable status update function
  const setConnectedStatus = useCallback(() => {
    if (!hasConnectedRef.current) {
      console.log('[Supabase] Connected');
      hasConnectedRef.current = true;
    }
    setConnectionStatus('connected');
  }, []);

  // Load initial polls data
  const loadPolls = useCallback(async () => {
    try {
      console.log('[Supabase] Loading polls...');
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select(`
          id,
          question,
          created_at,
          poll_options (
            id,
            text,
            vote_count,
            poll_id
          )
        `)
        .order('created_at', { ascending: false });

      if (pollsError) throw pollsError;

      const pollsArray = pollsData || [];
      pollsRef.current = pollsArray;
      setPolls(pollsArray);
      setTotalVotes(calculateTotalVotes(pollsArray));
      console.log('[Supabase] Loaded', pollsArray.length, 'polls');
      setConnectedStatus();
    } catch (error) {
      console.error('[Supabase] Error loading polls:', error);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [calculateTotalVotes, setConnectedStatus]);

  // Update vote count for a specific option (for local optimistic updates)
  const updateOptionVoteCount = useCallback((optionId: string, voteCount: number) => {
    setPolls(prevPolls => {
      const updatedPolls = prevPolls.map(poll => ({
        ...poll,
        poll_options: poll.poll_options.map(option =>
          option.id === optionId
            ? { ...option, vote_count: voteCount }
            : option
        )
      }));
      pollsRef.current = updatedPolls;
      setTotalVotes(calculateTotalVotes(updatedPolls));
      return updatedPolls;
    });
  }, [calculateTotalVotes]);

  // Add new poll when created
  const addPoll = useCallback((newPoll: Poll) => {
    setPolls(prevPolls => {
      const updatedPolls = [newPoll, ...prevPolls];
      pollsRef.current = updatedPolls;
      setTotalVotes(calculateTotalVotes(updatedPolls));
      return updatedPolls;
    });
  }, [calculateTotalVotes]);

  useEffect(() => {
    console.log('[Supabase] Setting up real-time subscriptions...');

    // Validate environment variables
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      console.error('[Supabase] Missing environment variables');
      setConnectionStatus('disconnected');
      setLoading(false);
      return;
    }

    // Load initial data
    loadPolls();

    // Set up real-time subscription for poll CRUD only
    // Vote count updates are handled by Lightstreamer when enabled
    const channel = supabase
      .channel('poll-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'polls' },
        (payload) => {
          console.log('[Supabase] New poll created:', payload);
          loadPolls();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'poll_options' },
        (payload) => {
          console.log('[Supabase] New poll option created:', payload);
          loadPolls();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'polls' },
        (payload) => {
          console.log('[Supabase] Poll deleted:', payload);
          loadPolls();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'poll_options' },
        (payload) => {
          // Fallback: Still listen for vote updates via Supabase when Lightstreamer is disabled
          console.log('[Supabase] Vote count updated:', payload);
          const updatedOption = payload.new as PollOption;
          updateOptionVoteCount(updatedOption.id, updatedOption.vote_count);
        }
      )
      .subscribe((status, err) => {
        console.log('[Supabase] Subscription status:', status, err || '');
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase] Real-time connected');
          setConnectedStatus();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.log('[Supabase] Real-time connection issue:', status);
        }
      });

    // Cleanup
    return () => {
      console.log('[Supabase] Cleaning up subscriptions');
      supabase.removeChannel(channel);
    };
  }, [loadPolls, updateOptionVoteCount, setConnectedStatus]);

  return {
    polls,
    loading,
    connectionStatus,
    totalVotes,
    loadPolls,
    addPoll,
    updateOptionVoteCount
  };
};
