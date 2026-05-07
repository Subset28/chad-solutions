import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

const cleanJSON = (text: string) => 
  text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

async function main() {
  console.log("Generating monthly trend update via Gemini...");
  
  const prompt = `You are a men's grooming analyst for the looksmaxxing community.
Generate trending hairstyles JSON for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
Return ONLY valid JSON.

Format:
{
  "lastUpdated": "ISO date",
  "topStyles": [
    {
      "name": "string",
      "description": "string",
      "suitability": ["Face Shape"],
      "popularity": 0-100
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    const trends = JSON.parse(cleanJSON(text));
    trends.lastUpdated = new Date().toISOString();
    
    const dbPath = path.join(process.cwd(), 'data/trends.json');
    fs.writeFileSync(dbPath, JSON.stringify(trends, null, 2));
    
    console.log(`Done. ${trends.topStyles.length} styles written to trends.json.`);
  } catch (err) {
    console.error("Failed to parse Gemini trends JSON:", text);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
