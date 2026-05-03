'use client';

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

import {
    calculateCanthalTilt,
    calculateFwFhRatio,
    calculateMidfaceRatio,
    calculateEyeSeparationRatio,
    calculateGonialAngle,
    calculateChinToPhiltrumRatio,
    calculateMouthToNoseWidthRatio,
    calculateBigonialWidthRatio,
    calculateLowerThirdRatio,
    calculatePalpebralFissureLength,
    calculateEyeToMouthAngle,
    calculateLipRatio,
    calculateFacialAsymmetry,
    calculateIPDRatio,
    calculateFacialThirds,
    calculateForeheadHeightRatio,
    calculatePhiltrumLength,
    calculatePSLScore,
    calculateAggregatedMetrics,
    extractEulerAngles,
    scaleLandmarks,
    reconstructPhysicalFace,
    normalizeExpression,
    auditAnalysisQuality,
    calculateCheekboneProminence,
    calculateHairlineRecession,
    calculateUpperEyelidExposure,
    distance,
    midpoint,
    MetricScores
} from '@/utils/geometry';
import { calculateCommunityStatus } from '@/utils/statistics';
import {
    calculateOrbitalRimProtrusion,
    calculateMaxillaryProtrusion,
    calculateBrowRidgeProtrusion,
    calculateInfraorbitalRimPosition,
    calculateChinProjection,
    calculateDoubleChinRisk,
    evaluateFacialTension
} from '@/utils/advanced-metrics';
import { analyzeSkinQuality } from '@/utils/image-processing';
import AnalysisTab from '@/components/AnalysisTab';
import RoadmapTab from '@/components/RoadmapTab';
import VitalityTab from '@/components/VitalityTab';
import { getHardwareProfile, extractHardwareFocalLength } from '@/utils/hardware';
import { predictPhenotype } from '@/utils/phenotype';
import { analyzeVitality } from '@/utils/vitality';
import HaircutTab from '@/components/HaircutTab';

type InputMode = 'webcam' | 'upload' | 'roll';
type Tab = 'analysis' | 'roadmap' | 'haircut' | 'vitality';

