'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MetricReport } from '@/utils/metrics';
import { generateLooksmaxPlan, getTierName } from '@/utils/plan-generator';
import { getInsightsForMetric, getLastUpdated } from '@/lib/insights';
import { flattenMetrics } from '@/utils/metrics';
import { getIdealRange, getRating } from '@/utils/ratings';
import { metricExplanations } from '@/utils/explanations';
import type { MetricScores } from '@/utils/geometry';

interface RoadmapTabProps {
    metrics: MetricReport;
    pslScore: number;
    gender: 'male' | 'female';
}

export default function RoadmapTab({ metrics, pslScore, gender }: RoadmapTabProps) {
    const [selectedInterventions, setSelectedInterventions] = React.useState<string[]>([]);
    const [goalName, setGoalName] = React.useState('Summer glow-up');
    const [targetPSL, setTargetPSL] = React.useState(() => Math.min(9.5, pslScore + 1.5));
    const [focusMetric, setFocusMetric] = React.useState<string>('');

    React.useEffect(() => {
        setTargetPSL(Math.min(9.5, pslScore + 1.5));
    }, [pslScore]);

    const flatMetrics = React.useMemo(() => flattenMetrics(metrics), [metrics]);
    const metricRows = React.useMemo(() => {
        return Object.entries(flatMetrics)
            .filter(([, value]) => typeof value === 'number')
            .map(([key, value]) => {
                const rating = getRating(key as keyof MetricScores, value as number, gender);
                const severity = rating.color.includes('green')
                    ? 0
                    : rating.color.includes('blue')
                        ? 1
                        : rating.color.includes('yellow')
                            ? 2
                            : 3;
                return {
                    key,
                    value: value as number,
                    title: metricExplanations[key]?.title || key,
                    ideal: getIdealRange(key as keyof MetricScores, gender),
                    assessment: rating.text,
                    color: rating.color,
                    severity,
                    explanation: metricExplanations[key],
                };
            })
            .sort((a, b) => b.severity - a.severity);
    }, [flatMetrics, gender]);

    React.useEffect(() => {
        if (!focusMetric && metricRows[0]) {
            setFocusMetric(metricRows[0].key);
        }
    }, [focusMetric, metricRows]);

    const plan = generateLooksmaxPlan(metrics, pslScore, targetPSL, gender);
    const selectedMetric = metricRows.find((row) => row.key === focusMetric);

    const options = [
        { id: 'rhino', label: 'Rhinoplasty', boost: [0.2, 0.4], cost: [5000, 12000] },
        { id: 'jaw', label: 'Jaw angle implants', boost: [0.3, 0.5], cost: [8000, 15000] },
        { id: 'cantho', label: 'Lateral canthoplasty', boost: [0.4, 0.8], cost: [4000, 8000], highlight: true },
        { id: 'chin', label: 'Chin augmentation', boost: [0.2, 0.3], cost: [4000, 7000] },
        { id: 'cheek', label: 'Cheek implants', boost: [0.1, 0.3], cost: [6000, 10000] },
    ];

    const projectedBoost = selectedInterventions.reduce((acc, id) => {
        const option = options.find(x => x.id === id);
        return acc + (option ? (option.boost[0] + option.boost[1]) / 2 : 0);
    }, 0);

    const projectedPSL = Math.min(9.9, pslScore + projectedBoost);

    const totalCost = selectedInterventions.reduce((acc, id) => {
        const option = options.find(x => x.id === id);
        return acc + (option ? option.cost[0] : 0);
    }, 0);

    const totalCostMax = selectedInterventions.reduce((acc, id) => {
        const option = options.find(x => x.id === id);
        return acc + (option ? option.cost[1] : 0);
    }, 0);

    const toggleOption = (id: string) => {
        setSelectedInterventions(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="glass-dark border border-zinc-800 rounded-[2.5rem] p-6 space-y-6 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Goal setup</span>
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tighter">{goalName}</h3>
                        <p className="text-zinc-500 text-xs max-w-2xl leading-relaxed">
                            Set a target PSL and pick a focus metric. The roadmap will prioritize the biggest wins first and keep the rest visible for tracking.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:w-[360px]">
                        <label className="space-y-1">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Goal name</span>
                            <input
                                value={goalName}
                                onChange={(e) => setGoalName(e.target.value)}
                                className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-sm font-medium text-white outline-none focus:border-zinc-600"
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Target PSL</span>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={targetPSL}
                                onChange={(e) => setTargetPSL(Math.max(0, Math.min(9.5, Number(e.target.value) || 0)))}
                                className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-sm font-medium text-white outline-none focus:border-zinc-600"
                            />
                        </label>
                        <label className="space-y-1 md:col-span-2">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Focus metric</span>
                            <select
                                value={focusMetric}
                                onChange={(e) => setFocusMetric(e.target.value)}
                                className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-sm font-medium text-white outline-none focus:border-zinc-600"
                            >
                                {metricRows.map((row) => (
                                    <option key={row.key} value={row.key}>
                                        {row.title}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                {selectedMetric && (
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Current</p>
                            <p className="mt-2 text-2xl font-black text-white">{selectedMetric.value.toFixed(2)}</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Ideal</p>
                            <p className="mt-2 text-sm font-black text-white">{selectedMetric.ideal || 'See note'}</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Assessment</p>
                            <p className="mt-2 text-sm font-black text-white">{selectedMetric.assessment}</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Why it matters</p>
                            <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                                {selectedMetric.explanation?.whatItIs || 'This metric contributes to the overall scan.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="glass border border-zinc-800 rounded-3xl p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 select-none pointer-events-none">
                    <span className="text-8xl font-black">PLAN</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Improvement Strategy</span>
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tighter">Target: {getTierName(targetPSL)}</h3>
                        <p className="text-zinc-500 text-xs max-w-md leading-relaxed">
                            Based on your current measurements, this plan prioritizes the highest-impact changes first and estimates a potential improvement of <span className="text-indigo-400 font-bold">{plan.gap.toFixed(2)} PSL points</span>.
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

            <div className="glass-dark border border-zinc-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
                    <span className="text-9xl font-black">ROI</span>
                </div>

                <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                    <div className="space-y-6 flex-1">
                        <div>
                            <h4 className="text-white font-black text-sm uppercase tracking-[0.2em] mb-2">High-Impact Options</h4>
                            <p className="text-zinc-500 text-[10px] uppercase tracking-widest leading-relaxed">
                                Select optional interventions to review estimated impact and cost. This is informational only.
                            </p>
                        </div>

                        <div className="space-y-2">
                            {options.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => toggleOption(option.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                        selectedInterventions.includes(option.id)
                                            ? 'bg-indigo-500/10 border-indigo-500/50'
                                            : 'bg-black/40 border-zinc-800 hover:border-zinc-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                            selectedInterventions.includes(option.id) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-700'
                                        }`}>
                                            {selectedInterventions.includes(option.id) && (
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-white uppercase">{option.label}</p>
                                            {option.highlight && (
                                                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Highest impact</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-emerald-400">+{option.boost[0]}-{option.boost[1]} PSL</p>
                                        <p className="text-[8px] text-zinc-600 uppercase tracking-tighter mt-0.5">${option.cost[0]}-${option.cost[1]}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="md:w-72 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Projected PSL</p>
                            <div className="text-6xl font-black text-white tracking-tighter">
                                {projectedPSL.toFixed(1)}
                            </div>
                            <p className="text-[10px] font-bold text-indigo-500/60 uppercase">
                                +{projectedBoost.toFixed(2)} Gain
                            </p>
                        </div>

                        <div className="h-px w-full bg-indigo-500/20" />

                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Estimated Cost</p>
                            <p className="text-xl font-black text-white">${totalCost.toLocaleString()}+</p>
                            <p className="text-[9px] text-zinc-600 uppercase tracking-widest italic">
                                Approx. ${totalCost.toLocaleString()}-${totalCostMax.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {plan.phases.map((phase, i) => (
                    <motion.div
                        key={phase.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500">
                                0{i + 1}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">{phase.title}</h4>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-tight">{phase.description}</p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {phase.items.map((item) => {
                                const insights = getInsightsForMetric(
                                    item.metric,
                                    metrics.community.phenotype,
                                    metrics.community.phenotype
                                );

                                return (
                                    <div key={item.metric} className="glass-dark border border-zinc-800/50 rounded-2xl p-5 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{item.label}</span>
                                                    <span className="px-1.5 py-0.5 bg-zinc-800 text-[8px] font-bold text-zinc-500 rounded uppercase">
                                                        +{item.impact.toFixed(2)} PSL
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-zinc-300 leading-relaxed">
                                                    {item.recommendation}
                                                </p>
                                            </div>
                                        </div>

                                        {insights.length > 0 && (
                                            <div className="pt-4 border-t border-zinc-800/50 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">Reference notes</span>
                                                    <span className="text-[8px] font-bold text-zinc-700 uppercase italic">
                                                        Updated {getLastUpdated() ? new Date(getLastUpdated()!).toLocaleDateString() : 'Weekly'}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {insights.map((insight, idx) => (
                                                        <div key={idx} className="flex gap-3 items-start">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30 mt-1 flex-shrink-0" />
                                                            <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                                                                {insight.advice}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl">
                <div className="space-y-2 text-center">
                    <p className="text-[10px] text-amber-500/80 leading-relaxed italic">
                        Informational disclaimer: This plan is generated from facial measurements and general improvement heuristics. Consult qualified professionals before making medical or surgical decisions.
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
                        Apple Health sync
                    </p>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                        Native Apple Health integration is not available in a static web app, but we can add an iOS bridge or import health exports later for sleep, activity, and body-composition signals.
                    </p>
                </div>
            </div>
        </div>
    );
}
