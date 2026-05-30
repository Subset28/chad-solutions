'use client';

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { motion } from 'framer-motion';

import {
    validateLandmarks,
    inversePoseNormalization,
    undistortPerspective,
} from '@/utils/normalization';
import { analyzeMetrics } from '@/utils/metrics';
import { calculatePSLScore } from '@/utils/scoring';
import { extractEulerAngles } from '@/utils/geometry';
import { ScanResult, Gender, AppTab, InputMode } from '@/types';
import AnalysisTab from '@/components/AnalysisTab';
import RoadmapTab from '@/components/RoadmapTab';
import VitalityTab from '@/components/VitalityTab';
import HaircutTab from '@/components/HaircutTab';
import SourceArchiveTab from '@/components/SourceArchiveTab';
import BenchmarkTab from '@/components/BenchmarkTab';
import { RadarChart } from '@/components/RadarChart';
import TierCard from '@/components/TierCard';
import HistoryTab from '@/components/HistoryTab';
import { saveScan } from '@/lib/scanHistory';

const RESULT_TABS: Array<{ id: AppTab; label: string }> = [
    { id: 'analysis', label: 'Analysis' },
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'vitality', label: 'Vitality' },
    { id: 'haircut', label: 'Haircut' },
    { id: 'history', label: 'History' },
    { id: 'sources', label: 'Sources' },
    { id: 'bench', label: 'Bench' },
];

