import { Wifi, WifiOff, RefreshCw, Zap, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { LightstreamerConnectionStatus } from '@/hooks/useLightstreamerVotes';

type SupabaseStatus = 'connected' | 'disconnected' | 'connecting';

interface RealtimeIndicatorProps {
  status: SupabaseStatus;
  lightstreamerStatus?: LightstreamerConnectionStatus;
  lastUpdate?: Date;
}

export function RealtimeIndicator({ status, lightstreamerStatus, lastUpdate }: RealtimeIndicatorProps) {
  // Combined status when both connections exist
  const getCombinedStatus = () => {
    const bothConnected = status === 'connected' && lightstreamerStatus === 'connected';
    const anyConnecting = status === 'connecting' || lightstreamerStatus === 'connecting';
    const bothDisconnected = status === 'disconnected' && lightstreamerStatus === 'disconnected';

    if (bothConnected) {
      return {
        icon: <Activity className="w-4 h-4" />,
        text: '高速即時更新',
        className: 'bg-gradient-to-r from-green-500/20 to-purple-500/20 text-green-700 border-green-500/50',
        pulse: false,
        showZap: true
      };
    }
    if (anyConnecting) {
      return {
        icon: <RefreshCw className="w-4 h-4 animate-spin" />,
        text: '連接中...',
        className: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50',
        pulse: true,
        showZap: false
      };
    }
    if (bothDisconnected) {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        text: '已斷線',
        className: 'bg-red-500/20 text-red-700 border-red-500/50',
        pulse: false,
        showZap: false
      };
    }
    // Partial connection
    return {
      icon: <Wifi className="w-4 h-4" />,
      text: '即時更新',
      className: 'bg-green-500/20 text-green-700 border-green-500/50',
      pulse: false,
      showZap: false
    };
  };

  const getSimpleStatus = () => {
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

  // If Lightstreamer is enabled, show combined status
  if (lightstreamerStatus && lightstreamerStatus !== 'disabled') {
    const config = getCombinedStatus();

    return (
      <div className="flex flex-col items-center gap-2">
        <Badge
          variant="outline"
          className={`${config.className} ${config.pulse ? 'animate-pulse' : ''} px-3 py-1`}
        >
          {config.icon}
          {config.showZap && <Zap className="w-3 h-3 ml-1 text-purple-600" />}
          <span className="ml-1.5">{config.text}</span>
        </Badge>

        {lastUpdate && (
          <span className="text-xs text-muted-foreground">
            最後更新: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  // Single status display (Supabase only)
  const simpleConfig = getSimpleStatus();
  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={`${simpleConfig.className} ${simpleConfig.pulse ? 'animate-pulse' : ''}`}
      >
        {simpleConfig.icon}
        <span className="ml-1">{simpleConfig.text}</span>
      </Badge>
      {lastUpdate && (
        <span className="text-xs text-muted-foreground">
          最後更新: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
