'use client';

import React from 'react';
import { MetricScores } from '@/utils/geometry';
import { metricExplanations } from '@/utils/explanations';
import { metricRecommendations } from '@/utils/recommendations';
import { getRating, getIdealRange } from '@/utils/ratings';
import { calculatePercentile } from '@/utils/statistics';

interface AnalysisTabProps {
    metrics: MetricScores;
    profileType: 'front' | 'side' | 'composite';
    gender: 'male' | 'female';
    expandedMetric: string | null;
    onToggleMetric: (key: string | null) => void;
}

const SIDE_ONLY_METRICS = ['chinProjection', 'maxillaryProtrusion', 'orbitalRimProtrusion', 'browRidgeProtrusion', 'infraorbitalRimPosition', 'doubleChinRisk'];
const FRONT_ONLY_METRICS = ['facialAsymmetry', 'ipdRatio', 'eyeSeparationRatio', 'canthalTilt', 'fwfhRatio', 'noseWidthRatio', 'mouthToNoseWidthRatio', 'bigonialWidthRatio', 'cheekboneProminence', 'skinQuality', 'facialTension', 'chinToPhiltrumRatio', 'lowerThirdRatio', 'palpebralFissureLength', 'facialThirdsRatio', 'foreheadHeightRatio'];
const PHYSICAL_METRICS = ['physicalIPD', 'physicalJawWidth', 'physicalFaceWidth', 'physicalFaceHeight'];

export default function AnalysisTab({ metrics, profileType, gender, expandedMetric, onToggleMetric }: AnalysisTabProps) {
    const audit = metrics.audit;

    return (
        <div className="space-y-6">
            {/* OBJECTIVE QUALITY AUDIT */}
            {audit && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                    
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div>
                            <h3 className="text-sm font-black text-white tracking-tight uppercase italic">Objective Quality Audit</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Environment & Behavioral Scan</p>
                        </div>
                        <div className="text-right">
                            <span className={`text-2xl font-black ${audit.overall > 85 ? 'text-emerald-400' : audit.overall > 70 ? 'text-amber-400' : 'text-red-400'}`}>{audit.overall}%</span>
                            <span className="text-[10px] block text-zinc-600 font-bold uppercase tracking-widest">Confidence</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4 relative z-10">
                        <div className="bg-zinc-950/50 rounded-xl p-2 border border-zinc-800/50 text-center">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Lighting</span>
                            <span className={`text-[10px] font-black uppercase ${audit.factors.lighting === 'excellent' ? 'text-emerald-400' : audit.factors.lighting === 'good' ? 'text-blue-400' : 'text-amber-400'}`}>{audit.factors.lighting}</span>
                        </div>
                        <div className="bg-zinc-950/50 rounded-xl p-2 border border-zinc-800/50 text-center">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Angle</span>
                            <span className={`text-[10px] font-black uppercase ${audit.factors.angle === 'perfect' ? 'text-emerald-400' : audit.factors.angle === 'acceptable' ? 'text-blue-400' : 'text-red-400'}`}>{audit.factors.angle}</span>
                        </div>
                        <div className="bg-zinc-950/50 rounded-xl p-2 border border-zinc-800/50 text-center">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Expression</span>
                            <span className={`text-[10px] font-black uppercase ${audit.factors.expression === 'neutral' ? 'text-emerald-400' : 'text-blue-400'}`}>{audit.factors.expression}</span>
                        </div>
                        <div className="bg-zinc-950/50 rounded-xl p-2 border border-zinc-800/50 text-center">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Phenotype</span>
                            <span className="text-[10px] font-black uppercase text-purple-400">{metrics.phenotype || 'Generic'}</span>
                        </div>
                    </div>

                    {audit.feedback.length > 0 && (
                        <div className="space-y-1.5 border-t border-zinc-800/50 pt-3 relative z-10">
                            {audit.feedback.map((f: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-[10px] text-zinc-400">
                                    <span className="text-amber-500/50">✦</span>
                                    {f}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* PHYSICAL SPECS GRID - God Tier Accuracy */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Physical Specifications (3D Metric Space)</h3>
                <div className="grid grid-cols-2 gap-3">
                    {PHYSICAL_METRICS.map(key => {
                        const val = metrics[key as keyof MetricScores];
                        const label = key.replace('physical', '').replace(/([A-Z])/g, ' $1').trim();
                        const unit = 'mm';
                        
                        return (
                            <div key={key} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{label}</span>
                                <span className="text-lg font-black text-white">{typeof val === 'number' ? val.toFixed(1) : val}<span className="text-[10px] ml-0.5 text-zinc-500">{unit}</span></span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Feature Analysis</h3>
            {Object.entries(metrics)
                .filter(([key]) => !PHYSICAL_METRICS.includes(key) && key !== 'phenotype' && key !== 'vitality' && key !== 'audit')
                .map(([key, value]) => {
                const metricKey = key as keyof MetricScores;
                const rating = getRating(metricKey, value, gender);
                const idealRange = getIdealRange(metricKey, gender);
                const percentileData = calculatePercentile(metricKey, typeof value === 'number' ? value : 0);
                const label = key.replace(/([A-Z])/g, ' $1').trim();
                const isExpanded = expandedMetric === key;
                const explanation = metricExplanations[key];
                const recs = metricRecommendations[key];

                const isSideMetric = SIDE_ONLY_METRICS.includes(key);
                const isFrontMetric = FRONT_ONLY_METRICS.includes(key);
                let isValidForProfile = true;
                let profileNote = '';
                if (profileType === 'front' && isSideMetric) { isValidForProfile = false; profileNote = 'Side profile required'; }
                else if (profileType === 'side' && isFrontMetric) { isValidForProfile = false; profileNote = 'Front profile required'; }

                const isGood = rating.color.includes('green');
                const isBad = rating.color.includes('orange') || rating.color.includes('red');
                const borderColor = !isValidForProfile ? 'border-zinc-800' : isGood ? 'border-emerald-500/40' : isBad ? 'border-red-500/40' : 'border-zinc-700';
                const bgHover = !isValidForProfile ? '' : isGood ? 'hover:bg-emerald-950/20' : isBad ? 'hover:bg-red-950/20' : 'hover:bg-zinc-800/50';

                return (
                    <div
                        key={key}
                        className={`rounded-2xl border ${borderColor} bg-zinc-900 transition-all duration-200 overflow-hidden ${!isValidForProfile ? 'opacity-30' : 'cursor-pointer ' + bgHover}`}
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
                                        {isValidForProfile && (
                                            <span className="text-[10px] text-blue-400 font-bold uppercase">Elite Rank: {percentileData.rank}</span>
                                        )}
                                    </div>
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
                                                            <span className="text-red-500/60 flex-shrink-0 mt-0.5">•</span>
                                                            {r}
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
                                                            <span className="text-blue-500/60 flex-shrink-0 mt-0.5">•</span>
                                                            {r}
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
                                                            <span className="text-emerald-500/60 flex-shrink-0 mt-0.5">•</span>
                                                            {r}
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
            })}
        </div>
    );
}
