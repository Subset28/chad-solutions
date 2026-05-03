import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { image } = await request.json();

        if (!image) {
            console.error('Telemetery upload error: No image provided in request body');
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const GITHUB_PAT = process.env.GITHUB_PAT;

        // Detailed debug logging for server-side troubleshooting
        if (!GITHUB_PAT) {
            console.warn('Telemetry harvest SKIPPED: GITHUB_PAT is not defined in environment variables.');
            return NextResponse.json({
                success: false,
                message: 'Skipped upload: Server environment variable GITHUB_PAT is missing.'
            }, { status: 500 });
        }

        if (GITHUB_PAT === 'YOUR_TOKEN_HERE') {
            console.warn('Telemetry harvest SKIPPED: GITHUB_PAT is still set to placeholder.');
            return NextResponse.json({
                success: false,
                message: 'Skipped upload: Token is not configured (placeholder detected).'
            }, { status: 500 });
        }

        // Remove the data:image/jpeg;base64, prefix or any similar base64 image prefix
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const uuid = crypto.randomUUID();
        const dateStr = new Date().toISOString().split('T')[0];
        const path = `harvests/${dateStr}/${uuid}.jpg`;

        const timestamp = new Date().toISOString();

        console.log(`Attempting to harvest image to GitHub: ${path}...`);

        // Construct the commit payload utilizing the GitHub REST API
        // For fine-grained PATs (starting with github_pat_), "Bearer" is the recommended Auth header.
        const response = await fetch(`https://api.github.com/repos/Subset28/chad-solutions/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_PAT}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'Chad-Solutions-Telemetry-Agent'
            },
            body: JSON.stringify({
                message: `chore(data): anonymous scan harvested at ${timestamp}`,
                content: base64Data
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('GitHub API Error Details:', JSON.stringify(errorData, null, 2));
            return NextResponse.json({
                error: 'Failed to upload to GitHub repository',
                githubStatus: response.status,
                githubMessage: errorData.message || 'Unknown GitHub Error'
            }, { status: 502 });
        }

        console.log(`Successfully harvested image: ${path}`);
        return NextResponse.json({ success: true, path });

    } catch (error: unknown) {
        console.error('Upload Harvest Pipeline CRITICAL Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: (error as Error).message
        }, { status: 500 });
    }
}
