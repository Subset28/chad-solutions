'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { ScanResult } from '@/types';
import { track } from '@/lib/analytics';
import { useEffect } from 'react';

interface CompareResultProps {
  userResult: ScanResult;
  challengerData: {
    id: string;
    username: string;
    psl_score: number;
    tier: string;
    percentile: number;
    phenotype: string;
    canthal_tilt: number;
    fwhr: number;
    symmetry: number;
    gonial_angle: number;
  };
  userUsername: string;
}

export default function BattleVerdictCard({ userResult, challengerData, userUsername }: CompareResultProps) {
  const userWins = userResult.psl.overall > challengerData.psl_score;
  
  const metrics = [
    { 
      label: 'Canthal Tilt', 
      user: userResult.metrics.periorbital.canthalTilt.average,
      them: challengerData.canthal_tilt,
      higherWins: true,
      format: (v: number) => `${v.toFixed(1)}°`
    },
    { 
      label: 'fWHR', 
      user: userResult.metrics.midface.fWHR,
      them: challengerData.fwhr,
      higherWins: true,
      format: (v: number) => v.toFixed(2)
    },
    { 
      label: 'Symmetry', 
      user: userResult.metrics.symmetry.overallSymmetry,
      them: challengerData.symmetry,
      higherWins: true,
      format: (v: number) => `${v.toFixed(1)}%`
    },
    { 
      label: 'Gonial', 
      user: userResult.metrics.jawline.gonialAngle.average,
      them: challengerData.gonial_angle,
      higherWins: false, // lower is sharper
      format: (v: number) => `${v.toFixed(1)}°`
    },
  ];

  const userWonMetrics = metrics.filter(m => 
    m.higherWins ? m.user > m.them : m.user < m.them
  ).length;

  useEffect(() => {
    track('comparison_completed', {
      user_psl: userResult.psl.overall,
      challenger_psl: challengerData.psl_score,
      user_won: userWins,
      metrics_won: userWonMetrics
    });
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-8">
      {/* Verdict */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="text-center space-y-2"
      >
        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] font-black">Verdict</p>
        <h1 className={`text-5xl font-black italic tracking-tighter uppercase ${
          userWins ? 'text-white' : 'text-zinc-400'
        }`}>
          {userWins ? 'YOU MOG' : 'YOU GOT MOGGED'}
        </h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
          {userWonMetrics} of 4 metrics won
        </p>
      </motion.div>

      {/* Side by side scores */}
      <div className="w-full max-w-sm flex items-center justify-between gap-4">
        <div className={`flex-1 text-center p-6 rounded-2xl border transition-all ${
          userWins ? 'border-white bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.05)]' : 'border-zinc-800 bg-zinc-900/20'
        }`}>
          <p className="text-[8px] text-zinc-600 uppercase tracking-[0.2em] font-black mb-2">You</p>
          <p className="text-4xl font-black tracking-tighter">{userResult.psl.overall.toFixed(2)}</p>
          <p className="text-[10px] text-zinc-500 font-black uppercase mt-1 tracking-widest">{userResult.psl.tier}</p>
        </div>
        <div className="text-xl text-zinc-800 font-black italic">VS</div>
        <div className={`flex-1 text-center p-6 rounded-2xl border transition-all ${
          !userWins ? 'border-white bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.05)]' : 'border-zinc-800 bg-zinc-900/20'
        }`}>
          <p className="text-[8px] text-zinc-600 uppercase tracking-[0.2em] font-black mb-2">
            @{challengerData.username}
          </p>
          <p className="text-4xl font-black tracking-tighter">{challengerData.psl_score.toFixed(2)}</p>
          <p className="text-[10px] text-zinc-500 font-black uppercase mt-1 tracking-widest">{challengerData.tier}</p>
        </div>
      </div>

      {/* Metric breakdown */}
      <div className="w-full max-w-sm space-y-3 bg-zinc-900/30 p-6 rounded-3xl border border-zinc-800/50">
        {metrics.map(m => {
          const userWinsMetric = m.higherWins ? m.user > m.them : m.user < m.them;
          return (
            <div key={m.label} className="flex items-center gap-4">
              <div className={`flex-1 text-right text-xs font-black tracking-tight ${
                userWinsMetric ? 'text-white' : 'text-zinc-600'
              }`}>
                {m.format(m.user)} {userWinsMetric ? '✓' : ''}
              </div>
              <div className="text-[8px] text-zinc-700 font-black uppercase tracking-[0.2em] w-20 text-center">
                {m.label}
              </div>
              <div className={`flex-1 text-xs font-black tracking-tight ${
                !userWinsMetric ? 'text-white' : 'text-zinc-600'
              }`}>
                {!userWinsMetric ? '✓' : ''} {m.format(m.them)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Card Integration */}
      <div className="w-full max-w-sm">
        <CompareShareCard
          userResult={userResult}
          challenger={challengerData}
          userWins={userWins}
          userWonMetrics={userWonMetrics}
          metrics={metrics}
          userUsername={userUsername}
        />
      </div>
    </div>
  );
}

function CompareShareCard({ userResult, challenger, userWins, metrics, userUsername }: any) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#000000',
      scale: 3,
      useCORS: true
    });

    track('comparison_card_shared', {
        user_psl: userResult.psl.overall,
        user_won: userWins,
    });

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'chad-solutions-battle.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: userWins ? `I mogged ${challenger.username}` : `I got mogged by ${challenger.username}`,
          text: `PSL ${userResult.psl.overall.toFixed(2)} vs ${challenger.psl_score.toFixed(2)} on Chad Solutions`,
          files: [file]
        });
      } else {
        const link = document.createElement('a');
        link.download = 'chad-solutions-battle.png';
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    });
  };

  return (
    <>
      {/* Hidden card for capture */}
      <div ref={cardRef} className="w-[400px] bg-black p-10 font-mono absolute -left-[9999px] border-[8px] border-zinc-900">
        <div className="text-[10px] tracking-[0.6em] text-zinc-600 mb-8 font-bold">⚔ CHAD SOLUTIONS MOG BATTLE</div>
        
        <div className="flex gap-8 mb-10 items-center">
          <div className="flex-1 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 font-bold">{userUsername}</p>
            <p className="text-5xl font-black tracking-tighter text-white">{userResult.psl.overall.toFixed(2)}</p>
            <p className="text-[12px] text-zinc-400 font-bold mt-1 uppercase tracking-widest">{userResult.psl.tier}</p>
          </div>
          <div className="text-zinc-800 font-black text-2xl italic">VS</div>
          <div className="flex-1 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 font-bold">@{challenger.username}</p>
            <p className="text-5xl font-black tracking-tighter text-white">{challenger.psl_score.toFixed(2)}</p>
            <p className="text-[12px] text-zinc-400 font-bold mt-1 uppercase tracking-widest">{challenger.tier}</p>
          </div>
        </div>

        <div className="space-y-2 mb-10">
          {metrics.map((m: any) => {
            const userWinsMetric = m.higherWins ? m.user > m.them : m.user < m.them;
            return (
              <div key={m.label} className="flex justify-between items-center text-[11px] py-2 border-t border-zinc-900/50">
                <span className={`font-black ${userWinsMetric ? 'text-white' : 'text-zinc-700'}`}>
                  {m.format(m.user)} {userWinsMetric ? '✓' : ''}
                </span>
                <span className="text-zinc-600 font-bold tracking-[0.2em] text-[9px]">{m.label.toUpperCase()}</span>
                <span className={`font-black ${!userWinsMetric ? 'text-white' : 'text-zinc-700'}`}>
                  {!userWinsMetric ? '✓ ' : ''}{m.format(m.them)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
          <p className="text-3xl font-black italic tracking-tighter text-white mb-2 uppercase">
            {userWins ? 'MOG CONFIRMED' : 'MOGGED'}
          </p>
          <div className="inline-block px-4 py-1 bg-zinc-900 rounded-full">
            <p className="text-[9px] text-zinc-500 font-black tracking-[0.4em]">CHADSOLUTIONS.APP</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleShare}
        className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-sm rounded-2xl hover:scale-[1.02] transition-all active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
      >
        Share Verdict Card
      </button>
    </>
  );
}
