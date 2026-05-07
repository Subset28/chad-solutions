import { NormalizedLandmark } from "@mediapipe/tasks-vision";

export interface BilateralResult {
    average: number;
    delta: number;
    left: number;
    right: number;
}

export interface DetailedMetric {
    value: number;
    unit: string;
    percentile?: number;
    confidence: number;
    idealRange: [number, number];
    citation?: string;
    interpretation: string;
}

export interface MetricReport {
    periorbital: {
        canthalTilt: BilateralResult;
        uee: BilateralResult;
        esr: number;
        ipd: number;
        orbitalRimProtrusion: BilateralResult;
        browRidgeProtrusion: number;
        infraorbitalRimPosition: number;
        confidence: number;
    };
    midface: {
        fWHR: number;
        midfaceRatio: number;
        philtrumLength: number;
        mouthToNoseWidthRatio: number;
        noseWidthRatio: number;
        maxillaryProtrusion: number;
        foreheadHeightRatio: number;
        confidence: number;
    };
    jawline: {
        gonialAngle: BilateralResult;
        chinProjection: number;
        bigonialRatio: number;
        doubleChinRisk: number;
        confidence: number;
    };
    symmetry: {
        midlineDeviation: number;
        overallSymmetry: number;
        confidence: number;
    };
    skin: {
        tension: number;
        eyebrowContrast: number;
        dominantExpressions: string[];
        confidence: number;
    };
    vitality: {
        vitalityScore: number;
        biologicalAgeDelta: number;
        eyeAperture: number;
        collagenIndex: number;
    };
    community: {
        phenotype: string;
        nwScale: string;
        potentialPSLBoost: number;
    };
}

export interface PSLResult {
    overall: number;
    confidence: number;
    tier: string;
    percentile: number;
    breakdown: Record<string, { zScore: number, contribution: number }>;
}
