import { mkdir, readdir, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const workspaceRoot = path.resolve(process.cwd());
const sourceDir = path.join(workspaceRoot, 'PSL Examples (TESTING)');
const targetDir = path.join(workspaceRoot, 'public', 'test-images');

const imagePattern = /\.(jpe?g|png|webp)$/i;

function parseExpectedPsl(fileName) {
    const match = fileName.match(/PSL\s*([0-9]+(?:\.[0-9]+)?)/i);
    return match ? Number(match[1]) : undefined;
}

function makeLabel(fileName) {
    return fileName.replace(/\.[^.]+$/, '');
}

async function main() {
    await mkdir(targetDir, { recursive: true });

    const files = await readdir(sourceDir, { withFileTypes: true });
    const images = files
        .filter((entry) => entry.isFile() && imagePattern.test(entry.name))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));

    const manifest = [];

    for (const fileName of images) {
        await copyFile(path.join(sourceDir, fileName), path.join(targetDir, fileName));

        const expectedPsl = parseExpectedPsl(fileName);
        manifest.push({
            fileName,
            label: makeLabel(fileName),
            expectedPsl,
        });
    }

    await writeFile(path.join(targetDir, 'index.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`Synced ${manifest.length} benchmark images from ${sourceDir}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
