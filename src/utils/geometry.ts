import { NormalizedLandmark } from "@mediapipe/tasks-vision";

// ==========================================
// 3D Angle Calculation (Pitch, Yaw, Roll)
// ==========================================

export interface FaceAngles {
    pitch: number; // up/down
    yaw: number;   // left/right
    roll: number;  // tilt side-to-side
}

/**
 * Extracts Euler angles (Pitch, Yaw, Roll) in degrees from a 4x4 transformation matrix
 * provided by MediaPipe's FaceLandmarker `facialTransformationMatrixes`.
 * Matrix is Row-Major order.
 */
export function extractEulerAngles(matrix: any): FaceAngles {
    // Array format is often flattened: [m00, m01, m02, m03, m10, m11, ...]
    // Note: MediaPipe matrix format might slightly differ in translation columns,
    // but the 3x3 rotation subset should be standard.
    let m00, m01, m02, m10, m11, m12, m20, m21, m22;

    // Check if it's a flattened 16-element array or 4x4 array of arrays
    if (matrix.length === 16) {
        // Flattened Float32Array
        m00 = matrix[0]; m01 = matrix[1]; m02 = matrix[2];
        m10 = matrix[4]; m11 = matrix[5]; m12 = matrix[6];
        m20 = matrix[8]; m21 = matrix[9]; m22 = matrix[10];
    } else {
        // Assume MatrixData structure or 2D array
        const getVal = (r: number, c: number) => matrix.data ? matrix.data[r * 4 + c] : matrix[r][c];
        m00 = getVal(0, 0); m01 = getVal(0, 1); m02 = getVal(0, 2);
        m10 = getVal(1, 0); m11 = getVal(1, 1); m12 = getVal(1, 2);
        m20 = getVal(2, 0); m21 = getVal(2, 1); m22 = getVal(2, 2);
    }

    // Extracting Pitch, Yaw, Roll from 3x3 rotation matrix
    // sy = Math.sqrt(m00 * m00 + m10 * m10)
    const sy = Math.sqrt(m00 * m00 + m10 * m10);
    const singular = sy < 1e-6; // If true, gimbal lock occurred

    let x, y, z;
    if (!singular) {
        x = Math.atan2(m21, m22);     // Pitch (X-axis)
        y = Math.atan2(-m20, sy);     // Yaw   (Y-axis)
        z = Math.atan2(m10, m00);     // Roll  (Z-axis)
    } else {
        x = Math.atan2(-m12, m11);    // Pitch
        y = Math.atan2(-m20, sy);     // Yaw
        z = 0;                        // Roll
    }

    // Convert radians to degrees
    const r2d = 180 / Math.PI;
    return {
        pitch: x * r2d,
        yaw: y * r2d,
        roll: z * r2d
    };
}

// True 3D Euclidean distance between two points (Utilizing MediaPipe Z depth makes measurements completely invariant to pitch and yaw camera angles).
// As long as `scaleLandmarks` scales Z symmetrically with X (by width), the 3D unit geometry remains isomorphic to the 2D bounding box!
export function distance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
    return Math.sqrt(
        Math.pow(p2.x - p1.x, 2) +
        Math.pow(p2.y - p1.y, 2) +
        Math.pow((p2.z || 0) - (p1.z || 0), 2)
    );
}

// Calculate angle in degrees between two points relative to horizontal
export function scaleLandmarks(landmarks: NormalizedLandmark[], width: number, height: number): NormalizedLandmark[] {
    return landmarks.map(lm => ({
        x: lm.x * width,
        y: lm.y * height,
        z: lm.z * width, // Z is relative to X in MediaPipe's unscaled mesh
        visibility: lm.visibility
    }));
}

export function calculateAngle(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
    const dy = p2.y - p1.y;
    const dx = p2.x - p1.x;
    let theta = Math.atan2(dy, dx); // range (-PI, PI]
    theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
    return theta * -1; // Invert because Y is positive downwards in image coords
}

export function midpoint(p1: NormalizedLandmark, p2: NormalizedLandmark): NormalizedLandmark {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
        z: (p1.z + p2.z) / 2,
        visibility: (p1.visibility && p2.visibility) ? (p1.visibility + p2.visibility) / 2 : 0
    };
}

// Calculate angle (degrees) formed by three points: p1 -> p2 -> p3
export function calculateThreePointAngle(p1: NormalizedLandmark, p2: NormalizedLandmark, p3: NormalizedLandmark): number {
    const a = distance(p2, p3);
    const b = distance(p1, p3);
    const c = distance(p1, p2);

    // Law of Cosines: b^2 = a^2 + c^2 - 2ac cos(B)
    // cos(B) = (a^2 + c^2 - b^2) / (2ac)
    const cosAngle = (Math.pow(a, 2) + Math.pow(c, 2) - Math.pow(b, 2)) / (2 * a * c);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle))); // Clamp for safety
    return angleRad * (180 / Math.PI);
}

// --- Analysis Functions ---

