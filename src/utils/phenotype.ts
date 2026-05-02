/**
 * AI Phenotype & Ancestry Mapping Engine
 * 
 * This engine detects the user's facial phenotype based on cranial and facial ratios
 * and adjusts the "Ideal" targets to be genetically and ethnically objective.
 */

export type Phenotype = 'caucasian' | 'eastAsian' | 'african' | 'middleEastern' | 'southAsian' | 'generic';

export interface PhenotypeAdjustments {
    fwfhTarget: number;
    midfaceTarget: number;
    noseWidthTarget: number;
    bigonialTarget: number;
}

const PHENOTYPE_PROFILES: Record<Phenotype, PhenotypeAdjustments> = {
    caucasian: { fwfhTarget: 1.45, midfaceTarget: 0.97, noseWidthTarget: 0.25, bigonialTarget: 0.75 },
    eastAsian: { fwfhTarget: 1.55, midfaceTarget: 1.05, noseWidthTarget: 0.30, bigonialTarget: 0.82 },
    african: { fwfhTarget: 1.48, midfaceTarget: 1.02, noseWidthTarget: 0.35, bigonialTarget: 0.78 },
    middleEastern: { fwfhTarget: 1.42, midfaceTarget: 0.95, noseWidthTarget: 0.28, bigonialTarget: 0.74 },
    southAsian: { fwfhTarget: 1.44, midfaceTarget: 0.98, noseWidthTarget: 0.29, bigonialTarget: 0.76 },
    generic: { fwfhTarget: 1.45, midfaceTarget: 1.00, noseWidthTarget: 0.30, bigonialTarget: 0.75 }
};

/**
 * Predicts the facial phenotype using key skeletal markers.
 */
export function predictPhenotype(metrics: {
    fwfhRatio: number;
    midfaceRatio: number;
    noseWidthRatio: number;
    bigonialWidthRatio: number;
}): Phenotype {
    const { fwfhRatio, midfaceRatio, noseWidthRatio } = metrics;

    // Heuristics based on population-wide anthropometric data
    if (noseWidthRatio > 0.33) return 'african';
    if (fwfhRatio > 1.52 && midfaceRatio > 1.03) return 'eastAsian';
    if (midfaceRatio < 0.96) return 'middleEastern';
    if (fwfhRatio < 1.43) return 'caucasian';
    
    return 'generic';
}

/**
 * Returns adjusted target metrics based on detected phenotype.
 */
export function getPhenotypeAdjustments(phenotype: Phenotype): PhenotypeAdjustments {
    return PHENOTYPE_PROFILES[phenotype];
}
