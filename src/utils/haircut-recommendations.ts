/**
 * Haircut Recommender Engine V2
 *
 * Classifies face shape from facial metric data, then maps to optimal
 * hairstyles segregated by gender. Incorporates hair type, texture,
 * thickness, and race/ethnicity for contextual recommendations.
 * Also contains the Hair PSL Scorer for evaluating hair quality and
 * its synergy with the user's face shape.
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
    hairTypeNote?: string; // Additional note for specific hair types
}

export interface HairPSLScore {
    score: number;          // 1-10 scale
    label: string;          // e.g., "Elite Hair" / "Average"
    breakdown: string[];    // Positive/negative factors
    faceShapeSynergy: number; // 0-100 score for how well hair fits face shape
    recommendations: string[];
}

export interface FaceShapeProfile {
    shape: FaceShape;
    label: string;
    emoji: string;
    description: string;
    confidence: number; // 0-100
    recommendations: HaircutRecommendation[];
    avoid: string[];
    stylingTips: string[];
    hairProfile?: HairProfile;
    hairPSL?: HairPSLScore;
}

// ============================================================
// FACE SHAPE CLASSIFIER
// ============================================================

interface FaceShapeInput {
    fwfhRatio: number;
    foreheadHeightRatio: number;
    bigonialWidthRatio: number;
    midfaceRatio: number;
    gonialAngle: number;
    lowerThirdRatio: number;
}

interface ShapeScore {
    shape: FaceShape;
    score: number;
}

export function classifyFaceShape(metrics: FaceShapeInput, _gender: 'male' | 'female'): { shape: FaceShape; confidence: number } {
    const { fwfhRatio, foreheadHeightRatio, bigonialWidthRatio, midfaceRatio, gonialAngle, lowerThirdRatio } = metrics;

    const scores: ShapeScore[] = [];

    // ── OBLONG ──────────────────────────────────────────────────────
    let oblongScore = 0;
    if (fwfhRatio < 1.40) oblongScore += 40;
    else if (fwfhRatio < 1.50) oblongScore += 15;
    if (lowerThirdRatio > 0.65) oblongScore += 20;
    if (foreheadHeightRatio >= 0.30 && foreheadHeightRatio <= 0.40) oblongScore += 15;
    if (bigonialWidthRatio >= 1.05 && bigonialWidthRatio <= 1.25) oblongScore += 15;
    if (gonialAngle >= 110 && gonialAngle <= 130) oblongScore += 10;
    scores.push({ shape: 'oblong', score: oblongScore });

    // ── OVAL ────────────────────────────────────────────────────────
    let ovalScore = 0;
    if (fwfhRatio >= 1.40 && fwfhRatio < 1.58) ovalScore += 35;
    else if (fwfhRatio >= 1.35 && fwfhRatio < 1.63) ovalScore += 15;
    if (bigonialWidthRatio >= 1.05 && bigonialWidthRatio <= 1.20) ovalScore += 25;
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
    if (bigonialWidthRatio >= 1.15) roundScore += 20;
    if (midfaceRatio >= 0.85 && midfaceRatio <= 1.10) roundScore += 10;
    if (lowerThirdRatio < 0.60) roundScore += 5;
    scores.push({ shape: 'round', score: roundScore });

    // ── SQUARE ──────────────────────────────────────────────────────
    let squareScore = 0;
    if (fwfhRatio >= 1.50) squareScore += 25;
    else if (fwfhRatio >= 1.42) squareScore += 10;
    if (gonialAngle >= 100 && gonialAngle <= 120) squareScore += 35;
    else if (gonialAngle > 120 && gonialAngle <= 128) squareScore += 10;
    if (bigonialWidthRatio >= 1.10 && bigonialWidthRatio <= 1.30) squareScore += 20;
    if (foreheadHeightRatio >= 0.28 && foreheadHeightRatio <= 0.36) squareScore += 10;
    if (lowerThirdRatio >= 0.60) squareScore += 10;
    scores.push({ shape: 'square', score: squareScore });

    // ── HEART ───────────────────────────────────────────────────────
    let heartScore = 0;
    if (bigonialWidthRatio < 1.05) heartScore += 40;
    else if (bigonialWidthRatio < 1.10) heartScore += 20;
    if (foreheadHeightRatio >= 0.32) heartScore += 25;
    else if (foreheadHeightRatio >= 0.28) heartScore += 10;
    if (fwfhRatio >= 1.38 && fwfhRatio <= 1.65) heartScore += 20;
    if (lowerThirdRatio < 0.62) heartScore += 15;
    scores.push({ shape: 'heart', score: heartScore });

    // ── DIAMOND ─────────────────────────────────────────────────────
    let diamondScore = 0;
    if (foreheadHeightRatio < 0.30) diamondScore += 30;
    else if (foreheadHeightRatio < 0.33) diamondScore += 10;
    if (bigonialWidthRatio < 1.08) diamondScore += 30;
    else if (bigonialWidthRatio < 1.12) diamondScore += 10;
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

/**
 * Scores hair on a 1-10 PSL scale based on:
 * - Hair type x face shape synergy
 * - Hair texture/thickness suitability
 * - Overall hair quality signals (uniform, groomed)
 * - Ethnic-appropriate styling potential
 */