export function calculateCanthalTilt(landmarks: NormalizedLandmark[]): number {
    const leftInner = landmarks[362];
    const leftOuter = landmarks[263];
    const rightInner = landmarks[133];
    const rightOuter = landmarks[33];

    // Find the roll of the face using the two inner eyes to level the face perfectly
    // Viewer right (left eye) to viewer left (right eye)
    const dxRoll = leftInner.x - rightInner.x;
    const dyRoll = leftInner.y - rightInner.y;
    const roll = Math.atan2(dyRoll, dxRoll); // rads

    // Rotate a point by -roll to flatten it against horizontal plane
    const rotate = (p: NormalizedLandmark) => {
        const x = p.x * Math.cos(-roll) - p.y * Math.sin(-roll);
        const y = p.x * Math.sin(-roll) + p.y * Math.cos(-roll);
        return { x, y };
    };

    const li = rotate(leftInner);
    const lo = rotate(leftOuter);
    const ri = rotate(rightInner);
    const ro = rotate(rightOuter);

    // Left eye (viewer right): inner to outer goes RIGHT. (positive dx). Negative dy means outer is higher.
    const leftTilt = Math.atan2(-(lo.y - li.y), lo.x - li.x) * (180 / Math.PI);

    // Right eye (viewer left): inner to outer goes LEFT. (positive dx when inverted).
    const rightTilt = Math.atan2(-(ro.y - ri.y), ri.x - ro.x) * (180 / Math.PI);

    return (leftTilt + rightTilt) / 2;
}

export function calculateFwFhRatio(landmarks: NormalizedLandmark[], pitchStr: number = 0, yawStr: number = 0): number {
    // Bizygomatic Width
    let width = distance(landmarks[234], landmarks[454]);
    // Upper facial height: middle part of the eyebrow to the upper lip (0).
    const midBrow = midpoint(landmarks[105], landmarks[334]); // 105: right mid eyebrow, 334: left mid eyebrow
    let height = distance(midBrow, landmarks[0]);

    // Euler Angle Maximum Mathematical Correction (Adapts to Anglemaxxing instead of punishing it!)
    // Convert pitch/yaw to absolute radians for scalar distortion multiplier.
    const pitchRad = Math.abs(pitchStr) * (Math.PI / 180);
    const yawRad = Math.abs(yawStr) * (Math.PI / 180);

    // If the lens is pitched artificially up or down, the vertical height shrinks via foreshortening. Fix it.
    if (pitchRad > 0.05) { height = height / Math.cos(pitchRad); }
    // If the lens is yawed heavily left or right, horizontal width shrinks. Fix it.
    if (yawRad > 0.05) { width = width / Math.cos(yawRad); }

    if (height === 0) return 0;
    return width / height;
}

export function calculateMidfaceRatio(landmarks: NormalizedLandmark[], pitchStr: number = 0): number {
    // Ideal Midface Ratio: 1.0-1.1
    // Ratio = IPD / Height from Nasion (9) to Upper Lip (0)

    const rightEyeCenter = midpoint(landmarks[33], landmarks[133]);
    const leftEyeCenter = midpoint(landmarks[263], landmarks[362]);
    const ipd = distance(leftEyeCenter, rightEyeCenter);

    let midfaceHeight = distance(landmarks[9], landmarks[0]);

    // Vertical length correction via Pitch Euler matrix interpolation
    const pitchRad = Math.abs(pitchStr) * (Math.PI / 180);
    if (pitchRad > 0.05) { midfaceHeight = midfaceHeight / Math.cos(pitchRad); }

    if (midfaceHeight === 0) return 0;
    return ipd / midfaceHeight;
}

export function calculateEyeSeparationRatio(landmarks: NormalizedLandmark[]): number {
    // ESR = Interpupillary Distance / Bizygomatic Width
    const rightEyeCenter = midpoint(landmarks[33], landmarks[133]);
    const leftEyeCenter = midpoint(landmarks[263], landmarks[362]);
    const ipd = distance(leftEyeCenter, rightEyeCenter);

    const bizygomatic = distance(landmarks[234], landmarks[454]);
    if (bizygomatic === 0) return 0;

    return ipd / bizygomatic;
}

export function calculateGonialAngle(landmarks: NormalizedLandmark[]): number {
    // Right Side: Ramus(227) -> Gonion(58) -> Chin(152)
    // Left Side: Ramus(447) -> Gonion(288) -> Chin(152)

    const rightGonial = calculateThreePointAngle(landmarks[227], landmarks[58], landmarks[152]);
    const leftGonial = calculateThreePointAngle(landmarks[447], landmarks[288], landmarks[152]);

    return (rightGonial + leftGonial) / 2;
}

// --- Scoring ---

// --- New Advanced Metrics ---

export function calculateChinToPhiltrumRatio(landmarks: NormalizedLandmark[]): number {
    // Philtrum: Subnasale 164 to Upper Lip 0 (Top of Upper Lip)
    const philtrum = distance(landmarks[164], landmarks[0]);
    // Chin: Lower Lip 17 (Bottom of lower lip) to Menton 152
    // Stomion to Menton is standard, let's use Stomion/mouth center (13) to Menton (152) and Subnasale (164) to Stomion (13)
    const stomion = landmarks[13];
    const upperThird = distance(landmarks[164], stomion);
    const lowerTwoThirds = distance(stomion, landmarks[152]);

    if (upperThird === 0) return 0;
    return lowerTwoThirds / upperThird;
}

