import React from 'react';
import { motion } from 'framer-motion';
import { MetricScores } from '@/utils/geometry';
import { analyzeShadowProjection } from '@/utils/lighting';
import { RadarChart } from './RadarChart';

interface VitalityTabProps {
    metrics: MetricScores;
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
                <div className="text-4xl mb-4 animate-pulse">⚡</div>
                <h3 className="text-white font-bold mb-2">Calculating Vitality Index...</h3>
                <p className="text-zinc-500 text-sm max-w-xs">Biological age and skin health metrics require high-confidence landmark visibility.</p>
            </div>
        );
    }

    const { vitalityScore, biologicalAgeDelta, sleepScore, collagenIndex } = metrics.vitality;
    
    const lighting = analyzeShadowProjection({
        orbitalRimProtrusion: metrics.orbitalRimProtrusion,
        infraorbitalRimPosition: metrics.infraorbitalRimPosition,
        cheekboneProminence: metrics.cheekboneProminence
    });

    const radarData = [
        { label: 'Ocular', value: sleepScore },
        { label: 'Collagen', value: collagenIndex },
        { label: 'Health', value: Math.max(0, 100 - biologicalAgeDelta * 5) },
        { label: 'Skin', value: metrics.skinQuality || 50 },
        { label: 'Tone', value: 80 } // Placeholder
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* VITALITY HERO */}
            <div className="relative glass border border-zinc-800 rounded-3xl p-8 overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                
                <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Systemic Bio-Marker Scan</span>
                    </div>
                    
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter">
                            {vitalityScore}%
                            <span className="text-sm font-medium text-zinc-500 ml-2 tracking-normal italic">Global Vitality</span>
                        </h2>
                        <p className="text-zinc-400 text-xs mt-2 leading-relaxed max-w-sm">
                            Your biological age is estimated at <span className="text-cyan-400 font-bold">{Math.abs(biologicalAgeDelta).toFixed(1)} years {biologicalAgeDelta < 0 ? 'younger' : 'older'}</span> than your chronological average based on skin homogeneity and structural support.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</span>
                            <span className={`text-xs font-black uppercase ${vitalityScore > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {vitalityScore > 80 ? 'Elite Recovery' : 'Optimization Required'}
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
                    value={`${sleepScore}%`} 
                    sub="Scleral Brightness Audit"
                    color="text-cyan-400"
                />
                <StatCard 
                    label="Collagen Index" 
                    value={`${collagenIndex}%`} 
                    sub="Nasolabial Support"
                    color="text-blue-400"
                />
                <StatCard 
                    label="Phenotype" 
                    value={metrics.phenotype?.toUpperCase() || 'GENERIC'} 
                    sub="Genetic Cluster"
                    color="text-purple-400"
                />
                <StatCard 
                    label="Skin Quality" 
                    value={typeof metrics.skinQuality === 'number' ? metrics.skinQuality.toFixed(0) : 'N/A'} 
                    sub="Texture Homogeneity"
                    color="text-emerald-400"
                />
            </div>

            <div className="glass-dark border border-zinc-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
                        <span className="text-amber-400">🌗</span> Environment Mastery
                    </h4>
                    <span className="text-[9px] text-zinc-600 font-bold uppercase border border-zinc-800 px-2 py-0.5 rounded">Shadow Analysis</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-zinc-800/50">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Optimal Angle</span>
                        <span className="text-sm font-black text-amber-400">{lighting.optimalAngle}</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-zinc-800/50">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Vulnerability</span>
                        <span className={`text-sm font-black ${lighting.shadowVulnerability.orbital === 'high' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {lighting.shadowVulnerability.orbital === 'high' ? 'High Shadow' : 'Resilient'}
                        </span>
                    </div>
                </div>

                <p className="text-zinc-500 text-[10px] leading-relaxed italic bg-black/20 p-3 rounded-xl border border-zinc-800/50">
                    Based on your infraorbital rim position ({metrics.infraorbitalRimPosition.toFixed(1)}mm), you are sensitive to overhead lighting which casts "negative vectors". Prioritize broad-spectrum frontal lighting.
                </p>
            </div>
        </div>
    );
}
