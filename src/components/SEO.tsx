import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  pollQuestion?: string;
  pollVotes?: number;
}

export function SEO({
  title = "貓爪達人投票社 | CatPawVote - 即時投票平台",
  description = "建立即時投票，收集意見反饋。支援中英文，即時更新結果，簡單易用的投票平台。Create instant polls, collect feedback with real-time updates.",
  keywords = "投票, 民意調查, 即時投票, 線上投票, 貓爪投票, 意見收集, poll, voting, survey, catpaw vote, real-time voting, 中文投票, 英文投票",
  image = "/favicon.svg",
  url = "https://catpawvote.up.railway.app/",
  type = "website",
  pollQuestion,
  pollVotes
}: SEOProps) {
  // Dynamic title based on context
  const dynamicTitle = pollQuestion
    ? `${pollQuestion} | 貓爪達人投票社 | CatPawVote`
    : title;

  // Dynamic description based on context
  const dynamicDescription = pollQuestion
    ? `參與投票：${pollQuestion}。即時查看結果，支援中英文投票平台。`
    : description;

  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": type === "article" ? "Article" : "WebApplication",
    "name": dynamicTitle,
    "description": dynamicDescription,
    "url": url,
    "image": image,
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "CatPawVote Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "CatPawVote",
      "logo": {
        "@type": "ImageObject",
        "url": "/favicon.svg"
      }
    },
    "inLanguage": ["zh-TW", "en-US"],
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "即時投票建立",
      "即時結果更新",
      "中英文支援",
      "響應式設計",
      "圖表視覺化"
    ],
    ...(pollQuestion && {
      "headline": pollQuestion,
      "articleBody": `投票問題：${pollQuestion}。目前已有 ${pollVotes || 0} 票參與。`,
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/VoteAction",
        "userInteractionCount": pollVotes || 0
      }
    })
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{dynamicTitle}</title>
      <meta name="title" content={dynamicTitle} />
      <meta name="description" content={dynamicDescription} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Chinese, English" />
      <meta name="revisit-after" content="7 days" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={dynamicTitle} />
      <meta property="og:description" content={dynamicDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="貓爪達人投票社 - 即時投票結果展示" />
      <meta property="og:site_name" content="CatPawVote" />
      <meta property="og:locale" content="zh_TW" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={dynamicTitle} />
      <meta name="twitter:description" content={dynamicDescription} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content="貓爪達人投票社 - 即時投票結果展示" />

      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#9333ea" />
      <meta name="msapplication-TileColor" content="#9333ea" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="CatPawVote" />
      <meta name="application-name" content="CatPawVote" />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
