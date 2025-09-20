import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RealtimeIndicatorProps {
  status: 'connected' | 'disconnected' | 'connecting';
  lastUpdate?: Date;
}

export function RealtimeIndicator({ status, lastUpdate }: RealtimeIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="w-4 h-4" />,
          text: '即時更新',
          className: 'bg-green-500/20 text-green-700 border-green-500/50',
          pulse: false
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          text: '已斷線',
          className: 'bg-red-500/20 text-red-700 border-red-500/50',
          pulse: false
        };
      case 'connecting':
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          text: '連接中',
          className: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50',
          pulse: true
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={`${config.className} ${config.pulse ? 'animate-pulse' : ''}`}
      >
        {config.icon}
        <span className="ml-1">{config.text}</span>
      </Badge>
      {lastUpdate && (
        <span className="text-xs text-muted-foreground">
          最後更新: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}