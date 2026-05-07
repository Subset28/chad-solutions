'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAllScans, StoredScan, deleteScan } from '@/lib/scanHistory';
import { Trash2, Calendar, TrendingUp } from 'lucide-react';

export default function HistoryTab() {
    const [scans, setScans] = useState<StoredScan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadScans();
    }, []);

    const loadScans = async () => {
        const data = await getAllScans();
        setScans(data);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this scan from history?')) {
            await deleteScan(id);
            await loadScans();
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (scans.length === 0) return (
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Ascension Timeline</h3>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{scans.length} Scans Total</span>
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
                            <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 overflow-hidden">
                                {scan.thumbnailBase64 ? (
                                    <img src={scan.thumbnailBase64} alt="Scan" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[10px] font-black text-zinc-700">{scan.psl.toFixed(1)}</span>
                                )}
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-lg font-black text-white">{scan.psl.toFixed(2)}</span>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-tighter ${
                                        scan.tier.includes('Elite') ? 'text-indigo-400' : 'text-zinc-400'
                                    }`}>
                                        {scan.tier}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <span>{new Date(scan.timestamp).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className="text-zinc-600 italic">{scan.phenotype}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleDelete(scan.id)}
                                className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
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
