// Randomly add votes to 20 polls
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function fetchAllPollIds() {
  const { data, error } = await supabase.from('polls').select('id');
  if (error) throw error;
  return (data || []).map((p) => p.id);
}

async function fetchOptionsForPoll(pollId) {
  const { data, error } = await supabase
    .from('poll_options')
    .select('id, vote_count')
    .eq('poll_id', pollId)
    .order('id');
  if (error) throw error;
  return data || [];
}

async function applyVotesToPoll(pollId, minVotes = 10, maxVotes = 50) {
  const options = await fetchOptionsForPoll(pollId);
  if (!options.length) {
    console.log(`- Poll ${pollId}: no options found, skipping`);
    return { pollId, updates: 0, totalVotes: 0 };
  }

  const numVotes = Math.floor(Math.random() * (maxVotes - minVotes + 1)) + minVotes;

  const increments = new Map();
  for (let i = 0; i < numVotes; i++) {
    const randomOption = options[Math.floor(Math.random() * options.length)];
    increments.set(randomOption.id, (increments.get(randomOption.id) || 0) + 1);
  }

  let updates = 0;
  for (const option of options) {
    const inc = increments.get(option.id) || 0;
    if (inc === 0) continue;
    const newCount = (option.vote_count || 0) + inc;
    const { error } = await supabase
      .from('poll_options')
      .update({ vote_count: newCount })
      .eq('id', option.id);
    if (error) {
      console.error(`  ✖ Failed updating option ${option.id}:`, error.message);
    } else {
      updates += 1;
    }
  }

  console.log(`- Poll ${pollId}: +${numVotes} votes across ${updates} options`);
  return { pollId, updates, totalVotes: numVotes };
}

async function main() {
  try {
    console.log('📥 Fetching polls...');
    const pollIds = await fetchAllPollIds();
    if (!pollIds.length) {
      console.log('No polls found.');
      return;
    }

    const toVote = shuffle([...pollIds]).slice(0, Math.min(20, pollIds.length));
    console.log(`🎯 Targeting ${toVote.length} polls for random votes`);

    let totalVotes = 0;
    let totalOptionsUpdated = 0;

    for (const pollId of toVote) {
      const { updates, totalVotes: added } = await applyVotesToPoll(pollId);
      totalVotes += added;
      totalOptionsUpdated += updates;
    }

    console.log('\n📊 Summary');
    console.log(`- Total polls updated: ${toVote.length}`);
    console.log(`- Total options updated: ${totalOptionsUpdated}`);
    console.log(`- Total votes added: ${totalVotes}`);
    console.log('✅ Done');
  } catch (err) {
    console.error('Error during random voting:', err);
    process.exit(1);
  }
}

main();


