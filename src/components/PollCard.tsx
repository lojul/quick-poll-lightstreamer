import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Poll } from '@/types/poll';
import { PollChart } from './PollChart';
import { formatDistanceToNow, isPast } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { BarChart3, List, Clock, AlertCircle, Coins, Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { VOTE_COST } from '@/hooks/useCredits';

interface PollCardProps {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => void;
  hasVoted?: boolean;
  isAuthenticated?: boolean;
  flashingOptions?: Set<string>;
  optimisticVoteCounts?: Map<string, number>;
}

export function PollCard({ poll, onVote, hasVoted = false, isAuthenticated = false, flashingOptions = new Set(), optimisticVoteCounts = new Map() }: PollCardProps) {
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/poll/${poll.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle case where deadline doesn't exist yet (before migration)
  const hasDeadline = !!poll.deadline;
  const deadlineDate = hasDeadline ? new Date(poll.deadline) : null;
  const isExpired = deadlineDate ? isPast(deadlineDate) : false;
  const canVote = !hasVoted && !isExpired;

  const handleOptionClick = (optionId: string) => {
    if (canVote) {
      onVote(poll.id, optionId);
    }
  };

  // Helper to get vote count with optimistic increment
  const getVoteCount = (option: { id: string; vote_count: number }) => {
    return option.vote_count + (optimisticVoteCounts.get(option.id) || 0);
  };

  const totalVotes = poll.poll_options.reduce((sum, option) => sum + getVoteCount(option), 0);

  const getPercentage = (votes: number) => {
    return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  };

  return (
    <Card className="p-6 bg-poll-card border-poll-card-border hover:border-primary/30 transition-all duration-300">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
          <div className="space-y-1 min-w-0">
            <h3 className="text-xl font-semibold leading-tight break-words">{poll.question}</h3>
            {/* Deadline indicator */}
            {hasDeadline && (
              <div className={`flex items-center gap-1 text-sm ${isExpired ? 'text-red-500' : 'text-muted-foreground'}`}>
                {isExpired ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>已截止</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>剩餘 {formatDistanceToNow(deadlineDate!, { locale: zhTW })}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
            {hasDeadline && isExpired && (
              <Badge variant="destructive">已截止</Badge>
            )}
            <Badge variant="secondary">
              {totalVotes} 票
            </Badge>
            {totalVotes > 0 && (
              <div className="flex gap-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'chart' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('chart')}
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {viewMode === 'chart' && totalVotes > 0 ? (
          <div className="space-y-4">
            <PollChart options={poll.poll_options} />
            <div className="text-sm text-muted-foreground text-center">
              總票數: {totalVotes}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {poll.poll_options.map((option) => {
              const voteCount = getVoteCount(option);
              const percentage = getPercentage(voteCount);
              const isFlashing = flashingOptions.has(option.id);

              return (
                <div key={option.id} className="space-y-2">
                  {canVote ? (
                    <div className={`relative rounded-lg ${isFlashing ? 'animate-vote-flash' : ''}`}>
                      <button
                        onClick={() => handleOptionClick(option.id)}
                        className="w-full p-4 rounded-lg border transition-all duration-200 text-left bg-poll-option border-poll-card-border hover:bg-poll-option-hover hover:border-primary/50 hover:shadow-md cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option.text}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm transition-all duration-200 ${isFlashing ? 'text-yellow-600 font-bold' : 'text-muted-foreground'}`}>
                              {voteCount} 票 ({percentage}%)
                            </span>
                            <div className="w-4 h-4 rounded-full border-2 border-primary/30 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-primary/50"></div>
                            </div>
                          </div>
                        </div>
                      </button>
                      {/* Progress bar for visual representation */}
                      {totalVotes > 0 && (
                        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${isFlashing ? 'bg-yellow-400' : 'bg-primary'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`relative p-4 rounded-lg bg-poll-result-bg border border-poll-card-border overflow-hidden ${isFlashing ? 'animate-vote-flash' : ''}`}>
                      <div
                        className={`absolute inset-0 transition-all duration-500 ${isFlashing ? 'bg-yellow-400/30' : 'bg-primary/10'}`}
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <span className="font-medium">{option.text}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm transition-all duration-200 ${isFlashing ? 'text-yellow-600 font-bold' : 'text-muted-foreground'}`}>
                            {voteCount} 票
                          </span>
                          <Badge variant="outline" className={isFlashing ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : ''}>{percentage}%</Badge>
                        </div>
                      </div>
                      {/* Progress bar for voted state */}
                      <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${isFlashing ? 'bg-yellow-400' : 'bg-primary'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}


        <div className="flex justify-between items-center text-sm text-muted-foreground pt-2 border-t border-poll-card-border">
          <div className="flex items-center gap-2">
            <span>建立於 {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-7 px-2 text-muted-foreground hover:text-primary"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-green-500" />
                  <span className="text-green-500 text-xs">已複製</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">分享</span>
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && canVote && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <Coins className="w-3 h-3" />
                {VOTE_COST} 貓爪幣
              </Badge>
            )}
            {hasVoted && (
              <Badge variant="outline" className="bg-success/20 text-success border-success/50">
                已投票
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}