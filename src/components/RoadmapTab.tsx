'use client';

import React from 'react';
import { MetricScores } from '@/utils/geometry';
import { metricExplanations } from '@/utils/explanations';
import { getRating } from '@/utils/ratings';

interface RoadmapTabProps {
    metrics: MetricScores;
    profileType: 'front' | 'side' | 'composite';
    gender: 'male' | 'female';
    expandedMetric: string | null;
    onToggleMetric: (key: string | null) => void;
}

const SIDE_ONLY_METRICS = ['chinProjection', 'maxillaryProtrusion', 'orbitalRimProtrusion', 'browRidgeProtrusion', 'infraorbitalRimPosition', 'doubleChinRisk'];
const FRONT_ONLY_METRICS = ['facialAsymmetry', 'ipdRatio', 'eyeSeparationRatio', 'canthalTilt', 'fwfhRatio', 'noseWidthRatio', 'mouthToNoseWidthRatio', 'bigonialWidthRatio', 'cheekboneProminence', 'skinQuality', 'facialTension'];

export default function RoadmapTab({ metrics, profileType, gender, expandedMetric, onToggleMetric }: RoadmapTabProps) {
    const flawed = Object.entries(metrics).filter(([key]) => {
        const metricKey = key as keyof MetricScores;

        let isValidForProfile = true;
        if (profileType === 'front' && SIDE_ONLY_METRICS.includes(key)) { isValidForProfile = false; }
        else if (profileType === 'side' && FRONT_ONLY_METRICS.includes(key)) { isValidForProfile = false; }

        if (!isValidForProfile) return false;

        const val = metrics[metricKey];
        if (val === undefined) return false;

        const rating = getRating(metricKey, val, gender);
        return rating.color.includes('orange') || rating.color.includes('red');
    });

    if (flawed.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center space-y-3 p-6">
                <div className="text-3xl">🏆</div>
                <p className="text-zinc-400 text-sm">No major flaws detected. Your metrics are looking solid!</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-5 mt-2">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🚀</span>
                <h3 className="text-sm font-bold text-amber-400">Your PSL Boost Roadmap</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                The following metrics are impacting your score the most. Click any item to see specific steps you can take.
            </p>
            <div className="space-y-2">
                {flawed.map(([key]) => {
                    const val = metrics[key as keyof MetricScores];
                    if (val === undefined) return null;

                    const explanation = metricExplanations[key];
                    const rating = getRating(key as keyof MetricScores, val, gender);
                    const isBad = rating.color.includes('red');
                    return (
                        <button
                            key={key}
                            onClick={() => onToggleMetric(expandedMetric === key ? null : key)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 hover:bg-amber-950/10 transition-all text-left"
                        >
                            <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${isBad ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {isBad ? 'FIX' : 'IMPROVE'}
                            </span>
                            <span className="text-sm text-zinc-200 font-medium">{explanation?.title || key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <svg className="w-3.5 h-3.5 text-zinc-600 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
