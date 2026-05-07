import { MetricReport } from './metrics';

export type Phenotype = 
  | 'GIGACHAD / GOD TIER'
  | 'ROBUST / WARRIOR'
  | 'NEOTENOUS / PRETTY BOY'
  | 'ELONGATED / HORSE FACE'
  | 'ANDROGYNOUS'
  | 'AVERAGE NORMIE';

export function classifyPhenotype(metrics: MetricReport): Phenotype {
  const { fWHR, midfaceRatio } = metrics.midface;
  const { canthalTilt, uee } = metrics.periorbital;
  const { overallSymmetry } = metrics.symmetry;
  const { gonialAngle } = metrics.jawline;

  // God tier: everything aligns
  if (overallSymmetry > 93 && canthalTilt.average > 5 && fWHR > 1.85) 
    return 'GIGACHAD / GOD TIER';
  
  // Robust: wide face, sharp jaw, strong brow
  if (fWHR > 1.85 && gonialAngle.average < 125) 
    return 'ROBUST / WARRIOR';
  
  // Neotenous: large eyes, short midface, softer features
  if (uee.average < 0.28 && midfaceRatio < 0.28 && fWHR < 1.75) 
    return 'NEOTENOUS / PRETTY BOY';
  
  // Elongated: long midface is the dominant trait
  if (midfaceRatio > 0.35) 
    return 'ELONGATED / HORSE FACE';
  
  // Androgynous: balanced but not strongly masculine
  if (fWHR < 1.75 && canthalTilt.average > 3) 
    return 'ANDROGYNOUS';
  
  return 'AVERAGE NORMIE';
}

export type NorwoodScale = 'NW1' | 'NW2' | 'NW3' | 'NW4' | 'NW5' | 'NW6' | 'NW7';

export function classifyNorwood(metrics: MetricReport): NorwoodScale {
  const ratio = metrics.midface.foreheadHeightRatio ?? 0.3;
  // Higher forehead height ratio = more recession
  if (ratio < 0.28) return 'NW1';
  if (ratio < 0.31) return 'NW2';
  if (ratio < 0.34) return 'NW3';
  if (ratio < 0.37) return 'NW4';
  if (ratio < 0.40) return 'NW5';
  if (ratio < 0.44) return 'NW6';
  return 'NW7';
}
