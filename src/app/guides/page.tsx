import Link from 'next/link';
import { guides } from '@/data/guides';

export default function GuidesIndex() {
    return (
        <main className="min-h-screen bg-black text-white p-8">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <header className="space-y-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Knowledge Base
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Scientific protocols for maximizing your aesthetic potential.
                        Data-backed methods for face, body, and style optimization.
                    </p>
                </header>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {guides.map((guide) => (
                        <Link
                            key={guide.id}
                            href={guide.slug}
                            className="group relative p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                        >
                            <div className="absolute top-6 right-6 text-2xl group-hover:scale-110 transition-transform">
                                {guide.icon === 'bg-zinc-800' ? '👔' : guide.icon}
                            </div>

                            <div className="space-y-4">
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-gray-300">
                                    {guide.category} • {guide.readTime}
                                </span>

                                <div>
                                    <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                        {guide.title}
                                    </h2>
                                    <p className="mt-2 text-gray-400 leading-relaxed">
                                        {guide.description}
                                    </p>
                                </div>

                                <div className="flex items-center text-blue-400 text-sm font-medium pt-2">
                                    Read Guide <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center pt-8 border-t border-zinc-800">
                    <p className="text-gray-500 mb-6">Want personalized advice?</p>
                    <Link
                        href="/analyze"
                        className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors"
                    >
                        Get Facial Analysis
                    </Link>
                </div>

            </div>
        </main>
    );
}
