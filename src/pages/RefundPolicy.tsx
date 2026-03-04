import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首頁
          </Button>
        </Link>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-2">退款政策</h1>
          <p className="text-muted-foreground mb-8">Refund Policy</p>
          <p className="text-sm text-muted-foreground mb-8">最後更新日期：2026年3月3日</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. 概述</h2>
            <p className="text-muted-foreground mb-4">
              貓爪達人投票社（CatPawVote）提供虛擬貨幣「貓爪幣」，用於平台上的投票功能。由於貓爪幣屬於數位商品，一經購買並發放至您的帳戶，原則上不予退款。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. 不予退款的情況</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>貓爪幣已成功發放至您的帳戶</li>
              <li>貓爪幣已被使用（建立投票或參與投票）</li>
              <li>購買後超過 14 天</li>
              <li>帳戶因違反服務條款而被終止</li>
              <li>用戶主動刪除帳戶</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. 可申請退款的情況</h2>
            <p className="text-muted-foreground mb-4">在以下特殊情況下，您可以申請全額或部分退款：</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>技術故障</strong>：付款成功但貓爪幣未正確發放至您的帳戶</li>
              <li><strong>重複扣款</strong>：同一筆購買被多次扣款</li>
              <li><strong>未經授權交易</strong>：您的付款方式被盜用進行未經授權的購買</li>
              <li><strong>服務終止</strong>：我們終止服務且您有未使用的貓爪幣餘額</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. 退款申請流程</h2>
            <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
              <li>發送電郵至 <strong>support@catpawvote.app</strong></li>
              <li>主旨請註明「退款申請」</li>
              <li>提供以下資料：
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>您的註冊電郵地址</li>
                  <li>購買日期和金額</li>
                  <li>付款收據或交易編號</li>
                  <li>退款原因的詳細說明</li>
                </ul>
              </li>
              <li>我們將在 5 個工作天內審核您的申請</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. 退款處理</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>退款申請獲批後，款項將退回原付款方式</li>
              <li>退款處理時間通常為 5-10 個工作天，視乎您的銀行或付款供應商</li>
              <li>退款後，相應的貓爪幣將從您的帳戶扣除</li>
              <li>如果貓爪幣已被使用，只退還未使用部分的對應金額</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. 免費贈送的貓爪幣</h2>
            <p className="text-muted-foreground">
              新用戶註冊時獲得的 100 貓爪幣歡迎禮物，以及任何促銷活動贈送的貓爪幣，均不具現金價值，不可退款或兌換現金。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. 爭議解決</h2>
            <p className="text-muted-foreground mb-4">
              如對退款決定有異議，請透過電郵與我們聯絡。我們會盡力以公平、合理的方式解決爭議。
            </p>
            <p className="text-muted-foreground">
              如您對我們的處理結果不滿意，您可以聯絡您的信用卡公司或付款供應商進行投訴。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. 政策變更</h2>
            <p className="text-muted-foreground">
              我們保留隨時修改本退款政策的權利。任何變更將在本頁面公布。建議您定期查閱本政策。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. 聯絡我們</h2>
            <p className="text-muted-foreground">
              如有任何關於退款的問題，請聯絡我們：
            </p>
            <p className="text-muted-foreground mt-2">
              電郵：support@catpawvote.app
            </p>
          </section>

          <div className="border-t pt-8 mt-8">
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-primary transition-colors">
                服務條款
              </Link>
              <span>|</span>
              <Link to="/privacy" className="hover:text-primary transition-colors">
                私隱政策
              </Link>
              <span>|</span>
              <span>© 2026 CatPawVote</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
