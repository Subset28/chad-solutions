import { NormalizedLandmark } from "@mediapipe/tasks-vision";

// Euclidian distance between two points (2D)
export function distance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Calculate angle in degrees between two points relative to horizontal
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

// Canthal Tilt: Angle between inner and outer eye corners
export function calculateCanthalTilt(landmarks: NormalizedLandmark[]): number {
    const leftInner = landmarks[362];
    const leftOuter = landmarks[263];
    const rightInner = landmarks[133];
    const rightOuter = landmarks[33];

    const leftTilt = calculateAngle(leftInner, leftOuter);
    const rightTilt = calculateAngle(rightInner, rightOuter);

    // Average the two eyes
    return (leftTilt + rightTilt) / 2;
}

export function calculateFwFhRatio(landmarks: NormalizedLandmark[]): number {
    // LH: 234 (Right Zygoma) -> 454 (Left Zygoma)
    const width = distance(landmarks[234], landmarks[454]);
    // Height: 10 (Top) -> 152 (Chin)
    const height = distance(landmarks[10], landmarks[152]);

    return width / height;
}

export function calculateMidfaceRatio(landmarks: NormalizedLandmark[]): number {
    // Compact Midface is often considered better.
    // Ratio = Midface Height / Face Width

    const leftEyeCenter = landmarks[159];  // Left eye center
    const rightEyeCenter = landmarks[386]; // Right eye center
    const midEyeCenter = midpoint(leftEyeCenter, rightEyeCenter);
    const upperLipBot = landmarks[13];

    const midfaceHeight = distance(midEyeCenter, upperLipBot);
    const width = distance(landmarks[234], landmarks[454]);

    return midfaceHeight / width;
}

export function calculateEyeSeparationRatio(landmarks: NormalizedLandmark[]): number {
    // ES Ratio = Inner Distance / Outer Distance
    const innerDist = distance(landmarks[133], landmarks[362]);
    const outerDist = distance(landmarks[33], landmarks[263]);
    return innerDist / outerDist;
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
    // Chin Tip: 152, Lower Lip Bottom: 17, Upper Lip Top: 0, Nose Bottom: 2
    // Dist(Chin, LowerLip) / Dist(UpperLip, Nose)

    // Using landmarks from analysis.js logic approximation:
    // Chin Tip: 152
    // Lower Lip Outer: 17 (or 0 for center) - let's use midline: 17 is generally lower lip bottom.
    // Upper Lip Outer: 13 (upper lip bottom/center) or 0 (upper lip top).
    // Nose Bottom: 2

    const chinToLip = distance(landmarks[152], landmarks[17]);
    const philtrum = distance(landmarks[0], landmarks[2]);

    return chinToLip / philtrum;
}

