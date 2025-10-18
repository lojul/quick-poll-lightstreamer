// Script to try inserting into polls_lang with different column name combinations
// Usage: node scripts/try-insert-polls-lang.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
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
  }
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment/.env.local');
  }
  return env;
}

// Translation mapping for the Chinese questions to English
const TRANSLATIONS = {
  '您對使用 AI 影片生成器創作內容有何看法？': 'What is your opinion on the use of AI video generators for content creation?',
  '您如何看待 AI 工具在課堂上協助老師？': 'How do you feel about AI tools being used to assist teachers in classrooms?',
  '您是否認為政府應該加大對農村托兒和早期教育計畫的投資？': 'Should the government invest more in rural child care and early learning programs?',
  '您是否擔心美國政府可能關門對經濟造成影響？': 'Are you concerned about a potential U.S. government shutdown affecting the economy?',
  '您對無毒健康氣炸鍋作為廚房電器的流行度有何看法？': 'What is your view on the rising popularity of non-toxic air fryers as kitchen appliances?',
  '產品的可持續性與透明度（如數位產品護照）在您的購買決策中有多重要？': 'How important is sustainability and product transparency (digital product passports) in your purchasing decisions?',
  '您對哪種沉浸式體驗技術最感興趣？': 'Which immersive experience technology excites you the most?',
  '您對日常科技中 AI 代理人的興起有何感受？': 'How do you feel about the rising integration of AI agents in everyday technology?',
  '您對經濟報告中勞動市場挑戰的解決前景持何態度？': 'Are you optimistic about the resolution of labor market challenges highlighted by economic reports?',
  '您對葛蘭素史克（GSK）等企業領導層變動持何看法？': 'What is your stance on the current changes in leadership at major corporations like GSK?'
};

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  // Get the first poll to test with
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select('id, question')
    .limit(1);

  if (pollsError || !polls || polls.length === 0) {
    console.error('Failed to fetch polls:', pollsError?.message);
    return;
  }

  const testPoll = polls[0];
  const englishQuestion = TRANSLATIONS[testPoll.question];

  if (!englishQuestion) {
    console.log('No translation found for test poll');
    return;
  }

  console.log(`Testing with poll: ${testPoll.question}`);
  console.log(`English translation: ${englishQuestion}`);

  // Try different column name combinations
  const columnCombinations = [
    { id: 'poll_id', lang: 'language_cd', question: 'question' },
    { id: 'id', lang: 'language_cd', question: 'question' },
    { id: 'poll_id', lang: 'language', question: 'question' },
    { id: 'id', lang: 'language', question: 'question' },
    { id: 'poll_id', lang: 'lang', question: 'question' },
    { id: 'id', lang: 'lang', question: 'question' },
    { id: 'poll_id', lang: 'language_cd', question: 'text' },
    { id: 'id', lang: 'language_cd', question: 'text' },
    { id: 'poll_id', lang: 'language', question: 'text' },
    { id: 'id', lang: 'language', question: 'text' }
  ];

  for (const combo of columnCombinations) {
    console.log(`\nTrying combination: ${combo.id}, ${combo.lang}, ${combo.question}`);
    
    try {
      const { error } = await supabase
        .from('polls_lang')
        .insert({
          [combo.id]: testPoll.id,
          [combo.lang]: 'ENG',
          [combo.question]: englishQuestion
        });

      if (error) {
        console.log(`  ✖ Failed: ${error.message}`);
      } else {
        console.log(`  ✓ Success! Correct column names are: ${combo.id}, ${combo.lang}, ${combo.question}`);
        
        // Now insert all translations
        console.log('\nInserting all English translations...');
        
        const { data: allPolls, error: allPollsError } = await supabase
          .from('polls')
          .select('id, question');

        if (allPollsError) {
          console.error('Failed to fetch all polls:', allPollsError.message);
          return;
        }

        let insertedCount = 0;
        let skippedCount = 0;

        for (const poll of allPolls) {
          const translation = TRANSLATIONS[poll.question];
          
          if (!translation) {
            console.log(`Skipping poll (no translation): ${poll.question}`);
            skippedCount++;
            continue;
          }

          // Check if already exists
          const { data: existing } = await supabase
            .from('polls_lang')
            .select('id')
            .eq(combo.id, poll.id)
            .eq(combo.lang, 'ENG')
            .maybeSingle();

          if (existing) {
            console.log(`Skipping existing translation for: ${poll.question}`);
            skippedCount++;
            continue;
          }

          const { error: insertError } = await supabase
            .from('polls_lang')
            .insert({
              [combo.id]: poll.id,
              [combo.lang]: 'ENG',
              [combo.question]: translation
            });

          if (insertError) {
            console.error(`Failed to insert translation for "${poll.question}":`, insertError.message);
            continue;
          }

          console.log(`✓ Inserted translation for: ${poll.question}`);
          insertedCount++;
        }

        console.log(`\nFinal Summary:`);
        console.log(`- Inserted: ${insertedCount} English translations`);
        console.log(`- Skipped: ${skippedCount} (no translation or already exists)`);
        return;
      }
    } catch (err) {
      console.log(`  ✖ Error: ${err.message}`);
    }
  }

  console.log('\nNone of the column combinations worked. Please check the polls_lang table structure.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});










