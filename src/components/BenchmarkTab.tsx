'use client';

import React, { useEffect, useMemo, useState } from 'react';

type BenchmarkEntry = {
    fileName: string;
    label?: string;
    note?: string;
    expectedPsl?: number;
};

function withBasePath(path: string) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || '';
    return `${basePath}${path}`;
}

function withEncodedBasePath(path: string) {
    const [pathname, query = ''] = path.split('?');
    const encodedPath = pathname
        .split('/')
        .map((segment) => (segment ? encodeURIComponent(segment) : segment))
        .join('/');
    return withBasePath(`${encodedPath}${query ? `?${query}` : ''}`);
}

export default function BenchmarkTab() {
    const [entries, setEntries] = useState<BenchmarkEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadBenchmarks = async () => {
            try {
                const response = await fetch(withBasePath('/test-images/index.json'));
                if (!response.ok) {
                    throw new Error(`Benchmark index load failed with status ${response.status}`);
                }

                const data = (await response.json()) as BenchmarkEntry[];
                if (!cancelled) {
                    setEntries(Array.isArray(data) ? data : []);
                    setError(null);
                }
            } catch (loadError) {
                console.error('Benchmark load failed:', loadError);
                if (!cancelled) {
                    setError(loadError instanceof Error ? loadError.message : 'Failed to load benchmark set.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadBenchmarks();

        return () => {
            cancelled = true;
        };
    }, []);

    const summary = useMemo(() => {
        const scored = entries.filter((entry) => typeof entry.expectedPsl === 'number');
        return {
            files: entries.length,
            scored: scored.length,
        };
    }, [entries]);

    if (loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center rounded-[2.5rem] border border-zinc-800 bg-black/40">
                <div className="space-y-4 text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Loading benchmark set</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-[2.5rem] border border-red-500/20 bg-red-500/5 p-6 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-300">Benchmark set unavailable</p>
                <p className="mt-3 text-sm text-zinc-300">{error}</p>
                <p className="mt-4 text-xs text-zinc-500">
                    Put your images in <code className="text-zinc-300">public/test-images</code> and add an <code className="text-zinc-300">index.json</code> manifest.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-[2.5rem] border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl shadow-black/30">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Benchmark set</p>
                        <h3 className="text-2xl font-black tracking-tight text-white">Drop reference photos here and compare the pipeline.</h3>
                        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
                            This tab is for your test-image folder. Add files to <code className="text-zinc-300">public/test-images</code>, list them in <code className="text-zinc-300">index.json</code>, and the gallery will render them here for side-by-side review.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Files</p>
                            <p className="mt-2 text-2xl font-black text-white">{summary.files}</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Pre-labeled</p>
                            <p className="mt-2 text-2xl font-black text-white">{summary.scored}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200">Manifest format</p>
                    <pre className="mt-2 overflow-auto rounded-xl border border-zinc-800 bg-black/40 p-3 text-[11px] leading-relaxed text-zinc-300">
{`[
  { "fileName": "sample-1.jpg", "label": "Front", "note": "Good lighting", "expectedPsl": 5.2 }
]`}
                    </pre>
                </div>
            </div>

            {entries.length === 0 ? (
                <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-8 text-center">
                    <p className="text-sm text-zinc-400">No benchmark images yet. Add them to <code className="text-zinc-200">public/test-images</code> and refresh.</p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {entries.map((entry, index) => (
                        <article key={`${entry.fileName}-${index}`} className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950/70 shadow-xl shadow-black/20">
                            <div className="aspect-[4/5] bg-black">
                                <img
                                    src={withEncodedBasePath(`/test-images/${entry.fileName}`)}
                                    alt={entry.label || entry.fileName}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                            <div className="space-y-3 p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Benchmark {index + 1}</p>
                                        <h4 className="text-sm font-black text-white">{entry.label || entry.fileName}</h4>
                                    </div>
                                    {typeof entry.expectedPsl === 'number' && (
                                        <div className="rounded-full border border-zinc-800 bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-300">
                                            PSL {entry.expectedPsl.toFixed(1)}
                                        </div>
                                    )}
                                </div>

                                <p className="break-all text-xs text-zinc-500">{entry.fileName}</p>
                                {entry.note && <p className="text-xs leading-relaxed text-zinc-400">{entry.note}</p>}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
