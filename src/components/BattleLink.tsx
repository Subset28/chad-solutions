'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ScanResult } from '@/types';
import { getOrCreateUsername } from '@/lib/username';

interface BattleLinkProps {
    result: ScanResult;
}

export default function BattleLink({ result }: BattleLinkProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [battleUrl, setBattleUrl] = useState<string | null>(null);

    const generateBattleLink = async () => {
        setIsGenerating(true);
        try {
            const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
            
            const { error } = await supabase
                .from('battle_challenges')
                .insert({
                    id: result.id,
                    username: getOrCreateUsername(),
                    psl_score: result.psl.overall,
                    tier: result.psl.tier,
                    percentile: result.psl.percentile,
                    phenotype: result.metrics.community?.phenotype,
                    canthal_tilt: result.metrics.periorbital.canthalTilt.average,
                    fwhr: result.metrics.midface.fWHR,
                    symmetry: result.metrics.symmetry.overallSymmetry,
                    midface_ratio: result.metrics.midface.midfaceRatio,
                    gonial_angle: result.metrics.jawline.gonialAngle.average,
                    week_number: currentWeek
                });

            if (error) throw error;

            const url = `${window.location.origin}/compare/${result.id}`;
            setBattleUrl(url);

            if (navigator.share) {
                await navigator.share({
                    title: 'PSL Battle Challenge',
                    text: `Think you're more aesthetic? My PSL is ${result.psl.overall.toFixed(2)}. Beat me here:`,
                    url: url
                });
            }
        } catch (err) {
            console.error('Battle link generation failed:', err);
            alert("Failed to generate link. Supabase might not be configured.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-3">
            <button
                onClick={generateBattleLink}
                disabled={isGenerating}
                className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
            >
                {isGenerating ? (
                    <span className="animate-pulse">Generating Battle Link...</span>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Challenge A Friend
                    </>
                )}
            </button>
            {battleUrl && (
                <div className="text-[9px] text-zinc-500 text-center font-mono break-all px-4">
                    {battleUrl}
                </div>
            )}
        </div>
    );
}
