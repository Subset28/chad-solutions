'use client';

import React, { useRef } from 'react';
import { MetricReport, flattenMetrics } from '@/utils/metrics';
import { getRating } from '@/utils/ratings';
import html2canvas from 'html2canvas';

interface TierCardProps {
    metrics: MetricReport;
    pslScore: number;
    tier: string;
    percentile: number;
}

export default function TierCard({ metrics, pslScore, tier, percentile }: TierCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleShare = async () => {
        if (!cardRef.current) return;
        
        try {
            const canvas = await html2canvas(cardRef.current, { 
                backgroundColor: '#000000', 
                scale: 2,
                useCORS: true 
            });
            
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], 'omnisight-audit.png', { type: 'image/png' });
                
                // Mobile: native share sheet
                if (navigator.canShare?.({ files: [file] })) {
                    await navigator.share({
                        title: `PSL ${pslScore.toFixed(1)} — OmniSight Audit`,
                        text: `Just ran my face through OmniSight. PSL: ${pslScore.toFixed(1)} (${tier})\nomnisight.app`,
                        files: [file]
                    });
                } else {
                    // Desktop: download
                    const link = document.createElement('a');
                    link.download = `omnisight-psl-${pslScore.toFixed(1)}.png`;
                    link.href = URL.createObjectURL(blob);
                    link.click();
                }
            });
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    const flat = flattenMetrics(metrics);
    const displayMetrics = [
        { key: 'canthalTilt', label: 'CANTHAL TILT', min: -5, max: 15 },
        { key: 'fWHR', label: 'fWHR', min: 1.5, max: 2.3 },
        { key: 'overallSymmetry', label: 'SYMMETRY', min: 50, max: 100 },
        { key: 'gonialAngle', label: 'GONIAL ANGLE', min: 100, max: 150 },
    ];

    const getBarWidth = (key: string, val: number, min: number, max: number) => {
        // For angles like gonial, lower is often "sharper" but within range
        // For canthal, higher is usually better in community meta
        const percent = ((val - min) / (max - min)) * 100;
        return Math.min(100, Math.max(5, percent));
    };

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
                            Top {(100 - percentile).toFixed(1)}% Male Aesthetic
                        </p>
                    </div>

                    <div className="space-y-4">
                        {displayMetrics.map(m => {
                            const val = flat[m.key];
                            return (
                                <div key={m.key} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-black text-zinc-500">
                                        <span>{m.label}</span>
                                        <span>{typeof val === 'number' ? (m.key.includes('Angle') || m.key.includes('Tilt') ? `${val.toFixed(1)}°` : val.toFixed(2)) : 'N/A'}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-zinc-400" 
                                            style={{ width: `${getBarWidth(m.key, val, m.min, m.max)}%` }} 
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-6">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">PHENOTYPE</span>
                            <div className="text-xs font-bold text-white uppercase truncate">{metrics.community?.phenotype || 'ANALYZING...'}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">NW SCALE</span>
                            <div className="text-xs font-bold text-white uppercase">{metrics.community?.nwScale || 'NW1'}</div>
                        </div>
                    </div>

                    <div className="text-center pt-4 border-t border-zinc-800/50">
                        <span className="text-[10px] font-black text-zinc-600 tracking-[0.2em]">OMNISIGHT.APP</span>
                    </div>
                </div>
            </div>

            <button 
                onClick={handleShare}
                className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-colors uppercase tracking-widest text-sm flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                Share Tier Card
            </button>
        </div>
    );
}
