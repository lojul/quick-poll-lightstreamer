import { Poll } from '@/types/poll';
import { PollCard } from './PollCard';

interface PollListProps {
  polls: Poll[];
  onVote: (pollId: string, optionId: string) => void;
  votedPolls: Set<string>;
}

export function PollList({ polls, onVote, votedPolls }: PollListProps) {
  if (polls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary/20 to-purple-600/20 flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">No polls yet</h3>
        <p className="text-muted-foreground">Create your first poll to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
        Recent Polls
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {polls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            onVote={onVote}
            hasVoted={votedPolls.has(poll.id)}
          />
        ))}
      </div>
    </div>
  );
}