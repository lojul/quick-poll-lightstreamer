import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Vote, Loader2, Plus, Trash2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow, isPast } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface MyPoll {
  id: string;
  question: string;
  created_at: string;
  deadline: string | null;
  poll_options: {
    id: string;
    text: string;
    vote_count: number;
  }[];
}

const MyPolls = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [polls, setPolls] = useState<MyPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMyPolls = async () => {
      if (authLoading) return;

      if (!isAuthenticated || !user) {
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
            poll_options (
              id,
              text,
              vote_count
            )
          `)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPolls(data || []);
      } catch (error) {
        console.error('Error fetching polls:', error);
        toast({
          title: '錯誤',
          description: '無法載入您的投票',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMyPolls();
  }, [isAuthenticated, user, authLoading, toast]);

  const handleDelete = async (pollId: string) => {
    setDeletingId(pollId);
    try {
      // Delete poll options first (due to foreign key)
      const { error: optionsError } = await supabase
        .from('poll_options')
        .delete()
        .eq('poll_id', pollId);

      if (optionsError) throw optionsError;

      // Delete votes
      const { error: votesError } = await supabase
        .from('votes')
        .delete()
        .eq('poll_id', pollId);

      if (votesError) throw votesError;

      // Delete poll
      const { error: pollError } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId);

      if (pollError) throw pollError;

      // Update local state
      setPolls(prev => prev.filter(p => p.id !== pollId));
      toast({
        title: '已刪除',
        description: '投票已成功刪除',
      });
    } catch (error) {
      console.error('Error deleting poll:', error);
      toast({
        title: '錯誤',
        description: '刪除投票失敗',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getTotalVotes = (poll: MyPoll) => {
    return poll.poll_options.reduce((sum, opt) => sum + opt.vote_count, 0);
  };

  const isExpired = (deadline: string | null) => {
    return deadline ? isPast(new Date(deadline)) : false;
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Vote className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-bold mb-2">請先登入</h1>
          <p className="text-muted-foreground mb-4">您需要登入才能查看您的投票</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首頁登入
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">我的投票</h1>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </div>
          <Link to="/">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              建立新投票
            </Button>
          </Link>
        </div>

        {/* Content */}
        {loading || authLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : polls.length === 0 ? (
          <Card className="p-8 text-center">
            <Vote className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">尚無投票</h2>
            <p className="text-muted-foreground mb-4">您還沒有建立過投票</p>
            <Link to="/">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                建立第一個投票
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">共 {polls.length} 個投票</p>
            {polls.map((poll) => {
              const totalVotes = getTotalVotes(poll);
              const expired = isExpired(poll.deadline);

              return (
                <Card key={poll.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      <h3 className="font-semibold break-words">{poll.question}</h3>
                      <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                        <Badge variant="secondary">{totalVotes} 票</Badge>
                        <Badge variant="outline">{poll.poll_options.length} 個選項</Badge>
                        {expired ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            已截止
                          </Badge>
                        ) : poll.deadline ? (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            剩餘 {formatDistanceToNow(new Date(poll.deadline), { locale: zhTW })}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        建立於 {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true, locale: zhTW })}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-red-500 shrink-0"
                          disabled={deletingId === poll.id}
                        >
                          {deletingId === poll.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>確定要刪除嗎？</AlertDialogTitle>
                          <AlertDialogDescription>
                            此操作無法復原。投票「{poll.question}」及其所有 {totalVotes} 票將被永久刪除。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(poll.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            刪除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPolls;
