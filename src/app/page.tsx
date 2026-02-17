import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tighter sm:text-7xl bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Face Max According to AI
        </h1>
        <p className="text-xl text-gray-400">
          Analyze your facial aesthetics using advanced computer vision.
          Discover your potential.
        </p>

        <Link
          href="/analyze"
          className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Start Analysis
        </Link>
      </div>
    </main>
  );
}
