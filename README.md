# Chad Solutions — Neural Facial Analysis Engine

> **The world's most advanced browser-based facial analysis tool.** 25+ clinical metrics. Surgical-grade precision. Your personalized roadmap to peak aesthetic potential. 100% local — no data ever leaves your device.

---

## Overview

Chad Solutions is a **Next.js 14** application powered by **Google MediaPipe FaceLandmarker** that performs real-time, landmark-based facial geometry analysis directly in the browser. It computes aesthetic metrics derived from anthropometric research, scores them against clinically informed ideal ranges, and delivers a personalized improvement roadmap — all without sending a single byte to a server.

---

## Features

### 🧠 Facial Analysis Engine

- **25+ geometric metrics** computed from 478 MediaPipe face landmarks
- **Euler angle correction** — pitch, yaw, and roll extracted via landmark-based transform to normalize measurements against head pose
- **Profile detection** — automatically distinguishes front-facing, side-profile, and composite scans; side-profile metrics are locked where no valid data exists
- **Composite scoring** — multi-scan aggregation averages metrics across multiple photos for higher accuracy
- **PSL Score** — an aggregated "Physical Status Level" score (0–10) with tiered labels (Subhuman → Godlike), computed from a weighted blend of all metrics

### 📐 Metric Suite

| Category | Metrics |
|---|---|
| **Facial Proportions** | Face Width-to-Height Ratio, Facial Thirds Balance, Midface Ratio, Forehead Height Ratio |
| **Eye Region** | Canthal Tilt, Eye Separation Ratio, Palpebral Fissure Length, Eye-to-Mouth Angle, Interpupillary Distance Ratio |
| **Lower Face** | Chin-to-Philtrum Ratio, Lower Third Ratio, Lip Ratio, Mouth-to-Nose Width Ratio |
| **Jaw & Cheekbones** | Gonial Angle, Bigonial Width Ratio, Cheekbone Prominence |
| **Nose** | Nose Width Ratio |
| **Asymmetry** | Bilateral facial asymmetry index |
| **Hairline** | Hairline Recession Index |
| **Skin** | Skin quality analysis via pixel-level image processing (luminance, variance, tone uniformity) |

### 🔬 Advanced Profile Metrics (Side View)

- **Orbital Rim Protrusion** — forward projection of the brow ridge
- **Maxillary Protrusion** — mid-face forward projection (cheekbone/maxilla)
- **Brow Ridge Protrusion** — supraorbital ridge prominence
- **Infraorbital Rim Position** — eye support structure assessment
- **Chin Projection** — mandibular forward projection
- **Double Chin Risk** — soft-tissue sag detection
- **Facial Tension** — blendshape-based structural analysis
- **Camera Angle & Lens Distortion** — automatically detected and flagged to prevent skewed readings

### 🎨 Results — Three-Tab Interface

**Analysis Tab**
- Every metric displayed as an expandable card with current value, ideal range, and a color-coded rating (Exceptional / Above Average / Average / Below Average / Poor)
- Tap any card to expand a full explanation and personalized recommendation

**Roadmap Tab**
- A prioritized, PSL-boosting action plan generated from the metric results
- Each action item is scored by impact and categorized (Grooming, Training, Style, Medical, Skincare)

**Haircut Tab**
- Interactive hair profile builder (face shape, hair density, texture, growth pattern, preferred length, styling time)
- AI-driven haircut recommendation engine with 40+ cut archetypes
- Recommendations include name, rationale, styling tips, and complementary beard styles
- Automatically hidden when a side-profile scan is active (insufficient landmark data)

### 📸 Input Methods

| Mode | Description |
|---|---|
| **Webcam** | Live camera capture with real-time landmark overlay on canvas |
| **Upload** | Static image upload; supports JPEG, PNG, and WEBP |
| **Roll** | Upload and batch-process multiple images for composite scoring |

### 📚 Guides / Benchmarks

A `/guides` page with curated educational content on facial aesthetics benchmarks — ideal ranges, what each metric means in practice, and how scores map to real-world outcomes.

### 🔒 Privacy First

All processing happens **entirely in the browser** using WebAssembly. No images, landmarks, or scores are transmitted to any server.

---

## Architecture

```
src/
├── app/
│   ├── analyze/          # Main analyzer page
│   ├── guides/           # Benchmark guides
│   └── api/              # (reserved for future use)
├── components/
│   ├── FaceAnalyzer.tsx  # Orchestrator: MediaPipe init, scan state, tab routing
│   ├── AnalysisTab.tsx   # Metric cards with expand/collapse and ratings
│   ├── RoadmapTab.tsx    # PSL improvement roadmap
│   ├── HaircutTab.tsx    # Hair profile builder + recommendation engine
│   └── MetricCard.tsx    # Reusable metric card primitive
└── utils/
    ├── geometry.ts            # All 25+ landmark-based metric calculations + PSL scoring
    ├── advanced-metrics.ts    # Side-profile / depth metrics
    ├── image-processing.ts    # Skin quality analysis (canvas pixel processing)
    ├── ratings.ts             # getRating() / getIdealRange() shared utility
    ├── explanations.ts        # Per-metric educational descriptions
    ├── recommendations.ts     # Per-metric improvement recommendations
    └── haircut-recommendations.ts  # Full haircut recommendation engine (~40+ cuts)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Vision | Google MediaPipe FaceLandmarker (WASM) |
| Webcam | react-webcam |
| Runtime | Browser-only (no server-side processing) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

```bash
# Type-check (no emit)
npx tsc --noEmit
```

---

## Key Design Decisions

- **No backend required** — MediaPipe runs via WASM in the browser. Zero infrastructure cost.
- **Modular tab architecture** — `AnalysisTab`, `RoadmapTab`, and `HaircutTab` are fully self-contained; `FaceAnalyzer` is a pure orchestrator.
- **Composite scanning** — users can upload multiple photos to reduce noise; metrics are averaged per scan and aggregated into a final composite result.
- **Euler-corrected metrics** — all measurements are adjusted for head pose (pitch/yaw/roll) using extracted Euler angles to prevent skewed results from off-angle photos.
- **Ideal-range ratings** — every metric has a researched ideal range; deviation from that range drives the color-coded rating and roadmap priority.
