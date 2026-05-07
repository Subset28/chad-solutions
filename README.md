# OmniSight Facial Anthropometry Manifesto v2.0
> **The Definitive Technical Documentation, Mathematical Blueprint, and Developer Handbook for Medical-Grade Facial Analysis.**

---

## 📑 Table of Contents
1. [Introduction & Philosophy](#-1-introduction--philosophy)
2. [Clinical-Grade Technical Architecture](#-2-clinical-grade-technical-architecture)
3. [The Mathematical Formula Bible](#-3-the-mathematical-formula-bible)
4. [Neural Landmark Mapping (Index 478)](#-4-neural-landmark-mapping-index-478)
5. [The Z-Score Statistical Scoring Engine](#-5-the-z-score-statistical-scoring-engine)
6. [Haircut Architecture & Synergy Logic](#-6-haircut-architecture--synergy-logic)
7. [Vitality Index & Environment Mastery](#-7-vitality-index--environment-mastery)
8. [Comprehensive Developer’s Modification Guide](#-8-comprehensive-developers-modification-guide)
9. [User Guide: Achieving Surgical Precision](#-9-user-guide-achieving-surgical-precision)
10. [Future Innovation & V3.0 Roadmap](#-10-future-innovation--v30-roadmap)
11. [Disclaimer & Ethical Boundary](#-11-disclaimer--ethical-boundary)

---

## 🏛️ 1. Introduction & Philosophy

OmniSight (formerly Chad Solutions) is a specialized **Facial Biometric Analysis Engine** built for the Next.js ecosystem. It bridges the gap between clinical maxillofacial research and consumer-level web technology.

Our philosophy is built on three pillars:
1. **Mathematical Objectivity**: We remove the subjective "vibe" and replace it with Z-scores relative to clinical population norms.
2. **Zero-Backend Privacy**: Every pixel of your image is processed locally in your browser's RAM and discarded immediately. No images, landmarks, or scores are ever sent to a server.
3. **Ascension Roadmap**: We don't just provide scores; we provide a structured structural roadmap for improvement across lifestyle, non-surgical, and surgical interventions.

---

## 💻 2. Clinical-Grade Technical Architecture

### The Tech Stack
- **Framework**: Next.js 14 (App Router) with TypeScript for strict type safety.
- **Styling**: Vanilla CSS for maximum performance and custom glassmorphism effects.
- **Inference Engine**: Google MediaPipe FaceLandmarker (WASM) for real-time 3D coordinate extraction.
- **State Management**: React Context & Hooks for local-first ephemeral state.
- **Storage**: Optional `IndexedDB` (via local state) for persistent trend tracking without cloud exposure.

### The Analysis Pipeline (Under the Hood)
1. **Input Acquisition**: The system captures raw pixel data from the webcam or an uploaded high-resolution file.
2. **Neural Mesh Generation**: MediaPipe identifies 478 landmarks in 3D space (`x`, `y`, `z`).
3. **Audit & Validation**: The **Landmark Audit Layer** (`normalization.ts`) checks confidence scores for critical anchors (jaw corners, chin, canthi). If confidence is < 0.7, the scan is rejected to prevent "hallucinated" measurements.
4. **3-Axis Pose Correction**:
   - **Roll**: Corrected by rotating coordinates around the Z-axis until the eyes are perfectly level.
   - **Yaw/Pitch**: The system extracts the `facialTransformationMatrix` from MediaPipe to mathematically "rotate" the face back to a dead-center neutral position before measuring. This prevents a tilted head from inflating the midface ratio.
5. **Perspective Undistortion**: We apply a focal length correction factor to account for the "fisheye" effect common in front-facing smartphone cameras.

---

## 📐 3. The Mathematical Formula Bible

Every metric in OmniSight is derived from geometric distance or angular calculation between 3D vectors.

### Ocular & Periorbital Suite
- **Canthal Tilt (Degree)**:
  `theta = atan2(-(outer.y - inner.y), outer.x - inner.x) - head_roll`
  *Calculated bilaterally to detect asymmetry.*
- **Eye Separation Ratio (ESR)**:
  `ratio = Distance(Inner_Canthus_L, Inner_Canthus_R) / Bizygomatic_Width`
  *Clinical Ideal: 0.45 - 0.47*
- **Palpebral Fissure Length (PFL)**:
  Measured in normalized units relative to bizygomatic width to ensure scale-invariant results.

### Midface & Proportions
- **fWHR (Facial Width to Height Ratio)**:
  `fWHR = Bizygomatic_Width / Distance(Nasion, Stomion)`
  *High fWHR is strongly correlated with perceived dominance.*
- **Midface Ratio**:
  `ratio = Distance(Pupils) / Distance(Nasion, Stomion)`
  *A more compact midface is associated with higher dimorphic attractiveness.*

### Jawline & Lower Third
- **Gonial Angle**:
  `angle = angle_between_vectors((JawCorner, Ear), (JawCorner, Chin))`
  *Ideal Male: 110-120° | Ideal Female: 120-130°*
- **Chin-to-Philtrum Ratio**:
  `ratio = Distance(Stomion, Menton) / Distance(Subnasale, Stomion)`
  *The "Golden Ratio" of the lower third (ideally 2:1).*

---

## 📍 4. Neural Landmark Mapping (Index 478)

We utilize the standard MediaPipe 478-point mesh. Below are the critical anchors used for all core logic:

| Feature | MediaPipe Index | Clinical Significance |
|---|---|---|
| **Nose Tip (Prunasale)** | 1 | Midline anchor |
| **Chin (Menton)** | 152 | Lower third boundary |
| **Top of Forehead (Trichion)** | 10 | Upper boundary |
| **Nasion** | 168 | Midface/Forehead boundary |
| **Inner Canthus (L/R)** | 133 / 362 | Ocular width anchor |
| **Outer Canthus (L/R)** | 33 / 263 | Tilt anchor |
| **Zygoma (L/R)** | 234 / 454 | Maximum facial width |
| **Gonial Corner (L/R)** | 172 / 397 | Jawline angularity |
| **Subnasale** | 2 | Upper lip/Nose boundary |
| **Stomion** | 13 | Lip contact point |

*Note: For the full mapping, refer to `src/utils/metrics.ts` where these indices are resolved into semantic `Point3D` objects.*

---

## 🏆 5. The Z-Score Statistical Scoring Engine

Unlike other apps that give "random" scores out of 100, OmniSight uses a **Gaussian Distribution Model** (`scoring.ts`).

### The Population Norms
We maintain a `POPULATION_NORMS` constant that contains the **Mean** and **Standard Deviation** for every metric, segregated by gender. These norms are derived from:
- Anthropometric surveys (e.g., Farkas et al.)
- Clinical maxillofacial datasets.
- Aesthetic "Perfect" averages.

### The Calculation Pipeline
1. **Raw Measurement**: e.g., Gonial Angle = 115°.
2. **Z-Score Mapping**: `z = (measurement - mean) / stdev`.
3. **Sigmoid Normalization**: We convert the Z-score into a 0.0 - 10.0 scale using a customized sigmoid function that rewards "Ideal" values and penalizes "Outliers" (deviations from the mean).
4. **Weighted Aggregation**: Metrics are weighted by their impact on perceived attractiveness (e.g., Canthal Tilt has a higher weight than Nose Width Ratio).

---

## ✂️ 6. Haircut Architecture & Synergy Logic

The haircut engine (`haircut-recommendations.ts`) is a multi-factor expert system.

### Face Shape Classification
We use a point-based heuristic to assign one of 6 face shapes:
- **Oval**: Balanced, versatile.
- **Round**: Wide zygoma, soft jaw.
- **Square**: Geometric jaw, wide forehead.
- **Heart**: Wide forehead, narrow chin.
- **Oblong**: Significant vertical height.
- **Diamond**: Narrow top/bottom, wide cheekbones.

### The Synergy Algorithm
Every haircut has a synergy bonus/penalty for specific face shapes.
- **Vertical Correction**: Oblong faces get haircuts that add horizontal width.
- **Angular Softening**: Square faces get haircuts that use organic texture to break hard lines.
- **Length Elongation**: Round faces get "High-Top" styles to add vertical dimension.

### Data Sources
Our recommendations are sourced from:
- **Facial Balancing Principles**: Clinical standards for visual harmony.
- **Stylist Archetypes**: Professional grooming standards.
- **Community Consensus**: Aggregated data from aesthetic forums (Looksmax.org, etc.) regarding the "Halo Effect."

---

## ⚡ 7. Vitality Index & Environment Mastery

A new addition to V2.0, the **Vitality Tab** (`VitalityTab.tsx`) measures health-correlated aesthetics.

### Bio-Marker Scan
- **Ocular Clarity**: Analyzes the ratio of eyelid openness to detect fatigue.
- **Collagen Index**: A derived metric calculating midface support (nasolabial depth).
- **Biological Age Delta**: Compares structural support against age-based norms.

### Environment Mastery (Lighting)
We analyze your facial structure (specifically **Infraorbital Rim Position**) to determine your sensitivity to overhead lighting.
- **Low-Rim Vulnerability**: If you have recessed rims, the app warns you against "negative lighting" that creates fake under-eye circles.
- **Optimal Angle**: Calculates the best camera angle (e.g., 5° upward) to minimize structural flaws and maximize bone prominence.

---

## 🛠️ 8. Comprehensive Developer’s Modification Guide

If you want to customize the engine, here is where the code lives:

### Core Logic & Math
- `src/utils/metrics.ts`: **The Brain**. Contains all geometric formulas and the 478-index mapping.
- `src/utils/scoring.ts`: **The Judge**. Contains population norms and the Z-score Sigmoid logic.
- `src/utils/normalization.ts`: **The Auditor**. Handles 3-axis rotation and perspective correction.
- `src/utils/lighting.ts`: **The DP**. Handles shadow projection and lighting vulnerability analysis.

### Recommendation Databases
- `src/utils/recommendations.ts`: Tips for lifestyle, non-surgical, and surgical fixes.
- `src/utils/haircut-recommendations.ts`: The entire hairstyle database and face-shape synergy map.
- `src/utils/plan-generator.ts`: Logic that builds the Phase 1/2/3 Roadmap.

### UI Components
- `src/components/FaceAnalyzer.tsx`: The primary orchestrator of the entire pipeline.
- `src/components/AnalysisTab.tsx`: Renders the detailed metric cards and bilateral deltas.
- `src/components/RadarChart.tsx`: Custom SVG implementation for the biometric radar.

---

## 📸 9. User Guide: Achieving Surgical Precision

To get a medical-grade reading, you must follow these protocols:

1. **The 3-Foot Rule**: Smartphone cameras are wide-angle. If you hold it close, your nose will look 20% larger. **Stand 3-4 feet away and use 2x zoom.**
2. **The Horizon Lock**: Keep your eyes level with the camera lens. Do not tilt your chin up or down unless specifically testing "Protrusion" metrics.
3. **Lighting Homogeneity**: Use flat, frontal lighting (facing a window). Avoid overhead lights or side-shadows which create "asymmetry noise."
4. **The Deadpan**: Maintain a neutral, relaxed face. Tension in the masseter or brow can skew skeletal readings.

---

## 🚀 10. Future Innovation & V3.0 Roadmap

- **Surgical Morphing**: Real-time canvas warping to simulate jaw advancement or rhinoplasty.
- **Genetic Cluster Prediction**: Matching your structure to ethnic phenotypic averages.
- **Phenotype Search**: Find celebrities with your exact skeletal structure to see their styling choices.

---

## ⚖️ 11. Disclaimer & Ethical Boundary

OmniSight is for **Objective Biometric Data Acquisition**. It is not a clinical diagnostic tool.
- **Math doesn't lie**, but it also doesn't define your value.
- Consult with board-certified professionals before pursuing surgical interventions.
- This software is a mirror of geometry, not a judge of worth.

---
**Build the best version of yourself.**
*(c) 2024 OmniSight Engineering Team | Precision Through Geometry*
