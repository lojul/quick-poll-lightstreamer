// Script to check the actual structure of polls_lang table
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

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  console.log('Checking polls_lang table structure...');
  
  // Try to get table info by attempting different queries
  const queries = [
    'SELECT * FROM polls_lang LIMIT 0',
    'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'polls_lang\'',
    'DESCRIBE polls_lang',
    '\\d polls_lang'
  ];

  for (const query of queries) {
    console.log(`\nTrying query: ${query}`);
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`✖ Error: ${error.message}`);
      } else {
        console.log(`✓ Success:`, data);
      }
    } catch (err) {
      console.log(`✖ Exception: ${err.message}`);
    }
  }

  // Try to insert a simple record to see what columns are expected
  console.log('\nTrying to insert a test record...');
  
  const testData = {
    poll_id: 'test-id',
    language_cd: 'ENG',
    question: 'Test question'
  };

  const { error: insertError } = await supabase
    .from('polls_lang')
    .insert(testData);

  if (insertError) {
    console.log(`Insert error: ${insertError.message}`);
    console.log('This tells us what columns are expected.');
  } else {
    console.log('✓ Test insert successful');
  }
}

main().catch(console.error);









