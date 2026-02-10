import { useState, useEffect } from 'react';
import { CreatePoll } from '@/components/CreatePoll';
import { PollList } from '@/components/PollList';
import { Button } from '@/components/ui/button';
import { CreatePollData } from '@/types/poll';
import { PlusCircle, Vote, LogIn, LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealtimePolls } from '@/hooks/useRealtimePolls';
import { RealtimeIndicator } from '@/components/RealtimeIndicator';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const VOTED_POLLS_KEY = 'quick-polls-voted';

// Load voted polls from localStorage
const loadVotedPolls = (): Set<string> => {
  try {
    const stored = localStorage.getItem(VOTED_POLLS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

// Save voted polls to localStorage
const saveVotedPolls = (polls: Set<string>) => {
  try {
    localStorage.setItem(VOTED_POLLS_KEY, JSON.stringify([...polls]));
  } catch {
    // Ignore storage errors
  }
};

const Index = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(() => loadVotedPolls());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Auth hook
  const { user, isAuthenticated, signUp, signIn, signOut } = useAuth();

  // Save voted polls whenever they change
  useEffect(() => {
    saveVotedPolls(votedPolls);
  }, [votedPolls]);
  const { toast } = useToast();

  // Use real-time polls hook
  const { polls, loading, connectionStatus, totalVotes } = useRealtimePolls();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ title: '登出失敗', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '已登出', description: '下次見！' });
      setShowCreateForm(false);
    }
  };



  const createPoll = async (pollData: CreatePollData) => {
    try {
      // Create poll with deadline
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          question: pollData.question,
          deadline: pollData.deadline?.toISOString()
        })
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
        title: "投票已建立！",
        description: "您的投票現在已上線並準備接受投票。",
      });
    } catch (error) {
      console.error('Error creating poll:', error);
      toast({
        title: "錯誤",
        description: "建立投票失敗，請重試。",
        variant: "destructive"
      });
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    // Check if already voted
    if (votedPolls.has(pollId)) {
      toast({
        title: "已經投過票了",
        description: "每個投票只能投一次。",
        variant: "destructive"
      });
      return;
    }

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
      setLastUpdate(new Date());
      // Real-time updates will handle the vote count changes automatically
      toast({
        title: "投票已記錄！",
        description: "感謝您參與投票。",
      });
    } catch (error) {
      console.error('❌ Error voting:', error);
      toast({
        title: "錯誤",
        description: "記錄投票失敗，請重試。",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSignUp={signUp}
        onSignIn={signIn}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary to-purple-600 mb-6">
            <Vote className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-purple-600 bg-clip-text text-transparent">
            快速投票
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            立即建立投票並收集任何人的意見。簡單、快速且美觀。
          </p>
          
          {/* Stats display */}
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            {/* Total polls count */}
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Vote className="w-4 h-4 mr-2 text-primary" />
              <span className="text-sm font-medium text-primary">
                總共 {polls.length} 個投票
              </span>
            </div>
            
            {/* Total votes count */}
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <Vote className="w-4 h-4 mr-2 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                總共 {totalVotes} 票
              </span>
            </div>
          </div>
          
          {/* Real-time connection status - Centered */}
          <div className="flex justify-center">
            <RealtimeIndicator status={connectionStatus} lastUpdate={lastUpdate} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center mb-12 space-y-4">
          {isAuthenticated ? (
            <>
              {/* User info */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {user?.email}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  登出
                </Button>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold px-8"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                {showCreateForm ? '取消' : '建立新投票'}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setShowAuthModal(true)}
              size="lg"
              variant="outline"
              className="font-semibold px-8"
            >
              <LogIn className="w-5 h-5 mr-2" />
              登入以建立投票
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-12">
          {showCreateForm && isAuthenticated && (
            <CreatePoll onCreatePoll={createPoll} />
          )}
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">載入投票中...</p>
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
