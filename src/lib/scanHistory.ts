import { get, set, keys, del } from 'idb-keyval';
import { MetricReport } from '@/utils/metrics';

export interface StoredScan {
  id: string;
  timestamp: number;
  psl: number;
  tier: string;
  phenotype: string;
  nwScale: string;
  metrics: MetricReport;
  thumbnailBase64?: string;
}

export const saveScan = async (scan: StoredScan) => {
  await set(`scan:${scan.id}`, scan);
};

export const getAllScans = async (): Promise<StoredScan[]> => {
  const allKeys = await keys();
  const scanKeys = allKeys.filter(k => String(k).startsWith('scan:'));
  const allScans = await Promise.all(scanKeys.map(k => get(k)));
  return (allScans as StoredScan[]).sort((a, b) => b.timestamp - a.timestamp);
};

export const deleteScan = async (id: string) => {
  await del(`scan:${id}`);
};
