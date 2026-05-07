'use client';

import React, { useState } from 'react';
import { MetricReport } from '@/utils/metrics';
import { getHaircutRecommendations, HairProfile, DEFAULT_HAIR_PROFILE } from '@/utils/haircut-recommendations';

interface HaircutTabProps {
    metrics: MetricReport;
    gender: 'male' | 'female';
}

export default function HaircutTab({ metrics, gender }: HaircutTabProps) {
    const [hairProfile, setHairProfile] = useState<HairProfile>(DEFAULT_HAIR_PROFILE);

    const hairRecs = getHaircutRecommendations(metrics, gender, hairProfile);

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Hair Profile Selector */}
            <div className="glass border border-zinc-800 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <span className="text-lg">✂️</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Hair Architecture</h3>
                        <p className="text-[10px] text-zinc-500 uppercase font-medium">Synergy & Quality Audit</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Hair Type</label>
                        <select
                            value={hairProfile.type}
                            onChange={(e) => setHairProfile({ ...hairProfile, type: e.target.value as HairProfile['type'] })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white px-4 py-3 cursor-pointer focus:ring-1 focus:ring-indigo-500 outline-none transition-all hover:bg-zinc-800"
                        >
                            <option value="straight">Straight</option>
                            <option value="wavy">Wavy</option>
                            <option value="curly">Curly</option>
                            <option value="coily">Coily</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Hairline Status</label>
                        <select
                            value={hairProfile.hairline}
                            onChange={(e) => setHairProfile({ ...hairProfile, hairline: e.target.value as HairProfile['hairline'] })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white px-4 py-3 cursor-pointer focus:ring-1 focus:ring-indigo-500 outline-none transition-all hover:bg-zinc-800"
                        >
                            <option value="full">Full / Solid</option>
                            <option value="receding_slight">Slight Recession</option>
                            <option value="receding_moderate">Moderate Recession</option>
                            <option value="thinning">Active Thinning</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Face Shape Result */}
            <div className="glass-dark border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 text-9xl opacity-5 group-hover:opacity-10 transition-opacity select-none pointer-events-none">
                    {hairRecs.emoji}
                </div>
                
                <div className="flex items-start justify-between relative z-10">
                    <div>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1">Geometric Classification</p>
                        <h4 className="text-3xl font-black text-white tracking-tighter mb-2">{hairRecs.label}</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed max-w-sm italic">"{hairRecs.description}"</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Confidence</p>
                        <div className="inline-flex items-center px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <span className="text-xs font-black text-emerald-400">{hairRecs.confidence}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hair PSL Score (if available) */}
            {hairRecs.hairPSL && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass border border-zinc-800 p-5 rounded-2xl">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Hair Quality Score</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-white">{hairRecs.hairPSL.score.toFixed(1)}</span>
                            <span className="text-xs font-bold text-indigo-400 uppercase mb-1.5">{hairRecs.hairPSL.label}</span>
                        </div>
                    </div>
                    <div className="glass border border-zinc-800 p-5 rounded-2xl">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Shape Synergy</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-white">{hairRecs.hairPSL.faceShapeSynergy}%</span>
                            <div className="w-16 h-1 bg-zinc-800 rounded-full mb-3.5 relative overflow-hidden">
                                <div 
                                    className="absolute left-0 top-0 h-full bg-emerald-500" 
                                    style={{ width: `${hairRecs.hairPSL.faceShapeSynergy}%` }} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recommendations */}
            <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] pl-1">Targeted Cuts</h5>
                <div className="grid gap-3">
                    {hairRecs.recommendations.map((rec, idx) => (
                        <div key={idx} className="p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <h6 className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors">{rec.name}</h6>
                                <span className="text-[9px] font-bold text-indigo-500 uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Optimal</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">{rec.why}</p>
                            <p className="text-[10px] text-zinc-500 leading-relaxed border-t border-zinc-800/50 pt-3">{rec.description}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                        <h5 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-red-500" /> Negative Synergy
                        </h5>
                        <ul className="space-y-2">
                            {hairRecs.avoid.map((item, idx) => (
                                <li key={idx} className="text-[10px] text-zinc-500 leading-tight flex gap-2">
                                    <span className="text-red-900">•</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                        <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" /> Pro Styling
                        </h5>
                        <ul className="space-y-2">
                            {hairRecs.stylingTips.map((item, idx) => (
                                <li key={idx} className="text-[10px] text-zinc-500 leading-tight flex gap-2">
                                    <span className="text-emerald-900">•</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
