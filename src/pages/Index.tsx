import { useState } from 'react';
import { CreatePoll } from '@/components/CreatePoll';
import { PollList } from '@/components/PollList';
import { Button } from '@/components/ui/button';
import { Poll, CreatePollData } from '@/types/poll';
import { PlusCircle, Vote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const createPoll = (pollData: CreatePollData) => {
    const newPoll: Poll = {
      id: crypto.randomUUID(),
      question: pollData.question,
      options: pollData.options.map(text => ({
        id: crypto.randomUUID(),
        text,
        votes: 0
      })),
      createdAt: new Date(),
      totalVotes: 0
    };

    setPolls(prev => [newPoll, ...prev]);
    setShowCreateForm(false);
    toast({
      title: "Poll created!",
      description: "Your poll is now live and ready for votes.",
    });
  };

  const handleVote = (pollId: string, optionId: string) => {
    setPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        return {
          ...poll,
          options: poll.options.map(option => 
            option.id === optionId 
              ? { ...option, votes: option.votes + 1 }
              : option
          ),
          totalVotes: poll.totalVotes + 1
        };
      }
      return poll;
    }));

    setVotedPolls(prev => new Set([...prev, pollId]));
    toast({
      title: "Vote recorded!",
      description: "Thank you for participating in the poll.",
    });
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

        {/* Action Button */}
        <div className="text-center mb-12">
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
          
          <PollList
            polls={polls}
            onVote={handleVote}
            votedPolls={votedPolls}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
