import { useState } from 'react';
import { CreatePoll } from '@/components/CreatePoll';
import { PollList } from '@/components/PollList';
import { Button } from '@/components/ui/button';
import { Poll, CreatePollData } from '@/types/poll';
import { PlusCircle, Vote, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealtimePolls } from '@/hooks/useRealtimePolls';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  // Use real-time polls hook
  const { polls, loading, connectionStatus, loadPolls, addPoll } = useRealtimePolls();



  const createPoll = async (pollData: CreatePollData) => {
    try {
      // Create poll
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({ question: pollData.question })
        .select()
        .single();

      if (pollError) throw pollError;

      // Create poll options
      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(
          pollData.options.map(text => ({
            poll_id: poll.id,
            text
          }))
        );

      if (optionsError) throw optionsError;

      setShowCreateForm(false);
      // Real-time updates will handle the new poll automatically
      toast({
        title: "Poll created!",
        description: "Your poll is now live and ready for votes.",
      });
    } catch (error) {
      console.error('Error creating poll:', error);
      toast({
        title: "Error",
        description: "Failed to create poll. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      console.log('🗳️ Recording vote for poll:', pollId, 'option:', optionId);
      
      // Record the vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          poll_id: pollId,
          option_id: optionId
        });

      if (voteError) throw voteError;
      console.log('✅ Vote recorded in votes table');

      // Update vote count - manual increment
      const { data: option } = await supabase
        .from('poll_options')
        .select('vote_count')
        .eq('id', optionId)
        .single();
      
      const newVoteCount = (option?.vote_count || 0) + 1;
      console.log('📊 Updating vote count from', option?.vote_count, 'to', newVoteCount);
      
      const { error: updateError } = await supabase
        .from('poll_options')
        .update({ vote_count: newVoteCount })
        .eq('id', optionId);

      if (updateError) throw updateError;
      console.log('✅ Vote count updated in poll_options table');

      setVotedPolls(prev => new Set([...prev, pollId]));
      // Real-time updates will handle the vote count changes automatically
      toast({
        title: "Vote recorded!",
        description: "Thank you for participating in the poll.",
      });
    } catch (error) {
      console.error('❌ Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to record vote. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary to-purple-600 mb-6">
            <Vote className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-purple-600 bg-clip-text text-transparent">
            Quick Polls
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Create polls instantly and gather opinions from anyone. Simple, fast, and beautiful.
          </p>
          
          {/* Real-time connection status */}
          <div className="flex items-center justify-center gap-2 text-sm">
            {connectionStatus === 'connected' ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">Live Updates Active</span>
              </>
            ) : connectionStatus === 'disconnected' ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-600 font-medium">Auto-Refresh Every 2s</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-yellow-600 font-medium">Connecting...</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center mb-12 space-y-4">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="lg"
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold px-8"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            {showCreateForm ? 'Cancel' : 'Create New Poll'}
          </Button>
          
        </div>

        {/* Content */}
        <div className="space-y-12">
          {showCreateForm && (
            <CreatePoll onCreatePoll={createPoll} />
          )}
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading polls...</p>
            </div>
          ) : (
            <PollList
              polls={polls}
              onVote={handleVote}
              votedPolls={votedPolls}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
