'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { track } from '@/lib/analytics';

interface LeaderboardEntry {
    id: string;
    psl_score: number;
    tier: string;
    username: string;
    created_at: string;
}

export default function LeaderboardTab() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        track('leaderboard_viewed');
        const fetchLeaderboard = async () => {
            try {
                const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
                
                const { data, error } = await supabase
                    .from('battle_challenges')
                    .select('id, psl_score, tier, username, created_at')
                    .eq('week_number', currentWeek)
                    .order('psl_score', { ascending: false })
                    .limit(50);

                if (error) throw error;
                setEntries(data || []);
            } catch (err) {
                console.error('Failed to fetch leaderboard:', err);
            } finally {
                setIsLoading(false);
            }
        };

        const updateCountdown = () => {
            const now = new Date();
            const nextSunday = new Date();
            nextSunday.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay()) % 7);
            nextSunday.setUTCHours(23, 59, 59, 999);
            
            const diff = nextSunday.getTime() - now.getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diff / (1000 * 60)) % 60);
            
            setTimeLeft(`${days}d ${hours}h ${mins}m`);
        };

        fetchLeaderboard();
        updateCountdown();
        const timer = setInterval(updateCountdown, 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full max-w-lg mx-auto p-6 space-y-8 pb-32">
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-black italic tracking-tighter uppercase">Weekly Rankings</h2>
                <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[10px] text-zinc-500 font-black tracking-[0.3em] uppercase">Resets in {timeLeft}</p>
                </div>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    [...Array(10)].map((_, i) => (
                        <div key={i} className="h-20 bg-zinc-900/50 animate-pulse rounded-2xl border border-zinc-800" />
                    ))
                ) : entries.length === 0 ? (
                    <div className="text-center py-20 space-y-4">
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">No entries this week yet</p>
                        <p className="text-[10px] text-zinc-700 tracking-[0.2em] uppercase">Be the first to claim #1</p>
                    </div>
                ) : (
                    entries.map((entry, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={entry.id}
                            className={`flex items-center justify-between p-5 rounded-2xl border ${
                                i < 3 ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'bg-zinc-900/50 border-zinc-800 text-white'
                            }`}
                        >
                            <div className="flex items-center gap-5">
                                <span className={`text-2xl font-black w-10 ${i < 3 ? 'text-black' : 'text-zinc-700'}`}>
                                    {i + 1}
                                </span>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-black uppercase tracking-tight ${i < 3 ? 'text-black' : 'text-white'}`}>
                                        {entry.username}
                                    </span>
                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${i < 3 ? 'text-black/40' : 'text-zinc-600'}`}>
                                        ID: {entry.id.substring(0, 6)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black tracking-tighter leading-none">{entry.psl_score.toFixed(2)}</div>
                                <div className={`text-[8px] font-black uppercase tracking-widest mt-1 ${i < 3 ? 'text-black/60' : 'text-zinc-500'}`}>
                                    {entry.tier}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="text-center pt-8 opacity-40">
                <p className="text-[9px] text-zinc-600 font-black tracking-widest uppercase">Verified Biometric Audit • {new Date().getFullYear()}</p>
            </div>
        </div>
    );
}
