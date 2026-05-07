import { MetricReport, flattenMetrics } from './metrics';

/**
 * Haircut Recommender Engine V2
 *
 * Classifies face shape from facial metric data, then maps to optimal
 * hairstyles segregated by gender. Incorporates hair type, texture,
 * thickness, and race/ethnicity for contextual recommendations.
 */

export type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond';

// ============================================================
// HAIR PROFILE TYPES
// ============================================================

export type HairType = 'straight' | 'wavy' | 'curly' | 'coily';
export type HairTexture = 'fine' | 'medium' | 'coarse';
export type HairThickness = 'thin' | 'medium' | 'thick';
export type EthnicBackground =
    | 'caucasian'
    | 'east_asian'
    | 'south_asian'
    | 'black_african'
    | 'hispanic_latino'
    | 'middle_eastern'
    | 'mixed'
    | 'not_specified';

export type HairLine = 'full' | 'receding_slight' | 'receding_moderate' | 'thinning';

export interface HairProfile {
    type: HairType;
    texture: HairTexture;
    thickness: HairThickness;
    ethnicity: EthnicBackground;
    hairline: HairLine;
}

export const DEFAULT_HAIR_PROFILE: HairProfile = {
    type: 'straight',
    texture: 'medium',
    thickness: 'medium',
    ethnicity: 'not_specified',
    hairline: 'full',
};

export interface HaircutRecommendation {
    name: string;
    description: string;
    why: string;
    hairTypeNote?: string;
}

export interface HairPSLScore {
    score: number;
    label: string;
    breakdown: string[];
    faceShapeSynergy: number;
    recommendations: string[];
}

export interface FaceShapeProfile {
    shape: FaceShape;
    label: string;
    emoji: string;
    description: string;
    confidence: number;
    recommendations: HaircutRecommendation[];
    avoid: string[];
    stylingTips: string[];
    hairProfile?: HairProfile;
    hairPSL?: HairPSLScore;
}

// ============================================================
// FACE SHAPE CLASSIFIER
// ============================================================

interface ShapeScore {
    shape: FaceShape;
    score: number;
}

