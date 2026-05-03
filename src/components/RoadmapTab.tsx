'use client';

import React from 'react';
import { MetricScores } from '@/utils/geometry';
import { getRating } from '@/utils/ratings';
import { generateAscensionPlan } from '@/utils/plan-generator';
import { motion, AnimatePresence } from 'framer-motion';

interface RoadmapTabProps {
    metrics: MetricScores;
    profileType: 'front' | 'side' | 'composite';
    gender: 'male' | 'female';
    expandedMetric: string | null;
    onToggleMetric: (key: string | null) => void;
    currentPSL: number;
}



export default function RoadmapTab({ metrics, gender, currentPSL }: RoadmapTabProps) {
    const [targetPSL, setTargetPSL] = React.useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('targetPSL');
            return saved ? parseFloat(saved) : Math.min(8.0, Math.ceil(currentPSL + 1));
        }
        return Math.min(8.0, Math.ceil(currentPSL + 1));
    });

    const [completedItems, setCompletedItems] = React.useState<Set<string>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('completedItems');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        }
        return new Set();
    });

    React.useEffect(() => {
        localStorage.setItem('targetPSL', targetPSL.toString());
    }, [targetPSL]);

    React.useEffect(() => {
        localStorage.setItem('completedItems', JSON.stringify(Array.from(completedItems)));
    }, [completedItems]);

    const plan = React.useMemo(() => 
        generateAscensionPlan(metrics, currentPSL, targetPSL, gender),
        [metrics, currentPSL, targetPSL, gender]
    );

    // Calculate Genetic Potential based on skeletal "hard-coded" traits (IPD, spacing, etc.)
    const geneticPotential = React.useMemo(() => {
        const hardMetrics = ['ipdRatio', 'eyeSeparationRatio', 'midfaceRatio', 'palpebralFissureLength'] as const;
        let score = 7.8; // Base high potential
        hardMetrics.forEach(m => {
            const val = metrics[m as keyof MetricScores];
            if (typeof val === 'number') {
                const rating = getRating(m, val, gender);
                if (rating.color.includes('red')) score -= 0.6;
                else if (rating.color.includes('orange')) score -= 0.3;
            }
        });
        return Math.max(5.0, score);
    }, [metrics, gender]);

    const toggleComplete = (id: string) => {
        const next = new Set(completedItems);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }
        }
        setCompletedItems(next);
    };

    const handlePrint = () => {
        window.print();
    };

    const progress = Math.min(100, Math.round((completedItems.size / plan.phases.reduce((acc, p) => acc + p.items.length, 0)) * 100)) || 0;

    return (
        <div className="space-y-6 pb-20 print:pb-0">
            {/* PROGRESS BAR */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 print:hidden">
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

            {/* PRINT HEADER (ONLY FOR PDF/PRINT) */}
            <div className="hidden print:block mb-8 border-b-2 border-zinc-900 pb-6">
                <h1 className="text-3xl font-black text-black uppercase tracking-tighter">Ascension Audit Report</h1>
                <div className="flex justify-between mt-4">
                    <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase">Current Status</p>
                        <p className="text-xl font-black text-black">{currentPSL.toFixed(1)} / 8.0</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-zinc-500 uppercase">Target Status</p>
                        <p className="text-xl font-black text-black">{targetPSL.toFixed(1)} / 8.0</p>
                    </div>
                </div>
            </div>

            {/* TARGET SELECTOR */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl print:bg-white print:border-zinc-200 print:shadow-none">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-black text-white print:text-black tracking-tight">Ascension Goal</h3>
                        <p className="text-xs text-zinc-500">Set your target PSL score</p>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-black text-amber-500 print:text-amber-600">{targetPSL.toFixed(1)}</span>
                        <span className="text-[10px] block text-amber-400 print:text-amber-700 font-bold uppercase tracking-widest">{plan.targetTier}</span>
                    </div>
                </div>

                <div className="print:hidden">
                    <input 
                        type="range" 
                        min={Math.max(1, Math.floor(currentPSL))} 
                        max="8.0" 
                        step="0.1" 
                        value={targetPSL}
                        onChange={(e) => setTargetPSL(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mb-6"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/50 print:bg-zinc-50 print:border-zinc-200">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Required Boost</span>
                        <span className="text-xl font-bold text-white print:text-black">+{plan.gap.toFixed(1)} <span className="text-xs text-zinc-600 ml-1">PSL</span></span>
                    </div>
                    <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/50 print:bg-zinc-50 print:border-zinc-200">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Genetic Potential</span>
                        <span className={`text-xl font-bold ${targetPSL <= geneticPotential ? 'text-emerald-400 print:text-emerald-600' : 'text-amber-500 print:text-amber-600'}`}>
                            {geneticPotential.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>

            {/* PDF EXPORT BUTTON */}
            <button 
                onClick={handlePrint}
                className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 print:hidden"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Ascension Audit (PDF)
            </button>

            {/* PHASES */}
            <div className="space-y-4 print:space-y-8">
                <AnimatePresence mode="wait">
                    {plan.phases.map((phase, pIdx) => (
                        <motion.div 
                            key={phase.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: pIdx * 0.1 }}
                            className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden print:bg-white print:border-zinc-300 print:rounded-none print:shadow-none"
                        >
                            <div className="px-6 py-5 border-b border-zinc-800/50 bg-zinc-900/20 print:bg-zinc-100 print:border-zinc-300">
                                <h4 className="text-sm font-bold text-amber-400 print:text-amber-700 mb-1">{phase.title}</h4>
                                <p className="text-[11px] text-zinc-500 print:text-zinc-700 leading-relaxed">{phase.description}</p>
                            </div>
                            <div className="divide-y divide-zinc-800/30 print:divide-zinc-200">
                                {phase.items.map((item, iIdx) => {
                                    const id = `${pIdx}-${iIdx}-${item.metric}`;
                                    const isDone = completedItems.has(id);
                                    
                                    return (
                                        <div 
                                            key={id}
                                            onClick={() => toggleComplete(id)}
                                            className={`group flex items-start gap-4 px-6 py-4 cursor-pointer hover:bg-zinc-800/30 transition-colors print:hover:bg-transparent ${isDone ? 'opacity-50 print:opacity-100' : ''}`}
                                        >
                                            <div className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all print:hidden ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700 group-hover:border-amber-500/50'}`}>
                                                {isDone && (
                                                    <svg className="w-3.5 h-3.5 text-black font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${isDone ? 'text-zinc-500 line-through print:no-underline' : 'text-zinc-400 print:text-zinc-600'}`}>{item.label}</span>
                                                    <span className="text-[10px] font-mono text-zinc-600">ROI: +{item.impact.toFixed(2)}</span>
                                                </div>
                                                <p className={`text-sm leading-relaxed ${isDone ? 'text-zinc-600 line-through print:no-underline' : 'text-zinc-200 print:text-black'}`}>
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

            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .bg-zinc-950, .bg-zinc-900, .bg-black {
                        background: white !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
