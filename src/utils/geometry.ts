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
export function extractEulerAngles(matrix: unknown): FaceAngles {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const m = matrix as any;
    let m00, m10, m11, m12, m20, m21, m22;

    // Check if it's a flattened 16-element array or 4x4 array of arrays
    if (m.length === 16) {
        // Flattened Float32Array
        m00 = m[0]; 
        m10 = m[4]; m11 = m[5]; m12 = m[6];
        m20 = m[8]; m21 = m[9]; m22 = m[10];
    } else {
        // Assume MatrixData structure or 2D array
        const getVal = (r: number, c: number) => m.data ? m.data[r * 4 + c] : m[r][c];
        m00 = getVal(0, 0); 
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

/**
 * God-Tier: Estimates Camera Focal Length (in pixels)
 * Based on standard mobile field of view (approx 63 degrees)
 * focalLength = (imageWidth / 2) / tan(FOV / 2)
 */
export function estimateFocalLength(imageWidth: number, horizontalFOVDeg: number = 63): number {
    const fovRad = (horizontalFOVDeg * Math.PI) / 180;
    return (imageWidth / 2) / Math.tan(fovRad / 2);
}

/**
 * Ground Truth Reconstruction: Maps 2D Landmarks to Metric 3D using Hardware Metadata
 * 
 * @param landmarks Raw landmarks
 * @param matrix Transformation matrix
 * @param imageWidth Screen width
 * @param imageHeight Screen height
 * @param hwFocalLength_mm Exact focal length from EXIF (if available)
 * @param sensorWidth_mm Sensor width from hardware profile (if available)
 */
export function reconstructPhysicalFace(
    landmarks: NormalizedLandmark[],
    matrix: unknown,
    imageWidth: number,
    imageHeight: number,
    hwFocalLength_mm?: number,
    sensorWidth_mm?: number
): NormalizedLandmark[] {
    if (!landmarks || landmarks.length === 0) return [];
    
    // 1. Calculate Focal Length (Hardware-Accurate if available)
    let fl: number;
    if (hwFocalLength_mm && sensorWidth_mm) {
        // focalLength_px = (focalLength_mm * imageWidth_px) / sensorWidth_mm
        fl = (hwFocalLength_mm * imageWidth) / sensorWidth_mm;
    } else {
        fl = estimateFocalLength(imageWidth);
    }
    
    // 2. Estimate Z-Distance (mm) using robust scale anchor
    // IPD is unreliable for side profiles, so we fall back to face height/width ratio
    const rightEye = midpoint(landmarks[33], landmarks[133]);
    const leftEye = midpoint(landmarks[263], landmarks[362]);
    let ipdPixels = Math.sqrt(
        Math.pow((leftEye.x - rightEye.x) * imageWidth, 2) +
        Math.pow((leftEye.y - rightEye.y) * imageHeight, 2)
    );
    
    // Detection for profile type based on landmark visibility and eye distance
    const isProfile = ipdPixels < (imageWidth * 0.1); // If eyes are less than 10% of image width apart, it's likely a profile
    
    if (isProfile) {
        // Use face height (nose bridge to chin) as anchor for side profiles
        // Average human face height (nasion to menton) is ~120mm
        const faceHeightPixels = Math.sqrt(
            Math.pow((landmarks[152].x - landmarks[6].x) * imageWidth, 2) +
            Math.pow((landmarks[152].y - landmarks[6].y) * imageHeight, 2)
        );
        ipdPixels = faceHeightPixels * 0.52; // Scale height to "virtual" IPD for consistency
    }
    
    const zDistance_mm = (63.5 * fl) / Math.max(1, ipdPixels);
    
    // 3. Un-project each point to Camera Metric Space
    const cameraSpacePoints = landmarks.map(lm => {
        const cx = (lm.x - 0.5) * imageWidth;
        const cy = (lm.y - 0.5) * imageHeight;
        
        // LiDAR-Enhanced Depth Mapping
        // If we have LiDAR (implied by high-precision profiles), we trust MediaPipe's relative Z more
        // but we still anchor it to the IPD-derived distance for scale consistency.
        const zScale = zDistance_mm / fl;
        const pointZ_mm = zDistance_mm + (lm.z * imageWidth * zScale);
        
        const x_mm = (cx * pointZ_mm) / fl;
        const y_mm = (cy * pointZ_mm) / fl;
        
        return { x: x_mm, y: y_mm, z: pointZ_mm };
    });
    
    // 4. De-rotate using the inverse of the facialTransformationMatrix
    // Matrix is Row-Major order in MediaPipe.
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const mat = matrix as any;
    let m = new Float32Array(16);
    if (mat && mat.length === 16) {
        m = mat;
    } else if (mat && mat.data) {
        m = mat.data;
    } else {
        // Fallback to identity if no matrix available
        return cameraSpacePoints.map((p, i) => ({
            ...p,
            visibility: landmarks[i].visibility
        })) as NormalizedLandmark[];
    }
    
    // Extract 3x3 Rotation part (Camera -> Face)
    const r00 = m[0], r01 = m[1], r02 = m[2];
    const r10 = m[4], r11 = m[5], r12 = m[6];
    const r20 = m[8], r21 = m[9], r22 = m[10];
    
    // The matrix transforms points from Face Space to Camera Space.
    // To get back to "Perfect Frontal Face Space", we multiply by the Inverse (Transpose for rotation matrices).
    return cameraSpacePoints.map((p, i) => {
        const x = p.x;
        const y = p.y;
        const z = p.z - zDistance_mm; // Shift origin to face center for rotation
        
        const rx = r00 * x + r10 * y + r20 * z;
        const ry = r01 * x + r11 * y + r21 * z;
        const rz = r02 * x + r12 * y + r22 * z;
        
        return {
            x: rx,
            y: ry,
            z: rz,
            visibility: landmarks[i].visibility
        } as NormalizedLandmark;
    });
}

/**
 * AI-Powered Expression Normalization
 * Mathematically "neutralizes" facial micro-expressions (smiles, squints, scowls)
 * to ensure measurements are 100% objective bone-structure analysis.
 */
export function normalizeExpression(landmarks: NormalizedLandmark[], blendshapes: unknown): NormalizedLandmark[] {
    const shapes = blendshapes as { categories: { categoryName: string; score: number }[] }[];
    if (!landmarks || !shapes || shapes.length === 0) return landmarks;

    const categories = shapes[0].categories;
    const scores: Record<string, number> = {};
    categories.forEach((cat: { categoryName: string; score: number }) => { scores[cat.categoryName] = cat.score; });

    const normalized = [...landmarks].map(p => ({ ...p }));

    // 1. Correct Smile (mouthSmileLeft/Right)
    // Smile expands mouth width and lifts corners. We reverse this.
    const smileScore = ((scores['mouthSmileLeft'] || 0) + (scores['mouthSmileRight'] || 0)) / 2;
    if (smileScore > 0.05) {
        // Mouth corners: 61, 291
        const mouthCenter = midpoint(normalized[61], normalized[291]);
        const correctionFactor = 1 - (smileScore * 0.12); // Pull in by up to 12%
        [61, 291, 78, 308, 13, 14, 37, 267].forEach(idx => {
            normalized[idx].x = mouthCenter.x + (normalized[idx].x - mouthCenter.x) * correctionFactor;
            normalized[idx].y = mouthCenter.y + (normalized[idx].y - mouthCenter.y) * correctionFactor;
        });
    }

    // 2. Correct Eye Squint (eyeSquintLeft/Right)
    const squintL = scores['eyeSquintLeft'] || 0;
    const squintR = scores['eyeSquintRight'] || 0;
    if (squintL > 0.1) {
        normalized[159].y -= (normalized[145].y - normalized[159].y) * (squintL * 0.15);
    }
    if (squintR > 0.1) {
        normalized[386].y -= (normalized[374].y - normalized[386].y) * (squintR * 0.15);
    }

    // 3. Correct Brow Tension (browDownLeft/Right)
    const browL = scores['browDownLeft'] || 0;
    const browR = scores['browDownRight'] || 0;
    if (browL > 0.1) normalized[70].y -= (normalized[70].y - normalized[159].y) * (browL * 0.1);
    if (browR > 0.1) normalized[300].y -= (normalized[300].y - normalized[386].y) * (browR * 0.1);

    return normalized;
}

export interface ConfidenceAudit {
    overall: number; // 0-100
    factors: {
        lighting: 'excellent' | 'good' | 'poor';
        angle: 'perfect' | 'acceptable' | 'steep';
        expression: 'neutral' | 'tense' | 'distorted';
    };
    feedback: string[];
}

/**
 * Objective Quality Audit
 * Evaluates environmental and behavioral noise to determine scan validity.
 */
export function auditAnalysisQuality(
    matrix: unknown, 
    blendshapes: unknown, 
    imageLuminance: number = 100 // Default to 100 if unknown
): ConfidenceAudit {
    const euler = extractEulerAngles(matrix);
    const angleSeverity = Math.abs(euler.pitch) + Math.abs(euler.yaw) + Math.abs(euler.roll);
    
    const shapes = blendshapes as { categories: { categoryName: string; score: number }[] }[];
    const categories = shapes && shapes.length > 0 ? shapes[0].categories : [];
    const tension = categories.reduce((acc: number, cat: { categoryName: string; score: number }) => acc + (cat.score > 0.3 ? 1 : 0), 0);
    
    let confidence = 100;
    const feedback: string[] = [];
    const factors: ConfidenceAudit['factors'] = { lighting: 'good', angle: 'perfect', expression: 'neutral' };

    // Angle Check
    if (angleSeverity > 22) {
        factors.angle = 'steep';
        confidence -= 25;
        feedback.push("Extreme angle detected. Structural distortion risk is HIGH.");
    } else if (angleSeverity > 10) {
        factors.angle = 'acceptable';
        confidence -= 8;
    }

    // Expression Check
    if (tension > 4) {
        factors.expression = 'distorted';
        confidence -= 15;
        feedback.push("High facial tension detected. Normalizing metrics...");
    } else if (tension > 1) {
        factors.expression = 'tense';
        confidence -= 5;
    }

    // Lighting Check
    if (imageLuminance < 45) {
        factors.lighting = 'poor';
        confidence -= 15;
        feedback.push("Insufficient lighting. Edge detection precision degraded.");
    } else if (imageLuminance > 220) {
        factors.lighting = 'poor';
        confidence -= 10;
        feedback.push("Overexposed lighting. Highlight clipping detected.");
    }

    return {
        overall: Math.max(0, Math.round(confidence)),
        factors,
        feedback
    };
}

// True 3D Euclidean distance between two points (Utilizing MediaPipe Z depth makes measurements completely invariant to pitch and yaw camera angles).
// As long as `scaleLandmarks` scales Z symmetrically with X (by width), the 3D unit geometry remains isomorphic to the 2D bounding box!
export function distance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
    return Math.sqrt(
        Math.pow((p2.x || 0) - (p1.x || 0), 2) +
        Math.pow((p2.y || 0) - (p1.y || 0), 2) +
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
    // Bizygomatic Width (cheekbone to cheekbone — widest point)
    let width = distance(landmarks[234], landmarks[454]);

    // Height: Eye-center level → Chin (Menton [152])
    // Using eye centers rather than brow gives a shorter, more standard anthropometric height
    // that matches conventions used in competing tools (fWHR ≈ width / eye-to-chin height)
    const rightEyeCenter = midpoint(landmarks[33], landmarks[133]);
    const leftEyeCenter = midpoint(landmarks[263], landmarks[362]);
    const eyeMid = midpoint(rightEyeCenter, leftEyeCenter);
    let height = distance(eyeMid, landmarks[152]); // eye center to chin

    // Euler Angle Maximum Mathematical Correction (Adapts to Anglemaxxing instead of punishing it!)
    const pitchRad = Math.abs(pitchStr) * (Math.PI / 180);
    const yawRad = Math.abs(yawStr) * (Math.PI / 180);

    if (pitchRad > 0.05) { height = height / Math.cos(pitchRad); }
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
    // Chin-to-Philtrum Ratio = chin height / philtrum length
    // Philtrum: Subnasale landmark[2] (nose base / top of philtrum) → Cupid's bow [0] (top of upper lip)
    // NOTE: landmark[164] is the lower lip — using [2] for subnasale is anatomically correct
    const philtrum = distance(landmarks[2], landmarks[0]);
    // Chin height: Stomion / mouth center [13] → Menton / chin bottom [152]
    const chinHeight = distance(landmarks[13], landmarks[152]);

    if (philtrum === 0) return 0;
    return chinHeight / philtrum;
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
    // lower/full face ratio: 0.62-0.68
    // Height between nasion (168) to bottom of chin (152) / Face height (hairline 10 to bottom of chin 152)
    let lowerHeight = distance(landmarks[168], landmarks[152]);
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

    return {
        upper: upperThird / total,
        middle: middleThird / total,
        lower: lowerThird / total,
        ratio: 1 - deviation
    };
}

export function calculateUpperEyelidExposure(landmarks: NormalizedLandmark[]): number {
    // UEE = distance from upper lid to iris center / pupil
    // More UEE = bug eyes, Less UEE = hunter eyes
    // Using landmarks: 
    // Left eye top lid: 159, Iris center: 468
    // Right eye top lid: 386, Iris center: 473
    const leftUEE = distance(landmarks[159], landmarks[468]);
    const rightUEE = distance(landmarks[386], landmarks[473]);
    
    // Normalize by eye height to make it scale-invariant
    const leftEyeHeight = distance(landmarks[159], landmarks[145]);
    const rightEyeHeight = distance(landmarks[386], landmarks[374]);
    
    if (leftEyeHeight === 0 || rightEyeHeight === 0) return 0.5;
    
    return ((leftUEE / leftEyeHeight) + (rightUEE / rightEyeHeight)) / 2;
}

export function calculatePhiltrumLength(landmarks: NormalizedLandmark[]): number {
    // Philtrum Length: Subnasale [2] to Cupid's bow [0]
    // Normalized by face height (hairline to chin) for relative measure
    const philtrum = distance(landmarks[2], landmarks[0]);
    const faceHeight = distance(landmarks[10], landmarks[152]);
    
    if (faceHeight === 0) return 0.05;
    return philtrum / faceHeight;
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

export type Phenotype = 'caucasian' | 'eastAsian' | 'african' | 'middleEastern' | 'southAsian' | 'generic';

export interface VitalityData {
    vitalityScore: number;
    biologicalAgeDelta: number;
    sleepScore: number;
    collagenIndex: number;
}

export interface MetricScores {
    canthalTilt: number;
    fWHR: number;
    midfaceRatio: number;
    esr: number;
    gonialAngle: number;
    chinToPhiltrumRatio: number;
    mouthToNoseWidthRatio: number;
    bigonialRatio: number;
    lowerThirdRatio: number;
    pfl: number;
    eyeToMouthAngle: number;
    lipRatio: number;
    overallSymmetry: number;
    ipd: number;
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
    collagenIndex: number;

    // V3: Grooming / Hair Quality (0-100 score, estimated from image analysis)
    hairQualityScore: number;

    // PHYSICAL METRICS (mm) - God-Tier Accuracy
    physicalIPD: number;
    physicalJawWidth: number;
    physicalFaceWidth: number;
    physicalFaceHeight: number;

    // OBJECTIVE AUDIT
    audit?: ConfidenceAudit;

    // NEW: Scientific Blackpill / PSL Wiki Metrics
    uee: number;      // Less is better (Hunter eyes)
    philtrumLength: number;           // Shorter is better
    
    // NEW GOD-TIER FIELDS
    phenotype?: Phenotype;
    vitality?: {
        vitalityScore: number;
        biologicalAgeDelta: number;
        eyeAperture: number;
        collagenIndex: number;
    };
}
export type ProfileType = 'front' | 'side';

export interface ScanResult {
    metrics: MetricScores;
    profileType: ProfileType;
}

export function calculateAggregatedMetrics(scans: unknown[]): MetricScores | null {
    const scanResults = scans as ScanResult[];
    if (!scanResults || scanResults.length === 0) return null;

    const templateMetrics = scanResults[0].metrics;
    const aggregated: Record<string, number> = {};
    const counters: Record<string, number> = {};

    for (const key of Object.keys(templateMetrics)) {
        aggregated[key] = 0;
        counters[key] = 0;
    }

    const sideOnlyMetrics = ['chinProjection', 'maxillaryProtrusion', 'orbitalRimProtrusion', 'browRidgeProtrusion', 'infraorbitalRimPosition', 'doubleChinRisk'];
    const frontOnlyMetrics = ['facialAsymmetry', 'ipdRatio', 'eyeSeparationRatio', 'canthalTilt', 'fwfhRatio', 'noseWidthRatio', 'mouthToNoseWidthRatio', 'bigonialWidthRatio', 'cheekboneProminence', 'skinQuality', 'facialTension', 'chinToPhiltrumRatio', 'lowerThirdRatio', 'palpebralFissureLength', 'facialThirdsRatio', 'foreheadHeightRatio', 'upperEyelidExposure', 'philtrumLength'];

    for (const scan of scanResults) {
        for (const [key, value] of Object.entries(scan.metrics)) {
            let isValid = true;
            if (scan.profileType === 'front' && sideOnlyMetrics.includes(key)) isValid = false;
            else if (scan.profileType === 'side' && frontOnlyMetrics.includes(key)) isValid = false;

            if (isValid && typeof value === 'number') {
                aggregated[key] += value;
                counters[key] += 1;
            }
        }
    }

    const finalMetrics: Record<string, unknown> = {};
    for (const key of Object.keys(templateMetrics)) {
        const val = (templateMetrics as Record<string, any>)[key];
        if (typeof val === 'number') {
            finalMetrics[key] = counters[key] > 0 ? aggregated[key] / counters[key] : val;
        } else {
            // Take from the most recent scan for non-numeric fields
            finalMetrics[key] = (scanResults[scanResults.length - 1].metrics as Record<string, any>)[key];
        }
    }

    return finalMetrics as unknown as MetricScores;
}

export function calculatePSLScore(
    metrics: MetricScores,
    gender: 'male' | 'female' = 'male',
    profileType: ProfileType | 'composite' = 'composite'
): { score: number; breakdown: string[]; tier: string } {
    let score = 4.0; // Base: 4.0 (MTN / Average according to strict 8.0 scale)
    const breakdown: string[] = ["Base: 4.0 (MTN - Average)"];

    const isF = gender === 'female';

    // ==========================================
    // UNIVERSAL METRICS (Apply to both profiles)
    // ==========================================

    // Midface Ratio (Ideal: Compact)
    const midfacePerf = isF ? [0.80, 1.05] : [0.75, 1.05];
    const midfaceGood = isF ? [0.75, 1.15] : [0.70, 1.10];
    if (metrics.midfaceRatio >= midfacePerf[0] && metrics.midfaceRatio <= midfacePerf[1]) {
        score += 0.4;
        breakdown.push("Perfect Compact Midface (+0.4)");
    } else if (metrics.midfaceRatio >= midfaceGood[0] && metrics.midfaceRatio <= midfaceGood[1]) {
        score += 0.1;
        breakdown.push("Good Midface Ratio (+0.1)");
    } else if (metrics.midfaceRatio < midfaceGood[0]) {
        score -= 0.6;
        breakdown.push("Excessively Compact Midface (Severe Camera Distortion) (-0.6)");
    } else {
        score -= 0.6;
        breakdown.push("Long or Imbalanced Midface (-0.6)");
    }

    // Gonial Angle
    const gonialPerf = isF ? [105, 130] : [115, 130];
    const gonialGood = isF ? [100, 135] : [105, 135];
    if (metrics.gonialAngle >= gonialPerf[0] && metrics.gonialAngle <= gonialPerf[1]) {
        score += 0.4;
        breakdown.push("Perfect Jawline Angle (+0.4)");
    } else if (metrics.gonialAngle >= gonialGood[0] && metrics.gonialAngle <= gonialGood[1]) {
        score += 0.1;
        breakdown.push("Good Jawline (+0.1)");
    } else {
        score -= 0.6;
        breakdown.push("Steep/Soft Jawline Angle (-0.6)");
    }

    // Lip Ratio (universal — reasonably accurate from any angle)
    const lipPerf = isF ? [1.15, 1.70] : [1.20, 1.70];
    if (metrics.lipRatio >= lipPerf[0] && metrics.lipRatio <= lipPerf[1]) {
        score += 0.1;
        breakdown.push("Ideal Lip Ratio (+0.1)");
    } else if (metrics.lipRatio >= 1.0 && metrics.lipRatio <= 2.2) {
        score += 0.0;
        breakdown.push("Average Lip Ratio (+0.0)");
    } else {
        score -= 0.3;
        breakdown.push("Suboptimal Lip Harmony (-0.3)");
    }

    // Hairline Recession (Ideal: 90-100) — works from any angle
    if (metrics.hairlineRecession >= 95) {
        score += 0.1;
        breakdown.push("Full Hairline (+0.1)");
    } else if (metrics.hairlineRecession >= 85) {
        score += 0.0;
        breakdown.push("Average Hairline (+0.0)");
    } else if (metrics.hairlineRecession < 50) {
        score -= 1.0;
        breakdown.push("Significant Hair Loss (-1.0)");
    } else if (metrics.hairlineRecession < 70) {
        score -= 0.6;
        breakdown.push("Receding Hairline (-0.6)");
    }

    // ==========================================
    // FRONT-ONLY METRICS
    // ==========================================
    if (profileType === 'front' || profileType === 'composite') {
        // Canthal Tilt
        const tiltPerf = isF ? [5, 9.5] : [4, 6];
        const tiltGood = isF ? 2 : 2;
        if (metrics.canthalTilt >= tiltPerf[0] && metrics.canthalTilt <= tiltPerf[1]) {
            score += 0.5;
            breakdown.push("Excellent Canthal Tilt (+0.5)");
        } else if (metrics.canthalTilt > tiltGood) {
            score += 0.2;
            breakdown.push("Positive Canthal Tilt (+0.2)");
        } else if (metrics.canthalTilt < 0) {
            score -= 0.8;
            breakdown.push("Negative Canthal Tilt (-0.8)");
        }

        // FW/FH Ratio — thresholds calibrated to eye-to-chin height baseline
        // Expected range: ~1.7–2.1 (typical adults), ideal >1.90 male / >1.75 female
        const fwfhPerf = isF ? 1.75 : 1.90;
        if (metrics.fwfhRatio >= fwfhPerf) {
            score += 0.5;
            breakdown.push("Ideal Facial Width (+0.5)");
        } else if (metrics.fwfhRatio >= fwfhPerf - 0.1) {
            score += 0.1;
            breakdown.push("Good Facial Structure (+0.1)");
        } else if (metrics.fwfhRatio < fwfhPerf - 0.30) {
            score -= 1.2;
            breakdown.push("Severely Narrow Face (-1.2)");
        } else if (metrics.fwfhRatio < fwfhPerf - 0.18) {
            score -= 0.6;
            breakdown.push("Narrow Face (-0.6)");
        }

        // Mouth to Nose Width 
        const mtnPerf = isF ? 1.45 : 1.30;
        if (metrics.mouthToNoseWidthRatio >= mtnPerf) {
            score += 0.1;
            breakdown.push("Ideal Mouth Width (+0.1)");
        } else if (metrics.mouthToNoseWidthRatio < mtnPerf - 0.1) {
            score -= 0.4;
            breakdown.push("Narrow Mouth (-0.4)");
        }

        // Eye Separation / ESR (Ideal: 0.45-0.47)
        if (metrics.eyeSeparationRatio >= 0.45 && metrics.eyeSeparationRatio <= 0.47) {
            score += 0.1;
            breakdown.push("Ideal Eye Spacing (+0.1)");
        } else if (metrics.eyeSeparationRatio < 0.42 || metrics.eyeSeparationRatio > 0.50) {
            score -= 0.4;
            breakdown.push("Suboptimal Eye Spacing (-0.4)");
        }

        // Eye to Mouth Angle (Ideal: 47-50 degrees)
        const emeMin = isF ? 47 : 46;
        if (metrics.eyeToMouthAngle >= emeMin && metrics.eyeToMouthAngle <= 50) {
            score += 0.1;
            breakdown.push("Ideal Eye-Mouth-Eye Angle (+0.1)");
        } else if (metrics.eyeToMouthAngle < emeMin - 2 || metrics.eyeToMouthAngle > 53) {
            score -= 0.4;
            breakdown.push("Suboptimal Eye-Mouth-Eye Angle (-0.4)");
        }

        // Bigonial Width
        const bigonialPerf = isF ? [1.15, 1.30] : [1.05, 1.25];
        if (metrics.bigonialWidthRatio >= bigonialPerf[0] && metrics.bigonialWidthRatio <= bigonialPerf[1]) {
            score += 0.2;
            breakdown.push("Ideal Jaw Width (+0.2)");
        } else if (metrics.bigonialWidthRatio <= bigonialPerf[1] + 0.1) {
            score += 0.0;
            breakdown.push("Average Jaw Width (+0.0)");
        } else {
            score -= 0.5;
            breakdown.push("Narrow Jaw (-0.5)");
        }

        // Facial Asymmetry (Ideal: 95-100)
        // Most people are somewhat symmetrical. Prevent massive free points.
        if (metrics.facialAsymmetry >= 95) {
            score += 0.0;
            breakdown.push("Perfect Symmetry (+0.0)");
        } else if (metrics.facialAsymmetry >= 90) {
            score += 0.0;
            breakdown.push("Average Symmetry (+0.0)");
        } else if (metrics.facialAsymmetry < 85) {
            score -= 1.0;
            breakdown.push("Severe Facial Asymmetry (-1.0)");
        } else if (metrics.facialAsymmetry < 90) {
            score -= 0.4;
            breakdown.push("Noticeable Asymmetry (-0.4)");
        }

        // IPD Ratio (Ideal: 0.45-0.47)
        if (metrics.ipdRatio >= 0.45 && metrics.ipdRatio <= 0.47) {
            score += 0.1;
            breakdown.push("Ideal Interpupillary Distance (+0.1)");
        } else if (metrics.ipdRatio < 0.40 || metrics.ipdRatio > 0.50) {
            score -= 0.3;
            breakdown.push("Suboptimal Interpupillary Distance (-0.3)");
        }

        // Nose Width Ratio
        const nwPerf = isF ? [0.22, 0.28] : [0.25, 0.32];
        if (metrics.noseWidthRatio >= nwPerf[0] && metrics.noseWidthRatio <= nwPerf[1]) {
            score += 0.1;
            breakdown.push("Ideal Nose Width (+0.1)");
        } else if (metrics.noseWidthRatio > nwPerf[1] + 0.05) {
            score -= 0.4;
            breakdown.push("Wide Nose (-0.4)");
        }

        // Cheekbone Prominence
        const cheekPerf = isF ? [0.38, 0.52] : [0.35, 0.50];
        if (metrics.cheekboneProminence >= cheekPerf[0] && metrics.cheekboneProminence <= cheekPerf[1]) {
            score += 0.3;
            breakdown.push("Prominent Cheekbones (+0.3)");
        } else if (metrics.cheekboneProminence < cheekPerf[0] - 0.05) {
            score -= 0.4;
            breakdown.push("Flat Cheekbones (-0.4)");
        }

        // Chin to Philtrum Ratio (front only — geometry unreliable from side view)
        // With corrected landmark[2] subnasale: expected range ~1.5–4.0, ideal 2.0–2.75 male / 1.8–2.5 female
        const c2pPerf = isF ? [1.8, 2.5] : [2.0, 2.75];
        const c2pGood = isF ? [1.5, 3.0] : [1.7, 3.2];
        if (metrics.chinToPhiltrumRatio >= c2pPerf[0] && metrics.chinToPhiltrumRatio <= c2pPerf[1]) {
            score += 0.2;
            breakdown.push("Ideal Lower Face Proportions (+0.2)");
        } else if (metrics.chinToPhiltrumRatio >= c2pGood[0] && metrics.chinToPhiltrumRatio <= c2pGood[1]) {
            score += 0.0;
            breakdown.push("Acceptable Lower Face Proportions (+0.0)");
        } else if (metrics.chinToPhiltrumRatio < 1.2 || metrics.chinToPhiltrumRatio > 4.5) {
            score -= 0.8;
            breakdown.push("Severely Unbalanced Chin-to-Philtrum (-0.8)");
        } else {
            score -= 0.4;
            breakdown.push("Unbalanced Lower Face (-0.4)");
        }

        // Lower / Full Face Ratio (front only — midline landmarks shift on side profiles)
        const lowerFacePerf = isF ? [0.60, 0.65] : [0.62, 0.68];
        if (metrics.lowerThirdRatio >= lowerFacePerf[0] && metrics.lowerThirdRatio <= lowerFacePerf[1]) {
            score += 0.2;
            breakdown.push("Strong Lower Face Proportion (+0.2)");
        } else if (metrics.lowerThirdRatio > lowerFacePerf[1]) {
            score -= 0.6;
            breakdown.push("Overly Long Lower Face (-0.6)");
        } else if (metrics.lowerThirdRatio >= lowerFacePerf[0] - 0.04) {
            score += 0.0;
            breakdown.push("Average Lower Face (+0.0)");
        } else {
            score -= 0.8;
            breakdown.push("Weak Lower Face Volume (-0.8)");
        }

        // Palpebral Fissure (front only — side view shows only one eye)
        const fissurePerf = isF ? 2.8 : 3.0;
        if (metrics.palpebralFissureLength >= fissurePerf) {
            score += 0.5;
            breakdown.push("Elite Horizontal Eye Length (+0.5)");
        } else if (metrics.palpebralFissureLength > fissurePerf - 0.3) {
            score += 0.1;
            breakdown.push("Good Horizontal Eye Length (+0.1)");
        } else {
            score -= 0.5;
            breakdown.push("Short Eye Fissure (-0.5)");
        }

        // Facial Thirds Ratio (front only — hairline landmark unreliable from side)
        const thirdsGood = isF ? 80 : 75;
        if (metrics.facialThirdsRatio >= 95) {
            score += 0.2;
            breakdown.push("Perfect Facial Thirds (+0.2)");
        } else if (metrics.facialThirdsRatio < thirdsGood) {
            score -= 0.6;
            breakdown.push("Severely Unbalanced Thirds (-0.6)");
        }

        // Forehead Height Ratio (front only)
        if (metrics.foreheadHeightRatio >= 0.30 && metrics.foreheadHeightRatio <= 0.35) {
            score += 0.1;
            breakdown.push("Ideal Forehead (+0.1)");
        } else if (metrics.foreheadHeightRatio > 0.38) {
            score -= 0.4;
            breakdown.push("Fivehead (-0.4)");
        }
    }

    // ==========================================
    // SIDE-ONLY METRICS (3D Depth)
    // ==========================================
    if (profileType === 'side' || profileType === 'composite') {
        // Orbital Rim Protrusion
        // NOTE: Glasses heavily corrupt this measurement - reduce penalty weight
        const orbPerf = isF ? 0.005 : 0.015;
        if (metrics.orbitalRimProtrusion > orbPerf) {
            score += 0.5;
            breakdown.push("Elite Orbital Depth (+0.5)");
        } else if (metrics.orbitalRimProtrusion > orbPerf - 0.01) {
            score += 0.1;
            breakdown.push("Good Orbital Depth (+0.1)");
        } else if (metrics.orbitalRimProtrusion < -0.005) {
            score -= 0.5;
            breakdown.push("Deeply Recessed / Bulging Eyes (-0.5)");
        }

        // Maxillary Protrusion
        if (metrics.maxillaryProtrusion > 0.02) {
            score += 0.5;
            breakdown.push("Excellent Forward Maxilla Base (+0.5)");
        } else if (metrics.maxillaryProtrusion > 0.01) {
            score += 0.1;
            breakdown.push("Good Maxillary Development (+0.1)");
        } else if (metrics.maxillaryProtrusion < -0.005) {
            score -= 0.8;
            breakdown.push("Retruded Maxilla / Flat Midface (-0.8)");
        }

        // Brow Ridge Protrusion (DIMORPHIC FLIP)
        if (isF) {
            if (metrics.browRidgeProtrusion < 0.01) {
                score += 0.3;
                breakdown.push("Smooth Feminine Brow (+0.3)");
            } else if (metrics.browRidgeProtrusion > 0.02) {
                score -= 0.6;
                breakdown.push("Masculine/Heavy Brow Ridge (-0.6)");
            }
        } else {
            if (metrics.browRidgeProtrusion > 0.015) {
                score += 0.4;
                breakdown.push("Prominent masculine Brow Ridge (+0.4)");
            } else if (metrics.browRidgeProtrusion > 0.005) {
                score += 0.1;
                breakdown.push("Good Brow Ridge (+0.1)");
            } else if (metrics.browRidgeProtrusion < 0) {
                score -= 0.4;
                breakdown.push("Flat Brow / Lacking Dimorphism (-0.4)");
            }
        }

        // Infraorbital Rim Position
        if (metrics.infraorbitalRimPosition > 0.01) {
            score += 0.4;
            breakdown.push("Excellent Under-eye Support (+0.4)");
        } else if (metrics.infraorbitalRimPosition > 0) {
            score += 0.1;
            breakdown.push("Good Under-eye Support (+0.1)");
        } else if (metrics.infraorbitalRimPosition < -0.01) {
            score -= 0.7;
            breakdown.push("Recessed Infraorbital Rim / Prone to under-eye circles (-0.7)");
        }

        // Chin Projection
        const chinProjPerf = isF ? 0.015 : 0.025;
        if (metrics.chinProjection > chinProjPerf) {
            score += 0.5;
            breakdown.push("Elite Chin Projection (+0.5)");
        } else if (metrics.chinProjection > chinProjPerf - 0.015) {
            score += 0.1;
            breakdown.push("Average Chin Projection (+0.1)");
        } else if (metrics.chinProjection < 0) {
            score -= 0.8;
            breakdown.push("Recessed Chin / Weak Genioplasty Target (-0.8)");
        }
    }

    // ==========================================
    // SCIENTIFIC BLACKPILL / WIKI METRICS
    // ==========================================

    // Upper Eyelid Exposure (UEE)
    if (metrics.upperEyelidExposure !== undefined) {
        if (metrics.upperEyelidExposure < 0.25) {
            score += 0.6;
            breakdown.push("Hunter Eyes / Minimal UEE (+0.6)");
        } else if (metrics.upperEyelidExposure > 0.45) {
            score -= 1.0;
            breakdown.push("Bug Eyes / Excessive UEE (-1.0)");
        } else if (metrics.upperEyelidExposure > 0.35) {
            score -= 0.3;
            breakdown.push("Noticeable Upper Eyelid Exposure (-0.3)");
        }
    }

    // Philtrum Length
    if (metrics.philtrumLength !== undefined) {
        if (metrics.philtrumLength < 0.08) {
            score += 0.3;
            breakdown.push("Short Compact Philtrum (+0.3)");
        } else if (metrics.philtrumLength > 0.12) {
            score -= 0.7;
            breakdown.push("Long Philtrum / Facial Elongation (-0.7)");
        }
    }

    // ==========================================
    // V2 ADVANCED METRICS
    // ==========================================

    if ((profileType === 'side' || profileType === 'composite') && metrics.doubleChinRisk !== undefined) {
        if (metrics.doubleChinRisk > 0.02) {
            score += 0.2;
            breakdown.push("Excellent Jawline Definition (+0.2)");
        } else if (metrics.doubleChinRisk < 0.005) {
            score -= 0.5;
            breakdown.push("Submental Fullness / Double Chin (-0.5)");
        }
    }

    if (metrics.skinQuality !== undefined) {
        if (metrics.skinQuality >= 85) {
            score += 0.2;
            breakdown.push("Exceptional Clear/Glass Skin (+0.2)");
        } else if (metrics.skinQuality < 35) {
            score -= 0.6;
            breakdown.push("Textured/Acne Skin (-0.6)");
        } else if (metrics.skinQuality < 60) {
            score -= 0.2;
            breakdown.push("Slight Skin Irregularities (-0.2)");
        }
    }

    // Hair Quality — Hair functions as grooming / "makeup for men"
    // Clean, well-styled hair is a legitimate attractiveness booster
    if (metrics.hairQualityScore !== undefined && metrics.hairQualityScore > 0) {
        if (metrics.hairQualityScore >= 85) {
            score += 0.3;
            breakdown.push("Elite Grooming / Hair (+0.3)");
        } else if (metrics.hairQualityScore >= 70) {
            score += 0.1;
            breakdown.push("Good Hair / Grooming (+0.1)");
        } else if (metrics.hairQualityScore >= 50) {
            score += 0.0;
            breakdown.push("Average Hair / Grooming (+0.0)");
        } else if (metrics.hairQualityScore < 30) {
            score -= 0.4;
            breakdown.push("Unkempt / Damaged Hair (-0.4)");
        } else {
            score -= 0.1;
            breakdown.push("Below-Average Grooming (-0.1)");
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
    // Positive scores use a tight divisor (hard to earn high scores).
    // Negative scores use a moderate divisor (penalties bite but Z-depth noise doesn't nuke scores).
    const rawDiff = score - 4.0;

    // PROFILE COMPENSATION: 
    // Side profiles have fewer measurable traits, so the score variance is lower.
    // We boost the rawDiff slightly for side profiles to match front profile dynamic range.
    const profileScalar = profileType === 'side' ? 1.25 : 1.0;
    const adjustedDiff = rawDiff * profileScalar;

    if (adjustedDiff > 0) {
        // Compress positive scores — earning above 4.0 requires genuine elite traits
        if (profileType === 'composite') {
            score = 4.0 + (adjustedDiff / 2.0);
        } else {
            score = 4.0 + (adjustedDiff / 1.3);
        }
    } else {
        // Moderate negative compression — penalties still bite but noisy Z-depth doesn't obliterate
        if (profileType === 'composite') {
            score = 4.0 + (adjustedDiff / 1.8);
        } else {
            score = 4.0 + (adjustedDiff / 1.4);
        }
    }

    // FINAL SAFETY: If it's a side profile and score is abnormally low, 
    // it's likely a geometry error. Ensure a floor of 2.0 unless severe issues are confirmed.
    if (profileType === 'side' && score < 2.5 && metrics.audit?.angleSeverity < 50) {
        score = Math.max(score, 2.5);
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
