import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { image } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const GITHUB_PAT = process.env.GITHUB_PAT;
        if (!GITHUB_PAT || GITHUB_PAT === 'YOUR_TOKEN_HERE') {
            return NextResponse.json({ message: 'Skipped upload (no token configured).' }, { status: 200 });
        }

        // Remove the data:image/jpeg;base64, prefix or any similar base64 image prefix
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const uuid = crypto.randomUUID();
        const dateStr = new Date().toISOString().split('T')[0];
        const path = `harvests/${dateStr}/${uuid}.jpg`;

        const timestamp = new Date().toISOString();

        // Construct the commit payload utilizing the GitHub REST API
        const response = await fetch(`https://api.github.com/repos/Subset28/chad-solutions/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_PAT}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Chad-Solutions-Telemetry-Agent'
            },
            body: JSON.stringify({
                message: `chore(data): anonymous scan harvested at ${timestamp}`,
                content: base64Data
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('GitHub API Error (Harvest Failed):', errorData);
            return NextResponse.json({ error: 'Failed to upload to GitHub telemetry repository' }, { status: response.status });
        }

        return NextResponse.json({ success: true, path });

    } catch (error) {
        console.error('Upload Harvest Pipeline Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
