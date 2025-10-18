// Script to check polls_lang table structure and insert English translations
// Usage: node scripts/check-and-translate-polls.mjs

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

  console.log('Checking polls_lang table structure...');
  
  // First, let's try to get the table structure by querying it
  const { data: sampleData, error: sampleError } = await supabase
    .from('polls_lang')
    .select('*')
    .limit(1);

  if (sampleError) {
    console.error('Error accessing polls_lang table:', sampleError.message);
    console.log('Please ensure the polls_lang table exists.');
    return;
  }

  console.log('Table structure sample:', sampleData);
  console.log('Available columns:', sampleData.length > 0 ? Object.keys(sampleData[0]) : 'No data');

  // Get all polls
  console.log('\nFetching all polls from the database...');
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select('id, question')
    .order('created_at', { ascending: false });

  if (pollsError) {
    console.error('Failed to fetch polls:', pollsError.message);
    return;
  }

  console.log(`Found ${polls.length} polls`);

  // Try different possible column names
  const possibleIdColumns = ['poll_id', 'id', 'pollId', 'pollId'];
  const possibleLangColumns = ['language_cd', 'language', 'lang', 'languageCode'];
  const possibleQuestionColumns = ['question', 'text', 'content'];

  let idColumn = null;
  let langColumn = null;
  let questionColumn = null;

  if (sampleData.length > 0) {
    const columns = Object.keys(sampleData[0]);
    idColumn = possibleIdColumns.find(col => columns.includes(col));
    langColumn = possibleLangColumns.find(col => columns.includes(col));
    questionColumn = possibleQuestionColumns.find(col => columns.includes(col));
  }

  console.log(`Detected columns: id=${idColumn}, lang=${langColumn}, question=${questionColumn}`);

  if (!idColumn || !langColumn || !questionColumn) {
    console.error('Could not detect required columns. Please check the table structure.');
    console.log('Expected columns: poll_id (or similar), language_cd (or similar), question (or similar)');
    return;
  }

  let insertedCount = 0;
  let skippedCount = 0;

  for (const poll of polls) {
    console.log(`\nProcessing poll: ${poll.question}`);
    
    // Check if English translation already exists
    const { data: existing, error: checkError } = await supabase
      .from('polls_lang')
      .select('id')
      .eq(idColumn, poll.id)
      .eq(langColumn, 'ENG')
      .maybeSingle();

    if (checkError) {
      console.error(`  ✖ Error checking existing translation:`, checkError.message);
      continue;
    }

    if (existing) {
      console.log('  ↺ English translation already exists, skipping');
      skippedCount++;
      continue;
    }

    // Get English translation
    const englishQuestion = TRANSLATIONS[poll.question];
    
    if (!englishQuestion) {
      console.log('  ⚠ No translation found, skipping');
      skippedCount++;
      continue;
    }

    // Insert English translation
    const insertData = {
      [idColumn]: poll.id,
      [langColumn]: 'ENG',
      [questionColumn]: englishQuestion
    };

    const { error: insertError } = await supabase
      .from('polls_lang')
      .insert(insertData);

    if (insertError) {
      console.error(`  ✖ Failed to insert translation:`, insertError.message);
      continue;
    }

    console.log('  ✓ English translation inserted');
    insertedCount++;
  }

  console.log(`\nSummary:`);
  console.log(`- Inserted: ${insertedCount} English translations`);
  console.log(`- Skipped: ${skippedCount} (already exist or no translation)`);
  console.log('All done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});










