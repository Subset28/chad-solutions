'use client';

import React, { useRef } from 'react';
import { MetricReport, flattenMetrics } from '@/utils/metrics';
import { getRating } from '@/utils/ratings';
import html2canvas from 'html2canvas';

interface TierCardProps {
    metrics: MetricReport;
    pslScore: number;
    tier: string;
}

export default function TierCard({ metrics, pslScore, tier }: TierCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        const canvas = await html2canvas(cardRef.current, {
            backgroundColor: '#000000',
            scale: 2,
        });
        const link = document.createElement('a');
        link.download = `omnisight-audit-${pslScore}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const flat = flattenMetrics(metrics);
    const displayMetrics = [
        { key: 'canthalTilt', label: 'CANTHAL TILT' },
        { key: 'fWHR', label: 'fWHR' },
        { key: 'overallSymmetry', label: 'SYMMETRY' },
        { key: 'gonialAngle', label: 'GONIAL ANGLE' },
    ];

    return (
        <div className="flex flex-col items-center gap-4">
            {/* The actual card that gets captured */}
            <div 
                ref={cardRef}
                className="w-[350px] bg-black border-2 border-zinc-800 p-8 font-mono text-white relative overflow-hidden"
            >
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                
                <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                        <span className="text-[10px] font-black tracking-[0.3em] text-zinc-500">⬡ OMNISIGHT AUDIT</span>
                        <span className="text-[10px] font-black text-zinc-500 italic">v1.0.4</span>
                    </div>

                    <div className="text-center py-4">
                        <div className="text-5xl font-black tracking-tighter mb-1">PSL: {pslScore.toFixed(1)}</div>
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-2 w-48 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                <div 
                                    className="h-full bg-white transition-all duration-1000" 
                                    style={{ width: `${(pslScore / 10) * 100}%` }} 
                                />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{tier}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-widest">
                            Top {(100 - (pslScore / 10) * 100).toFixed(1)}% Male Aesthetic
                        </p>
                    </div>

                    <div className="space-y-4">
                        {displayMetrics.map(m => {
                            const val = flat[m.key];
                            const rating = getRating(m.key as any, val, 'male');
                            return (
                                <div key={m.key} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-black text-zinc-500">
                                        <span>{m.label}</span>
                                        <span>{typeof val === 'number' ? (m.key.includes('Angle') || m.key.includes('Tilt') ? `${val.toFixed(1)}°` : val.toFixed(2)) : 'N/A'}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-zinc-400" 
                                            style={{ width: `${Math.min(100, (val / (m.key.includes('Angle') ? 140 : 2)) * 100)}%` }} 
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-6">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">PHENOTYPE</span>
                            <div className="text-xs font-bold text-white uppercase truncate">{metrics.community.phenotype}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">NW SCALE</span>
                            <div className="text-xs font-bold text-white uppercase">{metrics.community.nwScale}</div>
                        </div>
                    </div>

                    <div className="text-center pt-4 border-t border-zinc-800/50">
                        <span className="text-[10px] font-black text-zinc-600 tracking-[0.2em]">OMNISIGHT.APP</span>
                    </div>
                </div>
            </div>

            <button 
                onClick={handleDownload}
                className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-colors uppercase tracking-widest text-sm flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Save Tier Card
            </button>
        </div>
    );
}
