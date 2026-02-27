import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Coins, AlertTriangle } from 'lucide-react';

interface InsufficientCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTopUp: () => void;
  creditsNeeded: number;
  currentCredits: number;
  action: 'poll' | 'vote';
}

export function InsufficientCreditsModal({
  open,
  onOpenChange,
  onTopUp,
  creditsNeeded,
  currentCredits,
  action,
}: InsufficientCreditsModalProps) {
  const actionText = action === 'poll' ? '建立投票' : '投票';
  const shortage = creditsNeeded - currentCredits;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="w-5 h-5" />
            閃幣不足
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              您沒有足夠的閃幣{actionText}。
            </p>
            <div className="flex items-center justify-center gap-4 py-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">目前閃幣</div>
                <div className="flex items-center justify-center gap-1 font-semibold">
                  <Coins className="w-4 h-4 text-yellow-600" />
                  {currentCredits}
                </div>
              </div>
              <div className="text-2xl text-muted-foreground">/</div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">需要閃幣</div>
                <div className="flex items-center justify-center gap-1 font-semibold text-red-600">
                  <Coins className="w-4 h-4" />
                  {creditsNeeded}
                </div>
              </div>
            </div>
            <p className="text-sm">
              您還需要 <span className="font-semibold text-red-600">{shortage}</span> 閃幣才能{actionText}。
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onTopUp}>
            <Coins className="w-4 h-4 mr-2" />
            購買閃幣
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