export function calculateMouthToNoseWidthRatio(landmarks: NormalizedLandmark[]): number {
    // Mouth Width: 61 (Left Corner) <-> 291 (Right Corner)
    const mouthWidth = distance(landmarks[61], landmarks[291]);

    // Nose Width: 48 (Left Alar) <-> 278 (Right Alar)
    const noseWidth = distance(landmarks[48], landmarks[278]);

    if (noseWidth === 0) return 0;
    return mouthWidth / noseWidth;
}

export function calculateBigonialWidthRatio(landmarks: NormalizedLandmark[]): number {
    // Bigonial Width (distance between gonions - jaw angles)
    // 58 = LEFT gonion (jaw angle), 288 = RIGHT gonion (jaw angle)
    const bigonialWidth = distance(landmarks[58], landmarks[288]);

    // Bizygomatic Width (cheekbone width)
    const bizygomatic = distance(landmarks[454], landmarks[234]);

    return bizygomatic / bigonialWidth;
}

export function calculateLowerThirdRatio(landmarks: NormalizedLandmark[], pitchStr: number = 0): number {
    // Replaced with "Lower / Full Face Ratio" from the standard definitions
    // lower/full face ratio: 0.62+
    // Height between nasion (9) to bottom of chin (152) / Face height (hairline 10 to bottom of chin 152)
    let lowerHeight = distance(landmarks[9], landmarks[152]);
    let fullHeight = distance(landmarks[10], landmarks[152]);

    // Pitch correction 
    const pitchRad = Math.abs(pitchStr) * (Math.PI / 180);
    if (pitchRad > 0.05) {
        // Vertical geometry dynamically restores height shortened by tilts
        lowerHeight = lowerHeight / Math.cos(pitchRad);
        fullHeight = fullHeight / Math.cos(pitchRad);
    }

    if (fullHeight === 0) return 0;
    return lowerHeight / fullHeight;
}

export function calculatePalpebralFissureLength(landmarks: NormalizedLandmark[]): number {
    // PFL = Eye Width / Eye Height (Averaged)

    // Left Eye Width: 33 <-> 133
    const leftWidth = distance(landmarks[33], landmarks[133]);
    // Left Eye Height: 159 <-> 145
    const leftHeight = distance(landmarks[159], landmarks[145]);

    const leftRatio = leftWidth / leftHeight;

    // Right Eye Width: 263 <-> 362
    const rightWidth = distance(landmarks[263], landmarks[362]);
    // Right Eye Height: 386 <-> 374
    const rightHeight = distance(landmarks[386], landmarks[374]);

    const rightRatio = rightWidth / rightHeight;

    return (leftRatio + rightRatio) / 2;
}

export function calculateLipRatio(landmarks: NormalizedLandmark[]): number {
    // Lip Ratio: Lower Lip Thickness / Upper Lip Thickness (Standard is usually 1.618 : 1, i.e. lower is thicker)
    // Upper Lip Thickness: 0 (Top) <-> 13 (Bottom of Upper)
    // Lower Lip Thickness: 14 (Top of Lower) <-> 17 (Bottom)

    // Note: MediaPipe landmarks:
    // 0: Upper lip top (philtrum end)
    // 13: Upper lip bottom (meeting point)
    // 14: Lower lip top (meeting point)
    // 17: Lower lip bottom

    const upperThickness = distance(landmarks[0], landmarks[13]);
    const lowerThickness = distance(landmarks[14], landmarks[17]);

    // Avoid division by zero
    if (upperThickness === 0) return 1.0;

    return lowerThickness / upperThickness;
}

export function calculateEyeToMouthAngle(landmarks: NormalizedLandmark[]): number {
    // Eye-Mouth-Eye (EME) Angle: Vertex at stomion (mouth center), extending to pupils
    // This defines overall facial harmony and masculinity. Standard ideal is 46°-50°.

    const rightEyeCenter = midpoint(landmarks[33], landmarks[133]);
    const leftEyeCenter = midpoint(landmarks[263], landmarks[362]);
    const stomion = landmarks[13]; // Mouth Center / Stomion

    // calculateThreePointAngle uses points: p1 -> Vertex p2 -> p3
    // We want angle between rightEyeCenter, stomion, leftEyeCenter
    const emeAngle = calculateThreePointAngle(rightEyeCenter, stomion, leftEyeCenter);

    return emeAngle;
}

export function calculateFacialAsymmetry(landmarks: NormalizedLandmark[]): number {
    // Calculate asymmetry by comparing left and right side True 3D distances
    // Lower score = more asymmetric, Higher score = more symmetric

    // Compare key bilateral landmarks (Inner eyes, Outer eyes, Mouth, Zygoma, Gonions)
    const pairs = [
        [33, 263],     // Eye outer corners
        [133, 362],    // Eye inner corners
        [61, 291],     // Mouth corners
        [234, 454],    // Cheekbones (zygoma)
        [58, 288],     // Jaw (gonions)
    ];

    const centerPointNose = landmarks[1]; // Nose tip as 3D center reference
    let asymmetryScore = 0;

    pairs.forEach(([rightIdx, leftIdx]) => {
        // True 3D Euclidean distance completely ignores Yaw rotation issues
        const rightDist = distance(landmarks[rightIdx], centerPointNose);
        const leftDist = distance(landmarks[leftIdx], centerPointNose);

        const diff = Math.abs(leftDist - rightDist);
        const avg = (leftDist + rightDist) / 2;
        asymmetryScore += (diff / avg); // Normalized difference
    });

    // Convert to 0-100 symmetry score (100 = perfect symmetry)
    const avgAsymmetry = asymmetryScore / pairs.length;
    return Math.max(0, 100 - (avgAsymmetry * 100));
}

