import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold mb-2">私隱政策</h1>
          <p className="text-muted-foreground mb-8">Privacy Policy</p>
          <p className="text-sm text-muted-foreground mb-8">最後更新日期：2026年3月2日</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. 簡介</h2>
            <p className="text-muted-foreground mb-4">
              貓爪達人投票社（CatPawVote）致力於保護您的私隱。本私隱政策說明我們如何收集、使用、披露和保護您的個人資料。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. 我們收集的資料</h2>
            <h3 className="text-lg font-medium mb-2">2.1 帳戶資料</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>電子郵件地址（用於帳戶註冊和登入）</li>
              <li>帳戶建立日期</li>
              <li>貓爪幣餘額</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">2.2 使用資料</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>您建立的投票內容</li>
              <li>您的投票記錄</li>
              <li>瀏覽器類型和版本</li>
              <li>裝置資訊</li>
              <li>IP 地址（用於安全和防止濫用）</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">2.3 付款資料</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>交易記錄（金額、日期、購買方案）</li>
              <li>Stripe 客戶 ID</li>
              <li>注意：我們不會儲存您的信用卡號碼或付款詳細資料，這些由 Stripe 安全處理</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. 資料使用目的</h2>
            <p className="text-muted-foreground mb-4">我們使用收集的資料用於：</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>提供和維護我們的服務</li>
              <li>處理您的付款和交易</li>
              <li>發送服務相關通知（如帳戶驗證郵件）</li>
              <li>防止欺詐和濫用行為</li>
              <li>改善我們的服務和用戶體驗</li>
              <li>遵守法律義務</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. 資料分享</h2>
            <p className="text-muted-foreground mb-4">我們不會出售您的個人資料。我們僅在以下情況分享資料：</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Stripe</strong>：處理付款交易</li>
              <li><strong>Supabase</strong>：資料庫和身份驗證服務</li>
              <li><strong>法律要求</strong>：當法律要求或保護我們的權利時</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. 資料安全</h2>
            <p className="text-muted-foreground mb-4">我們採取以下措施保護您的資料：</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>使用 HTTPS 加密所有資料傳輸</li>
              <li>密碼經過安全雜湊處理</li>
              <li>定期安全審查和更新</li>
              <li>限制員工存取個人資料</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. 資料保留</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>帳戶資料：在帳戶有效期間保留</li>
              <li>投票資料：根據投票設定的截止日期保留</li>
              <li>付款記錄：依法律要求保留（通常為7年）</li>
              <li>刪除帳戶後，大部分資料將在30天內刪除</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. 您的權利</h2>
            <p className="text-muted-foreground mb-4">您有權：</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>存取</strong>：要求查看我們持有的您的資料</li>
              <li><strong>更正</strong>：要求更正不準確的資料</li>
              <li><strong>刪除</strong>：要求刪除您的帳戶和相關資料</li>
              <li><strong>可攜性</strong>：要求以通用格式取得您的資料</li>
              <li><strong>反對</strong>：反對某些資料處理活動</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              如需行使這些權利，請透過 support@catpawvote.app 聯絡我們。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Cookie 使用</h2>
            <p className="text-muted-foreground mb-4">我們使用必要的 Cookie 來：</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>維持您的登入狀態</li>
              <li>記住您的偏好設定</li>
              <li>確保服務安全運作</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              我們不使用追蹤 Cookie 或第三方廣告 Cookie。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. 兒童私隱</h2>
            <p className="text-muted-foreground">
              我們的服務不適用於 13 歲以下的兒童。我們不會故意收集兒童的個人資料。如果您發現兒童向我們提供了個人資料，請聯絡我們，我們將刪除該資料。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. 政策變更</h2>
            <p className="text-muted-foreground">
              我們可能會不時更新本私隱政策。任何變更將在本頁面公布，重大變更將通過電子郵件通知。建議您定期查閱本政策。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. 聯絡我們</h2>
            <p className="text-muted-foreground">
              如對本私隱政策有任何疑問，請聯絡我們：
            </p>
            <p className="text-muted-foreground mt-2">
              電郵：support@catpawvote.app
            </p>
          </section>

          <div className="border-t pt-8 mt-8">
            <p className="text-sm text-muted-foreground text-center mb-4">
              使用本服務即表示您同意本私隱政策。
            </p>
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-primary transition-colors">
                服務條款
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

export default PrivacyPolicy;
