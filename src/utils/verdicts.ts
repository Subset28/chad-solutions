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
