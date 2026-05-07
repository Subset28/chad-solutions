import { NormalizedLandmark } from "@mediapipe/tasks-vision";

// ==========================================
// 1. Core Types & Helpers
// ==========================================

export interface BilateralResult {
    average: number;
    delta: number; // Asymmetry delta
    left: number;
    right: number;
}

export interface DetailedMetric {
    value: number;
    unit: string;
    percentile?: number;
    confidence: number;
    idealRange: [number, number];
    citation?: string;
    interpretation: string;
}

/**
 * 3D Euclidean distance
 */
export function distance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
    return Math.sqrt(
        Math.pow((p2.x || 0) - (p1.x || 0), 2) +
        Math.pow((p2.y || 0) - (p1.y || 0), 2) +
        Math.pow((p2.z || 0) - (p1.z || 0), 2)
    );
}

export function midpoint(p1: NormalizedLandmark, p2: NormalizedLandmark): NormalizedLandmark {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
        z: (p1.z + p2.z) / 2
    };
}

/**
 * Calculate angle (degrees) formed by three points: p1 -> p2 (vertex) -> p3
 */
export function calculateThreePointAngle(p1: NormalizedLandmark, p2: NormalizedLandmark, p3: NormalizedLandmark): number {
    const a = distance(p2, p3);
    const b = distance(p1, p3);
    const c = distance(p1, p2);
    if (a === 0 || c === 0) return 0;
    const cosAngle = (Math.pow(a, 2) + Math.pow(c, 2) - Math.pow(b, 2)) / (2 * a * c);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    return angleRad * (180 / Math.PI);
}

// ==========================================
// 2. Periorbital / Eye Region
// ==========================================

/**
 * Corrected Canthal Tilt (Soft Tissue)
 * Formula: atan2(-(outer.y - inner.y), outer.x - inner.x)
 * Cites: "The aesthetics of the eyelids and the periorbital area" (clinical standards)
 */
export function calculateCanthalTilt(landmarks: NormalizedLandmark[]): BilateralResult {
    const innerL = landmarks[362], outerL = landmarks[263];
    const innerR = landmarks[133], outerR = landmarks[33];

    const leftTilt = Math.atan2(-(outerL.y - innerL.y), outerL.x - innerL.x) * (180 / Math.PI);
    const rightTilt = Math.atan2(-(outerR.y - innerR.y), outerR.x - innerR.x) * (180 / Math.PI);

    return {
        average: (leftTilt + rightTilt) / 2,
        delta: Math.abs(leftTilt - rightTilt),
        left: leftTilt,
        right: rightTilt
    };
}

/**
 * Upper Eyelid Exposure (UEE)
 * Ratio of iris height covered by upper lid
 */
export function calculateUEE(landmarks: NormalizedLandmark[]): BilateralResult {
    // MediaPipe: 159 (top lid), 145 (bottom lid), 468 (iris center)
    const irisTopL = landmarks[159], irisBottomL = landmarks[145], irisCenterL = landmarks[468];
    const irisTopR = landmarks[386], irisBottomR = landmarks[374], irisCenterR = landmarks[473];

    const eyeHeightL = distance(irisTopL, irisBottomL);
    const lidToCenterL = distance(irisTopL, irisCenterL);
    const ueeL = lidToCenterL / eyeHeightL;

    const eyeHeightR = distance(irisTopR, irisBottomR);
    const lidToCenterR = distance(irisTopR, irisCenterR);
    const ueeR = lidToCenterR / eyeHeightR;

    return {
        average: (ueeL + ueeR) / 2,
        delta: Math.abs(ueeL - ueeR),
        left: ueeL,
        right: ueeR
    };
}

// ==========================================
// 3. Midface & Bone Structure
// ==========================================

/**
 * fWHR (Facial Width to Height Ratio)
 * Bizygomatic width / Upper face height (Nasion to Stomion)
 * Cite: Weston et al. 2007
 */
export function calculatefWHR(landmarks: NormalizedLandmark[]): number {
    const bizygomaticWidth = distance(landmarks[234], landmarks[454]);
    const nasion = landmarks[168]; // Glabella/Nasion area
    const stomion = landmarks[13]; // Mouth center
    const upperFaceHeight = distance(nasion, stomion);

    return upperFaceHeight === 0 ? 0 : bizygomaticWidth / upperFaceHeight;
}

/**
 * Midface Ratio
 * Nose tip to upper lip / Total face height
 */
export function calculateMidfaceRatio(landmarks: NormalizedLandmark[]): number {
    const noseTip = landmarks[1];
    const upperLip = landmarks[0];
    const menton = landmarks[152];
    const foreheadTop = landmarks[10];

    const midfaceSegment = distance(noseTip, upperLip);
    const totalHeight = distance(foreheadTop, menton);

    return totalHeight === 0 ? 0 : midfaceSegment / totalHeight;
}

/**
 * Philtrum Length (Metric mm)
 * Subnasale [2] to Cupid's bow [0]
 */
