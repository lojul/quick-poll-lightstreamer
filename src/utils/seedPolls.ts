import { supabase } from '@/integrations/supabase/client';

const POLL_DATA = [
  {
    question: "Do you think world leaders are addressing climate change quickly enough?",
    options: ["Yes", "No", "Not sure"]
  },
  {
    question: "Should economic sanctions be used more by countries in global conflicts?",
    options: ["Yes", "No", "Unsure"]
  },
  {
    question: "Are the media doing enough to combat misinformation?",
    options: ["Yes", "No", "Not sure"]
  },
  {
    question: "Do you support recent drone strikes in military operations?",
    options: ["Yes", "No", "Prefer not to answer"]
  },
  {
    question: "Is global inflation affecting your daily spending habits?",
    options: ["Yes", "No"]
  },
  {
    question: "Should governments increase funding for mental health support?",
    options: ["Yes", "No", "Not sure"]
  },
  {
    question: "Is the current refugee crisis being properly managed by international organizations?",
    options: ["Yes", "No", "Not sure"]
  },
  {
    question: "Do you believe free speech is at risk due to recent media censorship incidents?",
    options: ["Yes", "No", "Unsure"]
  },
  {
    question: "Should social media platforms ban political ads during election periods?",
    options: ["Yes", "No", "No opinion"]
  },
  {
    question: "Are large tech companies (like Google, Apple, Meta) too powerful in influencing society?",
    options: ["Strongly agree", "Agree", "Neutral", "Disagree", "Strongly disagree"]
  },
  {
    question: "Are AI-powered virtual coworkers the future of office productivity?",
    options: ["Yes", "No", "Maybe"]
  },
  {
    question: "Would you purchase a quantum computer for personal use if the price was reasonable?",
    options: ["Yes", "No", "Not interested"]
  },
  {
    question: "Do you think smartwatches are replacing traditional watches for most people?",
    options: ["Yes", "No", "Not sure"]
  },
  {
    question: "Are autonomous vehicles progressing fast enough to become mainstream by 2030?",
    options: ["Yes", "No", "Unsure"]
  },
  {
    question: "Should technology companies be legally required to support older devices for longer periods?",
    options: ["Yes", "No"]
  },
  {
    question: "Are privacy concerns stopping you from trying smart home gadgets?",
    options: ["Yes", "No", "Not sure"]
  },
  {
    question: "Is wearable health tech (such as glucose monitors, EKG watches) making healthcare better for everyone?",
    options: ["Yes", "No", "Not sure"]
  },
  {
    question: "Are cryptocurrencies a safe investment in today's market volatility?",
    options: ["Yes", "No", "Unsure"]
  },
  {
    question: "Should more companies use renewable energy in their tech production processes?",
    options: ["Yes", "No", "Not sure"]
  },
  {
    question: "Do you use generative AI apps (like ChatGPT or image generators) daily?",
    options: ["Yes", "No", "Occasionally"]
  },
  {
    question: "Which iPhone would you buy?",
    options: ["iPhone 17", "iPhone Air", "iPhone Pro", "iPhone Pro Max", "Not Sure"]
  }
];

export async function seedPolls() {
  try {
    console.log('Starting to seed polls...');
    
    for (const pollData of POLL_DATA) {
      // Create poll
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({ question: pollData.question })
        .select()
        .single();

      if (pollError) {
        console.error(`Error creating poll "${pollData.question}":`, pollError);
        continue;
      }

      // Create poll options
      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(
          pollData.options.map(text => ({
            poll_id: poll.id,
            text
          }))
        );

      if (optionsError) {
        console.error(`Error creating options for poll "${pollData.question}":`, optionsError);
        continue;
      }

      console.log(`✓ Created poll: "${pollData.question}"`);
    }
    
    console.log('Finished seeding polls!');
    return true;
  } catch (error) {
    console.error('Error seeding polls:', error);
    return false;
  }
}