# Chad Solutions

An in-browser facial analysis app that estimates a forum-style PSL score from a photo, breaks down the contributing facial metrics, and suggests practical ways to improve the result.

## What it does

- Takes a webcam photo, uploaded file, or image URL
- Analyzes facial geometry locally in the browser
- Shows a PSL score, tier, percentile, and metric-by-metric breakdown
- Explains the strong points, weak points, and improvement ideas
- Includes a source archive tab for the pasted reference corpus
- Includes a benchmark tab for test images

## Local development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000/`.

## Available scripts

- `npm run dev` - start the local app
- `npm run build` - build the static export
- `npm run sync:test-images` - copy `PSL Examples (TESTING)` into `public/test-images` and rebuild the gallery manifest
- `npm run test` - run Vitest

## Benchmark images

If you want the Bench tab to show your reference set:

1. Put images in `PSL Examples (TESTING)` at the repo root.
2. Run `npm run sync:test-images`.
3. Open the `Bench` tab in the app.

The sync script copies the files into `public/test-images` and generates `public/test-images/index.json`.

## Source archive

The app also includes a browsable source archive under the `Sources` tab. The corpus is stored in `public/forum-corpus` and is bundled into the static export.

## GitHub Pages

The project is configured for static export and GitHub Pages deployment. The key pieces are:

- `next.config.ts`
- `.github/workflows/deploy.yml`
- `public/manifest.json`

## Notes

- All analysis runs locally in the browser.
- The app is meant for experimentation and personal use, not medical diagnosis.
