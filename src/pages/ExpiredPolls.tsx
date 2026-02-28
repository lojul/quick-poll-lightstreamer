import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Poll } from '@/types/poll';
import { PollCard } from '@/components/PollCard';
import { Button } from '@/components/ui/button';
import { Vote, ArrowLeft, Archive } from 'lucide-react';
import { useRealtimePolls } from '@/hooks/useRealtimePolls';
import { isPast } from 'date-fns';

const ExpiredPolls = () => {
  const { polls: allPolls, loading } = useRealtimePolls();

  // Filter only expired polls
  const expiredPolls = useMemo(() => {
    return allPolls.filter((poll) => {
      if (!poll.deadline) return false;
      return isPast(new Date(poll.deadline));
    });
  }, [allPolls]);

  // Dummy handler - voting disabled on expired polls anyway
  const handleVote = () => {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 mb-6">
            <Archive className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500 bg-clip-text text-transparent">
            已截止投票
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            這些投票已經截止，只供查看結果。
          </p>

          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回進行中投票
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">載入投票中...</p>
            </div>
          ) : expiredPolls.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                <Archive className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">沒有已截止的投票</h3>
              <p className="text-muted-foreground">所有投票仍在進行中！</p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-500">
                共 {expiredPolls.length} 個已截止投票
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {expiredPolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    onVote={handleVote}
                    hasVoted={true} // Show as "already voted" to display results view
                    isAuthenticated={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <div className="flex justify-center gap-4">
            <Link to="/terms" className="hover:text-primary transition-colors">
              服務條款
            </Link>
            <span>|</span>
            <span>© 2026 CatPawVote</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ExpiredPolls;
