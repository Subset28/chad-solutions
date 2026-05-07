'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PSLResult } from '@/utils/scoring';
import { MetricReport } from '@/utils/metrics';

interface ScoreRevealProps {
    score: number;
    tier: string;
    metrics: MetricReport;
    onComplete: () => void;
}

// Singleton AudioContext to prevent resource leaks and browser warnings
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
};

export default function ScoreReveal({ score, tier, metrics, onComplete }: ScoreRevealProps) {
    const [count, setCount] = useState(0);
    const [phase, setPhase] = useState<'counting' | 'impact' | 'metrics' | 'complete'>('counting');

    useEffect(() => {
        const playSound = (freq: number, type: OscillatorType = 'sine', duration = 0.1, vol = 0.1) => {
            try {
                const ctx = getAudioContext();
                if (!ctx) return;
                if (ctx.state === 'suspended') ctx.resume();
                
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(vol, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + duration);
            } catch (e) {
                console.warn("Audio context blocked");
            }
        };

        if (phase === 'counting') {
            let start = 0;
            const duration = 2000; // 2 seconds
            const startTime = performance.now();

            const animate = (time: number) => {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out expo
                const currentScore = progress === 1 ? score : score * (1 - Math.pow(2, -10 * progress));
                setCount(currentScore);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    setPhase('impact');
                    playSound(440, 'square', 0.2, 0.15); // Impact sound
                }
            };
            requestAnimationFrame(animate);
        }

        if (phase === 'impact') {
            setTimeout(() => setPhase('metrics'), 800);
        }
        
        if (phase === 'metrics') {
            setTimeout(() => setPhase('complete'), 1500);
        }
    }, [phase, score]);

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
                {phase === 'counting' && (
                    <motion.div 
                        key="counting"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="text-center"
                    >
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-4">Neural Calibration</p>
                        <h2 className="text-9xl font-black tracking-tighter text-white tabular-nums">
                            {count.toFixed(1)}
                        </h2>
                    </motion.div>
                )}

                {(phase === 'impact' || phase === 'metrics' || phase === 'complete') && (
                    <div className="flex flex-col items-center gap-12 w-full max-w-lg">
                        <motion.div
                            initial={{ y: -200, opacity: 0, scale: 2 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150 animate-pulse" />
                            <div className="relative bg-white text-black px-12 py-6 rounded-[2rem] shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                                <h1 className="text-4xl font-black uppercase tracking-tighter italic">{tier}</h1>
                            </div>
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
                            >
                                <span className="text-6xl font-black text-white tracking-tighter">{score.toFixed(2)}</span>
                                <span className="text-zinc-500 text-sm font-bold ml-2">/ 10.0</span>
                            </motion.div>
                        </motion.div>

                        <div className="grid grid-cols-2 gap-4 w-full px-6 mt-12">
                            {[
                                { label: 'Canthal Tilt', val: metrics.periorbital.canthalTilt.average.toFixed(1) + '°' },
                                { label: 'fWHR', val: metrics.midface.fWHR.toFixed(2) },
                                { label: 'Symmetry', val: metrics.symmetry.overallSymmetry.toFixed(1) + '%' },
                                { label: 'Midface', val: metrics.midface.midfaceRatio.toFixed(2) }
                            ].map((m, i) => (
                                <motion.div
                                    key={m.label}
                                    initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                    animate={{ opacity: phase !== 'impact' ? 1 : 0, x: 0 }}
                                    transition={{ delay: 0.8 + (i * 0.1) }}
                                    className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center"
                                >
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{m.label}</span>
                                    <span className="text-sm font-black text-white">{m.val}</span>
                                </motion.div>
                            ))}
                        </div>

                        {phase === 'complete' && (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={onComplete}
                                className="mt-8 px-12 py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-sm rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-all"
                            >
                                Open Full Audit
                            </motion.button>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
