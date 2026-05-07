import { describe, it, expect } from 'vitest';
import { 
    distance, 
    calculatePSLScore, 
    MetricScores 
} from '../geometry';

describe('Geometry Engine - Objectivity Tests', () => {
    
    it('calculates 3D Euclidean distance correctly', () => {
        const p1 = { x: 0, y: 0, z: 0, visibility: 1 };
        const p2 = { x: 3, y: 4, z: 0, visibility: 1 };
        expect(distance(p1 as any, p2 as any)).toBe(5);
        
        const p3 = { x: 0, y: 0, z: 0, visibility: 1 };
        const p4 = { x: 1, y: 1, z: 1, visibility: 1 };
        expect(distance(p3 as any, p4 as any)).toBeCloseTo(Math.sqrt(3));
    });

    it('calculates PSL score correctly for balanced metrics', () => {
        const mockMetrics: Partial<MetricScores> = {
            midfaceRatio: 1.0,
            gonialAngle: 122,
            lipRatio: 1.6,
            canthalTilt: 5,
            fWHR: 1.9,
            mouthToNoseWidthRatio: 1.5,
            esr: 0.46,
            eyeToMouthAngle: 48,
            bigonialRatio: 1.15,
            overallSymmetry: 98,
            ipd: 0.46,
            noseWidthRatio: 0.28,
            cheekboneProminence: 0.45,
            chinToPhiltrumRatio: 2.5,
            lowerThirdRatio: 0.64,
            pfl: 3.2,
            facialThirdsRatio: 98,
            foreheadHeightRatio: 0.32,
            hairlineRecession: 100,
            uee: 0.1,
            philtrumLength: 0.07,
            facialTension: 0,
            angleDeduction: 0
        };

        const result = calculatePSLScore(mockMetrics as MetricScores, 'male', 'composite');
        
        // High-tier metrics should result in a high PSL score
        expect(result.score).toBeGreaterThan(6.0);
        expect(result.tier).toContain('Chad');
    });

    it('penalizes negative canthal tilt as a falio', () => {
        const baseMetrics: Partial<MetricScores> = {
            midfaceRatio: 1.0,
            gonialAngle: 122,
            lipRatio: 1.6,
            canthalTilt: -5, // NEGATIVE TILT
            fWHR: 1.9,
            mouthToNoseWidthRatio: 1.5,
            esr: 0.46,
            eyeToMouthAngle: 48,
            bigonialRatio: 1.15,
            overallSymmetry: 98,
            ipd: 0.46,
            noseWidthRatio: 0.28,
            cheekboneProminence: 0.45,
            chinToPhiltrumRatio: 2.5,
            lowerThirdRatio: 0.64,
            pfl: 3.2,
            facialThirdsRatio: 98,
            foreheadHeightRatio: 0.32,
            hairlineRecession: 100,
            uee: 0.1,
            philtrumLength: 0.07,
            facialTension: 0,
            angleDeduction: 0
        };

        const result = calculatePSLScore(baseMetrics as MetricScores, 'male', 'composite');
        
        // Negative canthal tilt should pull the score down significantly
        expect(result.breakdown).toContain('Negative Canthal Tilt (-0.8)');
    });
});
