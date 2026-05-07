import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const cleanJSON = (text: string) => 
  text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

async function callGemini(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Reddit sources
const SUBREDDITS = [
  'Looksmaxxing', 'malegrooming', 'malehairadvice',
  'Haircare', 'SkincareAddiction', 'jawline', 'mewing',
  'malefashionadvice'
];

async function scrapeReddit(subreddit: string): Promise<string[]> {
  const res = await fetch(
    `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=25`,
    { headers: { 'User-Agent': 'ChadSolutions/1.0' } }
  );
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data: any = await res.json();
  return data.data.children
    .map((p: any) => `[r/${subreddit}] ${p.data.title} ${p.data.selftext || ''}`)
    .filter((text: string) => text.length > 30)
    .map((text: string) => text.substring(0, 500));
}

// Hardcoded High-Value Threads (Fallback for Cloudflare blocking)
const LOOKSMAX_THREADS = [
  { url: 'https://looksmax.org/threads/the-hollow-cheeks-and-ogee-curve-bible.476888/', title: 'Hollow Cheeks Bible' },
  { url: 'https://looksmax.org/threads/eye-area-glossary.350165/', title: 'Eye Area Glossary' },
  { url: 'https://looksmax.org/threads/guide-on-achieving-model-tier-skin.502859/', title: 'Model Tier Skin Guide' },
  { url: 'https://looksmax.org/threads/the-eyebrowmaxxing-guide.1/', title: 'Eyebrowmaxxing Guide' }, // Note: URLs ending in .1/ might be placeholders in user's prompt
  { url: 'https://looksmax.org/threads/collagen-maxing-guide.1/', title: 'Collagen Maxing Guide' },
  { url: 'https://looksmax.org/threads/ideal-facial-ratios-and-proportions.1/', title: 'Facial Ratios Guide' },
  { url: 'https://looksmax.org/threads/gum-health-aesthetics.1/', title: 'Gum Health Guide' },
  { url: 'https://looksmax.org/threads/upper-maxillary-projection-is-the-key-to-aesthetics.1/', title: 'Maxillary Projection Guide' },
  { url: 'https://looksmax.org/threads/bucketcrabs-practical-hair-guide.1/', title: 'Practical Hair Guide' },
];

async function scrapeBOTBIndex(): Promise<{ url: string, title: string }[]> {
  const threads: { url: string, title: string }[] = [];
  const pages = [
    'https://looksmax.org/forums/best-of-the-best.9/',
    'https://looksmax.org/forums/best-of-the-best.9/page-2',
    'https://looksmax.org/forums/best-of-the-best.9/page-3',
    'https://looksmax.org/forums/best-of-the-best.9/page-4',
  ];

  for (const pageUrl of pages) {
    try {
      console.log(`Scraping BOTB index: ${pageUrl}...`);
      const res = await fetch(pageUrl, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      const html = await res.text();
      
      if (html.includes('cf-challenge') || html.includes('cf-browser-verification')) {
        console.log(`Cloudflare blocked index page: ${pageUrl}`);
        continue;
      }

      // Extract thread links and titles
      const matches = [...html.matchAll(
        /href="(https:\/\/looksmax\.org\/threads\/[^"]+)"[^>]*class="[^"]*title[^"]*"[^>]*>([^<]{10,})</g
      )];
      
      for (const [, url, title] of matches) {
        if (!threads.find(t => t.url === url)) {
          threads.push({ url, title: title.trim() });
        }
      }
    } catch (err) {
      console.error(`Failed to scrape BOTB page: ${pageUrl}`);
    }
    await sleep(2000);
  }
  
  return threads;
}

async function fetchThreadFirstPost(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      }
    });
    const html = await res.text();
    
    if (html.includes('cf-challenge')) {
      console.log(`Cloudflare blocked thread: ${url}`);
      return '';
    }

    // XenForo: first post content is in bbWrapper div
    const match = html.match(/class="bbWrapper">([\s\S]*?)<\/div>/);
    if (!match) return '';
    
    return match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 4000);
  } catch (err) {
    return '';
  }
}

