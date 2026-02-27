import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Coins, CheckCircle, XCircle, Clock, Loader2, CreditCard, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TopUpModal } from '@/components/TopUpModal';

interface Payment {
  id: string;
  created: number;
  amount: number | null;
  currency: string | null;
  status: string;
  description: string | null;
  payment_method_type: string | null;
  credits: number | null;
  package_type: string | null;
}

const PaymentHistory = () => {
  const { user, isAuthenticated } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('請先登入');
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-payment-history`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch payment history');
        }

        setPayments(data.payments || []);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [isAuthenticated]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number | null, currency: string | null) => {
    if (amount === null) return '-';
    const value = amount / 100;
    const currencyUpper = (currency || 'hkd').toUpperCase();
    return `${currencyUpper === 'HKD' ? 'HK$' : currencyUpper + ' '}${value.toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return (
          <Badge className="bg-green-500/20 text-green-700 hover:bg-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            成功
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-500/20 text-blue-700 hover:bg-blue-500/30">
            <Clock className="w-3 h-3 mr-1" />
            處理中
          </Badge>
        );
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            未完成
          </Badge>
        );
      case 'canceled':
        return (
          <Badge className="bg-gray-500/20 text-gray-700 hover:bg-gray-500/30">
            已取消
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-500/20 text-red-700 hover:bg-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            失敗
          </Badge>
        );
    }
  };

  const getPaymentMethodLabel = (method: string | null) => {
    switch (method) {
      case 'wechat_pay':
        return 'WeChat Pay';
      case 'alipay':
        return 'Alipay';
      case 'card':
        return '信用卡';
      default:
        return method || '-';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-bold mb-2">請先登入</h1>
          <p className="text-muted-foreground mb-4">您需要登入才能查看付款記錄</p>
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
      {/* Top Up Modal */}
      <TopUpModal open={showTopUpModal} onOpenChange={setShowTopUpModal} />

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
              <h1 className="text-2xl font-bold">付款記錄</h1>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </div>
          <Button onClick={() => setShowTopUpModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            購買閃幣
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-600">{error}</p>
          </Card>
        ) : payments.length === 0 ? (
          <Card className="p-8 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">尚無付款記錄</h2>
            <p className="text-muted-foreground mb-4">您還沒有購買過閃幣</p>
            <Button onClick={() => setShowTopUpModal(true)}>
              <Coins className="w-4 h-4 mr-2" />
              購買閃幣
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {payment.credits ? `${payment.credits} 閃幣` : payment.description || '閃幣購買'}
                      </span>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatDate(payment.created)}</span>
                      {payment.payment_method_type && (
                        <>
                          <span>•</span>
                          <span>{getPaymentMethodLabel(payment.payment_method_type)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {formatAmount(payment.amount, payment.currency)}
                    </p>
                    {payment.credits && payment.status === 'succeeded' && (
                      <p className="text-sm text-green-600 flex items-center justify-end gap-1">
                        <Coins className="w-3 h-3" />
                        +{payment.credits} 閃幣
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>付款資料由 Stripe 安全處理，我們不會儲存您的付款詳情。</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
