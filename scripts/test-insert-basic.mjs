// Script to test basic insert into polls_lang table
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

  // Get a poll to test with
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

  // Try different column combinations based on common patterns
  const testCases = [
    // Case 1: Standard naming
    { poll_id: testPoll.id, language_cd: 'ENG', question: englishQuestion },
    // Case 2: Different ID column name
    { id: testPoll.id, language_cd: 'ENG', question: englishQuestion },
    // Case 3: Different language column name
    { poll_id: testPoll.id, language: 'ENG', question: englishQuestion },
    { id: testPoll.id, language: 'ENG', question: englishQuestion },
    // Case 4: Different question column name
    { poll_id: testPoll.id, language_cd: 'ENG', text: englishQuestion },
    { id: testPoll.id, language_cd: 'ENG', text: englishQuestion },
    // Case 5: All different
    { id: testPoll.id, language: 'ENG', text: englishQuestion },
    // Case 6: Minimal columns
    { poll_id: testPoll.id, question: englishQuestion },
    { id: testPoll.id, question: englishQuestion },
    // Case 7: With lang prefix
    { poll_id: testPoll.id, lang: 'ENG', question: englishQuestion },
    { id: testPoll.id, lang: 'ENG', question: englishQuestion }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\nTest case ${i + 1}: ${JSON.stringify(testCase)}`);
    
    try {
      const { data, error } = await supabase
        .from('polls_lang')
        .insert(testCase)
        .select();

      if (error) {
        console.log(`✖ Failed: ${error.message}`);
      } else {
        console.log(`✓ Success! Working column combination found.`);
        console.log('Inserted data:', data);
        
        // Now insert all translations using this working combination
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
            .select('*')
            .eq(Object.keys(testCase)[0], poll.id)
            .eq(Object.keys(testCase)[1], 'ENG')
            .maybeSingle();

          if (existing) {
            console.log(`Skipping existing translation for: ${poll.question}`);
            skippedCount++;
            continue;
          }

          const insertData = { ...testCase };
          insertData[Object.keys(testCase)[0]] = poll.id; // Use the same ID column
          insertData[Object.keys(testCase)[2]] = translation; // Use the same question column

          const { error: insertError } = await supabase
            .from('polls_lang')
            .insert(insertData);

          if (insertError) {
            console.log(`✖ Failed to insert "${poll.question}": ${insertError.message}`);
            continue;
          }

          console.log(`✓ Inserted: ${poll.question}`);
          insertedCount++;
        }

        console.log(`\nFinal Summary:`);
        console.log(`- Inserted: ${insertedCount} English translations`);
        console.log(`- Skipped: ${skippedCount} (no translation or already exists)`);
        return;
      }
    } catch (err) {
      console.log(`✖ Exception: ${err.message}`);
    }
  }

  console.log('\nNo working column combination found. Please check the polls_lang table structure.');
}

main().catch(console.error);









