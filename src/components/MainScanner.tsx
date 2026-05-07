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
import { track } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

interface MainScannerProps {
    challengerData?: {
        id: string;
        username: string;
        psl_score: number;
        tier: string;
        percentile: number;
        phenotype: string;
        canthal_tilt: number;
        fwhr: number;
        symmetry: number;
        midface_ratio: number;
        gonial_angle: number;
    } | null;
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
    const [showChallenge, setShowChallenge] = useState(!!challengerData);
    const [username, setUsername] = useState('');
    const [showTips, setShowTips] = useState(false);

    useEffect(() => {
        setUsername(getOrCreateUsername());
        
        if (challengerData) {
            track('challenge_link_opened', {
                challenger_psl: challengerData.psl_score,
                challenger_tier: challengerData.tier,
            });
        } else {
            track('scanner_opened');
        }

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
        track('scan_started');
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
        if (!imageSrc || !faceLandmarker || !canvasRef.current) {
            if (!faceLandmarker) alert("AI Engine still loading... please wait 2-3 seconds.");
            return;
        }
        
        setIsAnalyzing(true);
        try {
            const img = new Image();
            img.src = imageSrc;
            await img.decode();

            const canvas = canvasRef.current;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not initialize canvas context");
            ctx.drawImage(img, 0, 0);

            const landmarkerResult = faceLandmarker.detect(canvas);
            if (!landmarkerResult.faceLandmarks?.length) {
                track('scan_failed', { reason: 'no_face_detected' });
                alert("Face not detected. Ensure your face is centered and well-lit.");
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
            const psl = calculatePSLScore(metrics, { gender }, audit.overall);

            console.log(`[PSL Audit] Score: ${psl.overall}, Tier: ${psl.tier}`);
            console.log('[PSL Breakdown]', psl.breakdown);

            // Fallback for crypto.randomUUID if not available (non-secure context/older browsers)
            const scanId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
                ? crypto.randomUUID() 
                : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                
            const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));

            setResult({
                id: scanId,
                timestamp: Date.now(),
                image: imageSrc,
                metrics,
                psl,
                profileType: 'front',
                audit,
                gender
            });

            // Save to Supabase for global leaderboard
            supabase.from('scans').insert({
                id: scanId,
                week_number: currentWeek,
                username: localStorage.getItem('cs_username') || 'Anonymous',
                psl_score: psl.overall,
                tier: psl.tier,
                percentile: psl.percentile,
                phenotype: metrics.community?.phenotype
            }).then(({ error }) => {
                if (error) console.error('Failed to save scan to global leaderboard:', error);
            });

            track('scan_completed', {
                psl_score: psl.overall,
                tier: psl.tier,
                percentile: psl.percentile,
                phenotype: metrics.community?.phenotype,
                confidence: audit.overall,
                was_challenge: !!challengerData,
            });
        } catch (err) {
            console.error('Scan capture failed:', err);
            alert("Analysis failed. Please try again with better lighting.");
            track('scan_failed', { reason: 'processing_error', error: String(err) });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {showChallenge && challengerData ? (
                        <motion.div
                            key="hook"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-8 p-8"
                        >
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
                                You've been challenged
                            </p>

                            <div className="w-full max-w-sm bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 text-center space-y-4">
                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">
                                    @{challengerData.username}
                                </p>
                                <div className="text-7xl font-black tracking-tighter italic">
                                    {challengerData.psl_score.toFixed(2)}
                                </div>
                                <div className="inline-block px-4 py-1 bg-white text-black text-[10px] font-black uppercase rounded-full tracking-widest">
                                    {challengerData.tier}
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-zinc-800 text-left">
                                    {[
                                        ['Canthal Tilt', `${challengerData.canthal_tilt?.toFixed(1)}°`],
                                        ['fWHR', challengerData.fwhr?.toFixed(2)],
                                        ['Symmetry', `${challengerData.symmetry?.toFixed(1)}%`],
                                        ['Midface', challengerData.midface_ratio?.toFixed(2)],
                                    ].map(([label, val]) => (
                                        <div key={label}>
                                            <p className="text-[8px] text-zinc-600 uppercase tracking-[0.2em] font-black">{label}</p>
                                            <p className="text-sm font-black text-white">{val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <p className="text-zinc-400 text-xs font-black uppercase tracking-[0.3em] italic">Do you mog?</p>

                            <button
                                onClick={() => setShowChallenge(false)}
                                className="w-full max-w-sm py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-sm rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:scale-105 transition-all active:scale-95"
                            >
                                Accept Challenge
                            </button>
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
                            <div className="relative z-10 flex flex-col items-center gap-8">
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

                                <div className="flex flex-col items-center gap-4">
                                    <button
                                        onClick={startScan}
                                        disabled={isAnalyzing || countdown !== null}
                                        className="group relative w-24 h-24 rounded-full bg-white flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                                    >
                                        <div className="absolute inset-0 rounded-full border-4 border-white scale-110 group-hover:scale-125 transition-transform opacity-20" />
                                        <div className="w-20 h-20 rounded-full border-2 border-black/10" />
                                        <div className="absolute inset-0 flex items-center justify-center text-black font-black text-[10px] uppercase tracking-widest">Scan</div>
                                    </button>

                                    <button 
                                        onClick={() => setShowTips(true)}
                                        className="px-4 py-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center gap-2 group hover:bg-white/10 transition-all"
                                    >
                                        <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black group-hover:bg-white group-hover:text-black transition-all">i</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white">Photo Protocol</span>
                                    </button>
                                </div>
                            </div>

                            {/* Tips Modal */}
                            <AnimatePresence>
                                {showTips && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl p-8 flex flex-col items-center justify-center"
                                    >
                                        <div className="w-full max-w-sm space-y-8">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Accuracy Standards</p>
                                                <h2 className="text-3xl font-black tracking-tighter italic italic">THE 6-FOOT RULE</h2>
                                            </div>

                                            <div className="space-y-6">
                                                {[
                                                    { title: "Avoid Distortion", desc: "Smartphone lenses distort features up close. Stand at least 6-8 feet away for medical-grade accuracy." },
                                                    { title: "Eye Level", desc: "Position the camera exactly at eye level. Tilting up or down will invalidate midface measurements." },
                                                    { title: "Neutral Face", desc: "Maintain a deadpan expression. No smiling or tension in the jaw." },
                                                    { title: "Lighting", desc: "Face a window directly. Avoid overhead lights that create artificial eye bags." }
                                                ].map((tip, i) => (
                                                    <div key={i} className="flex gap-4">
                                                        <span className="text-white/20 font-black italic">0{i+1}</span>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-white">{tip.title}</p>
                                                            <p className="text-xs text-zinc-500 leading-relaxed">{tip.desc}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <button 
                                                onClick={() => setShowTips(false)}
                                                className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-xs rounded-2xl"
                                            >
                                                Understood
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
                                                setShowChallenge(!!challengerData);
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
