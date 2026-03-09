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
            let sum = 0;
            const intensities = [];

            // Convert to grayscale and collect intensities
            for (let i = 0; i < data.length; i += 4) {
                const intensity = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                intensities.push(intensity);
            }

            // Sort intensities to find the median 
            intensities.sort((a, b) => a - b);
            const median = intensities[Math.floor(intensities.length / 2)];

            // We want to discard intense outliers (like a pitch black glasses rim or dark hair strand) 
            // that have dramatically different intensities than the median skin tone.
            // Let's filter out any pixels that deviate more than 40 intensity points from the median.
            const validSkinPixels = intensities.filter(val => Math.abs(val - median) < 40);

            // If less than a quarter of the patch is valid, return 0 (bad patch)
            if (validSkinPixels.length < intensities.length * 0.25) return 0;

            // Now compute mean and variance on ONLY the clean skin pixels
            let validSum = 0;
            for (const val of validSkinPixels) validSum += val;
            const mean = validSum / validSkinPixels.length;

            let varianceSum = 0;
            for (const val of validSkinPixels) {
                varianceSum += Math.pow(val - mean, 2);
            }

            return Math.sqrt(varianceSum / validSkinPixels.length);
        } catch (e) {
            return 0; // Canvas cross-origin taint or bounds issue
        }
    };

    // Lower Cheek Patches (Further away from glasses rims / under-eye shadows)
    // 116 is mid-lower cheek left, 345 is mid-lower cheek right
    // Also including 50 and 280 again since the multi-pass median outlier filter handles glasses dynamically!
    // And 152 for chin!
    const padding = Math.floor(width * 0.03);

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

    // Normalizing standard deviation
    // highly airbrushed / glass skin has local STDEV < 12
    // very textured / acne skin has local STDEV > 35
    const baseline = Math.min(35, avgDev); // Cap calculation at severe texture

    // Score out of 100
    let score = 100 - (Math.max(0, baseline - 5) * 3);
    score = Math.max(1, Math.min(100, score));

    let feedback = "Clear / Glass Skin";
    if (avgDev > 25) feedback = "Heavy Texture / Acne";
    else if (avgDev > 18) feedback = "Moderate Texture";
    else if (avgDev > 12) feedback = "Slight Texture";

    return { clarityScore: score, feedback, value: avgDev };
}
