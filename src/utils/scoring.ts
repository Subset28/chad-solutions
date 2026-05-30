import { MetricReport, PSLResult } from "@/types/metrics";
import { predictBenchmarkPsl, REFERENCE_NORMS } from "./psl-calibration";

export interface ScoreContext {
    gender: 'male' | 'female';
    ageRange?: string;
    captureBiasPenalty?: number;
    posePenalty?: number;
}

export interface MetricNorm {
    mean: number;
    stdDev: number;
    weight: number; // Correlation coefficient with attractiveness
    idealDirection: 1 | -1 | 0; // 1: higher is better, -1: lower is better, 0: center is better
}

/**
 * Population Norms & Attractiveness Weights
 * Sources: Weston et al. 2007, clinical anthropometry datasets, peer-reviewed attractiveness studies.
 */
const POPULATION_NORMS: Record<string, Record<'male' | 'female', MetricNorm>> = {
    canthalTilt: {
        male: { mean: 5.0, stdDev: 1.0, weight: 1.5, idealDirection: 1 },
        female: { mean: 7.0, stdDev: 1.2, weight: 1.5, idealDirection: 1 }
    },
    fWHR: {
        male: { mean: 1.80, stdDev: 0.10, weight: 1.8, idealDirection: 1 },
        female: { mean: 1.70, stdDev: 0.12, weight: 1.2, idealDirection: 1 }
    },
    esr: {
        male: { mean: 0.46, stdDev: 0.01, weight: 1.0, idealDirection: 0 },
        female: { mean: 0.46, stdDev: 0.01, weight: 1.0, idealDirection: 0 }
    },
    uee: {
        male: { mean: 0.22, stdDev: 0.06, weight: 1.4, idealDirection: -1 },
        female: { mean: 0.28, stdDev: 0.08, weight: 1.4, idealDirection: -1 }
    },
    gonialAngle: {
        male: { mean: 122, stdDev: 5, weight: 1.3, idealDirection: 0 }, // Ideal 115-130
        female: { mean: 122, stdDev: 6, weight: 1.1, idealDirection: 0 }
    },
    symmetry: {
        male: { mean: 92, stdDev: 4, weight: 2.0, idealDirection: 1 },
        female: { mean: 92, stdDev: 4, weight: 2.0, idealDirection: 1 }
    },
    midfaceRatio: {
        male: { mean: 1.05, stdDev: 0.05, weight: 1.3, idealDirection: 0 },
        female: { mean: 1.00, stdDev: 0.06, weight: 1.3, idealDirection: 0 }
    },
    lowerThirdRatio: {
        male: { mean: 0.64, stdDev: 0.03, weight: 0.8, idealDirection: 0 },
        female: { mean: 0.62, stdDev: 0.03, weight: 0.8, idealDirection: 0 }
    },
    facialThirdsRatio: {
        male: { mean: 98, stdDev: 2.0, weight: 0.5, idealDirection: 0 },
        female: { mean: 98, stdDev: 2.0, weight: 0.5, idealDirection: 0 }
    },
    facialFifthsRatio: {
        male: { mean: 1.0, stdDev: 0.05, weight: 0.4, idealDirection: 0 },
        female: { mean: 1.0, stdDev: 0.05, weight: 0.4, idealDirection: 0 }
    },
    pfl: {
        male: { mean: 3.25, stdDev: 0.15, weight: 0.6, idealDirection: 0 },
        female: { mean: 3.05, stdDev: 0.15, weight: 0.6, idealDirection: 0 }
    },
    eyeToMouthAngle: {
        male: { mean: 48, stdDev: 1.5, weight: 0.7, idealDirection: 0 },
        female: { mean: 49, stdDev: 1.5, weight: 0.7, idealDirection: 0 }
    },
    lipRatio: {
        male: { mean: 1.62, stdDev: 0.18, weight: 0.4, idealDirection: 0 },
        female: { mean: 1.62, stdDev: 0.18, weight: 0.4, idealDirection: 0 }
    },
    noseWidthRatio: {
        male: { mean: 0.20, stdDev: 0.02, weight: 1.0, idealDirection: 0 },
        female: { mean: 0.22, stdDev: 0.02, weight: 1.0, idealDirection: 0 }
    },
    bigonialRatio: {
        male: { mean: 0.74, stdDev: 0.03, weight: 1.2, idealDirection: 0 },
        female: { mean: 0.76, stdDev: 0.03, weight: 1.2, idealDirection: 0 }
    },
    philtrumLength: {
        male: { mean: 13.0, stdDev: 1.0, weight: 0.8, idealDirection: 0 },
        female: { mean: 12.0, stdDev: 1.0, weight: 0.8, idealDirection: 0 }
    },
    mouthToNoseWidthRatio: {
        male: { mean: 1.56, stdDev: 0.06, weight: 0.9, idealDirection: 0 },
        female: { mean: 1.52, stdDev: 0.06, weight: 0.9, idealDirection: 0 }
    },
    chinProjection: {
        male: { mean: 0.01, stdDev: 0.01, weight: 1.0, idealDirection: 1 },
        female: { mean: 0.008, stdDev: 0.01, weight: 1.0, idealDirection: 1 }
    },
    maxillaryProtrusion: {
        male: { mean: 0.015, stdDev: 0.01, weight: 1.0, idealDirection: 1 },
        female: { mean: 0.012, stdDev: 0.01, weight: 1.0, idealDirection: 1 }
    },
    orbitalRimProtrusion: {
        male: { mean: 0.005, stdDev: 0.01, weight: 0.8, idealDirection: 1 },
        female: { mean: 0.004, stdDev: 0.01, weight: 0.8, idealDirection: 1 }
    },
    browRidgeProtrusion: {
        male: { mean: 0.008, stdDev: 0.006, weight: 0.7, idealDirection: 1 },
        female: { mean: 0.005, stdDev: 0.006, weight: 0.7, idealDirection: 1 }
    },
    infraorbitalRimPosition: {
        male: { mean: 0.005, stdDev: 0.008, weight: 0.7, idealDirection: 1 },
        female: { mean: 0.004, stdDev: 0.008, weight: 0.7, idealDirection: 1 }
    },
    foreheadHeightRatio: {
        male: { mean: 0.325, stdDev: 0.02, weight: 0.6, idealDirection: 0 },
        female: { mean: 0.33, stdDev: 0.02, weight: 0.6, idealDirection: 0 }
    },
    doubleChinRisk: {
        male: { mean: 0.005, stdDev: 0.01, weight: 0.9, idealDirection: -1 },
        female: { mean: 0.006, stdDev: 0.01, weight: 0.9, idealDirection: -1 }
    },
    cervicomentalAngle: {
        male: { mean: 112, stdDev: 6, weight: 0.7, idealDirection: 0 },
        female: { mean: 115, stdDev: 6, weight: 0.7, idealDirection: 0 }
    }
};

