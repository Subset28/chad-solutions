import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#050505] text-white p-6 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl w-full text-center space-y-12 relative z-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-4 scale-110">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Neural Analysis V3.0 Live
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
            MASTER YOUR <br />AESTHETICS
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto font-medium leading-relaxed">
            The world&apos;s most advanced facial analysis engine.
            25+ clinical metrics. Surgical-grade precision.
            Your personalized roadmap to peak potential.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/analyze"
            className="group relative w-full md:w-auto px-10 py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            START AUDIT
          </Link>

          <Link
            href="/guides"
            className="w-full md:w-auto px-10 py-5 rounded-2xl bg-zinc-900/50 text-white font-bold text-lg border border-zinc-800 hover:bg-zinc-800 transition-all active:scale-95"
          >
            VIEW BENCHMARKS
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 text-left pt-10 border-t border-zinc-900">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Precision</p>
            <p className="text-sm font-semibold text-zinc-300">Euler Transform Math</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Engine</p>
            <p className="text-sm font-semibold text-zinc-300">Neural Blendshapes</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Output</p>
            <p className="text-sm font-semibold text-zinc-300">Custom Roadmap</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Privacy</p>
            <p className="text-sm font-semibold text-zinc-300">Local Only Processing</p>
          </div>
        </div>
      </div>
    </main>
  );
}
