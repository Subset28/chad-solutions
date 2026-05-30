'use client';

import React from 'react';
import { MetricReport, flattenMetrics } from '@/utils/metrics';
import { metricExplanations } from '@/utils/explanations';
import { getRating, getIdealRange } from '@/utils/ratings';
import type { MetricScores } from '@/utils/geometry';

interface AnalysisTabProps {
    metrics: MetricReport;
    profileType: 'front' | 'side' | 'composite';
    gender: 'male' | 'female';
    expandedMetric: string | null;
    onToggleMetric: (key: string | null) => void;
}

const SIDE_ONLY_METRICS = [
    'chinProjection',
    'maxillaryProtrusion',
    'orbitalRimProtrusion',
    'browRidgeProtrusion',
    'infraorbitalRimPosition',
    'doubleChinRisk',
];

const GROUP_STYLES = {
    fixed: {
        title: 'Fixed Structure',
        titleClass: 'text-zinc-400',
        hint: 'Mostly structural or developmental measurements.',
    },
    softmax: {
        title: 'Lifestyle Wins',
        titleClass: 'text-emerald-400',
        hint: 'Often improved by sleep, skin care, styling, and body composition.',
    },
    hardmax: {
        title: 'Clinical Targets',
        titleClass: 'text-indigo-400',
        hint: 'Large changes usually require professional treatment.',
    },
} as const;

function formatMetricValue(key: string, value: number) {
    if (key.includes('Angle') || key.includes('Tilt')) return `${value.toFixed(1)} deg`;
    if (key.includes('Ratio') || key.includes('fWHR') || key.includes('ESR') || key.includes('PFL')) return value.toFixed(2);
    if (key.includes('Score') || key.includes('symmetry') || key.includes('tension')) return value.toFixed(1);
    return value.toFixed(2);
}

function getSeverity(color: string) {
    if (color.includes('green')) return 0;
    if (color.includes('blue')) return 1;
    if (color.includes('yellow')) return 2;
    if (color.includes('orange')) return 3;
    return 4;
}

function getAssessment(color: string) {
    if (color.includes('green')) return 'Excellent';
    if (color.includes('blue')) return 'Strong';
    if (color.includes('yellow')) return 'Mixed';
    if (color.includes('orange')) return 'Needs attention';
    return 'Weak';
}

function getMetricContext(metricKey: string) {
    switch (metricKey) {
        case 'canthalTilt':
            return 'Affects how lifted and alert the eye area reads in a photo.';
        case 'fWHR':
            return 'Affects how wide and structurally strong the face reads.';
        case 'midfaceRatio':
            return 'Affects how compact or vertically stretched the midface appears.';
        case 'gonialAngle':
            return 'Affects jaw sharpness and lower-face definition.';
        case 'chinToPhiltrumRatio':
            return 'Affects the balance between the chin, lip area, and lower face.';
        case 'mouthToNoseWidthRatio':
            return 'Affects the visual balance between the mouth and nose base.';
        case 'bigonialRatio':
            return 'Affects how wide the jaw reads relative to the cheekbones.';
        case 'lowerThirdRatio':
            return 'Affects the vertical balance between the forehead, midface, and jaw.';
        case 'pfl':
            return 'Affects how long and horizontally open the eyes appear.';
        case 'esr':
            return 'Affects the spacing of the eyes relative to face width.';
        case 'eyeToMouthAngle':
            return 'Affects the diagonal structure between the upper and lower face.';
        case 'lipRatio':
            return 'Affects balance between the upper and lower lip volumes.';
        case 'overallSymmetry':
            return 'Affects how balanced the face reads at a glance.';
        case 'ipd':
            return 'Affects how the eye spacing relates to overall face width.';
        case 'facialThirdsRatio':
            return 'Affects whether the face divides into even vertical thirds.';
        case 'foreheadHeightRatio':
            return 'Affects forehead proportion and overall vertical balance.';
        case 'noseWidthRatio':
            return 'Affects how prominent the nose reads within the midface.';
        case 'cheekboneProminence':
            return 'Affects cheek support and midface definition.';
        case 'hairlineRecession':
            return 'Affects forehead proportion and age perception.';
        case 'orbitalRimProtrusion':
            return 'Affects eye depth and under-eye support.';
        case 'maxillaryProtrusion':
            return 'Affects midface projection and side-profile support.';
        case 'browRidgeProtrusion':
            return 'Affects upper-face shading and eye socket depth.';
        case 'infraorbitalRimPosition':
            return 'Affects the support under the eyes and the amount of shadowing.';
        case 'chinProjection':
            return 'Affects lower-face projection and jawline balance.';
        case 'doubleChinRisk':
            return 'Affects how defined the jawline looks under the chin.';
        case 'facialTension':
            return 'Affects whether the face reads relaxed or strained.';
        case 'collagenIndex':
            return 'Affects texture, clarity, and how light reflects off the skin.';
        case 'hairQualityScore':
            return 'Affects how polished and healthy the hair reads in photos.';
        case 'uee':
            return 'Affects eyelid hooding and how open the eyes appear.';
        case 'philtrumLength':
            return 'Affects the proportion between the nose and upper lip.';
        default:
            return 'This metric contributes to the overall visual structure of the face.';
    }
}

