import { MetricReport } from '../types/metrics';

export type CalibrationBreakdown = Record<string, { zScore: number; contribution: number }>;

interface CalibrationModel {
    intercept: number;
    means: Record<string, number>;
    stds: Record<string, number>;
    coefficients: Record<string, number>;
}

const BENCHMARK_MODEL: CalibrationModel = {
    intercept: 6.066666666666667,
    means: {
        'community.potentialPSLBoost': 1.5,
        'jawline.bigonialRatio': 0.807318464868806,
        'jawline.cervicomentalAngle': 20.834118902713595,
        'jawline.chinProjection': -0.06357843894255165,
        'jawline.doubleChinRisk': -0.03738616460285084,
        'jawline.gonialAngle.average': 136.4544493106028,
        'jawline.gonialAngle.delta': 3.151773837746896,
        'jawline.gonialAngle.left': 135.9853752684652,
        'jawline.gonialAngle.right': 136.92352335274043,
        'midface.eyeToMouthAngle': 47.32439611507303,
        'midface.fWHR': 2.08113480891449,
        'midface.facialFifthsRatio': 1.3716335098686163,
        'midface.facialThirdsRatio': 88.50750734088469,
        'midface.foreheadHeightRatio': 1.0640992967594847,
        'midface.lipRatio': 1.0573097634472475,
        'midface.lowerThirdRatio': 0.7048562624030494,
        'midface.maxillaryProtrusion': -0.05047065260483139,
        'midface.midfaceRatio': 0.8772779500759758,
        'midface.mouthToNoseWidthRatio': 1.3793390102199394,
        'midface.noseWidthRatio': 0.26292804034185274,
        'midface.pfl': 3.3463618903662495,
        'midface.philtrumLength': 15.694286546067026,
        'periorbital.browRidgeProtrusion': 0.006057864600985328,
        'periorbital.canthalTilt.average': 6.909859623975525,
        'periorbital.canthalTilt.delta': 2.9471673210208267,
        'periorbital.canthalTilt.left': 7.310970600256804,
        'periorbital.canthalTilt.right': 6.508748647694247,
        'periorbital.esr': 0.42790249354809873,
        'periorbital.infraorbitalRimPosition': 0.006734282959497525,
        'periorbital.ipd': 0.14545442220649155,
        'periorbital.orbitalRimProtrusion.average': -0.018394726557786407,
        'periorbital.orbitalRimProtrusion.delta': 0.0020628325944530203,
        'periorbital.orbitalRimProtrusion.left': -0.018932869374936455,
        'periorbital.orbitalRimProtrusion.right': -0.01785658374063636,
        'periorbital.uee.average': 0.6149049575490991,
        'periorbital.uee.delta': 0.07811679063661402,
        'periorbital.uee.left': 0.6298273870093059,
        'periorbital.uee.right': 0.5999825280888924,
        'skin.eyebrowContrast': 43.86666666666667,
        'skin.tension': 1.5006934355532735,
        'symmetry.midlineDeviation': 0.17268901103948775,
        'symmetry.overallSymmetry': 50.24767638037788,
        'vitality.biologicalAgeDelta': 2.2384283473775715,
        'vitality.collagenIndex': 46.266666666666666,
        'vitality.eyeAperture': 42,
        'vitality.vitalityScore': 27.666666666666668,
    },
    stds: {
        'community.potentialPSLBoost': 1,
        'jawline.bigonialRatio': 0.0194928964064396,
        'jawline.cervicomentalAngle': 1.757238102869424,
        'jawline.chinProjection': 0.023849496631871497,
        'jawline.doubleChinRisk': 0.010944478787232554,
        'jawline.gonialAngle.average': 2.2563534178481133,
        'jawline.gonialAngle.delta': 2.7313717877797736,
        'jawline.gonialAngle.left': 2.9168232810447488,
        'jawline.gonialAngle.right': 3.1514088292861917,
        'midface.eyeToMouthAngle': 1.936589063565669,
        'midface.fWHR': 0.10697256362094222,
        'midface.facialFifthsRatio': 0.06280713070761874,
        'midface.facialThirdsRatio': 3.1540206240317845,
        'midface.foreheadHeightRatio': 0.046788579836452335,
        'midface.lipRatio': 0.07886689935183641,
        'midface.lowerThirdRatio': 0.011023375764680089,
        'midface.maxillaryProtrusion': 0.05443515384919493,
        'midface.midfaceRatio': 0.04070447462569194,
        'midface.mouthToNoseWidthRatio': 0.10656231747541182,
        'midface.noseWidthRatio': 0.010559981606990896,
        'midface.pfl': 0.527464216290035,
        'midface.philtrumLength': 2.0071538826719078,
        'periorbital.browRidgeProtrusion': 0.006995127176340438,
        'periorbital.canthalTilt.average': 3.5147811680836467,
        'periorbital.canthalTilt.delta': 2.2465004275488285,
        'periorbital.canthalTilt.left': 4.375047882781493,
        'periorbital.canthalTilt.right': 3.480061638297303,
        'periorbital.esr': 0.01118813551486872,
        'periorbital.infraorbitalRimPosition': 0.02423439199140499,
        'periorbital.ipd': 0.03776647855564281,
        'periorbital.orbitalRimProtrusion.average': 0.006811004572719272,
        'periorbital.orbitalRimProtrusion.delta': 0.0024596998299071123,
        'periorbital.orbitalRimProtrusion.left': 0.007375000777843908,
        'periorbital.orbitalRimProtrusion.right': 0.006554573632639917,
        'periorbital.uee.average': 0.07994379093944641,
        'periorbital.uee.delta': 0.07197602038026854,
        'periorbital.uee.left': 0.110230296405263,
        'periorbital.uee.right': 0.07633697411170234,
        'skin.eyebrowContrast': 28.04963853995666,
        'skin.tension': 0.6300634447726916,
        'symmetry.midlineDeviation': 0.07826690482271524,
        'symmetry.overallSymmetry': 32.20764395291054,
        'vitality.biologicalAgeDelta': 1.0065065716236774,
        'vitality.collagenIndex': 27.137837463995215,
        'vitality.eyeAperture': 14.459137825841022,
        'vitality.vitalityScore': 10.10390463577764,
    },
    coefficients: {
        'community.potentialPSLBoost': 0,
        'jawline.bigonialRatio': 0.10725829922858965,
        'jawline.cervicomentalAngle': 0.026497992966324817,
        'jawline.chinProjection': -0.11846769618892682,
        'jawline.doubleChinRisk': -0.10070765530935526,
        'jawline.gonialAngle.average': -0.11908578366347318,
        'jawline.gonialAngle.delta': -0.1815932502749646,
        'jawline.gonialAngle.left': -0.06950599493307805,
        'jawline.gonialAngle.right': -0.10619457642861167,
        'midface.eyeToMouthAngle': -0.07806498454868001,
        'midface.fWHR': -0.15305522519844486,
        'midface.facialFifthsRatio': 0.05944236779837813,
        'midface.facialThirdsRatio': 0.03534017475839217,
        'midface.foreheadHeightRatio': -0.0024398025498798405,
        'midface.lipRatio': 0.14930407074807833,
        'midface.lowerThirdRatio': 0.03213886430355073,
        'midface.maxillaryProtrusion': -0.12135018722568702,
        'midface.midfaceRatio': -0.08037141326648466,
        'midface.mouthToNoseWidthRatio': 0.0506182024091156,
        'midface.noseWidthRatio': 0.017812714208262304,
        'midface.pfl': -0.03979994505813616,
        'midface.philtrumLength': -0.05600520113219855,
        'periorbital.browRidgeProtrusion': 0.15092082626084874,
        'periorbital.canthalTilt.average': 0.0532435000084954,
        'periorbital.canthalTilt.delta': -0.06884486833219164,
        'periorbital.canthalTilt.left': 0.07305456777683496,
        'periorbital.canthalTilt.right': 0.015706983354649276,
        'periorbital.esr': 0.051478705628733246,
        'periorbital.infraorbitalRimPosition': -0.033667469050330495,
        'periorbital.ipd': -0.03346382367480313,
        'periorbital.orbitalRimProtrusion.average': 0.08717158392336927,
        'periorbital.orbitalRimProtrusion.delta': -0.1586331584666292,
        'periorbital.orbitalRimProtrusion.left': 0.12552729713893884,
        'periorbital.orbitalRimProtrusion.right': 0.0399245189775767,
        'periorbital.uee.average': 0.0970340843903736,
        'periorbital.uee.delta': 0.026304878651727377,
        'periorbital.uee.left': 0.04906243260128972,
        'periorbital.uee.right': 0.13239165872904965,
        'skin.eyebrowContrast': 0.12210333791279385,
        'skin.tension': -0.0021292753464808296,
        'symmetry.midlineDeviation': -0.07931086367758682,
        'symmetry.overallSymmetry': 0.19645124230748612,
        'vitality.biologicalAgeDelta': 0.05535839702020821,
        'vitality.collagenIndex': -0.17533317047107566,
        'vitality.eyeAperture': -0.05573398858950927,
        'vitality.vitalityScore': -0.05841631673936438,
    },
};

