import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Share2, Copy, Check, QrCode, MessageCircle, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareMenuProps {
  pollId: string;
  pollTitle: string;
}

export function ShareMenu({ pollId, pollTitle }: ShareMenuProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/poll/${pollId}`;
  const shareText = `投票: ${pollTitle}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: '已複製連結',
        description: '可以貼上分享給朋友',
      });
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: '來投票吧！',
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  const handleWhatsApp = () => {
    window.open(whatsappUrl, '_blank');
  };

  const supportsNativeShare = typeof navigator.share === 'function';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground hover:text-primary"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-green-500" />
                <span className="text-green-500 text-xs">已複製</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 mr-1" />
                <span className="text-xs">分享</span>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            複製連結
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleWhatsApp}>
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp 分享
          </DropdownMenuItem>
          {supportsNativeShare && (
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share className="w-4 h-4 mr-2" />
              更多分享方式
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setQrOpen(true)}>
            <QrCode className="w-4 h-4 mr-2" />
            顯示 QR Code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">掃描 QR Code 投票</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-[200px] truncate">
              {pollTitle}
            </p>
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-2" />
              複製連結
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
