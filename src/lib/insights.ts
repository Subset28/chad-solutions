import insightsData from '../../data/community-insights.json';

export interface CommunityInsight {
  advice: string;
  category: string;
  faceShapes: string[];
  phenotypes: string[];
  confidence: 'low' | 'medium' | 'high';
  source: string;
}

const METRIC_TO_INSIGHT_CATEGORY: Record<string, string> = {
    // Periorbital
    canthalTilt: 'grooming',
    uee: 'grooming',
    esr: 'grooming',
    ipd: 'grooming',
    orbitalRimProtrusion: 'grooming',
    browRidgeProtrusion: 'grooming',
    infraorbitalRimPosition: 'grooming',
    eyeAperture: 'grooming',
    pfl: 'grooming',
    
    // Midface
    fWHR: 'grooming',
    midfaceRatio: 'grooming',
    philtrumLength: 'style',
    mouthToNoseWidthRatio: 'grooming',
    noseWidthRatio: 'grooming',
    maxillaryProtrusion: 'mewing',
    foreheadHeightRatio: 'haircut',
    
    // Jawline
    gonialAngle: 'mewing',
    chinProjection: 'mewing',
    bigonialRatio: 'mewing',
    doubleChinRisk: 'fitness',
    chinToPhiltrumRatio: 'mewing',
    
    // Skin / Vitality
    collagenIndex: 'skincare',
    vitalityScore: 'skincare',
    
    // General
    overallSymmetry: 'style',
    hairlineRecession: 'haircut'
};

export function getInsightsForMetric(
  metricKey: string,
  faceShape?: string,
  phenotype?: string
): CommunityInsight[] {
  if (!insightsData || !insightsData.insights) return [];

  const category = METRIC_TO_INSIGHT_CATEGORY[metricKey] || 'grooming';

  return (insightsData.insights as CommunityInsight[])
    .filter(i => {
      const cat = i.category.toLowerCase();
      const targetCat = category.toLowerCase();
      
      const categoryMatch = cat === targetCat || 
                           (targetCat === 'haircut' && cat === 'haircut') ||
                           (targetCat === 'mewing' && cat === 'mewing');
      
      const shapeMatch = !faceShape || 
        i.faceShapes.length === 0 || 
        i.faceShapes.some(s => s.toLowerCase() === faceShape.toLowerCase());
      
      const phenoMatch = !phenotype || 
        i.phenotypes.length === 0 || 
        i.phenotypes.some(p => p.toLowerCase() === phenotype.toLowerCase());
        
      return categoryMatch && shapeMatch && phenoMatch;
    })
    .slice(-3); // Get the 3 most recent relevant tips
}

export function getLastUpdated(): string | null {
    return insightsData.lastUpdated;
}