async function filterAndClassify(rawContent: string[]): Promise<any> {
  const text = await callGemini(`
You are a content filter and classifier for a facial aesthetics app used by teenagers and young adults.

DISCARD anything involving:
- Prescription medications, peptides, steroids, SARMs, HGH, or any drugs whatsoever
- Illegal substances including psychedelics
- Surgical procedures or implants  
- Dangerous or extreme weight loss methods
- Racist, ethnocentric, or racial hierarchy content
- Incel ideology, misogyny, or hatred toward any group
- Content mocking or degrading specific individuals
- Anything medically dangerous
- Pseudoscience presented as fact
- Cope or blackpill doomerism with no actionable content

KEEP and classify anything that is:
- Skincare routines and ingredient recommendations
- Natural grooming techniques (eyebrows, hair, etc.)
- Haircut and styling advice
- Mewing, tongue posture, jaw exercises
- Facial ratios and proportion education  
- Teeth whitening and oral hygiene
- Nutrition and diet for skin and hair health
- Exercise and body composition (gym, natural methods only)
- Eye area grooming (lashes, skin around eyes)
- Style and clothing advice as it relates to facial framing
- Sleep and lifestyle optimization

For each kept item, extract:
- Core advice in one clean actionable sentence
- Category: skincare | grooming | haircut | mewing | fitness | nutrition | style | ratios
- Relevant face shapes or phenotypes if mentioned
- Confidence: low | medium | high

Return ONLY valid JSON, no markdown:
{
  "insights": [
    {
      "advice": "string",
      "category": "skincare|grooming|haircut|mewing|fitness|nutrition|style|ratios",
      "faceShapes": ["Oval", "Square"] or [],
      "phenotypes": ["ROBUST / WARRIOR"] or [],
      "confidence": "low|medium|high",
      "source": "reddit/looksmax"
    }
  ],
  "discardedCount": number,
  "discardReasons": ["brief summary of what was removed and why"]
}

Content to process:
${rawContent.slice(0, 40).join('\n---\n')}
  `);

  try {
    return JSON.parse(cleanJSON(text));
  } catch (err) {
    console.error("Failed to parse Gemini JSON response:", text);
    return { insights: [], discardedCount: rawContent.length, discardReasons: ["JSON parse error"] };
  }
}

async function main() {
  console.log('Starting weekly insight sync...');
  const allContent: string[] = [];

  // 1. Reddit
  for (const sub of SUBREDDITS) {
    console.log(`Scraping r/${sub}...`);
    try {
      const posts = await scrapeReddit(sub);
      allContent.push(...posts);
    } catch (err) {
      console.error(`Reddit failed for ${sub}:`, err);
    }
    await sleep(1000);
  }

  // 2. Looksmax BOTB
  console.log('Scraping looksmax.org/best-of-the-best...');
  let botbThreads = await scrapeBOTBIndex();
  
  if (botbThreads.length === 0) {
    console.log('Index scrape failed, using fallback high-value threads list...');
    botbThreads = LOOKSMAX_THREADS;
  }

  console.log(`Processing ${botbThreads.length} BOTB threads`);

  // Fetch threads content
  for (const thread of botbThreads.slice(0, 20)) {
    console.log(`Fetching thread: ${thread.title}`);
    const content = await fetchThreadFirstPost(thread.url);
    if (content) {
      allContent.push(`[looksmax BOTB: ${thread.title}] ${content}`);
    } else {
      console.log(`Skipping thread (blocked or empty): ${thread.title}`);
    }
    await sleep(3000); // Respectful rate limit
  }

  if (allContent.length === 0) {
    console.log("No content scraped. Exiting.");
    return;
  }

  console.log(`Processing ${allContent.length} content pieces through Gemini filter...`);
  const filtered = await filterAndClassify(allContent);
  
  console.log(`Kept: ${filtered.insights.length}`);
  console.log(`Discarded: ${filtered.discardedCount}`);
  console.log(`Reasons: ${filtered.discardReasons?.join(', ')}`);

  const dbPath = path.join(process.cwd(), 'data/community-insights.json');
  const existing = fs.existsSync(dbPath) 
    ? JSON.parse(fs.readFileSync(dbPath, 'utf-8')) 
    : { insights: [], totalProcessed: 0, totalDiscarded: 0 };

  const dedupePrompt = `Here are existing insights and new insights for a facial aesthetics app.
      
Remove duplicates and near-duplicates from the new list.
Keep the best phrasing when there's overlap.
Return ONLY the new unique insights as JSON array, same format as input.

Existing (do not repeat these):
${JSON.stringify(existing.insights.slice(-50))}

New:
${JSON.stringify(filtered.insights)}`;

  const dedupeText = await callGemini(dedupePrompt);
  
  let uniqueNew = [];
  try {
    uniqueNew = JSON.parse(cleanJSON(dedupeText));
  } catch (err) {
    console.error("Failed to parse dedupe JSON:", dedupeText);
  }

  const updated = {
    lastUpdated: new Date().toISOString(),
    totalProcessed: (existing.totalProcessed || 0) + allContent.length,
    totalDiscarded: (existing.totalDiscarded || 0) + filtered.discardedCount,
    insights: [...existing.insights, ...uniqueNew].slice(-500)
  };

  fs.writeFileSync(dbPath, JSON.stringify(updated, null, 2));
  console.log(`Database updated. Total insights: ${updated.insights.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
