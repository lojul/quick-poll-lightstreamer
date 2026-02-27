import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Terms = () => {
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
          <h1 className="text-3xl font-bold mb-2">服務條款</h1>
          <p className="text-muted-foreground mb-8">Terms of Service</p>
          <p className="text-sm text-muted-foreground mb-8">最後更新日期：2026年2月27日</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. 服務說明</h2>
            <p className="text-muted-foreground mb-4">
              快速投票（Quick Polls）是一個線上即時投票平台，讓用戶能夠建立投票、參與投票，並即時查看投票結果。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. 帳戶與閃幣</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>新用戶註冊後將獲得 100 閃幣作為歡迎禮物</li>
              <li>建立投票需要 10 閃幣</li>
              <li>參與投票需要 1 閃幣（僅限已登入用戶）</li>
              <li>訪客可以免費參與投票，無需閃幣</li>
              <li>閃幣可透過購買方案獲得，購買後不可退款</li>
              <li>閃幣無使用期限，但帳戶被終止時閃幣將失效</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. 付款條款</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>所有付款均透過 Stripe 安全處理</li>
              <li>價格以美元計價</li>
              <li>購買完成後，閃幣將立即加入您的帳戶</li>
              <li>數位商品一經購買，恕不退款</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. 使用規範</h2>
            <p className="text-muted-foreground mb-4">使用本服務時，您同意：</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>不得發布違法、有害、威脅、辱罵、騷擾或誹謗的內容</li>
              <li>不得發布色情、暴力或仇恨言論</li>
              <li>不得嘗試破壞或干擾服務運作</li>
              <li>不得使用自動化工具進行大量投票或灌票</li>
              <li>不得冒充他人或提供虛假資訊</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. 內容所有權</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>您保留您所建立投票內容的所有權</li>
              <li>您授予我們展示和分發您投票內容的權利</li>
              <li>我們保留刪除違反規範內容的權利</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. 隱私保護</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>我們收集的資料包括：電子郵件、投票記錄、付款資訊</li>
              <li>我們不會將您的個人資料出售給第三方</li>
              <li>付款資料由 Stripe 安全處理，我們不會儲存您的信用卡資訊</li>
              <li>您可以隨時要求刪除您的帳戶和相關資料</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. 服務變更與終止</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>我們保留隨時修改或終止服務的權利</li>
              <li>服務條款變更時，我們會透過網站公告通知</li>
              <li>違反條款的帳戶可能被暫停或終止</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. 免責聲明</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>服務以「現狀」提供，不保證無中斷或無錯誤</li>
              <li>我們不對用戶發布的內容負責</li>
              <li>我們不對因使用服務而造成的任何損失負責</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. 聯絡我們</h2>
            <p className="text-muted-foreground">
              如有任何問題或疑慮，請透過電子郵件聯絡我們：support@quickpolls.app
            </p>
          </section>

          <div className="border-t pt-8 mt-8">
            <p className="text-sm text-muted-foreground text-center">
              使用本服務即表示您同意以上條款。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
