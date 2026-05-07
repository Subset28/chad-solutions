import { NormalizedLandmark } from "@mediapipe/tasks-vision";

export interface ValidationResult {
    isValid: boolean;
    reason?: string;
    confidence: number;
}

/**
 * Validates landmark confidence scores.
 * Checks key landmarks for visibility and overall presence.
 */
export function validateLandmarks(
    landmarks: NormalizedLandmark[]
): ValidationResult {
    if (!landmarks || landmarks.length === 0) {
        return { isValid: false, reason: "No landmarks detected", confidence: 0 };
    }

    const keyGroups = {
        jaw: [172, 397, 132, 361, 152],
        eyes: [33, 263, 133, 362],
        zygoma: [234, 454],
        midface: [1, 2, 168]
    };

    let totalVisibility = 0;
    const occludedRegions: string[] = [];

    for (const [name, indices] of Object.entries(keyGroups)) {
        let groupVisibility = 0;
        indices.forEach(idx => {
            const lm = landmarks[idx];
            groupVisibility += lm.visibility ?? 1.0;
        });
        const avg = groupVisibility / indices.length;
        totalVisibility += avg;
        if (avg < 0.7) occludedRegions.push(name);
    }

    const confidence = totalVisibility / Object.keys(keyGroups).length;

    if (occludedRegions.length > 0) {
        return {
            isValid: false,
            reason: `Potential occlusion detected in: ${occludedRegions.join(", ")}. Please ensure your face is fully visible.`,
            confidence
        };
    }

    return { isValid: true, confidence };
}

/**
 * Applies 3-axis pose normalization by inverse-rotating landmarks 
 * using the facial transformation matrix.
 */
export function inversePoseNormalization(
    landmarks: NormalizedLandmark[],
    matrix: unknown
): NormalizedLandmark[] {
    if (!landmarks || !matrix) return landmarks;
    // ... logic same as normalizePose ...
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const mat = matrix as any;
    let m = new Float32Array(16);
    if (mat.length === 16) {
        m = mat;
    } else if (mat.data) {
        m = mat.data;
    } else {
        return landmarks;
    }

    const r00 = m[0], r01 = m[1], r02 = m[2];
    const r10 = m[4], r11 = m[5], r12 = m[6];
    const r20 = m[8], r21 = m[9], r22 = m[10];

    return landmarks.map(lm => {
        const x = lm.x - 0.5;
        const y = lm.y - 0.5;
        const z = lm.z;

        const rx = r00 * x + r10 * y + r20 * z;
        const ry = r01 * x + r11 * y + r21 * z;
        const rz = r02 * x + r12 * y + r22 * z;

        return {
            ...lm,
            x: rx + 0.5,
            y: ry + 0.5,
            z: rz
        };
    });
}


/**
 * Heuristic Perspective Undistortion
 * Corrects for lens distortion artifacts typical of wide-angle front cameras (23-28mm).
 * Nose width inflation and chin recession are the main targets.
 */
export function undistortPerspective(
    landmarks: NormalizedLandmark[],
    focalLength_mm: number = 26 // Default to typical front camera if unknown
): NormalizedLandmark[] {
    if (focalLength_mm >= 35) return landmarks; // 35mm+ is relatively flat

    // Distortion scalar: closer to 1 as focal length approaches 35mm
    const distortionFactor = (35 - focalLength_mm) / 35;
    
    return landmarks.map((lm, idx) => {
        // Points further from the center are more distorted
        const dx = lm.x - 0.5;
        const dy = lm.y - 0.5;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);

        // Simple radial undistortion heuristic
        // We pull points slightly towards center based on their relative depth and focal length
        const scale = 1 - (distortionFactor * distFromCenter * 0.1);

        // Apply specific correction to central features if they are "bulging"
        // Nose indices: 1, 2, 4, 5, 6 etc.
        const isNose = [1, 2, 4, 5, 6, 168].includes(idx);
        const noseCorrection = isNose ? (1 - distortionFactor * 0.05) : 1.0;

        return {
            ...lm,
            x: 0.5 + dx * scale * noseCorrection,
            y: 0.5 + dy * scale * noseCorrection,
            z: lm.z // Depth remains relative
        };
    });
}
