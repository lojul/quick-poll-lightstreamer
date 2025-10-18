// Simple script to insert English translations into polls_lang
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

  console.log('Fetching polls...');
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select('id, question');

  if (pollsError) {
    console.error('Error fetching polls:', pollsError.message);
    return;
  }

  console.log(`Found ${polls.length} polls`);
  
  // Show first few polls
  console.log('\nFirst 3 polls:');
  polls.slice(0, 3).forEach(p => console.log(`ID: ${p.id}, Question: ${p.question}`));

  // Find polls that have translations
  const translatablePolls = polls.filter(p => TRANSLATIONS[p.question]);
  console.log(`\nFound ${translatablePolls.length} polls with translations`);

  if (translatablePolls.length === 0) {
    console.log('No polls found with translations. Available questions:');
    polls.slice(0, 5).forEach(p => console.log(`- ${p.question}`));
    return;
  }

  // Try to insert with common column names
  const testPoll = translatablePolls[0];
  console.log(`\nTesting with poll: ${testPoll.question}`);
  console.log(`Translation: ${TRANSLATIONS[testPoll.question]}`);

  // Try different column combinations
  const combinations = [
    { poll_id: testPoll.id, language_cd: 'ENG', question: TRANSLATIONS[testPoll.question] },
    { id: testPoll.id, language_cd: 'ENG', question: TRANSLATIONS[testPoll.question] },
    { poll_id: testPoll.id, language: 'ENG', question: TRANSLATIONS[testPoll.question] },
    { id: testPoll.id, language: 'ENG', question: TRANSLATIONS[testPoll.question] }
  ];

  for (const combo of combinations) {
    console.log(`\nTrying: ${JSON.stringify(combo)}`);
    
    const { error } = await supabase
      .from('polls_lang')
      .insert(combo);

    if (error) {
      console.log(`✖ Failed: ${error.message}`);
    } else {
      console.log(`✓ Success! Working column combination found.`);
      
      // Insert all translations
      console.log('\nInserting all translations...');
      let inserted = 0;
      
      for (const poll of translatablePolls) {
        const insertData = { ...combo };
        insertData[Object.keys(combo)[0]] = poll.id; // Use the same ID column
        insertData.question = TRANSLATIONS[poll.question];
        
        const { error: insertError } = await supabase
          .from('polls_lang')
          .insert(insertData);

        if (insertError) {
          console.log(`✖ Failed to insert "${poll.question}": ${insertError.message}`);
        } else {
          console.log(`✓ Inserted: ${poll.question}`);
          inserted++;
        }
      }
      
      console.log(`\nSummary: Inserted ${inserted} English translations`);
      return;
    }
  }

  console.log('\nNo working column combination found. Please check the polls_lang table structure.');
}

main().catch(console.error);









