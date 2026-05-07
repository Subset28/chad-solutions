'use client';

import React from 'react';
import { MetricReport, flattenMetrics, BilateralResult } from '@/utils/metrics';
import { metricExplanations } from '@/utils/explanations';
import { metricRecommendations } from '@/utils/recommendations';
import { getRating, getIdealRange } from '@/utils/ratings';

interface AnalysisTabProps {
    metrics: MetricReport;
    profileType: 'front' | 'side' | 'composite';
    gender: 'male' | 'female';
    expandedMetric: string | null;
    onToggleMetric: (key: string | null) => void;
}

const SIDE_ONLY_METRICS = ['chinProjection', 'maxillaryProtrusion', 'orbitalRimProtrusion', 'browRidgeProtrusion', 'infraorbitalRimPosition', 'doubleChinRisk'];

export default function AnalysisTab({ metrics, profileType, gender, expandedMetric, onToggleMetric }: AnalysisTabProps) {
    const flatMetrics = flattenMetrics(metrics);

    return (
        <div className="space-y-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Feature Analysis</h3>
            {Object.entries(flatMetrics).map(([key, value]) => {
                const numericValue = typeof value === 'number' ? value : (Array.isArray(value) ? 0 : (value as BilateralResult).average);
                const rating = getRating(key as any, numericValue, gender);
                const idealRange = getIdealRange(key as any, gender);
                const label = key.replace(/([A-Z])/g, ' $1').trim();
                const isExpanded = expandedMetric === key;
                const explanation = (metricExplanations as any)[key];
                const recs = (metricRecommendations as any)[key];

                const isSideMetric = SIDE_ONLY_METRICS.includes(key);
                let isValidForProfile = true;
                let profileNote = '';
                if (profileType === 'front' && isSideMetric) { isValidForProfile = false; profileNote = 'Side profile required'; }

                const isGood = rating.color.includes('green');
                const isBad = rating.color.includes('orange') || rating.color.includes('red');
                const borderColor = !isValidForProfile ? 'border-zinc-800/50' : isGood ? 'border-emerald-500/20' : isBad ? 'border-red-500/20' : 'border-zinc-700/50';
                const bgHover = !isValidForProfile ? '' : isGood ? 'hover:bg-emerald-500/5' : isBad ? 'hover:bg-red-500/5' : 'hover:bg-zinc-800/80';

                return (
                    <div
                        key={key}
                        className={`rounded-2xl border ${borderColor} glass transition-all duration-300 overflow-hidden ${!isValidForProfile ? 'opacity-30' : 'cursor-pointer ' + bgHover} hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 active:scale-[0.98]`}
                        onClick={() => isValidForProfile && onToggleMetric(isExpanded ? null : key)}
                    >
                        {/* Row */}
                        <div className="flex items-center gap-3 px-4 py-3.5">
                            {/* Status dot */}
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!isValidForProfile ? 'bg-zinc-700' : isGood ? 'bg-emerald-400' : isBad ? 'bg-red-400' : 'bg-yellow-400'}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-sm font-semibold text-white capitalize truncate">{explanation?.title || label}</span>
                                    <span className={`text-xs font-bold flex-shrink-0 ${isValidForProfile ? rating.color : 'text-zinc-600'}`}>
                                        {isValidForProfile ? rating.text : profileNote}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-0.5">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] text-zinc-500">Ideal: {idealRange}</span>
                                    </div>
                                    {isValidForProfile && !Array.isArray(value) && (
                                        <span className="text-[11px] font-mono text-zinc-400">
                                            {typeof numericValue === 'number' ? numericValue.toFixed(2) : String(numericValue ?? '')}
                                        </span>
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
                                    </div>
                                )}
                                
                                {typeof value === 'object' && value !== null && 'left' in (value as any) && (
                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800/50">
                                        <div>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase">Left Side</p>
                                            <p className="text-sm font-mono text-white">{(value as BilateralResult).left.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase">Right Side</p>
                                            <p className="text-sm font-mono text-white">{(value as BilateralResult).right.toFixed(2)}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase">Asymmetry Delta</p>
                                            <p className={`text-sm font-mono ${(value as BilateralResult).delta > 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {(value as BilateralResult).delta.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {recs && !isGood && (
                                    <div className="space-y-3 pt-1">
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Medical-Grade Correction</p>
                                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                                            <ul className="space-y-1.5">
                                                {recs.surgical?.map((r: string, i: number) => (
                                                    <li key={i} className="text-xs text-zinc-300 leading-relaxed flex gap-2">
                                                        <span className="text-red-500/60 flex-shrink-0 mt-0.5">•</span>
                                                        {r}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
