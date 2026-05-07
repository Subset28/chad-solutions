'use client';

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { motion, AnimatePresence } from 'framer-motion';
import { validateLandmarks, inversePoseNormalization } from '@/utils/normalization';
import { analyzeMetrics } from '@/utils/metrics';
import { calculatePSLScore } from '@/utils/scoring';
import { ScanResult, Gender } from '@/types';
import ScoreReveal from './ScoreReveal';
import TierCard from './TierCard';
import BattleLink from './BattleLink';
import LeaderboardTab from './LeaderboardTab';
import BattleVerdictCard from './BattleVerdictCard';
import { getOrCreateUsername } from '@/lib/username';

interface MainScannerProps {
    challengerData?: any;
}

export default function MainScanner({ challengerData }: MainScannerProps) {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [showFullAudit, setShowFullAudit] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'scan' | 'rankings'>('scan');
    const [challengeAccepted, setChallengeAccepted] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        setUsername(getOrCreateUsername());
        
        const initLandmarker = async () => {
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
                runningMode: "IMAGE",
                numFaces: 1,
            });
            setFaceLandmarker(landmarker);
        };
        initLandmarker();
    }, []);

    const startScan = () => {
        setCountdown(3);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev === 1) {
                    clearInterval(timer);
                    capture();
                    return null;
                }
                return prev ? prev - 1 : null;
            });
        }, 1000);
    };

    const capture = async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc || !faceLandmarker || !canvasRef.current) return;
        
        setIsAnalyzing(true);
        const img = new Image();
        img.src = imageSrc;
        await img.decode();

        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const landmarkerResult = faceLandmarker.detect(canvas);
        if (!landmarkerResult.faceLandmarks?.length) {
            alert("Face not detected. Retrying...");
            setIsAnalyzing(false);
            return;
        }

        const landmarks = landmarkerResult.faceLandmarks[0];
        const matrix = landmarkerResult.facialTransformationMatrixes?.[0];
        const audit = validateLandmarks(landmarks);
        
        const normalizedLandmarks = matrix ? inversePoseNormalization(landmarks, matrix) : landmarks;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const blendshapes = landmarkerResult.faceBlendshapes?.[0]?.categories || [];
        const gender: Gender = 'male';

        const metrics = analyzeMetrics(normalizedLandmarks, blendshapes, imageData, landmarks);
        const psl = calculatePSLScore(metrics, { gender }, audit.overallConfidence);

        setResult({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            image: imageSrc,
            metrics,
            psl,
            profileType: 'front',
            confidence: audit.overallConfidence
        });
        setIsAnalyzing(false);
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {challengerData && !challengeAccepted ? (
                        <motion.div
                            key="hook"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center p-8 bg-black"
                        >
                            <div className="text-center space-y-12">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-zinc-500 tracking-[0.4em] uppercase">Incoming Challenge</p>
                                    <h1 className="text-4xl font-black italic tracking-tighter uppercase line-clamp-1">
                                        @{challengerData.username} is challenging you
                                    </h1>
                                </div>

                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
                                    <div className="space-y-1">
                                        <div className="text-6xl font-black tracking-tighter">{challengerData.psl_score.toFixed(2)}</div>
                                        <div className="text-xs font-black text-zinc-500 uppercase tracking-widest">{challengerData.tier}</div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest pt-6 border-t border-zinc-800">
                                        <div>Tilt: {challengerData.canthal_tilt.toFixed(1)}°</div>
                                        <div>fWHR: {challengerData.fwhr.toFixed(2)}</div>
                                        <div>Symmetry: {challengerData.symmetry.toFixed(0)}%</div>
                                        <div>Midface: {challengerData.midface_ratio.toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h2 className="text-2xl font-black italic tracking-tighter uppercase">DO YOU MOG?</h2>
                                    <button 
                                        onClick={() => setChallengeAccepted(true)}
                                        className="w-full px-12 py-6 bg-white text-black font-black uppercase tracking-[0.2em] text-sm rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.2)] animate-pulse"
                                    >
                                        Accept Challenge
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : activeTab === 'rankings' ? (
                        <motion.div
                            key="rankings"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="w-full"
                        >
                            <LeaderboardTab />
                        </motion.div>
                    ) : !result ? (
                        <motion.div 
                            key="camera"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative w-full h-full flex flex-col items-center justify-center"
                        >
                            <Webcam
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                                videoConstraints={{ facingMode: "user" }}
                            />
                            
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

                            {/* Scanner HUD UI */}
                            <div className="relative z-10 flex flex-col items-center gap-12">
                                <div className="w-64 h-80 border-2 border-white/20 rounded-[3rem] relative">
                                    <div className="absolute inset-0 border border-white/10 rounded-[3rem] scale-105" />
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-4 py-1 border border-white/20 rounded-full">
                                        <span className="text-[10px] font-black text-white tracking-[0.3em] uppercase">Align Face</span>
                                    </div>
                                    {countdown !== null && (
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1.5 }}
                                            key={countdown}
                                            className="absolute inset-0 flex items-center justify-center text-8xl font-black text-white"
                                        >
                                            {countdown}
                                        </motion.div>
                                    )}
                                </div>

                                <button
                                    onClick={startScan}
                                    disabled={isAnalyzing || countdown !== null}
                                    className="group relative w-24 h-24 rounded-full bg-white flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                                >
                                    <div className="absolute inset-0 rounded-full border-4 border-white scale-110 group-hover:scale-125 transition-transform opacity-20" />
                                    <div className="w-20 h-20 rounded-full border-2 border-black/10" />
                                    <div className="absolute inset-0 flex items-center justify-center text-black font-black text-[10px] uppercase tracking-widest">Scan</div>
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <div key="result" className="w-full h-full overflow-y-auto bg-black scroll-smooth pb-32">
                            {!showFullAudit ? (
                                <ScoreReveal 
                                    score={result.psl.overall} 
                                    tier={result.psl.tier} 
                                    metrics={result.metrics}
                                    onComplete={() => setShowFullAudit(true)}
                                />
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center gap-12 p-8 py-20"
                                >
                                    {challengerData ? (
                                        <BattleVerdictCard 
                                            userResult={result} 
                                            challengerData={challengerData} 
                                            userUsername={username}
                                        />
                                    ) : (
                                        <TierCard 
                                            metrics={result.metrics}
                                            pslScore={result.psl.overall}
                                            tier={result.psl.tier}
                                            percentile={result.psl.percentile}
                                            thumbnail={result.image}
                                        />
                                    )}
                                    
                                    <div className="w-full max-w-[400px] space-y-4">
                                        {!challengerData && <BattleLink result={result} />}
                                        
                                        <button 
                                            onClick={() => {
                                                setResult(null);
                                                setShowFullAudit(false);
                                                setChallengeAccepted(false);
                                            }}
                                            className="w-full py-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] hover:text-white transition-all text-center border border-zinc-900 rounded-xl"
                                        >
                                            {challengerData ? 'Rematch' : 'Scan Again'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-2xl border-t border-zinc-900 z-50 px-6 flex items-center justify-around">
                <button 
                    onClick={() => {
                        setActiveTab('scan');
                        setResult(null);
                        setShowFullAudit(false);
                    }}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'scan' ? 'text-white' : 'text-zinc-600'}`}
                >
                    <div className={`w-12 h-1 rounded-full mb-1 ${activeTab === 'scan' ? 'bg-white' : 'bg-transparent'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Scanner</span>
                </button>
                <button 
                    onClick={() => setActiveTab('rankings')}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'rankings' ? 'text-white' : 'text-zinc-600'}`}
                >
                    <div className={`w-12 h-1 rounded-full mb-1 ${activeTab === 'rankings' ? 'bg-white' : 'bg-transparent'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Rankings</span>
                </button>
            </div>
        </div>
    );
}
