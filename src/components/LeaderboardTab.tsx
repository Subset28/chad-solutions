'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
    id: string;
    psl_score: number;
    tier: string;
    created_at: string;
}

export default function LeaderboardTab() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const { data, error } = await supabase
                    .from('scans')
                    .select('id, psl_score, tier, created_at')
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
        fetchLeaderboard();
    }, []);

    return (
        <div className="w-full max-w-lg mx-auto p-6 space-y-8 pb-32">
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-black italic tracking-tighter uppercase">Global Rankings</h2>
                <p className="text-[10px] text-zinc-500 font-black tracking-[0.4em] uppercase">The Genetic Lottery</p>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    [...Array(10)].map((_, i) => (
                        <div key={i} className="h-16 bg-zinc-900/50 animate-pulse rounded-2xl" />
                    ))
                ) : (
                    entries.map((entry, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={entry.id}
                            className={`flex items-center justify-between p-4 rounded-2xl border ${
                                i < 3 ? 'bg-white text-black border-white' : 'bg-zinc-900/50 border-zinc-800 text-white'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`text-xl font-black w-8 ${i < 3 ? 'text-black' : 'text-zinc-600'}`}>
                                    #{i + 1}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Anonymous User</span>
                                    <span className={`text-sm font-black ${i < 3 ? 'text-black' : 'text-zinc-400'}`}>
                                        ID: {entry.id.substring(0, 8).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black tracking-tighter leading-none">{entry.psl_score.toFixed(2)}</div>
                                <div className={`text-[8px] font-black uppercase tracking-widest ${i < 3 ? 'text-black/60' : 'text-zinc-500'}`}>
                                    {entry.tier}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="text-center py-8">
                <p className="text-[10px] text-zinc-600 font-black tracking-widest uppercase">Resets Weekly • Top 50 Shown</p>
            </div>
        </div>
    );
}
