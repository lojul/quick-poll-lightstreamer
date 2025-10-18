// Script to find the correct column names for polls_lang table
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

  console.log('Trying to select from polls_lang to discover columns...');
  
  // Try different select patterns to discover columns
  const selectPatterns = [
    '*',
    'id',
    'poll_id', 
    'language_cd',
    'language',
    'question',
    'text',
    'content'
  ];

  for (const pattern of selectPatterns) {
    console.log(`\nTrying SELECT ${pattern} FROM polls_lang...`);
    try {
      const { data, error } = await supabase
        .from('polls_lang')
        .select(pattern)
        .limit(1);

      if (error) {
        console.log(`✖ Error: ${error.message}`);
      } else {
        console.log(`✓ Success! Found columns: ${pattern}`);
        console.log('Sample data:', data);
        break;
      }
    } catch (err) {
      console.log(`✖ Exception: ${err.message}`);
    }
  }

  // Try to get table schema using a different approach
  console.log('\nTrying to get table schema...');
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'polls_lang');

    if (error) {
      console.log(`Schema query error: ${error.message}`);
    } else {
      console.log('Table columns:', data);
    }
  } catch (err) {
    console.log(`Schema query exception: ${err.message}`);
  }
}

main().catch(console.error);









