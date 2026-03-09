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

// === DOUBLE CHIN / SUBMENTAL FULLNESS ===
export function calculateDoubleChinRisk(landmarks: NormalizedLandmark[]): number {
    // The Menton (152) is the tip of the chin
    // The points directly under it descending towards the neck are 175, 199, 200.
    // 200 is deep under the jawline / submental area.
    const chinTip = landmarks[152];
    const submentalNeck = landmarks[200];

    // Calculate the drop-off in Z depth between the chin and the neck 
    // In MediaPipe, more negative Z means closer to the camera.
    // So chinTip.z should be very negative, and submentalNeck.z should be closer to 0 (further away).
    // Hence, submentalNeck.z - chinTip.z = positive robust distance.
    // A smaller drop-off indicates fat padding / double chin.
    return submentalNeck.z - chinTip.z;
}

// === POSTURE & EXPRESSION (Blendshapes) ===
export function evaluateFacialTension(blendshapes: any[]): { tensionScore: number, dominantExpressions: string[] } {
    if (!blendshapes || blendshapes.length === 0) return { tensionScore: 0, dominantExpressions: [] };

    const categories = blendshapes[0].categories;
    const tensionMetrics = ['browInnerUp', 'browDownLeft', 'browDownRight', 'jawOpen', 'mouthSmileLeft', 'mouthSmileRight', 'mouthStretch', 'mouthPressLeft', 'mouthPressRight', 'mouthDimpleLeft', 'mouthDimpleRight'];

    let totalTension = 0;
    let dominant: string[] = [];

    categories.forEach((cat: any) => {
        if (tensionMetrics.includes(cat.categoryName)) {
            totalTension += cat.score;
            if (cat.score > 0.3) {
                dominant.push(cat.categoryName);
            }
        }
    });

    return {
        tensionScore: totalTension,
        dominantExpressions: dominant
    };
}

// === ANGLE UNDERSTANDING (Euler) ===
export function evaluateCameraAngle(pitch: number, yaw: number): { score: number, feedback: string } {
    let angleDeduction = 0;
    let feedback = "Good angle";

    // Extreme up/down
    if (pitch > 22) {
        angleDeduction += 1.0;
        feedback = "Looking down (Frauding Jawline)";
    } else if (pitch < -22) {
        angleDeduction += 1.0;
        feedback = "Looking up (Frauding Hooded Eyes)";
    } else if (Math.abs(pitch) > 12) {
        angleDeduction += 0.5;
        feedback = "Slight vertical tilt";
    }

    // Extreme sideways
    if (Math.abs(yaw) > 25) {
        angleDeduction += 1.0;
        if (feedback === "Good angle") feedback = "Face severely turned";
        else feedback += " | Face turned";
    }

    return { score: angleDeduction, feedback };
}

// === LENS DISTORTION (Fisheye / Too Close) ===
export function evaluateLensDistortion(
    landmarks: NormalizedLandmark[],
    midfaceRatio: number,
    noseWidthRatio: number,
    fwfhRatio: number
): { isDistorted: boolean, severity: 'none' | 'moderate' | 'severe', feedback: string } {
    // MediaPipe gives us coordinates normalized 0-1.
    // Distance between cheekbones (234 to 454) gives us the face width as a % of the total image width.
    const faceWidthFraction = Math.abs(landmarks[454].x - landmarks[234].x);

    let markers = 0;

    if (faceWidthFraction > 0.65) markers++; // Face takes up > 65% of screen width (very close to lens)
    if (midfaceRatio < 0.72) markers++;      // Center of face looks artificially stretched vertically
    if (noseWidthRatio > 0.35) markers++;    // Nose bloated horizontally relative to face
    if (fwfhRatio < 1.30) markers++;         // Sides of face curving away from lens

    if (markers >= 3) {
        return { isDistorted: true, severity: 'severe', feedback: 'Severe Lens Distortion (Hold camera further away, at least 2ft/60cm)' };
    } else if (markers == 2 && faceWidthFraction > 0.55) {
        return { isDistorted: true, severity: 'moderate', feedback: 'Moderate Lens Distortion (Selfie warping detected)' };
    }

    return { isDistorted: false, severity: 'none', feedback: 'Good focal distance' };
}
