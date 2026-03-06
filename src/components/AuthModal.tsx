import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, RefreshCw, KeyRound, Check, X } from 'lucide-react';

// Password requirements
const PASSWORD_RULES = [
  { key: 'length', label: '至少 8 個字元', test: (p: string) => p.length >= 8 },
  { key: 'uppercase', label: '至少 1 個大寫字母', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: '至少 1 個小寫字母', test: (p: string) => /[a-z]/.test(p) },
  { key: 'number', label: '至少 1 個數字', test: (p: string) => /[0-9]/.test(p) },
  { key: 'special', label: '至少 1 個特殊符號 (!@#$%^&*)', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  const results = PASSWORD_RULES.map(rule => ({
    ...rule,
    passed: rule.test(password),
  }));

  const passedCount = results.filter(r => r.passed).length;
  const allPassed = passedCount === results.length;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1 mb-2">
        {results.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < passedCount
                ? passedCount === results.length
                  ? 'bg-green-500'
                  : passedCount >= 3
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="text-xs space-y-0.5">
        {results.map(rule => (
          <div key={rule.key} className={`flex items-center gap-1 ${rule.passed ? 'text-green-600' : 'text-muted-foreground'}`}>
            {rule.passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {rule.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) {
      return { valid: false, message: `密碼需要${rule.label}` };
    }
  }
  return { valid: true, message: '' };
}

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignUp: (email: string, password: string) => Promise<{ data: { user: unknown; session: unknown } | null; error: Error | null }>;
  onSignIn: (email: string, password: string) => Promise<{ data: unknown; error: Error | null }>;
  onResendVerification?: (email: string) => Promise<{ error: Error | null }>;
  onResetPassword?: (email: string) => Promise<{ error: Error | null }>;
}

export function AuthModal({ open, onOpenChange, onSignUp, onSignIn, onResendVerification, onResetPassword }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail || !onResendVerification) {
      toast({ title: '錯誤', description: '請輸入電子郵件', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await onResendVerification(resendEmail);
    setLoading(false);

    if (error) {
      toast({ title: '發送失敗', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: '已發送驗證郵件',
        description: '請檢查您的信箱並點擊驗證連結。',
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !onResetPassword) {
      toast({ title: '錯誤', description: '請輸入電子郵件', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await onResetPassword(resetEmail);
    setLoading(false);

    if (error) {
      toast({ title: '發送失敗', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: '已發送重設密碼郵件',
        description: '請檢查您的信箱並點擊連結重設密碼。',
      });
      setResetEmail('');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: '錯誤', description: '請填寫所有欄位', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await onSignIn(email, password);
    setLoading(false);

    if (error) {
      toast({ title: '登入失敗', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '登入成功', description: '歡迎回來！' });
      resetForm();
      onOpenChange(false);
      // Scroll to top to show latest polls
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast({ title: '錯誤', description: '請填寫所有欄位', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: '錯誤', description: '密碼不一致', variant: 'destructive' });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      toast({ title: '密碼強度不足', description: passwordValidation.message, variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { data, error } = await onSignUp(email, password);
    setLoading(false);

    if (error) {
      toast({ title: '註冊失敗', description: error.message, variant: 'destructive' });
    } else if (data?.user && !data?.session) {
      // Email confirmation required
      toast({
        title: '請確認電子郵件',
        description: '我們已發送確認連結到您的信箱，請點擊連結完成註冊。',
      });
      resetForm();
      onOpenChange(false);
    } else {
      toast({ title: '註冊成功', description: '您現在可以建立投票了！' });
      resetForm();
      onOpenChange(false);
      // Scroll to top to show latest polls
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">帳戶</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="login">登入</TabsTrigger>
            <TabsTrigger value="signup">註冊</TabsTrigger>
            <TabsTrigger value="forgot">忘記密碼</TabsTrigger>
            <TabsTrigger value="resend">重發驗證</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">電子郵件</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">密碼</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                登入
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">電子郵件</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">密碼</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="輸入強密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                {password && <PasswordStrength password={password} />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm">確認密碼</Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  placeholder="再次輸入密碼"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                註冊
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="forgot" className="space-y-4 mt-4">
            <div className="text-center mb-4">
              <KeyRound className="w-12 h-12 mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground">
                忘記密碼？輸入您的電子郵件，我們會發送重設連結。
              </p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">電子郵件</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                發送重設密碼郵件
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="resend" className="space-y-4 mt-4">
            <div className="text-center mb-4">
              <Mail className="w-12 h-12 mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground">
                沒有收到驗證郵件？輸入您的電子郵件重新發送。
              </p>
            </div>
            <form onSubmit={handleResendVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resend-email">電子郵件</Label>
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="your@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                重新發送驗證郵件
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
