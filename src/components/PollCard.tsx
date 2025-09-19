import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Poll } from '@/types/poll';
import { formatDistanceToNow } from 'date-fns';

interface PollCardProps {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => void;
  hasVoted?: boolean;
}

export function PollCard({ poll, onVote, hasVoted = false }: PollCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleVote = () => {
    if (selectedOption) {
      onVote(poll.id, selectedOption);
      setSelectedOption(null);
    }
  };

  const totalVotes = poll.poll_options.reduce((sum, option) => sum + option.vote_count, 0);
  
  const getPercentage = (votes: number) => {
    return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  };

  return (
    <Card className="p-6 bg-poll-card border-poll-card-border hover:border-primary/30 transition-all duration-300">
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-xl font-semibold leading-tight">{poll.question}</h3>
          <Badge variant="secondary" className="shrink-0">
            {totalVotes} votes
          </Badge>
        </div>

        <div className="space-y-3">
          {poll.poll_options.map((option) => {
            const percentage = getPercentage(option.vote_count);
            const isSelected = selectedOption === option.id;
            
            return (
              <div key={option.id} className="space-y-2">
                {!hasVoted ? (
                  <div className="relative">
                    <button
                      onClick={() => setSelectedOption(option.id)}
                      className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
                        isSelected
                          ? 'bg-poll-option-selected border-poll-option-selected text-white'
                          : 'bg-poll-option border-poll-card-border hover:bg-poll-option-hover hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option.text}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {option.vote_count} votes ({percentage}%)
                          </span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-poll-option-selected"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                    {/* Progress bar for visual representation */}
                    {totalVotes > 0 && (
                      <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative p-4 rounded-lg bg-poll-result-bg border border-poll-card-border overflow-hidden">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative flex items-center justify-between">
                      <span className="font-medium">{option.text}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {option.vote_count} votes
                        </span>
                        <Badge variant="outline">{percentage}%</Badge>
                      </div>
                    </div>
                    {/* Progress bar for voted state */}
                    <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!hasVoted && (
          <Button
            onClick={handleVote}
            disabled={!selectedOption}
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold"
          >
            Vote
          </Button>
        )}

        <div className="flex justify-between items-center text-sm text-muted-foreground pt-2 border-t border-poll-card-border">
          <span>Created {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}</span>
          {hasVoted && (
            <Badge variant="outline" className="bg-success/20 text-success border-success/50">
              Voted
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}