export function calculatePhiltrumLength(landmarks: NormalizedLandmark[], ipd_mm: number = 63): number {
    const rawPhiltrum = distance(landmarks[2], landmarks[0]);
    const rawIPD = distance(midpoint(landmarks[33], landmarks[133]), midpoint(landmarks[263], landmarks[362]));
    
    // Scale to mm using IPD as anchor
    return (rawPhiltrum / rawIPD) * ipd_mm;
}

// ==========================================
// 4. Jawline & Lower Face
// ==========================================

/**
 * Gonial Angle
 * Angle between Ramus and Jaw Body
 * Points: menton [152] -> gonion [58/288] -> tragus [234/454]
 */
export function calculateGonialAngle(landmarks: NormalizedLandmark[]): BilateralResult {
    // Tragus area to Jaw Corner (172/397) to Menton (152)
    const leftAngle = calculateThreePointAngle(landmarks[152], landmarks[172], landmarks[234]);
    const rightAngle = calculateThreePointAngle(landmarks[152], landmarks[397], landmarks[454]);

    return {
        average: (leftAngle + rightAngle) / 2,
        delta: Math.abs(leftAngle - rightAngle),
        left: leftAngle,
        right: rightAngle
    };
}

/**
 * Chin Projection
 * Horizontal distance from lower lip [14] to chin tip [152] relative to nose base [2]
 * (Best from side profile, but estimated frontally via Z-depth)
 */
export function calculateChinProjection(landmarks: NormalizedLandmark[]): number {
    const noseBase = landmarks[2];
    const lowerLip = landmarks[14];
    const chinTip = landmarks[152];

    // Projection is relative Z depth
    // A projecting chin has Z closer to camera (lesser Z in normalized space if using inverted rotation)
    return (noseBase.z - chinTip.z) - (noseBase.z - lowerLip.z);
}

/**
 * Orbital Rim Protrusion
 * Compare z-depth of orbital rim landmarks vs eye center
 */
export function calculateOrbitalRimProtrusion(landmarks: NormalizedLandmark[]): BilateralResult {
    const leftEye = landmarks[159], leftLatRim = landmarks[263], leftBrow = landmarks[70];
    const rightEye = landmarks[386], rightLatRim = landmarks[33], rightBrow = landmarks[300];

    const leftProt = leftEye.z - ((leftLatRim.z + leftBrow.z) / 2);
    const rightProt = rightEye.z - ((rightLatRim.z + rightBrow.z) / 2);

    return {
        average: (leftProt + rightProt) / 2,
        delta: Math.abs(leftProt - rightProt),
        left: leftProt,
        right: rightProt
    };
}

/**
 * Maxillary Protrusion
 * Maxilla z-position relative to forehead
 */
export function calculateMaxillaryProtrusion(landmarks: NormalizedLandmark[]): number {
    const noseBase = landmarks[2], upperLip = landmarks[13], forehead = landmarks[10];
    const maxillaZ = (noseBase.z + upperLip.z) / 2;
    return forehead.z - maxillaZ;
}

/**
 * Brow Ridge Protrusion
 */
export function calculateBrowRidgeProtrusion(landmarks: NormalizedLandmark[]): number {
    const leftBrow = landmarks[70], rightBrow = landmarks[300], midBrow = landmarks[9];
    const leftEye = landmarks[159], rightEye = landmarks[386];
    const browZ = (leftBrow.z + rightBrow.z + midBrow.z) / 3;
    const eyeZ = (leftEye.z + rightEye.z) / 2;
    return eyeZ - browZ;
}

/**
 * Double Chin Risk
 */
export function calculateDoubleChinRisk(landmarks: NormalizedLandmark[]): number {
    const chinTip = landmarks[152];
    const submentalNeck = landmarks[200];
    return submentalNeck.z - chinTip.z;
}

/**
 * Facial Tension Analysis (Blendshapes)
 */
export function calculateFacialTension(blendshapes: any[]): { tensionScore: number, dominantExpressions: string[] } {
    if (!blendshapes || blendshapes.length === 0) return { tensionScore: 0, dominantExpressions: [] };
    const categories = blendshapes[0].categories;
    const tensionMetrics = ['browInnerUp', 'browDownLeft', 'browDownRight', 'jawOpen', 'mouthSmileLeft', 'mouthSmileRight', 'mouthStretch', 'mouthPressLeft', 'mouthPressRight', 'mouthDimpleLeft', 'mouthDimpleRight'];
    let totalTension = 0;
    const dominant: string[] = [];
    categories.forEach((cat: { categoryName: string; score: number }) => {
        if (tensionMetrics.includes(cat.categoryName)) {
            totalTension += cat.score;
            if (cat.score > 0.3) dominant.push(cat.categoryName);
        }
    });
    return { tensionScore: totalTension, dominantExpressions: dominant };
}

// ==========================================
// 5. Symmetry Suite

// ==========================================

