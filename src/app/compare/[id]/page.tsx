'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import MainScanner from '@/components/MainScanner';
import { motion } from 'framer-motion';

export default function ComparePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const [challenger, setChallenger] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchChallenger = async () => {
            const { data, error } = await supabase
                .from('battle_challenges')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error || !data) {
                setError(true);
            } else {
                setChallenger(data);
            }
            setLoading(false);
        };
        fetchChallenger();
    }, [params.id]);

    if (loading) return (
        <div className="h-screen bg-black flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Retrieving Challenge...</p>
        </div>
    );

    if (error) return (
        <div className="h-screen bg-black flex flex-col items-center justify-center gap-6 p-12 text-center">
            <h1 className="text-4xl font-black italic tracking-tighter">CHALLENGE EXPIRED</h1>
            <p className="text-zinc-500 text-sm">This battle link is no longer active or the data was purged.</p>
            <a href="/" className="px-8 py-4 bg-white text-black font-black uppercase text-xs rounded-xl">Start New Scan</a>
        </div>
    );

    return <MainScanner challengerData={challenger} />;
}
