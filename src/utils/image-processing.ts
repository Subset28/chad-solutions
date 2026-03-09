export const convertHeicToJpeg = async (file: File): Promise<Blob | Blob[]> => {
    const heic2any = (await import('heic2any')).default;
    return heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
    });
};

/**
 * Extracts localized patches of skin from the face (Cheeks & Forehead)
 * and calculates High-Frequency Color Variance (Texture & Acne).
 * Heavy variance = Acne/Texture. Low variance = Clear Glass Skin.
 * 
 * V2: Widened outlier rejection + larger patches to handle makeup contouring
 * and studio lighting without false positives. Uses median RGB reference 
 * instead of mean to resist contouring gradient skew.
 */
export function analyzeSkinQuality(
    image: HTMLImageElement | HTMLVideoElement,
    landmarks: any[] // Normalized landmarks
): { clarityScore: number, feedback: string, value: number } {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) return { clarityScore: 0, feedback: "Unable to process texture", value: 0 };

    const width = image instanceof HTMLVideoElement ? image.videoWidth : image.width;
    const height = image instanceof HTMLVideoElement ? image.videoHeight : image.height;

    if (width === 0 || height === 0) return { clarityScore: 0, feedback: "Invalid Image Context", value: 0 };

    canvas.width = width;
    canvas.height = height;

    // Draw the full image memory into WebGL/2D plane
    ctx.drawImage(image, 0, 0, width, height);

    // Compute standard deviation of a region
    const computeSTDEV = (cx: number, cy: number, size: number) => {
        try {
            // Avoid out of bounds
            const sx = Math.max(0, cx - size / 2);
            const sy = Math.max(0, cy - size / 2);
            const sWidth = Math.min(size, width - sx);
            const sHeight = Math.min(size, height - sy);

            if (sWidth <= 0 || sHeight <= 0) return 0;

            const imageData = ctx.getImageData(sx, sy, sWidth, sHeight);
            const data = imageData.data;
            const intensities = [];

            // Convert to grayscale purely to find the median for outlier rejection (hair, eyes, glasses rim)
            for (let i = 0; i < data.length; i += 4) {
                const intensity = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                intensities.push(intensity);
            }

            // Sort intensities to find the median 
            const sortedIntensities = [...intensities].sort((a, b) => a - b);
            const median = sortedIntensities[Math.floor(sortedIntensities.length / 2)];

            // Collect valid RGB pixels (rejecting hair/shadows/extreme highlights)
            // V2: Widened from 40 to 55 to exclude makeup contouring gradients
            const validPixels = [];
            for (let i = 0; i < data.length; i += 4) {
                if (Math.abs(intensities[i / 4] - median) < 55) {
                    validPixels.push([data[i], data[i + 1], data[i + 2]]);
                }
            }

            // If less than a quarter of the patch is valid, return 0 (bad patch)
            if (validPixels.length < (data.length / 4) * 0.25) return 0;

            // Compute median RGB instead of mean (more robust against contouring gradient outliers)
            const sortedR = validPixels.map(p => p[0]).sort((a, b) => a - b);
            const sortedG = validPixels.map(p => p[1]).sort((a, b) => a - b);
            const sortedB = validPixels.map(p => p[2]).sort((a, b) => a - b);
            const medianR = sortedR[Math.floor(sortedR.length / 2)];
            const medianG = sortedG[Math.floor(sortedG.length / 2)];
            const medianB = sortedB[Math.floor(sortedB.length / 2)];

            // Compute RGB Euclidean Variance against median (not mean)
            let varianceSum = 0;
            for (const p of validPixels) {
                varianceSum += Math.pow(p[0] - medianR, 2) + Math.pow(p[1] - medianG, 2) + Math.pow(p[2] - medianB, 2);
            }

            return Math.sqrt(varianceSum / validPixels.length);
        } catch (e) {
            return 0; // Canvas cross-origin taint or bounds issue
        }
    };

    // Lower Cheek Patches (Further away from glasses rims / under-eye shadows)
    // 116 is mid-lower cheek left, 345 is mid-lower cheek right
    // Also including 50 and 280 since the multi-pass median outlier filter handles glasses dynamically!
    // And 152 for chin!
    // V2: Increased patch size from 3% to 5% of image width for better averaging
    const padding = Math.floor(width * 0.05);

    const cheek1 = landmarks[116];
    const cheek2 = landmarks[345];
    const cheek3 = landmarks[50];
    const cheek4 = landmarks[280];
    const chin = landmarks[152];

    const dev1 = computeSTDEV(cheek1.x * width, cheek1.y * height, padding);
    const dev2 = computeSTDEV(cheek2.x * width, cheek2.y * height, padding);
    const dev3 = computeSTDEV(cheek3.x * width, cheek3.y * height, padding);
    const dev4 = computeSTDEV(cheek4.x * width, cheek4.y * height, padding);
    const dev5 = computeSTDEV(chin.x * width, chin.y * height, padding);

    // Filter out dead 0 readings (if out of bounds)
    const devs = [dev1, dev2, dev3, dev4, dev5].filter(d => d > 0);
    const avgDev = devs.length > 0 ? devs.reduce((a, b) => a + b) / devs.length : 0;

    // Normalizing Euclidean color deviation
    // V3 thresholds: Even more forgiving for professional makeup/contouring:
    //   - Glass skin / airbrushed: RGB STDEV < 20  
    //   - Normal healthy skin: 20-28
    //   - Slight texture / heavy makeup: 28-38
    //   - Moderate texture: 38-48
    //   - Heavy acne/texture: > 48
    const baseline = Math.min(55, avgDev); // Cap calculation at severe texture

    // Score out of 100 — V3: offset 20, multiplier 1.5 (professional photos w/ makeup = normal)
    let score = 100 - (Math.max(0, baseline - 20) * 1.5);
    score = Math.max(1, Math.min(100, score));

    let feedback = "Clear / Glass Skin";
    if (avgDev > 45) feedback = "Heavy Texture / Acne";
    else if (avgDev > 35) feedback = "Moderate Texture";
    else if (avgDev > 24) feedback = "Slight Texture";

    return { clarityScore: score, feedback, value: avgDev };
}
