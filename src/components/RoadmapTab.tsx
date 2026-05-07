'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MetricReport } from '@/utils/metrics';
import { generateAscensionPlan, getTierName } from '@/utils/plan-generator';

interface RoadmapTabProps {
    metrics: MetricReport;
    pslScore: number;
    gender: 'male' | 'female';
}

export default function RoadmapTab({ metrics, pslScore, gender }: RoadmapTabProps) {
    const targetPSL = Math.min(8.0, pslScore + 1.5);
    const plan = generateAscensionPlan(metrics, pslScore, targetPSL, gender);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* GOAL HEADER */}
            <div className="glass border border-zinc-800 rounded-3xl p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 select-none pointer-events-none">
                    <span className="text-8xl font-black">ROADMAP</span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Ascension Strategy</span>
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tighter">Projected {getTierName(targetPSL)}</h3>
                        <p className="text-zinc-500 text-xs max-w-md leading-relaxed">
                            Based on your structural skeletal baseline, we have calculated an optimal path to increase your PSL by <span className="text-indigo-400 font-bold">{plan.gap.toFixed(2)} points</span>.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-zinc-800">
                        <div className="text-center">
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Current</p>
                            <p className="text-xl font-black text-zinc-400">{pslScore.toFixed(2)}</p>
                        </div>
                        <div className="w-px h-8 bg-zinc-800" />
                        <div className="text-center">
                            <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Target</p>
                            <p className="text-xl font-black text-white">{targetPSL.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* PHASES */}
            <div className="space-y-4">
                {plan.phases.map((phase, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative"
                    >
                        {idx < plan.phases.length - 1 && (
                            <div className="absolute left-[19px] top-10 bottom-[-20px] w-px bg-gradient-to-b from-indigo-500/50 to-transparent z-0" />
                        )}
                        
                        <div className="flex gap-6 relative z-10">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full glass border border-indigo-500/30 flex items-center justify-center text-xs font-black text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                {idx + 1}
                            </div>
                            
                            <div className="flex-1 pb-8">
                                <div className="glass-dark border border-zinc-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-all group">
                                    <h4 className="text-white font-bold text-sm mb-1 group-hover:text-indigo-300 transition-colors">{phase.title}</h4>
                                    <p className="text-zinc-500 text-[10px] mb-4 leading-relaxed uppercase tracking-wider">{phase.description}</p>
                                    
                                    <div className="space-y-2">
                                        {phase.items.map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-zinc-800/50 group/item hover:bg-black/50 transition-colors">
                                                <div className={`w-1 h-8 rounded-full ${
                                                    item.category === 'lifestyle' ? 'bg-emerald-500/50' : 
                                                    item.category === 'nonSurgical' ? 'bg-amber-500/50' : 'bg-red-500/50'
                                                }`} />
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.label}</p>
                                                    <p className="text-xs text-white font-medium">{item.recommendation}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-bold text-zinc-600 uppercase">Impact</p>
                                                    <p className="text-[10px] font-black text-indigo-400">+{item.impact.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* DISCLAIMER */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                <p className="text-[10px] text-amber-500/80 leading-relaxed text-center italic">
                    Medical Disclaimer: This roadmap is algorithmically generated based on geometric facial optimization. Consult with board-certified maxillofacial or plastic surgeons before pursuing any clinical interventions.
                </p>
            </div>
        </div>
    );
}