export function calculateMidlineDeviation(landmarks: NormalizedLandmark[]): number {
    const forehead = landmarks[10];
    const menton = landmarks[152];
    const noseBridge = landmarks[168];
    const noseTip = landmarks[1];
    const stomion = landmarks[13];

    // Ideally all these points have the same X coordinate in a perfectly centered face
    const centerX = (forehead.x + menton.x) / 2;
    const deviation = (
        Math.abs(noseBridge.x - centerX) +
        Math.abs(noseTip.x - centerX) +
        Math.abs(stomion.x - centerX)
    ) / 3;

    return deviation * 100; // Return as percentage of face width
}

// ==========================================
// 6. Comprehensive Metric Aggregator
// ==========================================

export interface MetricReport {
    periorbital: {
        canthalTilt: BilateralResult;
        uee: BilateralResult;
        esr: number;
        ipd: number;
        orbitalRimProtrusion: BilateralResult;
        browRidgeProtrusion: number;
        infraorbitalRimPosition: number;
        confidence: number;
    };
    midface: {
        fWHR: number;
        midfaceRatio: number;
        philtrumLength: number;
        noseWidthRatio: number;
        maxillaryProtrusion: number;
        confidence: number;
    };
    jawline: {
        gonialAngle: BilateralResult;
        chinProjection: number;
        bigonialRatio: number;
        doubleChinRisk: number;
        confidence: number;
    };
    symmetry: {
        midlineDeviation: number;
        overallSymmetry: number;
        confidence: number;
    };
    skin: {
        tension: number;
        dominantExpressions: string[];
        confidence: number;
    };
    vitality: {
        vitalityScore: number;
        biologicalAgeDelta: number;
        sleepScore: number;
        collagenIndex: number;
    };
}

export function analyzeMetrics(landmarks: NormalizedLandmark[], blendshapes: any[] = []): MetricReport {
    const bizygomatic = distance(landmarks[234], landmarks[454]);
    const leftEye = midpoint(landmarks[33], landmarks[133]);
    const rightEye = midpoint(landmarks[263], landmarks[362]);
    const ipd = distance(leftEye, rightEye);
    const tensionData = calculateFacialTension(blendshapes);

    return {
        periorbital: {
            canthalTilt: calculateCanthalTilt(landmarks),
            uee: calculateUEE(landmarks),
            esr: ipd / bizygomatic,
            ipd: ipd,
            orbitalRimProtrusion: calculateOrbitalRimProtrusion(landmarks),
            browRidgeProtrusion: calculateBrowRidgeProtrusion(landmarks),
            infraorbitalRimPosition: (landmarks[226].z + landmarks[446].z) / 2,
            confidence: 0.95
        },
        midface: {
            fWHR: calculatefWHR(landmarks),
            midfaceRatio: calculateMidfaceRatio(landmarks),
            philtrumLength: calculatePhiltrumLength(landmarks),
            noseWidthRatio: distance(landmarks[48], landmarks[278]) / bizygomatic,
            maxillaryProtrusion: calculateMaxillaryProtrusion(landmarks),
            confidence: 0.92
        },
        jawline: {
            gonialAngle: calculateGonialAngle(landmarks),
            chinProjection: calculateChinProjection(landmarks),
            bigonialRatio: distance(landmarks[172], landmarks[397]) / bizygomatic,
            doubleChinRisk: calculateDoubleChinRisk(landmarks),
            confidence: 0.88
        },
        symmetry: {
            midlineDeviation: calculateMidlineDeviation(landmarks),
            overallSymmetry: Math.max(0, 100 - calculateMidlineDeviation(landmarks)),
            confidence: 0.96
        },
        skin: {
            tension: tensionData.tensionScore,
            dominantExpressions: tensionData.dominantExpressions,
            confidence: 0.85
        },
        vitality: calculateVitality(landmarks)
    };
}

function calculateVitality(landmarks: any[]) {
    // Bio-markers for vitality estimation (Experimental)
    const eyelidOpenness = (distance(landmarks[159], landmarks[145]) + distance(landmarks[386], landmarks[374])) / 2;
    const nasolabialDepth = distance(landmarks[205], landmarks[425]);
    
    // Scale normalized values to human-readable indices
    const vitalityScore = Math.min(100, Math.max(0, 
        (eyelidOpenness * 1500) - (nasolabialDepth * 20)
    ));

    return {
        vitalityScore: Math.round(vitalityScore),
        biologicalAgeDelta: (vitalityScore > 80 ? -2.0 : vitalityScore < 40 ? 4.0 : 0),
        sleepScore: Math.min(100, Math.round(eyelidOpenness * 2000)),
        collagenIndex: Math.round(vitalityScore * 0.8) // Proxy for tissue support
    };
}

export function flattenMetrics(report: MetricReport): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    const processObject = (obj: any) => {
        for (const [key, value] of Object.entries(obj)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                if ('average' in value) {
                    flattened[key] = value.average;
                } else {
                    processObject(value);
                }
            } else {
                flattened[key] = value;
            }
        }
    };

    processObject(report);
    return flattened;
}


