import { NormalizedLandmark } from "@mediapipe/tasks-vision";

/**
 * Advanced 3D Metrics using Z-depth data from MediaPipe Face Mesh
 * Based on blackpill facial aesthetics theory
 */

// === ORBITAL RIM PROTRUSION (Deep-set vs Bulging Eyes) ===
export function calculateOrbitalRimProtrusion(landmarks: NormalizedLandmark[]): number {
    // Compare z-depth of orbital rim landmarks vs eye center
    const leftEyeCenter = landmarks[159];
    const rightEyeCenter = landmarks[386];

    // Lateral orbital rim points
    const leftLateralRim = landmarks[263]; // Outer corner of left eye
    const rightLateralRim = landmarks[33];  // Outer corner of right eye

    // Supraorbital (brow) landmarks
    const leftBrow = landmarks[70];
    const rightBrow = landmarks[300];

    // Calculate average rim protrusion relative to eye center
    // Negative z = closer to camera = more protruding
    const leftProtrusion = leftEyeCenter.z - ((leftLateralRim.z + leftBrow.z) / 2);
    const rightProtrusion = rightEyeCenter.z - ((rightLateralRim.z + rightBrow.z) / 2);

    // Average both sides
    // Higher = more deep-set (ideal)
    // Lower/negative = bulging eyes (falio)
    return (leftProtrusion + rightProtrusion) / 2;
}

// === MAXILLARY PROTRUSION ===
export function calculateMaxillaryProtrusion(landmarks: NormalizedLandmark[]): number {
    // Maxilla landmarks (upper jaw area)
    const noseBase = landmarks[2];  // Nose base (on maxilla)
    const upperLip = landmarks[13]; // Upper lip

    // Reference: Forehead/frontal plane
    const foreheadRef = landmarks[10]; // Forehead

    // Calculate maxilla z-position relative to forehead
    // More negative z (closer to camera) = more protruded (ideal)
    const maxillaZ = (noseBase.z + upperLip.z) / 2;
    const protrusion = foreheadRef.z - maxillaZ;

    // Normalize to percentage (positive = protruded, negative = retruded)
    return protrusion;
}

// === BROW RIDGE PROTRUSION ===
export function calculateBrowRidgeProtrusion(landmarks: NormalizedLandmark[]): number {
    // Brow ridge landmarks
    const leftBrow = landmarks[70];
    const rightBrow = landmarks[300];
    const midBrow = landmarks[9];

    // Reference: Eye level
    const leftEye = landmarks[159];
    const rightEye = landmarks[386];

    // Calculate how much brow protrudes vs eyes
    const browZ = (leftBrow.z + rightBrow.z + midBrow.z) / 3;
    const eyeZ = (leftEye.z + rightEye.z) / 2;

    // Brow should be MORE protruding (lower z) than eyes
    const protrusion = eyeZ - browZ;

    return protrusion;
}

// === INFRAORBITAL RIM POSITION ===
export function calculateInfraorbitalRimPosition(landmarks: NormalizedLandmark[]): number {
    // Lower eyelid/infraorbital rim landmarks
    const leftLowerLid = landmarks[145];
    const rightLowerLid = landmarks[374];

    // Cheekbone reference
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    // Forward infraorbital rim = less dark circles, better support
    const rimZ = (leftLowerLid.z + rightLowerLid.z) / 2;
    const cheekZ = (leftCheek.z + rightCheek.z) / 2;

    // Rim should be forward (lower z) vs cheek
    return cheekZ - rimZ;
}

// === CHIN PROJECTION ===
export function calculateChinProjection(landmarks: NormalizedLandmark[]): number {
    const chin = landmarks[152];
    const noseBase = landmarks[2];
    const forehead = landmarks[10];

    // Ideal: chin slightly overshoots glabella (forehead)
    // Calculate chin position relative to forehead plane
    const chinProjection = forehead.z - chin.z;

    return chinProjection;
}

// === CHEEKBONE PROMINENCE (3D) ===
export function calculateCheekboneProminence3D(landmarks: NormalizedLandmark[]): number {
    // Cheekbone (zygomatic) landmarks
    const leftCheekbone = landmarks[234];
    const rightCheekbone = landmarks[454];

    // Reference: Face mid-plane
    const noseTip = landmarks[1];

    // High, forward-projecting cheekbones are ideal
    const cheekZ = (leftCheekbone.z + rightCheekbone.z) / 2;

    // Cheekbones should protrude forward (lower z)
    const prominence = noseTip.z - cheekZ;

    return prominence;
}

// === EVALUATION FUNCTIONS ===

export function evaluateOrbitalRimProtrusion(value: number): string {
    // Value > 0.01 = deep-set (ideal)
    // Value around 0 = neutral
    // Value < -0.01 = bulging (falio)
    if (value > 0.015) return "Deep-set eyes (IDEAL)";
    if (value > 0.008) return "Good orbital rim support";
    if (value > 0.002) return "Slightly deep-set";
    if (value > -0.005) return "Neutral eye depth";
    if (value > -0.015) return "Slightly bulging";
    return "Bulging eyes (FALIO)";
}

export function evaluateMaxillaryPosition(value: number): string {
    // Positive = protruded (ideal)
    // Near zero = neutral
    // Negative = retruded (major falio)
    if (value > 0.02) return "Forward maxilla (IDEAL)";
    if (value > 0.01) return "Good maxillary position";
    if (value > 0.003) return "Slightly forward";
    if (value > -0.005) return "Neutral maxilla";
    if (value > -0.015) return "Slightly retruded";
    if (value > -0.025) return "Retruded maxilla (FALIO)";
    return "Severe maxillary retrusion (DEATH SENTENCE)";
}

export function evaluateBrowRidgeProtrusion(value: number): string {
    // Higher = more protruding brow (masculine)
    if (value > 0.015) return "Prominent brow ridge (CHAD trait)";
    if (value > 0.008) return "Good brow protrusion";
    if (value > 0.003) return "Moderate brow ridge";
    if (value > -0.003) return "Flat brow ridge";
    return "Recessed brow ridge (feminine)";
}

export function evaluateChinProjection(value: number): string {
    // Chin should project forward
    if (value > 0.025) return "Strong chin projection (IDEAL)";
    if (value > 0.015) return "Good chin projection";
    if (value > 0.005) return "Moderate projection";
    if (value > -0.005) return "Weak chin";
    return "Recessed chin (FALIO)";
}
