import { MetricReport, PSLResult } from '@/utils/metrics';

export interface ScanResult {
    metrics: MetricReport;
    psl: PSLResult;
    profileType: 'front' | 'side' | 'composite';
    image: string; // Base64 annotated
    confidence: number;
    timestamp: number;
    audit?: {
        isValid: boolean;
        reason?: string;
        overall: number;
    };
}

export type Gender = 'male' | 'female';
export type AppTab = 'analysis' | 'looksmax' | 'vitality' | 'haircut';
export type InputMode = 'webcam' | 'upload';
