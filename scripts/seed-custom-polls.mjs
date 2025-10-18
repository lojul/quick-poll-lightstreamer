// One-off script to insert provided polls into Supabase
// Usage: node scripts/seed-custom-polls.mjs

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
        // Trim trailing \n that might have been embedded when pulled from Vercel
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

const POLLS = [
  {
    question: '您對使用 AI 影片生成器創作內容有何看法？',
    options: ['非常正面', '稍微正面', '中立', '稍微負面', '非常負面'],
  },
  {
    question: '您如何看待 AI 工具在課堂上協助老師？',
    options: ['非常支持', '稍微支持', '中立', '稍微反對', '強烈反對'],
  },
  {
    question: '您是否認為政府應該加大對農村托兒和早期教育計畫的投資？',
    options: ['非常同意', '同意', '中立', '不同意', '非常不同意'],
  },
  {
    question: '您是否擔心美國政府可能關門對經濟造成影響？',
    options: ['非常擔心', '稍微擔心', '中立', '不擔心', '完全不擔心'],
  },
  {
    question: '您對無毒健康氣炸鍋作為廚房電器的流行度有何看法？',
    options: ['非常喜歡', '喜歡', '中立', '不喜歡', '非常不喜歡'],
  },
  {
    question: '產品的可持續性與透明度（如數位產品護照）在您的購買決策中有多重要？',
    options: ['非常重要', '重要', '有點重要', '不重要', '完全不重要'],
  },
  {
    question: '您對哪種沉浸式體驗技術最感興趣？',
    options: ['虛擬實境（VR）', '擴增實境（AR）', '360度影片', '互動藝術裝置', '以上皆非'],
  },
  {
    question: '您對日常科技中 AI 代理人的興起有何感受？',
    options: ['非常興奮', '稍微興奮', '中立', '稍微擔憂', '非常擔憂'],
  },
  {
    question: '您對經濟報告中勞動市場挑戰的解決前景持何態度？',
    options: ['非常樂觀', '稍微樂觀', '中立', '稍微悲觀', '非常悲觀'],
  },
  {
    question: '您對葛蘭素史克（GSK）等企業領導層變動持何看法？',
    options: ['正面', '中立', '負面', '不知道', '無意見'],
  },
];

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  for (const poll of POLLS) {
    console.log(`Processing poll: ${poll.question}`);

    // 1) Find existing poll by exact question
    const { data: existingPoll, error: findError } = await supabase
      .from('polls')
      .select('*')
      .eq('question', poll.question)
      .maybeSingle();

    let pollRecord = existingPoll;

    if (findError) {
      console.error('  ✖ Failed to lookup poll:', findError.message);
      continue;
    }

    if (!pollRecord) {
      // 2) Create poll if not exists
      const { data: created, error: pollError } = await supabase
        .from('polls')
        .insert({ question: poll.question })
        .select()
        .single();

      if (pollError) {
        console.error('  ✖ Failed to create poll:', pollError.message);
        continue;
      }

      pollRecord = created;
      console.log('  ✓ Poll created');
    } else {
      console.log('  ↺ Poll already exists, will only add missing options');
    }

    // 3) Ensure options exist (insert only missing)
    const { data: existingOptions, error: readOptsError } = await supabase
      .from('poll_options')
      .select('text')
      .eq('poll_id', pollRecord.id);

    if (readOptsError) {
      console.error('  ✖ Failed to read options:', readOptsError.message);
      continue;
    }

    const existingTexts = new Set((existingOptions || []).map(o => o.text));
    const missing = poll.options.filter(text => !existingTexts.has(text));

    if (missing.length === 0) {
      console.log('  ✓ All options already exist');
      continue;
    }

    const optionsPayload = missing.map((text) => ({ poll_id: pollRecord.id, text }));
    const { error: optionsError } = await supabase.from('poll_options').insert(optionsPayload);
    if (optionsError) {
      console.error('  ✖ Failed to create missing options:', optionsError.message);
      continue;
    }
    console.log(`  ✓ Added ${missing.length} missing option(s)`);
  }

  console.log('All done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