export function calculateIPDRatio(landmarks: NormalizedLandmark[]): number {
    // Interpupillary Distance normalized by face width
    const rightEyeCenter = midpoint(landmarks[33], landmarks[133]);
    const leftEyeCenter = midpoint(landmarks[263], landmarks[362]);

    const ipd = distance(leftEyeCenter, rightEyeCenter);

    const faceWidth = distance(landmarks[234], landmarks[454]);

    return ipd / faceWidth;
}

export function calculateFacialThirds(landmarks: NormalizedLandmark[]): { upper: number, middle: number, lower: number, ratio: number } {
    // Upper Third: Hairline (top of forehead) to Glabella (between brows)
    // Middle Third: Glabella to Subnasion (nose base)
    // Lower Third: Subnasion to Menton (chin)

    const hairline = landmarks[10];      // Top of face (approximation)
    const glabella = landmarks[168];     // Between eyebrows
    const subnasion = landmarks[164];      // Nose base
    const menton = landmarks[152];       // Chin

    const upperThird = distance(hairline, glabella);
    const middleThird = distance(glabella, subnasion);
    const lowerThird = distance(subnasion, menton);

    const total = upperThird + middleThird + lowerThird;

    // Calculate how close to ideal 1:1:1 ratio
    const ideal = total / 3;
    const deviation = (
        Math.abs(upperThird - ideal) +
        Math.abs(middleThird - ideal) +
        Math.abs(lowerThird - ideal)
    ) / total;

    // Convert to 0-100 score (100 = perfect 1:1:1)
    const ratio = Math.max(0, 100 - (deviation * 200));

    return {
        upper: total > 0 ? upperThird / total : 0,
        middle: total > 0 ? middleThird / total : 0,
        lower: total > 0 ? lowerThird / total : 0,
        ratio
    };
}

export function calculateForeheadHeightRatio(landmarks: NormalizedLandmark[]): number {
    // Forehead height / Face height
    const hairline = landmarks[10];
    const glabella = landmarks[168];
    const chin = landmarks[152];

    const foreheadHeight = distance(hairline, glabella);
    const faceHeight = distance(landmarks[10], chin);

    return foreheadHeight / faceHeight;
}

export function calculateNoseWidthRatio(landmarks: NormalizedLandmark[]): number {
    // Nose width / Face width
    const noseWidth = distance(landmarks[48], landmarks[278]); // Nose alars
    const faceWidth = distance(landmarks[234], landmarks[454]); // Bizygomatic

    return noseWidth / faceWidth;
}

export function calculateCheekboneProminence(landmarks: NormalizedLandmark[]): number {
    // Measure lateral projection of cheekbones
    // Higher value = more prominent cheekbones

    const leftCheekbone = landmarks[454];
    const rightCheekbone = landmarks[234];
    const noseBridge = landmarks[168]; // Center reference

    // Using strictly XY spatial positioning to avoid Z-noise relative width
    const leftProminence = Math.abs(leftCheekbone.x - noseBridge.x);
    const rightProminence = Math.abs(rightCheekbone.x - noseBridge.x);

    const avgProminence = (leftProminence + rightProminence) / 2;

    // Normalize by face height for scale independence
    const faceHeight = distance(landmarks[10], landmarks[152]);

    if (faceHeight === 0) return 0;
    return avgProminence / faceHeight;
}

export function calculateHairlineRecession(landmarks: NormalizedLandmark[]): number {
    // Measure hairline position relative to face
    // Lower score = more recession/balding

    const hairline = landmarks[10];      // Top of forehead (hairline approximation)
    const glabella = landmarks[168];     // Between eyebrows
    const chin = landmarks[152];         // Chin

    const foreheadHeight = distance(hairline, glabella);
    const faceHeight = distance(hairline, chin);

    // Ideal forehead is ~30-35% of face height
    // Higher percentage indicates receding hairline
    const foreheadRatio = foreheadHeight / faceHeight;

    // Convert to 0-100 score (100 = full hairline, 0 = severe recession)
    // Normal: 0.30-0.35, Receding: >0.38, Severe: >0.45
    if (foreheadRatio <= 0.35) {
        return 100; // Perfect hairline
    } else if (foreheadRatio <= 0.38) {
        return 90 - ((foreheadRatio - 0.35) / 0.03) * 20; // 90-70
    } else if (foreheadRatio <= 0.45) {
        return 70 - ((foreheadRatio - 0.38) / 0.07) * 40; // 70-30
    } else {
        return Math.max(0, 30 - ((foreheadRatio - 0.45) * 100)); // <30
    }
}

