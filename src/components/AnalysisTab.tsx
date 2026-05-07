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
    const falios = Object.entries(flatMetrics)
        .filter(([key, val]) => typeof val === 'number' && !getRating(key, val, gender).color.includes('green'))
        .sort((a, b) => {
            const ratingA = getRating(a[0], a[1] as number, gender);
            const ratingB = getRating(b[0], b[1] as number, gender);
            if (ratingA.color.includes('red') && !ratingB.color.includes('red')) return -1;
            if (!ratingA.color.includes('red') && ratingB.color.includes('red')) return 1;
            return 0;
        })
        .slice(0, 3);

    return (
        <div className="space-y-12">
            {/* Community Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                    </div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Phenotype Classification</p>
                    <h4 className="text-2xl font-black text-white mb-2 italic uppercase tracking-tight">{(metrics as any).community?.phenotype || 'Analyzing...'}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">Based on your fWHR, midface ratio, and jaw angularity.</p>
                </div>
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L4 9v12h16V9l-8-6zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>
                    </div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Hairline (Norwood Scale)</p>
                    <h4 className="text-2xl font-black text-white mb-2 italic uppercase tracking-tight">{(metrics as any).community?.nwScale || 'Analyzing...'}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">Forehead to midface height ratio analysis.</p>
                </div>
            </div>

            {/* What's Mogging You Section */}
            {falios.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-red-500/20" />
                        <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Major Falios (What's Mogging You)</h3>
                        <div className="h-px flex-1 bg-red-500/20" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {falios.map(([key, val]) => {
                            const exp = (metricExplanations as any)[key];
                            const rating = getRating(key, val as number, gender);
                            return (
                                <div key={key} className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 cursor-pointer hover:bg-red-500/10 transition-colors" onClick={() => onToggleMetric(key)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-white uppercase tracking-wider">{exp?.title || key}</span>
                                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">MOGGED</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 italic">"{rating.text}"</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* Blackpill Audit Dashboard */}
            <div className="space-y-8">
                {[
                    { id: 'fixed', label: 'Immutable Bone (Fixed)', color: 'zinc', desc: 'Skeletal features determined by genetics and pubertal development.' },
                    { id: 'softmax', label: 'Strategic Enhancements (Softmax)', color: 'emerald', desc: 'Improvable via fat loss, skincare, hair styling, and grooming.' },
                    { id: 'hardmax', label: 'Surgical Targets (Hardmax)', color: 'indigo', desc: 'Can be altered via clinical intervention or orthodontic work.' }
                ].map(group => {
                    const groupMetrics = Object.entries(flatMetrics).filter(([key]) => {
                        const exp = (metricExplanations as any)[key];
                        return exp?.modifiability === group.id;
                    });

                    if (groupMetrics.length === 0) return null;

                    return (
                        <div key={group.id} className="space-y-4">
                            <div className="flex flex-col gap-1 px-1">
                                <h3 className={`text-xs font-black text-${group.color}-500 uppercase tracking-[0.3em]`}>{group.label}</h3>
                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{group.desc}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupMetrics.map(([key, val]) => {
                                    const value = typeof val === 'number' ? val : (val as any).average;
                                    const exp = (metricExplanations as any)[key];
                                    const rating = getRating(key, value, gender);
                                    const isExpanded = expandedMetric === key;

                                    return (
                                        <div 
                                            key={key} 
                                            className={`glass border transition-all duration-500 overflow-hidden ${isExpanded ? 'border-zinc-400 bg-zinc-900/80 ring-1 ring-zinc-400/20 shadow-2xl' : 'border-zinc-800 hover:border-zinc-700 bg-black/40'}`}
                                        >
                                            <div 
                                                className="p-5 cursor-pointer flex items-center justify-between"
                                                onClick={() => onToggleMetric(isExpanded ? null : key)}
                                            >
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{exp?.title || key}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl font-black text-white tracking-tighter">
                                                            {typeof value === 'number' ? (key.includes('Angle') || key.includes('Tilt') ? `${value.toFixed(1)}°` : value.toFixed(2)) : 'N/A'}
                                                        </span>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${rating.color.replace('text-', 'bg-').replace('text-', 'border-')}/10 ${rating.color} border-current uppercase tracking-widest`}>
                                                            {rating.text}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}>
                                                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="px-5 pb-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                                    <div className="h-px bg-zinc-800" />
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">The Blackpill Truth</p>
                                                                <p className="text-xs text-white leading-relaxed font-medium bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 italic">
                                                                    "{exp?.blackpillNote || 'No community notes available.'}"
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Modifiability</p>
                                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${group.color === 'emerald' ? 'text-emerald-400' : group.color === 'indigo' ? 'text-indigo-400' : 'text-zinc-500'}`}>
                                                                    {group.label.split('(')[0]}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Metric Impact</p>
                                                                <p className="text-xs text-zinc-300 leading-relaxed">{exp?.whatItIs}</p>
                                                            </div>
                                                            <div className="flex gap-4">
                                                                <div className="flex-1">
                                                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">Ideal Range</p>
                                                                    <p className="text-[10px] font-bold text-white uppercase tracking-wider">{exp?.idealRange}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
