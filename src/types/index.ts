import { MetricReport, PSLResult } from '@/utils/metrics';
export type { PSLResult };

export interface ScanResult {
    id: string;
    metrics: MetricReport;
    psl: PSLResult;
    profileType: 'front' | 'side' | 'composite';
    image: string; // Base64 annotated
    timestamp: number;
    audit?: {
        isValid: boolean;
        reason?: string;
        overall: number;
    };
    gender: Gender;
}

export type Gender = 'male' | 'female';
export type AppTab = 'analysis' | 'looksmax' | 'vitality' | 'haircut' | 'history';
export type InputMode = 'webcam' | 'upload';
