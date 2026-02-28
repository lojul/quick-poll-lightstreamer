import { Link } from 'react-router-dom';
import { Poll } from '@/types/poll';
import { PollCard } from './PollCard';
import { Archive } from 'lucide-react';

interface PollListProps {
  polls: Poll[];
  onVote: (pollId: string, optionId: string) => void;
  votedPolls: Set<string>;
  isAuthenticated?: boolean;
  flashingOptions?: Set<string>;
  expiredCount?: number;
}

export function PollList({ polls, onVote, votedPolls, isAuthenticated = false, flashingOptions = new Set(), expiredCount = 0 }: PollListProps) {
  if (polls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary/20 to-purple-600/20 flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">還沒有投票</h3>
        <p className="text-muted-foreground">建立您的第一個投票開始吧！</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
        進行中的投票
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {polls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            onVote={onVote}
            hasVoted={votedPolls.has(poll.id)}
            isAuthenticated={isAuthenticated}
            flashingOptions={flashingOptions}
          />
        ))}
      </div>

      {/* Link to expired polls */}
      {expiredCount > 0 && (
        <div className="text-center pt-4">
          <Link
            to="/expired"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Archive className="w-4 h-4" />
            查看 {expiredCount} 個已截止投票
          </Link>
        </div>
      )}
    </div>
  );
}