export function classifyFaceShape(metrics: MetricReport, _gender: 'male' | 'female'): { shape: FaceShape; confidence: number } {
    const flat = flattenMetrics(metrics);
    const fwfhRatio = flat.fWHR || 1.5;
    const foreheadHeightRatio = flat.foreheadHeightRatio || 0.3;
    const bigonialRatio = flat.bigonialRatio || 1.1;
    const midfaceRatio = flat.midfaceRatio || 0.9;
    const gonialAngle = flat.gonialAngle || 115;
    const lowerThirdRatio = flat.lowerThirdRatio || 0.6;

    const scores: ShapeScore[] = [];

    // ── OBLONG ──────────────────────────────────────────────────────
    let oblongScore = 0;
    if (fwfhRatio < 1.40) oblongScore += 40;
    else if (fwfhRatio < 1.50) oblongScore += 15;
    if (lowerThirdRatio > 0.65) oblongScore += 20;
    if (foreheadHeightRatio >= 0.30 && foreheadHeightRatio <= 0.40) oblongScore += 15;
    if (bigonialRatio >= 1.05 && bigonialRatio <= 1.25) oblongScore += 15;
    if (gonialAngle >= 110 && gonialAngle <= 130) oblongScore += 10;
    scores.push({ shape: 'oblong', score: oblongScore });

    // ── OVAL ────────────────────────────────────────────────────────
    let ovalScore = 0;
    if (fwfhRatio >= 1.40 && fwfhRatio < 1.58) ovalScore += 35;
    else if (fwfhRatio >= 1.35 && fwfhRatio < 1.63) ovalScore += 15;
    if (bigonialRatio >= 1.05 && bigonialRatio <= 1.20) ovalScore += 25;
    if (foreheadHeightRatio >= 0.28 && foreheadHeightRatio <= 0.35) ovalScore += 20;
    if (midfaceRatio >= 0.80 && midfaceRatio <= 1.05) ovalScore += 15;
    if (lowerThirdRatio >= 0.56 && lowerThirdRatio <= 0.68) ovalScore += 5;
    scores.push({ shape: 'oval', score: ovalScore });

    // ── ROUND ───────────────────────────────────────────────────────
    let roundScore = 0;
    if (fwfhRatio >= 1.55) roundScore += 35;
    else if (fwfhRatio >= 1.48) roundScore += 15;
    if (gonialAngle > 130) roundScore += 30;
    else if (gonialAngle > 125) roundScore += 15;
    if (bigonialRatio >= 1.15) roundScore += 20;
    if (midfaceRatio >= 0.85 && midfaceRatio <= 1.10) roundScore += 10;
    if (lowerThirdRatio < 0.60) roundScore += 5;
    scores.push({ shape: 'round', score: roundScore });

    // ── SQUARE ──────────────────────────────────────────────────────
    let squareScore = 0;
    if (fwfhRatio >= 1.50) squareScore += 25;
    else if (fwfhRatio >= 1.42) squareScore += 10;
    if (gonialAngle >= 100 && gonialAngle <= 120) squareScore += 35;
    else if (gonialAngle > 120 && gonialAngle <= 128) squareScore += 10;
    if (bigonialRatio >= 1.10 && bigonialRatio <= 1.30) squareScore += 20;
    if (foreheadHeightRatio >= 0.28 && foreheadHeightRatio <= 0.36) squareScore += 10;
    if (lowerThirdRatio >= 0.60) squareScore += 10;
    scores.push({ shape: 'square', score: squareScore });

    // ── HEART ───────────────────────────────────────────────────────
    let heartScore = 0;
    if (bigonialRatio < 1.05) heartScore += 40;
    else if (bigonialRatio < 1.10) heartScore += 20;
    if (foreheadHeightRatio >= 0.32) heartScore += 25;
    else if (foreheadHeightRatio >= 0.28) heartScore += 10;
    if (fwfhRatio >= 1.38 && fwfhRatio <= 1.65) heartScore += 20;
    if (lowerThirdRatio < 0.62) heartScore += 15;
    scores.push({ shape: 'heart', score: heartScore });

    // ── DIAMOND ─────────────────────────────────────────────────────
    let diamondScore = 0;
    if (foreheadHeightRatio < 0.30) diamondScore += 30;
    else if (foreheadHeightRatio < 0.33) diamondScore += 10;
    if (bigonialRatio < 1.08) diamondScore += 30;
    else if (bigonialRatio < 1.12) diamondScore += 10;
    if (fwfhRatio >= 1.38 && fwfhRatio <= 1.65) diamondScore += 20;
    if (midfaceRatio >= 0.75 && midfaceRatio <= 1.00) diamondScore += 15;
    if (gonialAngle >= 110 && gonialAngle <= 135) diamondScore += 5;
    scores.push({ shape: 'diamond', score: diamondScore });

    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];
    const second = scores[1];
    const margin = best.score - second.score;
    const confidence = Math.min(95, Math.max(45, Math.round(50 + margin * 1.5)));

    return { shape: best.shape, confidence };
}

// ============================================================
// HAIR PSL SCORER
// ============================================================

export function calculateHairPSL(
    hairProfile: HairProfile,
    faceShape: FaceShape,
    gender: 'male' | 'female'
): HairPSLScore {
    const breakdown: string[] = [];
    const recommendations: string[] = [];
    let base = 5.0;

    const synergy = (hairTypeShapeSynergy as any)[faceShape][hairProfile.type];
    base += synergy.bonus;
    if (synergy.bonus >= 0.5) breakdown.push(`${capitalize(hairProfile.type)} hair naturally suits ${faceShape} faces (+${synergy.bonus.toFixed(1)})`);
    else if (synergy.bonus <= -0.3) breakdown.push(`${capitalize(hairProfile.type)} hair fights the natural ${faceShape} proportions (${synergy.bonus.toFixed(1)})`);

    const textureBonus = textureScores[hairProfile.texture];
    base += textureBonus;
    if (textureBonus > 0) breakdown.push(`${capitalize(hairProfile.texture)} texture adds visual depth (+${textureBonus.toFixed(1)})`);
    
    if (hairProfile.thickness === 'thick') {
        base += 0.5;
        breakdown.push(`Thick hair: maximum versatility (+0.5)`);
    } else if (hairProfile.thickness === 'thin') {
        base -= 0.3;
        breakdown.push(`Thin hair: limits volume (-0.3)`);
    }

    if (hairProfile.hairline === 'receding_slight') {
        base -= 0.4;
        breakdown.push(`Slight recession detected (-0.4)`);
    } else if (hairProfile.hairline === 'receding_moderate') {
        base -= 0.8;
        breakdown.push(`Moderate recession detected (-0.8)`);
    } else if (hairProfile.hairline === 'thinning') {
        base -= 1.5;
        breakdown.push(`Active thinning detected (-1.5)`);
    }

    const ethnicNote = (ethnicHairNotes as any)[hairProfile.ethnicity];
    if (ethnicNote) {
        base += ethnicNote.bonus;
        breakdown.push(ethnicNote.note);
    }

    const mainBonus = synergy.bonus + (hairProfile.thickness === 'thick' ? 0.4 : hairProfile.thickness === 'thin' ? -0.2 : 0);
    const hairlineBonus = hairProfile.hairline === 'full' ? 0.2 : -0.3;
    const faceShapeSynergy = Math.round(50 + (mainBonus + hairlineBonus) * 25);
    const clampedSynergy = Math.min(100, Math.max(0, faceShapeSynergy));

    if (gender === 'male' && hairProfile.type === 'straight' && hairProfile.thickness === 'thick') base += 0.3;
    if (gender === 'female' && (hairProfile.type === 'wavy' || hairProfile.type === 'curly')) base += 0.3;

    recommendations.push(...synergy.tips);
    const finalScore = Math.min(10, Math.max(1, parseFloat(base.toFixed(1))));

    return {
        score: finalScore,
        label: getHairTierLabel(finalScore),
        breakdown,
        faceShapeSynergy: clampedSynergy,
        recommendations,
    };
}

