'use client';

import React from 'react';
import { MetricScores } from '@/utils/geometry';
import { metricExplanations } from '@/utils/explanations';
import { getRating } from '@/utils/ratings';
import { generateAscensionPlan, AscensionPlan } from '@/utils/plan-generator';
import { motion, AnimatePresence } from 'framer-motion';

interface RoadmapTabProps {
    metrics: MetricScores;
    profileType: 'front' | 'side' | 'composite';
    gender: 'male' | 'female';
    expandedMetric: string | null;
    onToggleMetric: (key: string | null) => void;
    currentPSL: number;
}

const SIDE_ONLY_METRICS = ['chinProjection', 'maxillaryProtrusion', 'orbitalRimProtrusion', 'browRidgeProtrusion', 'infraorbitalRimPosition', 'doubleChinRisk'];
const FRONT_ONLY_METRICS = ['facialAsymmetry', 'ipdRatio', 'eyeSeparationRatio', 'canthalTilt', 'fwfhRatio', 'noseWidthRatio', 'mouthToNoseWidthRatio', 'bigonialWidthRatio', 'cheekboneProminence', 'skinQuality', 'facialTension'];

export default function RoadmapTab({ metrics, profileType, gender, expandedMetric, onToggleMetric, currentPSL }: RoadmapTabProps) {
    const [targetPSL, setTargetPSL] = React.useState(Math.min(8.0, Math.ceil(currentPSL + 1)));
    const [completedItems, setCompletedItems] = React.useState<Set<string>>(new Set());

    const plan = React.useMemo(() => 
        generateAscensionPlan(metrics, currentPSL, targetPSL, gender),
        [metrics, currentPSL, targetPSL, gender]
    );

    // Calculate Genetic Potential based on skeletal "hard-coded" traits (IPD, spacing, etc.)
    const geneticPotential = React.useMemo(() => {
        const hardMetrics = ['ipdRatio', 'eyeSeparationRatio', 'midfaceRatio', 'palpebralFissureLength'];
        let score = 7.5; // Base high potential
        hardMetrics.forEach(m => {
            const rating = getRating(m as any, metrics[m as any] || 0, gender);
            if (rating.color.includes('red')) score -= 0.5;
            else if (rating.color.includes('orange')) score -= 0.2;
        });
        return Math.max(5.0, score);
    }, [metrics, gender]);

    const toggleComplete = (id: string) => {
        const next = new Set(completedItems);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
            // Subtle Haptic Feedback (Mobile only)
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }
        }
        setCompletedItems(next);
    };

    const progress = Math.min(100, Math.round((completedItems.size / plan.phases.reduce((acc, p) => acc + p.items.length, 0)) * 100)) || 0;

    return (
        <div className="space-y-6 pb-20">
            {/* PROGRESS BAR */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Ascension Progress</span>
                    <span className="text-xs font-bold text-emerald-400">{progress}%</span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                </div>
            </div>

            {/* TARGET SELECTOR */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-black text-white tracking-tight">Ascension Goal</h3>
                        <p className="text-xs text-zinc-500">Set your target PSL score</p>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-black text-amber-500">{targetPSL.toFixed(1)}</span>
                        <span className="text-[10px] block text-amber-400 font-bold uppercase tracking-widest">{plan.targetTier}</span>
                    </div>
                </div>

                <input 
                    type="range" 
                    min={Math.max(1, Math.floor(currentPSL))} 
                    max="8.0" 
                    step="0.1" 
                    value={targetPSL}
                    onChange={(e) => setTargetPSL(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mb-6"
                />

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/50">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Required Boost</span>
                        <span className="text-xl font-bold text-white">+{plan.gap.toFixed(1)} <span className="text-xs text-zinc-600 ml-1">PSL</span></span>
                    </div>
                    <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/50">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Genetic Potential</span>
                        <span className={`text-xl font-bold ${targetPSL <= geneticPotential ? 'text-emerald-400' : 'text-amber-500'}`}>
                            {geneticPotential.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>

            {/* PHASES */}
            <div className="space-y-4">
                <AnimatePresence mode="wait">
                    {plan.phases.map((phase, pIdx) => (
                        <motion.div 
                            key={phase.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: pIdx * 0.1 }}
                            className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-zinc-800/50 bg-zinc-900/20">
                                <h4 className="text-sm font-bold text-amber-400 mb-1">{phase.title}</h4>
                                <p className="text-[11px] text-zinc-500 leading-relaxed">{phase.description}</p>
                            </div>
                            <div className="divide-y divide-zinc-800/30">
                                {phase.items.map((item, iIdx) => {
                                    const id = `${pIdx}-${iIdx}-${item.metric}`;
                                    const isDone = completedItems.has(id);
                                    
                                    return (
                                        <div 
                                            key={id}
                                            onClick={() => toggleComplete(id)}
                                            className={`group flex items-start gap-4 px-6 py-4 cursor-pointer hover:bg-zinc-800/30 transition-colors ${isDone ? 'opacity-50' : ''}`}
                                        >
                                            <div className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700 group-hover:border-amber-500/50'}`}>
                                                {isDone && (
                                                    <svg className="w-3.5 h-3.5 text-black font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-400'}`}>{item.label}</span>
                                                    <span className="text-[10px] font-mono text-zinc-600">ROI: +{item.impact.toFixed(2)}</span>
                                                </div>
                                                <p className={`text-sm leading-relaxed ${isDone ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>
                                                    {item.recommendation}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {plan.phases.length === 0 && (
                <div className="text-center py-12 px-6">
                    <div className="text-4xl mb-4">👑</div>
                    <h3 className="text-lg font-bold text-white mb-2">Maximum Potential Reached</h3>
                    <p className="text-zinc-500 text-sm">Your metrics are already optimized for this target. Push the slider further to see advanced interventions.</p>
                </div>
            )}
        </div>
    );
}