// --- Scoring ---

export interface MetricScores {
    canthalTilt: number;
    fwfhRatio: number;
    midfaceRatio: number;
    eyeSeparationRatio: number;
    gonialAngle: number;
    chinToPhiltrumRatio: number;
    mouthToNoseWidthRatio: number;
    bigonialWidthRatio: number;
    lowerThirdRatio: number;
    palpebralFissureLength: number;
    eyeToMouthAngle: number;
    lipRatio: number;
    facialAsymmetry: number;
    ipdRatio: number;
    facialThirdsRatio: number;
    foreheadHeightRatio: number;
    noseWidthRatio: number;
    cheekboneProminence: number;
    hairlineRecession: number;
    // New 3D bone structure metrics (z-depth based)
    orbitalRimProtrusion: number;      // Deep-set vs bulging eyes
    maxillaryProtrusion: number;       // Forward vs retruded maxilla
    browRidgeProtrusion: number;       // Brow ridge prominence
    infraorbitalRimPosition: number;   // Under-eye support
    chinProjection: number;            // Chin forward projection

    // NEW: V2 Advanced Features
    doubleChinRisk: number;
    angleDeduction: number;
    facialTension: number;
    skinQuality: number;
}

export type ProfileType = 'front' | 'side';

export interface ScanResult {
    metrics: MetricScores;
    profileType: ProfileType;
}

export function calculateAggregatedMetrics(scans: ScanResult[]): MetricScores | null {
    if (!scans || scans.length === 0) return null;

    // Use the base structure to zero everything out
    const aggregated: any = {};
    const counters: any = {};

    // Initialize everything to zero
    const templateMetrics = scans[0].metrics;
    for (const key of Object.keys(templateMetrics)) {
        aggregated[key] = 0;
        counters[key] = 0;
    }

    const sideOnlyMetrics = ['chinProjection', 'maxillaryProtrusion', 'orbitalRimProtrusion', 'browRidgeProtrusion', 'infraorbitalRimPosition'];
    const frontOnlyMetrics = ['facialAsymmetry', 'ipdRatio', 'eyeSeparationRatio', 'canthalTilt', 'fwfhRatio', 'noseWidthRatio', 'mouthToNoseWidthRatio', 'bigonialWidthRatio', 'cheekboneProminence', 'skinQuality'];

    // Accumulate valid scans
    for (const scan of scans) {
        for (const [key, value] of Object.entries(scan.metrics)) {
            let isValid = true;

            // Validate context bounds based on profile type
            if (scan.profileType === 'front' && sideOnlyMetrics.includes(key)) {
                isValid = false;
            } else if (scan.profileType === 'side' && frontOnlyMetrics.includes(key)) {
                isValid = false;
            }

            if (isValid) {
                aggregated[key] += value as number;
                counters[key] += 1;
            }
        }
    }

    // Average them out
    for (const key of Object.keys(aggregated)) {
        if (counters[key] > 0) {
            aggregated[key] = aggregated[key] / counters[key];
        } else {
            // No valid scans for this metric (e.g. we only scanned side profile faces, so Asymmetry == 0)
            // Just drop in a neutral placeholder to satisfy typescript or the last scanned value
            aggregated[key] = (templateMetrics as any)[key];
        }
    }

    return aggregated as MetricScores;
}

