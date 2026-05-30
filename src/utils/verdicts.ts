export const metricVerdicts: Record<string, Record<string, string>> = {
    canthalTilt: {
        elite: "This is in an excellent range and gives the upper face a lifted look.",
        good: "This is a strong result with only minor room for refinement.",
        average: "This sits in a typical range.",
        bad: "This measurement is below the ideal range and is worth improving indirectly.",
        terrible: "This is well below the target range and will strongly affect perceived eye shape."
    },
    fWHR: {
        elite: "This width-to-height ratio reads as broad and balanced.",
        good: "This is slightly above average and generally reads well.",
        average: "This is a normal ratio for most faces.",
        bad: "This ratio is a bit narrow for the target aesthetic.",
        terrible: "This ratio is very narrow and noticeably reduces facial width."
    },
    midfaceRatio: {
        elite: "This midface length is compact and visually efficient.",
        good: "This is a good midface proportion with some room to tighten further.",
        average: "This sits in a normal range.",
        bad: "This midface reads a little long compared with the ideal target.",
        terrible: "This midface is significantly long and will dominate the profile."
    },
    lowerThirdRatio: {
        elite: "This lower face reads proportionate and balanced relative to the full face.",
        good: "This is a strong lower-third result with only minor room to tighten further.",
        average: "This sits in a normal range.",
        bad: "This lower third reads a bit short or long compared with the ideal target.",
        terrible: "This lower-third proportion is far from the target and will affect harmony."
    },
    facialThirdsRatio: {
        elite: "This face divides cleanly into balanced thirds.",
        good: "This is a strong thirds result with only minor imbalance.",
        average: "This is a typical third balance for a human face.",
        bad: "This face is a bit off in its vertical thirds.",
        terrible: "This level of thirds imbalance will be obvious in photos."
    },
    facialFifthsRatio: {
        elite: "This front-face harmony proxy is highly balanced.",
        good: "This is a strong fifths balance result.",
        average: "This is a normal amount of horizontal variation.",
        bad: "This fifths balance is a bit off compared with the ideal target.",
        terrible: "This balance is noticeably off and will reduce harmony."
    },
    pfl: {
        elite: "This eye opening ratio reads as long and sharp.",
        good: "This is a solid hunter-eye result.",
        average: "This sits in a common range.",
        bad: "This eye opening is a little round compared with the target.",
        terrible: "This eye opening is very round and will read as weak."
    },
    eyeToMouthAngle: {
        elite: "This eye-mouth-eye angle is sharp and harmonious.",
        good: "This is a solid EME angle result.",
        average: "This sits in a common range.",
        bad: "This angle is a bit off the ideal target.",
        terrible: "This angle is significantly off and will affect structure."
    },
    lipRatio: {
        elite: "This lower-to-upper lip balance looks ideal.",
        good: "This is a strong lip ratio result.",
        average: "This is a common lip balance.",
        bad: "This lip ratio is a bit off target.",
        terrible: "This lip ratio is far from the ideal balance."
    },
    cervicomentalAngle: {
        elite: "This neck-to-jaw angle reads as clean and sharp.",
        good: "This is a strong cervicomental result.",
        average: "This is a normal neck-to-jaw transition.",
        bad: "This angle reads a bit soft.",
        terrible: "This angle is very soft and will make the jawline look weaker."
    },
    gonialAngle: {
        elite: "This jaw angle is sharp and gives the lower face strong definition.",
        good: "This is a solid jaw result with good definition.",
        average: "This jaw angle is within a common range.",
        bad: "This jaw angle is on the softer side.",
        terrible: "This jaw angle is far from the target and will make the lower face look weak."
    },
    overallSymmetry: {
        elite: "This is an excellent symmetry score and reads as very balanced.",
        good: "This is a strong symmetry result.",
        average: "This is a normal amount of asymmetry for a human face.",
        bad: "This is enough asymmetry to be noticeable in photos.",
        terrible: "This level of asymmetry is visually obvious and will affect harmony."
    }
};

export function getVerdict(metric: string, rating: string): string {
    const category = metricVerdicts[metric];
    if (!category) return "Measurement captured.";
    return category[rating.toLowerCase()] || "Result recorded.";
}
