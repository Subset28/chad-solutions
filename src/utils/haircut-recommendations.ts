/**
 * Haircut Recommender Engine V1
 * 
 * Classifies face shape from existing facial metric data, then maps 
 * to optimal hairstyles segregated by gender. Uses fWHR, forehead ratio,
 * bigonial width, midface compactness, and gonial angle as primary classifiers.
 */

export type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond';

export interface HaircutRecommendation {
    name: string;
    description: string;
    why: string;
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
}

// ============================================================
// FACE SHAPE CLASSIFIER
// ============================================================

interface FaceShapeInput {
    fwfhRatio: number;        // Face width-to-height ratio
    foreheadHeightRatio: number;
    bigonialWidthRatio: number; // Jaw width relative to cheekbones
    midfaceRatio: number;
    gonialAngle: number;
    lowerThirdRatio: number;
}

interface ShapeScore {
    shape: FaceShape;
    score: number;
}

export function classifyFaceShape(metrics: FaceShapeInput, gender: 'male' | 'female'): { shape: FaceShape; confidence: number } {
    const scores: ShapeScore[] = [];

    const { fwfhRatio, foreheadHeightRatio, bigonialWidthRatio, midfaceRatio, gonialAngle, lowerThirdRatio } = metrics;

    // OVAL: Balanced proportions, slightly longer than wide, jaw narrower than cheekbones
    let ovalScore = 0;
    if (fwfhRatio >= 1.35 && fwfhRatio <= 1.65) ovalScore += 30;
    if (bigonialWidthRatio >= 1.05 && bigonialWidthRatio <= 1.20) ovalScore += 25;
    if (foreheadHeightRatio >= 0.28 && foreheadHeightRatio <= 0.35) ovalScore += 20;
    if (midfaceRatio >= 0.80 && midfaceRatio <= 1.00) ovalScore += 15;
    if (lowerThirdRatio >= 0.58 && lowerThirdRatio <= 0.68) ovalScore += 10;
    scores.push({ shape: 'oval', score: ovalScore });

    // ROUND: Width and height are similar, full cheeks, soft jawline
    let roundScore = 0;
    if (fwfhRatio >= 1.55) roundScore += 30;
    if (bigonialWidthRatio >= 1.15) roundScore += 20;
    if (gonialAngle > 130) roundScore += 25;
    if (midfaceRatio >= 0.80 && midfaceRatio <= 1.10) roundScore += 15;
    if (lowerThirdRatio < 0.62) roundScore += 10;
    scores.push({ shape: 'round', score: roundScore });

    // SQUARE: Strong angular jawline, wide jaw, face width ≈ jaw width
    let squareScore = 0;
    if (fwfhRatio >= 1.50) squareScore += 20;
    if (bigonialWidthRatio >= 1.10 && bigonialWidthRatio <= 1.30) squareScore += 25;
    if (gonialAngle >= 105 && gonialAngle <= 125) squareScore += 30;
    if (foreheadHeightRatio >= 0.28 && foreheadHeightRatio <= 0.36) squareScore += 15;
    if (lowerThirdRatio >= 0.62) squareScore += 10;
    scores.push({ shape: 'square', score: squareScore });

    // HEART: Wide forehead, narrow jaw, prominent cheekbones
    let heartScore = 0;
    if (foreheadHeightRatio >= 0.32) heartScore += 25;
    if (bigonialWidthRatio < 1.10) heartScore += 30;
    if (fwfhRatio >= 1.40 && fwfhRatio <= 1.65) heartScore += 20;
    if (lowerThirdRatio < 0.62) heartScore += 15;
    if (midfaceRatio >= 0.75 && midfaceRatio <= 0.95) heartScore += 10;
    scores.push({ shape: 'heart', score: heartScore });

    // OBLONG: Face is significantly longer than it is wide
    let oblongScore = 0;
    if (fwfhRatio < 1.45) oblongScore += 35;
    if (midfaceRatio < 0.80) oblongScore += 25;
    if (foreheadHeightRatio >= 0.30 && foreheadHeightRatio <= 0.38) oblongScore += 15;
    if (lowerThirdRatio > 0.65) oblongScore += 15;
    if (bigonialWidthRatio < 1.15) oblongScore += 10;
    scores.push({ shape: 'oblong', score: oblongScore });

    // DIAMOND: Narrow forehead, narrow jaw, wide cheekbones
    let diamondScore = 0;
    if (foreheadHeightRatio < 0.30) diamondScore += 25;
    if (bigonialWidthRatio < 1.10) diamondScore += 25;
    if (fwfhRatio >= 1.40 && fwfhRatio <= 1.60) diamondScore += 20;
    if (midfaceRatio >= 0.75 && midfaceRatio <= 1.00) diamondScore += 20;
    if (gonialAngle >= 115 && gonialAngle <= 135) diamondScore += 10;
    scores.push({ shape: 'diamond', score: diamondScore });

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];
    const totalPossible = 100;
    const confidence = Math.min(95, Math.round((best.score / totalPossible) * 100));

    return { shape: best.shape, confidence };
}

