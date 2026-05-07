import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

/**
 * OmniSight Trend Sync Script
 * This script is run via GitHub Actions to update trending styles.
 */

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function main() {
    console.log("Starting trend synchronization with Anthropic...");

    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY is not set.");
    }

    const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20240620', // Using current stable model
        max_tokens: 2000,
        messages: [{
            role: 'user',
            content: `You are a men's grooming and style analyst for the looksmaxxing community. 
            
            Generate a JSON object with the current top trending hairstyles and grooming styles for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
            
            Return ONLY valid JSON, no markdown, no explanation. Format:
            {
              "lastUpdated": "ISO date string",
              "topStyles": [
                {
                  "name": "style name",
                  "compatibleFaceShapes": ["Oval", "Square"],
                  "compatiblePhenotypes": ["ROBUST / WARRIOR"],
                  "trendScore": 0-100,
                  "trendDirection": "rising" | "peak" | "declining",
                  "description": "one sentence",
                  "blackpillNote": "community note on why this works structurally"
                }
              ],
              "communityInsights": "one paragraph on current meta",
              "hotTakes": ["3-5 short blunt community-style observations about current style trends"]
            }`
        }]
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');
    
    const trends = JSON.parse(content.text);
    
    const dataPath = path.join(process.cwd(), 'data', 'trends.json');
    const dirPath = path.dirname(dataPath);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(dataPath, JSON.stringify(trends, null, 2));
    
    console.log(`Trends updated: ${trends.topStyles.length} styles written to ${dataPath}.`);
}

main().catch(err => {
    console.error("Trend sync failed:", err);
    process.exit(1);
});
