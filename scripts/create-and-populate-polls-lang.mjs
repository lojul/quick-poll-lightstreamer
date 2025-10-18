// Script to create polls_lang table and populate with English translations
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

  console.log('Attempting to create polls_lang table...');
  
  // Try to create the table with a proper structure
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS polls_lang (
      id SERIAL PRIMARY KEY,
      poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
      language_cd VARCHAR(10) NOT NULL,
      question TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(poll_id, language_cd)
    );
  `;

  try {
    // Use the service role key for DDL operations
    const serviceKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
    const adminSupabase = createClient(env.VITE_SUPABASE_URL, serviceKey);
    
    const { error: createError } = await adminSupabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.log('Table creation error (might already exist):', createError.message);
    } else {
      console.log('✓ Table created successfully');
    }
  } catch (err) {
    console.log('Table creation exception:', err.message);
  }

  // Now try to insert the translations
  console.log('\nFetching polls and inserting translations...');
  
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select('id, question');

  if (pollsError) {
    console.error('Failed to fetch polls:', pollsError.message);
    return;
  }

  const translatablePolls = polls.filter(p => TRANSLATIONS[p.question]);
  console.log(`Found ${translatablePolls.length} polls with translations`);

  let insertedCount = 0;
  let skippedCount = 0;

  for (const poll of translatablePolls) {
    const translation = TRANSLATIONS[poll.question];
    
    console.log(`\nProcessing: ${poll.question}`);
    console.log(`Translation: ${translation}`);

    // Check if already exists
    const { data: existing } = await supabase
      .from('polls_lang')
      .select('id')
      .eq('poll_id', poll.id)
      .eq('language_cd', 'ENG')
      .maybeSingle();

    if (existing) {
      console.log('  ↺ Already exists, skipping');
      skippedCount++;
      continue;
    }

    // Insert translation
    const { error: insertError } = await supabase
      .from('polls_lang')
      .insert({
        poll_id: poll.id,
        language_cd: 'ENG',
        question: translation
      });

    if (insertError) {
      console.log(`  ✖ Failed: ${insertError.message}`);
      continue;
    }

    console.log('  ✓ Inserted successfully');
    insertedCount++;
  }

  console.log(`\nFinal Summary:`);
  console.log(`- Inserted: ${insertedCount} English translations`);
  console.log(`- Skipped: ${skippedCount} (already exists)`);
  console.log('All done.');
}

main().catch(console.error);









