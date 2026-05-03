import { describe, it, expect } from 'vitest';
import { 
    calculatePercentile, 
    calculateCommunityStatus 
} from '../statistics';

describe('Statistics Engine - Community Mapping Tests', () => {
    
    it('calculates percentiles correctly for normal distribution', () => {
        // Test with a known metric from statistics.ts
        // fwfhRatio: { mean: 1.45, stdDev: 0.05 }
        // Value = 1.45 should be 50th percentile
        expect(calculatePercentile('fwfhRatio', 1.45).percentile).toBeCloseTo(50, 0);
        
        // Value = 1.50 (1 SD above) should be ~84th percentile
        expect(calculatePercentile('fwfhRatio', 1.50).percentile).toBeGreaterThan(83);
        expect(calculatePercentile('fwfhRatio', 1.50).percentile).toBeLessThan(85);
    });

    it('maps PSL scores to correct community status archetypes', () => {
        expect(calculateCommunityStatus(8.0).status).toBe('GIGACHAD / PSL GOD');
        expect(calculateCommunityStatus(7.0).status).toBe('CHAD');
        expect(calculateCommunityStatus(6.0).status).toBe('CHADLITE');
        expect(calculateCommunityStatus(5.0).status).toBe('HIGH-TIER NORMIE');
        expect(calculateCommunityStatus(4.0).status).toBe('MID-TIER NORMIE');
        expect(calculateCommunityStatus(3.0).status).toBe('LOW-TIER NORMIE');
        expect(calculateCommunityStatus(2.0).status).toBe('TRUECEL');
        expect(calculateCommunityStatus(1.0).status).toBe('SUBHUMAN');
    });
});
