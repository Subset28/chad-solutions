export const blackpillVerdicts: Record<string, Record<string, string>> = {
    canthalTilt: {
        elite: "Positive hunter eye. This is mogging most males on the street.",
        good: "Slight positive tilt. Above average. Competent.",
        average: "Neutral tilt. Neither hunter nor prey. Mid.",
        bad: "Negative tilt. Prey eyes. This is dragging your PSL.",
        terrible: "Strong negative tilt. The cope is mewing won't fix this."
    },
    fWHR: {
        elite: "Wide frame. High testosterone signal. Frame is mogging.",
        good: "Solid fWHR. Above the normie threshold.",
        average: "Average frame. Nothing to write home about.",
        bad: "Narrow face. Soy frame. This reads as low T.",
        terrible: "Extremely narrow. Peanut frame. This needs to be addressed."
    },
    midfaceRatio: {
        elite: "Compact midface. Ideal proportionality. High-tier model trait.",
        good: "Short midface. Masculine and robust.",
        average: "Standard proportions. No falio here.",
        bad: "Long midface. Horseface phenotype. Ageing will be harsh.",
        terrible: "Severe midface elongation. Massive falio. Central to low PSL."
    },
    gonialAngle: {
        elite: "Sharp, masculine jawline. Warrior skull. Elite dimorphism.",
        good: "Solid definition. Strong ramus height.",
        average: "Visible jawline. Average development.",
        bad: "Soft jaw. Recessed appearance. Submental fat will pool here.",
        terrible: "No jaw definition. Pencil neck transition. Major falio."
    },
    overallSymmetry: {
        elite: "Perfect bilateral balance. Genetic lottery winner.",
        good: "High symmetry. Minimal developmental stress.",
        average: "Minor asymmetries. Normal for most humans.",
        bad: "Noticeable deviation. Developmental instability detected.",
        terrible: "Severe asymmetry. Major facial disharmony. Subhuman trait."
    }
};

export function getVerdict(metric: string, rating: string): string {
    const category = blackpillVerdicts[metric];
    if (!category) return "Metric analysis complete.";
    return category[rating.toLowerCase()] || "Rating verified.";
}
