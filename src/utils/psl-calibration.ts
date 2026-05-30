import { MetricReport } from '../types/metrics';

export type CalibrationBreakdown = Record<string, { zScore: number; contribution: number }>;

interface CalibrationModel {
    intercept: number;
    means: Record<string, number>;
    stds: Record<string, number>;
    coefficients: Record<string, number>;
}

const BENCHMARK_MODEL: CalibrationModel = {
    intercept: 6.066666666666666,
    means: {
        'jawline.bigonialRatio': 0.807651124107338,
        'jawline.cervicomentalAngle': 116.26052247018565,
        'jawline.chinProjection': -0.063362564388537,
        'jawline.doubleChinRisk': -0.037303707894357,
        'jawline.gonialAngle.average': 136.44012347171554,
        'jawline.gonialAngle.delta': 3.150336146996566,
        'jawline.gonialAngle.left': 135.96764927867517,
        'jawline.gonialAngle.right': 136.91259766475588,
        'midface.eyeToMouthAngle': 47.3563757968861,
        'midface.fWHR': 2.081749841637005,
        'midface.facialFifthsRatio': 1.370900730060858,
        'midface.facialThirdsRatio': 82.39462023398281,
        'midface.foreheadHeightRatio': 1.064265284083791,
        'midface.lipRatio': 1.058284746664154,
        'midface.lowerThirdRatio': 0.704972494101332,
        'midface.maxillaryProtrusion': -0.050209613333686,
        'midface.midfaceRatio': 0.877935033290462,
        'midface.mouthToNoseWidthRatio': 1.383769781682649,
        'midface.noseWidthRatio': 0.262268131098992,
        'midface.pfl': 3.356093059103289,
        'midface.philtrumLength': 15.678933191379318,
        'periorbital.browRidgeProtrusion': 0.006036349092676,
        'periorbital.canthalTilt.average': 6.88557046279257,
        'periorbital.canthalTilt.delta': 2.887686932306407,
        'periorbital.canthalTilt.left': 7.298643742180618,
        'periorbital.canthalTilt.right': 6.472497183404523,
        'periorbital.esr': 0.427918128797602,
        'periorbital.infraorbitalRimPosition': 0.00672372863266,
        'periorbital.ipd': 0.145374507456622,
        'periorbital.orbitalRimProtrusion.average': -0.018365078436255,
        'periorbital.orbitalRimProtrusion.delta': 0.002058988289877,
        'periorbital.orbitalRimProtrusion.left': -0.018901570808168,
        'periorbital.orbitalRimProtrusion.right': -0.017828586064342,
        'periorbital.uee.average': 0.613818389248736,
        'periorbital.uee.delta': 0.076682517028347,
        'periorbital.uee.left': 0.626817795367873,
        'periorbital.uee.right': 0.600818983129599,
        'skin.eyebrowContrast': 42.86666666666667,
        'skin.tension': 1.487941380372017,
        'symmetry.midlineDeviation': 0.167192313173577,
        'symmetry.overallSymmetry': 50.35013063362591,
        'vitality.biologicalAgeDelta': 2.251313737250829,
        'vitality.collagenIndex': 46.4,
        'vitality.eyeAperture': 41.8,
        'vitality.vitalityScore': 27.466666666666665,
    },
    stds: {
        'jawline.bigonialRatio': 0.019506479369589,
        'jawline.cervicomentalAngle': 1.793557823128424,
        'jawline.chinProjection': 0.023757362335417,
        'jawline.doubleChinRisk': 0.010901383263579,
        'jawline.gonialAngle.average': 2.252565850598175,
        'jawline.gonialAngle.delta': 2.706277165035037,
        'jawline.gonialAngle.left': 2.903912372327124,
        'jawline.gonialAngle.right': 3.14534767502116,
        'midface.eyeToMouthAngle': 1.933845013573746,
        'midface.fWHR': 0.10751215436806,
        'midface.facialFifthsRatio': 0.061356564788338,
        'midface.facialThirdsRatio': 3.056749381758929,
        'midface.foreheadHeightRatio': 0.046552276907241,
        'midface.lipRatio': 0.080852869916324,
        'midface.lowerThirdRatio': 0.010867318639084,
        'midface.maxillaryProtrusion': 0.054233075926443,
        'midface.midfaceRatio': 0.040658222360151,
        'midface.mouthToNoseWidthRatio': 0.105971765509833,
        'midface.noseWidthRatio': 0.010195347572159,
        'midface.pfl': 0.524881457519993,
        'midface.philtrumLength': 2.008827027165311,
        'periorbital.browRidgeProtrusion': 0.006971361517538,
        'periorbital.canthalTilt.average': 3.497690822816699,
        'periorbital.canthalTilt.delta': 2.251526515819936,
        'periorbital.canthalTilt.left': 4.351425395222127,
        'periorbital.canthalTilt.right': 3.448996068537366,
        'periorbital.esr': 0.011016225294368,
        'periorbital.infraorbitalRimPosition': 0.024242486536746,
        'periorbital.ipd': 0.037743144924038,
        'periorbital.orbitalRimProtrusion.average': 0.006794378473805,
        'periorbital.orbitalRimProtrusion.delta': 0.00247754749177,
        'periorbital.orbitalRimProtrusion.left': 0.007364414257618,
        'periorbital.orbitalRimProtrusion.right': 0.006534963609575,
        'periorbital.uee.average': 0.07906431161727,
        'periorbital.uee.delta': 0.07654055599299,
        'periorbital.uee.left': 0.108230605199876,
        'periorbital.uee.right': 0.079497360251476,
        'skin.eyebrowContrast': 28.851035028612444,
        'skin.tension': 0.617392952915995,
        'symmetry.midlineDeviation': 0.076774445599474,
        'symmetry.overallSymmetry': 32.297212073398306,
        'vitality.biologicalAgeDelta': 0.998212321767925,
        'vitality.collagenIndex': 26.985922255872598,
        'vitality.eyeAperture': 14.432371022577453,
        'vitality.vitalityScore': 10.019092884199758,
    },
    coefficients: {
        'jawline.bigonialRatio': 0.088186481100206,
        'jawline.cervicomentalAngle': -0.078583704299845,
        'jawline.chinProjection': -0.111085154860538,
        'jawline.doubleChinRisk': -0.09337290254014,
        'jawline.gonialAngle.average': -0.136992153126708,
        'jawline.gonialAngle.delta': -0.1738875063762,
        'jawline.gonialAngle.left': -0.083410846147885,
        'jawline.gonialAngle.right': -0.119207776847328,
        'midface.eyeToMouthAngle': -0.076241971247882,
        'midface.fWHR': -0.161482148610952,
        'midface.facialFifthsRatio': 0.044392522720897,
        'midface.facialThirdsRatio': 0.065491104448701,
        'midface.foreheadHeightRatio': -0.000928830713004,
        'midface.lipRatio': 0.187408338884967,
        'midface.lowerThirdRatio': 0.002225714253392,
        'midface.maxillaryProtrusion': -0.120760762228652,
        'midface.midfaceRatio': -0.078783586485805,
        'midface.mouthToNoseWidthRatio': 0.020450334671154,
        'midface.noseWidthRatio': 0.027707871200718,
        'midface.pfl': -0.030012212643133,
        'midface.philtrumLength': -0.031245398909249,
        'periorbital.browRidgeProtrusion': 0.145559387458942,
        'periorbital.canthalTilt.average': 0.052811621043904,
        'periorbital.canthalTilt.delta': -0.046582880854989,
        'periorbital.canthalTilt.left': 0.069558381883527,
        'periorbital.canthalTilt.right': 0.019356164466833,
        'periorbital.esr': 0.05404340604598,
        'periorbital.infraorbitalRimPosition': -0.039798587749664,
        'periorbital.ipd': -0.032498727332637,
        'periorbital.orbitalRimProtrusion.average': 0.091473886780495,
        'periorbital.orbitalRimProtrusion.delta': -0.179713753000062,
        'periorbital.orbitalRimProtrusion.left': 0.124534065147254,
        'periorbital.orbitalRimProtrusion.right': 0.04986959209778,
        'periorbital.uee.average': 0.081443439710786,
        'periorbital.uee.delta': 0.057169456042023,
        'periorbital.uee.left': 0.044969629888087,
        'periorbital.uee.right': 0.100776286271677,
        'skin.eyebrowContrast': 0.12162131902926,
        'skin.tension': -0.006271576403279,
        'symmetry.midlineDeviation': -0.10325854699114,
        'symmetry.overallSymmetry': 0.198434391170582,
        'vitality.biologicalAgeDelta': 0.045872957405691,
        'vitality.collagenIndex': -0.178483372703987,
        'vitality.eyeAperture': -0.04678218132714,
        'vitality.vitalityScore': -0.049257423612051,
    },
};

export const REFERENCE_NORMS: Record<string, { mean: number; stdDev: number }> = Object.fromEntries(
    Object.entries(BENCHMARK_MODEL.means).map(([key, mean]) => [
        key,
        {
            mean,
            stdDev: BENCHMARK_MODEL.stds[key] ?? 1,
        },
    ])
);

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
