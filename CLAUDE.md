# chad-solutions — Claude Instructions

## Stack
Next.js 16.1.6 · React 19.2.3 · TypeScript · ShadCN · Tailwind 4 · Gemini AI · MediaPipe Tasks Vision · Supabase · PostHog · vitest · husky

## Structure
- `src/` — Next.js app (App Router)
- `facial-analysis-web/` — facial analysis feature
- `data/` · `harvests/` — ML data pipeline outputs
- `scripts/sync-test-images.mjs` — test image syncing
- `.husky/` — git hooks (lint + tests run on commit)

## Key context
- `build: next build --webpack` — intentionally NOT using Turbopack (unknown compat issue, investigate before switching)
- husky + lint-staged enforces: ESLint fix + vitest related on every commit
- `@google/generative-ai` is v0.24 (legacy) — v1+ API is different, don't mix docs
- MediaPipe runs client-side — don't move vision inference to server
- PostHog tracks feature usage — instrument new features

## 🟠 Known issues (audit 2026-06-06)
- `dotenv` in prod deps (should be devDep)
- `@google/generative-ai: ^0.24.1` — legacy, major API changes in v1+
- `harvests/` ML data in git — should move to object storage
- `html2canvas` has SVG + cross-origin limits

## Commands
```bash
npm run dev          # local dev (Next.js)
npm run build        # next build --webpack
npm run test         # vitest run
npm run lint         # eslint
```
