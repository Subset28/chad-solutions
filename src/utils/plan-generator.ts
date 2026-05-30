import { MetricReport, flattenMetrics } from './metrics';
import { metricRecommendations } from './recommendations';
import { getRating } from './ratings';
import { MetricScores } from './geometry';

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
    if (score >= 9.0) return "Exceptional";
    if (score >= 8.0) return "Very Strong";
    if (score >= 7.0) return "Strong";
    if (score >= 6.0) return "Above Average";
    if (score >= 5.0) return "Average";
    if (score >= 4.0) return "Below Average";
    if (score >= 3.0) return "Needs Work";
    return "Developing";
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

function getNeutralRecommendation(category: 'lifestyle' | 'nonSurgical' | 'surgical', metricKey: string): string {
    const metricLabel = metricKey.replace(/([A-Z])/g, ' $1').trim().toLowerCase();

    if (category === 'lifestyle') {
        return `Start with reversible changes for ${metricLabel}: sleep, hydration, skin care, grooming, and body composition where relevant.`;
    }

    if (category === 'nonSurgical') {
        return `If you want more change than lifestyle can provide for ${metricLabel}, a non-surgical consultation can help you compare temporary or lower-risk options.`;
    }

    return `If ${metricLabel} remains a major concern, a qualified specialist can explain the structural options, risks, and expected limits.`;
}

export function generateLooksmaxPlan(
    metrics: MetricReport,
    currentPSL: number,
    targetPSL: number,
    gender: 'male' | 'female'
): LooksmaxPlan {
    const gap = Math.max(0, targetPSL - currentPSL);
    const flatMetrics = flattenMetrics(metrics);
    
    const phases: LooksmaxPhase[] = [
        { title: 'Phase 1: Lifestyle', description: 'Immediate, low-cost foundations focusing on skin, grooming, and posture.', items: [] },
        { title: 'Phase 2: Non-Surgical', description: 'Injectables and orthodontic refinements that can bridge the gap.', items: [] },
        { title: 'Phase 3: Surgical', description: 'Structural interventions for the largest permanent changes.', items: [] }
    ];

    let accruedBoost = 0;
    const sortedWeights = Object.entries(PSL_IMPACT_WEIGHTS)
        .sort((a, b) => b[1] - a[1]);

    for (const [key, weight] of sortedWeights) {
        const val = flatMetrics[key];
        if (val === undefined || typeof val !== 'number') continue;

        const rating = getRating(key as keyof MetricScores, val, gender);
        const isIdeal = rating.color.includes('green');

        if (!isIdeal) {
            const recs = metricRecommendations[key];
            if (!recs) continue;

            const label = key.replace(/([A-Z])/g, ' $1').trim();

            if (recs.lifestyle && recs.lifestyle.length > 0) {
                phases[0].items.push({
                    metric: key,
                    label,
                    recommendation: getNeutralRecommendation('lifestyle', key),
                    impact: weight * 0.2,
                    category: 'lifestyle'
                });
                accruedBoost += weight * 0.2;
            }

            if (accruedBoost < gap && recs.nonSurgical && recs.nonSurgical.length > 0) {
                phases[1].items.push({
                    metric: key,
                    label,
                    recommendation: getNeutralRecommendation('nonSurgical', key),
                    impact: weight * 0.4,
                    category: 'nonSurgical'
                });
                accruedBoost += weight * 0.4;
            }

            if (accruedBoost < gap && recs.surgical && recs.surgical.length > 0) {
                phases[2].items.push({
                    metric: key,
                    label,
                    recommendation: getNeutralRecommendation('surgical', key),
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
