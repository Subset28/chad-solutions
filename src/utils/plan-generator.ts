import { MetricReport, flattenMetrics } from './metrics';
import { metricRecommendations } from './recommendations';
import { getRating } from './ratings';

export interface LooksmaxPhase {
    title: string;
    description: string;
    items: {
        metric: string;
        label: string;
        recommendation: string;
        impact: number;
        category: 'lifestyle' | 'nonSurgical' | 'surgical';
    }[];
}

export interface LooksmaxPlan {
    currentPSL: number;
    targetPSL: number;
    targetTier: string;
    gap: number;
    phases: LooksmaxPhase[];
    totalPotentialBoost: number;
}

export function getTierName(score: number): string {
    if (score >= 9.0) return "Looksmaxxed God / Genetic Lottery";
    if (score >= 8.0) return "Gigachad (Elite)";
    if (score >= 7.0) return "Chad";
    if (score >= 6.0) return "Chadlite";
    if (score >= 5.0) return "Normie";
    if (score >= 4.0) return "Betabuxx / Below Average";
    if (score >= 3.0) return "Incel-tier";
    return "Subhuman";
}

const PSL_IMPACT_WEIGHTS: Record<string, number> = {
    canthalTilt: 0.5,
    fWHR: 0.4,
    midfaceRatio: 0.5,
    gonialAngle: 0.4,
    chinToPhiltrumRatio: 0.4,
    bigonialRatio: 0.3,
    lowerThirdRatio: 0.3,
    overallSymmetry: 0.4,
    cheekboneProminence: 0.4,
    orbitalRimProtrusion: 0.4,
    maxillaryProtrusion: 0.5,
    browRidgeProtrusion: 0.3,
    infraorbitalRimPosition: 0.3,
    chinProjection: 0.5,
    doubleChinRisk: 0.4,
    uee: 0.6,
    philtrumLength: 0.5,
    esr: 0.4,
    pfl: 0.5,
    collagenIndex: 0.3,
    eyeAperture: 0.2
};

export function generateLooksmaxPlan(
    metrics: MetricReport,
    currentPSL: number,
    targetPSL: number,
    gender: 'male' | 'female'
): LooksmaxPlan {
    const gap = Math.max(0, targetPSL - currentPSL);
    const flatMetrics = flattenMetrics(metrics);
    
    const phases: LooksmaxPhase[] = [
        { title: 'Phase 1: Softmaxxing (Lifestyle)', description: 'Immediate, low-cost foundations focusing on skin, grooming, and posture.', items: [] },
        { title: 'Phase 2: Surgerymaxxing Lite (Non-Surgical)', description: 'Injectables and orthodontic refinements to bridge the gap.', items: [] },
        { title: 'Phase 3: Hardmaxxing (Surgical)', description: 'Bone-level interventions for permanent skeletal ascension.', items: [] }
    ];

    let accruedBoost = 0;
    const sortedWeights = Object.entries(PSL_IMPACT_WEIGHTS)
        .sort((a, b) => b[1] - a[1]);

    for (const [key, weight] of sortedWeights) {
        const val = flatMetrics[key];
        if (val === undefined || typeof val !== 'number') continue;

        const rating = getRating(key, val, gender);
        const isIdeal = rating.color.includes('green');

        if (!isIdeal) {
            const recs = (metricRecommendations as any)[key];
            if (!recs) continue;

            const label = key.replace(/([A-Z])/g, ' $1').trim();

            if (recs.lifestyle && recs.lifestyle.length > 0) {
                phases[0].items.push({
                    metric: key,
                    label,
                    recommendation: recs.lifestyle[0],
                    impact: weight * 0.2,
                    category: 'lifestyle'
                });
                accruedBoost += weight * 0.2;
            }

            if (accruedBoost < gap && recs.nonSurgical && recs.nonSurgical.length > 0) {
                phases[1].items.push({
                    metric: key,
                    label,
                    recommendation: recs.nonSurgical[0],
                    impact: weight * 0.4,
                    category: 'nonSurgical'
                });
                accruedBoost += weight * 0.4;
            }

            if (accruedBoost < gap && recs.surgical && recs.surgical.length > 0) {
                phases[2].items.push({
                    metric: key,
                    label,
                    recommendation: recs.surgical[0],
                    impact: weight * 0.4,
                    category: 'surgical'
                });
                accruedBoost += weight * 0.4;
            }
        }
    }

    return {
        currentPSL,
        targetPSL,
        targetTier: getTierName(targetPSL),
        gap,
        phases: phases.filter(p => p.items.length > 0),
        totalPotentialBoost: accruedBoost
    };
}
