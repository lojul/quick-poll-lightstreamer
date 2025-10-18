import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

function formatDate(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function upsertDailyPoll(question: string, options: string[]) {
  // Idempotent by question text
  const { data: existing, error: findErr } = await supabase
    .from('polls')
    .select('id, question')
    .eq('question', question)
    .limit(1)
    .maybeSingle();
  if (findErr) throw findErr;

  let pollId: string;
  if (existing?.id) {
    pollId = existing.id;
  } else {
    const { data: created, error: createErr } = await supabase
      .from('polls')
      .insert({ question })
      .select('id')
      .single();
    if (createErr) throw createErr;
    pollId = created.id as string;
  }

  // Fetch current options
  const { data: currentOptions, error: optErr } = await supabase
    .from('poll_options')
    .select('id, text')
    .eq('poll_id', pollId);
  if (optErr) throw optErr;

  const existingTexts = new Set((currentOptions || []).map(o => o.text));
  const toInsert = options.filter(o => !existingTexts.has(o)).map(text => ({ poll_id: pollId, text, vote_count: 0 }));
  if (toInsert.length > 0) {
    const { error: insErr } = await supabase.from('poll_options').insert(toInsert);
    if (insErr) throw insErr;
  }
  return pollId;
}

async function randomVoteTwentyPolls() {
  const { data: polls, error: pollsErr } = await supabase
    .from('polls')
    .select('id')
    .order('created_at', { ascending: false });
  if (pollsErr) throw pollsErr;
  const pollIds = (polls || []).map(p => p.id as string);
  if (pollIds.length === 0) return { updated: 0, optionsUpdated: 0, votes: 0 };

  // Shuffle and take up to 20
  for (let i = pollIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pollIds[i], pollIds[j]] = [pollIds[j], pollIds[i]];
  }
  const target = pollIds.slice(0, Math.min(20, pollIds.length));

  let totalVotes = 0;
  let totalOptions = 0;
  for (const pollId of target) {
    const { data: options, error: optErr } = await supabase
      .from('poll_options')
      .select('id, vote_count')
      .eq('poll_id', pollId);
    if (optErr) throw optErr;
    if (!options || options.length === 0) continue;
    const votes = Math.floor(Math.random() * (50 - 10 + 1)) + 10; // 10..50

    const increments = new Map<string, number>();
    for (let i = 0; i < votes; i++) {
      const choice = options[Math.floor(Math.random() * options.length)];
      const prev = increments.get(choice.id as string) || 0;
      increments.set(choice.id as string, prev + 1);
    }

    for (const opt of options) {
      const inc = increments.get(opt.id as string) || 0;
      if (inc === 0) continue;
      const newCount = (opt.vote_count || 0) + inc;
      const { error: updErr } = await supabase
        .from('poll_options')
        .update({ vote_count: newCount })
        .eq('id', opt.id);
      if (updErr) throw updErr;
      totalOptions += 1;
    }
    totalVotes += votes;
  }
  return { updated: target.length, optionsUpdated: totalOptions, votes: totalVotes };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Deployment protection is enforced by Vercel via x-vercel-protection-bypass.
    // No additional app-level secret required.

    // Build 10 polls for today
    const today = formatDate(new Date());
    const baseQuestions = [
      'Do you agree?',
      'What is your sentiment?',
      'Should this be prioritized?',
      'Will this impact you?',
      'Is this trend positive?',
      'Do you support this move?',
      'Is this a good idea?',
      'Is this overhyped?',
      'Will this succeed?',
      'Would you adopt it?'
    ];
    const optionSets: string[][] = [
      ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'],
      ['Very Positive', 'Somewhat Positive', 'Neutral', 'Somewhat Negative', 'Very Negative'],
      ['Yes', 'No', 'Not Sure']
    ];

    const createdPollIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      const q = `${today} • ${baseQuestions[i]} (#${i + 1})`;
      const opts = optionSets[i % optionSets.length];
      const pollId = await upsertDailyPoll(q, opts);
      createdPollIds.push(pollId);
    }

    const voteSummary = await randomVoteTwentyPolls();

    return res.status(200).json({
      createdPolls: createdPollIds.length,
      createdPollIds,
      voteSummary
    });
  } catch (err: any) {
    console.error('daily-tasks error:', err);
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}


