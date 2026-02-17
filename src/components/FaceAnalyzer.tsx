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
    calculateNoseWidthRatio,
    calculateCheekboneProminence,
    calculateHairlineRecession,
    calculatePSLScore,
    MetricScores
} from '@/utils/geometry';

type InputMode = 'webcam' | 'upload';

export default function FaceAnalyzer() {
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [auditResult, setAuditResult] = useState<{ metrics: MetricScores, psl: { score: number, breakdown: string[], tier: string }, imageUrl: string } | null>(null);
    const [inputMode, setInputMode] = useState<InputMode>('webcam');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [analyzedImageWithLandmarks, setAnalyzedImageWithLandmarks] = useState<string | null>(null);

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
                    delegate: 'GPU'
                },
                runningMode: 'IMAGE',
                numFaces: 1,
                minFaceDetectionConfidence: 0.15,
                minFacePresenceConfidence: 0.15
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
                const landmarks = results.faceLandmarks[0];

                // Validate landmark array has enough points (MediaPipe should have 478 landmarks)
                if (!landmarks || landmarks.length < 478) {
                    alert('⚠️ Error: Face detection incomplete. Please try again with a clearer, well-lit image.');
                    setIsAnalyzing(false);
                    return;
                }

                // Check face angle (frontal vs profile)
                const leftCheek = landmarks[234];
                const rightCheek = landmarks[454];
                const noseTip = landmarks[1];

                const leftDist = Math.abs(leftCheek.x - noseTip.x);
                const rightDist = Math.abs(rightCheek.x - noseTip.x);
                const asymmetryRatio = Math.abs(leftDist - rightDist) / Math.max(leftDist, rightDist);

                if (asymmetryRatio > 0.15) {
                    alert('⚠️ Warning: Face appears angled. Please face the camera directly for accurate analysis.');
                    setIsAnalyzing(false);
                    return;
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

                const facialThirdsData = calculateFacialThirds(landmarks);

                // Import 3D bone structure metrics (dynamic import removed - will add to imports)
                const {
                    calculateOrbitalRimProtrusion,
                    calculateMaxillaryProtrusion,
                    calculateBrowRidgeProtrusion,
                    calculateInfraorbitalRimPosition,
                    calculateChinProjection
                } = require('../utils/advanced-metrics');

                const metrics: MetricScores = {
                    canthalTilt: calculateCanthalTilt(landmarks),
                    fwfhRatio: calculateFwFhRatio(landmarks),
                    midfaceRatio: calculateMidfaceRatio(landmarks),
                    eyeSeparationRatio: calculateEyeSeparationRatio(landmarks),
                    gonialAngle: calculateGonialAngle(landmarks),
                    chinToPhiltrumRatio: calculateChinToPhiltrumRatio(landmarks),
                    mouthToNoseWidthRatio: calculateMouthToNoseWidthRatio(landmarks),
                    bigonialWidthRatio: calculateBigonialWidthRatio(landmarks),
                    lowerThirdRatio: calculateLowerThirdRatio(landmarks),
                    palpebralFissureLength: calculatePalpebralFissureLength(landmarks),
                    eyeToMouthAngle: calculateEyeToMouthAngle(landmarks),
                    lipRatio: calculateLipRatio(landmarks),
                    facialAsymmetry: calculateFacialAsymmetry(landmarks),
                    ipdRatio: calculateIPDRatio(landmarks),
                    facialThirdsRatio: facialThirdsData.ratio,
                    foreheadHeightRatio: calculateForeheadHeightRatio(landmarks),
                    noseWidthRatio: calculateNoseWidthRatio(landmarks),
                    cheekboneProminence: calculateCheekboneProminence(landmarks),
                    hairlineRecession: calculateHairlineRecession(landmarks),
                    // NEW: 3D bone structure metrics
                    orbitalRimProtrusion: calculateOrbitalRimProtrusion(landmarks),
                    maxillaryProtrusion: calculateMaxillaryProtrusion(landmarks),
                    browRidgeProtrusion: calculateBrowRidgeProtrusion(landmarks),
                    infraorbitalRimPosition: calculateInfraorbitalRimPosition(landmarks),
                    chinProjection: calculateChinProjection(landmarks)
                };

                const pslData = calculatePSLScore(metrics);

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

                const resultData = {
                    metrics,
                    psl: pslData,
                    imageUrl: imageSrc
                };

                setAuditResult(resultData);
                setAnalyzedImageWithLandmarks(annotatedImage);
                setIsAnalyzing(false);

                // iOS Bridge: Send results to WKWebView if running inside Ascend app
                if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.analysisComplete) {
                    window.webkit.messageHandlers.analysisComplete.postMessage(resultData);
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

    const getRating = (metric: keyof MetricScores, value: number): { text: string, color: string } => {
        // Rating logic based on ideal ranges
        const ratings = {
            canthalTilt: value > 4 ? { text: 'perfect', color: 'text-green-400' } : value > 2 ? { text: 'good', color: 'text-blue-400' } : value < -2 ? { text: 'negative canthal tilt', color: 'text-red-400' } : { text: 'neutral', color: 'text-yellow-400' },
            fwfhRatio: value >= 2 ? { text: 'perfect', color: 'text-green-400' } : value >= 1.75 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow face', color: 'text-orange-400' },
            midfaceRatio: value <= 1.0 ? { text: 'perfect compact midface', color: 'text-green-400' } : value <= 1.05 ? { text: 'good', color: 'text-blue-400' } : { text: 'significantly too long midface', color: 'text-red-400' },
            gonialAngle: value >= 110 && value <= 130 ? { text: 'perfect', color: 'text-green-400' } : value <= 135 ? { text: 'good', color: 'text-blue-400' } : { text: 'steep/soft jawline', color: 'text-orange-400' },
            chinToPhiltrumRatio: value >= 2.0 && value <= 2.25 ? { text: 'perfect', color: 'text-green-400' } : value < 1.5 ? { text: 'extremely short philtrum', color: 'text-red-400' } : value > 3 ? { text: 'long philtrum', color: 'text-orange-400' } : { text: 'acceptable', color: 'text-blue-400' },
            mouthToNoseWidthRatio: value >= 1.5 && value <= 1.62 ? { text: 'perfect', color: 'text-green-400' } : value >= 1.4 ? { text: 'good', color: 'text-blue-400' } : { text: 'narrow mouth', color: 'text-orange-400' },
            bigonialWidthRatio: value >= 1.1 && value <= 1.15 ? { text: 'perfect', color: 'text-green-400' } : value > 1.2 ? { text: 'noticeably narrow jaw', color: 'text-orange-400' } : { text: 'acceptable', color: 'text-blue-400' },
            lowerThirdRatio: value >= 1.25 ? { text: 'perfect', color: 'text-green-400' } : value >= 1.0 ? { text: 'good', color: 'text-blue-400' } : { text: 'weak lower third', color: 'text-orange-400' },
            palpebralFissureLength: value > 3.5 ? { text: 'perfect hunter eyes', color: 'text-green-400' } : value > 3.0 ? { text: 'good', color: 'text-blue-400' } : { text: 'slightly too exposed eyes', color: 'text-yellow-400' },
            eyeSeparationRatio: value >= 0.45 && value <= 0.49 ? { text: 'perfect', color: 'text-green-400' } : value < 0.45 ? { text: 'slightly too close together eyes', color: 'text-yellow-400' } : { text: 'wide-set eyes', color: 'text-yellow-400' },
            eyeToMouthAngle: value >= 45 && value <= 49 ? { text: 'perfect', color: 'text-green-400' } : value < 45 ? { text: 'shallow', color: 'text-yellow-400' } : { text: 'steep', color: 'text-yellow-400' },
            lipRatio: value >= 1.55 && value <= 1.65 ? { text: 'perfect', color: 'text-green-400' } : value < 1.3 || value > 2.5 ? { text: 'extremely uneven lips', color: 'text-red-400' } : { text: 'acceptable', color: 'text-blue-400' },
            facialAsymmetry: value >= 95 ? { text: 'perfectly symmetric', color: 'text-green-400' } : value >= 90 ? { text: 'very symmetric', color: 'text-blue-400' } : value >= 80 ? { text: 'acceptable symmetry', color: 'text-yellow-400' } : { text: 'asymmetric', color: 'text-orange-400' },
            ipdRatio: value >= 0.42 && value <= 0.47 ? { text: 'ideal eye spacing', color: 'text-green-400' } : value >= 0.40 && value <= 0.49 ? { text: 'good', color: 'text-blue-400' } : { text: 'suboptimal spacing', color: 'text-yellow-400' },
            facialThirdsRatio: value >= 95 ? { text: 'perfect thirds', color: 'text-green-400' } : value >= 85 ? { text: 'good proportions', color: 'text-blue-400' } : value >= 75 ? { text: 'acceptable', color: 'text-yellow-400' } : { text: 'unbalanced thirds', color: 'text-orange-400' },
            foreheadHeightRatio: value >= 0.30 && value <= 0.35 ? { text: 'ideal forehead', color: 'text-green-400' } : value > 0.38 ? { text: 'fivehead (large)', color: 'text-orange-400' } : value < 0.28 ? { text: 'short forehead', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
            noseWidthRatio: value >= 0.25 && value <= 0.30 ? { text: 'ideal nose width', color: 'text-green-400' } : value > 0.35 ? { text: 'wide nose', color: 'text-orange-400' } : value < 0.22 ? { text: 'narrow nose', color: 'text-yellow-400' } : { text: 'acceptable', color: 'text-blue-400' },
            cheekboneProminence: value >= 0.48 && value <= 0.55 ? { text: 'prominent cheekbones', color: 'text-green-400' } : value >= 0.45 ? { text: 'good projection', color: 'text-blue-400' } : { text: 'flat cheekbones', color: 'text-yellow-400' },
            hairlineRecession: value >= 95 ? { text: 'full hairline', color: 'text-green-400' } : value >= 85 ? { text: 'good hairline', color: 'text-blue-400' } : value >= 70 ? { text: 'minor recession', color: 'text-yellow-400' } : value >= 50 ? { text: 'receding hairline', color: 'text-orange-400' } : { text: 'significant hair loss', color: 'text-red-400' },
            orbitalRimProtrusion: value > 0.015 ? { text: 'deep-set eyes (ideal)', color: 'text-green-400' } : value > 0.005 ? { text: 'good eye depth', color: 'text-blue-400' } : value > -0.005 ? { text: 'neutral depth', color: 'text-yellow-400' } : { text: 'bulging eyes', color: 'text-red-400' },
            maxillaryProtrusion: value > 0.02 ? { text: 'forward maxilla (ideal)', color: 'text-green-400' } : value > 0.01 ? { text: 'good maxilla', color: 'text-blue-400' } : value > -0.005 ? { text: 'neutral', color: 'text-yellow-400' } : { text: 'retruded maxilla', color: 'text-red-400' },
            browRidgeProtrusion: value > 0.015 ? { text: 'prominent brow (masculine)', color: 'text-green-400' } : value > 0.005 ? { text: 'good brow ridge', color: 'text-blue-400' } : { text: 'flat brow', color: 'text-yellow-400' },
            infraorbitalRimPosition: value > 0.01 ? { text: 'forward infraorbital rim', color: 'text-green-400' } : value > -0.005 ? { text: 'neutral', color: 'text-blue-400' } : { text: 'retruded (dark circles)', color: 'text-orange-400' },
            chinProjection: value > 0.025 ? { text: 'strong chin', color: 'text-green-400' } : value > 0.01 ? { text: 'good projection', color: 'text-blue-400' } : value > 0 ? { text: 'weak chin', color: 'text-yellow-400' } : { text: 'recessed chin', color: 'text-red-400' }
        };

        return ratings[metric] || { text: 'unknown', color: 'text-gray-400' };
    };

    const getIdealRange = (metric: keyof MetricScores): string => {
        const ideals: Record<keyof MetricScores, string> = {
            canthalTilt: 'more than 4°',
            fwfhRatio: 'more than 2',
            midfaceRatio: '1 to 1.05',
            gonialAngle: '110° to 130°',
            chinToPhiltrumRatio: '2 to 2.25',
            mouthToNoseWidthRatio: '1.5 to 1.62',
            bigonialWidthRatio: '1.1 to 1.15',
            lowerThirdRatio: 'more than 1.25',
            palpebralFissureLength: 'more than 3.5',
            eyeSeparationRatio: '0.45 to 0.49',
            eyeToMouthAngle: '45° to 49°',
            lipRatio: '1.55 to 1.65',
            facialAsymmetry: '95-100 (symmetry score)',
            ipdRatio: '0.42 to 0.47',
            facialThirdsRatio: '95-100 (balance score)',
            foreheadHeightRatio: '0.30 to 0.35',
            noseWidthRatio: '0.25 to 0.30',
            cheekboneProminence: '0.48 to 0.55',
            hairlineRecession: '90-100 (fullness score)',
            orbitalRimProtrusion: '> 0.015 (deep-set)',
            maxillaryProtrusion: '> 0.02 (forward)',
            browRidgeProtrusion: '> 0.015 (prominent)',
            infraorbitalRimPosition: '> 0.01 (forward)',
            chinProjection: '> 0.025 (strong)'
        };
        return ideals[metric];
    };

    const getMetricExplanation = (metric: keyof MetricScores, value: number): string => {
        switch (metric) {
            case 'canthalTilt':
                return value > 2
                    ? `Your canthal tilt is positive (${value.toFixed(1)}°), contributing to an attractive "hunter eye" aesthetic.`
                    : value >= 0
                        ? `Your canthal tilt is neutral (${value.toFixed(1)}°). slightly positive tilt is ideal, but neutral is acceptable.`
                        : `Your canthal tilt is negative (${value.toFixed(1)}°), which can create a tired or droopy eye appearance.`;

            case 'fwfhRatio':
                return value >= 1.9
                    ? `Your facial width-to-height ratio is ${value.toFixed(2)}, indicating a broad, dominant, and masculine facial structure.`
                    : value >= 1.7
                        ? `Your FW/FH ratio is ${value.toFixed(2)}, which is within the average to good range for men.`
                        : `Your face is relatively narrow (${value.toFixed(2)}). A wider midface is typically associated with higher testosterone.`;

            case 'midfaceRatio':
                return value <= 1.0
                    ? `You have a compact midface (ratio ${value.toFixed(2)}), a highly desirable trait for facial harmony.`
                    : value <= 1.05
                        ? `Your midface ratio is ${value.toFixed(2)}, which is balanced and proportional.`
                        : `Your midface is vertically long (${value.toFixed(2)}). A shorter midface usually looks more youthful and harmonious.`;

            case 'gonialAngle':
                return value >= 110 && value <= 130
                    ? `Your gonial angle is ${value.toFixed(1)}°, falling perfectly within the ideal masculine range (110-130°).`
                    : value < 110
                        ? `Your jaw angle is quite square (${value.toFixed(1)}°), which is generally a strong masculine trait.`
                        : `Your jaw angle is steep (${value.toFixed(1)}°), which can indicate downward facial growth or mouth breathing habits.`;

            case 'chinToPhiltrumRatio':
                return value >= 2.0 && value <= 2.3
                    ? `Your chin is ideally proportioned relative to your philtrum (ratio ${value.toFixed(2)}).`
                    : value < 2.0
                        ? `Your chin is relatively short (${value.toFixed(2)}) compared to your philtrum.`
                        : `Your chin is quite prominent (${value.toFixed(2)}) relative to your philtrum.`;

            case 'mouthToNoseWidthRatio':
                return value >= 1.5
                    ? `Your mouth is ${value.toFixed(2)}x wider than your nose, creating a strong, masculine lower face appeal.`
                    : `Your mouth width is closer to your nose width (${value.toFixed(2)}). A wider palate/mouth is generally preferred.`;

            case 'bigonialWidthRatio':
                return value >= 1.1
                    ? `Your jaw is wider than your cheekbones (ratio ${value.toFixed(2)}), creating an ideal masculine square face shape.`
                    : `Your jaw is narrower than your cheekbones (${value.toFixed(2)}), creating a more oval or heart-shaped face.`;

            case 'lowerThirdRatio':
                return value >= 1.0
                    ? `Your lower third is robust (${value.toFixed(2)}), indicating good jaw development.`
                    : `Your lower third is relatively short (${value.toFixed(2)}), which might indicate a recessed chin or deep bite.`;

            case 'palpebralFissureLength':
                return value > 3.2
                    ? `Your eyes are horizontally long (${value.toFixed(2)}), a key component of the "hunter eye" look.`
                    : `Your eyes are relatively round or short (${value.toFixed(2)}). Longer eye fissures are typically more masculine.`;

            case 'eyeSeparationRatio':
                return value >= 0.45 && value <= 0.49
                    ? `Your eye spacing is ideal (${value.toFixed(2)}), creating perfect facial harmony.`
                    : value < 0.45
                        ? `Your eyes are set relatively close together (${value.toFixed(2)}).`
                        : `Your eyes are set wide apart (${value.toFixed(2)}).`;

            case 'eyeToMouthAngle':
                return `Your eye-to-mouth angle is ${value.toFixed(1)}°, determining the "compactness" of your central face.`;

            case 'lipRatio':
                return `Your lower lip is ${value.toFixed(2)}x thicker than your upper lip. Ideal range is typically around 1.6x.`;

            case 'facialAsymmetry':
                return value >= 95
                    ? `Your face is extremely symmetrical (${value.toFixed(1)}%), a top-tier indicator of genetic health.`
                    : value >= 90
                        ? `You have good facial symmetry (${value.toFixed(1)}%).`
                        : `You have noticeable facial asymmetry (${value.toFixed(1)}%). Chewing evenly and fixing posture can help.`;

            case 'ipdRatio':
                return value >= 0.42
                    ? `Your IPD is wide (${value.toFixed(2)}), which is great for facial harmony.`
                    : `Your IPD is narrow (${value.toFixed(2)}), making your face look longer.`;

            case 'facialThirdsRatio':
                return `Your facial thirds balance score is ${value.toFixed(1)}%. Higher is better/more balanced.`;

            case 'foreheadHeightRatio':
                return `Your forehead occupies ${(value * 100).toFixed(1)}% of your face height.`;

            case 'noseWidthRatio':
                return `Your nose width is ${(value * 100).toFixed(1)}% of your face width.`;

            case 'cheekboneProminence':
                return `Your cheekbone prominence score is ${value.toFixed(2)}.`;

            case 'hairlineRecession':
                return `Your hairline fullness score is ${value.toFixed(1)}.`;

            default:
                return `Your measurement for ${metric} is ${value.toFixed(2)}.`;
        }
    };

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-7xl mx-auto p-4 md:p-8">
            {/* Hidden canvas for drawing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Input Mode Toggle */}
            <div className="flex gap-4 bg-zinc-900 p-2 rounded-full">
                <button
                    onClick={() => setInputMode('webcam')}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${inputMode === 'webcam' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                >
                    📷 Webcam
                </button>
                <button
                    onClick={() => setInputMode('upload')}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${inputMode === 'upload' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                >
                    📁 Upload
                </button>
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
                                </>
                            )}
                            {!faceLandmarker && <p className="text-xs text-yellow-500">Loading models...</p>}
                        </div>
                    ) : (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Header Score */}
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-8">
                                <div>
                                    <h2 className="text-4xl font-black text-white tracking-tight">PSL {auditResult.psl.score.toFixed(1)}</h2>
                                    <p className="text-zinc-500 mt-1">{auditResult.psl.tier}</p>
                                </div>
                                <div className="text-6xl font-black bg-gradient-to-br from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                                    {auditResult.psl.score.toFixed(1)}
                                </div>
                            </div>

                            {/* Detailed Metrics Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-800">
                                            <th className="text-left py-3 px-2 text-zinc-500 font-semibold">Feature</th>
                                            <th className="text-left py-3 px-2 text-zinc-500 font-semibold">Rating</th>
                                            <th className="text-right py-3 px-2 text-zinc-500 font-semibold">Measurement</th>
                                            <th className="text-right py-3 px-2 text-zinc-500 font-semibold">Ideal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(auditResult.metrics).map(([key, value]) => {
                                            const metricKey = key as keyof MetricScores;
                                            const rating = getRating(metricKey, value);
                                            const idealRange = getIdealRange(metricKey);
                                            const explanation = getMetricExplanation(metricKey, value as number);

                                            return (
                                                <tr key={key} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                                    <td className="py-4 px-4 font-medium text-white capitalize">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </td>
                                                    <td className={`py-4 px-4 font-semibold ${rating.color}`}>
                                                        {rating.text}
                                                    </td>
                                                    <td className="py-4 px-4 text-zinc-400 font-mono">
                                                        {typeof value === 'number' ? value.toFixed(2) : value}
                                                    </td>
                                                    <td className="py-4 px-4 text-zinc-500 text-sm">
                                                        {idealRange}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Explanations Section */}
                                <div className="mt-8 space-y-4">
                                    <h3 className="text-xl font-bold text-white mb-4">📊 Why These Metrics Matter</h3>
                                    <div className="space-y-3">
                                        {Object.entries(auditResult.metrics).map(([key, value]) => {
                                            const metricKey = key as keyof MetricScores;
                                            const explanation = getMetricExplanation(metricKey, value as number);

                                            return (
                                                <details key={key} className="bg-zinc-800/50 rounded-lg p-4 cursor-pointer hover:bg-zinc-800/70 transition-colors">
                                                    <summary className="font-semibold text-white capitalize list-none flex items-center justify-between">
                                                        <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                        <span className="text-zinc-500 text-sm">▼</span>
                                                    </summary>
                                                    <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                                                        {explanation}
                                                    </p>
                                                </details>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => { setAuditResult(null); setIsAnalyzing(false); setUploadedImage(null); setAnalyzedImageWithLandmarks(null); }}
                                className="w-full py-4 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-colors"
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