const AUXILIARY_NORMS: Record<string, Record<'male' | 'female', MetricNorm>> = {
    vitalityScore: {
        male: { mean: 28, stdDev: 10, weight: 0.3, idealDirection: 1 },
        female: { mean: 28, stdDev: 10, weight: 0.3, idealDirection: 1 }
    },
    collagenIndex: {
        male: { mean: 46, stdDev: 27, weight: 0.3, idealDirection: 1 },
        female: { mean: 46, stdDev: 27, weight: 0.3, idealDirection: 1 }
    },
    eyeAperture: {
        male: { mean: 42, stdDev: 14, weight: 0.25, idealDirection: -1 },
        female: { mean: 42, stdDev: 14, weight: 0.25, idealDirection: -1 }
    },
    biologicalAgeDelta: {
        male: { mean: 2.2, stdDev: 1.0, weight: 0.25, idealDirection: -1 },
        female: { mean: 2.2, stdDev: 1.0, weight: 0.25, idealDirection: -1 }
    },
    eyebrowContrast: {
        male: { mean: 43, stdDev: 28, weight: 0.2, idealDirection: 1 },
        female: { mean: 43, stdDev: 28, weight: 0.2, idealDirection: 1 }
    }
};

function mergeNorm(
    referenceKey: string,
    fallback: MetricNorm
): MetricNorm {
    const ref = REFERENCE_NORMS[referenceKey];
    return {
        mean: ref?.mean ?? fallback.mean,
        stdDev: ref?.stdDev ?? fallback.stdDev,
        weight: fallback.weight,
        idealDirection: fallback.idealDirection,
    };
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

/**
 * Maps a weighted Z-score to the 0-8 PSL scale using a centered sigmoid.
 * Centered at Z=0 -> PSL 4.0 (50th percentile) as per Looksmax standard.
 */
export function sigmoidMap(zScore: number): number {
    // Sigmoid: L / (1 + exp(-k(z - x0)))
    // L=8 (Max PSL), k=0.6 (Calibrated for Z-score standard deviations), x0=0 (Centered at average)
    const k = 0.6; 
    const L = 8;
    const mapped = L / (1 + Math.exp(-k * zScore));
    
    // Round to 1 decimal place
    return Math.round(mapped * 10) / 10;
}

// Replaced by central types in @/types/metrics

export function calculatePSLScore(
    metrics: MetricReport,
    context: ScoreContext,
    landmarkConfidence: number
): PSLResult {
    const calibrated = predictBenchmarkPsl(metrics);
    const dampedScore = 4 + (calibrated.score - 4) * 0.97;
    const captureBiasPenalty = clamp(context.captureBiasPenalty ?? 0, 0, 1.5);
    const posePenalty = clamp(context.posePenalty ?? 0, 0, 1.5);
    const adjustedScore = clamp(dampedScore - captureBiasPenalty - posePenalty, 0, 8);
    const finalScore = Math.round(adjustedScore * 10) / 10;
    const percentile = scoreToPercentile(finalScore);
    const breakdown = Object.entries(calibrated.breakdown).map(
        ([metric, detail]) => `${metric}: ${detail.contribution >= 0 ? '+' : ''}${detail.contribution.toFixed(2)} (z=${detail.zScore.toFixed(2)})`
    );
    if (captureBiasPenalty > 0) {
        breakdown.unshift(`Capture distance correction (-${captureBiasPenalty.toFixed(2)})`);
    }
    if (posePenalty > 0) {
        breakdown.unshift(`Pose correction (-${posePenalty.toFixed(2)})`);
    }

    return {
        overall: finalScore,
        confidence: Math.round(landmarkConfidence * 100),
        tier: getTier(finalScore),
        percentile,
        breakdown
    };
}

export function scoreToPercentile(score: number): number {
    const normalized = 1 / (1 + Math.exp(-1.3 * (score - 4)));
    return Math.max(1, Math.min(99, Math.round(normalized * 100)));
}

/**
 * Standard Error Function (erf) approximation for percentile calculation
 */
function erf(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}

function getTier(score: number): string {
    if (score >= 7.5) return "Elite (Genetic Lottery)";
    if (score >= 7.0) return "Chad (Top 0.1%)";
    if (score >= 6.0) return "Model Tier (Elite)";
    if (score >= 5.5) return "Chadlite";
    if (score >= 5.0) return "High-Tier Attractive";
    if (score >= 4.5) return "Above Average";
    if (score >= 3.5) return "Average (Normie)";
    if (score >= 2.5) return "Below Average";
    return "Developing / Low-tier";
}

/**
 * Aggregates metrics from multiple scans (e.g. Front + Side)
 */
export function calculateAggregatedMetrics(scans: any[]): MetricReport | null {
    if (scans.length === 0) return null;

    // Use the latest scan as the base for the report structure
    const base = JSON.parse(JSON.stringify(scans[scans.length - 1].metrics)) as MetricReport;

    // Simple average for numeric values present in multiple scans
    // In a medical context, we might prefer 'Front' for some and 'Side' for others
    // For now, we'll just take the latest or average if applicable
    return base;
}