export function calculateHairPSL(
    hairProfile: HairProfile,
    faceShape: FaceShape,
    gender: 'male' | 'female'
): HairPSLScore {
    const breakdown: string[] = [];
    const recommendations: string[] = [];
    let base = 5.0;

    // ── HAIR TYPE × FACE SHAPE SYNERGY ─────────────────────────────
    const synergy = hairTypeShapeSynergy[faceShape][hairProfile.type];
    base += synergy.bonus;
    if (synergy.bonus >= 0.5) breakdown.push(`${capitalize(hairProfile.type)} hair naturally suits ${faceShape} faces (+${synergy.bonus.toFixed(1)})`);
    else if (synergy.bonus <= -0.3) breakdown.push(`${capitalize(hairProfile.type)} hair fights the natural ${faceShape} proportions (${synergy.bonus.toFixed(1)})`);

    // ── HAIR TEXTURE ─────────────────────────────────────────────────
    const textureBonus = textureScores[hairProfile.texture];
    base += textureBonus;
    if (textureBonus > 0) breakdown.push(`${capitalize(hairProfile.texture)} texture adds visual depth and dimension (+${textureBonus.toFixed(1)})`);
    else if (textureBonus < 0) breakdown.push(`${capitalize(hairProfile.texture)} texture requires extra maintenance to look groomed (${textureBonus.toFixed(1)})`);

    // ── HAIR THICKNESS ────────────────────────────────────────────────
    if (hairProfile.thickness === 'thick') {
        base += 0.5;
        breakdown.push(`Thick hair: maximum styling versatility and fullness (+0.5)`);
    } else if (hairProfile.thickness === 'thin') {
        base -= 0.3;
        breakdown.push(`Thin hair: limits volume and density (-0.3)`);
        recommendations.push('Use volumizing products and avoid heavy oils/pomades');
        recommendations.push('Consider a shorter cut — thin hair looks thicker when shorter');
    } else {
        breakdown.push(`Medium thickness: standard versatility (±0.0)`);
    }

    // ── HAIRLINE STATUS (NEW V6.0) ────────────────────────────────────
    if (hairProfile.hairline === 'receding_slight') {
        base -= 0.4;
        breakdown.push(`Slight recession: minor temple loss detected (-0.4)`);
        recommendations.push('🚀 Hair Ascension: Start Minoxidil (Rogaine) 5% twice daily to maintain temple density');
        recommendations.push('Try a "textured fringe" style to naturally conceal early recession');
    } else if (hairProfile.hairline === 'receding_moderate') {
        base -= 0.8;
        breakdown.push(`Moderate recession: significant M-shape pattern detected (-0.8)`);
        recommendations.push('🚀 Hair Ascension: Consult a dermatologist about Finasteride/Dutasteride inhibitors');
        recommendations.push('Incorporate 1.5mm microneedling once per week to stimulate dormant follicles');
    } else if (hairProfile.hairline === 'thinning') {
        base -= 1.5;
        breakdown.push(`Active thinning: diffuse loss across the scalp detected (-1.5)`);
        recommendations.push('🚀 Hair Ascension: Advanced evaluation for FUE Hair Transplant or PRP therapy recommended');
        recommendations.push('Use Nizoral (Ketoconazole) shampoo 2-3x/week to reduce follicle-stifling inflammation');
    } else {
        breakdown.push(`Full hairline: healthy density and coverage (±0.0)`);
    }

    // ── ETHNICITY-SPECIFIC CONSIDERATIONS ────────────────────────────
    const ethnicNote = ethnicHairNotes[hairProfile.ethnicity];
    if (ethnicNote) {
        base += ethnicNote.bonus;
        breakdown.push(ethnicNote.note);
        if (ethnicNote.rec) recommendations.push(ethnicNote.rec);
    }

    // ── FACE SHAPE SYNERGY SCORE (0-100) ─────────────────────────────
    const mainBonus = synergy.bonus + (hairProfile.thickness === 'thick' ? 0.4 : hairProfile.thickness === 'thin' ? -0.2 : 0);
    const hairlineBonus = hairProfile.hairline === 'full' ? 0.2 : -0.3;
    const faceShapeSynergy = Math.round(50 + (mainBonus + hairlineBonus) * 25);
    const clampedSynergy = Math.min(100, Math.max(0, faceShapeSynergy));

    // ── GENDER-SPECIFIC BONUSES ───────────────────────────────────────
    if (gender === 'male' && hairProfile.type === 'straight' && hairProfile.thickness === 'thick') {
        base += 0.3;
        breakdown.push(`Thick straight hair = ideal male styling canvas (+0.3)`);
    }
    if (gender === 'female' && (hairProfile.type === 'wavy' || hairProfile.type === 'curly')) {
        base += 0.3;
        breakdown.push(`${capitalize(hairProfile.type)} hair adds femininity and movement (+0.3)`);
    }

    // Add face synergy notes
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

interface SynergyEntry {
    bonus: number;
    tips: string[];
}

// Synergy: how well each hair type works with each face shape
const hairTypeShapeSynergy: Record<FaceShape, Record<HairType, SynergyEntry>> = {
    oval: {
        straight: { bonus: 0.5, tips: ['Straight hair on an oval face: almost any cut works — focus on quality over correction'] },
        wavy:     { bonus: 0.7, tips: ['Wavy texture adds dimension without disrupting the balanced oval proportions'] },
        curly:    { bonus: 0.6, tips: ['Curly hair looks natural and expressive on an oval — just control definition'] },
        coily:    { bonus: 0.5, tips: ['Coily hair is very versatile on oval faces; try a TWA or defined fro for a striking look'] },
    },
    round: {
        straight: { bonus: 0.4, tips: ['Straight hair can create clean vertical lines — go long or use a quiff/pompadour to add height'] },
        wavy:     { bonus: 0.5, tips: ['Waves add texture that breaks the circular outline; keep volume on top, not on the sides'] },
        curly:    { bonus: -0.2, tips: ['Avoid wide curly volume at the sides — it exaggerates roundness; style with height on top'] },
        coily:    { bonus: -0.3, tips: ['Coily hair needs careful shaping for round faces; a tapered cut with height at the crown works best'] },
    },
    square: {
        straight: { bonus: 0.3, tips: ['Straight hair shows angles clearly — use texture and softness to complement, not contrast, the jaw'] },
        wavy:     { bonus: 0.7, tips: ['Wavy hair naturally softens the geometric lines of a square jaw — highly synergistic'] },
        curly:    { bonus: 0.8, tips: ['Curly texture is excellent for square faces — organic movement counteracts hard angles beautifully'] },
        coily:    { bonus: 0.6, tips: ['Coily hair adds volume and organic shape that softens square jaw geometry'] },
    },
    heart: {
        straight: { bonus: 0.3, tips: ['Straight hair needs chin-level volume to balance the wider forehead; side-swept styles help'] },
        wavy:     { bonus: 0.6, tips: ['Wavy hair adds softness and volume at the jaw, naturally balancing the heart proportions'] },
        curly:    { bonus: 0.5, tips: ["Curls below the chin are ideal for heart faces — they add width exactly where it's needed"] },
        coily:    { bonus: 0.4, tips: ['Shape coily hair to concentrate volume below the temples for optimal heart-face balance'] },
    },
    oblong: {
        straight: { bonus: -0.4, tips: ["Avoid long, pin-straight hair as it severely elongates the face; opt for a 'french crop' or 'fringe' to break the vertical line."] },
        wavy:     { bonus: 0.6, tips: ["Wavy hair adds the horizontal width oblong faces need — avoid very straight or very flat styles"] },
        curly:    { bonus: 0.8, tips: ["Curly hair is the ultimate oblong-face counter; the horizontal volume provides the perfect width to balance vertical length."] },
        coily:    { bonus: 0.8, tips: ["Coily hair is among the best for oblong faces — wide, full shapes add the width that counteract vertical length."] },
    },
    diamond: {
        straight: { bonus: 0.3, tips: ['Straight hair needs width-adding styling at forehead and jaw to balance diamond cheekbones'] },
        wavy:     { bonus: 0.5, tips: ['Wavy hair can add coverage and softness at the narrow forehead and jaw, balancing the cheekbones'] },
        curly:    { bonus: 0.4, tips: ['Curly hair adds volume at both the top and ends, helping balance the narrow points of a diamond face'] },
        coily:    { bonus: 0.5, tips: ['Full coily volume at the crown adds forehead width, balancing diamond face structure'] },
    },
};

// Texture bonuses
const textureScores: Record<HairTexture, number> = {
    fine:   -0.2,
    medium:  0.2,
    coarse:  0.0,
};

// Ethnicity-specific hair notes
interface EthnicNoteEntry {
    bonus: number;
    note: string;
    rec?: string;
}

const ethnicHairNotes: Record<EthnicBackground, EthnicNoteEntry | null> = {
    caucasian: {
        bonus: 0.0,
        note: 'Caucasian hair: typically fine to medium texture with high styling versatility',
        rec: 'Focus on cut precision and product-free grooming for best results',
    },
    east_asian: {
        bonus: 0.2,
        note: 'East Asian hair: naturally thick, straight, and glossy — among the highest quality hair (+0.2)',
        rec: 'Leverage the natural shine and thickness; avoid over-texturizing treatments',
    },
    south_asian: {
        bonus: 0.1,
        note: 'South Asian hair: typically thick and dark with high natural luster (+0.1)',
        rec: 'Oil-based treatments are traditional and beneficial; avoid heavy bleaching',
    },
    black_african: {
        bonus: 0.0,
        note: 'Black/African hair: highly textured coils with unique styling possibilities and versatility (±0.0)',
        rec: 'Moisture retention is key — deep conditioning 1-2x/week dramatically improves hair health and appearance',
    },
    hispanic_latino: {
        bonus: 0.1,
        note: 'Hispanic/Latino hair: typically medium-to-thick with natural wave/curl potential (+0.1)',
        rec: 'Enhance natural waves with curl-defining cream for a high-quality look',
    },
    middle_eastern: {
        bonus: 0.1,
        note: 'Middle Eastern hair: typically thick, dark, and lustrous with strong density (+0.1)',
        rec: 'Natural oils keep this hair type in excellent condition; embrace natural volume',
    },
    mixed: {
        bonus: 0.1,
        note: 'Mixed ethnicity hair: unique texture blends that often create distinctive, attractive qualities (+0.1)',
        rec: 'Identify your dominant hair type and build a routine around moisture or protein as needed',
    },
    not_specified: null,
};


// ============================================================
// HAIRSTYLE DATABASE
// ============================================================

const maleHairstyles: Record<FaceShape, HaircutRecommendation[]> = {
    oval: [
        { name: "Textured Quiff", description: "Medium length on top swept up and back with texture, short-to-medium sides", why: "Oval faces are the most versatile — a quiff adds height and structure without disrupting natural balance", hairTypeNote: "Works especially well with wavy or straight hair; curly hair can do a soft quiff with defined curls" },
        { name: "Classic Side Part", description: "Clean taper fade on the sides, longer top combed to one side with a defined part line", why: "The side part adds width definition and sophistication to the balanced oval proportions", hairTypeNote: "Ideal for straight and wavy hair; fine hair benefits from volumizing product" },
        { name: "Crew Cut", description: "Short all around, slightly longer on top, tapered sides and back", why: "Short styles complement the natural harmony of an oval face without competing with it", hairTypeNote: "Universal — works for all hair types" },
        { name: "Medium-Length Messy", description: "4-6 inches on top with natural waves or texture, pushed back or to the side", why: "The oval shape handles length well — medium messy hair adds personality without distortion", hairTypeNote: "Best for wavy or lightly curly hair; straight hair can use sea salt spray for texture" },
        { name: "Buzz Cut", description: "Short uniform length all around (#2-#4 guard)", why: "Oval faces have the bone structure to pull off the most minimal styles — the buzz reveals proportions", hairTypeNote: "Works for all hair types and ethnicities equally" },
    ],
    round: [
        { name: "High Volume Pompadour", description: "Maximum volume and height on top, tight fade on sides", why: "The height-to-width ratio of the pompadour elongates a round face, creating the illusion of more angular proportions", hairTypeNote: "Thick straight or wavy hair holds pompadour best; use strong hold pomade for fine hair" },
        { name: "Textured Spiky Hair", description: "Short sides with longer spiky top styled upward", why: "Vertical spikes draw the eye up, visually lengthening the face and counteracting roundness", hairTypeNote: "Straight and wavy hair are ideal; coily hair can do a high-top taper for the same vertical effect" },
        { name: "Angular Fringe", description: "Longer textured fringe swept diagonally across the forehead, undercut sides", why: "The diagonal line of the fringe breaks the circular symmetry and adds angularity", hairTypeNote: "Straight and wavy hair execute this cleanly; avoid for coily hair" },
        { name: "Faux Hawk", description: "Center strip of longer hair styled upward, short graduated sides", why: "The central height peak creates a vertical focal point that offsets round proportions", hairTypeNote: "Works across hair types; coily/curly faux hawks are particularly dynamic" },
        { name: "Side-Swept Undercut", description: "Disconnected undercut with medium-length top swept to one side", why: "The asymmetry and height contrast create angular lines that counteract facial roundness", hairTypeNote: "Straight and wavy hair are optimal for clean sweep; curly hair creates a softer version" },
    ],
    square: [
        { name: "Textured Crop", description: "Short textured top with a natural, slightly messy finish and a skin fade", why: "The textured crop softens the strong angular jawline without hiding it — it complements the masculine structure", hairTypeNote: "Curly and wavy hair naturally create better texture; straight hair needs product for similar effect" },
        { name: "Slicked Back", description: "Medium-to-long top slicked straight back with a low or mid fade", why: "Exposes the strong jawline while adding length on top — highlights the square face's best asset", hairTypeNote: "Straight and wavy hair slick back cleanly; avoid for coily hair" },
        { name: "Short Caesar", description: "Short, uniform length with a straight-across fringe", why: "Clean and structured, this style matches the geometric precision of a square jawline", hairTypeNote: "Works best for straight and slightly wavy hair; coily hair can do a very short version" },
        { name: "Classic Taper", description: "Gradually tapered sides and back, slightly longer on top", why: "The gradual taper adds softness around the temples while letting the jawline speak for itself", hairTypeNote: "Universal — all hair types receive tapers well; coily hair creates a natural rounded shape on top" },
        { name: "Messy Medium Length", description: "4-5 inches on top styled with intentional bedhead texture", why: "The organic texture softens the hard angles while the length creates vertical dimension", hairTypeNote: "Wavy and curly hair naturally achieve this; straight hair needs texturizing spray or light wax" },
    ],
    heart: [
        { name: "Side Part with Volume", description: "Medium-length top with a deep side part, graduated sides, volume at the sides", why: "Width at the sides balances the wider forehead-to-narrow-jaw ratio of a heart face", hairTypeNote: "Wavy and curly hair create natural side volume; straight hair needs blow-drying with round brush" },
        { name: "Medium Fringe", description: "Longer bangs that fall across the forehead, tapering at the sides", why: "The fringe conceals the wider forehead, bringing the proportions into better balance", hairTypeNote: "Any hair type works; fine hair should use lighter fringe to avoid flatness" },
        { name: "Textured Layers", description: "Layered medium-length cut with texture throughout", why: "Layers add width around the jawline area, compensating for the narrower lower face", hairTypeNote: "Wavy and curly hair are naturals for this; coily hair should consider a tapered cuts with defined layers" },
        { name: "Chin-Length Shag", description: "Rounded layers that hit at the jawline, longer front pieces", why: "Length at the jaw creates the illusion of a wider lower face, balancing the heart shape", hairTypeNote: "Wavy and curly hair shine with a shag cut; straight hair needs more layering for movement" },
        { name: "Low Fade with Textured Top", description: "Clean low fade with 2-3 inches of textured hair on top", why: "Avoids adding height at the forehead, while the low fade doesn't narrow the sides further", hairTypeNote: "Universal; coily hair adds natural texture that works perfectly with a low fade" },
    ],
    oblong: [
        { name: "Side-Swept Fringe", description: "Longer fringe swept to one side, medium sides with natural volume", why: "The horizontal line of the fringe visually shortens the face, while side volume adds width", hairTypeNote: "Wavy and straight hair drape well as fringe; coily hair can achieve a twist-out fringe look" },
        { name: "Curtain Bangs", description: "Center-parted longer bangs that frame the face, medium length throughout", why: "Curtain bangs break up vertical length and create a horizontal frame across the forehead", hairTypeNote: "Straight and wavy hair execute curtain bangs best; curly hair creates a softer, natural frame" },
        { name: "Textured Crop with Fringe", description: "Short textured top with a forward fringe, tapered sides", why: "The forward fringe shortens the visible forehead, reducing the appearance of length", hairTypeNote: "All hair types work; coily hair should keep length shorter for a defined crop" },
        { name: "Classic Medium Length", description: "Even length (3-5 inches) all around, styled with volume at the sides", why: "Avoiding extremes in height — even length adds width without elongating further", hairTypeNote: "Wavy and curly hair naturally add side volume; straight hair should use a diffuser during blow-drying" },
        { name: "Layered Waves", description: "Medium waves with layers that add volume at ear level", why: "Volume at the sides widens the apparent face shape, counteracting the narrowing effect of length", hairTypeNote: "Wavy and curly hair are ideally suited; straight hair needs a perm or texturizing treatment for this effect" },
    ],
    diamond: [
        { name: "Textured Fringe", description: "Forward-falling textured bangs with tapered sides and nape", why: "The fringe widens the narrow forehead while the taper doesn't compete with the prominent cheekbones", hairTypeNote: "Straight and wavy hair create a clean fringe; curly hair creates a softer, wider version which is also effective" },
        { name: "Side Part with Length", description: "Longer top swept to one side with graduated sides", why: "The sweep and length at the forehead balance the narrow temples against the wide cheekbones", hairTypeNote: "Straight and wavy hair drape best; thick hair should be layered to avoid heaviness" },
        { name: "Chin-Length Layers", description: "Layers hitting at the jaw to add width at the narrowest point", why: "Adding visual weight at the jawline compensates for the narrow lower face in a diamond shape", hairTypeNote: "Wavy and curly hair add natural width at the jaw; straight hair needs layering for movement" },
        { name: "Voluminous Quiff", description: "Full quiff with height and forward volume, tight sides", why: "The quiff adds forehead width at the widest point — tight sides emphasize cheekbone structure", hairTypeNote: "Thick straight or wavy hair holds the best quiff; fine hair should use volume spray" },
        { name: "Messy Tousled Top", description: "Intentionally messy medium-length top with a natural part", why: "The organic texture softens the angular cheekbone prominence while adding forehead coverage", hairTypeNote: "Wavy and curly hair achieve this naturally; straight hair needs product for messy texture" },
    ],
};

const femaleHairstyles: Record<FaceShape, HaircutRecommendation[]> = {
    oval: [
        { name: "Long Layers", description: "Waist-length hair with face-framing layers starting at the chin", why: "Oval faces suit virtually anything — long layers enhance natural balance without distortion", hairTypeNote: "Waves and curls look stunning with long layers; straight hair can use subtle layers for movement" },
        { name: "Blunt Bob", description: "Chin-to-shoulder length straight-across bob", why: "The clean lines of a blunt bob showcase the balanced proportions of an oval face perfectly", hairTypeNote: "Straight and wavy hair execute a blunt bob best; fine hair looks thicker in a blunt cut" },
        { name: "Curtain Bangs", description: "Center-parted feathered bangs that frame the face", why: "Adds dimension and softness around the eyes while complementing the oval shape naturally", hairTypeNote: "Straight and wavy hair create the most elegant curtain bangs; fine hair benefits from lightweight curtain fringe" },
        { name: "Loose Beach Waves", description: "Mid-length hair with effortless waves throughout", why: "The movement and softness of waves play beautifully against balanced oval proportions", hairTypeNote: "Natural wavy hair is ideal; straight hair can use a large-barrel wand; curly hair benefits from stretch-and-define" },
        { name: "High Ponytail", description: "Hair swept up into a high pony, with face-framing pieces", why: "Reveals the balanced bone structure of an oval face while adding vertical lift", hairTypeNote: "All hair types and ethnicities — high ponytails are universally flattering on oval faces" },
    ],
    round: [
        { name: "Long Layered with Side Part", description: "Long hair with layers starting below the chin, deep side part", why: "The length and angles create vertical lines that elongate a round face, while layers add definition", hairTypeNote: "All hair types; coily hair in a blowout or stretched style achieves this elongation effect" },
        { name: "Lob with Side-Swept Bangs", description: "Long bob hitting at the collarbone with angled bangs", why: "The angular lob creates defined lines that counteract facial roundness", hairTypeNote: "Straight and wavy hair execute the angled lob crisply; curly hair creates a softer version" },
        { name: "High Volume Blowout", description: "Voluminous round blowout with height at the crown", why: "Height at the crown adds vertical dimension, elongating the round face shape", hairTypeNote: "All hair types; coily and curly hair achieve spectacular natural volume with a diffused blowout" },
        { name: "Waterfall Layers", description: "Cascading layers that start at the cheekbone and flow down", why: "The layering creates angular movement that breaks the circular outline of a round face", hairTypeNote: "Wavy and curly hair are stunning with waterfall layers; straight hair needs more layering passes" },
        { name: "Sleek Center Part", description: "Long straight hair with a precise center part", why: "The vertical center line and length draw the eye down, elongating the appearance", hairTypeNote: "Straight hair is ideal; wavy and curly hair can be straightened or stretched; coily hair can rock a blowout center part" },
    ],
    square: [
        { name: "Soft Layers Around the Face", description: "Layers starting at the jawline, softening the angles with movement", why: "Layering at the jaw softens the prominent angular jawline while highlighting cheekbones", hairTypeNote: "Wavy and curly hair create the most natural softening effect; straight hair needs more layering passes" },
        { name: "Side-Swept Waves", description: "Long waves swept to one side with a deep part", why: "The asymmetry and soft waves counteract the geometric angles of a square face", hairTypeNote: "Natural wavy hair shines here; straight hair can use a wand; curly hair creates a romantic, soft version" },
        { name: "Wispy Bangs", description: "Light, airy bangs that sweep across the forehead", why: "Wispy bangs create softness at the top to balance the strong jawline below", hairTypeNote: "Fine and medium textured hair creates better wispy bangs; coarse hair may need thinning shears" },
        { name: "Textured Long Bob", description: "Shoulder-length bob with lived-in texture", why: "The texture breaks up hard lines while the length draws attention to the neck, away from the jaw", hairTypeNote: "Wavy and curly hair naturally achieve lived-in texture; straight hair benefits from sea salt spray" },
        { name: "Loose Romantic Curls", description: "Long bouncy curls with volume throughout", why: "Curls create organic shapes that soften the angular structure of a square face beautifully", hairTypeNote: "Naturally curly hair is ideal; straight and wavy hair can use a curling wand for a similar effect" },
    ],
    heart: [
        { name: "Chin-Length Bob", description: "Bob cut that hits right at the chin with subtle volume at the ends", why: "Width at the chin balances the wider forehead, creating harmony across the face", hairTypeNote: "All hair types; wavy and curly hair create natural volume at the chin level" },
        { name: "Side-Swept Bangs with Layers", description: "Layered medium-length with side bangs covering part of the forehead", why: "Reduces the visual width of the forehead while layers add body around the narrow jaw", hairTypeNote: "Straight and wavy hair handle side bangs best; fine hair benefits from light-density bangs" },
        { name: "Shoulder-Length Waves", description: "Medium-length hair with waves concentrated from mid-length to ends", why: "Volume at the bottom half adds width where the face is narrowest", hairTypeNote: "Wavy and curly hair are naturals; straight hair with a volume-boosting cut and wand styling works well" },
        { name: "Textured Lob", description: "Long bob with tousled texture and a center or off-center part", why: "The texture adds fullness at jaw-level, compensating for the narrower lower face", hairTypeNote: "Curly and wavy hair shine with a textured lob; straight hair needs product for the tousled effect" },
        { name: "Curtain Bangs with Long Layers", description: "Face-framing curtain bangs flowing into long layered hair", why: "Curtain bangs minimize forehead width while the long layers balance proportions overall", hairTypeNote: "Straight and wavy hair execute this best; curly hair creates a romantically framed version" },
    ],
    oblong: [
        { name: "Full Bangs with Medium Length", description: "Straight-across bangs with shoulder-length hair", why: "Full bangs create a horizontal line that visually shortens the long face dramatically", hairTypeNote: "Straight hair for clean blunt bangs; wavy hair for a softer fringe; coily hair can do twist-out bangs" },
        { name: "Voluminous Waves", description: "Bouncy waves that add width at the cheek and ear level", why: "Side volume is the most effective way to widen a narrow oblong face, waves do this naturally", hairTypeNote: "Wavy and curly hair are highly synergistic; coily hair is exceptional for this — wide shapes add needed width" },
        { name: "Layered Bob", description: "Chin-length bob with graduated layers for maximum width", why: "The shorter length prevents elongation while layers add width at the widest point", hairTypeNote: "All hair types; wavy and curly hair create the most natural width in a layered bob" },
        { name: "Side Part with Body Waves", description: "Deep side part with loose waves adding volume at temple height", why: "The side part and wave volume create width that counteracts the facial length", hairTypeNote: "Wavy hair is ideal; straight hair can use Velcro rollers for body waves; curly hair looks luxurious in this style" },
        { name: "Textured Shag", description: "Layered shag cut with movement at all levels", why: "The multi-level layers create width and dimension at every point, countering length", hairTypeNote: "Wavy and curly hair are the natural match for a shag cut; straight hair needs a skilled layering technique" },
    ],
    diamond: [
        { name: "Side-Swept Long Layers", description: "Long layers swept to one side, fullness at the jaw and forehead", why: "Adding width at the forehead and jaw disguises the narrow points while highlighting cheekbones", hairTypeNote: "All hair types; wavy and curly hair add natural width; straight hair should use a deep side part with body" },
        { name: "Chin-Length Textured Bob", description: "Textured bob with volume concentrated at chin level", why: "The chin-level volume widens the narrow jawline, balancing against prominent cheekbones", hairTypeNote: "Wavy and curly hair create natural chin-level volume; straight hair needs a rounded cut and blow-dry" },
        { name: "Full Fringe with Length", description: "Straight or wispy bangs with long hair", why: "The fringe widens the narrow forehead while long hair adds weight at the narrow lower face", hairTypeNote: "Straight hair for blunt fringe; fine hair for wispy fringe; curly hair for a natural wispy effect" },
        { name: "Half-Up Half-Down", description: "Top section pulled up, bottom flowing freely with volume", why: "Creates width at the forehead while the flowing bottom balances the narrow jaw", hairTypeNote: "All hair types; curly and coily hair have the most natural volume in the flowing bottom section" },
        { name: "Soft Curls at the Ends", description: "Straight-to-wavy with curls concentrated at the tips", why: "Curls at the ends add jaw-level width, compensating for diamond shape's narrow lower face", hairTypeNote: "Naturally curly hair is ideal; straight and wavy hair can use a curling iron on the ends only" },
    ],
};

const avoidByShape: Record<FaceShape, { male: string[]; female: string[] }> = {
    oval: {
        male: ["Extremely long curtain styles that hide your face shape", "Heavy blunt bangs that unnecessarily cover your balanced forehead"],
        female: ["Severe pulled-back styles that flatten the hair against the head", "Ultra-short pixie cuts unless bone structure is exceptionally strong"],
    },
    round: {
        male: ["Buzz cuts with no top length — emphasizes roundness", "Chin-length bowl cuts flat against the head", "Anything adding width at the ears"],
        female: ["Chin-length bobs without layers (adds width)", "Blunt bangs straight across (widens the face)", "Pulled-back ponytails revealing the full round outline"],
    },
    square: {
        male: ["Flat top cuts that mirror the jawline geometry", "Very long straight hair that emphasizes jaw width"],
        female: ["Blunt chin-length cuts that emphasize the jaw edge", "Super slicked-back styles revealing the full jawline", "Severe center parts with zero body"],
    },
    heart: {
        male: ["Slicked back styles exposing the full wide forehead", "Very short sides with volume on top (amplifies top-heaviness)", "No-fringe buzz cuts"],
        female: ["Voluminous top-only styles that widen the forehead more", "Pixie cuts that expose the narrow jawline", "Severely pulled-back updos"],
    },
    oblong: {
        male: ["Tall pompadours or quiffs that add more height", "Very long straight hair flowing down (emphasizes length)", "Center-parted styles with no width"],
        female: ["Long straight hair with no layers (elongates further)", "Top knots or high buns that add height", "Severe center parts with flat sides"],
    },
    diamond: {
        male: ["Slicked tight styles that expose the narrow forehead and jaw", "Very short sides that widen the cheekbones further"],
        female: ["Flat, pulled-back styles exposing the narrow forehead", "Volume at cheekbone level (makes face look wider at the midpoint only)"],
    },
};

const tipsForShape: Record<FaceShape, { male: string[]; female: string[] }> = {
    oval: {
        male: ["You have the most versatile face shape — experiment freely", "Focus on styles that match your personality rather than compensating for structure", "Both short and long styles work equally well"],
        female: ["Almost any style flatters you — focus on hair texture and quality", "Use accessories and color to express personality since shape isn't a constraint", "Try bold changes — you can pull off more than most face shapes"],
    },
    round: {
        male: ["Always opt for length and height on top to create vertical balance", "Keep the sides tight — volume at the sides amplifies roundness", "Angular styles with sharp lines combat softness effectively"],
        female: ["Long layers are your best friend — they create vertical movement", "A deep side part adds asymmetry and breaks the circular outline", "Avoid tucking hair behind both ears simultaneously — keep some framing"],
    },
    square: {
        male: ["Your strong jaw is an asset — complement it, don't compete with it", "Texture and softness on top balance the hard angles below", "Avoid geometric/angular styles that mirror the jaw shape"],
        female: ["Soft, flowing textures counteract angles beautifully", "Face-framing layers at the jaw soften the strong line", "Volume at cheekbone level draws attention upward from the jaw"],
    },
    heart: {
        male: ["Width at the jaw level is your goal — avoid height-only styles", "Bangs or a fringe reduce the forehead-to-jaw imbalance", "Facial hair (if possible) adds jaw width naturally"],
        female: ["Chin-length styles add visual weight where you need it most", "Side-swept bangs are universally flattering for heart faces", "Avoid piling all volume above the ears"],
    },
    oblong: {
        male: ["Horizontal emphasis is key — never add more height", "Bangs or a fringe are essential to shorten the visual face length", "Side volume at the ears creates the width needed for balance"],
        female: ["Bangs or fringe are your single most powerful tool", "Avoid extra length beyond the collarbone without layers", "Waves and curls add the width that oblong faces need"],
    },
    diamond: {
        male: ["Focus on adding width at the forehead and jaw simultaneously", "A textured fringe widens the narrow forehead effectively", "Avoid tight sides that make cheekbones look even wider"],
        female: ["Your cheekbones are striking — frame them, don't hide them", "Add width at the forehead with bangs or volume at the crown", "Chin-level styling adds the jaw width that balances diamond shapes"],
    },
};

const shapeLabels: Record<FaceShape, { label: string; emoji: string; desc: string }> = {
    oval:    { label: "Oval Face",    emoji: "🥚", desc: "Balanced proportions with slightly longer face than wide. The most versatile face shape." },
    round:   { label: "Round Face",   emoji: "🌕", desc: "Width and length are similar with full cheeks and a soft jawline. Youthful appearance." },
    square:  { label: "Square Face",  emoji: "🔳", desc: "Strong angular jawline with face width roughly equal to jaw width. Powerful and defined." },
    heart:   { label: "Heart Face",   emoji: "💎", desc: "Wide forehead tapering to a narrow chin. Prominent cheekbones with a delicate lower face." },
    oblong:  { label: "Oblong Face",  emoji: "📐", desc: "Significantly longer than wide with balanced proportions. Elongated and elegant." },
    diamond: { label: "Diamond Face", emoji: "💠", desc: "Narrow forehead and jaw with wide, prominent cheekbones. Dramatic and striking." },
};

// ============================================================
// PUBLIC API
// ============================================================

export function getHaircutRecommendations(
    metrics: FaceShapeInput,
    gender: 'male' | 'female',
    hairProfile?: HairProfile
): FaceShapeProfile {
    const { shape, confidence } = classifyFaceShape(metrics, gender);
    const meta = shapeLabels[shape];
    const recs = gender === 'male' ? maleHairstyles[shape] : femaleHairstyles[shape];
    const avoid = avoidByShape[shape][gender];
    const tips = tipsForShape[shape][gender];

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

        // --- RECEDING / THINNING HAIR LOGIC ---
        if (gender === 'male' && hairProfile.hairline !== 'full') {
            const hairlineRecs: HaircutRecommendation[] = [];
            
            if (hairProfile.hairline === 'receding_slight') {
                hairlineRecs.push({
                    name: "Textured Crop / Fringe",
                    description: "Short textured hair sweeping forward over the hairline",
                    why: "A forward-swept textured crop naturally covers a slightly receding hairline without looking like a comb-over.",
                    hairTypeNote: "Works effectively with matte styling products to thicken appearance."
                });
            } else if (hairProfile.hairline === 'receding_moderate') {
                hairlineRecs.push({
                    name: "Buzz Cut / Crew Cut",
                    description: "Very short hair overall, minimizing the contrast between hair and forehead",
                    why: "Shortening the hair reduces the visual contrast of the receding temples, making the hairline look intentional.",
                    hairTypeNote: "Low maintenance. Embrace the mature look."
                });
                hairlineRecs.push({
                    name: "Slicked Back",
                    description: "Hair grown out slightly and styled cleanly back",
                    why: "Rather than hiding it, owning the receding hairline with a slick-back gives a distinguished, confident appearance.",
                    hairTypeNote: "Requires some density on top to pull off effectively."
                });
            } else if (hairProfile.hairline === 'thinning') {
                hairlineRecs.push({
                    name: "Clean Shave / Skin Fade Buzz",
                    description: "Completely shaved head or a very tight buzz cut with skin fade sides",
                    why: "The cleanest, most confident approach to thinning hair. Removes the patchy appearance completely.",
                    hairTypeNote: "Pairs excellently with well-groomed facial hair."
                });
            }

            if (hairlineRecs.length > 0) {
                profile.recommendations = [...hairlineRecs, ...profile.recommendations];
                profile.stylingTips.unshift("Your hairline was factored into these choices. Embrace shorter styles or forward-swept texture to manage recession confidently.");
            }
        }
    }

    return profile;
}
