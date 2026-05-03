'use client';

import React from 'react';
import { MetricScores } from '@/utils/geometry';
import { metricExplanations } from '@/utils/explanations';
import { metricRecommendations } from '@/utils/recommendations';
import { getRating, getIdealRange } from '@/utils/ratings';

const SIDE_ONLY = ['chinProjection', 'maxillaryProtrusion', 'orbitalRimProtrusion', 'browRidgeProtrusion', 'infraorbitalRimPosition', 'doubleChinRisk'];
const FRONT_ONLY = ['facialAsymmetry', 'ipdRatio', 'eyeSeparationRatio', 'canthalTilt', 'fwfhRatio', 'noseWidthRatio', 'mouthToNoseWidthRatio', 'bigonialWidthRatio', 'cheekboneProminence', 'skinQuality', 'facialTension', 'chinToPhiltrumRatio', 'lowerThirdRatio', 'palpebralFissureLength', 'facialThirdsRatio', 'foreheadHeightRatio'];

interface Props {
    metricKey: string;
    value: number;
    gender: 'male' | 'female';
    profileType: 'front' | 'side' | 'composite';
    expandedMetric: string | null;
    onToggle: (key: string) => void;
}

export function MetricCard({ metricKey, value, gender, profileType, expandedMetric, onToggle }: Props) {
    const key = metricKey;
    const rating = getRating(key as keyof MetricScores, value, gender);
    const idealRange = getIdealRange(key as keyof MetricScores, gender);
    const label = key.replace(/([A-Z])/g, ' $1').trim();
    const isExpanded = expandedMetric === key;
    const explanation = metricExplanations[key];
    const recs = metricRecommendations[key];

    const isSideMetric = SIDE_ONLY.includes(key);
    const isFrontMetric = FRONT_ONLY.includes(key);
    let isValidForProfile = true;
    let profileNote = '';
    if (profileType === 'front' && isSideMetric) { isValidForProfile = false; profileNote = 'Side profile required'; }
    else if (profileType === 'side' && isFrontMetric) { isValidForProfile = false; profileNote = 'Front profile required'; }

    const isGood = rating.color.includes('green');
    const isBad = rating.color.includes('orange') || rating.color.includes('red');
    const borderColor = !isValidForProfile ? 'border-zinc-800/50' : isGood ? 'border-emerald-500/20' : isBad ? 'border-red-500/20' : 'border-zinc-700/50';
    const bgHover = !isValidForProfile ? '' : isGood ? 'hover:bg-emerald-500/5' : isBad ? 'hover:bg-red-500/5' : 'hover:bg-zinc-800/80';

    return (
        <div
            className={`rounded-2xl border ${borderColor} glass transition-all duration-300 overflow-hidden ${!isValidForProfile ? 'opacity-30' : 'cursor-pointer ' + bgHover} hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 active:scale-[0.98]`}
            onClick={() => isValidForProfile && onToggle(key)}
        >
            {/* Row */}
            <div className="flex items-center gap-3 px-4 py-3.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!isValidForProfile ? 'bg-zinc-700' : isGood ? 'bg-emerald-400' : isBad ? 'bg-red-400' : 'bg-yellow-400'}`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-white capitalize truncate">{explanation?.title || label}</span>
                        <span className={`text-xs font-bold flex-shrink-0 ${isValidForProfile ? rating.color : 'text-zinc-600'}`}>
                            {isValidForProfile ? rating.text : profileNote}
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[11px] text-zinc-500">Ideal: {idealRange}</span>
                        {isValidForProfile && (
                            <span className="text-[11px] font-mono text-zinc-400">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                        )}
                    </div>
                </div>
                {isValidForProfile && (
                    <svg className={`w-4 h-4 text-zinc-600 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </div>

            {/* Expanded Panel */}
            {isExpanded && isValidForProfile && (
                <div className="border-t border-zinc-800 px-4 pb-5 pt-4 space-y-4 text-sm">
                    {explanation && (
                        <div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">What this measures</p>
                            <p className="text-zinc-300 leading-relaxed">{explanation.whatItIs}</p>
                            <p className="text-zinc-400 leading-relaxed mt-2">{explanation.scientificContext}</p>
                            {explanation.blackpillNote && (
                                <p className="text-amber-400/80 text-xs leading-relaxed mt-2 italic">{explanation.blackpillNote}</p>
                            )}
                        </div>
                    )}

                    {recs && !isGood && (
                        <div className="space-y-3 pt-1">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">How to improve</p>

                            {recs.surgical.length > 0 && (
                                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-3">
                                    <p className="text-xs font-bold text-red-400 mb-2">🔪 Surgical Options</p>
                                    <ul className="space-y-1.5">
                                        {recs.surgical.map((r, i) => (
                                            <li key={i} className="text-xs text-zinc-300 leading-relaxed flex gap-2">
                                                <span className="text-red-500/60 flex-shrink-0 mt-0.5">•</span>{r}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {recs.nonSurgical.length > 0 && (
                                <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3">
                                    <p className="text-xs font-bold text-blue-400 mb-2">💊 Non-Surgical Options</p>
                                    <ul className="space-y-1.5">
                                        {recs.nonSurgical.map((r, i) => (
                                            <li key={i} className="text-xs text-zinc-300 leading-relaxed flex gap-2">
                                                <span className="text-blue-500/60 flex-shrink-0 mt-0.5">•</span>{r}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {recs.lifestyle.length > 0 && (
                                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3">
                                    <p className="text-xs font-bold text-emerald-400 mb-2">🌱 Lifestyle Changes</p>
                                    <ul className="space-y-1.5">
                                        {recs.lifestyle.map((r, i) => (
                                            <li key={i} className="text-xs text-zinc-300 leading-relaxed flex gap-2">
                                                <span className="text-emerald-500/60 flex-shrink-0 mt-0.5">•</span>{r}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <p className="text-[11px] text-zinc-500 italic leading-relaxed border-t border-zinc-800 pt-3">{recs.outlook}</p>
                        </div>
                    )}

                    {isGood && (
                        <div className="flex items-center gap-2 text-emerald-400/80 text-xs italic">
                            <span>✓</span> This feature is within the ideal range. No intervention needed.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