export function calculatePSLScore(
    metrics: MetricScores,
    gender: 'male' | 'female' = 'male',
    profileType: ProfileType | 'composite' = 'composite',
    availableProfiles: Set<ProfileType> = new Set(['front', 'side'])
): { score: number; breakdown: string[]; tier: string } {
    let score = 4.0; // Base: 4.0 (MTN / Average according to strict 8.0 scale)
    const breakdown: string[] = ["Base: 4.0 (MTN - Average)"];

    const isF = gender === 'female';

    // ==========================================
    // UNIVERSAL METRICS (Apply to both profiles)
    // ==========================================

    // Midface Ratio (Ideal: Compact)
    const midfacePerf = isF ? [0.80, 1.05] : [0.95, 1.1];
    const midfaceGood = isF ? [0.75, 1.15] : [0.90, 1.15];
    if (metrics.midfaceRatio >= midfacePerf[0] && metrics.midfaceRatio <= midfacePerf[1]) {
        score += 0.8;
        breakdown.push("Perfect Compact Midface (+0.8)");
    } else if (metrics.midfaceRatio >= midfaceGood[0] && metrics.midfaceRatio <= midfaceGood[1]) {
        score += 0.4;
        breakdown.push("Good Midface Ratio (+0.4)");
    } else {
        score -= 0.6;
        breakdown.push("Long or Imbalanced Midface (-0.6)");
    }

    // Gonial Angle
    const gonialPerf = isF ? [105, 130] : [115, 130];
    const gonialGood = isF ? [100, 135] : [105, 135];
    if (metrics.gonialAngle >= gonialPerf[0] && metrics.gonialAngle <= gonialPerf[1]) {
        score += 0.8;
        breakdown.push("Perfect Jawline Angle (+0.8)");
    } else if (metrics.gonialAngle >= gonialGood[0] && metrics.gonialAngle <= gonialGood[1]) {
        score += 0.4;
        breakdown.push("Good Jawline (+0.4)");
    } else {
        score -= 0.6;
        breakdown.push("Steep/Soft Jawline Angle (-0.6)");
    }

    // Chin to Philtrum 
    const c2pPerf = isF ? [2.0, 2.25] : [2.0, 2.5];
    if (metrics.chinToPhiltrumRatio >= c2pPerf[0] && metrics.chinToPhiltrumRatio <= c2pPerf[1]) {
        score += 0.4;
        breakdown.push("Ideal Lower Face Proportions (+0.4)");
    } else if (metrics.chinToPhiltrumRatio < 1.5 || metrics.chinToPhiltrumRatio > 3.0) {
        score -= 0.3;
        breakdown.push("Unbalanced Lower Face (-0.3)");
    }

    // Lip Ratio
    const lipPerf = isF ? [1.60, 1.70] : [1.50, 1.70];
    if (metrics.lipRatio >= lipPerf[0] && metrics.lipRatio <= lipPerf[1]) {
        score += 0.4;
        breakdown.push("Ideal Lip Ratio (+0.4)");
    } else if (metrics.lipRatio >= 1.3 && metrics.lipRatio <= 2.0) {
        score += 0.2;
        breakdown.push("Good Lip Ratio (+0.2)");
    } else {
        score -= 0.1;
        breakdown.push("Suboptimal Lip Harmony (-0.1)");
    }


    // Lower / Full Face Ratio
    const lowerFacePerf = isF ? 0.58 : 0.62;
    if (metrics.lowerThirdRatio >= lowerFacePerf) {
        score += 0.4;
        breakdown.push("Strong Lower Face Proportion (+0.4)");
    } else if (metrics.lowerThirdRatio >= lowerFacePerf - 0.04) {
        score += 0.2;
        breakdown.push("Good Lower Face (+0.2)");
    } else {
        score -= 0.4;
        breakdown.push("Weak Lower Face Volume (-0.4)");
    }

    // Palpebral Fissure
    const fissurePerf = isF ? 2.8 : 3.0;
    if (metrics.palpebralFissureLength >= fissurePerf) {
        score += 0.8;
        breakdown.push("Elite Horizontal Eye Length (+0.8)");
    } else if (metrics.palpebralFissureLength > fissurePerf - 0.3) {
        score += 0.5;
        breakdown.push("Good Horizontal Eye Length (+0.5)");
    } else {
        score -= 0.4;
        breakdown.push("Short Eye Fissure (-0.4)");
    }

    // Facial Thirds Ratio (Ideal: 95-100)
    if (metrics.facialThirdsRatio >= 95) {
        score += 0.4;
        breakdown.push("Perfect Facial Thirds (+0.4)");
    } else if (metrics.facialThirdsRatio < 75) {
        score -= 0.3;
        breakdown.push("Unbalanced Thirds (-0.3)");
    }

    // Forehead Height Ratio (Ideal: 0.30-0.35)
    if (metrics.foreheadHeightRatio >= 0.30 && metrics.foreheadHeightRatio <= 0.35) {
        score += 0.2;
        breakdown.push("Ideal Forehead (+0.2)");
    } else if (metrics.foreheadHeightRatio > 0.38) {
        score -= 0.3;
        breakdown.push("Fivehead (-0.3)");
    }

    // Hairline Recession (Ideal: 90-100)
    if (metrics.hairlineRecession >= 95) {
        score += 0.3;
        breakdown.push("Full Hairline (+0.3)");
    } else if (metrics.hairlineRecession >= 85) {
        score += 0.1;
        breakdown.push("Good Hairline (+0.1)");
    } else if (metrics.hairlineRecession < 70) {
        score -= 0.4;
        breakdown.push("Receding Hairline (-0.4)");
    } else if (metrics.hairlineRecession < 50) {
        score -= 0.7;
        breakdown.push("Significant Hair Loss (-0.7)");
    }

    // ==========================================
    // FRONT-ONLY METRICS
    // ==========================================
    if (profileType === 'front' || profileType === 'composite') {
        // Canthal Tilt
        const tiltPerf = isF ? [5, 8] : [4, 6];
        const tiltGood = isF ? 2 : 2;
        if (metrics.canthalTilt >= tiltPerf[0] && metrics.canthalTilt <= tiltPerf[1]) {
            score += 0.8;
            breakdown.push("Excellent Canthal Tilt (+0.8)");
        } else if (metrics.canthalTilt > tiltGood) {
            score += 0.5;
            breakdown.push("Positive Canthal Tilt (+0.5)");
        } else if (metrics.canthalTilt < 0) {
            score -= 0.6;
            breakdown.push("Negative Canthal Tilt (-0.6)");
        }

        // FW/FH Ratio
        const fwfhPerf = isF ? 1.55 : 1.8;
        if (metrics.fwfhRatio >= fwfhPerf) {
            score += 0.8;
            breakdown.push("Ideal Facial Width (+0.8)");
        } else if (metrics.fwfhRatio >= fwfhPerf - 0.1) {
            score += 0.4;
            breakdown.push("Good Facial Structure (+0.4)");
        } else if (metrics.fwfhRatio < fwfhPerf - 0.15) {
            score -= 0.6;
            breakdown.push("Narrow Face (-0.6)");
        }

        // Mouth to Nose Width 
        const mtnPerf = isF ? 1.45 : 1.5;
        if (metrics.mouthToNoseWidthRatio >= mtnPerf) {
            score += 0.4;
            breakdown.push("Ideal Mouth Width (+0.4)");
        } else if (metrics.mouthToNoseWidthRatio < mtnPerf - 0.2) {
            score -= 0.3;
            breakdown.push("Narrow Mouth (-0.3)");
        }

        // Eye Separation / ESR (Ideal: 0.45-0.47)
        if (metrics.eyeSeparationRatio >= 0.45 && metrics.eyeSeparationRatio <= 0.47) {
            score += 0.3;
            breakdown.push("Ideal Eye Spacing (+0.3)");
        } else if (metrics.eyeSeparationRatio < 0.42 || metrics.eyeSeparationRatio > 0.50) {
            score -= 0.3;
            breakdown.push("Suboptimal Eye Spacing (-0.3)");
        }

        // Eye to Mouth Angle (Ideal: 47-50 degrees)
        if (metrics.eyeToMouthAngle >= 47 && metrics.eyeToMouthAngle <= 50) {
            score += 0.3;
            breakdown.push("Ideal Eye-Mouth-Eye Angle (+0.3)");
        } else if (metrics.eyeToMouthAngle < 45 || metrics.eyeToMouthAngle > 53) {
            score -= 0.3;
            breakdown.push("Suboptimal Eye-Mouth-Eye Angle (-0.3)");
        }

        // Bigonial Width
        const bigonialPerf = isF ? [1.15, 1.30] : [1.3, 1.4];
        if (metrics.bigonialWidthRatio >= bigonialPerf[0] && metrics.bigonialWidthRatio <= bigonialPerf[1]) {
            score += 0.4;
            breakdown.push("Ideal Jaw Width (+0.4)");
        } else if (metrics.bigonialWidthRatio < bigonialPerf[0] - 0.15) {
            score -= 0.3;
            breakdown.push("Narrow Jaw (-0.3)");
        }

        // Facial Asymmetry (Ideal: 95-100)
        if (metrics.facialAsymmetry >= 95) {
            score += 0.5;
            breakdown.push("Perfect Symmetry (+0.5)");
        } else if (metrics.facialAsymmetry >= 90) {
            score += 0.3;
            breakdown.push("Very Symmetric (+0.3)");
        } else if (metrics.facialAsymmetry < 80) {
            score -= 0.5;
            breakdown.push("Facial Asymmetry (-0.5)");
        }

        // IPD Ratio (Ideal: 0.45-0.47)
        if (metrics.ipdRatio >= 0.45 && metrics.ipdRatio <= 0.47) {
            score += 0.3;
            breakdown.push("Ideal Interpupillary Distance (+0.3)");
        } else if (metrics.ipdRatio < 0.40 || metrics.ipdRatio > 0.50) {
            score -= 0.2;
            breakdown.push("Suboptimal Interpupillary Distance (-0.2)");
        }

        // Nose Width Ratio
        const nwPerf = isF ? [0.22, 0.28] : [0.25, 0.30];
        if (metrics.noseWidthRatio >= nwPerf[0] && metrics.noseWidthRatio <= nwPerf[1]) {
            score += 0.3;
            breakdown.push("Ideal Nose Width (+0.3)");
        } else if (metrics.noseWidthRatio > nwPerf[1] + 0.05) {
            score -= 0.3;
            breakdown.push("Wide Nose (-0.3)");
        }

        // Cheekbone Prominence
        const cheekPerf = isF ? [0.45, 0.52] : [0.48, 0.55];
        if (metrics.cheekboneProminence >= cheekPerf[0] && metrics.cheekboneProminence <= cheekPerf[1]) {
            score += 0.4;
            breakdown.push("Prominent Cheekbones (+0.4)");
        } else if (metrics.cheekboneProminence < cheekPerf[0] - 0.03) {
            score -= 0.2;
            breakdown.push("Flat Cheekbones (-0.2)");
        }
    }

    // ==========================================
    // SIDE-ONLY METRICS (3D Depth)
    // ==========================================
    if (profileType === 'side' || profileType === 'composite') {
        // Orbital Rim Protrusion
        const orbPerf = isF ? 0.005 : 0.015;
        if (metrics.orbitalRimProtrusion > orbPerf) {
            score += 0.8;
            breakdown.push("Elite Orbital Depth (+0.8)");
        } else if (metrics.orbitalRimProtrusion > orbPerf - 0.01) {
            score += 0.4;
            breakdown.push("Good Orbital Depth (+0.4)");
        } else if (metrics.orbitalRimProtrusion < -0.005) {
            score -= 0.6;
            breakdown.push("Deeply Recessed / Bulging Eyes (-0.6)");
        }

        // Maxillary Protrusion
        if (metrics.maxillaryProtrusion > 0.02) {
            score += 0.8;
            breakdown.push("Excellent Forward Maxilla Base (+0.8)");
        } else if (metrics.maxillaryProtrusion > 0.01) {
            score += 0.4;
            breakdown.push("Good Maxillary Development (+0.4)");
        } else if (metrics.maxillaryProtrusion < -0.005) {
            score -= 0.7;
            breakdown.push("Retruded Maxilla / Flat Midface (-0.7)");
        }

        // Brow Ridge Protrusion (DIMORPHIC FLIP)
        if (isF) {
            if (metrics.browRidgeProtrusion < 0.01) {
                score += 0.6;
                breakdown.push("Smooth Feminine Brow (+0.6)");
            } else if (metrics.browRidgeProtrusion > 0.02) {
                score -= 0.4;
                breakdown.push("Masculine/Heavy Brow Ridge (-0.4)");
            }
        } else {
            if (metrics.browRidgeProtrusion > 0.015) {
                score += 0.8;
                breakdown.push("Prominent masculine Brow Ridge (+0.8)");
            } else if (metrics.browRidgeProtrusion > 0.005) {
                score += 0.4;
                breakdown.push("Good Brow Ridge (+0.4)");
            } else if (metrics.browRidgeProtrusion < 0) {
                score -= 0.4;
                breakdown.push("Flat Brow / Lacking Dimorphism (-0.4)");
            }
        }

        // Infraorbital Rim Position
        if (metrics.infraorbitalRimPosition > 0.01) {
            score += 0.8;
            breakdown.push("Excellent Under-eye Support (+0.8)");
        } else if (metrics.infraorbitalRimPosition > 0) {
            score += 0.4;
            breakdown.push("Good Under-eye Support (+0.4)");
        } else if (metrics.infraorbitalRimPosition < -0.01) {
            score -= 0.5;
            breakdown.push("Recessed Infraorbital Rim / Prone to under-eye circles (-0.5)");
        }

        // Chin Projection
        const chinProjPerf = isF ? 0.015 : 0.025;
        if (metrics.chinProjection > chinProjPerf) {
            score += 0.8;
            breakdown.push("Elite Chin Projection (+0.8)");
        } else if (metrics.chinProjection > chinProjPerf - 0.015) {
            score += 0.4;
            breakdown.push("Good Chin Projection (+0.4)");
        } else if (metrics.chinProjection < 0) {
            score -= 0.6;
            breakdown.push("Recessed Chin / Weak Genioplasty Target (-0.6)");
        }
    }

    // ==========================================
    // V2 ADVANCED METRICS
    // ==========================================

    if ((profileType === 'side' || profileType === 'composite') && metrics.doubleChinRisk !== undefined) {
        if (metrics.doubleChinRisk > 0.02) {
            score += 0.4;
            breakdown.push("Excellent Jawline Definition (+0.4)");
        } else if (metrics.doubleChinRisk < 0.005) {
            score -= 0.6;
            breakdown.push("Submental Fullness / Double Chin (-0.6)");
        }
    }

    if (metrics.skinQuality !== undefined) {
        if (metrics.skinQuality >= 85) {
            score += 0.3;
            breakdown.push("Exceptional Clear/Glass Skin (+0.3)");
        } else if (metrics.skinQuality < 50) {
            score -= 0.5;
            breakdown.push("Textured/Acne Skin (-0.5)");
        }
    }

    if (metrics.facialTension !== undefined && metrics.facialTension > 1.2) {
        score -= 0.3;
        breakdown.push("High Facial Tension (Squinting/Smiling) (-0.3)");
    }

    if (metrics.angleDeduction > 0) {
        breakdown.push("High Distortion Adjusted (Math Fixed)");
    }

    // Apply scalars to normalize to 0-8 range based on max potential points
    const rawDiff = score - 4.0;
    if (profileType === 'composite') {
        const COMPOSITE_SCALAR = 3.6; // Extrapolates max raw deviation back to 8.0 max scale
        score = 4.0 + (rawDiff / COMPOSITE_SCALAR);
    } else {
        const FRONT_SCALAR = 2.4; // Extrapolates front-only raw deviation back to 8.0 max scale
        score = 4.0 + (rawDiff / FRONT_SCALAR);
    }

    // Cap score to authentic 0-8 scale
    score = Math.min(8.0, Math.max(0.0, score));

    // Determine tier based on strict PSL Scale Distribution guide
    let tier = "";
    if (score >= 7.99) {
        tier = "8 PSL  Perfection (Theoretical)";
    } else if (score >= 7.0) {
        tier = "7 PSL  PSL God-Tier (Supermodels and Elite Actors)";
    } else if (score >= 6.0) {
        tier = "6 PSL  Chad / Stacy";
    } else if (score >= 5.0) {
        tier = "5 PSL  Above Average (High-Tier Normie / Chadlite)";
    } else if (score >= 4.0) {
        tier = "4 PSL  Average (Mid-Tier Normie)";
    } else if (score >= 3.0) {
        tier = "3 PSL  Below Average (Low-Tier Normie)";
    } else if (score >= 2.0) {
        tier = "2 PSL  \"Truecel\"  Very Low Attractiveness";
    } else if (score >= 1.0) {
        tier = "1 PSL  Extremely Low Attractiveness";
    } else {
        tier = "0 PSL  Severe Deformities (Subhuman)";
    }

    return {
        score,
        breakdown,
        tier
    };
}