export function calculateMouthToNoseWidthRatio(landmarks: NormalizedLandmark[]): number {
    // Mouth Width: 61 (Left Corner) <-> 291 (Right Corner)
    const mouthWidth = distance(landmarks[61], landmarks[291]);

    // Nose Width: 48 (Left Alar) <-> 278 (Right Alar) - approximations for nose wings
    const noseWidth = distance(landmarks[48], landmarks[278]);

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

export function calculateLowerThirdRatio(landmarks: NormalizedLandmark[]): number {
    // Lower Third Height / Middle Third Height
    // Lower Third: Subnasion (2) to Menton (152)
    // Middle Third: Glabella (168) to Subnasion (2)

    const lowerHeight = distance(landmarks[2], landmarks[152]);
    const middleHeight = distance(landmarks[168], landmarks[2]);

    return lowerHeight / middleHeight;
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
    // Angle from Eye Outer Corner to Mouth Outer Corner (Ramus/Lateral face vector)
    // Left Side: 263 (Eye Outer) -> 291 (Mouth Corner)
    // Right Side: 33 (Eye Outer) -> 61 (Mouth Corner)

    const leftAngle = Math.abs(calculateAngle(landmarks[263], landmarks[291]));
    const rightAngle = Math.abs(calculateAngle(landmarks[33], landmarks[61]));

    // The angle returned by calculateAngle is relative to horizontal.
    // Vertical is 90. If the face is vertical, the angle should be around 60-70?
    // User example: 56 degrees. 

    return (leftAngle + rightAngle) / 2;
}

export function calculateFacialAsymmetry(landmarks: NormalizedLandmark[]): number {
    // Calculate asymmetry by comparing left and right side distances
    // Lower score = more asymmetric, Higher score = more symmetric

    // Compare key bilateral landmarks
    const pairs = [
        [33, 263],     // Eye outer corners
        [133, 362],    // Eye inner corners
        [61, 291],     // Mouth corners
        [234, 454],    // Cheekbones (zygoma)
        [58, 288],     // Jaw (gonions)
    ];

    const centerX = landmarks[1].x; // Nose tip as center reference
    let asymmetryScore = 0;

    pairs.forEach(([leftIdx, rightIdx]) => {
        const leftDist = Math.abs(landmarks[leftIdx].x - centerX);
        const rightDist = Math.abs(landmarks[rightIdx].x - centerX);
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
    const leftEyeCenter = landmarks[159];  // Left eye center
    const rightEyeCenter = landmarks[386]; // Right eye center
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
    const subnasion = landmarks[2];      // Nose base
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
    const ratio = Math.max(0, 100 - (deviation * 100));

    return {
        upper: upperThird / total,
        middle: middleThird / total,
        lower: lowerThird / total,
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

    const leftCheekbone = landmarks[234];
    const rightCheekbone = landmarks[454];
    const noseBridge = landmarks[168]; // Center reference

    const leftProminence = Math.abs(leftCheekbone.x - noseBridge.x);
    const rightProminence = Math.abs(rightCheekbone.x - noseBridge.x);

    const avgProminence = (leftProminence + rightProminence) / 2;

    // Normalize by face height for scale independence
    const faceHeight = distance(landmarks[10], landmarks[152]);

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
}

export function calculatePSLScore(metrics: MetricScores): { score: number; breakdown: string[]; tier: string } {
    let score = 2.5; // Base: BELOW AVERAGE (authentic blackpill - everyone must earn their score)
    const breakdown: string[] = ["Base: 2.5 (LTN - you must earn your way up)"];

    // Canthal Tilt (Ideal: Positive, ~2-8 degrees)
    if (metrics.canthalTilt > 4) {
        score += 0.8;
        breakdown.push("Excellent Canthal Tilt (+0.8)");
    } else if (metrics.canthalTilt > 2) {
        score += 0.5;
        breakdown.push("Positive Canthal Tilt (+0.5)");
    } else if (metrics.canthalTilt < -2) {
        score -= 0.6;
        breakdown.push("Negative Canthal Tilt (-0.6)");
    }

    // FW/FH Ratio (Ideal: 1.8 - 2.0 for men)
    if (metrics.fwfhRatio >= 1.85) {
        score += 0.7;
        breakdown.push("Ideal Facial Width (+0.7)");
    } else if (metrics.fwfhRatio >= 1.75) {
        score += 0.4;
        breakdown.push("Good Facial Structure (+0.4)");
    } else if (metrics.fwfhRatio < 1.6) {
        score -= 0.5;
        breakdown.push("Narrow Face (-0.5)");
    }

    // Midface Ratio (Ideal: Compact, ~0.9 - 1.0)
    if (metrics.midfaceRatio <= 0.95) {
        score += 0.7;
        breakdown.push("Exceptionally Compact Midface (+0.7)");
    } else if (metrics.midfaceRatio <= 1.0) {
        score += 0.4;
        breakdown.push("Compact Midface (+0.4)");
    } else if (metrics.midfaceRatio > 1.08) {
        score -= 0.6;
        breakdown.push("Long Midface (-0.6)");
    }

    // Gonial Angle (Ideal: 110-130 degrees)
    if (metrics.gonialAngle >= 115 && metrics.gonialAngle <= 125) {
        score += 0.8;
        breakdown.push("Perfect Jawline Angle (+0.8)");
    } else if (metrics.gonialAngle >= 110 && metrics.gonialAngle <= 135) {
        score += 0.5;
        breakdown.push("Good Jawline (+0.5)");
    } else if (metrics.gonialAngle > 140) {
        score -= 0.6;
        breakdown.push("Weak Jawline (-0.6)");
    }

    // Chin to Philtrum (Ideal: ~2.0 - 2.5)
    if (metrics.chinToPhiltrumRatio >= 2.0 && metrics.chinToPhiltrumRatio <= 2.5) {
        score += 0.4;
        breakdown.push("Ideal Lower Face Proportions (+0.4)");
    } else if (metrics.chinToPhiltrumRatio < 1.5 || metrics.chinToPhiltrumRatio > 3.0) {
        score -= 0.3;
        breakdown.push("Unbalanced Lower Face (-0.3)");
    }

    // Mouth to Nose Width (Ideal: > 1.4 for masculine look)
    if (metrics.mouthToNoseWidthRatio >= 1.5) {
        score += 0.4;
        breakdown.push("Ideal Mouth Width (+0.4)");
    } else if (metrics.mouthToNoseWidthRatio < 1.3) {
        score -= 0.3;
        breakdown.push("Narrow Mouth (-0.3)");
    }

    // Lower Third Ratio (Ideal: ~1.0)
    if (metrics.lowerThirdRatio >= 0.95 && metrics.lowerThirdRatio <= 1.05) {
        score += 0.4;
        breakdown.push("Perfect Facial Thirds (+0.4)");
    } else if (metrics.lowerThirdRatio < 0.8) {
        score -= 0.5;
        breakdown.push("Weak Lower Third (-0.5)");
    }

    // Palpebral Fissure / Hunter Eyes (Ideal: > 3.0)
    if (metrics.palpebralFissureLength > 3.5) {
        score += 0.8;
        breakdown.push("Elite Hunter Eyes (+0.8)");
    } else if (metrics.palpebralFissureLength > 3.0) {
        score += 0.5;
        breakdown.push("Hunter Eyes (+0.5)");
    } else if (metrics.palpebralFissureLength < 2.5) {
        score -= 0.4;
        breakdown.push("Prey Eyes (-0.4)");
    }

    // Eye Separation (Ideal: 0.45-0.49)
    if (metrics.eyeSeparationRatio >= 0.45 && metrics.eyeSeparationRatio <= 0.49) {
        score += 0.3;
        breakdown.push("Ideal Eye Spacing (+0.3)");
    } else if (metrics.eyeSeparationRatio < 0.42 || metrics.eyeSeparationRatio > 0.52) {
        score -= 0.3;
        breakdown.push("Suboptimal Eye Spacing (-0.3)");
    }

    // Bigonial Width (Ideal: 1.1-1.15)
    if (metrics.bigonialWidthRatio >= 1.1 && metrics.bigonialWidthRatio <= 1.15) {
        score += 0.3;
        breakdown.push("Ideal Jaw Width (+0.3)");
    } else if (metrics.bigonialWidthRatio > 1.25) {
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

    // IPD Ratio (Ideal: 0.42-0.47)
    if (metrics.ipdRatio >= 0.42 && metrics.ipdRatio <= 0.47) {
        score += 0.3;
        breakdown.push("Ideal Eye Spacing (+0.3)");
    } else if (metrics.ipdRatio < 0.40 || metrics.ipdRatio > 0.50) {
        score -= 0.2;
        breakdown.push("Suboptimal Eye Spacing (-0.2)");
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

    // Nose Width Ratio (Ideal: 0.25-0.30)
    if (metrics.noseWidthRatio >= 0.25 && metrics.noseWidthRatio <= 0.30) {
        score += 0.3;
        breakdown.push("Ideal Nose Width (+0.3)");
    } else if (metrics.noseWidthRatio > 0.35) {
        score -= 0.3;
        breakdown.push("Wide Nose (-0.3)");
    }

    // Cheekbone Prominence (Ideal: 0.48-0.55)
    if (metrics.cheekboneProminence >= 0.48 && metrics.cheekboneProminence <= 0.55) {
        score += 0.4;
        breakdown.push("Prominent Cheekbones (+0.4)");
    } else if (metrics.cheekboneProminence < 0.45) {
        score -= 0.2;
        breakdown.push("Flat Cheekbones (-0.2)");
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

    // Cap score to 0-8 range
    score = Math.min(8.0, Math.max(0.0, score));

    // Determine tier based on score (PSL Scale: 0-8, where 4 = average)
    let tier = "";
    if (score >= 7.5) {
        tier = "PSL God (0.001%) - Peak Human Aesthetics";
    } else if (score >= 7.0) {
        tier = "PSL God-Tier (0.001%) - Elite Supermodel";
    } else if (score >= 6.5) {
        tier = "Gigachad (Top 0.1%)";
    } else if (score >= 6.0) {
        tier = "True Chad (Top 0.1%) - Model-Tier";
    } else if (score >= 5.5) {
        tier = "Chadlite (Top 1-5%)";
    } else if (score >= 5.0) {
        tier = "High-Tier Normie (HTN) - Top 5%";
    } else if (score >= 4.5) {
        tier = "Upper-Mid Normie";
    } else if (score >= 4.0) {
        tier = "Mid-Tier Normie (MTN) - Average";
    } else if (score >= 3.0) {
        tier = "Low-Tier Normie (LTN) - Below Avg";
    } else if (score >= 2.0) {
        tier = "Truecel Range (Bottom 10%)";
    } else if (score >= 1.0) {
        tier = "Extremely Low (Bottom 0.5%)";
    } else {
        tier = "Severe Deformities (<0.01%)";
    }

    return {
        score,
        breakdown,
        tier
    };
}
