// Simple Node.js script to translate polls
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qqtdghrbwgrzkhysxbia.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxdGRnaHJid2dyemtoeXN4YmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTI4MTgsImV4cCI6MjA3MzgyODgxOH0.8IduJiIZE0db9My-nQ0be8U4rAM-reVVlFOJS8e6sFQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Translation mappings
const translations = {
  // Common poll questions
  "What's your favorite programming language?": "你最喜歡的程式語言是什麼？",
  "Which framework do you prefer for web development?": "你比較喜歡哪個網頁開發框架？",
  "What's your preferred database?": "你比較喜歡哪個資料庫？",
  "Which cloud provider do you use?": "你使用哪個雲端服務提供商？",
  "What's your favorite IDE?": "你最喜歡的整合開發環境是什麼？",
  "Which operating system do you use?": "你使用哪個作業系統？",
  "What's your preferred version control system?": "你比較喜歡哪個版本控制系統？",
  "Which testing framework do you prefer?": "你比較喜歡哪個測試框架？",
  "What's your favorite design tool?": "你最喜歡的設計工具是什麼？",
  "Which mobile platform do you develop for?": "你為哪個行動平台開發？",
  
  // Common poll options
  "JavaScript": "JavaScript",
  "Python": "Python", 
  "Java": "Java",
  "C#": "C#",
  "C++": "C++",
  "TypeScript": "TypeScript",
  "Go": "Go",
  "Rust": "Rust",
  "PHP": "PHP",
  "Ruby": "Ruby",
  "Swift": "Swift",
  "Kotlin": "Kotlin",
  "React": "React",
  "Vue": "Vue",
  "Angular": "Angular",
  "Svelte": "Svelte",
  "Next.js": "Next.js",
  "Nuxt.js": "Nuxt.js",
  "Express": "Express",
  "Django": "Django",
  "Flask": "Flask",
  "Laravel": "Laravel",
  "Spring": "Spring",
  "ASP.NET": "ASP.NET",
  "MySQL": "MySQL",
  "PostgreSQL": "PostgreSQL",
  "MongoDB": "MongoDB",
  "Redis": "Redis",
  "SQLite": "SQLite",
  "Oracle": "Oracle",
  "SQL Server": "SQL Server",
  "AWS": "AWS",
  "Google Cloud": "Google Cloud",
  "Azure": "Azure",
  "DigitalOcean": "DigitalOcean",
  "Heroku": "Heroku",
  "Vercel": "Vercel",
  "Netlify": "Netlify",
  "VS Code": "VS Code",
  "IntelliJ IDEA": "IntelliJ IDEA",
  "Sublime Text": "Sublime Text",
  "Vim": "Vim",
  "Emacs": "Emacs",
  "Atom": "Atom",
  "WebStorm": "WebStorm",
  "PyCharm": "PyCharm",
  "Android Studio": "Android Studio",
  "Xcode": "Xcode",
  "Windows": "Windows",
  "macOS": "macOS",
  "Linux": "Linux",
  "Ubuntu": "Ubuntu",
  "CentOS": "CentOS",
  "Debian": "Debian",
  "Git": "Git",
  "SVN": "SVN",
  "Mercurial": "Mercurial",
  "Perforce": "Perforce",
  "Jest": "Jest",
  "Mocha": "Mocha",
  "Chai": "Chai",
  "Cypress": "Cypress",
  "Selenium": "Selenium",
  "Puppeteer": "Puppeteer",
  "Playwright": "Playwright",
  "Figma": "Figma",
  "Sketch": "Sketch",
  "Adobe XD": "Adobe XD",
  "InVision": "InVision",
  "Zeplin": "Zeplin",
  "Principle": "Principle",
  "Framer": "Framer",
  "iOS": "iOS",
  "Android": "Android",
  "React Native": "React Native",
  "Flutter": "Flutter",
  "Xamarin": "Xamarin",
  "Ionic": "Ionic",
  "Cordova": "Cordova",
  "PhoneGap": "PhoneGap",
  "Unity": "Unity",
  "Unreal Engine": "Unreal Engine",
  "Godot": "Godot",
  "Cocos2d": "Cocos2d",
  "Construct": "Construct",
  "GameMaker": "GameMaker",
  "Definitely": "絕對是",
  "Probably": "可能是",
  "Maybe": "也許",
  "Probably not": "可能不是",
  "Definitely not": "絕對不是",
  "Yes": "是",
  "No": "否",
  "Not sure": "不確定",
  "Strongly agree": "非常同意",
  "Agree": "同意",
  "Neutral": "中立",
  "Disagree": "不同意",
  "Strongly disagree": "非常不同意",
  "Very satisfied": "非常滿意",
  "Satisfied": "滿意",
  "Dissatisfied": "不滿意",
  "Very dissatisfied": "非常不滿意",
  "Excellent": "優秀",
  "Good": "良好",
  "Average": "普通",
  "Poor": "差",
  "Very poor": "非常差",
  "Always": "總是",
  "Often": "經常",
  "Sometimes": "有時",
  "Rarely": "很少",
  "Never": "從不",
  "Daily": "每天",
  "Weekly": "每週",
  "Monthly": "每月",
  "Yearly": "每年",
  "Very important": "非常重要",
  "Important": "重要",
  "Somewhat important": "有點重要",
  "Not very important": "不太重要",
  "Not important at all": "完全不重要"
};

// Function to translate text
function translateText(text) {
  return translations[text] || `${text} (未翻譯)`;
}

// Main translation function
async function translateAllPolls() {
  try {
    console.log('🔄 開始翻譯所有投票...');
    
    // Fetch all polls with their options
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select(`
        id,
        question,
        poll_options (
          id,
          text
        )
      `);

    if (pollsError) {
      throw pollsError;
    }

    if (!polls || polls.length === 0) {
      console.log('ℹ️ 沒有找到需要翻譯的投票');
      return;
    }

    console.log(`📊 找到 ${polls.length} 個投票需要翻譯`);

    // Translate each poll
    for (const poll of polls) {
      console.log(`🔄 翻譯投票: "${poll.question}"`);
      
      // Translate poll question
      const translatedQuestion = translateText(poll.question);
      
      // Update poll question
      const { error: pollUpdateError } = await supabase
        .from('polls')
        .update({ question: translatedQuestion })
        .eq('id', poll.id);

      if (pollUpdateError) {
        console.error(`❌ 更新投票問題失敗:`, pollUpdateError);
        continue;
      }

      console.log(`✅ 投票問題已翻譯: "${translatedQuestion}"`);

      // Translate poll options
      if (poll.poll_options && poll.poll_options.length > 0) {
        for (const option of poll.poll_options) {
          const translatedOptionText = translateText(option.text);
          
          const { error: optionUpdateError } = await supabase
            .from('poll_options')
            .update({ text: translatedOptionText })
            .eq('id', option.id);

          if (optionUpdateError) {
            console.error(`❌ 更新選項失敗:`, optionUpdateError);
            continue;
          }

          console.log(`✅ 選項已翻譯: "${translatedOptionText}"`);
        }
      }
    }

    console.log('🎉 所有投票翻譯完成！');
    
  } catch (error) {
    console.error('❌ 翻譯過程中發生錯誤:', error);
    throw error;
  }
}

// Run the translation
translateAllPolls()
  .then(() => {
    console.log('✅ 翻譯腳本執行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 翻譯腳本執行失敗:', error);
    process.exit(1);
  });
