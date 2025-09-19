import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Poll } from '@/types/poll';

export const useRealtimePolls = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  // Load initial polls data
  const loadPolls = async () => {
    try {
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
      setPolls(pollsData || []);
    } catch (error) {
      console.error('Error loading polls:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update poll data when vote counts change
  const updatePollData = (updatedOption: any) => {
    setPolls(prevPolls => 
      prevPolls.map(poll => ({
        ...poll,
        poll_options: poll.poll_options.map(option => 
          option.id === updatedOption.id 
            ? { ...option, vote_count: updatedOption.vote_count }
            : option
        )
      }))
    );
  };

  // Add new poll when created
  const addPoll = (newPoll: Poll) => {
    setPolls(prevPolls => [newPoll, ...prevPolls]);
  };

  useEffect(() => {
    // Load initial data
    loadPolls();

    // Set up real-time subscription for poll_options table changes
    const subscription = supabase
      .channel('poll-updates')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'poll_options' 
        },
        (payload) => {
          console.log('Vote count updated:', payload.new);
          updatePollData(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'polls' 
        },
        (payload) => {
          console.log('New poll created:', payload.new);
          // Reload polls to get the new poll with its options
          loadPolls();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'poll_options' 
        },
        (payload) => {
          console.log('New poll option created:', payload.new);
          // Reload polls to get the new poll options
          loadPolls();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('disconnected');
        } else {
          setConnectionStatus('connecting');
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Unsubscribing from real-time updates');
      supabase.removeChannel(subscription);
    };
  }, []);

  return {
    polls,
    loading,
    connectionStatus,
    loadPolls,
    addPoll
  };
};
