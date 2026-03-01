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

/**
 * Get total votes for a poll
 */
function getTotalVotes(poll: Poll): number {
  return poll.poll_options.reduce((sum, opt) => sum + (opt.vote_count || 0), 0);
}

/**
 * Tiered sorting algorithm:
 * - Slots 1-2: Latest voted polls with >5 votes (recency/live)
 * - Slots 3-10: Most voted (trending/popularity)
 * - Slots 11-20: Composite (votes DESC, last_voted DESC, created DESC)
 * - Slots 21+: Most votes, then last_voted DESC
 */
export function sortPollsTiered(polls: Poll[]): Poll[] {
  const MIN_VOTES_THRESHOLD = 5;

  // Add computed fields for sorting
  const pollsWithStats = polls.map(poll => ({
    poll,
    totalVotes: getTotalVotes(poll),
    lastVotedAt: poll.last_voted_at ? new Date(poll.last_voted_at).getTime() : 0,
    createdAt: new Date(poll.created_at).getTime(),
  }));

  // Tier 1-2: Latest voted with >5 votes (recency)
  const recentlyVoted = pollsWithStats
    .filter(p => p.totalVotes >= MIN_VOTES_THRESHOLD && p.lastVotedAt > 0)
    .sort((a, b) => b.lastVotedAt - a.lastVotedAt)
    .slice(0, 2);

  const tier1Ids = new Set(recentlyVoted.map(p => p.poll.id));

  // Remaining polls after tier 1
  const remaining = pollsWithStats.filter(p => !tier1Ids.has(p.poll.id));

  // Tier 3-10: Most voted (popularity)
  const mostVoted = [...remaining]
    .sort((a, b) => b.totalVotes - a.totalVotes)
    .slice(0, 8);

  const tier2Ids = new Set(mostVoted.map(p => p.poll.id));

  // Remaining after tier 2
  const remaining2 = remaining.filter(p => !tier2Ids.has(p.poll.id));

  // Tier 11-20: Composite score (votes DESC, last_voted DESC, created DESC)
  const composite = [...remaining2]
    .sort((a, b) => {
      // Primary: votes DESC
      if (b.totalVotes !== a.totalVotes) return b.totalVotes - a.totalVotes;
      // Secondary: last_voted DESC
      if (b.lastVotedAt !== a.lastVotedAt) return b.lastVotedAt - a.lastVotedAt;
      // Tertiary: created DESC
      return b.createdAt - a.createdAt;
    })
    .slice(0, 10);

  const tier3Ids = new Set(composite.map(p => p.poll.id));

  // Tier 21+: Remaining sorted by votes DESC, last_voted DESC
  const rest = remaining2
    .filter(p => !tier3Ids.has(p.poll.id))
    .sort((a, b) => {
      if (b.totalVotes !== a.totalVotes) return b.totalVotes - a.totalVotes;
      return b.lastVotedAt - a.lastVotedAt;
    });

  // Combine all tiers
  return [
    ...recentlyVoted.map(p => p.poll),
    ...mostVoted.map(p => p.poll),
    ...composite.map(p => p.poll),
    ...rest.map(p => p.poll),
  ];
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
          deadline,
          last_voted_at,
          poll_options (
            id,
            text,
            vote_count,
            poll_id
          )
        `);

      if (pollsError) throw pollsError;

      // Apply tiered sorting algorithm on initial load
      const sortedPolls = sortPollsTiered(pollsData || []);
      pollsRef.current = sortedPolls;
      setPolls(sortedPolls);
      setTotalVotes(calculateTotalVotes(sortedPolls));
      console.log('[Supabase] Loaded', sortedPolls.length, 'polls');
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