function flattenNumericValues(value: unknown, prefix = ''): Record<string, number> {
    if (!value || typeof value !== 'object') return {};

    const result: Record<string, number> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        const nextKey = prefix ? `${prefix}.${key}` : key;
        if (typeof child === 'number' && Number.isFinite(child)) {
            result[nextKey] = child;
        } else if (child && typeof child === 'object' && !Array.isArray(child)) {
            Object.assign(result, flattenNumericValues(child, nextKey));
        }
    }
    return result;
}

export function predictBenchmarkPsl(metrics: MetricReport): {
    score: number;
    breakdown: CalibrationBreakdown;
} {
    const flatMetrics = flattenNumericValues(metrics);
    let score = BENCHMARK_MODEL.intercept;
    const breakdown: CalibrationBreakdown = {};

    for (const [key, coefficient] of Object.entries(BENCHMARK_MODEL.coefficients)) {
        if (!coefficient) continue;
        const value = flatMetrics[key];
        if (typeof value !== 'number' || !Number.isFinite(value)) continue;

        const mean = BENCHMARK_MODEL.means[key] ?? 0;
        const stdDev = BENCHMARK_MODEL.stds[key] ?? 1;
        const zScore = stdDev === 0 ? 0 : (value - mean) / stdDev;
        const contribution = zScore * coefficient;

        score += contribution;
        breakdown[key] = { zScore, contribution };
    }

    return {
        score: Math.min(8, Math.max(0, Math.round(score * 10) / 10)),
        breakdown,
    };
}

export function scoreToPercentile(score: number): number {
    const normalized = 1 / (1 + Math.exp(-1.3 * (score - 4)));
    return Math.max(1, Math.min(99, Math.round(normalized * 100)));
}
