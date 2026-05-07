'use client';

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { motion, AnimatePresence } from 'framer-motion';

import { 
    validateLandmarks, 
    inversePoseNormalization, 
    extractEulerAngles 
} from '@/utils/normalization';
import { analyzeMetrics, MetricReport, flattenMetrics } from '@/utils/metrics';
import { calculatePSLScore, calculateAggregatedMetrics, PSLResult } from '@/utils/scoring';
import { ScanResult, Gender, AppTab, InputMode } from '@/types';
import AnalysisTab from '@/components/AnalysisTab';
import RoadmapTab from '@/components/RoadmapTab';
import VitalityTab from '@/components/VitalityTab';
import HaircutTab from '@/components/HaircutTab';
import { RadarChart } from '@/components/RadarChart';

export default function FaceAnalyzer() {
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const rollInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
    const [scans, setScans] = useState<ScanResult[]>([]);
    const [auditResult, setAuditResult] = useState<ScanResult | null>(null);
    const [inputMode, setInputMode] = useState<InputMode>('webcam');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [analyzedImageWithLandmarks, setAnalyzedImageWithLandmarks] = useState<string | null>(null);
    const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [appMode, setAppMode] = useState<'single' | 'compare'>('single');
    const [compareSlot, setCompareSlot] = useState<'before' | 'after'>('before');
    const [beforeScan, setBeforeScan] = useState<ScanResult | null>(null);
    const [afterScan, setAfterScan] = useState<ScanResult | null>(null);

    const [urlInput, setUrlInput] = useState('');
    const [gender, setGender] = useState<Gender>('male');
    const [consentGiven, setConsentGiven] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [resultsTab, setResultsTab] = useState<AppTab>('analysis');

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
        };
        checkMobile();
        
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

    const analyzeImage = async (dataUrl: string) => {
        if (!faceLandmarker || !canvasRef.current) return;
        setIsAnalyzing(true);

        const img = new Image();
        img.src = dataUrl;
        await img.decode();

        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const result = faceLandmarker.detect(canvas);
        
        if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
            alert("❌ No face detected. Please ensure your face is clearly visible and well-lit.");
            setIsAnalyzing(false);
            return;
        }

        const landmarks = result.faceLandmarks[0];
        const matrix = result.facialTransformationMatrixes?.[0];
        
        // 1. Validate Quality & Occlusions
        const audit = validateLandmarks(landmarks);
        
        if (!audit.isValid) {
            alert(`⚠️ Scan Quality Rejection: ${audit.reason}. Please retake for clinical accuracy.`);
            setIsAnalyzing(false);
            return;
        }

        // 2. Normalize Pose (3-axis)
        const normalizedLandmarks = matrix 
            ? inversePoseNormalization(landmarks, matrix) 
            : landmarks;

        // 3. Extract Angles for Profile Detection
        const angles = matrix ? extractEulerAngles(matrix) : { yaw: 0, pitch: 0, roll: 0 };
        const profileType = Math.abs(angles.yaw) > 30 ? 'side' : 'front';

        // 4. Calculate Clinical Metrics
        const metrics = analyzeMetrics(normalizedLandmarks);

        // 5. Calculate Score
        const psl = calculatePSLScore(metrics, { gender }, audit.overallConfidence);

        const scan: ScanResult = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            image: dataUrl,
            metrics,
            psl,
            profileType,
            audit,
            gender
        };

        // Draw landmarks for visual feedback
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        landmarks.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x * canvas.width, point.y * canvas.height, 1, 0, 2 * Math.PI);
            ctx.stroke();
        });
        setAnalyzedImageWithLandmarks(canvas.toDataURL());

        if (appMode === 'single') {
            setScans(prev => [...prev, scan]);
            setAuditResult(scan);
        } else {
            if (compareSlot === 'before') setBeforeScan(scan);
            else setAfterScan(scan);
        }

        setIsAnalyzing(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setUploadedImage(dataUrl);
            analyzeImage(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const captureAndAnalyze = () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setUploadedImage(imageSrc);
            analyzeImage(imageSrc);
        }
    };

    const handleUrlUpload = async () => {
        if (!urlInput.trim()) return;
        setIsAnalyzing(true);
        try {
            const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(urlInput)}`);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setUploadedImage(dataUrl);
                analyzeImage(dataUrl);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            alert("❌ Failed to load image from URL. Try uploading directly.");
            setIsAnalyzing(false);
        }
    };

    const generateFinalReport = () => {
        if (scans.length === 0) return;
        const aggregated = calculateAggregatedMetrics(scans);
        if (aggregated) {
            const finalPsl = calculatePSLScore(aggregated, { gender }, 0.9); // Assume high confidence for aggregated
            setAuditResult({
                ...scans[scans.length - 1],
                metrics: aggregated,
                psl: finalPsl,
                profileType: 'composite'
            });
        }
    };

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-7xl mx-auto p-4 md:p-8 min-h-screen text-zinc-100">
            <canvas ref={canvasRef} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            
            {/* Focal Length Disclaimer */}
            <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                    ⚠️ Optical Standard: Scores are calibrated for photos taken at 3+ feet distance. Selfies may show inflated nose width.
                </p>
            </div>
            
            {/* Header / Mode Toggles */}
            <div className="flex flex-wrap gap-4 justify-center items-center w-full z-20">
                <div className="flex bg-zinc-900 p-1.5 rounded-full border border-zinc-800 shadow-2xl">
                    <button
                        onClick={() => { setAppMode('single'); setAuditResult(null); setScans([]); }}
                        className={`px-6 py-2 rounded-full font-bold transition-all text-xs uppercase tracking-widest ${appMode === 'single' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Single Audit
                    </button>
                    <button
                        onClick={() => { setAppMode('compare'); setAuditResult(null); setBeforeScan(null); setAfterScan(null); }}
                        className={`px-6 py-2 rounded-full font-bold transition-all text-xs uppercase tracking-widest ${appMode === 'compare' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Before & After
                    </button>
                </div>

                <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-full border border-zinc-800 shadow-2xl">
                    <button
                        onClick={() => setGender('male')}
                        className={`px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${gender === 'male' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Male
                    </button>
                    <button
                        onClick={() => setGender('female')}
                        className={`px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${gender === 'female' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Female
                    </button>
                </div>
            </div>

            {appMode === 'single' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full">
                    {/* LEFT COLUMN: Input & Preview */}
                    {!auditResult ? (
                        <div className="lg:col-span-12 flex flex-col items-center gap-8 max-w-2xl mx-auto w-full">
                            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-zinc-950 shadow-2xl group">
                                {inputMode === 'webcam' ? (
                                    <Webcam
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="h-full w-full object-cover transform scale-x-[-1]"
                                        videoConstraints={{ facingMode: "user" }}
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                        {uploadedImage ? (
                                            <img src={uploadedImage} alt="Preview" className="h-full w-full object-contain" />
                                        ) : (
                                            <div className="text-center p-8">
                                                <div className="text-6xl mb-4 opacity-20">👤</div>
                                                <p className="text-zinc-500 text-sm font-medium">No image selected</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {isAnalyzing && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                                        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                                        <p className="text-white font-black uppercase tracking-[0.2em] text-xs">Processing Biometrics</p>
                                    </div>
                                )}
                            </div>

                            <div className="w-full space-y-6">
                                <div className="flex gap-4 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                                    <button onClick={() => setInputMode('webcam')} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${inputMode === 'webcam' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500'}`}>Camera</button>
                                    <button onClick={() => setInputMode('upload')} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${inputMode === 'upload' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500'}`}>Upload</button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl cursor-pointer" onClick={() => setConsentGiven(!consentGiven)}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${consentGiven ? 'bg-white border-white' : 'border-zinc-700'}`}>
                                            {consentGiven && <div className="w-2 h-2 bg-black rounded-sm" />}
                                        </div>
                                        <p className="text-[10px] text-zinc-500 leading-relaxed font-medium uppercase tracking-wider">
                                            I consent to the biometric analysis of my facial features for the purpose of aesthetic assessment. All processing occurs locally.
                                        </p>
                                    </div>

                                    {inputMode === 'webcam' ? (
                                        <button
                                            onClick={captureAndAnalyze}
                                            disabled={!faceLandmarker || isAnalyzing || !consentGiven}
                                            className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 shadow-2xl shadow-white/5"
                                        >
                                            Initiate Scan
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={!faceLandmarker || isAnalyzing || !consentGiven}
                                                className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] transition-all disabled:opacity-20"
                                            >
                                                Select File
                                            </button>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="PASTE IMAGE URL"
                                                    value={urlInput}
                                                    onChange={(e) => setUrlInput(e.target.value)}
                                                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold tracking-widest focus:outline-none focus:border-zinc-600"
                                                />
                                                <button onClick={handleUrlUpload} className="px-6 bg-zinc-800 rounded-xl font-bold">→</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* RESULTS VIEW */
                        <>
                            <div className="lg:col-span-4 space-y-8">
                                <div className="relative rounded-[3rem] overflow-hidden border border-zinc-800 glass-dark p-10 shadow-2xl text-center">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">Biometric Status</p>
                                    
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />
                                        <h2 className="relative text-8xl font-black tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                                            {auditResult.psl.overall.toFixed(1)}
                                        </h2>
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-2">Score Index / 10.0</p>
                                    </div>

                                    <div className="px-6 py-2 rounded-full border border-white/10 bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.2em] inline-block mb-10">
                                        {auditResult.psl.tier}
                                    </div>

                                    <div className="w-full space-y-3 mb-10">
                                        <div className="flex justify-between items-end px-1">
                                            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Percentile</span>
                                            <span className="text-sm font-mono text-white">{auditResult.psl.percentile}th</span>
                                        </div>
                                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${auditResult.psl.percentile}%` }}
                                                className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                            />
                                        </div>
                                    </div>

                                    <div className="aspect-square w-full max-w-[280px] mx-auto opacity-80">
                                        <RadarChart 
                                            data={[
                                                { label: 'EYES', value: (auditResult.metrics.periorbital.canthalTilt.average + 10) * 5 },
                                                { label: 'JAW', value: auditResult.metrics.jawline.gonialAngle.average / 1.5 },
                                                { label: 'MID', value: auditResult.metrics.midface.fWHR * 40 },
                                                { label: 'SYM', value: auditResult.metrics.symmetry.overallSymmetry },
                                                { label: 'PRO', value: auditResult.metrics.midface.midfaceRatio * 80 }
                                            ]} 
                                            size={280} 
                                            color="#ffffff" 
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setAuditResult(null); setScans([]); setAnalyzedImageWithLandmarks(null); }}
                                    className="w-full py-5 rounded-[2rem] bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:bg-zinc-800"
                                >
                                    New Analysis
                                </button>
                            </div>

                            <div className="lg:col-span-8 space-y-8">
                                <div className="relative aspect-video rounded-[3rem] overflow-hidden border border-zinc-800 glass-dark shadow-2xl group">
                                    <img 
                                        src={analyzedImageWithLandmarks || auditResult.image} 
                                        alt="Scan" 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-8 left-8 flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Landmark Map Verified</p>
                                    </div>
                                </div>

                                <div className="flex p-1.5 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] glass-dark shadow-xl">
                                    {(['analysis', 'roadmap', 'vitality', 'haircut'] as AppTab[]).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setResultsTab(tab)}
                                            className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${resultsTab === tab ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    {resultsTab === 'analysis' && (
                                        <AnalysisTab 
                                            metrics={auditResult.metrics} 
                                            profileType={auditResult.profileType} 
                                            gender={gender} 
                                            expandedMetric={expandedMetric}
                                            onToggleMetric={setExpandedMetric}
                                        />
                                    )}
                                    {resultsTab === 'roadmap' && (
                                        <RoadmapTab 
                                            metrics={auditResult.metrics} 
                                            pslScore={auditResult.psl.overall}
                                            gender={gender} 
                                        />
                                    )}
                                    {resultsTab === 'vitality' && <VitalityTab metrics={auditResult.metrics} />}
                                    {resultsTab === 'haircut' && <HaircutTab metrics={auditResult.metrics} gender={gender} />}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                /* COMPARE MODE */
                <div className="w-full space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className={`space-y-4 transition-all ${compareSlot === 'before' ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`} onClick={() => setCompareSlot('before')}>
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] text-center">Baseline (Before)</h3>
                            <div className={`relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border-2 transition-all ${compareSlot === 'before' ? 'border-white bg-zinc-900 shadow-2xl' : 'border-zinc-800 bg-black'}`}>
                                {beforeScan ? <img src={beforeScan.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">📸</div>}
                            </div>
                        </div>
                        <div className={`space-y-4 transition-all ${compareSlot === 'after' ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`} onClick={() => setCompareSlot('after')}>
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] text-center">Outcome (After)</h3>
                            <div className={`relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border-2 transition-all ${compareSlot === 'after' ? 'border-white bg-zinc-900 shadow-2xl' : 'border-zinc-800 bg-black'}`}>
                                {afterScan ? <img src={afterScan.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">✨</div>}
                            </div>
                        </div>
                    </div>

                    {!beforeScan || !afterScan ? (
                        <div className="max-w-md mx-auto w-full space-y-6">
                            <div className="flex gap-4 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                                <button onClick={() => setInputMode('webcam')} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${inputMode === 'webcam' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Camera</button>
                                <button onClick={() => setInputMode('upload')} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${inputMode === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Upload</button>
                            </div>
                            
                            {inputMode === 'webcam' ? (
                                <div className="aspect-video rounded-3xl overflow-hidden border border-zinc-800 mb-6 bg-black">
                                    <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover transform scale-x-[-1]" />
                                </div>
                            ) : null}

                            <button
                                onClick={inputMode === 'webcam' ? captureAndAnalyze : () => fileInputRef.current?.click()}
                                disabled={!faceLandmarker || isAnalyzing || !consentGiven}
                                className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-sm disabled:opacity-20 shadow-2xl"
                            >
                                {isAnalyzing ? 'Scanning...' : `Scan ${compareSlot === 'before' ? 'Before' : 'After'}`}
                            </button>
                        </div>
                    ) : (
                        <div className="rounded-[3rem] border border-zinc-800 glass-dark p-12 text-center shadow-2xl animate-in zoom-in duration-700">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-8">Evolution Report</p>
                            <div className="flex justify-center items-center gap-12 mb-12">
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-zinc-600">{beforeScan.psl.overall.toFixed(1)}</p>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">Before</p>
                                </div>
                                <div className="text-4xl text-zinc-800">→</div>
                                <div className="text-center">
                                    <p className={`text-8xl font-black tracking-tighter ${afterScan.psl.overall > beforeScan.psl.overall ? 'text-emerald-400' : 'text-white'}`}>
                                        {afterScan.psl.overall.toFixed(1)}
                                    </p>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">After</p>
                                </div>
                            </div>
                            
                            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 mb-12">
                                <span className="text-emerald-400 font-black text-2xl">
                                    {afterScan.psl.overall > beforeScan.psl.overall ? '+' : ''}
                                    {(afterScan.psl.overall - beforeScan.psl.overall).toFixed(1)}
                                </span>
                                <span className="text-emerald-500/60 font-black uppercase tracking-[0.2em] text-xs">PSL Index Shift</span>
                            </div>

                            <button
                                onClick={() => { setBeforeScan(null); setAfterScan(null); }}
                                className="block mx-auto text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] hover:text-white transition-colors"
                            >
                                Reset Comparison
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
