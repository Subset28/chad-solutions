import { MetricScores } from './geometry';
import { metricRecommendations } from './recommendations';
import { getRating } from './ratings';

export interface AscensionPhase {
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

export interface AscensionPlan {
    currentPSL: number;
    targetPSL: number;
    targetTier: string;
    gap: number;
    phases: AscensionPhase[];
    totalPotentialBoost: number;
}

export function getTierName(score: number): string {
    if (score >= 7.5) return "GIGACHAD / PSL GOD";
    if (score >= 6.5) return "CHAD";
    if (score >= 5.5) return "CHADLITE";
    if (score >= 4.5) return "HIGH-TIER NORMIE";
    if (score >= 3.5) return "MID-TIER NORMIE";
    if (score >= 2.5) return "LOW-TIER NORMIE";
    if (score >= 1.5) return "TRUECEL";
    return "SUBHUMAN";
}

// Estimated PSL boost for moving a metric from 'Bad/Average' to 'Perfect'
const PSL_IMPACT_WEIGHTS: Record<string, number> = {
    canthalTilt: 0.5,
    fwfhRatio: 0.4,
    midfaceRatio: 0.5,
    gonialAngle: 0.4,
    chinToPhiltrumRatio: 0.4,
    mouthToNoseWidthRatio: 0.2,
    bigonialWidthRatio: 0.3,
    lowerThirdRatio: 0.3,
    palpebralFissureLength: 0.3,
    facialAsymmetry: 0.4,
    cheekboneProminence: 0.4,
    hairlineRecession: 0.8,
    skinQuality: 0.3,
    orbitalRimProtrusion: 0.4,
    maxillaryProtrusion: 0.5,
    browRidgeProtrusion: 0.3,
    infraorbitalRimPosition: 0.3,
    chinProjection: 0.5,
    doubleChinRisk: 0.4,
    upperEyelidExposure: 0.6,
    philtrumLength: 0.5,
};

export function generateAscensionPlan(
    metrics: MetricScores,
    currentPSL: number,
    targetPSL: number,
    gender: 'male' | 'female'
): AscensionPlan {
    const gap = Math.max(0, targetPSL - currentPSL);
    
    const phases: AscensionPhase[] = [
        { title: 'Phase 1: Surface (Lifestyle)', description: 'Immediate, low-cost foundations focusing on skin, grooming, and posture.', items: [] },
        { title: 'Phase 2: Depth (Non-Surgical)', description: 'Injectables and orthodontic refinements to bridge the gap.', items: [] },
        { title: 'Phase 3: Structure (Surgical)', description: 'Bone-level interventions for permanent skeletal ascension.', items: [] }
    ];

    let accruedBoost = 0;
    const sortedMetrics = Object.entries(PSL_IMPACT_WEIGHTS)
        .sort((a, b) => b[1] - a[1]); // Focus on high impact first

    for (const [key, weight] of sortedMetrics) {
        const metricKey = key as keyof MetricScores;
        const val = metrics[metricKey];
        if (val === undefined || typeof val !== 'number') continue;

        const rating = getRating(metricKey, val, gender);
        const isIdeal = rating.color.includes('green');

        if (!isIdeal) {
            const recs = metricRecommendations[key];
            if (!recs) continue;

            const label = key.replace(/([A-Z])/g, ' $1').trim();

            // Add Lifestyle to Phase 1
            if (recs.lifestyle.length > 0) {
                phases[0].items.push({
                    metric: key,
                    label,
                    recommendation: recs.lifestyle[0],
                    impact: weight * 0.2, // Lifestyle contributes partially
                    category: 'lifestyle'
                });
                accruedBoost += weight * 0.2;
            }

            // If still below gap, add Non-Surgical to Phase 2
            if (accruedBoost < gap && recs.nonSurgical.length > 0) {
                phases[1].items.push({
                    metric: key,
                    label,
                    recommendation: recs.nonSurgical[0],
                    impact: weight * 0.4,
                    category: 'nonSurgical'
                });
                accruedBoost += weight * 0.4;
            }

            // If still below gap, add Surgical to Phase 3
            if (accruedBoost < gap && recs.surgical.length > 0) {
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

        if (accruedBoost >= gap && gap > 0) {
            // We've found enough interventions to reach the target
            // But we keep going to provide a full roadmap if the user wants to exceed the target
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
