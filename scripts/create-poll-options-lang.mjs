// Script to create poll_options_lang table and translate all poll options to English
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

// Translation mapping for Chinese poll options to English
const OPTION_TRANSLATIONS = {
  // AI Video Generators options
  '非常正面': 'Very Positive',
  '稍微正面': 'Somewhat Positive',
  '中立': 'Neutral',
  '稍微負面': 'Somewhat Negative',
  '非常負面': 'Very Negative',
  
  // AI Tools in Classrooms options
  '非常支持': 'Very Supportive',
  '稍微支持': 'Somewhat Supportive',
  '稍微反對': 'Somewhat Opposed',
  '強烈反對': 'Strongly Opposed',
  
  // Government Investment options
  '非常同意': 'Strongly Agree',
  '同意': 'Agree',
  '不同意': 'Disagree',
  '非常不同意': 'Strongly Disagree',
  
  // Government Shutdown options
  '非常擔心': 'Very Concerned',
  '稍微擔心': 'Somewhat Concerned',
  '不擔心': 'Not Concerned',
  '完全不擔心': 'Not at All Concerned',
  
  // Air Fryers options
  '非常喜歡': 'Love Them',
  '喜歡': 'Like Them',
  '不喜歡': 'Dislike Them',
  '非常不喜歡': 'Hate Them',
  
  // Sustainability options
  '非常重要': 'Very Important',
  '重要': 'Important',
  '有點重要': 'Somewhat Important',
  '不重要': 'Not Important',
  '完全不重要': 'Not At All Important',
  
  // Immersive Technology options
  '虛擬實境（VR）': 'Virtual Reality (VR)',
  '擴增實境（AR）': 'Augmented Reality (AR)',
  '360度影片': '360-Degree Videos',
  '互動藝術裝置': 'Interactive Art Installations',
  '以上皆非': 'None of the Above',
  
  // AI Agents options
  '非常興奮': 'Very Excited',
  '稍微興奮': 'Somewhat Excited',
  '稍微擔憂': 'Somewhat Concerned',
  '非常擔憂': 'Very Concerned',
  
  // Labor Market options
  '非常樂觀': 'Very Optimistic',
  '稍微樂觀': 'Somewhat Optimistic',
  '稍微悲觀': 'Somewhat Pessimistic',
  '非常悲觀': 'Very Pessimistic',
  
  // Corporate Leadership options
  '正面': 'Positive',
  '負面': 'Negative',
  '不知道': 'Unaware',
  '無意見': 'No Opinion',
  
  // Common options
  '是': 'Yes',
  '否': 'No',
  '不確定': 'Not sure',
  '不確定': 'Unsure',
  '不確定': 'Not Sure',
  '不確定': 'Maybe',
  '不感興趣': 'Not interested',
  '不感興趣': 'Not Interested',
  '偶爾': 'Occasionally',
  '偶爾': 'Occasionally',
  '良好': 'Good',
  '也許': 'May be',
  'iPhone 17': 'iPhone 17',
  'iPhone Air': 'iPhone Air',
  'iPhone Pro': 'iPhone Pro',
  'iPhone Pro Max': 'iPhone Pro Max',
  '不確定': 'Not Sure',
  '強烈同意': 'Strongly agree',
  '同意': 'Agree',
  '不同意': 'Disagree',
  '強烈不同意': 'Strongly disagree',
  '強烈同意': 'Strongly Agree',
  '強烈不同意': 'Strongly Disagree'
};

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  console.log('🗑️  Deleting all existing records from poll_options_lang...');
  
  // Delete all existing records
  const { error: deleteError } = await supabase
    .from('poll_options_lang')
    .delete()
    .neq('id', 0); // Delete all records

  if (deleteError) {
    console.log('Table might not exist yet, continuing...');
  } else {
    console.log('✅ All existing records deleted');
  }

  console.log('\n📥 Fetching all poll options from the database...');
  
  const { data: pollOptions, error: optionsError } = await supabase
    .from('poll_options')
    .select('id, poll_id, text, vote_count')
    .order('poll_id', { ascending: true });

  if (optionsError) {
    console.error('Failed to fetch poll options:', optionsError.message);
    return;
  }

  console.log(`Found ${pollOptions.length} poll options`);

  let insertedCount = 0;
  let skippedCount = 0;

  console.log('\n🔄 Processing poll options...');

  for (const option of pollOptions) {
    const translation = OPTION_TRANSLATIONS[option.text];
    
    if (!translation) {
      console.log(`⚠️  No translation found for: ${option.text}`);
      skippedCount++;
      continue;
    }

    console.log(`📝 Processing: ${option.text}`);
    console.log(`   Translation: ${translation}`);

    // Insert English translation
    const { error: insertError } = await supabase
      .from('poll_options_lang')
      .insert({
        option_id: option.id,
        poll_id: option.poll_id,
        language_cd: 'ENG',
        text: translation
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
  console.log(`- Total options processed: ${pollOptions.length}`);
  console.log('\n🎉 All done!');
}

main().catch(console.error);
