import { useState, useEffect } from 'react';
import { CreatePoll } from '@/components/CreatePoll';
import { PollList } from '@/components/PollList';
import { Button } from '@/components/ui/button';
import { Poll, CreatePollData } from '@/types/poll';
import { PlusCircle, Vote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { seedPolls } from '@/utils/seedPolls';

const Index = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load polls from Supabase
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
      toast({
        title: "Error",
        description: "Failed to load polls. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
  }, []);

  // Helper function to seed polls (for demo purposes)
  const handleSeedPolls = async () => {
    const success = await seedPolls();
    if (success) {
      toast({
        title: "Polls seeded!",
        description: "21 demo polls have been added to the database.",
      });
      loadPolls(); // Refresh the polls list
    } else {
      toast({
        title: "Error",
        description: "Failed to seed polls.",
        variant: "destructive"
      });
    }
  };

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
      loadPolls(); // Refresh polls
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
      // Record the vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          poll_id: pollId,
          option_id: optionId
        });

      if (voteError) throw voteError;

      // Update vote count - manual increment
      const { data: option } = await supabase
        .from('poll_options')
        .select('vote_count')
        .eq('id', optionId)
        .single();
      
      await supabase
        .from('poll_options')
        .update({ vote_count: (option?.vote_count || 0) + 1 })
        .eq('id', optionId);

      setVotedPolls(prev => new Set([...prev, pollId]));
      loadPolls(); // Refresh polls to show updated vote counts
      toast({
        title: "Vote recorded!",
        description: "Thank you for participating in the poll.",
      });
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to record vote. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary to-purple-600 mb-6">
            <Vote className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-purple-600 bg-clip-text text-transparent">
            Quick Polls
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create polls instantly and gather opinions from anyone. Simple, fast, and beautiful.
          </p>
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
          
          {polls.length === 0 && !loading && (
            <div className="mt-4">
              <Button
                onClick={handleSeedPolls}
                variant="outline"
                size="sm"
              >
                Add 21 Demo Polls
              </Button>
            </div>
          )}
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