// ============================================================
// HAIRSTYLE DATABASE
// ============================================================

const maleHairstyles: Record<FaceShape, HaircutRecommendation[]> = {
    oval: [
        { name: "Textured Quiff", description: "Medium length on top swept up and back with texture, short-to-medium sides", why: "Oval faces are the most versatile — a quiff adds height and structure without disrupting natural balance" },
        { name: "Classic Side Part", description: "Clean taper fade on the sides, longer top combed to one side with a defined part line", why: "The side part adds width definition and sophistication to the balanced oval proportions" },
        { name: "Crew Cut", description: "Short all around, slightly longer on top, tapered sides and back", why: "Short styles complement the natural harmony of an oval face without competing with it" },
        { name: "Medium-Length Messy", description: "4-6 inches on top with natural waves or texture, pushed back or to the side", why: "The oval shape handles length well — medium messy hair adds personality without distortion" },
        { name: "Buzz Cut", description: "Short uniform length all around (#2-#4 guard)", why: "Oval faces have the bone structure to pull off the most minimal styles — the buzz reveals proportions" },
    ],
    round: [
        { name: "High Volume Pompadour", description: "Maximum volume and height on top, tight fade on sides", why: "The height-to-width ratio of the pompadour elongates a round face, creating the illusion of more angular proportions" },
        { name: "Textured Spiky Hair", description: "Short sides with longer spiky top styled upward", why: "Vertical spikes draw the eye up, visually lengthening the face and counteracting roundness" },
        { name: "Angular Fringe", description: "Longer textured fringe swept diagonally across the forehead, undercut sides", why: "The diagonal line of the fringe breaks the circular symmetry and adds angularity" },
        { name: "Faux Hawk", description: "Center strip of longer hair styled upward, short graduated sides", why: "The central height peak creates a vertical focal point that offsets round proportions" },
        { name: "Side-Swept Undercut", description: "Disconnected undercut with medium-length top swept to one side", why: "The asymmetry and height contrast create angular lines that counteract facial roundness" },
    ],
    square: [
        { name: "Textured Crop", description: "Short textured top with a natural, slightly messy finish and a skin fade", why: "The textured crop softens the strong angular jawline without hiding it — it complements the masculine structure" },
        { name: "Slicked Back", description: "Medium-to-long top slicked straight back with a low or mid fade", why: "Exposes the strong jawline while adding length on top — highlights the square face's best asset" },
        { name: "Short Caesar", description: "Short, uniform length with a straight-across fringe", why: "Clean and structured, this style matches the geometric precision of a square jawline" },
        { name: "Classic Taper", description: "Gradually tapered sides and back, slightly longer on top", why: "The gradual taper adds softness around the temples while letting the jawline speak for itself" },
        { name: "Messy Medium Length", description: "4-5 inches on top styled with intentional bedhead texture", why: "The organic texture softens the hard angles while the length creates vertical dimension" },
    ],
    heart: [
        { name: "Side Part with Volume", description: "Medium-length top with a deep side part, graduated sides, volume at the sides", why: "Width at the sides balances the wider forehead-to-narrow-jaw ratio of a heart face" },
        { name: "Medium Fringe", description: "Longer bangs that fall across the forehead, tapering at the sides", why: "The fringe conceals the wider forehead, bringing the proportions into better balance" },
        { name: "Textured Layers", description: "Layered medium-length cut with texture throughout", why: "Layers add width around the jawline area, compensating for the narrower lower face" },
        { name: "Chin-Length Shag", description: "Rounded layers that hit at the jawline, longer front pieces", why: "Length at the jaw creates the illusion of a wider lower face, balancing the heart shape" },
        { name: "Low Fade with Textured Top", description: "Clean low fade with 2-3 inches of textured hair on top", why: "Avoids adding height at the forehead, while the low fade doesn't narrow the sides further" },
    ],
    oblong: [
        { name: "Side-Swept Fringe", description: "Longer fringe swept to one side, medium sides with natural volume", why: "The horizontal line of the fringe visually shortens the face, while side volume adds width" },
        { name: "Curtain Bangs", description: "Center-parted longer bangs that frame the face, medium length throughout", why: "Curtain bangs break up vertical length and create a horizontal frame across the forehead" },
        { name: "Textured Crop with Fringe", description: "Short textured top with a forward fringe, tapered sides", why: "The forward fringe shortens the visible forehead, reducing the appearance of length" },
        { name: "Classic Medium Length", description: "Even length (3-5 inches) all around, styled with volume at the sides", why: "Avoiding extremes in height — even length adds width without elongating further" },
        { name: "Layered Waves", description: "Medium waves with layers that add volume at ear level", why: "Volume at the sides widens the apparent face shape, counteracting the narrowing effect of length" },
    ],
    diamond: [
        { name: "Textured Fringe", description: "Forward-falling textured bangs with tapered sides and nape", why: "The fringe widens the narrow forehead while the taper doesn't compete with the prominent cheekbones" },
        { name: "Side Part with Length", description: "Longer top swept to one side with graduated sides", why: "The sweep and length at the forehead balance the narrow temples against the wide cheekbones" },
        { name: "Chin-Length Layers", description: "Layers hitting at the jaw to add width at the narrowest point", why: "Adding visual weight at the jawline compensates for the narrow lower face in a diamond shape" },
        { name: "Voluminous Quiff", description: "Full quiff with height and forward volume, tight sides", why: "The quiff adds forehead width at the widest point — tight sides emphasize cheekbone structure" },
        { name: "Messy Tousled Top", description: "Intentionally messy medium-length top with a natural part", why: "The organic texture softens the angular cheekbone prominence while adding forehead coverage" },
    ],
};