function getHairTierLabel(score: number): string {
    if (score >= 9.0) return '💎 Godlike Hair';
    if (score >= 8.0) return '🔥 Elite Hair';
    if (score >= 7.0) return '✅ Above Average';
    if (score >= 6.0) return '📊 Mid-Tier Solid';
    if (score >= 5.0) return '😐 Average';
    if (score >= 4.0) return '⚠️ Below Average';
    return '❌ Major Hair Work Needed';
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Synergy and database constants (simplified for export)
const hairTypeShapeSynergy = {
    oval: {
        straight: { bonus: 0.5, tips: ['Almost any cut works — focus on quality over correction'] },
        wavy:     { bonus: 0.7, tips: ['Wavy texture adds dimension without disrupting oval balance'] },
        curly:    { bonus: 0.6, tips: ['Curly hair looks natural and expressive on an oval'] },
        coily:    { bonus: 0.5, tips: ['Coily hair is very versatile on oval faces'] },
    },
    round: {
        straight: { bonus: 0.4, tips: ['Go long or use a quiff/pompadour to add height'] },
        wavy:     { bonus: 0.5, tips: ['Keep volume on top, not on the sides'] },
        curly:    { bonus: -0.2, tips: ['Avoid wide curly volume at the sides'] },
        coily:    { bonus: -0.3, tips: ['Tapered cut with height at the crown works best'] },
    },
    square: {
        straight: { bonus: 0.3, tips: ['Use texture and softness to complement the jaw'] },
        wavy:     { bonus: 0.7, tips: ['Wavy hair naturally softens geometric lines'] },
        curly:    { bonus: 0.8, tips: ['Organic movement counteracts hard angles beautifully'] },
        coily:    { bonus: 0.6, tips: ['Coily hair adds volume that softens jaw geometry'] },
    },
    heart: {
        straight: { bonus: 0.3, tips: ['Needs chin-level volume to balance wider forehead'] },
        wavy:     { bonus: 0.6, tips: ['Adds softness and volume at the jaw'] },
        curly:    { bonus: 0.5, tips: ['Curls below the chin are ideal for heart faces'] },
        coily:    { bonus: 0.4, tips: ['Concentrate volume below the temples'] },
    },
    oblong: {
        straight: { bonus: -0.4, tips: ['Avoid long, pin-straight hair; use fringe to break line'] },
        wavy:     { bonus: 0.6, tips: ['Adds the horizontal width oblong faces need'] },
        curly:    { bonus: 0.8, tips: ['Horizontal volume provides perfect width balance'] },
        coily:    { bonus: 0.8, tips: ['Wide, full shapes add width to counteract length'] },
    },
    diamond: {
        straight: { bonus: 0.3, tips: ['Needs width at forehead and jaw to balance cheekbones'] },
        wavy:     { bonus: 0.5, tips: ['Adds coverage and softness at narrow forehead/jaw'] },
        curly:    { bonus: 0.4, tips: ['Adds volume at top and ends to balance narrow points'] },
        coily:    { bonus: 0.5, tips: ['Full volume at the crown adds forehead width'] },
    },
};

const textureScores: Record<HairTexture, number> = { fine: -0.2, medium: 0.2, coarse: 0.0 };

const ethnicHairNotes = {
    caucasian: { bonus: 0.0, note: 'Caucasian hair: high styling versatility' },
    east_asian: { bonus: 0.2, note: 'East Asian hair: naturally thick and glossy' },
    south_asian: { bonus: 0.1, note: 'South Asian hair: high natural luster' },
    black_african: { bonus: 0.0, note: 'Black/African hair: highly textured coils' },
    hispanic_latino: { bonus: 0.1, note: 'Hispanic/Latino hair: natural wave potential' },
    middle_eastern: { bonus: 0.1, note: 'Middle Eastern hair: strong density' },
    mixed: { bonus: 0.1, note: 'Mixed ethnicity hair: unique texture blends' },
    not_specified: null,
};

const maleHairstyles = {
    oval: [{ name: "Textured Quiff", description: "Medium length on top, short sides", why: "Adds height without disrupting balance" }],
    round: [{ name: "High Pompadour", description: "Maximum height on top, tight fade", why: "Elongates face visually" }],
    square: [{ name: "Textured Crop", description: "Short textured top with skin fade", why: "Softens strong angular jawline" }],
    heart: [{ name: "Side Part with Volume", description: "Medium top, volume at sides", why: "Balances wider forehead" }],
    oblong: [{ name: "Side-Swept Fringe", description: "Longer fringe, medium sides", why: "Visually shortens face" }],
    diamond: [{ name: "Textured Fringe", description: "Forward bangs, tapered sides", why: "Widens narrow forehead" }],
};

const femaleHairstyles = {
    oval: [{ name: "Long Layers", description: "Waist length with face-framing layers", why: "Enhances natural balance" }],
    round: [{ name: "Long Layered with Side Part", description: "Long hair, deep side part", why: "Creates vertical lines" }],
    square: [{ name: "Soft Layers", description: "Layers starting at jawline", why: "Softens prominent angles" }],
    heart: [{ name: "Chin-Length Bob", description: "Bob with volume at ends", why: "Adds weight at narrow chin" }],
    oblong: [{ name: "Full Bangs", description: "Straight-across bangs, medium length", why: "Shortens face length" }],
    diamond: [{ name: "Side-Swept Long Layers", description: "Fullness at jaw and forehead", why: "Disguises narrow points" }],
};

const avoidByShape = {
    oval: { male: ["Heavy blunt bangs"], female: ["Severe pulled-back styles"] },
    round: { male: ["Buzz cuts with no top length"], female: ["Chin-length bobs without layers"] },
    square: { male: ["Flat top cuts"], female: ["Blunt chin-length cuts"] },
    heart: { male: ["Slicked back styles"], female: ["Pixie cuts exposing narrow jaw"] },
    oblong: { male: ["Tall pompadours"], female: ["Long straight hair with no layers"] },
    diamond: { male: ["Very short sides"], female: ["Flat, pulled-back styles"] },
};

const tipsForShape = {
    oval: { male: ["Experiment freely"], female: ["Focus on hair quality"] },
    round: { male: ["Height on top is key"], female: ["Long layers create movement"] },
    square: { male: ["Softness on top balances jaw"], female: ["Face-framing layers soften lines"] },
    heart: { male: ["Facial hair adds jaw width"], female: ["Chin-length styles add weight"] },
    oblong: { male: ["Horizontal emphasis is key"], female: ["Bangs are your powerful tool"] },
    diamond: { male: ["Widen forehead effectively"], female: ["Frame cheekbones, don't hide them"] },
};

const shapeLabels = {
    oval:    { label: "Oval Face",    emoji: "🥚", desc: "Balanced proportions." },
    round:   { label: "Round Face",   emoji: "🌕", desc: "Youthful appearance." },
    square:  { label: "Square Face",  emoji: "🔳", desc: "Powerful and defined." },
    heart:   { label: "Heart Face",   emoji: "💎", desc: "Delicate lower face." },
    oblong:  { label: "Oblong Face",  emoji: "📐", desc: "Elongated and elegant." },
    diamond: { label: "Diamond Face", emoji: "💠", desc: "Striking and dramatic." },
};

export function getHaircutRecommendations(
    metrics: MetricReport,
    gender: 'male' | 'female',
    hairProfile?: HairProfile
): FaceShapeProfile {
    const { shape, confidence } = classifyFaceShape(metrics, gender);
    const meta = shapeLabels[shape];
    const recs = gender === 'male' ? (maleHairstyles as any)[shape] : (femaleHairstyles as any)[shape];
    const avoid = (avoidByShape as any)[shape][gender];
    const tips = (tipsForShape as any)[shape][gender];

    const profile: FaceShapeProfile = {
        shape,
        label: meta.label,
        emoji: meta.emoji,
        description: meta.desc,
        confidence,
        recommendations: recs,
        avoid,
        stylingTips: tips,
    };

    if (hairProfile) {
        profile.hairProfile = hairProfile;
        profile.hairPSL = calculateHairPSL(hairProfile, shape, gender);
    }

    return profile;
}
