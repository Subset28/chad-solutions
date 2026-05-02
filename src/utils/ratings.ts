import { MetricScores } from '@/utils/geometry';

export const getRating = (metric: keyof MetricScores, value: number, gender: 'male' | 'female' = 'male'): { text: string, color: string } => {
    if (gender === 'female') {
        const fRatings: Record<string, { text: string, color: string }> = {
            canthalTilt: value >= 5 && value <= 9.5 ? { text: 'perfect feline tilt', color: 'text-green-400' } : value > 2 ? { text: 'good', color: 'text-blue-400' } : value < 0 ? { text: 'negative tilt', color: 'text-red-400' } : { text: 'neutral', color: 'text-yellow-400' },
            fwfhRatio: value >= 1.55 ? { text: 'perfect (heart/oval)', color: 'text-green-400' } : value >= 1.45 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow face', color: 'text-orange-400' },
            midfaceRatio: value >= 0.80 && value <= 1.05 ? { text: 'perfect compact midface', color: 'text-green-400' } : (value >= 0.75 && value <= 1.15) ? { text: 'good', color: 'text-blue-400' } : value < 0.75 ? { text: 'excessively compact', color: 'text-red-400' } : { text: 'long midface', color: 'text-red-400' },
            gonialAngle: value >= 105 && value <= 130 ? { text: 'perfect feminine angle', color: 'text-green-400' } : value >= 100 && value <= 135 ? { text: 'good', color: 'text-blue-400' } : { text: 'square/steep', color: 'text-orange-400' },
            chinToPhiltrumRatio: value >= 2.0 && value <= 2.75 ? { text: 'perfect', color: 'text-green-400' } : value < 1.6 ? { text: 'long philtrum / short chin', color: 'text-red-400' } : value > 3.4 ? { text: 'very long chin', color: 'text-orange-400' } : value < 1.8 ? { text: 'slightly long philtrum', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
            mouthToNoseWidthRatio: value >= 1.45 && value <= 1.6 ? { text: 'perfect', color: 'text-green-400' } : value >= 1.35 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow mouth', color: 'text-orange-400' },
            bigonialWidthRatio: value >= 1.15 && value <= 1.3 ? { text: 'perfect oval jaw', color: 'text-green-400' } : value >= 1.1 ? { text: 'good', color: 'text-blue-400' } : value > 1.35 ? { text: 'very wide jaw', color: 'text-orange-400' } : { text: 'narrow', color: 'text-orange-400' },
            lowerThirdRatio: value >= 0.58 && value <= 0.65 ? { text: 'perfect balance', color: 'text-green-400' } : value >= 0.55 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal lower third', color: 'text-orange-400' },
            palpebralFissureLength: value >= 2.8 && value <= 3.5 ? { text: 'perfect doe eyes', color: 'text-green-400' } : value > 3.5 ? { text: 'long fissures', color: 'text-blue-400' } : { text: 'round eyes', color: 'text-yellow-400' },
            eyeSeparationRatio: value >= 0.45 && value <= 0.47 ? { text: 'perfect', color: 'text-green-400' } : value >= 0.42 && value <= 0.49 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal spacing', color: 'text-yellow-400' },
            eyeToMouthAngle: value >= 47 && value <= 50 ? { text: 'perfect', color: 'text-green-400' } : value < 47 ? { text: 'shallow', color: 'text-yellow-400' } : { text: 'steep', color: 'text-yellow-400' },
            lipRatio: value >= 1.15 && value <= 1.70 ? { text: 'perfect full lips', color: 'text-green-400' } : value >= 1.00 && value <= 2.00 ? { text: 'acceptable', color: 'text-blue-400' } : { text: 'suboptimal lip ratio', color: 'text-orange-400' },
            facialAsymmetry: value >= 93 ? { text: 'perfectly symmetric', color: 'text-green-400' } : value >= 85 ? { text: 'very symmetric', color: 'text-blue-400' } : value >= 80 ? { text: 'acceptable symmetry', color: 'text-yellow-400' } : { text: 'asymmetric', color: 'text-orange-400' },
            ipdRatio: value >= 0.45 && value <= 0.47 ? { text: 'ideal eye spacing', color: 'text-green-400' } : value >= 0.42 && value <= 0.49 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal spacing', color: 'text-yellow-400' },
            facialThirdsRatio: value >= 95 ? { text: 'perfect thirds', color: 'text-green-400' } : value >= 85 ? { text: 'good proportions', color: 'text-blue-400' } : value >= 75 ? { text: 'acceptable', color: 'text-yellow-400' } : { text: 'unbalanced thirds', color: 'text-orange-400' },
            foreheadHeightRatio: value >= 0.30 && value <= 0.35 ? { text: 'ideal forehead', color: 'text-green-400' } : value > 0.38 ? { text: 'fivehead (large)', color: 'text-orange-400' } : value < 0.28 ? { text: 'short forehead', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
            noseWidthRatio: value >= 0.22 && value <= 0.28 ? { text: 'ideal narrow nose', color: 'text-green-400' } : value > 0.32 ? { text: 'wide nose', color: 'text-orange-400' } : value < 0.20 ? { text: 'very narrow', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
            cheekboneProminence: value >= 0.38 && value <= 0.52 ? { text: 'prominent cheekbones', color: 'text-green-400' } : value >= 0.33 ? { text: 'good projection', color: 'text-blue-400' } : { text: 'flat cheekbones', color: 'text-yellow-400' },
            hairlineRecession: value >= 95 ? { text: 'full hairline', color: 'text-green-400' } : value >= 85 ? { text: 'good hairline', color: 'text-blue-400' } : value >= 70 ? { text: 'minor recession', color: 'text-yellow-400' } : value >= 50 ? { text: 'receding hairline', color: 'text-orange-400' } : { text: 'significant hair loss', color: 'text-red-400' },
            orbitalRimProtrusion: value > 0.005 ? { text: 'good eye depth', color: 'text-green-400' } : value > -0.005 ? { text: 'neutral depth', color: 'text-yellow-400' } : { text: 'bulging eyes', color: 'text-red-400' },
            maxillaryProtrusion: value > 0.02 ? { text: 'forward maxilla (ideal)', color: 'text-green-400' } : value > 0.01 ? { text: 'good maxilla', color: 'text-blue-400' } : value > -0.005 ? { text: 'neutral', color: 'text-yellow-400' } : { text: 'retruded maxilla', color: 'text-red-400' },
            browRidgeProtrusion: value <= 0.010 ? { text: 'smooth feminine brow', color: 'text-green-400' } : value > 0.015 ? { text: 'masculine/prominent brow', color: 'text-orange-400' } : { text: 'neutral brow', color: 'text-blue-400' },
            infraorbitalRimPosition: value > 0.01 ? { text: 'forward infraorbital rim', color: 'text-green-400' } : value > -0.005 ? { text: 'neutral', color: 'text-blue-400' } : { text: 'retruded (dark circles)', color: 'text-orange-400' },
            chinProjection: value > 0.015 ? { text: 'strong feminine chin', color: 'text-green-400' } : value > 0.005 ? { text: 'good projection', color: 'text-blue-400' } : value > -0.005 ? { text: 'weak chin', color: 'text-yellow-400' } : { text: 'recessed chin', color: 'text-red-400' },
            doubleChinRisk: value > 0.02 ? { text: 'sharp jawline', color: 'text-green-400' } : value > 0.008 ? { text: 'good definition', color: 'text-blue-400' } : value > 0 ? { text: 'soft jawline', color: 'text-yellow-400' } : { text: 'submental fullness', color: 'text-orange-400' },
            angleDeduction: value === 0 ? { text: 'ideal camera setup', color: 'text-green-400' } : value <= 0.5 ? { text: 'minor tilt', color: 'text-yellow-400' } : { text: 'high distortion check', color: 'text-red-400' },
            facialTension: value < 0.5 ? { text: 'relaxed / neutral', color: 'text-green-400' } : value < 1.2 ? { text: 'minor tension', color: 'text-yellow-400' } : { text: 'high tension detected', color: 'text-orange-400' },
            skinQuality: value > 90 ? { text: 'glass skin', color: 'text-green-400' } : value > 75 ? { text: 'clear skin', color: 'text-blue-400' } : value > 50 ? { text: 'textured', color: 'text-yellow-400' } : { text: 'acne / heavy texture', color: 'text-red-400' },
            hairQualityScore: value >= 85 ? { text: 'elite grooming', color: 'text-green-400' } : value >= 65 ? { text: 'well-groomed', color: 'text-blue-400' } : value >= 40 ? { text: 'average grooming', color: 'text-yellow-400' } : { text: 'unkempt / poor', color: 'text-red-400' },
            upperEyelidExposure: value < 0.25 ? { text: 'hooded / ideal', color: 'text-green-400' } : value < 0.35 ? { text: 'good', color: 'text-blue-400' } : value > 0.45 ? { text: 'excessive (bug eyes)', color: 'text-red-400' } : { text: 'noticeable UEE', color: 'text-yellow-400' },
            philtrumLength: value < 0.08 ? { text: 'compact / ideal', color: 'text-green-400' } : value < 0.10 ? { text: 'good', color: 'text-blue-400' } : value > 0.12 ? { text: 'long (chimp)', color: 'text-red-400' } : { text: 'average', color: 'text-yellow-400' }
        };
        return fRatings[metric] || { text: 'unknown', color: 'text-gray-400' };
    }

    // Male Ratings
    const mRatings: Record<string, { text: string, color: string }> = {
        canthalTilt: value >= 4 && value <= 6 ? { text: 'perfect hunter eyes', color: 'text-green-400' } : value > 2 ? { text: 'good', color: 'text-blue-400' } : value < 0 ? { text: 'negative canthal tilt', color: 'text-red-400' } : { text: 'neutral', color: 'text-yellow-400' },
        fwfhRatio: value >= 1.65 ? { text: 'perfect broad face', color: 'text-green-400' } : value >= 1.55 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow face', color: 'text-orange-400' },
        midfaceRatio: value >= 0.75 && value <= 1.05 ? { text: 'perfect compact midface', color: 'text-green-400' } : (value >= 0.70 && value <= 1.10) ? { text: 'good', color: 'text-blue-400' } : value < 0.70 ? { text: 'excessively compact', color: 'text-red-400' } : { text: 'long midface', color: 'text-red-400' },
        gonialAngle: value >= 110 && value <= 125 ? { text: 'perfect masculine square', color: 'text-green-400' } : value >= 100 && value <= 130 ? { text: 'good', color: 'text-blue-400' } : { text: 'steep/soft jawline', color: 'text-orange-400' },
        chinToPhiltrumRatio: value >= 2.5 && value <= 3.2 ? { text: 'perfect', color: 'text-green-400' } : value < 1.6 ? { text: 'long philtrum / weak chin', color: 'text-red-400' } : value > 3.8 ? { text: 'very long chin', color: 'text-orange-400' } : value < 2.0 ? { text: 'slightly long philtrum', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
        mouthToNoseWidthRatio: value >= 1.30 && value <= 1.62 ? { text: 'perfect', color: 'text-green-400' } : value >= 1.20 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow mouth', color: 'text-orange-400' },
        bigonialWidthRatio: value >= 1.05 && value <= 1.25 ? { text: 'perfect wide jaw', color: 'text-green-400' } : value <= 1.35 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow jaw', color: 'text-orange-400' },
        lowerThirdRatio: value >= 0.62 ? { text: 'perfect masculine lower third', color: 'text-green-400' } : value >= 0.58 ? { text: 'good', color: 'text-blue-400' } : { text: 'weak lower third', color: 'text-orange-400' },
        palpebralFissureLength: value >= 3.0 && value <= 3.5 ? { text: 'perfect horizontal eyes', color: 'text-green-400' } : value > 3.5 ? { text: 'good', color: 'text-blue-400' } : { text: 'slightly too round eyes', color: 'text-yellow-400' },
        eyeSeparationRatio: value >= 0.45 && value <= 0.47 ? { text: 'perfect', color: 'text-green-400' } : value >= 0.42 && value <= 0.49 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal spacing', color: 'text-yellow-400' },
        eyeToMouthAngle: value >= 46 && value <= 50 ? { text: 'perfect', color: 'text-green-400' } : value < 46 ? { text: 'shallow', color: 'text-yellow-400' } : { text: 'steep', color: 'text-yellow-400' },
        lipRatio: value >= 1.20 && value <= 1.70 ? { text: 'perfect', color: 'text-green-400' } : value >= 1.00 && value <= 2.20 ? { text: 'acceptable', color: 'text-blue-400' } : { text: 'suboptimal lip ratio', color: 'text-orange-400' },
        facialAsymmetry: value >= 93 ? { text: 'perfectly symmetric', color: 'text-green-400' } : value >= 85 ? { text: 'very symmetric', color: 'text-blue-400' } : value >= 80 ? { text: 'acceptable symmetry', color: 'text-yellow-400' } : { text: 'asymmetric', color: 'text-orange-400' },
        ipdRatio: value >= 0.45 && value <= 0.47 ? { text: 'ideal eye spacing', color: 'text-green-400' } : value >= 0.42 && value <= 0.49 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal spacing', color: 'text-yellow-400' },
        facialThirdsRatio: value >= 95 ? { text: 'perfect thirds', color: 'text-green-400' } : value >= 85 ? { text: 'good proportions', color: 'text-blue-400' } : value >= 70 ? { text: 'acceptable', color: 'text-yellow-400' } : { text: 'unbalanced thirds', color: 'text-orange-400' },
        foreheadHeightRatio: value >= 0.30 && value <= 0.35 ? { text: 'ideal forehead', color: 'text-green-400' } : value > 0.38 ? { text: 'fivehead (large)', color: 'text-orange-400' } : value < 0.28 ? { text: 'short forehead', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
        noseWidthRatio: value >= 0.25 && value <= 0.32 ? { text: 'ideal nose width', color: 'text-green-400' } : value > 0.37 ? { text: 'wide nose', color: 'text-orange-400' } : value < 0.22 ? { text: 'narrow nose', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
        cheekboneProminence: value >= 0.35 && value <= 0.50 ? { text: 'prominent cheekbones', color: 'text-green-400' } : value >= 0.30 ? { text: 'good projection', color: 'text-blue-400' } : { text: 'flat cheekbones', color: 'text-yellow-400' },
        hairlineRecession: value >= 95 ? { text: 'full hairline', color: 'text-green-400' } : value >= 85 ? { text: 'good hairline', color: 'text-blue-400' } : value >= 70 ? { text: 'minor recession', color: 'text-yellow-400' } : value >= 50 ? { text: 'receding hairline', color: 'text-orange-400' } : { text: 'significant hair loss', color: 'text-red-400' },
        orbitalRimProtrusion: value > 0.015 ? { text: 'deep-set eyes (ideal)', color: 'text-green-400' } : value > 0.005 ? { text: 'good eye depth', color: 'text-blue-400' } : value > -0.005 ? { text: 'neutral depth', color: 'text-yellow-400' } : { text: 'bulging eyes', color: 'text-red-400' },
        maxillaryProtrusion: value > 0.02 ? { text: 'forward maxilla (ideal)', color: 'text-green-400' } : value > 0.01 ? { text: 'good maxilla', color: 'text-blue-400' } : value > -0.005 ? { text: 'neutral', color: 'text-yellow-400' } : { text: 'retruded maxilla', color: 'text-red-400' },
        browRidgeProtrusion: value > 0.015 ? { text: 'prominent brow (masculine)', color: 'text-green-400' } : value > 0.005 ? { text: 'good brow ridge', color: 'text-blue-400' } : { text: 'flat brow', color: 'text-yellow-400' },
        infraorbitalRimPosition: value > 0.01 ? { text: 'forward infraorbital rim', color: 'text-green-400' } : value > -0.005 ? { text: 'neutral', color: 'text-blue-400' } : { text: 'retruded (dark circles)', color: 'text-orange-400' },
        chinProjection: value > 0.025 ? { text: 'strong chin', color: 'text-green-400' } : value > 0.01 ? { text: 'good projection', color: 'text-blue-400' } : value > 0 ? { text: 'weak chin', color: 'text-yellow-400' } : { text: 'recessed chin', color: 'text-red-400' },
        doubleChinRisk: value > 0.02 ? { text: 'sharp jawline', color: 'text-green-400' } : value > 0.008 ? { text: 'good definition', color: 'text-blue-400' } : value > 0 ? { text: 'soft jawline', color: 'text-yellow-400' } : { text: 'submental fullness', color: 'text-orange-400' },
        angleDeduction: value === 0 ? { text: 'ideal camera setup', color: 'text-green-400' } : value <= 0.5 ? { text: 'minor tilt', color: 'text-yellow-400' } : { text: 'high distortion check', color: 'text-red-400' },
        facialTension: value < 0.5 ? { text: 'relaxed / neutral', color: 'text-green-400' } : value < 1.2 ? { text: 'minor tension', color: 'text-yellow-400' } : { text: 'high tension detected', color: 'text-orange-400' },
        skinQuality: value > 90 ? { text: 'glass skin', color: 'text-green-400' } : value > 75 ? { text: 'clear skin', color: 'text-blue-400' } : value > 50 ? { text: 'textured', color: 'text-yellow-400' } : { text: 'acne / heavy texture', color: 'text-red-400' },
        hairQualityScore: value >= 85 ? { text: 'elite grooming', color: 'text-green-400' } : value >= 65 ? { text: 'well-groomed', color: 'text-blue-400' } : value >= 40 ? { text: 'average grooming', color: 'text-yellow-400' } : { text: 'unkempt / poor', color: 'text-red-400' },
        upperEyelidExposure: value < 0.25 ? { text: 'hunter eyes (no UEE)', color: 'text-green-400' } : value < 0.35 ? { text: 'good', color: 'text-blue-400' } : value > 0.45 ? { text: 'bug eyes (high UEE)', color: 'text-red-400' } : { text: 'noticeable UEE', color: 'text-yellow-400' },
        philtrumLength: value < 0.08 ? { text: 'compact / ideal', color: 'text-green-400' } : value < 0.10 ? { text: 'good', color: 'text-blue-400' } : value > 0.12 ? { text: 'long (chimp)', color: 'text-red-400' } : { text: 'average', color: 'text-yellow-400' }
    };

    return mRatings[metric] || { text: 'unknown', color: 'text-gray-400' };
};

export const getIdealRange = (metric: keyof MetricScores, gender: 'male' | 'female' = 'male'): string => {
    if (gender === 'female') {
        const fIdeals: Record<string, string> = {
            canthalTilt: '5° to 9.5°',
            fwfhRatio: '> 1.55',
            midfaceRatio: '0.8 to 1.05',
            gonialAngle: '105° to 130°',
            chinToPhiltrumRatio: '2.0 to 2.75',
            mouthToNoseWidthRatio: '1.45 to 1.6',
            bigonialWidthRatio: '1.15 to 1.30',
            lowerThirdRatio: '0.58 to 0.65',
            palpebralFissureLength: '2.8 to 3.5',
            eyeSeparationRatio: '0.45 to 0.47',
            eyeToMouthAngle: '47° to 50°',
            lipRatio: '1.15 to 1.70',
            facialAsymmetry: '93-100 (symmetry score)',
            ipdRatio: '0.45 to 0.47',
            facialThirdsRatio: '95-100 (balance score)',
            foreheadHeightRatio: '0.30 to 0.35',
            noseWidthRatio: '0.22 to 0.28',
            cheekboneProminence: '0.38 to 0.52',
            hairlineRecession: '90-100 (fullness score)',
            orbitalRimProtrusion: '> 0.005 (neutral to deep)',
            maxillaryProtrusion: '> 0.02 (forward)',
            browRidgeProtrusion: '< 0.010 (smooth brow)',
            infraorbitalRimPosition: '> 0.01 (forward)',
            chinProjection: '> 0.015 (strong)',
            doubleChinRisk: '> 0.020 (sharp jaw)',
            angleDeduction: '0 (neutral)',
            facialTension: '< 0.5 (relaxed)',
            skinQuality: '85-100 (clear)',
            hairQualityScore: '65-100 (groomed)',
            upperEyelidExposure: '< 0.25 (Minimal)',
            philtrumLength: '< 0.08 (Compact)'
        };
        return fIdeals[metric] || '';
    }

    const mIdeals: Record<keyof MetricScores, string> = {
        canthalTilt: '4° to 6°',
        fwfhRatio: '> 1.65',
        midfaceRatio: '0.75 to 1.05',
        gonialAngle: '110° to 125°',
        chinToPhiltrumRatio: '2.5 to 3.2',
        mouthToNoseWidthRatio: '1.30 to 1.62',
        bigonialWidthRatio: '1.05 to 1.25',
        lowerThirdRatio: 'more than 0.62',
        palpebralFissureLength: '3.0 to 3.5',
        eyeSeparationRatio: '0.45 to 0.47',
        eyeToMouthAngle: '46° to 50°',
        lipRatio: '1.20 to 1.70',
        facialAsymmetry: '93-100 (symmetry score)',
        ipdRatio: '0.45 to 0.47',
        facialThirdsRatio: '95-100 (balance score)',
        foreheadHeightRatio: '0.30 to 0.35',
        noseWidthRatio: '0.25 to 0.32',
        cheekboneProminence: '0.35 to 0.50',
        hairlineRecession: '90-100 (fullness score)',
        orbitalRimProtrusion: '> 0.015 (deep-set)',
        maxillaryProtrusion: '> 0.02 (forward)',
        browRidgeProtrusion: '> 0.015 (prominent)',
        infraorbitalRimPosition: '> 0.01 (forward)',
        chinProjection: '> 0.025 (strong)',
        doubleChinRisk: '> 0.020 (sharp jaw)',
        angleDeduction: '0 (neutral)',
        facialTension: '< 0.5 (relaxed)',
        skinQuality: '85-100 (clear)',
        hairQualityScore: '65-100 (groomed)',
        upperEyelidExposure: '< 0.25 (Minimal)',
        philtrumLength: '< 0.08 (Compact)'
    };
    return mIdeals[metric];
};
