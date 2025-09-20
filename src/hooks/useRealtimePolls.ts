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
    console.log('🔄 Updating poll data with:', updatedOption);
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
    console.log('Setting up real-time subscriptions...');
    
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
          console.log('🔔 Real-time: Vote count updated:', payload);
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
          console.log('🔔 Real-time: New poll created:', payload);
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
          console.log('🔔 Real-time: New poll option created:', payload);
          // Reload polls to get the new poll options
          loadPolls();
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time connected successfully');
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.log('❌ Real-time connection failed:', status);
          setConnectionStatus('disconnected');
        } else {
          console.log('⏳ Real-time connecting...', status);
          setConnectionStatus('connecting');
        }
      });

    // Fallback: Polling every 2 seconds for updates
    const pollingInterval = setInterval(() => {
      console.log('🔄 Polling for updates...');
      loadPolls();
    }, 2000);

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Unsubscribing from real-time updates');
      clearInterval(pollingInterval);
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
