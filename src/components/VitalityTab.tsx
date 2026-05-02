import React from 'react';
import { motion } from 'framer-motion';
import { MetricScores } from '@/utils/geometry';
import { analyzeShadowProjection } from '@/utils/lighting';

interface VitalityTabProps {
    metrics: MetricScores;
}

export default function VitalityTab({ metrics }: VitalityTabProps) {
    if (!metrics.vitality) return null;

    const { vitalityScore, biologicalAgeDelta, sleepScore, collagenIndex } = metrics.vitality;
    
    const lighting = analyzeShadowProjection({
        orbitalRimProtrusion: metrics.orbitalRimProtrusion,
        infraorbitalRimPosition: metrics.infraorbitalRimPosition,
        cheekboneProminence: metrics.cheekboneProminence
    });

    const StatCard = ({ label, value, sub, color }: { label: string, value: string | number, sub: string, color: string }) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-xl"
        >
            <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-white/30 text-[10px] mt-1">{sub}</div>
        </motion.div>
    );

    return (
        <div className="space-y-6">
            <div className="relative h-48 flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full" />
                <div className="relative text-center">
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-cyan-400">
                        {vitalityScore}%
                    </div>
                    <div className="text-white/40 text-xs font-bold uppercase tracking-widest mt-2">Global Vitality Index</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <StatCard 
                    label="Biological Age" 
                    value={`${biologicalAgeDelta > 0 ? '+' : ''}${biologicalAgeDelta}`} 
                    sub="Years vs Chronological"
                    color={biologicalAgeDelta < 0 ? "text-green-400" : "text-amber-400"}
                />
                <StatCard 
                    label="Collagen Density" 
                    value={`${collagenIndex}%`} 
                    sub="Nasolabial Elasticity"
                    color="text-blue-400"
                />
                <StatCard 
                    label="Ocular Health" 
                    value={`${sleepScore}%`} 
                    sub="Scleral Clarity Audit"
                    color="text-cyan-400"
                />
                <StatCard 
                    label="Phenotype" 
                    value={metrics.phenotype?.toUpperCase() || 'GENERIC'} 
                    sub="Genetic Cluster Detection"
                    color="text-purple-400"
                />
            </div>

            <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-white/10 p-6 rounded-3xl space-y-4">
                <h4 className="text-white font-bold flex items-center gap-2">
                    <span className="text-amber-400">🌗</span> Environment Mastery
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-2xl p-4">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Optimal Lighting</span>
                        <span className="text-sm font-black text-amber-400">{lighting.optimalAngle}</span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Shadow Vulnerability</span>
                        <span className={`text-sm font-black ${lighting.shadowVulnerability.orbital === 'high' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {lighting.shadowVulnerability.orbital === 'high' ? 'High (Under-eye)' : 'Optimized'}
                        </span>
                    </div>
                </div>

                <p className="text-white/50 text-[11px] leading-relaxed italic">
                    Based on your infraorbital rim position ({metrics.infraorbitalRimPosition.toFixed(1)}mm), you are highly sensitive to top-down shadows. Prioritize broad-spectrum frontal lighting to eliminate negative vector casting.
                </p>
            </div>
        </div>
    );
}
