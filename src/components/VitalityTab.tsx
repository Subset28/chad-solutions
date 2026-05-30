'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MetricReport } from '@/utils/metrics';
import { analyzeShadowProjection } from '@/utils/lighting';
import { RadarChart } from './RadarChart';

interface VitalityTabProps {
    metrics: MetricReport;
}

const StatCard = ({ label, value, sub, color }: { label: string, value: string | number, sub: string, color: string }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-dark border border-zinc-800 p-4 rounded-2xl flex flex-col items-center text-center group hover:bg-white/[0.02] transition-all"
    >
        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-zinc-400">{label}</div>
        <div className={`text-2xl font-black tracking-tight ${color}`}>{value}</div>
        <div className="text-zinc-600 text-[9px] mt-1 font-medium">{sub}</div>
    </motion.div>
);

export default function VitalityTab({ metrics }: VitalityTabProps) {
    if (!metrics.vitality) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center glass rounded-3xl border border-zinc-800">
                <div className="text-4xl mb-4 animate-pulse">!</div>
                <h3 className="text-white font-bold mb-2">Calculating vitality index...</h3>
                <p className="text-zinc-500 text-sm max-w-xs">Biological age and skin health metrics require high-confidence landmark visibility.</p>
            </div>
        );
    }

    const { vitalityScore, biologicalAgeDelta, eyeAperture, collagenIndex } = metrics.vitality;

    const lighting = analyzeShadowProjection({
        orbitalRimProtrusion: metrics.periorbital.orbitalRimProtrusion.average,
        infraorbitalRimPosition: metrics.periorbital.infraorbitalRimPosition,
        cheekboneProminence: metrics.midface.noseWidthRatio,
    });

    const radarData = [
        { label: 'Ocular', value: eyeAperture },
        { label: 'Collagen', value: collagenIndex },
        { label: 'Health', value: Math.max(0, 100 - biologicalAgeDelta * 5) },
        { label: 'Tension', value: (1 - metrics.skin.tension / 100) * 100 },
        { label: 'Symmetry', value: metrics.symmetry.overallSymmetry },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="relative glass border border-zinc-800 rounded-3xl p-8 overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Wellness Snapshot</span>
                    </div>

                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter">
                            {vitalityScore}%
                            <span className="text-sm font-medium text-zinc-500 ml-2 tracking-normal italic">Vitality</span>
                        </h2>
                        <p className="text-zinc-400 text-xs mt-2 leading-relaxed max-w-sm">
                            Your biological age is estimated at <span className="text-cyan-400 font-bold">{Math.abs(biologicalAgeDelta).toFixed(1)} years {biologicalAgeDelta < 0 ? 'younger' : 'older'}</span> than your chronological average based on skin homogeneity and structural support.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</span>
                            <span className={`text-xs font-black uppercase ${vitalityScore > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {vitalityScore > 80 ? 'Strong Recovery' : 'Needs Improvement'}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-zinc-800" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Delta</span>
                            <span className="text-xs font-black text-white">{biologicalAgeDelta > 0 ? '+' : ''}{biologicalAgeDelta} Years</span>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500/10 blur-[60px] rounded-full animate-pulse" />
                    <RadarChart data={radarData} size={220} color="rgba(34, 211, 238, 0.7)" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <StatCard
                    label="Ocular Clarity"
                    value={`${eyeAperture}%`}
                    sub="Eye opening audit"
                    color="text-cyan-400"
                />
                <StatCard
                    label="Collagen Index"
                    value={`${collagenIndex}%`}
                    sub="Skin texture and clarity"
                    color="text-blue-400"
                />
                <StatCard
                    label="Facial Tension"
                    value={metrics.skin.tension.toFixed(2)}
                    sub="Expression fatigue"
                    color="text-purple-400"
                />
                <StatCard
                    label="Symmetry Index"
                    value={metrics.symmetry.overallSymmetry.toFixed(1)}
                    sub="Bilateral balance"
                    color="text-emerald-400"
                />
            </div>

            <div className="glass-dark border border-zinc-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
                        <span className="text-amber-400">*</span> Lighting and Posture
                    </h4>
                    <span className="text-[9px] text-zinc-600 font-bold uppercase border border-zinc-800 px-2 py-0.5 rounded">Lighting Analysis</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-zinc-800/50">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Optimal Angle</span>
                        <span className="text-sm font-black text-amber-400">{lighting.optimalAngle}</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-zinc-800/50">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Vulnerability</span>
                        <span className={`text-sm font-black ${lighting.shadowVulnerability.orbital === 'high' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {lighting.shadowVulnerability.orbital === 'high' ? 'High shadow sensitivity' : 'Resilient'}
                        </span>
                    </div>
                </div>

                <p className="text-zinc-500 text-[10px] leading-relaxed italic bg-black/20 p-3 rounded-xl border border-zinc-800/50">
                    Based on your infraorbital rim position ({metrics.periorbital.infraorbitalRimPosition.toFixed(2)}), overhead lighting is more likely to deepen under-eye shadows. Use broad, frontal light when taking photos.
                </p>
            </div>

            <div className="glass-dark border border-zinc-800 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
                        <span className="text-blue-400">*</span> Midface and Jaw Support
                    </h4>
                    <span className="text-[9px] text-zinc-600 font-bold uppercase border border-zinc-800 px-2 py-0.5 rounded">Structure Review</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/30 p-4 rounded-2xl border border-zinc-800/50 text-center">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Palate Width Proxy</p>
                        <p className="text-xl font-black text-white">{metrics.midface.mouthToNoseWidthRatio.toFixed(2)}</p>
                        <p className="text-[8px] text-zinc-600 uppercase mt-1">Inter-alar ratio</p>
                    </div>
                    <div className="bg-black/30 p-4 rounded-2xl border border-zinc-800/50 text-center">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Jaw Definition</p>
                        <p className="text-xl font-black text-white">{metrics.jawline.gonialAngle.average.toFixed(1)} deg</p>
                        <p className="text-[8px] text-zinc-600 uppercase mt-1">Gonial sharpness</p>
                    </div>
                    <div className="bg-black/30 p-4 rounded-2xl border border-zinc-800/50 text-center">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Maxillary Growth</p>
                        <p className={`text-xl font-black ${metrics.midface.maxillaryProtrusion > 0.05 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {metrics.midface.maxillaryProtrusion > 0.05 ? 'STRONG' : metrics.midface.maxillaryProtrusion > 0.02 ? 'MODERATE' : 'LIMITED'}
                        </p>
                        <p className="text-[8px] text-zinc-600 uppercase mt-1">Forward projection</p>
                    </div>
                </div>

                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Development Notes</p>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                        Midface compactness ({metrics.midface.midfaceRatio.toFixed(2)}) helps determine whether the face reads short, balanced, or long. Consistent tongue posture and nasal breathing may help preserve development during growth years.
                    </p>
                </div>
            </div>

            <div className="glass-dark border border-zinc-800 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
                        <span className="text-emerald-400">*</span> Skin and Styling
                    </h4>
                    <span className="text-[9px] text-zinc-600 font-bold uppercase border border-zinc-800 px-2 py-0.5 rounded">Lifestyle Review</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className="bg-black/30 p-4 rounded-2xl border border-zinc-800/50">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Eyebrow Contrast</p>
                            <div className="flex items-center gap-3">
                                <div className="h-2 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${metrics.skin.eyebrowContrast}%` }} />
                                </div>
                                <span className="text-xs font-black text-white">{metrics.skin.eyebrowContrast > 70 ? 'HIGH' : 'LOW'}</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 mt-2 uppercase tracking-tighter italic">Higher contrast makes features read more clearly in photos.</p>
                        </div>
                        <div className="bg-black/30 p-4 rounded-2xl border border-zinc-800/50">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Skin Homogeneity</p>
                            <div className="flex items-center gap-3">
                                <div className="h-2 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500" style={{ width: `${collagenIndex}%` }} />
                                </div>
                                <span className="text-xs font-black text-white">{collagenIndex > 80 ? 'IDEAL' : 'LOW'}</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 mt-2 uppercase tracking-tighter italic">Uniform skin tone and texture improve overall visual quality.</p>
                        </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Style Suggestions</p>
                        <ul className="space-y-2">
                            {[
                                'Keep eyebrow shape tidy and consistent for cleaner framing.',
                                'Reduce redness and inflammation to improve skin clarity.',
                                'Choose hair color and styling that complement your skin tone and contrast level.',
                            ].map((rec, i) => (
                                <li key={i} className="text-xs text-zinc-300 flex gap-2">
                                    <span className="text-emerald-500">-</span> {rec}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
