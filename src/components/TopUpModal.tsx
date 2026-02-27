import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PACKAGES = [
  {
    id: 'small',
    credits: 100,
    price: '$1.00',
    priceCents: 100,
    label: '入門方案',
    popular: false,
  },
  {
    id: 'medium',
    credits: 500,
    price: '$5.00',
    priceCents: 500,
    label: '標準方案',
    popular: true,
  },
  {
    id: 'large',
    credits: 1200,
    price: '$10.00',
    priceCents: 1000,
    label: '超值方案',
    bonus: '+20%',
    popular: false,
  },
] as const;

export function TopUpModal({ open, onOpenChange }: TopUpModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePurchase = async (packageId: string) => {
    try {
      setLoading(packageId);

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: '請先登入',
          description: '您需要登入才能購買積分。',
          variant: 'destructive',
        });
        return;
      }

      // Call the Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ packageType: packageId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: '購買失敗',
        description: error instanceof Error ? error.message : '請稍後重試。',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-600" />
            購買積分
          </DialogTitle>
          <DialogDescription>
            選擇適合您的積分方案。積分可用於建立投票 (10積分) 和投票 (1積分)。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`p-4 cursor-pointer hover:border-primary/50 transition-all ${
                pkg.popular ? 'border-primary/30 bg-primary/5' : ''
              }`}
              onClick={() => !loading && handlePurchase(pkg.id)}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{pkg.label}</span>
                    {pkg.popular && (
                      <Badge variant="default" className="text-xs">
                        熱門
                      </Badge>
                    )}
                    {pkg.bonus && (
                      <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {pkg.bonus}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{pkg.credits} 積分</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={loading !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchase(pkg.id);
                  }}
                >
                  {loading === pkg.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    pkg.price
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          付款由 Stripe 安全處理
        </p>
      </DialogContent>
    </Dialog>
  );
}