export default function FaceAnalyzer() {
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const rollInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
    const [scans, setScans] = useState<{ metrics: MetricScores, psl: { score: number, breakdown: string[], tier: string }, imageUrl: string, profileType: 'front' | 'side' }[]>([]);
    const [auditResult, setAuditResult] = useState<{ metrics: MetricScores, psl: { score: number, breakdown: string[], tier: string }, imageUrl: string, profileType: 'front' | 'side' | 'composite' } | null>(null);
    const [inputMode, setInputMode] = useState<InputMode>('webcam');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [analyzedImageWithLandmarks, setAnalyzedImageWithLandmarks] = useState<string | null>(null);
    const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [appMode, setAppMode] = useState<'single' | 'compare'>('single');
    const [compareSlot, setCompareSlot] = useState<'before' | 'after'>('before');
    const [beforeScan, setBeforeScan] = useState<{ metrics: MetricScores, psl: { score: number, breakdown: string[], tier: string }, imageUrl: string, profileType: 'front' | 'side' | 'composite' } | null>(null);
    const [afterScan, setAfterScan] = useState<{ metrics: MetricScores, psl: { score: number, breakdown: string[], tier: string }, imageUrl: string, profileType: 'front' | 'side' | 'composite' } | null>(null);

    const [urlInput, setUrlInput] = useState('');
    const [gender, setGender] = useState<'male' | 'female'>('male');

    const [consentGiven, setConsentGiven] = useState(false);
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        }
        return false;
    });
    const [resultsTab, setResultsTab] = useState<Tab>('analysis');

    useEffect(() => {
        // Suppress MediaPipe/TensorFlow Lite info messages
        const originalError = console.error;
        console.error = (...args: unknown[]) => {
            const message = args[0]?.toString() || '';
            // Filter out TensorFlow Lite initialization messages
            if (message.includes('Created TensorFlow Lite XNNPACK delegate') ||
                message.includes('INFO:')) {
                return; // Suppress these messages
            }
            originalError.apply(console, args); // Show actual errors
        };

        const initMediaPipe = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            );
            const landmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: 'CPU'
                },
                runningMode: 'IMAGE',
                numFaces: 1,
                minFaceDetectionConfidence: 0.15,
                minFacePresenceConfidence: 0.15,
                outputFacialTransformationMatrixes: true,
                outputFaceBlendshapes: true
            });
            setFaceLandmarker(landmarker);
        };

        initMediaPipe();

        // Cleanup: restore original console.error
        return () => {
            console.error = originalError;
        };
    }, []);

    const _drawLandmarks = (image: HTMLImageElement, landmarks: { x: number; y: number; z: number }[]) => {
        if (!canvasRef.current) return '';

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        const toCanvas = (landmark: { x: number; y: number }) => ({
            x: landmark.x * canvas.width,
            y: landmark.y * canvas.height
        });

        const drawLine = (idx1: number, idx2: number, color: string, label: string, width: number = 3) => {
            const p1 = toCanvas(landmarks[idx1]);
            const p2 = toCanvas(landmarks[idx2]);

            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            ctx.fillStyle = color;
            ctx.font = 'bold 14px Arial';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText(label, midX + 5, midY - 5);
            ctx.shadowBlur = 0;
        };

        const drawPoint = (idx: number, color: string, size: number = 4) => {
            const p = toCanvas(landmarks[idx]);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, 2 * Math.PI);
            ctx.fill();
        };

        // Draw key measurement lines with labels
        drawLine(133, 33, '#00FF00', 'Canthal Tilt (R)');
        drawLine(362, 263, '#00FF00', 'Canthal Tilt (L)');
        drawLine(234, 454, '#FF6B00', 'Face Width');
        drawLine(10, 152, '#FF9500', 'Face Height');
        drawLine(234, 152, '#FF0000', 'Jaw (R)');
        drawLine(454, 152, '#FF0000', 'Jaw (L)');
        drawLine(168, 2, '#FFFF00', 'Midface');
        drawLine(48, 278, '#FF00FF', 'Nose Width');
        drawLine(61, 291, '#9D00FF', 'Mouth Width');
        drawLine(10, 168, '#0080FF', 'Upper Third');
        drawLine(168, 2, '#0080FF', 'Middle Third');
        drawLine(2, 152, '#0080FF', 'Lower Third');
        drawLine(159, 386, '#00FFFF', 'IPD (Eye Centers)'); // Fixed: use eye centers instead of invalid pupil landmarks

        [10, 152, 168, 2, 234, 454, 33, 263, 133, 362, 61, 291, 48, 278, 159, 386].forEach(idx => {
            drawPoint(idx, '#FFFFFF', 3);
        });

        return canvas.toDataURL('image/jpeg');
    };

    // Draw landmarks on canvas element (for normalized canvas from image processing)
    const _drawLandmarksOnCanvas = (inputCanvas: HTMLCanvasElement, landmarks: { x: number; y: number; z: number }[]): string => {
        // Create a new canvas to draw on (don't modify the input)
        const canvas = document.createElement('canvas');
        canvas.width = inputCanvas.width;
        canvas.height = inputCanvas.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        console.log('=== LANDMARK DEBUG ===');
        console.log('Input canvas dimensions:', inputCanvas.width, 'x', inputCanvas.height);
        console.log('Output canvas dimensions:', canvas.width, 'x', canvas.height);
        console.log('Landmark 0 (nose tip) raw:', landmarks[1]?.x, landmarks[1]?.y);
        console.log('Landmark 0 mapped to px:', landmarks[1]?.x * canvas.width, landmarks[1]?.y * canvas.height);
        console.log('Landmark 133 (R inner eye):', landmarks[133]?.x * canvas.width, landmarks[133]?.y * canvas.height);
        console.log('Landmark 362 (L inner eye):', landmarks[362]?.x * canvas.width, landmarks[362]?.y * canvas.height);
        console.log('Landmark 152 (chin):', landmarks[152]?.x * canvas.width, landmarks[152]?.y * canvas.height);

        // Copy the input canvas content
        ctx.drawImage(inputCanvas, 0, 0);

        const toCanvas = (landmark: { x: number; y: number }) => ({
            x: landmark.x * canvas.width,
            y: landmark.y * canvas.height
        });

        const drawLine = (idx1: number, idx2: number, color: string, label: string, width: number = 3) => {
            const p1 = toCanvas(landmarks[idx1]);
            const p2 = toCanvas(landmarks[idx2]);

            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            ctx.fillStyle = color;
            ctx.font = 'bold 14px Arial';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText(label, midX + 5, midY - 5);
            ctx.shadowBlur = 0;
        };

        const drawPoint = (idx: number, color: string, size: number = 4) => {
            const p = toCanvas(landmarks[idx]);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, 2 * Math.PI);
            ctx.fill();
        };

        // Draw key measurement lines with labels
        // Use visible face contour points, NOT ear/temple landmarks
        drawLine(133, 33, '#00FF00', 'Canthal Tilt (R)');
        drawLine(362, 263, '#00FF00', 'Canthal Tilt (L)');
        drawLine(93, 323, '#FF6B00', 'Face Width');        // 93/323 = visible cheekbone contour (not 234/454 which are at ears)
        drawLine(10, 152, '#FF9500', 'Face Height');
        drawLine(132, 152, '#FF0000', 'Jaw (L)');           // 132 = left jaw contour visible point
        drawLine(361, 152, '#FF0000', 'Jaw (R)');           // 361 = right jaw contour visible point
        drawLine(132, 361, '#FFAA00', 'Jaw Width');
        drawLine(168, 2, '#FFFF00', 'Midface');
        drawLine(48, 278, '#FF00FF', 'Nose Width');
        drawLine(61, 291, '#9D00FF', 'Mouth Width');
        drawLine(10, 168, '#0080FF', 'Upper Third');
        drawLine(168, 2, '#0080FF', 'Middle Third');
        drawLine(2, 152, '#0080FF', 'Lower Third');
        drawLine(133, 362, '#00FFFF', 'IPD');

        [10, 152, 168, 2, 93, 323, 132, 361, 33, 263, 133, 362, 61, 291, 48, 278].forEach(idx => {
            drawPoint(idx, '#FFFFFF', 4);
        });

        return canvas.toDataURL('image/jpeg');
    };

    const analyzeImage = async (imageSrc: string, hwFocalLength_mm?: number): Promise<boolean> => {
        if (!faceLandmarker) return false;
        setIsAnalyzing(true);

        try {
            const img = new Image();
            img.src = imageSrc;
            await img.decode();

            const analyzedCanvas = document.createElement('canvas');
            analyzedCanvas.width = img.width;
            analyzedCanvas.height = img.height;
            const ctx = analyzedCanvas.getContext('2d');
            if (!ctx) return false;
            ctx.drawImage(img, 0, 0);

            const results = faceLandmarker.detect(analyzedCanvas);
            
            if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
                alert('⚠️ No face detected. Please use a clearer photo.');
                setIsAnalyzing(false);
                return false;
            }

            const landmarks = results.faceLandmarks[0];
            const matrix = results.facialTransformationMatrixes ? results.facialTransformationMatrixes[0] : null;

            // 1. Profile Type
            let profileType: 'front' | 'side' = 'front';
            if (matrix) {
                const euler = extractEulerAngles(matrix);
                profileType = Math.abs(euler.yaw) > 30 ? 'side' : 'front';
            }

            // 2. Image Quality Audit
            const imageLuminance = (() => {
                try {
                    const imageData = ctx.getImageData(0, 0, analyzedCanvas.width, analyzedCanvas.height).data;
                    let sum = 0;
                    for (let i = 0; i < imageData.length; i += 40) {
                        sum += (0.299 * imageData[i] + 0.587 * imageData[i+1] + 0.114 * imageData[i+2]);
                    }
                    return sum / (imageData.length / 40);
                } catch { return 100; }
            })();

            // 3. 3D Metric Reconstruction (Hardware-Aware)
            const rawPhysicalLandmarks = reconstructPhysicalFace(
                landmarks, 
                matrix as unknown, 
                analyzedCanvas.width, 
                analyzedCanvas.height,
                hwFocalLength_mm,
                hwProfile.sensorWidth_mm
            );

            // 4. Expression Normalization
            const physicalLandmarks = normalizeExpression(rawPhysicalLandmarks, results.faceBlendshapes);

            // 5. Quality Audit
            const audit = auditAnalysisQuality(matrix as unknown, results.faceBlendshapes, imageLuminance);

            // 6. Metrics Calculation
            const scaledLandmarks = scaleLandmarks(landmarks, analyzedCanvas.width, analyzedCanvas.height);
            const facialThirdsData = calculateFacialThirds(scaledLandmarks);
            const tensionData = evaluateFacialTension(results.faceBlendshapes || []);
            const skinQualityData = analyzeSkinQuality(img, landmarks);
            
            // NEW: Vitality & Phenotype
            const phenotype = predictPhenotype({
                fwfhRatio: calculateFwFhRatio(physicalLandmarks, 0, 0),
                midfaceRatio: calculateMidfaceRatio(physicalLandmarks, 0),
                noseWidthRatio: distance(physicalLandmarks[48], physicalLandmarks[278]) / distance(physicalLandmarks[234], physicalLandmarks[454]),
                bigonialWidthRatio: calculateBigonialWidthRatio(physicalLandmarks)
            });
            
            const vitality = analyzeVitality(
                ctx.getImageData(0, 0, analyzedCanvas.width, analyzedCanvas.height).data,
                landmarks,
                analyzedCanvas.width,
                analyzedCanvas.height
            );

            const metrics: MetricScores = {
                canthalTilt: calculateCanthalTilt(physicalLandmarks),
                fwfhRatio: calculateFwFhRatio(physicalLandmarks, 0, 0),
                midfaceRatio: calculateMidfaceRatio(physicalLandmarks, 0),
                eyeSeparationRatio: calculateEyeSeparationRatio(physicalLandmarks),
                gonialAngle: calculateGonialAngle(physicalLandmarks),
                chinToPhiltrumRatio: calculateChinToPhiltrumRatio(physicalLandmarks),
                mouthToNoseWidthRatio: calculateMouthToNoseWidthRatio(physicalLandmarks),
                bigonialWidthRatio: calculateBigonialWidthRatio(physicalLandmarks),
                lowerThirdRatio: calculateLowerThirdRatio(physicalLandmarks, 0),
                palpebralFissureLength: calculatePalpebralFissureLength(physicalLandmarks),
                eyeToMouthAngle: calculateEyeToMouthAngle(physicalLandmarks),
                lipRatio: calculateLipRatio(physicalLandmarks),
                facialAsymmetry: calculateFacialAsymmetry(physicalLandmarks),
                ipdRatio: calculateIPDRatio(physicalLandmarks),
                facialThirdsRatio: facialThirdsData.ratio,
                foreheadHeightRatio: calculateForeheadHeightRatio(physicalLandmarks),
                noseWidthRatio: distance(physicalLandmarks[48], physicalLandmarks[278]) / distance(physicalLandmarks[234], physicalLandmarks[454]),
                cheekboneProminence: calculateCheekboneProminence(physicalLandmarks),
                hairlineRecession: calculateHairlineRecession(physicalLandmarks),
                orbitalRimProtrusion: calculateOrbitalRimProtrusion(physicalLandmarks),
                maxillaryProtrusion: calculateMaxillaryProtrusion(physicalLandmarks),
                browRidgeProtrusion: calculateBrowRidgeProtrusion(physicalLandmarks),
                infraorbitalRimPosition: calculateInfraorbitalRimPosition(physicalLandmarks),
                chinProjection: calculateChinProjection(physicalLandmarks),
                doubleChinRisk: calculateDoubleChinRisk(physicalLandmarks),
                angleDeduction: 0,
                facialTension: tensionData.tensionScore,
                skinQuality: skinQualityData.clarityScore,
                upperEyelidExposure: calculateUpperEyelidExposure(physicalLandmarks),
                philtrumLength: calculatePhiltrumLength(physicalLandmarks),
                physicalIPD: distance(midpoint(physicalLandmarks[33], physicalLandmarks[133]), midpoint(physicalLandmarks[263], physicalLandmarks[362])),
                physicalJawWidth: distance(physicalLandmarks[58], physicalLandmarks[288]),
                physicalFaceWidth: distance(physicalLandmarks[234], physicalLandmarks[454]),
                physicalFaceHeight: distance(physicalLandmarks[10], physicalLandmarks[152]),
                audit: audit,
                hairQualityScore: 50,
                
                // GOD-TIER ADDITIONS
                phenotype,
                vitality
            };

            const pslData = calculatePSLScore(metrics, gender, profileType);

            // 7. Annotated Image
            const drawAnnotated = () => {
                const canvas = document.createElement('canvas');
                canvas.width = analyzedCanvas.width;
                canvas.height = analyzedCanvas.height;
                const ctx2 = canvas.getContext('2d');
                if (!ctx2) return '';
                ctx2.drawImage(analyzedCanvas, 0, 0);

                const toPixel = (idx: number) => ({
                    x: landmarks[idx].x * canvas.width,
                    y: landmarks[idx].y * canvas.height
                });

                ctx2.strokeStyle = '#00FF00';
                ctx2.lineWidth = 3;
                [ [133, 33], [362, 263], [93, 323], [10, 152] ].forEach(([i1, i2]) => {
                    const p1 = toPixel(i1), p2 = toPixel(i2);
                    ctx2.beginPath(); ctx2.moveTo(p1.x, p1.y); ctx2.lineTo(p2.x, p2.y); ctx2.stroke();
                });

                return canvas.toDataURL('image/jpeg', 0.9);
            };

            const annotatedImage = drawAnnotated();
            const newScan = { metrics, psl: pslData, imageUrl: annotatedImage, profileType };

            // 8. State Updates (Single vs Compare)
            if (appMode === 'single') {
                setScans(prev => {
                    const updated = [...prev, newScan];
                    const compositeMetrics = calculateAggregatedMetrics(updated);
                    if (compositeMetrics) {
                        const combinedType = (updated.some(s => s.profileType === 'front') && updated.some(s => s.profileType === 'side')) ? 'composite' : profileType;
                        const mergedScore = calculatePSLScore(compositeMetrics, gender, combinedType);
                        setAuditResult({
                            metrics: compositeMetrics,
                            psl: mergedScore,
                            imageUrl: annotatedImage,
                            profileType: combinedType
                        });
                    }
                    return updated;
                });
            } else if (appMode === 'compare') {
                if (compareSlot === 'before') setBeforeScan(newScan);
                else setAfterScan(newScan);
            }

            setAnalyzedImageWithLandmarks(annotatedImage);
            setIsAnalyzing(false);
            return true;
        } catch (error) {
            console.error("Analysis Error:", error);
            setIsAnalyzing(false);
            return false;
        }
    };
    const captureAndAnalyze = () => {
        if (!webcamRef.current || !faceLandmarker) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            analyzeImage(imageSrc);
        }
    };

    const [hwProfile, _setHwProfile] = React.useState(() => getHardwareProfile());

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !faceLandmarker) return;

        const fileArray = Array.from(files);
        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];

            // EXTRACT HARDWARE METADATA (EXIF)
            const buffer = await file.arrayBuffer();
            const exifFocalLength = extractHardwareFocalLength(buffer);

            const imageSrc = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    resolve(event.target?.result as string);
                };
                reader.readAsDataURL(file);
            });

            if (i === fileArray.length - 1) {
                setUploadedImage(imageSrc);
            }

            const success = await analyzeImage(imageSrc, exifFocalLength || undefined);

            if (success && i < fileArray.length - 1) {
                await new Promise(r => setTimeout(r, 600));
            }
        }

        // After processing identity checks inside the scans map, if length > 1 verify variance
        // Wait another 50ms for state to settle
        setTimeout(() => {
            setScans(currentScans => {
                if (currentScans.length > 1) {
                    const baseScan = currentScans[0];
                    let identityVarianceViolations = 0;
                    for (let j = 1; j < currentScans.length; j++) {
                        const targetScan = currentScans[j];
                        // If same profile types exist, compare basic bone ratios
                        if (baseScan.profileType === 'front' && targetScan.profileType === 'front') {
                            const fwhrDiff = Math.abs(baseScan.metrics.fwfhRatio - targetScan.metrics.fwfhRatio) / baseScan.metrics.fwfhRatio;
                            const ipdDiff = Math.abs(baseScan.metrics.ipdRatio - targetScan.metrics.ipdRatio) / baseScan.metrics.ipdRatio;
                            // Difference greater than 15% in hard bone tissue is highly suspicious of being 2 different people
                            if (fwhrDiff > 0.15 || ipdDiff > 0.15) {
                                identityVarianceViolations++;
                            }
                        }
                    }

                    if (identityVarianceViolations > 0) {
                        alert("⚠️ Multiple identities detected! The facial proportions (bone structure ratios) vary significantly between the uploaded photos. Are you sure these are all of the same person?");
                    }
                }
                return currentScans;
            });
        }, 100);

        // Reset input so they can upload same file again if desired
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const _generateFinalReport = () => {
        if (scans.length === 0) return;

        const compositeMetrics = calculateAggregatedMetrics(scans);
        if (compositeMetrics) {
            const hasFront = scans.some(s => s.profileType === 'front');
            const hasSide = scans.some(s => s.profileType === 'side');
            const combinedType = (hasFront && hasSide) ? 'composite' : scans[scans.length - 1].profileType;

            const mergedScore = calculatePSLScore(compositeMetrics, gender, combinedType);

            setAuditResult({
                metrics: compositeMetrics,
                psl: mergedScore,
                imageUrl: scans[scans.length - 1].imageUrl,
                profileType: combinedType
            });
        }
    };

    const handleUrlUpload = async () => {
        const trimmedUrl = urlInput.trim();
        if (!trimmedUrl || !faceLandmarker) return;

        setIsAnalyzing(true);
        try {
            // Load image via a CORS proxy (allorigins) into a canvas to extract a data URL
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(trimmedUrl)}`;
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { setIsAnalyzing(false); return; }
                ctx.drawImage(img, 0, 0);
                try {
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                    setUploadedImage(dataUrl);
                    setUrlInput('');
                    analyzeImage(dataUrl);
                } catch {
                    setIsAnalyzing(false);
                    alert('⚠️ Could not load image from that URL (CORS blocked). Try uploading the image directly instead.');
                }
            };
            img.onerror = () => {
                setIsAnalyzing(false);
                alert('⚠️ Failed to load image from URL. Make sure the URL is a direct link to an image file (e.g. .jpg, .png).');
            };
            img.src = proxyUrl;
        } catch {
            setIsAnalyzing(false);
            alert('⚠️ Failed to fetch image from URL.');
        }
    };

    const _getRating = (metric: keyof MetricScores, value: number, gender: 'male' | 'female' = 'male'): { text: string, color: string } => {
        if (gender === 'female') {
            const fRatings: Record<string, { text: string, color: string }> = {
                canthalTilt: value >= 5 && value <= 9.5 ? { text: 'perfect feline tilt', color: 'text-green-400' } : value > 2 ? { text: 'good', color: 'text-blue-400' } : value < 0 ? { text: 'negative tilt', color: 'text-red-400' } : { text: 'neutral', color: 'text-yellow-400' },
                fwfhRatio: value >= 1.55 ? { text: 'perfect (heart/oval)', color: 'text-green-400' } : value >= 1.45 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow face', color: 'text-orange-400' },
                midfaceRatio: value >= 0.80 && value <= 1.05 ? { text: 'perfect compact midface', color: 'text-green-400' } : (value >= 0.75 && value <= 1.15) ? { text: 'good', color: 'text-blue-400' } : value < 0.75 ? { text: 'excessively compact', color: 'text-red-400' } : { text: 'long midface', color: 'text-red-400' },
                gonialAngle: value >= 105 && value <= 130 ? { text: 'perfect feminine angle', color: 'text-green-400' } : value >= 100 && value <= 135 ? { text: 'good', color: 'text-blue-400' } : { text: 'square/steep', color: 'text-orange-400' },
                chinToPhiltrumRatio: value >= 2.0 && value <= 2.75 ? { text: 'perfect', color: 'text-green-400' } : value < 1.6 ? { text: 'long philtrum / short chin', color: 'text-red-400' } : value > 3.4 ? { text: 'very long chin', color: 'text-orange-400' } : value < 1.8 ? { text: 'slightly long philtrum', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
                mouthToNoseWidthRatio: value >= 1.45 && value <= 1.6 ? { text: 'perfect', color: 'text-green-400' } : value >= 1.35 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow mouth', color: 'text-orange-400' },
                bigonialWidthRatio: value >= 1.15 && value <= 1.3 ? { text: 'perfect oval jaw', color: 'text-green-400' } : value >= 1.1 ? { text: 'good', color: 'text-blue-400' } : value > 1.35 ? { text: 'very wide jaw', color: 'text-orange-400' } : { text: 'narrow', color: 'text-orange-400' },
                lowerThirdRatio: value >= 0.58 && value <= 0.65 ? { text: 'perfect balance', color: 'text-green-400' } : value >= 0.55 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal lower third', color: 'text-orange-400' },
                palpebralFissureLength: value >= 2.8 && value <= 3.5 ? { text: 'perfect doe eyes', color: 'text-green-400' } : value > 3.5 ? { text: 'long fissures', color: 'text-blue-400' } : { text: 'round eyes', color: 'text-yellow-400' },
                eyeSeparationRatio: value >= 0.45 && value <= 0.47 ? { text: 'perfect', color: 'text-green-400' } : value >= 0.42 && value <= 0.49 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal spacing', color: 'text-yellow-400' },
                eyeToMouthAngle: value >= 47 && value <= 50 ? { text: 'perfect', color: 'text-green-400' } : value < 47 ? { text: 'shallow', color: 'text-yellow-400' } : { text: 'steep', color: 'text-yellow-400' },
                lipRatio: value >= 1.15 && value <= 1.70 ? { text: 'perfect full lips', color: 'text-green-400' } : value >= 1.00 && value <= 2.00 ? { text: 'acceptable', color: 'text-blue-400' } : { text: 'suboptimal lip ratio', color: 'text-orange-400' },
                facialAsymmetry: value >= 93 ? { text: 'perfectly symmetric', color: 'text-green-400' } : value >= 85 ? { text: 'very symmetric', color: 'text-blue-400' } : value >= 80 ? { text: 'acceptable symmetry', color: 'text-yellow-400' } : { text: 'asymmetric', color: 'text-orange-400' },
                ipdRatio: value >= 0.45 && value <= 0.47 ? { text: 'ideal eye spacing', color: 'text-green-400' } : value >= 0.42 && value <= 0.49 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal spacing', color: 'text-yellow-400' },
                facialThirdsRatio: value >= 95 ? { text: 'perfect thirds', color: 'text-green-400' } : value >= 85 ? { text: 'good proportions', color: 'text-blue-400' } : value >= 75 ? { text: 'acceptable', color: 'text-yellow-400' } : { text: 'unbalanced thirds', color: 'text-orange-400' },
                foreheadHeightRatio: value >= 0.30 && value <= 0.35 ? { text: 'ideal forehead', color: 'text-green-400' } : value > 0.38 ? { text: 'fivehead (large)', color: 'text-orange-400' } : value < 0.28 ? { text: 'short forehead', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
                noseWidthRatio: value >= 0.22 && value <= 0.28 ? { text: 'ideal narrow nose', color: 'text-green-400' } : value > 0.32 ? { text: 'wide nose', color: 'text-orange-400' } : value < 0.20 ? { text: 'very narrow', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
                cheekboneProminence: value >= 0.38 && value <= 0.52 ? { text: 'prominent cheekbones', color: 'text-green-400' } : value >= 0.33 ? { text: 'good projection', color: 'text-blue-400' } : { text: 'flat cheekbones', color: 'text-yellow-400' },
                hairlineRecession: value >= 95 ? { text: 'full hairline', color: 'text-green-400' } : value >= 85 ? { text: 'good hairline', color: 'text-blue-400' } : value >= 70 ? { text: 'minor recession', color: 'text-yellow-400' } : value >= 50 ? { text: 'receding hairline', color: 'text-orange-400' } : { text: 'significant hair loss', color: 'text-red-400' },
                orbitalRimProtrusion: value > 0.005 ? { text: 'good eye depth', color: 'text-green-400' } : value > -0.005 ? { text: 'neutral depth', color: 'text-yellow-400' } : { text: 'bulging eyes', color: 'text-red-400' },
                maxillaryProtrusion: value > 0.02 ? { text: 'forward maxilla (ideal)', color: 'text-green-400' } : value > 0.01 ? { text: 'good maxilla', color: 'text-blue-400' } : value > -0.005 ? { text: 'neutral', color: 'text-yellow-400' } : { text: 'retruded maxilla', color: 'text-red-400' },
                browRidgeProtrusion: value <= 0.010 ? { text: 'smooth feminine brow', color: 'text-green-400' } : value > 0.015 ? { text: 'masculine/prominent brow', color: 'text-orange-400' } : { text: 'neutral brow', color: 'text-blue-400' },
                infraorbitalRimPosition: value > 0.01 ? { text: 'forward infraorbital rim', color: 'text-green-400' } : value > -0.005 ? { text: 'neutral', color: 'text-blue-400' } : { text: 'retruded (dark circles)', color: 'text-orange-400' },
                chinProjection: value > 0.015 ? { text: 'strong feminine chin', color: 'text-green-400' } : value > 0.005 ? { text: 'good projection', color: 'text-blue-400' } : value > -0.005 ? { text: 'weak chin', color: 'text-yellow-400' } : { text: 'recessed chin', color: 'text-red-400' },
                doubleChinRisk: value > 0.02 ? { text: 'sharp jawline', color: 'text-green-400' } : value > 0.008 ? { text: 'good definition', color: 'text-blue-400' } : value > 0 ? { text: 'soft jawline', color: 'text-yellow-400' } : { text: 'submental fullness', color: 'text-orange-400' },
                angleDeduction: value === 0 ? { text: 'ideal camera setup', color: 'text-green-400' } : value <= 0.5 ? { text: 'minor tilt', color: 'text-yellow-400' } : { text: 'high distortion check', color: 'text-red-400' },
                facialTension: value < 0.5 ? { text: 'relaxed / neutral', color: 'text-green-400' } : value < 1.2 ? { text: 'minor tension', color: 'text-yellow-400' } : { text: 'high tension detected', color: 'text-orange-400' },
                skinQuality: value > 90 ? { text: 'glass skin', color: 'text-green-400' } : value > 75 ? { text: 'clear skin', color: 'text-blue-400' } : value > 50 ? { text: 'textured', color: 'text-yellow-400' } : { text: 'acne / heavy texture', color: 'text-red-400' },
                hairQualityScore: value >= 85 ? { text: 'elite grooming', color: 'text-green-400' } : value >= 65 ? { text: 'well-groomed', color: 'text-blue-400' } : value >= 40 ? { text: 'average grooming', color: 'text-yellow-400' } : { text: 'unkempt / poor', color: 'text-red-400' }
            };
            return fRatings[metric] || { text: 'unknown', color: 'text-gray-400' };
        }

        // Male Ratings
        const mRatings: Record<string, { text: string, color: string }> = {
            canthalTilt: value >= 4 && value <= 6 ? { text: 'perfect hunter eyes', color: 'text-green-400' } : value > 2 ? { text: 'good', color: 'text-blue-400' } : value < 0 ? { text: 'negative canthal tilt', color: 'text-red-400' } : { text: 'neutral', color: 'text-yellow-400' },
            fwfhRatio: value >= 1.65 ? { text: 'perfect broad face', color: 'text-green-400' } : value >= 1.55 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow face', color: 'text-orange-400' },
            midfaceRatio: value >= 0.75 && value <= 1.05 ? { text: 'perfect compact midface', color: 'text-green-400' } : (value >= 0.70 && value <= 1.10) ? { text: 'good', color: 'text-blue-400' } : value < 0.70 ? { text: 'excessively compact', color: 'text-red-400' } : { text: 'long midface', color: 'text-red-400' },
            gonialAngle: value >= 110 && value <= 125 ? { text: 'perfect masculine square', color: 'text-green-400' } : value >= 100 && value <= 130 ? { text: 'good', color: 'text-blue-400' } : { text: 'steep/soft jawline', color: 'text-orange-400' },
            chinToPhiltrumRatio: value >= 2.5 && value <= 3.2 ? { text: 'perfect', color: 'text-green-400' } : value < 1.6 ? { text: 'long philtrum / weak chin', color: 'text-red-400' } : value > 3.8 ? { text: 'very long chin', color: 'text-orange-400' } : value < 2.0 ? { text: 'slightly long philtrum', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
            mouthToNoseWidthRatio: value >= 1.30 && value <= 1.62 ? { text: 'perfect', color: 'text-green-400' } : value >= 1.20 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow mouth', color: 'text-orange-400' },
            bigonialWidthRatio: value >= 1.05 && value <= 1.25 ? { text: 'perfect wide jaw', color: 'text-green-400' } : value <= 1.35 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow jaw', color: 'text-orange-400' },
            lowerThirdRatio: value >= 0.62 ? { text: 'perfect masculine lower third', color: 'text-green-400' } : value >= 0.58 ? { text: 'good', color: 'text-blue-400' } : { text: 'weak lower third', color: 'text-orange-400' },
            palpebralFissureLength: value >= 3.0 && value <= 3.5 ? { text: 'perfect horizontal eyes', color: 'text-green-400' } : value > 3.5 ? { text: 'good', color: 'text-blue-400' } : { text: 'slightly too round eyes', color: 'text-yellow-400' },
            eyeSeparationRatio: value >= 0.45 && value <= 0.47 ? { text: 'perfect', color: 'text-green-400' } : value >= 0.42 && value <= 0.49 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal spacing', color: 'text-yellow-400' },
            eyeToMouthAngle: value >= 46 && value <= 50 ? { text: 'perfect', color: 'text-green-400' } : value < 46 ? { text: 'shallow', color: 'text-yellow-400' } : { text: 'steep', color: 'text-yellow-400' },
            lipRatio: value >= 1.20 && value <= 1.70 ? { text: 'perfect', color: 'text-green-400' } : value >= 1.00 && value <= 2.20 ? { text: 'acceptable', color: 'text-blue-400' } : { text: 'suboptimal lip ratio', color: 'text-orange-400' },
            facialAsymmetry: value >= 93 ? { text: 'perfectly symmetric', color: 'text-green-400' } : value >= 85 ? { text: 'very symmetric', color: 'text-blue-400' } : value >= 80 ? { text: 'acceptable symmetry', color: 'text-yellow-400' } : { text: 'asymmetric', color: 'text-orange-400' },
            ipdRatio: value >= 0.45 && value <= 0.47 ? { text: 'ideal eye spacing', color: 'text-green-400' } : value >= 0.42 && value <= 0.49 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal spacing', color: 'text-yellow-400' },
            facialThirdsRatio: value >= 95 ? { text: 'perfect thirds', color: 'text-green-400' } : value >= 85 ? { text: 'good proportions', color: 'text-blue-400' } : value >= 70 ? { text: 'acceptable', color: 'text-yellow-400' } : { text: 'unbalanced thirds', color: 'text-orange-400' },
            foreheadHeightRatio: value >= 0.30 && value <= 0.35 ? { text: 'ideal forehead', color: 'text-green-400' } : value > 0.38 ? { text: 'fivehead (large)', color: 'text-orange-400' } : value < 0.28 ? { text: 'short forehead', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
            noseWidthRatio: value >= 0.25 && value <= 0.32 ? { text: 'ideal nose width', color: 'text-green-400' } : value > 0.37 ? { text: 'wide nose', color: 'text-orange-400' } : value < 0.22 ? { text: 'narrow nose', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
            cheekboneProminence: value >= 0.35 && value <= 0.50 ? { text: 'prominent cheekbones', color: 'text-green-400' } : value >= 0.30 ? { text: 'good projection', color: 'text-blue-400' } : { text: 'flat cheekbones', color: 'text-yellow-400' },
            hairlineRecession: value >= 95 ? { text: 'full hairline', color: 'text-green-400' } : value >= 85 ? { text: 'good hairline', color: 'text-blue-400' } : value >= 70 ? { text: 'minor recession', color: 'text-yellow-400' } : value >= 50 ? { text: 'receding hairline', color: 'text-orange-400' } : { text: 'significant hair loss', color: 'text-red-400' },
            orbitalRimProtrusion: value > 0.015 ? { text: 'deep-set eyes (ideal)', color: 'text-green-400' } : value > 0.005 ? { text: 'good eye depth', color: 'text-blue-400' } : value > -0.005 ? { text: 'neutral depth', color: 'text-yellow-400' } : { text: 'bulging eyes', color: 'text-red-400' },
            maxillaryProtrusion: value > 0.02 ? { text: 'forward maxilla (ideal)', color: 'text-green-400' } : value > 0.01 ? { text: 'good maxilla', color: 'text-blue-400' } : value > -0.005 ? { text: 'neutral', color: 'text-yellow-400' } : { text: 'retruded maxilla', color: 'text-red-400' },
            browRidgeProtrusion: value > 0.015 ? { text: 'prominent brow (masculine)', color: 'text-green-400' } : value > 0.005 ? { text: 'good brow ridge', color: 'text-blue-400' } : { text: 'flat brow', color: 'text-yellow-400' },
            infraorbitalRimPosition: value > 0.01 ? { text: 'forward infraorbital rim', color: 'text-green-400' } : value > -0.005 ? { text: 'neutral', color: 'text-blue-400' } : { text: 'retruded (dark circles)', color: 'text-orange-400' },
            chinProjection: value > 0.025 ? { text: 'strong chin', color: 'text-green-400' } : value > 0.01 ? { text: 'good projection', color: 'text-blue-400' } : value > 0 ? { text: 'weak chin', color: 'text-yellow-400' } : { text: 'recessed chin', color: 'text-red-400' },
            doubleChinRisk: value > 0.02 ? { text: 'sharp jawline', color: 'text-green-400' } : value > 0.008 ? { text: 'good definition', color: 'text-blue-400' } : value > 0 ? { text: 'soft jawline', color: 'text-yellow-400' } : { text: 'submental fullness', color: 'text-orange-400' },
            angleDeduction: value === 0 ? { text: 'ideal camera setup', color: 'text-green-400' } : value <= 0.5 ? { text: 'minor tilt', color: 'text-yellow-400' } : { text: 'high distortion check', color: 'text-red-400' },
            facialTension: value < 0.5 ? { text: 'relaxed / neutral', color: 'text-green-400' } : value < 1.2 ? { text: 'minor tension', color: 'text-yellow-400' } : { text: 'high tension detected', color: 'text-orange-400' },
            skinQuality: value > 90 ? { text: 'glass skin', color: 'text-green-400' } : value > 75 ? { text: 'clear skin', color: 'text-blue-400' } : value > 50 ? { text: 'textured', color: 'text-yellow-400' } : { text: 'acne / heavy texture', color: 'text-red-400' },
            hairQualityScore: value >= 85 ? { text: 'elite grooming', color: 'text-green-400' } : value >= 65 ? { text: 'well-groomed', color: 'text-blue-400' } : value >= 40 ? { text: 'average grooming', color: 'text-yellow-400' } : { text: 'unkempt / poor', color: 'text-red-400' }
        };

        return mRatings[metric] || { text: 'unknown', color: 'text-gray-400' };
    };

    const _getIdealRange = (metric: keyof MetricScores, gender: 'male' | 'female' = 'male'): string => {
        if (gender === 'female') {
            const fIdeals: Record<string, string> = {
                canthalTilt: '5° to 9.5°',
                fwfhRatio: '> 1.55',
                midfaceRatio: '0.8 to 1.05',
                gonialAngle: '105° to 130°',
                chinToPhiltrumRatio: '2.0 to 2.75',
                mouthToNoseWidthRatio: '1.45 to 1.6',
                bigonialWidthRatio: '1.15 to 1.30',
                lowerThirdRatio: '0.58 to 0.65',
                palpebralFissureLength: '2.8 to 3.5',
                eyeSeparationRatio: '0.45 to 0.47',
                eyeToMouthAngle: '47° to 50°',
                lipRatio: '1.15 to 1.70',
                facialAsymmetry: '93-100 (symmetry score)',
                ipdRatio: '0.45 to 0.47',
                facialThirdsRatio: '95-100 (balance score)',
                foreheadHeightRatio: '0.30 to 0.35',
                noseWidthRatio: '0.22 to 0.28',
                cheekboneProminence: '0.38 to 0.52',
                hairlineRecession: '90-100 (fullness score)',
                orbitalRimProtrusion: '> 0.005 (neutral to deep)',
                maxillaryProtrusion: '> 0.02 (forward)',
                browRidgeProtrusion: '< 0.010 (smooth brow)',
                infraorbitalRimPosition: '> 0.01 (forward)',
                chinProjection: '> 0.015 (strong)',
                doubleChinRisk: '> 0.020 (sharp jaw)',
                angleDeduction: '0 (neutral)',
                facialTension: '< 0.5 (relaxed)',
                skinQuality: '85-100 (clear)',
                hairQualityScore: '65-100 (groomed)'
            };
            return fIdeals[metric] || '';
        }

        const mIdeals: Partial<Record<keyof MetricScores, string>> = {
            canthalTilt: '4° to 6°',
            fwfhRatio: '> 1.65',
            midfaceRatio: '0.75 to 1.05',
            gonialAngle: '110° to 125°',
            chinToPhiltrumRatio: '2.5 to 3.2',
            mouthToNoseWidthRatio: '1.30 to 1.62',
            bigonialWidthRatio: '1.05 to 1.25',
            lowerThirdRatio: 'more than 0.62',
            palpebralFissureLength: '3.0 to 3.5',
            eyeSeparationRatio: '0.45 to 0.47',
            eyeToMouthAngle: '46° to 50°',
            lipRatio: '1.20 to 1.70',
            facialAsymmetry: '93-100 (symmetry score)',
            ipdRatio: '0.45 to 0.47',
            facialThirdsRatio: '95-100 (balance score)',
            foreheadHeightRatio: '0.30 to 0.35',
            noseWidthRatio: '0.25 to 0.32',
            cheekboneProminence: '0.35 to 0.50',
            hairlineRecession: '90-100 (fullness score)',
            orbitalRimProtrusion: '> 0.015 (deep-set)',
            maxillaryProtrusion: '> 0.02 (forward)',
            browRidgeProtrusion: '> 0.015 (prominent)',
            infraorbitalRimPosition: '> 0.01 (forward)',
            chinProjection: '> 0.025 (strong)',
            doubleChinRisk: '> 0.020 (sharp jaw)',
            angleDeduction: '0 (neutral)',
            facialTension: '< 0.5 (relaxed)',
            skinQuality: '85-100 (clear)',
            hairQualityScore: '65-100 (groomed)'
        };
        return mIdeals[metric] || '';
    };

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-7xl mx-auto p-4 md:p-8">
            {/* Hidden canvas for drawing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {/* Hidden file input for gallery / file uploads */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
            />
            {/* Hidden file input for mobile Camera Roll (no capture attr so it opens gallery) */}
            <input
                ref={rollInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* Controls Row */}
            <div className="flex flex-wrap gap-4 justify-center items-center w-full">
                {/* App Mode Switcher */}
                <div className="flex bg-zinc-900 p-1.5 rounded-full border border-zinc-800 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none" />
                    <button
                        onClick={() => { setAppMode('single'); setAuditResult(null); setScans([]); }}
                        className={`px-6 py-2 rounded-full font-bold transition-all text-sm relative z-10 ${appMode === 'single' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Single Audit
                    </button>
                    <button
                        onClick={() => { setAppMode('compare'); setAuditResult(null); setBeforeScan(null); setAfterScan(null); setScans([]); }}
                        className={`px-6 py-2 rounded-full font-bold transition-all text-sm relative z-10 ${appMode === 'compare' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Before & After Mode
                    </button>
                </div>

                {/* Input Mode Toggle */}
                <div className="flex gap-1.5 bg-zinc-900 p-1.5 rounded-full border border-zinc-800 shadow-xl">
                    <button
                        onClick={() => setInputMode('webcam')}
                        className={`px-4 py-2 rounded-full font-semibold transition-all text-sm flex items-center gap-1.5 ${inputMode === 'webcam' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <span>📷</span> Camera
                    </button>
                    {isMobile ? (
                        <button
                            onClick={() => { setInputMode('roll'); rollInputRef.current?.click(); }}
                            className={`px-4 py-2 rounded-full font-semibold transition-all text-sm flex items-center gap-1.5 ${inputMode === 'roll' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <span>🖼️</span> Roll
                        </button>
                    ) : (
                        <button
                            onClick={() => setInputMode('upload')}
                            className={`px-4 py-2 rounded-full font-semibold transition-all text-sm flex items-center gap-1.5 ${inputMode === 'upload' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <span>📁</span> File / URL
                        </button>
                    )}
                </div>

                {/* Gender Toggle */}
                <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-full border border-zinc-800 shadow-xl">
                    <button
                        onClick={() => setGender('male')}
                        className={`px-5 py-2 rounded-full font-semibold transition-all text-sm ${gender === 'male' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-zinc-400 hover:text-white'}`}
                    >
                        ♂ Male Baseline
                    </button>
                    <button
                        onClick={() => setGender('female')}
                        className={`px-5 py-2 rounded-full font-semibold transition-all text-sm ${gender === 'female' ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'text-zinc-400 hover:text-white'}`}
                    >
                        ♀ Female Baseline
                    </button>
                </div>
            </div>

            {appMode === 'single' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-start">
                    {/* LEFT COLUMN: Image + Score Card + Controls */}
                    <div className="flex flex-col gap-5">
                        {/* Camera Feed / Upload / Result Image */}
                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border-2 border-zinc-800 bg-black shadow-2xl">
                            {analyzedImageWithLandmarks ? (
                                /* After analysis: show the annotated image with landmarks for ANY mode */
                                <img src={analyzedImageWithLandmarks} alt="Analyzed with landmarks" className="h-full w-full object-contain" />
                            ) : inputMode === 'webcam' ? (
                                <Webcam
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="h-full w-full object-cover transform scale-x-[-1]"
                                    videoConstraints={{ facingMode: "user" }}
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-zinc-950">
                                    {uploadedImage ? (
                                        <img src={uploadedImage} alt="Uploaded" className="h-full w-full object-contain" />
                                    ) : (
                                        <div className="text-center space-y-4 px-6">
                                            <div className="text-5xl">{inputMode === 'roll' ? '🖼️' : '📸'}</div>
                                            <p className="text-zinc-400 text-sm">
                                                {inputMode === 'roll'
                                                    ? 'Tap “Choose from Photos” below to select an image from your camera roll.'
                                                    : 'No image uploaded yet. Use the button below to choose a file or paste a URL.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {isAnalyzing && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                    <div className="text-white font-mono text-xl animate-pulse">Running Neural Scan...</div>
                                </div>
                            )}

                            {/* Scans Gallery Strip */}
                            {scans.length > 0 && (
                                <div className="absolute bottom-4 left-4 right-4 bg-zinc-900/90 rounded-2xl p-4 border border-zinc-700 backdrop-blur-md z-10 shadow-2xl">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm font-bold text-zinc-200">Analysis Gallery</h4>
                                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-semibold">{scans.length} Angle{scans.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                                        {scans.map((scan, i) => (
                                            <div key={i} className="relative shrink-0 w-20 h-28 rounded-xl overflow-hidden border-2 border-zinc-600 snap-center group">
                                                <img src={scan.imageUrl} alt={`Scan ${i + 1}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1.5 flex justify-center">
                                                    <div className="text-[9px] font-bold text-white uppercase text-center bg-black/60 rounded px-1.5 backdrop-blur-md">
                                                        {scan.profileType}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add New Angle Button */}
                                        <button
                                            onClick={() => {
                                                setAuditResult(null);
                                                setAnalyzedImageWithLandmarks(null);
                                                setUploadedImage(null);
                                                setInputMode('webcam');
                                            }}
                                            className="shrink-0 w-20 h-28 rounded-xl border-2 border-dashed border-zinc-600 flex flex-col items-center justify-center hover:bg-zinc-700 hover:border-zinc-400 transition-all snap-center group bg-black/40"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-zinc-600 transition-colors mb-1.5">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <span className="text-[9px] font-bold text-zinc-400 group-hover:text-zinc-200">ADD</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Below-image panel — Score card when results visible, controls when not */}
                        {!auditResult ? (
                            /* Controls / Call to Action */
                            <div className="flex flex-col items-center justify-center bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-7 text-center space-y-5">
                                <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1.5">FaceAudit™ AI</h3>
                                    <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                                        Position your face clearly. Good lighting. No glasses. Multiple angles increase precision.
                                    </p>
                                </div>

                                <div className="w-full bg-zinc-950/50 border border-zinc-800 p-3 rounded-xl flex items-start gap-3 text-left">
                                    <input
                                        type="checkbox"
                                        id="privacy-consent-single"
                                        checked={consentGiven}
                                        onChange={(e) => setConsentGiven(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-blue-600 bg-zinc-900 border-zinc-700 rounded focus:ring-blue-500 focus:ring-offset-zinc-900"
                                    />
                                    <label htmlFor="privacy-consent-single" className="text-xs text-zinc-400 leading-snug cursor-pointer">
                                        I agree to anonymously share my scan to improve the AI model.
                                    </label>
                                </div>

                                {inputMode === 'webcam' ? (
                                    <button
                                        onClick={captureAndAnalyze}
                                        disabled={!faceLandmarker || isAnalyzing || !consentGiven}
                                        className="w-full py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/10 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <svg className="w-5 h-5 animate-spin text-zinc-900" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                                                Scanning...
                                            </>
                                        ) : 'Capture Scan'}
                                    </button>
                                ) : (
                                    <>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={!faceLandmarker || isAnalyzing || !consentGiven}
                                            className="w-full py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/10 disabled:opacity-50"
                                        >
                                            {isAnalyzing ? 'Scanning...' : 'Choose Image'}
                                        </button>

                                        {/* URL Upload */}
                                        <div className="w-full">
                                            <div className="flex items-center gap-2 my-1">
                                                <div className="flex-1 h-px bg-zinc-700" />
                                                <span className="text-xs text-zinc-500 font-medium">OR</span>
                                                <div className="flex-1 h-px bg-zinc-700" />
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="url"
                                                    placeholder="Paste image URL..."
                                                    value={urlInput}
                                                    onChange={(e) => setUrlInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleUrlUpload()}
                                                    disabled={!faceLandmarker || isAnalyzing || !consentGiven}
                                                    className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 placeholder-zinc-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                                />
                                                <button
                                                    onClick={handleUrlUpload}
                                                    disabled={!faceLandmarker || isAnalyzing || !urlInput.trim() || !consentGiven}
                                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors"
                                                >
                                                    ↗
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                                {!faceLandmarker && <p className="text-xs text-yellow-500 animate-pulse">Initializing neural models. Please wait...</p>}
                            </div>
                        ) : (
                            /* Score Hero Card — shown below image when results are in */
                            (() => {
                                const s = auditResult.psl.score;
                                const gradient = s >= 7.0
                                    ? 'from-amber-400 via-yellow-300 to-amber-500'
                                    : s >= 6.0 ? 'from-emerald-400 to-green-500'
                                        : s >= 5.0 ? 'from-sky-400 to-blue-500'
                                            : s >= 4.0 ? 'from-blue-500 to-indigo-600'
                                                : 'from-zinc-500 to-zinc-600';
                                const barColor = s >= 7.0 ? '#F59E0B' : s >= 6.0 ? '#10B981' : s >= 5.0 ? '#38BDF8' : s >= 4.0 ? '#6366F1' : '#71717A';
                                const pct = (s / 8) * 100;
                                return (
                                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        {/* Score Card */}
                                        <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
                                            <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-white to-transparent pointer-events-none" />
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">
                                                        {auditResult.profileType === 'composite' ? '⚡ Composite Score' : '📸 Scan Score'}
                                                    </p>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className={`text-5xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                                                            {s.toFixed(1)}
                                                        </span>
                                                        <span className="text-xl font-bold text-zinc-600">/ 8.0 PSL</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-zinc-300 mt-1">{auditResult.psl.tier}</p>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <button
                                                        onClick={() => { setAuditResult(null); setScans([]); setAnalyzedImageWithLandmarks(null); setUploadedImage(null); }}
                                                        className="text-xs font-semibold text-zinc-600 hover:text-red-400 transition-colors border border-zinc-700 hover:border-red-500/50 rounded-lg px-3 py-1.5 mb-2"
                                                    >
                                                        Reset
                                                    </button>
                                                    
                                                    {(() => {
                                                        const status = calculateCommunityStatus(s);
                                                        return (
                                                            <div className="flex flex-col items-end">
                                                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 mb-1 ${status.color}`}>
                                                                    {status.status}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {(() => {
                                                const status = calculateCommunityStatus(s);
                                                return (
                                                    <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed bg-zinc-800/50 p-2 rounded-xl border border-zinc-800/50 italic">
                                                        &ldquo;{status.description}&rdquo;
                                                    </p>
                                                );
                                            })()}

                                            {/* Score Bar */}
                                            <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000"
                                                    style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 12px ${barColor}80` }}
                                                />
                                            </div>

                                            {/* Tick marks */}
                                            <div className="flex justify-between mt-1.5 px-0.5">
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                                    <span key={n} className={`text-[10px] font-mono ${s >= n ? 'text-zinc-300' : 'text-zinc-700'}`}>{n}</span>
                                                ))}
                                            </div>

                                            {/* Score breakdown pills */}
                                            <div className="mt-4 flex flex-wrap gap-1.5">
                                                {auditResult.psl.breakdown.map((item, i) => {
                                                    const isPos = item.includes('+');
                                                    const isNeg = item.includes('-') && !item.includes('Base');
                                                    return (
                                                        <span key={i} className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${isPos ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                            : isNeg ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                                                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                                            }`}>{item}</span>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* New Scan Button — pinned below score card */}
                                        <button
                                            onClick={() => { setAuditResult(null); setIsAnalyzing(false); setUploadedImage(null); setAnalyzedImageWithLandmarks(null); setExpandedMetric(null); }}
                                            className="w-full py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors border border-zinc-700 hover:border-zinc-500 text-sm"
                                        >
                                            New Scan
                                        </button>
                                    </div>
                                );
                            })()
                        )}
                    </div>

                    {/* RIGHT COLUMN: Tabbed Results */}
                    <div className="flex flex-col space-y-4">
                        {!auditResult ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-zinc-900/20 border border-zinc-800/40 rounded-3xl p-8 text-center space-y-3">
                                <div className="text-4xl">🔬</div>
                                <p className="text-zinc-500 text-sm">Run a scan to see your detailed feature-by-feature analysis here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

                                {/* ── Tab Bar ── */}
                                <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl sticky top-2 z-10">
                                    {([
                                        { id: 'analysis', label: 'Analysis', icon: '🔬' },
                                        { id: 'roadmap',  label: 'Roadmap',  icon: '🚀' },
                                        { id: 'vitality', label: 'Vitality', icon: '⚡' },
                                        ...(auditResult.profileType !== 'side' ? [{ id: 'haircut', label: 'Haircut', icon: '✂️' }] : []),
                                    ] as { id: Tab; label: string; icon: string }[]).map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setResultsTab(tab.id)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                                resultsTab === tab.id
                                                    ? 'bg-white text-black shadow-sm'
                                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                            }`}
                                        >
                                            <span className="text-base leading-none">{tab.icon}</span>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                                {/* ── ANALYSIS TAB ── */}
                                {resultsTab === 'analysis' && (
                                    <AnalysisTab
                                        metrics={auditResult.metrics}
                                        profileType={auditResult.profileType}
                                        gender={gender}
                                        expandedMetric={expandedMetric}
                                        onToggleMetric={setExpandedMetric}
                                    />
                                )}

                                {/* ── ROADMAP TAB ── */}
                                {resultsTab === 'roadmap' && (
                                    <RoadmapTab
                                        metrics={auditResult.metrics}
                                        profileType={auditResult.profileType}
                                        gender={gender}
                                        expandedMetric={expandedMetric}
                                        onToggleMetric={setExpandedMetric}
                                        currentPSL={auditResult.psl.score}
                                    />
                                )}

                                {/* ── VITALITY TAB ── */}
                                {resultsTab === 'vitality' && (
                                    <VitalityTab metrics={auditResult.metrics} />
                                )}

                                {/* ── HAIRCUT TAB ── */}
                                {resultsTab === 'haircut' && auditResult.profileType !== 'side' && (
                                    <HaircutTab
                                        metrics={auditResult.metrics}
                                        gender={gender}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>

            ) : (
                /* Compare Mode Layout */
                <div className="flex flex-col w-full gap-8">
                    {beforeScan && afterScan ? (
                        <div className="flex flex-col space-y-6">
                            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                                <div>
                                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Score Change</p>
                                    <div className="flex items-baseline gap-3 mt-1">
                                        <span className="text-2xl font-bold bg-zinc-700 bg-clip-text text-transparent">{beforeScan.psl.score.toFixed(1)}</span>
                                        <span className="text-zinc-500 font-bold">→</span>
                                        <span className={`text-4xl font-black ${afterScan.psl.score > beforeScan.psl.score ? 'text-emerald-400' : afterScan.psl.score < beforeScan.psl.score ? 'text-red-400' : 'text-zinc-300'}`}>
                                            {afterScan.psl.score.toFixed(1)}
                                        </span>
                                        {afterScan.psl.score !== beforeScan.psl.score && (
                                            <span className={`text-sm font-bold px-2 py-1 rounded-full ${afterScan.psl.score > beforeScan.psl.score ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {afterScan.psl.score > beforeScan.psl.score ? '+' : ''}{(afterScan.psl.score - beforeScan.psl.score).toFixed(1)} PSL
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setBeforeScan(null); setAfterScan(null); setUploadedImage(null); }}
                                    className="px-4 py-2 border border-zinc-700 hover:border-zinc-500 rounded-xl text-sm font-bold text-white transition-all shadow-sm bg-zinc-800"
                                >
                                    Reset Comparison
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Before Side */}
                                <div className="space-y-4">
                                    <h3 className="text-center text-lg font-bold text-zinc-400 uppercase tracking-wider">Before</h3>
                                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border-2 border-zinc-800 bg-black shadow-xl">
                                        <img src={beforeScan.imageUrl} alt="Before" className="h-full w-full object-cover" />
                                    </div>
                                </div>

                                {/* After Side */}
                                <div className="space-y-4">
                                    <h3 className="text-center text-lg font-bold text-emerald-400 uppercase tracking-wider">After</h3>
                                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border-2 border-emerald-900/50 bg-black shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                        <img src={afterScan.imageUrl} alt="After" className="h-full w-full object-cover" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full items-start">
                            {/* Capture Input Panel */}
                            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border-2 border-zinc-800 bg-black shadow-2xl flex flex-col">
                                {inputMode === 'webcam' ? (
                                    <Webcam
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="h-full w-full object-cover transform scale-x-[-1]"
                                        videoConstraints={{ facingMode: "user" }}
                                    />
                                ) : (
                                    <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-950 flex-1 relative">
                                        {uploadedImage && !isAnalyzing ? (
                                            <div className="absolute inset-0">
                                                <img src={uploadedImage} alt="Uploaded preview" className="h-full w-full object-contain" />
                                                <div className="absolute bottom-6 inset-x-0 flex justify-center z-10 px-4">
                                                    <button
                                                        onClick={() => setUploadedImage(null)}
                                                        className="px-4 py-2 bg-black/80 hover:bg-red-500/80 text-white rounded-full text-xs font-bold border border-zinc-700 hover:border-red-500 backdrop-blur-md transition-all shadow-lg mx-auto"
                                                    >
                                                        Clear Upload
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center space-y-4 p-8">
                                                <div className="text-6xl">📸</div>
                                                <p className="text-zinc-400 text-sm">Upload a Before or After photo to scan.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {isAnalyzing && (
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm z-20">
                                        <svg className="w-8 h-8 animate-spin text-white mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                                        <div className="text-white font-mono text-xl animate-pulse font-bold tracking-widest text-shadow-glow">ANALYZING...</div>
                                    </div>
                                )}
                            </div>

                            {/* Comparison Staging UI */}
                            <div className="flex flex-col space-y-6">
                                <div className="flex flex-col items-center justify-center h-full min-h-[500px] bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8 text-center space-y-6">
                                    <h3 className="text-2xl font-bold text-white mb-2">Compare Setup</h3>
                                    <p className="text-zinc-400 text-sm max-w-sm">Capture or upload two images respectively using the toggle controls below.</p>

                                    <div className="flex gap-2 w-full max-w-xs mt-4">
                                        <button
                                            onClick={() => setCompareSlot('before')}
                                            className={`flex-1 py-3 rounded-xl font-bold transition-all border ${compareSlot === 'before' ? 'bg-zinc-800 text-white border-zinc-500' : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:bg-zinc-900'}`}
                                        >
                                            Before {beforeScan && '✓'}
                                        </button>
                                        <button
                                            onClick={() => setCompareSlot('after')}
                                            className={`flex-1 py-3 rounded-xl font-bold transition-all border ${compareSlot === 'after' ? 'bg-zinc-800 text-white border-zinc-500' : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:bg-zinc-900'}`}
                                        >
                                            After {afterScan && '✓'}
                                        </button>
                                    </div>

                                    {/* Capture Action Input */}
                                    <div className="w-full max-w-xs mt-6">
                                        <div className="mb-4 bg-zinc-950/50 border border-zinc-800 p-3 rounded-xl flex items-start gap-3 text-left">
                                            <input
                                                type="checkbox"
                                                id="privacy-consent-compare"
                                                checked={consentGiven}
                                                onChange={(e) => setConsentGiven(e.target.checked)}
                                                className="mt-1 w-4 h-4 text-emerald-600 bg-zinc-900 border-zinc-700 rounded focus:ring-emerald-500 focus:ring-offset-zinc-900"
                                            />
                                            <label htmlFor="privacy-consent-compare" className="text-xs text-zinc-400 leading-snug cursor-pointer">
                                                I agree to the privacy policy and consent to my photos being anonymously mapped and securely logged.
                                            </label>
                                        </div>

                                        {inputMode === 'webcam' ? (
                                            <button
                                                onClick={captureAndAnalyze}
                                                disabled={!faceLandmarker || isAnalyzing || !consentGiven || (compareSlot === 'before' ? !!beforeScan : !!afterScan)}
                                                className="w-full py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center"
                                            >
                                                {(compareSlot === 'before' ? !!beforeScan : !!afterScan) ? 'Slot Filled' : 'Capture & Scan'}
                                            </button>
                                        ) : (
                                            <div className="space-y-4">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                />
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={!faceLandmarker || isAnalyzing || !consentGiven || (compareSlot === 'before' ? !!beforeScan : !!afterScan)}
                                                    className="w-full py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all disabled:opacity-30"
                                                >
                                                    {(compareSlot === 'before' ? !!beforeScan : !!afterScan) ? 'Slot Filled' : 'Upload Image'}
                                                </button>

                                                {!((compareSlot === 'before' ? !!beforeScan : !!afterScan)) && (
                                                    <div className="flex gap-2 w-full">
                                                        <input
                                                            type="url"
                                                            placeholder="Paste image URL..."
                                                            value={urlInput}
                                                            onChange={(e) => setUrlInput(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleUrlUpload()}
                                                            disabled={!faceLandmarker || isAnalyzing || !consentGiven}
                                                            className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2"
                                                        />
                                                        <button
                                                            onClick={handleUrlUpload}
                                                            disabled={!faceLandmarker || isAnalyzing || !urlInput.trim() || !consentGiven}
                                                            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold"
                                                        >
                                                            ↗
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
