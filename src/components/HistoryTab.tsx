'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Calendar, TrendingUp } from 'lucide-react';
import { deleteScan, getAllScans, StoredScan } from '@/lib/scanHistory';

function StatCard({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-black tracking-tighter text-white">{value}</p>
        </div>
    );
}

export default function HistoryTab() {
    const [scans, setScans] = useState<StoredScan[]>([]);
    const [loading, setLoading] = useState(true);

    const loadScans = useCallback(async () => {
        try {
            const data = await getAllScans();
            setScans(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadScans();
    }, [loadScans]);

    const summary = useMemo(() => {
        const best = scans[0];
        const latest = scans.at(-1);

        return {
            total: scans.length.toString(),
            best: best ? best.psl.toFixed(2) : '--',
            latest: latest ? latest.psl.toFixed(2) : '--',
        };
    }, [scans]);

    const handleDelete = async (id: string) => {
        if (confirm('Delete this scan from history?')) {
            await deleteScan(id);
            await loadScans();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (scans.length === 0) {
        return (
            <div className="text-center py-20 px-6 glass border border-zinc-800 rounded-[2.5rem]">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-800">
                    <Calendar className="w-8 h-8 text-zinc-600" />
                </div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">No Scans Found</h3>
                <p className="text-zinc-500 text-sm max-w-xs mx-auto leading-relaxed">
                    Your face-scan history is stored locally on this device. Start a scan to begin your journey.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Ascension Timeline</h3>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{scans.length} scans total</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard label="Total scans" value={summary.total} />
                <StatCard label="Best PSL" value={summary.best} />
                <StatCard label="Latest PSL" value={summary.latest} />
            </div>

            <div className="space-y-3">
                {scans.map((scan, idx) => (
                    <motion.div
                        key={scan.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass-dark border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 overflow-hidden shrink-0">
                                {scan.thumbnailBase64 ? (
                                    <img src={scan.thumbnailBase64} alt="Scan thumbnail" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[10px] font-black text-zinc-700">{scan.psl.toFixed(1)}</span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <span className="text-lg font-black text-white">{scan.psl.toFixed(2)}</span>
                                    <span
                                        className={`text-[8px] font-black px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-tighter ${
                                            scan.tier.includes('Elite') ? 'text-indigo-400' : 'text-zinc-400'
                                        }`}
                                    >
                                        {scan.tier}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <span>{new Date(scan.timestamp).toLocaleDateString()}</span>
                                    <span>|</span>
                                    <span className="text-zinc-600 italic">{scan.phenotype}</span>
                                    <span>|</span>
                                    <span className="text-zinc-600">{scan.nwScale}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDelete(scan.id)}
                                className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                                aria-label={`Delete scan from ${new Date(scan.timestamp).toLocaleDateString()}`}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
