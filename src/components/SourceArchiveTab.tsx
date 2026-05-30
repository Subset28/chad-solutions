'use client';

import React, { useEffect, useMemo, useState } from 'react';

type CorpusIndexEntry = {
    attachmentId: string;
    fileName: string;
};

type CorpusEntry = CorpusIndexEntry & {
    text: string;
};

function withBasePath(path: string) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || '';
    return `${basePath}${path}`;
}

function countWords(text: string) {
    return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

function previewText(text: string) {
    return text.replace(/\s+/g, ' ').trim().slice(0, 240);
}

export default function SourceArchiveTab() {
    const [entries, setEntries] = useState<CorpusEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadCorpus = async () => {
            try {
                const indexResponse = await fetch(withBasePath('/forum-corpus/index.json'));
                if (!indexResponse.ok) {
                    throw new Error(`Index load failed with status ${indexResponse.status}`);
                }

                const index = (await indexResponse.json()) as CorpusIndexEntry[];
                const loadedEntries = await Promise.all(
                    index.map(async (entry) => {
                        const response = await fetch(withBasePath(`/forum-corpus/${entry.fileName}`));
                        if (!response.ok) {
                            throw new Error(`Failed to load ${entry.fileName} (${response.status})`);
                        }

                        const text = await response.text();
                        return { ...entry, text };
                    })
                );

                if (!cancelled) {
                    setEntries(loadedEntries);
                    setError(null);
                }
            } catch (loadError) {
                console.error('Corpus load failed:', loadError);
                if (!cancelled) {
                    setError(loadError instanceof Error ? loadError.message : 'Failed to load source archive.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadCorpus();

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredEntries = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return entries;

        return entries.filter((entry) => {
            return (
                entry.attachmentId.toLowerCase().includes(normalized) ||
                entry.fileName.toLowerCase().includes(normalized) ||
                entry.text.toLowerCase().includes(normalized)
            );
        });
    }, [entries, query]);

    const summary = useMemo(() => {
        const totalCharacters = entries.reduce((sum, entry) => sum + entry.text.length, 0);
        const totalWords = entries.reduce((sum, entry) => sum + countWords(entry.text), 0);

        return {
            files: entries.length,
            characters: totalCharacters.toLocaleString(),
            words: totalWords.toLocaleString(),
        };
    }, [entries]);

    if (loading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center rounded-[2.5rem] border border-zinc-800 bg-black/40">
                <div className="space-y-4 text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Loading source archive</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-[2.5rem] border border-red-500/20 bg-red-500/5 p-6 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-300">Source archive unavailable</p>
                <p className="mt-3 text-sm text-zinc-300">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-[2.5rem] border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl shadow-black/30">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Raw source archive</p>
                        <h3 className="text-2xl font-black tracking-tight text-white">Every pasted entry, preserved verbatim.</h3>
                        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
                            This tab keeps the full pasted corpus as a reference library. Nothing here is summarized away, so you can inspect the original wording, context, and details exactly as they were pasted in.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Files</p>
                            <p className="mt-2 text-2xl font-black text-white">{summary.files}</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Words</p>
                            <p className="mt-2 text-2xl font-black text-white">{summary.words}</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Chars</p>
                            <p className="mt-2 text-2xl font-black text-white">{summary.characters}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-200">Reference only</p>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                        The archive is intentionally unfiltered and includes the full original pasted text. It is stored for browsing and citation, not as a blanket recommendation engine.
                    </p>
                </div>
            </div>

            <div className="sticky top-4 z-10 rounded-2xl border border-zinc-800 bg-black/80 p-3 backdrop-blur">
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search the archive by word, phrase, or attachment id"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
                />
            </div>

            <div className="space-y-4">
                {filteredEntries.map((entry, index) => (
                    <details
                        key={entry.attachmentId}
                        className="group rounded-[2rem] border border-zinc-800 bg-zinc-950/70 shadow-xl shadow-black/20"
                    >
                        <summary className="cursor-pointer list-none px-5 py-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                                        Attachment {index + 1}
                                    </p>
                                    <h4 className="break-all text-sm font-black text-white">{entry.attachmentId}</h4>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                                    <span>{entry.text.length.toLocaleString()} chars</span>
                                    <span className="group-open:rotate-180 transition-transform">⌄</span>
                                </div>
                            </div>
                            <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                                {previewText(entry.text) || 'No preview available.'}
                            </p>
                        </summary>

                        <div className="border-t border-zinc-800 px-5 py-5">
                            <div className="mb-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                                <span>{entry.fileName}</span>
                                <span>|</span>
                                <span>{entry.text.length.toLocaleString()} characters</span>
                                <span>|</span>
                                <span>{countWords(entry.text).toLocaleString()} words</span>
                            </div>
                            <pre className="max-h-[36rem] overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-zinc-800 bg-black/40 p-4 text-[12px] leading-relaxed text-zinc-200">
                                {entry.text}
                            </pre>
                        </div>
                    </details>
                ))}
            </div>

            {filteredEntries.length === 0 && (
                <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-8 text-center">
                    <p className="text-sm text-zinc-400">No corpus entries matched that search.</p>
                </div>
            )}
        </div>
    );
}
