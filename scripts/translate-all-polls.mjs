// Script to delete all from polls_lang and insert English translations for ALL polls
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = path.join(projectRoot, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      val = val.replace(/\n$/,'');
      if (!(key in env)) env[key] = val;
    }
  }
  return env;
}

// Translation mapping for Chinese questions to English
const TRANSLATIONS = {
  // Original 10 Chinese questions
  '您對使用 AI 影片生成器創作內容有何看法？': 'What is your opinion on the use of AI video generators for content creation?',
  '您如何看待 AI 工具在課堂上協助老師？': 'How do you feel about AI tools being used to assist teachers in classrooms?',
  '您是否認為政府應該加大對農村托兒和早期教育計畫的投資？': 'Should the government invest more in rural child care and early learning programs?',
  '您是否擔心美國政府可能關門對經濟造成影響？': 'Are you concerned about a potential U.S. government shutdown affecting the economy?',
  '您對無毒健康氣炸鍋作為廚房電器的流行度有何看法？': 'What is your view on the rising popularity of non-toxic air fryers as kitchen appliances?',
  '產品的可持續性與透明度（如數位產品護照）在您的購買決策中有多重要？': 'How important is sustainability and product transparency (digital product passports) in your purchasing decisions?',
  '您對哪種沉浸式體驗技術最感興趣？': 'Which immersive experience technology excites you the most?',
  '您對日常科技中 AI 代理人的興起有何感受？': 'How do you feel about the rising integration of AI agents in everyday technology?',
  '您對經濟報告中勞動市場挑戰的解決前景持何態度？': 'Are you optimistic about the resolution of labor market challenges highlighted by economic reports?',
  '您對葛蘭素史克（GSK）等企業領導層變動持何看法？': 'What is your stance on the current changes in leadership at major corporations like GSK?',
  
  // Additional translations for other Chinese questions found in the database
  '今天天氣如何？': 'How is the weather today?',
  '更多公司在技術生產過程中應否使用可再生能源？': 'Should more companies use renewable energy in their tech production processes?',
  '你會選擇購買哪款 iPhone？': 'Which iPhone would you buy?',
  '你會否每日使用生成式 AI 應用程式（如 ChatGPT 或圖片生成器）？': 'Do you use generative AI apps (like ChatGPT or image generators) daily?',
  '自動駕駛車技術到2030年前進度是否足夠普及？': 'Are autonomous vehicles progressing fast enough to become mainstream by 2030?',
  '穿戴式健康科技（如葡萄糖監測儀、心電手錶）有否令大眾醫療更好？': 'Is wearable health tech (such as glucose monitors, EKG watches) making healthcare better for everyone?',
  '你是否因私隱問題而不敢嘗試智能家居產品？': 'Are privacy concerns stopping you from trying smart home gadgets?',
  '科技公司應否依法支持舊設備更長時間？': 'Should technology companies be legally required to support older devices for longer periods?',
  '你認為智能手錶是否正取代大多數人的傳統手錶？': 'Do you think smartwatches are replacing traditional watches for most people?',
  '假如價格合理，你會否選購量子電腦作個人用途？': 'Would you purchase a quantum computer for personal use if the price was reasonable?',
  '政府應否增加精神健康方面的資助？': 'Should governments increase funding for mental health support?',
  '社交平台在選舉期間應否禁止政黨廣告？': 'Should social media platforms ban political ads during election periods?',
  '你認為近期媒體審查事件，言論自由有受威脅嗎？': 'Do you believe free speech is at risk due to recent media censorship incidents?',
  '在今日市場波動下，加密貨幣是否屬安全投資？': 'Are cryptocurrencies a safe investment in today\'s market volatility?',
  '國際組織是否妥善管理目前的難民危機？': 'Is the current refugee crisis being properly managed by international organizations?',
  '在全球衝突中，各國應否更多使用經濟制裁？': 'Should economic sanctions be used more by countries in global conflicts?',
  '全球通脹是否影響你的日常花費？': 'Is global inflation affecting your daily spending habits?',
  '你是否支持最近的軍事無人機攻擊行動？': 'Do you support recent drone strikes in military operations?',
  '媒體在打擊錯誤資訊方面做得足夠嗎？': 'Are the media doing enough to combat misinformation?',
  '以人工智能協作虛擬同事會否成為辦公室未來主流？': 'Are AI-powered virtual coworkers the future of office productivity?',
  '大型科技公司（如 Google、Apple、Meta）對社會影響力是否過大？': 'Are large tech companies (like Google, Apple, Meta) too powerful in influencing society?',
  '你認為世界領袖在應對氣候變化方面夠快嗎？': 'Do you think world leaders are addressing climate change quickly enough?'
};

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  console.log('🗑️  Deleting all existing records from polls_lang...');
  
  // Delete all existing records
  const { error: deleteError } = await supabase
    .from('polls_lang')
    .delete()
    .neq('id', 0); // Delete all records

  if (deleteError) {
    console.error('Failed to delete existing records:', deleteError.message);
    return;
  }

  console.log('✅ All existing records deleted');

  console.log('\n📥 Fetching all polls from the database...');
  
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select('id, question')
    .order('created_at', { ascending: false });

  if (pollsError) {
    console.error('Failed to fetch polls:', pollsError.message);
    return;
  }

  console.log(`Found ${polls.length} polls`);

  let insertedCount = 0;
  let skippedCount = 0;

  console.log('\n🔄 Processing polls...');

  for (const poll of polls) {
    const translation = TRANSLATIONS[poll.question];
    
    if (!translation) {
      console.log(`⚠️  No translation found for: ${poll.question}`);
      skippedCount++;
      continue;
    }

    console.log(`📝 Processing: ${poll.question}`);
    console.log(`   Translation: ${translation}`);

    // Insert English translation
    const { error: insertError } = await supabase
      .from('polls_lang')
      .insert({
        poll_id: poll.id,
        language_cd: 'ENG',
        question: translation
      });

    if (insertError) {
      console.log(`   ✖ Failed: ${insertError.message}`);
      skippedCount++;
      continue;
    }

    console.log(`   ✅ Inserted successfully`);
    insertedCount++;
  }

  console.log(`\n📊 Final Summary:`);
  console.log(`- Inserted: ${insertedCount} English translations`);
  console.log(`- Skipped: ${skippedCount} (no translation available)`);
  console.log(`- Total polls processed: ${polls.length}`);
  console.log('\n🎉 All done!');
}

main().catch(console.error);









