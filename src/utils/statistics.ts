/**
 * Elite Model Statistical Database
 * 
 * Provides percentile rankings based on a database of elite models (PSL 6.5+).
 */

export interface PercentileData {
    percentile: number;
    rank: string; // e.g. "Top 1%", "Top 10%"
}

const ELITE_MEANS: Record<string, { mean: number, stdDev: number }> = {
    fwfhRatio: { mean: 1.45, stdDev: 0.05 },
    midfaceRatio: { mean: 0.98, stdDev: 0.04 },
    canthalTilt: { mean: 5.5, stdDev: 2.0 },
    gonialAngle: { mean: 122, stdDev: 5.0 },
    ipdRatio: { mean: 0.46, stdDev: 0.02 },
};

export function calculatePercentile(metric: string, value: number): PercentileData {
    const stats = ELITE_MEANS[metric];
    if (!stats) return { percentile: 50, rank: "Average" };

    const zScore = (value - stats.mean) / stats.stdDev;
    
    // Normal distribution approximation (simplified)
    const percentile = Math.round(100 * (0.5 * (1 + Math.erf(Math.abs(zScore) / Math.sqrt(2)))));
    const finalPercentile = zScore > 0 ? percentile : 100 - percentile;

    let rank = "Average";
    if (finalPercentile >= 99.9) rank = "Top 0.1%";
    else if (finalPercentile >= 99) rank = "Top 1%";
    else if (finalPercentile >= 90) rank = "Top 10%";
    else if (finalPercentile >= 75) rank = "Top 25%";

    return { percentile: finalPercentile, rank };
}

function erf(x: number): number {
    // Basic erf approximation
    const t = 1.0 / (1.0 + 0.5 * Math.abs(x));
    const tau = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * (0.17087277))))))))));
    return x >= 0 ? 1 - tau : tau - 1;
}

export function calculateCommunityStatus(pslScore: number): { status: string, color: string, description: string } {
    if (pslScore >= 7.5) return { 
        status: "GIGACHAD / PSL GOD", 
        color: "text-purple-400", 
        description: "Theoretical perfection. Occupying the top 0.01% of global attractiveness." 
    };
    if (pslScore >= 6.5) return { 
        status: "CHAD", 
        color: "text-emerald-400", 
        description: "Elite bone structure and harmony. Superior dimorphic traits." 
    };
    if (pslScore >= 5.5) return { 
        status: "CHADLITE", 
        color: "text-blue-400", 
        description: "Significantly above average. Strong foundations with minor flaws." 
    };
    if (pslScore >= 4.5) return { 
        status: "HIGH-TIER NORMIE", 
        color: "text-cyan-400", 
        description: "Above average. Good facial balance and appeal." 
    };
    if (pslScore >= 3.5) return { 
        status: "MID-TIER NORMIE", 
        color: "text-zinc-300", 
        description: "Statistically average. No major flaws or major strengths." 
    };
    if (pslScore >= 2.5) return { 
        status: "LOW-TIER NORMIE", 
        color: "text-amber-400", 
        description: "Below average. Noticeable asymmetries or lack of definition." 
    };
    if (pslScore >= 1.5) return { 
        status: "TRUECEL", 
        color: "text-red-400", 
        description: "Severe lack of dimorphic features and structural support." 
    };
    return { 
        status: "SUBHUMAN", 
        color: "text-red-600", 
        description: "Significant structural deformities or extreme lack of harmony." 
    };
}
