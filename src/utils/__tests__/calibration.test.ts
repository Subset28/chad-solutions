import { sigmoidMap } from '../scoring';

describe('PSL Engine Calibration - Looksmax Guide Benchmarks', () => {
    
    it('maps Average (50th percentile) to PSL 4.0', () => {
        // Z=0 is the average
        expect(sigmoidMap(0)).toBe(4.0);
    });

    it('maps Attractive (84th percentile) to PSL 5.2', () => {
        // Z=1 is 1 standard deviation above mean (84.13%)
        // Guide target: PSL 5.0
        // Our k=0.6 target: 5.2
        expect(sigmoidMap(1)).toBe(5.2);
    });

    it('maps Model Tier (97th percentile) to PSL 6.1', () => {
        // Z=2 is 2 standard deviations above mean (97.72%)
        // Guide target: PSL 6.0
        // Our k=0.6 target: 6.1
        expect(sigmoidMap(2)).toBe(6.1);
    });

    it('maps Elite/Chad (99.8th percentile) to PSL 6.9', () => {
        // Z=3 is 3 standard deviations above mean (99.87%)
        // Guide target: PSL 7.0
        // Our k=0.6 target: 6.9
        expect(sigmoidMap(3)).toBe(6.9);
    });

    it('maps Below Average to PSL 2.8', () => {
        // Z=-1 is 1 standard deviation below mean
        expect(sigmoidMap(-1)).toBe(2.8);
    });

    it('demonstrates that PSL 8.0 (Human Perfection) is near-impossible', () => {
        // Even at Z=5 (1 in 3.5 million), we don't hit 8.0
        expect(sigmoidMap(5)).toBeLessThan(8.0);
        expect(sigmoidMap(5)).toBe(7.6);
    });
});
