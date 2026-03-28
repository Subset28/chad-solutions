'use client';

import React, { useState } from 'react';
import { MetricScores } from '@/utils/geometry';
import { getHaircutRecommendations, HairProfile, DEFAULT_HAIR_PROFILE } from '@/utils/haircut-recommendations';

interface HaircutTabProps {
    metrics: MetricScores;
    gender: 'male' | 'female';
}

export default function HaircutTab({ metrics, gender }: HaircutTabProps) {
    const [hairProfile, setHairProfile] = useState<HairProfile>(DEFAULT_HAIR_PROFILE);

    const hairRecs = getHaircutRecommendations({
        fwfhRatio: metrics.fwfhRatio,
        foreheadHeightRatio: metrics.foreheadHeightRatio,
        bigonialWidthRatio: metrics.bigonialWidthRatio,
        midfaceRatio: metrics.midfaceRatio,
        gonialAngle: metrics.gonialAngle,
        lowerThirdRatio: metrics.lowerThirdRatio
    }, gender, hairProfile);

    return (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/10 p-5 mt-2">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">✂️</span>
                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Haircut Recommender</h3>
                </div>
                <div className="px-2 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/30">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-tighter">AI Analysis</span>
                </div>
            </div>

            {/* Hair Profile Selector */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-5">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-indigo-400">👤</span> My Hair Profile
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Hair Type</label>
                        <select
                            value={hairProfile.type}
                            onChange={(e) => setHairProfile({ ...hairProfile, type: e.target.value as any })}
                            className="w-full bg-zinc-800 border-none rounded-lg text-xs text-white px-3 py-2 cursor-pointer focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                            <option value="straight">Straight</option>
                            <option value="wavy">Wavy</option>
                            <option value="curly">Curly</option>
                            <option value="coily">Coily</option>
                        </select>
                    </div>
                    {gender === 'male' && (
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Hairline</label>
                            <select
                                value={hairProfile.hairline}
                                onChange={(e) => setHairProfile({ ...hairProfile, hairline: e.target.value as any })}
                                className="w-full bg-zinc-800 border-none rounded-lg text-xs text-white px-3 py-2 cursor-pointer focus:ring-1 focus:ring-indigo-500 outline-none"
                            >
                                <option value="full">Full / Solid</option>
                                <option value="receding_slight">Slightly Receding</option>
                                <option value="receding_moderate">Moderately Receding</option>
                                <option value="thinning">Thinning</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Face Shape Result */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{hairRecs.emoji}</span>
                    <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Detected Shape</p>
                        <h4 className="text-lg font-black text-white">{hairRecs.label}</h4>
                    </div>
                    <div className="ml-auto text-right">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Confidence</p>
                        <p className="text-sm font-black text-indigo-400">{hairRecs.confidence}%</p>
                    </div>
                </div>
                <p className="text-xs text-zinc-400 italic leading-relaxed">{hairRecs.description}</p>
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
                <div>
                    <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3">Recommended For You</h5>
                    <div className="grid gap-2">
                        {hairRecs.recommendations.map((rec, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/30 transition-colors">
                                <p className="text-sm font-bold text-white mb-1">{rec.name}</p>
                                <p className="text-[11px] text-indigo-300/80 mb-1 leading-snug">{rec.why}</p>
                                <p className="text-[10px] text-zinc-500 leading-relaxed">{rec.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                        <h5 className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            To Avoid
                        </h5>
                        <ul className="space-y-1.5">
                            {hairRecs.avoid.map((item, idx) => (
                                <li key={idx} className="text-[10px] text-zinc-400 leading-tight">• {item}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <h5 className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Pro Tips
                        </h5>
                        <ul className="space-y-1.5">
                            {hairRecs.stylingTips.map((item, idx) => (
                                <li key={idx} className="text-[10px] text-zinc-400 leading-tight">• {item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