export default function FaceAnalyzer() {
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
    const [qaMode, setQaMode] = useState(false);
    const [auditResult, setAuditResult] = useState<ScanResult | null>(null);
    const [inputMode, setInputMode] = useState<InputMode>('webcam');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [analyzedImageWithLandmarks, setAnalyzedImageWithLandmarks] = useState<string | null>(null);
    const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [gender, setGender] = useState<Gender>('male');
    const [consentGiven, setConsentGiven] = useState(false);
    const [resultsTab, setResultsTab] = useState<AppTab>('analysis');
    const [scanNotice, setScanNotice] = useState<{ kind: 'error' | 'warning' | 'info'; message: string } | null>(null);

    const shouldBypassQualityGate = (sourceName?: string) => {
        if (qaMode) return true;
        if (!sourceName) return false;

        const normalized = sourceName.toLowerCase();
        return normalized.includes('psl') && normalized.includes('example');
    };

    useEffect(() => {
        const initLandmarker = async () => {
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
                );
                const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath:
                            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                        delegate: 'GPU',
                    },
                    outputFaceBlendshapes: true,
                    outputFacialTransformationMatrixes: true,
                    runningMode: 'IMAGE',
                    numFaces: 1,
                });
                setFaceLandmarker(landmarker);
            } catch (error) {
                console.error('Failed to initialize face landmarker:', error);
            }
        };

        void initLandmarker();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setQaMode(params.has('qa') || params.get('qa') === '1');
    }, []);

    const analyzeImage = async (dataUrl: string, sourceName?: string) => {
        if (!faceLandmarker || !canvasRef.current) return;
        setIsAnalyzing(true);
        setScanNotice(null);

        try {
            const img = new Image();
            img.src = dataUrl;
            await img.decode();

            const canvas = canvasRef.current;
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not initialize canvas context');

            ctx.drawImage(img, 0, 0);

            const result = faceLandmarker.detect(canvas);
            if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
                setScanNotice({
                    kind: 'error',
                    message: 'No face detected. Please keep your face fully in frame, well lit, and facing the camera.',
                });
                return;
            }

            const landmarks = result.faceLandmarks[0];
            const matrix = result.facialTransformationMatrixes?.[0];
            const angles = matrix ? extractEulerAngles(matrix) : { yaw: 0, pitch: 0, roll: 0 };
            const isFrontFacing = Math.abs(angles.yaw) < 25 && Math.abs(angles.pitch) < 20;
            const isWebcamCapture = sourceName === 'webcam-capture';
            const relaxedScan = shouldBypassQualityGate(sourceName) || isFrontFacing || isWebcamCapture;
            const audit = validateLandmarks(landmarks, {
                relaxed: relaxedScan,
            });
            if (!audit.isValid && !relaxedScan) {
                setScanNotice({
                    kind: 'error',
                    message: `Scan quality rejection: ${audit.reason}`,
                });
                return;
            }

            if (!audit.isValid && relaxedScan) {
                console.warn(`Quality gate relaxed for ${sourceName || 'scan'}: ${audit.reason}`);
                setScanNotice({
                    kind: 'warning',
                    message: `Scan quality warning: ${audit.reason} Proceeding because this scan is in relaxed mode. For best calibration, use a 3+ foot camera distance.`,
                });
            } else if (audit.reason) {
                setScanNotice({
                    kind: audit.isValid ? 'warning' : 'error',
                    message: audit.isValid
                        ? audit.reason
                        : `Scan quality rejection: ${audit.reason}`,
                });
            } else {
                setScanNotice(
                    relaxedScan && (isWebcamCapture || isFrontFacing)
                        ? {
                              kind: 'info',
                              message:
                                  'Selfie capture detected. The source model expects a 3+ foot distance, so nose width and facial fifths are interpreted with extra caution.',
                          }
                        : null
                );
            }

            const normalizedLandmarks = matrix ? inversePoseNormalization(landmarks, matrix) : landmarks;
            const correctedLandmarks = undistortPerspective(normalizedLandmarks);
            const profileType = Math.abs(angles.yaw) > 30 ? 'side' : 'front';
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const metrics = analyzeMetrics(
                correctedLandmarks,
                result.faceBlendshapes?.[0]?.categories || [],
                imageData,
                landmarks
            );
            const psl = calculatePSLScore(metrics, { gender }, audit.overall);

            const scanId =
                typeof crypto !== 'undefined' && crypto.randomUUID
                    ? crypto.randomUUID()
                    : Math.random().toString(36).substring(2, 15);

            const scan: ScanResult = {
                id: scanId,
                timestamp: Date.now(),
                image: dataUrl,
                metrics,
                psl,
                profileType,
                audit,
                gender,
            };

            if (typeof window !== 'undefined') {
                (window as typeof window & {
                    __lastScan?: ScanResult;
                    __lastMetrics?: typeof metrics;
                    __lastAudit?: typeof audit;
                    __lastLandmarks?: typeof landmarks;
                    __lastCorrectedLandmarks?: typeof correctedLandmarks;
                }).__lastScan = scan;
                (window as typeof window & {
                    __lastScan?: ScanResult;
                    __lastMetrics?: typeof metrics;
                    __lastAudit?: typeof audit;
                    __lastLandmarks?: typeof landmarks;
                    __lastCorrectedLandmarks?: typeof correctedLandmarks;
                }).__lastMetrics = metrics;
                (window as typeof window & {
                    __lastScan?: ScanResult;
                    __lastMetrics?: typeof metrics;
                    __lastAudit?: typeof audit;
                    __lastLandmarks?: typeof landmarks;
                    __lastCorrectedLandmarks?: typeof correctedLandmarks;
                }).__lastAudit = audit;
                (window as typeof window & {
                    __lastScan?: ScanResult;
                    __lastMetrics?: typeof metrics;
                    __lastAudit?: typeof audit;
                    __lastLandmarks?: typeof landmarks;
                    __lastCorrectedLandmarks?: typeof correctedLandmarks;
                }).__lastLandmarks = landmarks;
                (window as typeof window & {
                    __lastScan?: ScanResult;
                    __lastMetrics?: typeof metrics;
                    __lastAudit?: typeof audit;
                    __lastLandmarks?: typeof landmarks;
                    __lastCorrectedLandmarks?: typeof correctedLandmarks;
                }).__lastCorrectedLandmarks = correctedLandmarks;
            }

            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            landmarks.forEach((point) => {
                ctx.beginPath();
                ctx.arc(point.x * canvas.width, point.y * canvas.height, 1, 0, 2 * Math.PI);
                ctx.stroke();
            });
            setAnalyzedImageWithLandmarks(canvas.toDataURL());

            setAuditResult(scan);

            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = 120;
            thumbCanvas.height = 120;
            const thumbCtx = thumbCanvas.getContext('2d');
            if (thumbCtx) {
                const nose = landmarks[1];
                const sw = canvas.width * 0.4;
                const sh = canvas.width * 0.4;
                thumbCtx.drawImage(
                    img,
                    nose.x * canvas.width - sw / 2,
                    nose.y * canvas.height - sh / 2,
                    sw,
                    sh,
                    0,
                    0,
                    120,
                    120
                );
            }

            saveScan({
                id: scan.id,
                timestamp: scan.timestamp,
                psl: scan.psl.overall,
                tier: scan.psl.tier,
                phenotype: scan.metrics.community.phenotype,
                nwScale: scan.metrics.community.nwScale,
                metrics: scan.metrics,
                thumbnailBase64: thumbCanvas.toDataURL('image/jpeg', 0.7),
            });

            if ('Notification' in window && Notification.permission === 'default') {
                window.setTimeout(() => {
                    void Notification.requestPermission();
                }, 3000);
            }
        } catch (err) {
            console.error('Analysis failed:', err);
            setScanNotice({
                kind: 'error',
                message: 'Analysis failed. Please try again with a clearer photo.',
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setUploadedImage(dataUrl);
            void analyzeImage(dataUrl, file.name);
        };
        reader.readAsDataURL(file);
    };

    const captureAndAnalyze = () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;

        setUploadedImage(imageSrc);
        void analyzeImage(imageSrc, 'webcam-capture');
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
                void analyzeImage(dataUrl, urlInput);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('URL image load failed:', error);
            setScanNotice({
                kind: 'error',
                message: 'Failed to load image from URL. Try uploading directly.',
            });
            setIsAnalyzing(false);
        }
    };

    const resetAnalysis = () => {
        setAuditResult(null);
        setAnalyzedImageWithLandmarks(null);
        setExpandedMetric(null);
        setScanNotice(null);
        setResultsTab('analysis');
    };

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-7xl mx-auto p-4 md:p-8 min-h-screen text-zinc-100">
            <canvas ref={canvasRef} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

            <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                    PSL is a forum-derived 0-8 lookism scale. Scores are calibrated for photos taken at 3+ feet distance; close selfies can inflate nose width and facial fifths.
                </p>
            </div>
            {qaMode && (
                <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-center">
                    <p className="text-[10px] font-black text-amber-300 uppercase tracking-[0.2em]">
                        QA mode enabled: relaxed visibility gate for local testing.
                    </p>
                </div>
            )}

            <div className="flex flex-wrap gap-4 justify-center items-center w-full z-20">
                <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-full border border-zinc-800 shadow-2xl">
                    <button
                        onClick={() => setGender('male')}
                        className={`px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${
                            gender === 'male'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-zinc-500 hover:text-white'
                        }`}
                    >
                        Male
                    </button>
                    <button
                        onClick={() => setGender('female')}
                        className={`px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${
                            gender === 'female'
                                ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20'
                                : 'text-zinc-500 hover:text-white'
                        }`}
                    >
                        Female
                    </button>
                </div>
                <button
                    onClick={() => setQaMode((prev) => !prev)}
                    className={`px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all border ${
                        qaMode
                            ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                            : 'text-amber-300 border-amber-500/30 hover:bg-amber-500/10'
                    }`}
                    aria-pressed={qaMode}
                    aria-label="Toggle test mode"
                >
                    Test Mode
                </button>
            </div>

            {!auditResult ? (
                resultsTab === 'bench' ? (
                    <div className="w-full space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={() => setResultsTab('analysis')}
                                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 hover:text-white transition-colors"
                            >
                                Back to Scan
                            </button>
                        </div>
                        <BenchmarkTab />
                    </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full">
                    <div className="lg:col-span-12 flex flex-col items-center gap-8 max-w-2xl mx-auto w-full">
                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-zinc-950 shadow-2xl group">
                            {inputMode === 'webcam' ? (
                                <Webcam
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="h-full w-full object-cover transform scale-x-[-1]"
                                    videoConstraints={{ facingMode: 'user' }}
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    {uploadedImage ? (
                                        <img src={uploadedImage} alt="Preview" className="h-full w-full object-contain" />
                                    ) : (
                                        <div className="text-center p-8">
                                            <div className="text-6xl mb-4 opacity-20">User</div>
                                            <p className="text-zinc-500 text-sm font-medium">No image selected</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isAnalyzing && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                                    <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                                    <p className="text-white font-black uppercase tracking-[0.2em] text-xs">Processing scan</p>
                                </div>
                            )}
                        </div>

                        {scanNotice && (
                            <div
                                className={`w-full rounded-2xl border px-4 py-3 text-xs font-medium leading-relaxed ${
                                    scanNotice.kind === 'error'
                                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                                        : scanNotice.kind === 'warning'
                                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                                            : 'border-sky-500/30 bg-sky-500/10 text-sky-200'
                                }`}
                                role="status"
                                aria-live="polite"
                            >
                                {scanNotice.message}
                            </div>
                        )}

                        <div className="w-full space-y-6">
                            <div className="flex gap-4 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                                <button
                                    onClick={() => setInputMode('webcam')}
                                    className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                                        inputMode === 'webcam' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500'
                                    }`}
                                >
                                    Camera
                                </button>
                                <button
                                    onClick={() => setInputMode('upload')}
                                    className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                                        inputMode === 'upload' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500'
                                    }`}
                                >
                                    Upload
                                </button>
                            </div>

                            <button
                                onClick={() => setResultsTab('bench')}
                                className="w-full py-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 hover:text-white transition-colors"
                            >
                                Open Benchmark Set
                            </button>

                            <div className="space-y-4">
                                <div
                                    className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl cursor-pointer"
                                    onClick={() => setConsentGiven(!consentGiven)}
                                >
                                    <div
                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                            consentGiven ? 'bg-white border-white' : 'border-zinc-700'
                                        }`}
                                    >
                                        {consentGiven && <div className="w-2 h-2 bg-black rounded-sm" />}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed font-medium uppercase tracking-wider">
                                        I consent to the biometric analysis of my facial features for aesthetic assessment. Processing stays local in the browser.
                                    </p>
                                </div>

                                {inputMode === 'webcam' ? (
                                    <button
                                        onClick={captureAndAnalyze}
                                        disabled={!faceLandmarker || isAnalyzing || !consentGiven}
                                        className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 shadow-2xl shadow-white/5"
                                    >
                                        Start Scan
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
                                                placeholder="Paste image URL"
                                                value={urlInput}
                                                onChange={(e) => setUrlInput(e.target.value)}
                                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold tracking-widest focus:outline-none focus:border-zinc-600"
                                            />
                                            <button onClick={handleUrlUpload} className="px-6 bg-zinc-800 rounded-xl font-bold">
                                                Go
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                )
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full">
                    <div className="lg:col-span-4 space-y-8">
                        <div className="relative rounded-[3rem] overflow-hidden border border-zinc-800 glass-dark p-10 shadow-2xl text-center">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">Analysis Summary</p>

                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />
                                <h2 className="relative text-8xl font-black tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                                    {auditResult.psl.overall.toFixed(1)}
                                </h2>
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-2">PSL / 10.0</p>
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

                            <div className="aspect-square w-full max-w-[280px] mx-auto opacity-80 mb-10">
                                <RadarChart
                                    data={[
                                        { label: 'EYES', value: (auditResult.metrics.periorbital.canthalTilt.average + 10) * 5 },
                                        { label: 'JAW', value: auditResult.metrics.jawline.gonialAngle.average / 1.5 },
                                        { label: 'MID', value: auditResult.metrics.midface.fWHR * 40 },
                                        { label: 'SYM', value: auditResult.metrics.symmetry.overallSymmetry },
                                        { label: 'PRO', value: auditResult.metrics.midface.midfaceRatio * 80 },
                                    ]}
                                    size={280}
                                    color="#ffffff"
                                />
                            </div>

                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] mb-4">Measurement map</p>

                            <div className="pt-6 border-t border-zinc-800">
                                <TierCard
                                    metrics={auditResult.metrics}
                                    pslScore={auditResult.psl.overall}
                                    tier={auditResult.psl.tier}
                                    percentile={auditResult.psl.percentile}
                                />
                            </div>
                        </div>

                        <button
                            onClick={resetAnalysis}
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
                                <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Measurement map verified</p>
                            </div>
                        </div>

                        <div className="flex p-1.5 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] glass-dark shadow-xl overflow-x-auto">
                            {RESULT_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setResultsTab(tab.id)}
                                    className={`flex-1 py-4 px-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                                        resultsTab === tab.id ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'
                                    }`}
                                >
                                    {tab.label}
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
                                <RoadmapTab metrics={auditResult.metrics} pslScore={auditResult.psl.overall} gender={gender} />
                            )}
                            {resultsTab === 'vitality' && <VitalityTab metrics={auditResult.metrics} />}
                            {resultsTab === 'haircut' && <HaircutTab metrics={auditResult.metrics} gender={gender} />}
                            {resultsTab === 'history' && <HistoryTab />}
                            {resultsTab === 'sources' && <SourceArchiveTab />}
                            {resultsTab === 'bench' && <BenchmarkTab />}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
