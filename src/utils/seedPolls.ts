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
  },
  // Chinese poll questions
  {
    question: "您如何看待美中「關稅戰」再次升溫，美國提出對中國商品徵收100%關稅？",
    options: ["支持，美國應保護本土產業", "反對，將引發通貨膨脹", "中立，兩國應尋求妥協", "不關心經濟議題"]
  },
  {
    question: "中國加強稀土出口限制被視為「貿易反制」，您認為這會影響全球科技市場嗎？",
    options: ["會，影響重大", "影響有限", "不清楚，時間會證明", "不會"]
  },
  {
    question: "物理學家楊振寧於103歲辭世，您如何評價他的科學與教育貢獻？",
    options: ["極為崇高，值得後世敬仰", "相當重要", "一般，影響有限", "不熟悉此人"]
  },
  {
    question: "香港即將推出「粵車南下」電子罰款App，您是否支持此數碼化措施？",
    options: ["支持，提升便利性", "可接受，但需保障隱私", "擔心技術問題", "不贊成"]
  },
  {
    question: "今日是「世界更年期關懷日」，您認為社會對更年期女性是否給予足夠重視？",
    options: ["給予足夠關懷", "還需要更多公共教育", "重視不足", "未特別關注"]
  },
  {
    question: "香港多所大學揭發「假學歷」申請案，校方開始用AI篩查，您怎麼看？",
    options: ["應用AI可有效防止作弊", "可能侵犯隱私", "取決於執行透明度", "不影響，一切照常"]
  },
  {
    question: "香港特區政府推動「創科灣區」計劃並奪得亞洲智慧創新大獎，您對本地創新前景看法如何？",
    options: ["前景光明", "有潛力但需政策支持", "發展受限於成本與市場", "不太看好"]
  },
  {
    question: "台南奇美博物館將與大英博物館合作展出「法老之王」特展，您會有興趣參觀嗎？",
    options: ["絕對想去", "視時間而定", "沒特別興趣", "不會去"]
  },
  {
    question: "IMF與世銀年會上，黃金成為焦點議題並創歷史新高，您是否考慮投資黃金？",
    options: ["已經持有", "正在考慮", "沒興趣", "不相信黃金有長期價值"]
  },
  {
    question: "AI影片生成器近期大熱，您會用AI製作個人影片或短影音嗎？",
    options: ["常用，效果很好", "想試但擔心版權", "興趣不大", "完全不會使用"]
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