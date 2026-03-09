'use client';

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { metricExplanations } from '@/utils/explanations';
import { metricRecommendations } from '@/utils/recommendations';
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
    calculateNoseWidthRatio,
    calculateCheekboneProminence,
    calculateHairlineRecession,
    calculatePSLScore,
    calculateAggregatedMetrics,
    extractEulerAngles,
    MetricScores
} from '@/utils/geometry';

type InputMode = 'webcam' | 'upload';

export default function FaceAnalyzer() {
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
    const [scans, setScans] = useState<{ metrics: MetricScores, psl: { score: number, breakdown: string[], tier: string }, imageUrl: string, profileType: 'front' | 'side' }[]>([]);
    const [auditResult, setAuditResult] = useState<{ metrics: MetricScores, psl: { score: number, breakdown: string[], tier: string }, imageUrl: string, profileType: 'front' | 'side' | 'composite' } | null>(null);
    const [inputMode, setInputMode] = useState<InputMode>('webcam');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [analyzedImageWithLandmarks, setAnalyzedImageWithLandmarks] = useState<string | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<keyof MetricScores | null>(null);
    const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [gender, setGender] = useState<'male' | 'female'>('male');

    useEffect(() => {
        // Suppress MediaPipe/TensorFlow Lite info messages
        const originalError = console.error;
        console.error = (...args: any[]) => {
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

    const drawLandmarks = (image: HTMLImageElement, landmarks: any) => {
        if (!canvasRef.current) return '';

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        const toCanvas = (landmark: any) => ({
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
    const drawLandmarksOnCanvas = (inputCanvas: HTMLCanvasElement, landmarks: any[]): string => {
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

        const toCanvas = (landmark: any) => ({
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

    const analyzeImage = (imageSrc: string) => {
        if (!faceLandmarker) return;

        setIsAnalyzing(true);

        try {
            const image = new Image();
            // Data URLs don't need crossOrigin, and setting it can sometimes cause issues
            // image.crossOrigin = 'anonymous'; 
            image.src = imageSrc;

            const processDetectionResults = (results: any, analyzedCanvas: HTMLCanvasElement) => {
                const {
                    extractEulerAngles, calculateCanthalTilt, calculateFwFhRatio, calculateMidfaceRatio, calculateEyeSeparationRatio,
                    calculateGonialAngle, calculateChinToPhiltrumRatio, calculateMouthToNoseWidthRatio, calculateBigonialWidthRatio,
                    calculateLowerThirdRatio, calculatePalpebralFissureLength, calculateEyeToMouthAngle, calculateLipRatio,
                    calculateFacialAsymmetry, calculateIPDRatio, calculateFacialThirds, calculateForeheadHeightRatio,
                    calculateNoseWidthRatio, calculateCheekboneProminence, calculateHairlineRecession, calculateAggregatedMetrics,
                    calculatePSLScore, scaleLandmarks
                } = require('../utils/geometry');

                const landmarks = results.faceLandmarks[0];

                // Validate landmark array has enough points (MediaPipe should have 478 landmarks)
                if (!landmarks || landmarks.length < 478) {
                    alert('⚠️ Error: Face detection incomplete. Please try again with a clearer, well-lit image.');
                    setIsAnalyzing(false);
                    return;
                }

                // Check face angle (frontal vs profile)
                let profileType: 'front' | 'side' = 'front';
                if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
                    const matrix = results.facialTransformationMatrixes[0];
                    const euler = extractEulerAngles(matrix);

                    // Absolute YAW dictates if head turns enough to be considered a side-profile.
                    if (Math.abs(euler.yaw) > 40) {
                        console.log(`True 3D Yaw detected: ${euler.yaw.toFixed(2)}° (SIDE profile mode activated)`);
                        profileType = 'side';
                    } else {
                        console.log(`True 3D Yaw detected: ${euler.yaw.toFixed(2)}° (FRONT profile mode activated)`);
                        profileType = 'front';
                    }

                    if (Math.abs(euler.pitch) > 25) {
                        alert(`⚠️ High tilt detected (Pitch: ${euler.pitch.toFixed(1)}°). Measurements may be significantly warped. Keep your head leveled!`);
                    }
                } else {
                    const leftCheek = landmarks[234];
                    const rightCheek = landmarks[454];
                    const noseTip = landmarks[1];

                    const leftDist = Math.abs(leftCheek.x - noseTip.x);
                    const rightDist = Math.abs(rightCheek.x - noseTip.x);
                    const asymmetryRatio = Math.abs(leftDist - rightDist) / Math.max(leftDist, rightDist);

                    if (asymmetryRatio > 0.15) {
                        alert('⚠️ Warning: Face appears angled. Please face the camera directly for accurate analysis.');
                        profileType = 'side';
                    }
                    else {
                        profileType = 'front';
                    }
                }

                // Check for glasses (detect abnormal z-depth around eyes)
                const leftEyeTop = landmarks[159];
                const leftEyeBottom = landmarks[145];
                const rightEyeTop = landmarks[386];
                const rightEyeBottom = landmarks[374];

                const leftEyeDepth = Math.abs(leftEyeTop.z - leftEyeBottom.z);
                const rightEyeDepth = Math.abs(rightEyeTop.z - rightEyeBottom.z);

                // Increased threshold to reduce false positives (was 0.02, now 0.035)
                if (leftEyeDepth > 0.035 || rightEyeDepth > 0.035) {
                    const proceed = confirm('⚠️ Glasses detected! Glasses can affect measurement accuracy.\n\nFor best results, please remove glasses.\n\nProceed anyway?');
                    if (!proceed) {
                        setIsAnalyzing(false);
                        return;
                    }
                }

                // Scale landmarks to exact image aspect ratio dimensions for true metric ratios
                const scaledLandmarks = scaleLandmarks(landmarks, analyzedCanvas.width, analyzedCanvas.height);

                const facialThirdsData = calculateFacialThirds(scaledLandmarks);

                // Import 3D bone structure metrics (dynamic import removed - will add to imports)
                const {
                    calculateOrbitalRimProtrusion,
                    calculateMaxillaryProtrusion,
                    calculateBrowRidgeProtrusion,
                    calculateInfraorbitalRimPosition,
                    calculateChinProjection,
                    calculateDoubleChinRisk,
                    evaluateFacialTension,
                    evaluateCameraAngle
                } = require('../utils/advanced-metrics');

                const { analyzeSkinQuality } = require('../utils/image-processing');

                // Advanced V2 Evaluators
                const tensionData = evaluateFacialTension(results.faceBlendshapes || []);
                const skinQualityData = analyzeSkinQuality(image, landmarks);

                let angleDeductionScore = 0;
                let activePitch = 0;
                let activeYaw = 0;
                if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
                    const euler = extractEulerAngles(results.facialTransformationMatrixes[0]);
                    activePitch = euler.pitch;
                    activeYaw = euler.yaw;
                    angleDeductionScore = evaluateCameraAngle(euler.pitch, euler.yaw).score;
                }

                const metrics: MetricScores = {
                    canthalTilt: calculateCanthalTilt(scaledLandmarks),
                    fwfhRatio: calculateFwFhRatio(scaledLandmarks, activePitch, activeYaw),
                    midfaceRatio: calculateMidfaceRatio(scaledLandmarks, activePitch),
                    eyeSeparationRatio: calculateEyeSeparationRatio(scaledLandmarks),
                    gonialAngle: calculateGonialAngle(scaledLandmarks),
                    chinToPhiltrumRatio: calculateChinToPhiltrumRatio(scaledLandmarks),
                    mouthToNoseWidthRatio: calculateMouthToNoseWidthRatio(scaledLandmarks),
                    bigonialWidthRatio: calculateBigonialWidthRatio(scaledLandmarks),
                    lowerThirdRatio: calculateLowerThirdRatio(scaledLandmarks, activePitch),
                    palpebralFissureLength: calculatePalpebralFissureLength(scaledLandmarks),
                    eyeToMouthAngle: calculateEyeToMouthAngle(scaledLandmarks),
                    lipRatio: calculateLipRatio(scaledLandmarks),
                    facialAsymmetry: calculateFacialAsymmetry(scaledLandmarks),
                    ipdRatio: calculateIPDRatio(scaledLandmarks),
                    facialThirdsRatio: facialThirdsData.ratio,
                    foreheadHeightRatio: calculateForeheadHeightRatio(scaledLandmarks),
                    noseWidthRatio: calculateNoseWidthRatio(scaledLandmarks),
                    cheekboneProminence: calculateCheekboneProminence(scaledLandmarks),
                    hairlineRecession: calculateHairlineRecession(scaledLandmarks),
                    // NEW: 3D bone structure metrics
                    orbitalRimProtrusion: calculateOrbitalRimProtrusion(scaledLandmarks),
                    maxillaryProtrusion: calculateMaxillaryProtrusion(scaledLandmarks),
                    browRidgeProtrusion: calculateBrowRidgeProtrusion(scaledLandmarks),
                    infraorbitalRimPosition: calculateInfraorbitalRimPosition(scaledLandmarks),
                    chinProjection: calculateChinProjection(scaledLandmarks),

                    // V2 Advanced Traits
                    doubleChinRisk: calculateDoubleChinRisk(scaledLandmarks),
                    angleDeduction: angleDeductionScore,
                    facialTension: tensionData.tensionScore,
                    skinQuality: skinQualityData.clarityScore
                };
                const pslData = calculatePSLScore(metrics, gender);
                // Draw landmarks on a canvas matching the ORIGINAL image
                // This avoids any dimension mismatch between normalized canvas and original
                const drawLandmarksOnOriginal = (): string => {
                    const canvas = document.createElement('canvas');
                    canvas.width = analyzedCanvas.width;
                    canvas.height = analyzedCanvas.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return '';

                    // DEBUG: Log dimensions and key landmark positions
                    console.log('=== LANDMARK ALIGNMENT DEBUG ===');
                    console.log('Canvas:', canvas.width, 'x', canvas.height);
                    console.log('Nose tip (1):', JSON.stringify({
                        raw: { x: landmarks[1].x, y: landmarks[1].y },
                        px: { x: Math.round(landmarks[1].x * canvas.width), y: Math.round(landmarks[1].y * canvas.height) }
                    }));

                    // Draw the analyzed canvas (normalized image) as background
                    ctx.drawImage(analyzedCanvas, 0, 0);

                    // Convert normalized landmark coords to pixel coords
                    const toPixel = (idx: number) => ({
                        x: landmarks[idx].x * canvas.width,
                        y: landmarks[idx].y * canvas.height
                    });

                    const drawLine = (idx1: number, idx2: number, color: string, label: string) => {
                        const p1 = toPixel(idx1);
                        const p2 = toPixel(idx2);
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();

                        // Label at midpoint
                        const mx = (p1.x + p2.x) / 2;
                        const my = (p1.y + p2.y) / 2;
                        ctx.fillStyle = color;
                        ctx.font = `bold ${Math.max(10, Math.round(canvas.width / 60))}px Arial`;
                        ctx.shadowColor = 'black';
                        ctx.shadowBlur = 3;
                        ctx.fillText(label, mx + 5, my - 5);
                        ctx.shadowBlur = 0;
                    };

                    const drawDot = (idx: number, color: string, radius: number = 3) => {
                        const p = toPixel(idx);
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                        ctx.fill();
                    };

                    // === DRAW MEASUREMENT LINES ===
                    drawLine(133, 33, '#00FF00', 'Canthal Tilt (R)');
                    drawLine(362, 263, '#00FF00', 'Canthal Tilt (L)');
                    drawLine(93, 323, '#FF6B00', 'Face Width');
                    drawLine(10, 152, '#FF9500', 'Face Height');
                    drawLine(132, 152, '#FF0000', 'Jaw (L)');
                    drawLine(361, 152, '#FF0000', 'Jaw (R)');
                    drawLine(132, 361, '#FFAA00', 'Jaw Width');
                    drawLine(168, 2, '#FFFF00', 'Midface');
                    drawLine(48, 278, '#FF00FF', 'Nose Width');
                    drawLine(61, 291, '#9D00FF', 'Mouth Width');
                    drawLine(10, 168, '#0080FF', 'Upper Third');
                    drawLine(168, 2, '#0080FF', 'Middle Third');
                    drawLine(2, 152, '#0080FF', 'Lower Third');
                    drawLine(133, 362, '#00FFFF', 'IPD');

                    // Draw key points
                    [10, 152, 168, 2, 93, 323, 132, 361, 33, 263, 133, 362, 61, 291, 48, 278].forEach(i => drawDot(i, '#FFFFFF', 4));

                    return canvas.toDataURL('image/jpeg', 0.92);
                };

                const annotatedImage = drawLandmarksOnOriginal();

                const newScan = {
                    metrics: metrics,
                    psl: pslData,
                    imageUrl: annotatedImage,
                    profileType: profileType
                };

                setScans(prev => {
                    const updated = [...prev, newScan];
                    const compositeMetrics = calculateAggregatedMetrics(updated);

                    if (compositeMetrics) {
                        const hasFront = updated.some(s => s.profileType === 'front');
                        const hasSide = updated.some(s => s.profileType === 'side');
                        const combinedType = (hasFront && hasSide) ? 'composite' : profileType;

                        const mergedScore = calculatePSLScore(compositeMetrics, combinedType);

                        setAuditResult({
                            metrics: compositeMetrics,
                            psl: mergedScore,
                            imageUrl: annotatedImage,
                            profileType: combinedType
                        });
                    }

                    return updated;
                });

                setAnalyzedImageWithLandmarks(annotatedImage);
                setIsAnalyzing(false);

                // iOS Bridge: Send results to WKWebView if running inside Ascend app
                if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.analysisComplete) {
                    window.webkit.messageHandlers.analysisComplete.postMessage(newScan);
                }
            };

            // Normalize image to canvas to handle different formats/orientations
            const normalizeImage = (img: HTMLImageElement): HTMLCanvasElement => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    throw new Error('Failed to get canvas context');
                }

                // Draw image to canvas (this normalizes format and handles EXIF orientation)
                ctx.drawImage(img, 0, 0);

                return canvas;
            };

            const runDetection = async () => {
                try {
                    console.log('Image loaded, natural dimensions:', image.naturalWidth, 'x', image.naturalHeight);

                    // Validate image dimensions
                    if (image.naturalWidth === 0 || image.naturalHeight === 0) {
                        console.error('Image has invalid dimensions');
                        alert('⚠️ Failed to load image. Please try a different image.');
                        setIsAnalyzing(false);
                        return;
                    }

                    // Ensure image is fully decoded (for browsers that support it)
                    if ('decode' in image) {
                        try {
                            await image.decode();
                            console.log('Image decoded successfully');
                        } catch (decodeError) {
                            console.warn('Image decode failed, continuing anyway:', decodeError);
                        }
                    }

                    // Normalize image to canvas to strip metadata and normalize pixel format
                    let normalizedCanvas: HTMLCanvasElement;
                    try {
                        normalizedCanvas = normalizeImage(image);
                        console.log('Image normalized to canvas, stripped metadata');
                    } catch (normalizeError) {
                        console.error('Failed to normalize image:', normalizeError);
                        alert('⚠️ Failed to process image. Please try a different image.');
                        setIsAnalyzing(false);
                        return;
                    }

                    const detectWithRetry = async (attempt = 1): Promise<any> => {
                        console.log(`Detection attempt ${attempt}...`);

                        try {
                            // Use normalized canvas to strip screenshot metadata and normalize pixel format
                            const results = faceLandmarker.detect(normalizedCanvas);

                            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                                return results;
                            }

                            if (attempt < 3) {
                                console.warn(`Attempt ${attempt} failed. Retrying in ${attempt * 500}ms...`);
                                await new Promise(resolve => setTimeout(resolve, attempt * 500));
                                return detectWithRetry(attempt + 1);
                            }

                            return results;
                        } catch (detectError) {
                            console.error(`Detection attempt ${attempt} threw error:`, detectError);

                            if (attempt < 3) {
                                console.warn(`Retrying after error in ${attempt * 500}ms...`);
                                await new Promise(resolve => setTimeout(resolve, attempt * 500));
                                return detectWithRetry(attempt + 1);
                            }

                            throw detectError;
                        }
                    };

                    // Use requestAnimationFrame to ensure DOM is ready
                    requestAnimationFrame(async () => {
                        try {
                            const results = await detectWithRetry();
                            console.log('Final detection results:', results);

                            if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
                                alert('⚠️ No face detected. Please ensure your face is clearly visible, well-lit, and facing the camera.');
                                setIsAnalyzing(false);
                                return;
                            }
                            processDetectionResults(results, normalizedCanvas);
                        } catch (error) {
                            console.error('All detection attempts failed:', error);
                            alert('⚠️ Face detection failed. Please try a different image or refresh the page.');
                            setIsAnalyzing(false);
                        }
                    });
                } catch (error) {
                    console.error('Detection error:', error);
                    alert('⚠️ Analysis failed. Please refresh the page and try again.');
                    setIsAnalyzing(false);
                }
            };

            if (image.complete) {
                runDetection();
            } else {
                image.onload = runDetection;
            }

            image.onerror = () => {
                alert('⚠️ Error loading image. Please try again.');
                setIsAnalyzing(false);
            };
        } catch (error) {
            console.error('Image processing error:', error);
            setIsAnalyzing(false);
        }
    };

    const captureAndAnalyze = () => {
        if (!webcamRef.current || !faceLandmarker) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            analyzeImage(imageSrc);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && faceLandmarker) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageSrc = event.target?.result as string;
                setUploadedImage(imageSrc);
                analyzeImage(imageSrc);
            };
            reader.readAsDataURL(file);
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

    const getRating = (metric: keyof MetricScores, value: number, gender: 'male' | 'female' = 'male'): { text: string, color: string } => {
        if (gender === 'female') {
            const fRatings: Record<string, { text: string, color: string }> = {
                canthalTilt: value >= 5 && value <= 8 ? { text: 'perfect feline tilt', color: 'text-green-400' } : value > 2 ? { text: 'good', color: 'text-blue-400' } : value < 0 ? { text: 'negative tilt', color: 'text-red-400' } : { text: 'neutral', color: 'text-yellow-400' },
                fwfhRatio: value >= 1.70 ? { text: 'perfect (heart/oval)', color: 'text-green-400' } : value >= 1.60 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow face', color: 'text-orange-400' },
                midfaceRatio: value >= 0.9 && value <= 1.05 ? { text: 'perfect compact midface', color: 'text-green-400' } : value <= 1.15 ? { text: 'good', color: 'text-blue-400' } : { text: 'long midface', color: 'text-red-400' },
                gonialAngle: value >= 120 && value <= 135 ? { text: 'perfect feminine angle', color: 'text-green-400' } : value >= 110 && value <= 140 ? { text: 'good', color: 'text-blue-400' } : { text: 'square/steep', color: 'text-orange-400' },
                chinToPhiltrumRatio: value >= 2.0 && value <= 2.25 ? { text: 'perfect', color: 'text-green-400' } : value < 1.8 ? { text: 'long philtrum', color: 'text-red-400' } : value > 2.5 ? { text: 'short philtrum / long chin', color: 'text-orange-400' } : { text: 'acceptable', color: 'text-blue-400' },
                mouthToNoseWidthRatio: value >= 1.45 && value <= 1.6 ? { text: 'perfect', color: 'text-green-400' } : value >= 1.35 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow mouth', color: 'text-orange-400' },
                bigonialWidthRatio: value >= 1.15 && value <= 1.3 ? { text: 'perfect oval jaw', color: 'text-green-400' } : value >= 1.1 ? { text: 'good', color: 'text-blue-400' } : value > 1.35 ? { text: 'very wide jaw', color: 'text-orange-400' } : { text: 'narrow', color: 'text-orange-400' },
                lowerThirdRatio: value >= 0.58 && value <= 0.65 ? { text: 'perfect balance', color: 'text-green-400' } : value >= 0.55 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal lower third', color: 'text-orange-400' },
                palpebralFissureLength: value >= 2.8 && value <= 3.5 ? { text: 'perfect doe eyes', color: 'text-green-400' } : value > 3.5 ? { text: 'long fissures', color: 'text-blue-400' } : { text: 'round eyes', color: 'text-yellow-400' },
                eyeSeparationRatio: value >= 0.45 && value <= 0.47 ? { text: 'perfect', color: 'text-green-400' } : value >= 0.42 && value <= 0.49 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal spacing', color: 'text-yellow-400' },
                eyeToMouthAngle: value >= 47 && value <= 50 ? { text: 'perfect', color: 'text-green-400' } : value < 47 ? { text: 'shallow', color: 'text-yellow-400' } : { text: 'steep', color: 'text-yellow-400' },
                lipRatio: value >= 1.60 && value <= 1.70 ? { text: 'perfect', color: 'text-green-400' } : value >= 1.40 && value <= 2.00 ? { text: 'acceptable', color: 'text-blue-400' } : { text: 'suboptimal lip ratio', color: 'text-orange-400' },
                facialAsymmetry: value >= 95 ? { text: 'perfectly symmetric', color: 'text-green-400' } : value >= 90 ? { text: 'very symmetric', color: 'text-blue-400' } : value >= 80 ? { text: 'acceptable symmetry', color: 'text-yellow-400' } : { text: 'asymmetric', color: 'text-orange-400' },
                ipdRatio: value >= 0.45 && value <= 0.47 ? { text: 'ideal eye spacing', color: 'text-green-400' } : value >= 0.42 && value <= 0.49 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal spacing', color: 'text-yellow-400' },
                facialThirdsRatio: value >= 95 ? { text: 'perfect thirds', color: 'text-green-400' } : value >= 85 ? { text: 'good proportions', color: 'text-blue-400' } : value >= 75 ? { text: 'acceptable', color: 'text-yellow-400' } : { text: 'unbalanced thirds', color: 'text-orange-400' },
                foreheadHeightRatio: value >= 0.30 && value <= 0.35 ? { text: 'ideal forehead', color: 'text-green-400' } : value > 0.38 ? { text: 'fivehead (large)', color: 'text-orange-400' } : value < 0.28 ? { text: 'short forehead', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
                noseWidthRatio: value >= 0.22 && value <= 0.28 ? { text: 'ideal narrow nose', color: 'text-green-400' } : value > 0.32 ? { text: 'wide nose', color: 'text-orange-400' } : value < 0.20 ? { text: 'very narrow', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
                cheekboneProminence: value >= 0.45 && value <= 0.52 ? { text: 'prominent cheekbones', color: 'text-green-400' } : value >= 0.42 ? { text: 'good projection', color: 'text-blue-400' } : { text: 'flat cheekbones', color: 'text-yellow-400' },
                hairlineRecession: value >= 95 ? { text: 'full hairline', color: 'text-green-400' } : value >= 85 ? { text: 'good hairline', color: 'text-blue-400' } : value >= 70 ? { text: 'minor recession', color: 'text-yellow-400' } : value >= 50 ? { text: 'receding hairline', color: 'text-orange-400' } : { text: 'significant hair loss', color: 'text-red-400' },
                orbitalRimProtrusion: value > 0.005 ? { text: 'good eye depth', color: 'text-green-400' } : value > -0.005 ? { text: 'neutral depth', color: 'text-yellow-400' } : { text: 'bulging eyes', color: 'text-red-400' },
                maxillaryProtrusion: value > 0.02 ? { text: 'forward maxilla (ideal)', color: 'text-green-400' } : value > 0.01 ? { text: 'good maxilla', color: 'text-blue-400' } : value > -0.005 ? { text: 'neutral', color: 'text-yellow-400' } : { text: 'retruded maxilla', color: 'text-red-400' },
                browRidgeProtrusion: value <= 0.010 ? { text: 'smooth feminine brow', color: 'text-green-400' } : value > 0.015 ? { text: 'masculine/prominent brow', color: 'text-orange-400' } : { text: 'neutral brow', color: 'text-blue-400' },
                infraorbitalRimPosition: value > 0.01 ? { text: 'forward infraorbital rim', color: 'text-green-400' } : value > -0.005 ? { text: 'neutral', color: 'text-blue-400' } : { text: 'retruded (dark circles)', color: 'text-orange-400' },
                chinProjection: value > 0.015 ? { text: 'strong feminine chin', color: 'text-green-400' } : value > 0.005 ? { text: 'good projection', color: 'text-blue-400' } : value > -0.005 ? { text: 'weak chin', color: 'text-yellow-400' } : { text: 'recessed chin', color: 'text-red-400' },
                doubleChinRisk: value > 0.02 ? { text: 'sharp jawline', color: 'text-green-400' } : value > 0.008 ? { text: 'good definition', color: 'text-blue-400' } : value > 0 ? { text: 'soft jawline', color: 'text-yellow-400' } : { text: 'submental fullness', color: 'text-orange-400' },
                angleDeduction: value === 0 ? { text: 'ideal camera setup', color: 'text-green-400' } : value <= 0.5 ? { text: 'minor tilt', color: 'text-yellow-400' } : { text: 'high distortion check', color: 'text-red-400' },
                facialTension: value < 0.5 ? { text: 'relaxed / neutral', color: 'text-green-400' } : value < 1.2 ? { text: 'minor tension', color: 'text-yellow-400' } : { text: 'high tension detected', color: 'text-orange-400' },
                skinQuality: value > 90 ? { text: 'glass skin', color: 'text-green-400' } : value > 75 ? { text: 'clear skin', color: 'text-blue-400' } : value > 50 ? { text: 'textured', color: 'text-yellow-400' } : { text: 'acne / heavy texture', color: 'text-red-400' }
            };
            return fRatings[metric] || { text: 'unknown', color: 'text-gray-400' };
        }

        // Male Ratings
        const mRatings: Record<string, { text: string, color: string }> = {
            canthalTilt: value >= 4 && value <= 6 ? { text: 'perfect hunter eyes', color: 'text-green-400' } : value > 2 ? { text: 'good', color: 'text-blue-400' } : value < 0 ? { text: 'negative canthal tilt', color: 'text-red-400' } : { text: 'neutral', color: 'text-yellow-400' },
            fwfhRatio: value >= 1.8 ? { text: 'perfect broad face', color: 'text-green-400' } : value >= 1.70 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow face', color: 'text-orange-400' },
            midfaceRatio: value >= 0.9 && value <= 1.1 ? { text: 'perfect compact midface', color: 'text-green-400' } : value <= 1.15 ? { text: 'good', color: 'text-blue-400' } : { text: 'significantly too long midface', color: 'text-red-400' },
            gonialAngle: value >= 115 && value <= 130 ? { text: 'perfect masculine square', color: 'text-green-400' } : value >= 105 && value <= 135 ? { text: 'good', color: 'text-blue-400' } : { text: 'steep/soft jawline', color: 'text-orange-400' },
            chinToPhiltrumRatio: value >= 2.0 && value <= 2.25 ? { text: 'perfect', color: 'text-green-400' } : value < 1.8 ? { text: 'long philtrum / weak chin', color: 'text-red-400' } : value > 2.5 ? { text: 'short philtrum / long chin', color: 'text-orange-400' } : { text: 'acceptable', color: 'text-blue-400' },
            mouthToNoseWidthRatio: value >= 1.5 && value <= 1.62 ? { text: 'perfect', color: 'text-green-400' } : value >= 1.4 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow mouth', color: 'text-orange-400' },
            bigonialWidthRatio: value >= 1.3 && value <= 1.4 ? { text: 'perfect wide jaw', color: 'text-green-400' } : value >= 1.2 ? { text: 'good', color: 'text-blue-400' } : value < 1.15 ? { text: 'narrow jaw', color: 'text-orange-400' } : { text: 'acceptable', color: 'text-blue-400' },
            lowerThirdRatio: value >= 0.62 ? { text: 'perfect masculine lower third', color: 'text-green-400' } : value >= 0.58 ? { text: 'good', color: 'text-blue-400' } : { text: 'weak lower third', color: 'text-orange-400' },
            palpebralFissureLength: value >= 3.0 && value <= 3.5 ? { text: 'perfect horizontal eyes', color: 'text-green-400' } : value > 3.5 ? { text: 'good', color: 'text-blue-400' } : { text: 'slightly too round eyes', color: 'text-yellow-400' },
            eyeSeparationRatio: value >= 0.45 && value <= 0.47 ? { text: 'perfect', color: 'text-green-400' } : value >= 0.42 && value <= 0.49 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal spacing', color: 'text-yellow-400' },
            eyeToMouthAngle: value >= 47 && value <= 50 ? { text: 'perfect', color: 'text-green-400' } : value < 47 ? { text: 'shallow', color: 'text-yellow-400' } : { text: 'steep', color: 'text-yellow-400' },
            lipRatio: value >= 1.60 && value <= 1.65 ? { text: 'perfect', color: 'text-green-400' } : value >= 1.30 && value <= 1.90 ? { text: 'acceptable', color: 'text-blue-400' } : { text: 'suboptimal lip ratio', color: 'text-orange-400' },
            facialAsymmetry: value >= 95 ? { text: 'perfectly symmetric', color: 'text-green-400' } : value >= 90 ? { text: 'very symmetric', color: 'text-blue-400' } : value >= 80 ? { text: 'acceptable symmetry', color: 'text-yellow-400' } : { text: 'asymmetric', color: 'text-orange-400' },
            ipdRatio: value >= 0.45 && value <= 0.47 ? { text: 'ideal eye spacing', color: 'text-green-400' } : value >= 0.42 && value <= 0.49 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal spacing', color: 'text-yellow-400' },
            facialThirdsRatio: value >= 95 ? { text: 'perfect thirds', color: 'text-green-400' } : value >= 85 ? { text: 'good proportions', color: 'text-blue-400' } : value >= 75 ? { text: 'acceptable', color: 'text-yellow-400' } : { text: 'unbalanced thirds', color: 'text-orange-400' },
            foreheadHeightRatio: value >= 0.30 && value <= 0.35 ? { text: 'ideal forehead', color: 'text-green-400' } : value > 0.38 ? { text: 'fivehead (large)', color: 'text-orange-400' } : value < 0.28 ? { text: 'short forehead', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
            noseWidthRatio: value >= 0.25 && value <= 0.30 ? { text: 'ideal nose width', color: 'text-green-400' } : value > 0.35 ? { text: 'wide nose', color: 'text-orange-400' } : value < 0.22 ? { text: 'narrow nose', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
            cheekboneProminence: value >= 0.48 && value <= 0.55 ? { text: 'prominent cheekbones', color: 'text-green-400' } : value >= 0.45 ? { text: 'good projection', color: 'text-blue-400' } : { text: 'flat cheekbones', color: 'text-yellow-400' },
            hairlineRecession: value >= 95 ? { text: 'full hairline', color: 'text-green-400' } : value >= 85 ? { text: 'good hairline', color: 'text-blue-400' } : value >= 70 ? { text: 'minor recession', color: 'text-yellow-400' } : value >= 50 ? { text: 'receding hairline', color: 'text-orange-400' } : { text: 'significant hair loss', color: 'text-red-400' },
            orbitalRimProtrusion: value > 0.015 ? { text: 'deep-set eyes (ideal)', color: 'text-green-400' } : value > 0.005 ? { text: 'good eye depth', color: 'text-blue-400' } : value > -0.005 ? { text: 'neutral depth', color: 'text-yellow-400' } : { text: 'bulging eyes', color: 'text-red-400' },
            maxillaryProtrusion: value > 0.02 ? { text: 'forward maxilla (ideal)', color: 'text-green-400' } : value > 0.01 ? { text: 'good maxilla', color: 'text-blue-400' } : value > -0.005 ? { text: 'neutral', color: 'text-yellow-400' } : { text: 'retruded maxilla', color: 'text-red-400' },
            browRidgeProtrusion: value > 0.015 ? { text: 'prominent brow (masculine)', color: 'text-green-400' } : value > 0.005 ? { text: 'good brow ridge', color: 'text-blue-400' } : { text: 'flat brow', color: 'text-yellow-400' },
            infraorbitalRimPosition: value > 0.01 ? { text: 'forward infraorbital rim', color: 'text-green-400' } : value > -0.005 ? { text: 'neutral', color: 'text-blue-400' } : { text: 'retruded (dark circles)', color: 'text-orange-400' },
            chinProjection: value > 0.025 ? { text: 'strong chin', color: 'text-green-400' } : value > 0.01 ? { text: 'good projection', color: 'text-blue-400' } : value > 0 ? { text: 'weak chin', color: 'text-yellow-400' } : { text: 'recessed chin', color: 'text-red-400' },
            doubleChinRisk: value > 0.02 ? { text: 'sharp jawline', color: 'text-green-400' } : value > 0.008 ? { text: 'good definition', color: 'text-blue-400' } : value > 0 ? { text: 'soft jawline', color: 'text-yellow-400' } : { text: 'submental fullness', color: 'text-orange-400' },
            angleDeduction: value === 0 ? { text: 'ideal camera setup', color: 'text-green-400' } : value <= 0.5 ? { text: 'minor tilt', color: 'text-yellow-400' } : { text: 'high distortion check', color: 'text-red-400' },
            facialTension: value < 0.5 ? { text: 'relaxed / neutral', color: 'text-green-400' } : value < 1.2 ? { text: 'minor tension', color: 'text-yellow-400' } : { text: 'high tension detected', color: 'text-orange-400' },
            skinQuality: value > 90 ? { text: 'glass skin', color: 'text-green-400' } : value > 75 ? { text: 'clear skin', color: 'text-blue-400' } : value > 50 ? { text: 'textured', color: 'text-yellow-400' } : { text: 'acne / heavy texture', color: 'text-red-400' }
        };

        return mRatings[metric] || { text: 'unknown', color: 'text-gray-400' };
    };

    const getIdealRange = (metric: keyof MetricScores, gender: 'male' | 'female' = 'male'): string => {
        if (gender === 'female') {
            const fIdeals: Record<string, string> = {
                canthalTilt: '5° to 8°',
                fwfhRatio: '> 1.65',
                midfaceRatio: '0.9 to 1.05',
                gonialAngle: '120° to 135°',
                chinToPhiltrumRatio: '2.0 to 2.25',
                mouthToNoseWidthRatio: '1.45 to 1.6',
                bigonialWidthRatio: '1.15 to 1.30',
                lowerThirdRatio: '0.58 to 0.65',
                palpebralFissureLength: '2.8 to 3.5',
                eyeSeparationRatio: '0.45 to 0.47',
                eyeToMouthAngle: '47° to 50°',
                lipRatio: '1.62',
                facialAsymmetry: '95-100 (symmetry score)',
                ipdRatio: '0.45 to 0.47',
                facialThirdsRatio: '95-100 (balance score)',
                foreheadHeightRatio: '0.30 to 0.35',
                noseWidthRatio: '0.22 to 0.28',
                cheekboneProminence: '0.45 to 0.52',
                hairlineRecession: '90-100 (fullness score)',
                orbitalRimProtrusion: '> 0.005 (neutral to deep)',
                maxillaryProtrusion: '> 0.02 (forward)',
                browRidgeProtrusion: '< 0.010 (smooth brow)',
                infraorbitalRimPosition: '> 0.01 (forward)',
                chinProjection: '> 0.015 (strong)',
                doubleChinRisk: '> 0.020 (sharp jaw)',
                angleDeduction: '0 (neutral)',
                facialTension: '< 0.5 (relaxed)',
                skinQuality: '85-100 (clear)'
            };
            return fIdeals[metric] || '';
        }

        const mIdeals: Record<keyof MetricScores, string> = {
            canthalTilt: '4° to 6°',
            fwfhRatio: 'more than 1.8',
            midfaceRatio: '1.0 to 1.1',
            gonialAngle: '115° to 130°',
            chinToPhiltrumRatio: '2.0 to 2.25',
            mouthToNoseWidthRatio: '1.5 to 1.62',
            bigonialWidthRatio: '1.35',
            lowerThirdRatio: 'more than 0.62',
            palpebralFissureLength: '3.0 to 3.5',
            eyeSeparationRatio: '0.45 to 0.47',
            eyeToMouthAngle: '47° to 50°',
            lipRatio: '1.62',
            facialAsymmetry: '95-100 (symmetry score)',
            ipdRatio: '0.45 to 0.47',
            facialThirdsRatio: '95-100 (balance score)',
            foreheadHeightRatio: '0.30 to 0.35',
            noseWidthRatio: '0.25 to 0.30',
            cheekboneProminence: '0.48 to 0.55',
            hairlineRecession: '90-100 (fullness score)',
            orbitalRimProtrusion: '> 0.015 (deep-set)',
            maxillaryProtrusion: '> 0.02 (forward)',
            browRidgeProtrusion: '> 0.015 (prominent)',
            infraorbitalRimPosition: '> 0.01 (forward)',
            chinProjection: '> 0.025 (strong)',
            doubleChinRisk: '> 0.020 (sharp jaw)',
            angleDeduction: '0 (neutral)',
            facialTension: '< 0.5 (relaxed)',
            skinQuality: '85-100 (clear)'
        };
        return mIdeals[metric];
    };

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-7xl mx-auto p-4 md:p-8">
            {/* Hidden canvas for drawing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Controls Row */}
            <div className="flex flex-wrap gap-4 justify-center items-center w-full">
                {/* Input Mode Toggle */}
                <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-full border border-zinc-800 shadow-xl">
                    <button
                        onClick={() => setInputMode('webcam')}
                        className={`px-5 py-2 rounded-full font-semibold transition-all text-sm ${inputMode === 'webcam' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                    >
                        📷 Camera
                    </button>
                    <button
                        onClick={() => setInputMode('upload')}
                        className={`px-5 py-2 rounded-full font-semibold transition-all text-sm ${inputMode === 'upload' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                    >
                        📁 File / URL
                    </button>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full items-start">
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
                                <div className="text-center space-y-4">
                                    <div className="text-6xl">📸</div>
                                    <p className="text-zinc-400">No image uploaded</p>
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
                        <div className="w-full bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-bold text-zinc-400">Analysis Gallery</h4>
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">{scans.length} Angle{scans.length !== 1 ? 's' : ''} Scanned</span>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                                {scans.map((scan, i) => (
                                    <div key={i} className="relative shrink-0 w-24 h-32 rounded-xl overflow-hidden border-2 border-zinc-700 snap-center group">
                                        <img src={scan.imageUrl} alt={`Scan ${i + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                                            <div className="text-[10px] font-bold text-white uppercase text-center bg-black/50 rounded backdrop-blur-md inline-block px-1">
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
                                        // Optional: Keep uploaded image if we want to extract another face, but usually clear it for a new photo
                                        setUploadedImage(null);
                                    }}
                                    className="shrink-0 w-24 h-32 rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center hover:bg-zinc-800 hover:border-zinc-500 transition-all snap-center group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-zinc-700 transition-colors mb-2">
                                        +
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300">ADD ANGLE</span>
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Audit Report */}
                <div className="flex flex-col space-y-6">
                    {!auditResult ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8 text-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2">FaceAudit™ AI</h3>
                                <p className="text-zinc-400 max-w-sm mx-auto">
                                    Position your face clearly. Ensure good lighting. Remove glasses.
                                </p>
                            </div>
                            {inputMode === 'webcam' ? (
                                <button
                                    onClick={captureAndAnalyze}
                                    disabled={!faceLandmarker || isAnalyzing}
                                    className="w-full max-w-xs py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/10 disabled:opacity-50"
                                >
                                    {isAnalyzing ? 'Scanning...' : 'Start Audit'}
                                </button>
                            ) : (
                                <>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={!faceLandmarker || isAnalyzing}
                                        className="w-full max-w-xs py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/10 disabled:opacity-50"
                                    >
                                        {isAnalyzing ? 'Scanning...' : 'Choose Image'}
                                    </button>

                                    {/* URL Upload */}
                                    <div className="w-full max-w-xs">
                                        <div className="flex items-center gap-2 my-2">
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
                                                disabled={!faceLandmarker || isAnalyzing}
                                                className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 placeholder-zinc-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                            />
                                            <button
                                                onClick={handleUrlUpload}
                                                disabled={!faceLandmarker || isAnalyzing || !urlInput.trim()}
                                                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors"
                                            >
                                                ↗
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                            {!faceLandmarker && <p className="text-xs text-yellow-500">Loading models...</p>}
                        </div>
                    ) : (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">

                            {/* Score Hero Card */}
                            {(() => {
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
                                    <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-7">
                                        <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-white to-transparent pointer-events-none" />
                                        <div className="flex items-start justify-between mb-5">
                                            <div>
                                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">
                                                    {auditResult.profileType === 'composite' ? '⚡ Composite Score' : '📸 Scan Score'}
                                                </p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className={`text-6xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                                                        {s.toFixed(1)}
                                                    </span>
                                                    <span className="text-2xl font-bold text-zinc-600">/ 8.0 PSL</span>
                                                </div>
                                                <p className="text-sm font-medium text-zinc-300 mt-1">{auditResult.psl.tier}</p>
                                            </div>
                                            <button
                                                onClick={() => { setAuditResult(null); setScans([]); setAnalyzedImageWithLandmarks(null); setUploadedImage(null); }}
                                                className="text-xs font-semibold text-zinc-600 hover:text-red-400 transition-colors border border-zinc-700 hover:border-red-500/50 rounded-lg px-3 py-1.5"
                                            >
                                                Reset
                                            </button>
                                        </div>

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
                                );
                            })()}

                            {/* Metric Cards */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Feature Analysis</h3>
                                {Object.entries(auditResult.metrics).map(([key, value]) => {
                                    const metricKey = key as keyof MetricScores;
                                    const rating = getRating(metricKey, value, gender);
                                    const idealRange = getIdealRange(metricKey, gender);
                                    const label = key.replace(/([A-Z])/g, ' $1').trim();
                                    const isExpanded = expandedMetric === key;
                                    const explanation = metricExplanations[key];
                                    const recs = metricRecommendations[key];

                                    const sideOnlyMetrics = ['chinProjection', 'maxillaryProtrusion', 'orbitalRimProtrusion', 'browRidgeProtrusion', 'infraorbitalRimPosition', 'doubleChinRisk'];
                                    const frontOnlyMetrics = ['facialAsymmetry', 'ipdRatio', 'eyeSeparationRatio', 'canthalTilt', 'fwfhRatio', 'noseWidthRatio', 'mouthToNoseWidthRatio', 'bigonialWidthRatio', 'cheekboneProminence', 'skinQuality', 'facialTension'];

                                    const isSideMetric = sideOnlyMetrics.includes(key);
                                    const isFrontMetric = frontOnlyMetrics.includes(key);
                                    let isValidForProfile = true;
                                    let profileNote = '';
                                    if (auditResult.profileType === 'front' && isSideMetric) { isValidForProfile = false; profileNote = 'Side profile required'; }
                                    else if (auditResult.profileType === 'side' && isFrontMetric) { isValidForProfile = false; profileNote = 'Front profile required'; }

                                    const isGood = rating.color.includes('green');
                                    const isOk = rating.color.includes('blue') || rating.color.includes('yellow');
                                    const isBad = rating.color.includes('orange') || rating.color.includes('red');
                                    const borderColor = !isValidForProfile ? 'border-zinc-800' : isGood ? 'border-emerald-500/40' : isBad ? 'border-red-500/40' : 'border-zinc-700';
                                    const bgHover = !isValidForProfile ? '' : isGood ? 'hover:bg-emerald-950/20' : isBad ? 'hover:bg-red-950/20' : 'hover:bg-zinc-800/50';

                                    return (
                                        <div
                                            key={key}
                                            className={`rounded-2xl border ${borderColor} bg-zinc-900 transition-all duration-200 overflow-hidden ${!isValidForProfile ? 'opacity-30' : 'cursor-pointer ' + bgHover}`}
                                            onClick={() => isValidForProfile && setExpandedMetric(isExpanded ? null : key)}
                                        >
                                            {/* Row */}
                                            <div className="flex items-center gap-3 px-4 py-3.5">
                                                {/* Status dot */}
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!isValidForProfile ? 'bg-zinc-700' : isGood ? 'bg-emerald-400' : isBad ? 'bg-red-400' : 'bg-yellow-400'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline justify-between gap-2">
                                                        <span className="text-sm font-semibold text-white capitalize truncate">{explanation?.title || label}</span>
                                                        <span className={`text-xs font-bold flex-shrink-0 ${isValidForProfile ? rating.color : 'text-zinc-600'}`}>
                                                            {isValidForProfile ? rating.text : profileNote}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-0.5">
                                                        <span className="text-[11px] text-zinc-500">Ideal: {idealRange}</span>
                                                        {isValidForProfile && (
                                                            <span className="text-[11px] font-mono text-zinc-400">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {isValidForProfile && (
                                                    <svg className={`w-4 h-4 text-zinc-600 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                )}
                                            </div>

                                            {/* Expanded Panel */}
                                            {isExpanded && isValidForProfile && (
                                                <div className="border-t border-zinc-800 px-4 pb-5 pt-4 space-y-4 text-sm">
                                                    {/* What it means */}
                                                    {explanation && (
                                                        <div>
                                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">What this measures</p>
                                                            <p className="text-zinc-300 leading-relaxed">{explanation.whatItIs}</p>
                                                            <p className="text-zinc-400 leading-relaxed mt-2">{explanation.scientificContext}</p>
                                                            {explanation.blackpillNote && (
                                                                <p className="text-amber-400/80 text-xs leading-relaxed mt-2 italic">{explanation.blackpillNote}</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Recommendations — only show for non-perfect metrics */}
                                                    {recs && !isGood && (
                                                        <div className="space-y-3 pt-1">
                                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">How to improve</p>

                                                            {recs.surgical.length > 0 && (
                                                                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-3">
                                                                    <p className="text-xs font-bold text-red-400 mb-2">🔪 Surgical Options</p>
                                                                    <ul className="space-y-1.5">
                                                                        {recs.surgical.map((r, i) => (
                                                                            <li key={i} className="text-xs text-zinc-300 leading-relaxed flex gap-2">
                                                                                <span className="text-red-500/60 flex-shrink-0 mt-0.5">•</span>
                                                                                {r}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            {recs.nonSurgical.length > 0 && (
                                                                <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3">
                                                                    <p className="text-xs font-bold text-blue-400 mb-2">💊 Non-Surgical Options</p>
                                                                    <ul className="space-y-1.5">
                                                                        {recs.nonSurgical.map((r, i) => (
                                                                            <li key={i} className="text-xs text-zinc-300 leading-relaxed flex gap-2">
                                                                                <span className="text-blue-500/60 flex-shrink-0 mt-0.5">•</span>
                                                                                {r}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            {recs.lifestyle.length > 0 && (
                                                                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3">
                                                                    <p className="text-xs font-bold text-emerald-400 mb-2">🌱 Lifestyle Changes</p>
                                                                    <ul className="space-y-1.5">
                                                                        {recs.lifestyle.map((r, i) => (
                                                                            <li key={i} className="text-xs text-zinc-300 leading-relaxed flex gap-2">
                                                                                <span className="text-emerald-500/60 flex-shrink-0 mt-0.5">•</span>
                                                                                {r}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            <p className="text-[11px] text-zinc-500 italic leading-relaxed border-t border-zinc-800 pt-3">{recs.outlook}</p>
                                                        </div>
                                                    )}

                                                    {isGood && (
                                                        <div className="flex items-center gap-2 text-emerald-400/80 text-xs italic">
                                                            <span>✓</span> This feature is within the ideal range. No intervention needed.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* PSL Boost Roadmap */}
                            {(() => {
                                const flawed = Object.entries(auditResult.metrics).filter(([key, value]) => {
                                    const metricKey = key as keyof MetricScores;
                                    const rating = getRating(metricKey, value, gender);
                                    return rating.color.includes('orange') || rating.color.includes('red');
                                });
                                if (flawed.length === 0) return null;
                                return (
                                    <div className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-lg">🚀</span>
                                            <h3 className="text-sm font-bold text-amber-400">Your PSL Boost Roadmap</h3>
                                        </div>
                                        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                                            The following metrics are impacting your score the most. Click any item above to see specific steps you can take.
                                        </p>
                                        <div className="space-y-2">
                                            {flawed.map(([key]) => {
                                                const explanation = metricExplanations[key];
                                                const rating = getRating(key as keyof MetricScores, auditResult.metrics[key as keyof MetricScores], gender);
                                                const isBad = rating.color.includes('red');
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => setExpandedMetric(expandedMetric === key ? null : key)}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 hover:bg-amber-950/10 transition-all text-left"
                                                    >
                                                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${isBad ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                            {isBad ? 'FIX' : 'IMPROVE'}
                                                        </span>
                                                        <span className="text-sm text-zinc-200 font-medium">{explanation?.title || key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                        <svg className="w-3.5 h-3.5 text-zinc-600 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* New Scan */}
                            <button
                                onClick={() => { setAuditResult(null); setIsAnalyzing(false); setUploadedImage(null); setAnalyzedImageWithLandmarks(null); setExpandedMetric(null); }}
                                className="w-full py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors border border-zinc-700 hover:border-zinc-500"
                            >
                                New Scan
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
