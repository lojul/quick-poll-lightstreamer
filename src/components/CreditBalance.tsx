import { Coins } from 'lucide-react';

interface CreditBalanceProps {
  credits: number | null;
  loading?: boolean;
  onClick?: () => void;
}

export function CreditBalance({ credits, loading, onClick }: CreditBalanceProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors cursor-pointer"
      title="點擊購買更多積分"
    >
      <Coins className="w-4 h-4 text-yellow-600" />
      <span className="text-sm font-medium text-yellow-700">
        {loading ? (
          <span className="animate-pulse">...</span>
        ) : credits !== null ? (
          `${credits} 積分`
        ) : (
          '- 積分'
        )}
      </span>
    </button>
  );
}
