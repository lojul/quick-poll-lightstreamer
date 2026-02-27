import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCredits } from '@/hooks/useCredits';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const payment = searchParams.get('payment');
  const isSuccess = payment === 'success';
  const isCancelled = payment === 'cancelled';
  const { credits, refetch } = useCredits();
  const [hasRefetched, setHasRefetched] = useState(false);

  // Refetch credits on success
  useEffect(() => {
    if (isSuccess && !hasRefetched) {
      refetch();
      setHasRefetched(true);
    }
  }, [isSuccess, hasRefetched, refetch]);

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-muted-foreground">無效的頁面</p>
          <Link to="/">
            <Button className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首頁
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md w-full">
        {isSuccess ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">付款成功！</h1>
            <p className="text-muted-foreground mb-6">
              閃幣已加入您的帳戶。感謝您的購買！
            </p>
            {credits !== null && (
              <div className="flex items-center justify-center gap-2 mb-6 p-4 bg-yellow-500/10 rounded-lg">
                <Coins className="w-5 h-5 text-yellow-600" />
                <span className="text-lg font-semibold">目前餘額: {credits} 閃幣</span>
              </div>
            )}
          </>
        ) : isCancelled ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <XCircle className="w-12 h-12 text-yellow-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-yellow-600 mb-2">付款已取消</h1>
            <p className="text-muted-foreground mb-6">
              您已取消付款流程。如需購買閃幣，請重新嘗試。
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">付款失敗</h1>
            <p className="text-muted-foreground mb-6">
              付款過程中發生錯誤，請稍後重試。
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          <Link to="/">
            <Button className="w-full" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首頁
            </Button>
          </Link>
          <Link to="/payment-history">
            <Button variant="outline" className="w-full">
              查看付款記錄
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default PaymentResult;
