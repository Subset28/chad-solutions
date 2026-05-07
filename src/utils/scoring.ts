import { MetricReport, BilateralResult, PSLResult } from "@/types/metrics";

export interface ScoreContext {
    gender: 'male' | 'female';
    ageRange?: string;
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
        male: { mean: 4.0, stdDev: 2.5, weight: 1.5, idealDirection: 1 },
        female: { mean: 6.5, stdDev: 3.0, weight: 1.5, idealDirection: 1 }
    },
    fWHR: {
        male: { mean: 1.85, stdDev: 0.15, weight: 1.8, idealDirection: 1 },
        female: { mean: 1.70, stdDev: 0.15, weight: 1.2, idealDirection: 1 }
    },
    esr: {
        male: { mean: 0.45, stdDev: 0.02, weight: 1.0, idealDirection: 0 },
        female: { mean: 0.46, stdDev: 0.02, weight: 1.0, idealDirection: 0 }
    },
    uee: {
        male: { mean: 0.35, stdDev: 0.10, weight: 1.4, idealDirection: -1 },
        female: { mean: 0.30, stdDev: 0.10, weight: 1.4, idealDirection: -1 }
    },
    gonialAngle: {
        male: { mean: 122, stdDev: 8, weight: 1.3, idealDirection: 0 }, // Ideal 110-130
        female: { mean: 125, stdDev: 10, weight: 1.1, idealDirection: 0 }
    },
    symmetry: {
        male: { mean: 90, stdDev: 5, weight: 2.0, idealDirection: 1 },
        female: { mean: 92, stdDev: 5, weight: 2.0, idealDirection: 1 }
    },
    midfaceRatio: {
        male: { mean: 0.30, stdDev: 0.02, weight: 1.3, idealDirection: 0 },
        female: { mean: 0.29, stdDev: 0.02, weight: 1.3, idealDirection: 0 }
    },
    noseWidthRatio: {
        male: { mean: 0.25, stdDev: 0.02, weight: 1.0, idealDirection: 0 },
        female: { mean: 0.23, stdDev: 0.02, weight: 1.0, idealDirection: 0 }
    },
    bigonialRatio: {
        male: { mean: 0.78, stdDev: 0.04, weight: 1.2, idealDirection: 0 },
        female: { mean: 0.75, stdDev: 0.04, weight: 1.2, idealDirection: 0 }
    },
    philtrumLength: {
        male: { mean: 14.0, stdDev: 1.5, weight: 0.8, idealDirection: 0 },
        female: { mean: 12.0, stdDev: 1.2, weight: 0.8, idealDirection: 0 }
    }
};

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
    const norms = POPULATION_NORMS;
    const gender = context.gender;
    let totalWeightedZ = 0;
    let totalWeight = 0;
    const breakdown: Record<string, { zScore: number, contribution: number }> = {};

    const processMetric = (key: string, value: number) => {
        const norm = norms[key]?.[gender];
        if (!norm) return;

        let z = (value - norm.mean) / norm.stdDev;
        
        // Handle ideal direction
        if (norm.idealDirection === -1) z = -z;
        else if (norm.idealDirection === 0) z = -Math.abs(z); // Penalize distance from mean

        // CLAMP: Prevent extreme outliers from flooring the entire score
        const clampedZ = Math.max(-3.5, Math.min(3.5, z));

        const contribution = clampedZ * norm.weight;
        totalWeightedZ += contribution;
        totalWeight += norm.weight;
        breakdown[key] = { zScore: clampedZ, contribution };
    };

    // Map metrics to norms
    // Periorbital
    processMetric('canthalTilt', metrics.periorbital.canthalTilt.average);
    processMetric('esr', metrics.periorbital.esr);
    processMetric('uee', metrics.periorbital.uee.average);
    
    // Midface
    processMetric('fWHR', metrics.midface.fWHR);
    processMetric('midfaceRatio', metrics.midface.midfaceRatio);
    processMetric('noseWidthRatio', metrics.midface.noseWidthRatio);
    processMetric('philtrumLength', metrics.midface.philtrumLength);
    
    // Jawline
    processMetric('gonialAngle', metrics.jawline.gonialAngle.average);
    processMetric('bigonialRatio', metrics.jawline.bigonialRatio);
    
    // Symmetry
    processMetric('symmetry', metrics.symmetry.overallSymmetry);

    const averageZ = totalWeight > 0 ? totalWeightedZ / totalWeight : 0;
    const finalScore = sigmoidMap(averageZ);

    // Percentile calculation from Z-score (Normal Distribution approximation)
    const percentile = Math.round(0.5 * (1 + erf(averageZ / Math.sqrt(2))) * 100);

    return {
        overall: finalScore,
        confidence: Math.round(landmarkConfidence * 100),
        tier: getTier(finalScore),
        percentile,
        breakdown
    };
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

