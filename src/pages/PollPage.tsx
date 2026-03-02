import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Vote, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PollCard } from '@/components/PollCard';
import { AuthModal } from '@/components/AuthModal';
import { TopUpModal } from '@/components/TopUpModal';
import { InsufficientCreditsModal } from '@/components/InsufficientCreditsModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCredits, VOTE_COST } from '@/hooks/useCredits';
import { useToast } from '@/hooks/use-toast';
import { useLightstreamerVotes } from '@/hooks/useLightstreamerVotes';
import { RealtimeIndicator } from '@/components/RealtimeIndicator';
import { Poll } from '@/types/poll';

const PollPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [insufficientCreditsState, setInsufficientCreditsState] = useState<{
    open: boolean;
    action: 'poll' | 'vote';
    creditsNeeded: number;
  }>({ open: false, action: 'vote', creditsNeeded: 0 });

  // Auth hook
  const { user, isAuthenticated, signUp, signIn, resendVerificationEmail, resetPassword } = useAuth();

  // Credits hook
  const { credits, hasEnoughForVote, deductForVote } = useCredits();

  // Lightstreamer for real-time votes
  const {
    voteUpdates,
    flashingOptions,
    connectionStatus: lightstreamerStatus,
    isEnabled: lightstreamerEnabled,
    setOptionIds,
    lastUpdate
  } = useLightstreamerVotes();

  // Fetch the specific poll
  useEffect(() => {
    const fetchPoll = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('polls')
          .select(`
            id,
            question,
            created_at,
            deadline,
            last_voted_at,
            poll_options (
              id,
              text,
              vote_count
            )
          `)
          .eq('id', id)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setPoll(data as Poll);
          // Subscribe to Lightstreamer for this poll's options
          if (lightstreamerEnabled) {
            const optionIds = data.poll_options.map((opt: { id: string }) => opt.id);
            setOptionIds(optionIds);
          }
        }
      } catch (error) {
        console.error('Error fetching poll:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [id, lightstreamerEnabled, setOptionIds]);

  // Load user's voted polls
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setVotedPolls(new Set());
      return;
    }

    const loadUserVotes = async () => {
      const { data: votes } = await supabase
        .from('votes')
        .select('poll_id')
        .eq('voter_id', user.id);

      if (votes && votes.length > 0) {
        const pollIds = votes.map(v => v.poll_id);
        setVotedPolls(new Set(pollIds));
      }
    };

    loadUserVotes();
  }, [isAuthenticated, user]);

  // Merge Lightstreamer updates into poll
  const mergedPoll = useMemo(() => {
    if (!poll || !lightstreamerEnabled || voteUpdates.size === 0) {
      return poll;
    }

    return {
      ...poll,
      poll_options: poll.poll_options.map(option => ({
        ...option,
        vote_count: voteUpdates.get(option.id) ?? option.vote_count
      }))
    };
  }, [poll, voteUpdates, lightstreamerEnabled]);

  // Optimistic updates
  const [optimisticFlash, setOptimisticFlash] = useState<Set<string>>(new Set());
  const [optimisticVoteCounts, setOptimisticVoteCounts] = useState<Map<string, number>>(new Map());

  const combinedFlashingOptions = useMemo(() => {
    return new Set([...flashingOptions, ...optimisticFlash]);
  }, [flashingOptions, optimisticFlash]);

  const handleVote = async (pollId: string, optionId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "請先登入",
        description: "登入後即可參與投票。",
      });
      setShowAuthModal(true);
      return;
    }

    if (votedPolls.has(pollId)) {
      toast({
        title: "已經投過票了",
        description: "每個投票只能投一次。",
        variant: "destructive"
      });
      return;
    }

    // Optimistic updates
    setVotedPolls(prev => new Set([...prev, pollId]));
    setOptimisticFlash(prev => new Set([...prev, optionId]));
    setTimeout(() => {
      setOptimisticFlash(prev => {
        const next = new Set(prev);
        next.delete(optionId);
        return next;
      });
    }, 600);

    setOptimisticVoteCounts(prev => {
      const next = new Map(prev);
      next.set(optionId, (prev.get(optionId) || 0) + 1);
      return next;
    });
    setTimeout(() => {
      setOptimisticVoteCounts(prev => {
        const next = new Map(prev);
        next.delete(optionId);
        return next;
      });
    }, 2000);

    if (!hasEnoughForVote) {
      // Rollback
      setVotedPolls(prev => {
        const next = new Set(prev);
        next.delete(pollId);
        return next;
      });
      setOptimisticFlash(prev => {
        const next = new Set(prev);
        next.delete(optionId);
        return next;
      });
      setOptimisticVoteCounts(prev => {
        const next = new Map(prev);
        next.delete(optionId);
        return next;
      });
      setInsufficientCreditsState({
        open: true,
        action: 'vote',
        creditsNeeded: VOTE_COST,
      });
      return;
    }

    try {
      const { error: rpcError } = await supabase
        .rpc('cast_vote', {
          p_poll_id: pollId,
          p_option_id: optionId,
          p_voter_id: user!.id,
        });

      if (rpcError) {
        if (rpcError.code === '23505') {
          toast({
            title: "已經投過票了",
            description: "每個投票只能投一次。",
            variant: "destructive"
          });
          return;
        }
        throw rpcError;
      }

      deductForVote(pollId).catch(err => {
        console.warn('Failed to deduct credits for vote:', err);
      });

      toast({
        title: "投票已記錄！",
        description: `感謝您參與投票。已扣除 ${VOTE_COST} 貓爪幣。`,
      });
    } catch (error) {
      console.error('[Vote] Error:', error);
      // Rollback
      setVotedPolls(prev => {
        const next = new Set(prev);
        next.delete(pollId);
        return next;
      });
      setOptimisticVoteCounts(prev => {
        const next = new Map(prev);
        next.delete(optionId);
        return next;
      });
      toast({
        title: "錯誤",
        description: "記錄投票失敗，請重試。",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">載入投票中...</p>
        </div>
      </div>
    );
  }

  if (notFound || !mergedPoll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-bold mb-2">找不到投票</h1>
          <p className="text-muted-foreground mb-4">此投票可能已被刪除或不存在</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首頁
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSignUp={signUp}
        onSignIn={signIn}
        onResendVerification={resendVerificationEmail}
        onResetPassword={resetPassword}
      />

      {/* Top Up Modal */}
      <TopUpModal
        open={showTopUpModal}
        onOpenChange={setShowTopUpModal}
      />

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        open={insufficientCreditsState.open}
        onOpenChange={(open) => setInsufficientCreditsState(prev => ({ ...prev, open }))}
        onTopUp={() => {
          setInsufficientCreditsState(prev => ({ ...prev, open: false }));
          setShowTopUpModal(true);
        }}
        creditsNeeded={insufficientCreditsState.creditsNeeded}
        currentCredits={credits ?? 0}
        action={insufficientCreditsState.action}
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <svg viewBox="0 0 100 100" className="w-16 h-16">
                <defs>
                  <linearGradient id="pawGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#9333ea' }} />
                    <stop offset="100%" style={{ stopColor: '#7c3aed' }} />
                  </linearGradient>
                </defs>
                <ellipse cx="50" cy="62" rx="32" ry="28" fill="url(#pawGradient)" />
                <circle cx="22" cy="28" r="14" fill="url(#pawGradient)" />
                <circle cx="41" cy="16" r="12" fill="url(#pawGradient)" />
                <circle cx="59" cy="16" r="12" fill="url(#pawGradient)" />
                <circle cx="78" cy="28" r="14" fill="url(#pawGradient)" />
                <text x="50" y="70" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="white">VOTE</text>
              </svg>
            </div>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-500 to-purple-600 bg-clip-text text-transparent">
            貓爪達人投票社
          </h1>

          {/* Back button and status */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首頁
              </Button>
            </Link>
            <RealtimeIndicator
              status="connected"
              lightstreamerStatus={lightstreamerEnabled ? lightstreamerStatus : undefined}
              lastUpdate={lastUpdate}
            />
          </div>
        </div>

        {/* Poll */}
        <div className="mb-8">
          <PollCard
            poll={mergedPoll}
            onVote={handleVote}
            hasVoted={votedPolls.has(mergedPoll.id)}
            isAuthenticated={isAuthenticated}
            flashingOptions={combinedFlashingOptions}
            optimisticVoteCounts={optimisticVoteCounts}
          />
        </div>

        {/* Call to action */}
        <div className="text-center mb-8">
          <Link to="/">
            <Button variant="outline">
              <Vote className="w-4 h-4 mr-2" />
              探索更多投票
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <footer className="pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <div className="flex justify-center gap-4">
            <Link to="/terms" className="hover:text-primary transition-colors">
              服務條款
            </Link>
            <span>|</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              私隱政策
            </Link>
            <span>|</span>
            <span>© 2026 CatPawVote</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PollPage;
