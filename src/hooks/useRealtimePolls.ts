import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Poll, PollOption } from '@/types/poll';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

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
      console.log('✅ Setting status to connected');
      hasConnectedRef.current = true;
    }
    setConnectionStatus('connected');
  }, []);

  // Load initial polls data
  const loadPolls = useCallback(async () => {
    try {
      console.log('📡 Loading polls...');
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
      console.log('✅ Loaded', pollsArray.length, 'polls');
      setConnectedStatus();
    } catch (error) {
      console.error('❌ Error loading polls:', error);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [calculateTotalVotes, setConnectedStatus]);

  // Update poll data when vote counts change
  const updatePollData = useCallback((updatedOption: PollOption) => {
    console.log('🔄 Updating poll data with:', updatedOption);
    setConnectedStatus();
    setPolls(prevPolls => {
      const updatedPolls = prevPolls.map(poll => ({
        ...poll,
        poll_options: poll.poll_options.map(option =>
          option.id === updatedOption.id
            ? { ...option, vote_count: updatedOption.vote_count }
            : option
        )
      }));
      pollsRef.current = updatedPolls;
      setTotalVotes(calculateTotalVotes(updatedPolls));
      return updatedPolls;
    });
  }, [calculateTotalVotes, setConnectedStatus]);

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
    console.log('🔧 Setting up real-time subscriptions...');
    console.log('🔧 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('🔧 Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

    // Validate environment variables
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase environment variables');
      setConnectionStatus('disconnected');
      setLoading(false);
      return;
    }

    // Load initial data
    loadPolls();

    // Set up real-time subscription
    const channel = supabase
      .channel('poll-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'poll_options' },
        (payload) => {
          console.log('🔔 Real-time: Vote count updated:', payload);
          updatePollData(payload.new as PollOption);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'polls' },
        (payload) => {
          console.log('🔔 Real-time: New poll created:', payload);
          loadPolls();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'poll_options' },
        (payload) => {
          console.log('🔔 Real-time: New poll option created:', payload);
          loadPolls();
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Subscription status:', status, err || '');
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time connected');
          setConnectedStatus();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.log('❌ Real-time connection issue:', status);
          // Don't set disconnected immediately - polling will keep working
        }
      });

    // Fallback polling every 5 seconds (less aggressive)
    const pollingInterval = setInterval(() => {
      loadPolls();
    }, 5000);

    // Cleanup
    return () => {
      console.log('🔌 Cleaning up subscriptions');
      clearInterval(pollingInterval);
      supabase.removeChannel(channel);
    };
  }, [loadPolls, updatePollData, setConnectedStatus]);

  return {
    polls,
    loading,
    connectionStatus,
    totalVotes,
    loadPolls,
    addPoll
  };
};