function getNextStep(metricKey: string, modifiability?: string, assessment?: string) {
    if (assessment === 'Excellent' || assessment === 'Strong') {
        return 'This is already a relative strength. Keep photo conditions, grooming, and posture consistent so future scans stay comparable.';
    }

    switch (metricKey) {
        case 'collagenIndex':
            return 'Focus on sunscreen, a simple skin routine, hydration, and enough sleep. If texture is a major issue, a dermatologist can help.';
        case 'hairlineRecession':
            return 'A dermatologist consult is the best first step if hairline change is progressing. Haircut shape and styling can also soften the look.';
        case 'doubleChinRisk':
            return 'Reduce overall body fat gradually, keep your neck posture neutral, and avoid low-angle selfies that exaggerate this area.';
        case 'facialTension':
            return 'Relax your jaw, brows, and shoulders before taking photos. Stress management and better sleep often improve this scan result.';
        case 'overallSymmetry':
            return 'Use the same head position for each scan. If the asymmetry is consistent across photos, a dental or posture review may be useful.';
        case 'canthalTilt':
            return 'Most of this is structural, so the main wins are better photo angle, reduced under-eye puffiness, and consistent eyelid framing.';
        case 'fWHR':
            return 'Body composition, hairstyle, and beard or framing choices have the most visible effect. Structural change is limited.';
        case 'midfaceRatio':
            return 'Use hair and beard styling to balance vertical proportions. Large structural change usually requires specialist care.';
        case 'gonialAngle':
            return 'Lower body fat can sharpen the jawline visually. If you want a major structural change, only professional treatment moves it much.';
        case 'chinProjection':
            return 'Keep the head neutral in photos and reduce submental fullness. Structural projection changes require a specialist discussion.';
        case 'maxillaryProtrusion':
        case 'browRidgeProtrusion':
        case 'orbitalRimProtrusion':
        case 'infraorbitalRimPosition':
            return 'This is largely structural. Presentation changes help, but large improvements would require orthodontic or surgical consultation.';
        case 'foreheadHeightRatio':
            return 'Hairline framing and haircut shape are the main practical levers here.';
        case 'noseWidthRatio':
            return 'Photo angle, light, and balanced framing matter most. Structural narrowing is surgical if someone wants a large change.';
        case 'lipRatio':
            return 'Hydration and lip care help a little; if balance remains a priority, cosmetic consultation is the main structural option.';
        default:
            if (modifiability === 'softmax') {
                return 'Focus on sleep, skin care, hydration, and grooming because those changes are the most reversible.';
            }
            if (modifiability === 'hardmax') {
                return 'Large change here is usually structural, so orthodontic or surgical consultation is the route for major improvement.';
            }
            return 'Presentation changes are limited here, so use grooming, posture, and photo setup to improve how it reads.';
    }
}

