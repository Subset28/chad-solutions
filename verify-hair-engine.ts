import { calculateHairPSL, FaceShape, HairProfile } from './src/utils/haircut-recommendations';

const testProfiles: { name: string; faceShape: FaceShape; profile: HairProfile; gender: 'male' | 'female' }[] = [
    {
        name: "Full Hairline Baseline",
        faceShape: 'oval',
        profile: { type: 'straight', texture: 'medium', thickness: 'medium', ethnicity: 'not_specified', hairline: 'full' },
        gender: 'male'
    },
    {
        name: "Slight Recession",
        faceShape: 'oval',
        profile: { type: 'straight', texture: 'medium', thickness: 'medium', ethnicity: 'not_specified', hairline: 'receding_slight' },
        gender: 'male'
    },
    {
        name: "Moderate Recession",
        faceShape: 'oval',
        profile: { type: 'straight', texture: 'medium', thickness: 'medium', ethnicity: 'not_specified', hairline: 'receding_moderate' },
        gender: 'male'
    },
    {
        name: "Thinning Scalp",
        faceShape: 'oval',
        profile: { type: 'straight', texture: 'medium', thickness: 'medium', ethnicity: 'not_specified', hairline: 'thinning' },
        gender: 'male'
    },
    {
        name: "Oblong + Straight (Penalty Test)",
        faceShape: 'oblong',
        profile: { type: 'straight', texture: 'medium', thickness: 'medium', ethnicity: 'not_specified', hairline: 'full' },
        gender: 'male'
    },
    {
        name: "Oblong + Curly (Bonus Test)",
        faceShape: 'oblong',
        profile: { type: 'curly', texture: 'medium', thickness: 'medium', ethnicity: 'not_specified', hairline: 'full' },
        gender: 'male'
    }
];

console.log("=== HAIR PSL SCORING VERIFICATION ===\n");

testProfiles.forEach(t => {
    const result = calculateHairPSL(t.profile, t.faceShape, t.gender);
    console.log(`Test: ${t.name}`);
    console.log(`Score: ${result.score} (${result.label})`);
    console.log(`Synergy Score: ${result.faceShapeSynergy}`);
    console.log(`Breakdown: ${result.breakdown.join('; ')}`);
    console.log(`Ascension Tips: ${result.recommendations.filter(r => r.includes("Ascension")).join('; ') || 'None'}`);
    console.log("-----------------------------------\n");
});
