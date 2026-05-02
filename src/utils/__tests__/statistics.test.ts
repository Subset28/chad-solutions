import { describe, it, expect } from 'vitest';
import { 
    calculatePercentile, 
    calculateCommunityStatus 
} from '../statistics';

describe('Statistics Engine - Community Mapping Tests', () => {
    
    it('calculates percentiles correctly for normal distribution', () => {
        // Mean = 50, StdDev = 10
        // Value = 50 should be 50th percentile
        expect(calculatePercentile(50, 50, 10)).toBeCloseTo(50, 0);
        
        // Value = 60 (1 SD above) should be ~84th percentile
        expect(calculatePercentile(60, 50, 10)).toBeGreaterThan(83);
        expect(calculatePercentile(60, 50, 10)).toBeLessThan(85);
        
        // Value = 40 (1 SD below) should be ~16th percentile
        expect(calculatePercentile(40, 50, 10)).toBeGreaterThan(15);
        expect(calculatePercentile(40, 50, 10)).toBeLessThan(17);
    });

    it('maps PSL scores to correct community status archetypes', () => {
        expect(calculateCommunityStatus(8.0)).toBe('GIGACHAD / PSL GOD');
        expect(calculateCommunityStatus(7.0)).toBe('CHAD');
        expect(calculateCommunityStatus(6.0)).toBe('CHADLITE');
        expect(calculateCommunityStatus(5.0)).toBe('HIGH-TIER NORMIE');
        expect(calculateCommunityStatus(4.0)).toBe('MID-TIER NORMIE');
        expect(calculateCommunityStatus(3.0)).toBe('LOW-TIER NORMIE');
        expect(calculateCommunityStatus(2.0)).toBe('TRUECEL');
        expect(calculateCommunityStatus(1.0)).toBe('SUBHUMAN');
    });
});
