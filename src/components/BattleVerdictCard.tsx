'use client';

import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { ScanResult } from '@/types';

interface BattleVerdictCardProps {
    userResult: ScanResult;
    challengerData: any;
    userUsername: string;
}

export default function BattleVerdictCard({ userResult, challengerData, userUsername }: BattleVerdictCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    const metrics = [
        { label: 'Canthal Tilt', user: userResult.metrics.periorbital.canthalTilt.average, challenger: challengerData.canthal_tilt, unit: '°', higherIsBetter: true },
        { label: 'fWHR', user: userResult.metrics.midface.fWHR, challenger: challengerData.fwhr, unit: '', higherIsBetter: true },
        { label: 'Symmetry', user: userResult.metrics.symmetry.overallSymmetry, challenger: challengerData.symmetry, unit: '%', higherIsBetter: true },
        { label: 'Midface', user: userResult.metrics.midface.midfaceRatio, challenger: challengerData.midface_ratio, unit: '', higherIsBetter: false }, // Lower midface ratio is often preferred
    ];

    const userWins = metrics.filter(m => {
        if (m.higherIsBetter) return m.user > m.challenger;
        return m.user < m.challenger;
    }).length;

    const challengerWins = metrics.length - userWins;
    const verdict = userWins > challengerWins ? `${userUsername} MOGS` : `${challengerData.username} MOGS`;
    const subVerdict = userWins > challengerWins ? `Won ${userWins} of ${metrics.length} metrics` : `Won ${challengerWins} of ${metrics.length} metrics`;

    const handleShare = async () => {
        if (!cardRef.current) return;
        try {
            const canvas = await html2canvas(cardRef.current, { backgroundColor: '#000000', scale: 3 });
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], 'mog-battle.png', { type: 'image/png' });
                if (navigator.canShare?.({ files: [file] })) {
                    await navigator.share({
                        title: 'MOG BATTLE VERDICT',
                        text: `Mog Battle: ${userUsername} vs ${challengerData.username}. Verdict: ${verdict}`,
                        files: [file]
                    });
                }
            });
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-[400px]">
            <div 
                ref={cardRef}
                className="w-full bg-[#050505] border-4 border-zinc-800 p-8 font-black text-white relative overflow-hidden rounded-sm"
            >
                {/* Header */}
                <div className="text-center space-y-1 mb-8">
                    <div className="text-[14px] tracking-[0.5em] text-white">⚔️ MOG BATTLE</div>
                    <div className="text-[8px] tracking-[0.3em] text-zinc-600">CHADSOLUTIONS.APP</div>
                </div>

                {/* Main Battle Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="text-center space-y-2">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{challengerData.username}</div>
                        <div className="text-4xl tracking-tighter">{challengerData.psl_score.toFixed(2)}</div>
                        <div className="text-[8px] text-zinc-600 uppercase tracking-widest">{challengerData.tier}</div>
                    </div>
                    <div className="text-center space-y-2 border-l border-zinc-800">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{userUsername}</div>
                        <div className="text-4xl tracking-tighter">{userResult.psl.overall.toFixed(2)}</div>
                        <div className="text-[8px] text-zinc-600 uppercase tracking-widest">{userResult.psl.tier}</div>
                    </div>
                </div>

                {/* Metrics Comparison */}
                <div className="space-y-4 border-t border-zinc-900 pt-6">
                    {metrics.map(m => {
                        const userWon = m.higherIsBetter ? m.user > m.challenger : m.user < m.challenger;
                        return (
                            <div key={m.label} className="grid grid-cols-3 items-center text-[10px] tracking-widest">
                                <div className={`text-left ${!userWon ? 'text-white' : 'text-zinc-600'}`}>
                                    {m.challenger.toFixed(m.unit === '%' ? 1 : 2)}{m.unit} {!userWon && '✓'}
                                </div>
                                <div className="text-center text-zinc-500 uppercase text-[8px]">{m.label}</div>
                                <div className={`text-right ${userWon ? 'text-white' : 'text-zinc-600'}`}>
                                    {userWon && '✓'} {m.user.toFixed(m.unit === '%' ? 1 : 2)}{m.unit}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Verdict Section */}
                <div className="mt-10 pt-8 border-t-2 border-white/10 text-center space-y-1">
                    <div className="text-2xl italic tracking-tighter uppercase">{verdict}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{subVerdict}</div>
                </div>
            </div>

            <button 
                onClick={handleShare}
                className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-zinc-200 transition-all uppercase tracking-[0.2em] text-xs"
            >
                Share Verdict Card
            </button>
        </div>
    );
}
