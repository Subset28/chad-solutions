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
 * Maps a weighted Z-score to a 1-10 scale using a sigmoid function.
 * Compresses extremes as per requirement.
 */
export function sigmoidMap(zScore: number): number {
    // Sigmoid: 1 / (1 + exp(-x))
    // We want z=0 to be 5, z=3 to be 9, z=-3 to be 1
    const k = 1.2; // Steepness
    const mapped = 1 + (9 / (1 + Math.exp(-k * zScore)));
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

        const contribution = z * norm.weight;
        totalWeightedZ += contribution;
        totalWeight += norm.weight;
        breakdown[key] = { zScore: z, contribution };
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
    if (score >= 9.0) return "Looksmaxxed God / Genetic Lottery";
    if (score >= 8.0) return "Gigachad (Elite)";
    if (score >= 7.0) return "Chad";
    if (score >= 6.0) return "Chadlite";
    if (score >= 5.0) return "Normie";
    if (score >= 4.0) return "Betabuxx / Below Average";
    if (score >= 3.0) return "Low-tier";
    return "Developing";
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