const femaleHairstyles: Record<FaceShape, HaircutRecommendation[]> = {
    oval: [
        { name: "Long Layers", description: "Waist-length hair with face-framing layers starting at the chin", why: "Oval faces suit virtually anything — long layers enhance natural balance without distortion" },
        { name: "Blunt Bob", description: "Chin-to-shoulder length straight-across bob", why: "The clean lines of a blunt bob showcase the balanced proportions of an oval face perfectly" },
        { name: "Curtain Bangs", description: "Center-parted feathered bangs that frame the face", why: "Adds dimension and softness around the eyes while complementing the oval shape naturally" },
        { name: "Loose Beach Waves", description: "Mid-length hair with effortless waves throughout", why: "The movement and softness of waves play beautifully against balanced oval proportions" },
        { name: "High Ponytail", description: "Hair swept up into a high pony, with face-framing pieces", why: "Reveals the balanced bone structure of an oval face while adding vertical lift" },
    ],
    round: [
        { name: "Long Layered with Side Part", description: "Long hair with layers starting below the chin, deep side part", why: "The length and angles create vertical lines that elongate a round face, while layers add definition" },
        { name: "Lob with Side-Swept Bangs", description: "Long bob hitting at the collarbone with angled bangs", why: "The angular lob creates defined lines that counteract facial roundness" },
        { name: "High Volume Blowout", description: "Voluminous round blowout with height at the crown", why: "Height at the crown adds vertical dimension, elongating the round face shape" },
        { name: "Waterfall Layers", description: "Cascading layers that start at the cheekbone and flow down", why: "The layering creates angular movement that breaks the circular outline of a round face" },
        { name: "Sleek Center Part", description: "Long straight hair with a precise center part", why: "The vertical center line and length draw the eye down, elongating the appearance" },
    ],
    square: [
        { name: "Soft Layers Around the Face", description: "Layers starting at the jawline, softening the angles with movement", why: "Layering at the jaw softens the prominent angular jawline while highlighting cheekbones" },
        { name: "Side-Swept Waves", description: "Long waves swept to one side with a deep part", why: "The asymmetry and soft waves counteract the geometric angles of a square face" },
        { name: "Wispy Bangs", description: "Light, airy bangs that sweep across the forehead", why: "Wispy bangs create softness at the top to balance the strong jawline below" },
        { name: "Textured Long Bob", description: "Shoulder-length bob with lived-in texture", why: "The texture breaks up hard lines while the length draws attention to the neck, away from the jaw" },
        { name: "Loose Romantic Curls", description: "Long bouncy curls with volume throughout", why: "Curls create organic shapes that soften the angular structure of a square face beautifully" },
    ],
    heart: [
        { name: "Chin-Length Bob", description: "Bob cut that hits right at the chin with subtle volume at the ends", why: "Width at the chin balances the wider forehead, creating harmony across the face" },
        { name: "Side-Swept Bangs with Layers", description: "Layered medium-length with side bangs covering part of the forehead", why: "Reduces the visual width of the forehead while layers add body around the narrow jaw" },
        { name: "Shoulder-Length Waves", description: "Medium-length hair with waves concentrated from mid-length to ends", why: "Volume at the bottom half adds width where the face is narrowest" },
        { name: "Textured Lob", description: "Long bob with tousled texture and a center or off-center part", why: "The texture adds fullness at jaw-level, compensating for the narrower lower face" },
        { name: "Curtain Bangs with Long Layers", description: "Face-framing curtain bangs flowing into long layered hair", why: "Curtain bangs minimize forehead width while the long layers balance proportions overall" },
    ],
    oblong: [
        { name: "Full Bangs with Medium Length", description: "Straight-across bangs with shoulder-length hair", why: "Full bangs create a horizontal line that visually shortens the long face dramatically" },
        { name: "Voluminous Waves", description: "Bouncy waves that add width at the cheek and ear level", why: "Side volume is the most effective way to widen a narrow oblong face, waves do this naturally" },
        { name: "Layered Bob", description: "Chin-length bob with graduated layers for maximum width", why: "The shorter length prevents elongation while layers add width at the widest point" },
        { name: "Side Part with Body Waves", description: "Deep side part with loose waves adding volume at temple height", why: "The side part and wave volume create width that counteracts the facial length" },
        { name: "Textured Shag", description: "Layered shag cut with movement at all levels", why: "The multi-level layers create width and dimension at every point, countering length" },
    ],
    diamond: [
        { name: "Side-Swept Long Layers", description: "Long layers swept to one side, fullness at the jaw and forehead", why: "Adding width at the forehead and jaw disguises the narrow points while highlighting cheekbones" },
        { name: "Chin-Length Textured Bob", description: "Textured bob with volume concentrated at chin level", why: "The chin-level volume widens the narrow jawline, balancing against prominent cheekbones" },
        { name: "Full Fringe with Length", description: "Straight or wispy bangs with long hair", why: "The fringe widens the narrow forehead while long hair adds weight at the narrow lower face" },
        { name: "Half-Up Half-Down", description: "Top section pulled up, bottom flowing freely with volume", why: "Creates width at the forehead while the flowing bottom balances the narrow jaw" },
        { name: "Soft Curls at the Ends", description: "Straight-to-wavy with curls concentrated at the tips", why: "Curls at the ends add jaw-level width, compensating for diamond shape's narrow lower face" },
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
    oval: { label: "Oval Face", emoji: "🥚", desc: "Balanced proportions with slightly longer face than wide. The most versatile face shape." },
    round: { label: "Round Face", emoji: "🌕", desc: "Width and length are similar with full cheeks and a soft jawline. Youthful appearance." },
    square: { label: "Square Face", emoji: "🔳", desc: "Strong angular jawline with face width roughly equal to jaw width. Powerful and defined." },
    heart: { label: "Heart Face", emoji: "💎", desc: "Wide forehead tapering to a narrow chin. Prominent cheekbones with a delicate lower face." },
    oblong: { label: "Oblong Face", emoji: "📐", desc: "Significantly longer than wide with balanced proportions. Elongated and elegant." },
    diamond: { label: "Diamond Face", emoji: "💠", desc: "Narrow forehead and jaw with wide, prominent cheekbones. Dramatic and striking." },
};

// ============================================================
// PUBLIC API
// ============================================================

export function getHaircutRecommendations(
    metrics: FaceShapeInput,
    gender: 'male' | 'female'
): FaceShapeProfile {
    const { shape, confidence } = classifyFaceShape(metrics, gender);
    const meta = shapeLabels[shape];
    const recs = gender === 'male' ? maleHairstyles[shape] : femaleHairstyles[shape];
    const avoid = avoidByShape[shape][gender];
    const tips = tipsForShape[shape][gender];

    return {
        shape,
        label: meta.label,
        emoji: meta.emoji,
        description: meta.desc,
        confidence,
        recommendations: recs,
        avoid,
        stylingTips: tips,
    };
}
