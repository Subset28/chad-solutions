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
    thumbnail?: string;
    variant?: 'clean' | 'full';
}

export default function TierCard({ metrics, pslScore, tier, percentile, thumbnail, variant = 'full' }: TierCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleShare = async () => {
        if (!cardRef.current) return;
        
        try {
            const canvas = await html2canvas(cardRef.current, { 
                backgroundColor: '#000000', 
                scale: 3, // High res
                useCORS: true 
            });
            
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], 'omnisight-card.png', { type: 'image/png' });
                
                if (navigator.canShare?.({ files: [file] })) {
                    await navigator.share({
                        title: `PSL ${pslScore.toFixed(2)} — ${tier}`,
                        text: `Rate my aesthetics on OmniSight. PSL: ${pslScore.toFixed(2)} (${tier})\nomnisight.app`,
                        files: [file]
                    });
                } else {
                    const link = document.createElement('a');
                    link.download = `omnisight-psl-${pslScore.toFixed(2)}.png`;
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
        const percent = ((val - min) / (max - min)) * 100;
        return Math.min(100, Math.max(5, percent));
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-[400px]">
            {/* The actual card */}
            <div 
                ref={cardRef}
                className="w-full bg-[#050505] border-4 border-zinc-800 p-6 font-black text-white relative overflow-hidden shadow-[0_0_80px_rgba(255,255,255,0.05)] rounded-sm"
                style={{ aspectRatio: '1 / 1.4' }}
            >
                {/* Holographic Overlays */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />
                
                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-0.5">
                            <div className="text-[14px] tracking-[0.4em] text-white">OMNISIGHT</div>
                            <div className="text-[8px] tracking-[0.6em] text-zinc-600">SKELETAL AUDIT V1.0</div>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">
                            <span className="text-[10px] text-zinc-400">UID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Main Image & Score Area */}
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="relative aspect-square w-full bg-zinc-900 border border-zinc-800 overflow-hidden group">
                            {thumbnail ? (
                                <img src={thumbnail} alt="Scan" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-10">👤</div>
                            )}
                            <div className="absolute inset-0 border-[16px] border-black/20 pointer-events-none" />
                            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-4 py-2 border border-white/10">
                                <div className="text-3xl tracking-tighter">{pslScore.toFixed(2)}</div>
                                <div className="text-[8px] text-zinc-500 text-center -mt-1 tracking-widest">PSL INDEX</div>
                            </div>
                        </div>

                        <div className="text-center">
                            <h2 className="text-4xl tracking-tighter leading-none mb-1 italic">{tier}</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em]">
                                RANK: TOP {(100 - percentile).toFixed(1)}% MALE
                            </p>
                        </div>

                        {variant === 'full' && (
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                {displayMetrics.map(m => {
                                    const val = flat[m.key];
                                    return (
                                        <div key={m.key} className="space-y-1">
                                            <div className="flex justify-between text-[8px] text-zinc-500 tracking-widest">
                                                <span>{m.label}</span>
                                                <span className="text-white">{typeof val === 'number' ? (m.key.includes('Angle') || m.key.includes('Tilt') ? `${val.toFixed(1)}°` : val.toFixed(2)) : 'N/A'}</span>
                                            </div>
                                            <div className="h-[2px] w-full bg-zinc-900">
                                                <div 
                                                    className="h-full bg-white" 
                                                    style={{ width: `${getBarWidth(m.key, val, m.min, m.max)}%` }} 
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-zinc-800/50 flex justify-between items-end">
                        <div className="space-y-1">
                            <div className="text-[8px] text-zinc-600 tracking-[0.3em]">PHENOTYPE</div>
                            <div className="text-[10px] text-zinc-400 truncate w-32">{metrics.community?.phenotype || 'ROBUST'}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-zinc-500 tracking-[0.2em]">OMNISIGHT.APP</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
                <button 
                    onClick={handleShare}
                    className="flex-1 bg-white text-black font-black py-4 rounded-xl hover:bg-zinc-200 transition-all uppercase tracking-widest text-xs shadow-xl active:scale-95"
                >
                    Share Card
                </button>
                <button 
                    onClick={handleShare}
                    className="flex-1 bg-zinc-900 text-white font-black py-4 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-all uppercase tracking-widest text-xs active:scale-95"
                >
                    Save Image
                </button>
            </div>
        </div>
    );
}
