import FaceAnalyzer from '@/components/FaceAnalyzer';

export default function AnalyzePage() {
    return (
        <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-6">Facial Analysis</h1>
            <FaceAnalyzer />
        </div>
    );
}