export default function AnalysisTab({ metrics, profileType, gender, expandedMetric, onToggleMetric }: AnalysisTabProps) {
    const flatMetrics = flattenMetrics(metrics);

    const metricEntries = Object.entries(flatMetrics).filter(([, value]) => typeof value === 'number') as Array<[string, number]>;

    const analyzedMetrics = metricEntries.map(([key, value]) => {
        const rating = getRating(key as keyof MetricScores, value, gender);
        const explanation = metricExplanations[key];
        const severity = getSeverity(rating.color);

        return {
            key,
            value,
            explanation,
            severity,
            assessment: getAssessment(rating.color),
        };
    });

    const priorityMetrics = analyzedMetrics
        .filter(metric => metric.severity >= 2)
        .sort((a, b) => b.severity - a.severity)
        .slice(0, 3);

    const strengthMetrics = analyzedMetrics
        .filter(metric => metric.severity <= 1)
        .sort((a, b) => a.severity - b.severity)
        .slice(0, 3);

    const groupedMetrics = [
        {
            id: 'fixed',
            ...GROUP_STYLES.fixed,
            metrics: analyzedMetrics.filter(metric => metric.explanation?.modifiability === 'fixed'),
        },
        {
            id: 'softmax',
            ...GROUP_STYLES.softmax,
            metrics: analyzedMetrics.filter(metric => metric.explanation?.modifiability === 'softmax'),
        },
        {
            id: 'hardmax',
            ...GROUP_STYLES.hardmax,
            metrics: analyzedMetrics.filter(metric => metric.explanation?.modifiability === 'hardmax'),
        },
    ];

    const renderMetricCard = (metric: (typeof analyzedMetrics)[number]) => {
        const { key, value, explanation, assessment, severity } = metric;
        const isExpanded = expandedMetric === key;
        const isProfileRelevant = profileType !== 'front' || !SIDE_ONLY_METRICS.includes(key);
        const badgeClass = severity === 0
            ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
            : severity === 1
                ? 'text-blue-300 bg-blue-500/10 border-blue-500/20'
                : severity === 2
                    ? 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20'
                    : 'text-red-300 bg-red-500/10 border-red-500/20';

        return (
            <div
                key={key}
                className={`glass border transition-all duration-500 overflow-hidden ${
                    isExpanded
                        ? 'border-zinc-400 bg-zinc-900/80 ring-1 ring-zinc-400/20 shadow-2xl'
                        : 'border-zinc-800 hover:border-zinc-700 bg-black/40'
                } ${!isProfileRelevant ? 'opacity-50' : ''}`}
            >
                <div
                    className="p-5 cursor-pointer flex items-center justify-between"
                    onClick={() => onToggleMetric(isExpanded ? null : key)}
                >
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            {explanation?.title || key}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xl font-black text-white tracking-tighter">
                                {formatMetricValue(key, value)}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${badgeClass}`}>
                                {isProfileRelevant ? assessment : 'Profile mismatch'}
                            </span>
                        </div>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                            Ideal: {getIdealRange(key as keyof MetricScores, gender)}
                        </p>
                    </div>
                    {isProfileRelevant && (
                        <div className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    )}
                </div>

                {isExpanded && isProfileRelevant && (
                    <div className="px-5 pb-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="h-px bg-zinc-800" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">What it measures</p>
                                    <p className="text-xs text-zinc-300 leading-relaxed">
                                        {explanation?.whatItIs || 'Metric description unavailable.'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Why it matters</p>
                                    <p className="text-xs text-zinc-300 leading-relaxed">
                                        {getMetricContext(key)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Best next step</p>
                                    <p className="text-xs text-zinc-300 leading-relaxed">
                                        {getNextStep(key, explanation?.modifiability, assessment)}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="bg-white/5 border border-zinc-800 rounded-xl p-3">
                                        <p className="text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-[0.2em]">Current read</p>
                                        <p className="text-xs text-zinc-300 leading-relaxed">
                                            {assessment === 'Excellent' || assessment === 'Strong'
                                                ? 'This is one of the cleaner parts of the scan.'
                                                : 'This is an area worth improving if you want the biggest visible return.'}
                                        </p>
                                    </div>
                                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
                                        <p className="text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-[0.2em]">Photo note</p>
                                        <p className="text-xs text-zinc-300 leading-relaxed">
                                            Keep the same camera distance, head angle, and lighting when comparing scans so the measurement stays meaningful.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                        </svg>
                    </div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Face Shape Summary</p>
                    <h4 className="text-2xl font-black text-white mb-2 italic uppercase tracking-tight">
                        {metrics.community?.phenotype || 'Analyzing...'}
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        A compact readout of proportion, jaw shape, and overall facial balance.
                    </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3L4 9v12h16V9l-8-6zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                        </svg>
                    </div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Hairline Estimate</p>
                    <h4 className="text-2xl font-black text-white mb-2 italic uppercase tracking-tight">
                        {metrics.community?.nwScale || 'Analyzing...'}
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Useful for deciding whether a haircut, styling change, or hair-loss plan would help most.
                    </p>
                </div>
            </div>

            {strengthMetrics.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-emerald-500/20" />
                        <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Current Strengths</h3>
                        <div className="h-px flex-1 bg-emerald-500/20" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {strengthMetrics.map(metric => (
                            <div
                                key={metric.key}
                                className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                                onClick={() => onToggleMetric(metric.key)}
                            >
                                <div className="flex justify-between items-start mb-2 gap-3">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                                        {metric.explanation?.title || metric.key}
                                    </span>
                                    <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                        Review
                                    </span>
                                </div>
                                <p className="text-[10px] text-zinc-400 italic">{metric.assessment}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {priorityMetrics.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-red-500/20" />
                        <h3 className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">Top Improvement Priorities</h3>
                        <div className="h-px flex-1 bg-red-500/20" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {priorityMetrics.map(metric => (
                            <div
                                key={metric.key}
                                className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 cursor-pointer hover:bg-red-500/10 transition-colors"
                                onClick={() => onToggleMetric(metric.key)}
                            >
                                <div className="flex justify-between items-start mb-2 gap-3">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                                        {metric.explanation?.title || metric.key}
                                    </span>
                                    <span className="text-[10px] font-black text-red-300 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                        Review
                                    </span>
                                </div>
                                <p className="text-[10px] text-zinc-400 italic">{metric.assessment}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-8">
                {groupedMetrics.map(group => {
                    if (group.metrics.length === 0) return null;

                    return (
                        <div key={group.id} className="space-y-4">
                            <div className="flex flex-col gap-1 px-1">
                                <h3 className={`text-xs font-black uppercase tracking-[0.3em] ${group.titleClass}`}>{group.title}</h3>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{group.hint}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {group.metrics.map(renderMetricCard)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
