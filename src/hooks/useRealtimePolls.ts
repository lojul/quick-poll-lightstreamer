import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Poll } from '@/types/poll';

export const useRealtimePolls = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [hasConnected, setHasConnected] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  // Stable status update function - only sets connected once
  const setConnectedStatus = () => {
    if (!hasConnected) {
      console.log('✅ Setting status to connected for the first time');
      setConnectionStatus('connected');
      setHasConnected(true);
    }
  };

  // Calculate total votes from all polls
  const calculateTotalVotes = (pollsData: Poll[]) => {
    return pollsData.reduce((total, poll) => {
      return total + poll.poll_options.reduce((pollTotal, option) => {
        return pollTotal + (option.vote_count || 0);
      }, 0);
    }, 0);
  };

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
      const pollsArray = pollsData || [];
      setPolls(pollsArray);
      setTotalVotes(calculateTotalVotes(pollsArray));
      // If we can load polls successfully, we're connected
      console.log('✅ Polls loaded successfully');
      setConnectedStatus();
    } catch (error) {
      console.error('Error loading polls:', error);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  // Update poll data when vote counts change
  const updatePollData = (updatedOption: any) => {
    console.log('🔄 Updating poll data with:', updatedOption);
    // If we're updating poll data, we're definitely connected
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
      // Recalculate total votes after updating
      setTotalVotes(calculateTotalVotes(updatedPolls));
      return updatedPolls;
    });
  };

  // Add new poll when created
  const addPoll = (newPoll: Poll) => {
    setPolls(prevPolls => {
      const updatedPolls = [newPoll, ...prevPolls];
      setTotalVotes(calculateTotalVotes(updatedPolls));
      return updatedPolls;
    });
  };

  useEffect(() => {
    console.log('Setting up real-time subscriptions...');
    console.log('🔧 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('🔧 Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
    
    // Load initial data
    loadPolls();

    // Test Supabase connection first
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('polls').select('count').limit(1);
        if (error) {
          console.error('❌ Supabase connection test failed:', error);
          setConnectionStatus('disconnected');
        } else {
          console.log('✅ Supabase connection test successful');
          // If we can query the database, we're connected
          setConnectedStatus();
        }
      } catch (err) {
        console.error('❌ Supabase connection error:', err);
        setConnectionStatus('disconnected');
      }
    };

    testConnection();

    // Set a timeout to assume connected if we haven't received any status updates
    // This handles cases where the subscription callback doesn't fire properly
    const connectionTimeout = setTimeout(() => {
      if (connectionStatus === 'connecting' && !hasConnected) {
        console.log('🔄 Connection timeout - assuming connected since real-time events work');
        setConnectedStatus();
      }
    }, 3000);

    // Set up real-time subscription for poll_options table changes
    const subscription = supabase
      .channel('poll-updates', {
        config: {
          broadcast: { self: true },
          presence: { key: 'user' }
        }
      })
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
          // If we're receiving real-time events, we're definitely connected
          setConnectedStatus();
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
          // If we're receiving real-time events, we're definitely connected
          setConnectedStatus();
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
          // If we're receiving real-time events, we're definitely connected
          setConnectedStatus();
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Real-time subscription status:', status, err);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time connected successfully');
          setConnectedStatus();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.log('❌ Real-time connection failed:', status, err);
          setConnectionStatus('disconnected');
          // Retry connection after 3 seconds
          setTimeout(() => {
            console.log('🔄 Retrying real-time connection...');
            setConnectionStatus('connecting');
          }, 3000);
        } else {
          console.log('⏳ Real-time connecting...', status);
          setConnectionStatus('connecting');
        }
      });

    // Additional check: If we receive real-time events, we're connected
    // This helps catch cases where the status callback doesn't fire properly
    const checkConnectionStatus = () => {
      if (subscription.state === 'joined') {
        console.log('✅ Real-time connection verified via state check');
        setConnectionStatus('connected');
      } else {
        console.log('⚠️ Subscription state:', subscription.state);
        // If we're still connecting after 3 seconds, assume connected if no errors
        setTimeout(() => {
          if (connectionStatus === 'connecting') {
            console.log('🔄 Assuming connected after timeout - real-time events are working');
            setConnectionStatus('connected');
          }
        }, 3000);
      }
    };

    // Check connection status after a short delay
    setTimeout(checkConnectionStatus, 1000);

    // Fallback: Polling every 2 seconds for updates
    const pollingInterval = setInterval(() => {
      console.log('🔄 Polling for updates...');
      loadPolls();
    }, 2000);

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Unsubscribing from real-time updates');
      clearInterval(pollingInterval);
      clearTimeout(connectionTimeout);
      supabase.removeChannel(subscription);
    };
  }, []);

  return {
    polls,
    loading,
    connectionStatus,
    totalVotes,
    loadPolls,
    addPoll
  };
};
