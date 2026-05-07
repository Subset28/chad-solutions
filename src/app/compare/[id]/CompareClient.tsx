'use client';

import MainScanner from '@/components/MainScanner';

export default function CompareClient({ challenger }: { challenger: any }) {
    if (!challenger) return <ExpiredScreen />;

    return <MainScanner challengerData={challenger} />;
}

function ExpiredScreen() {
    return (
        <div className="h-screen bg-black flex flex-col items-center justify-center gap-6 p-12 text-center">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">Challenge Expired</h1>
            <p className="text-zinc-500 text-sm">This battle link is no longer active or the data was purged.</p>
            <a href="/" className="px-8 py-4 bg-white text-black font-black uppercase text-xs rounded-xl hover:scale-105 transition-all">Start New Scan</a>
        </div>
    );
}
