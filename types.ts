
export interface JsonStats {
  keyCount: number;
  maxDepth: number;
  totalChars: number;
  longestValue: {
    key: string;
    length: number;
    value: string;
  };
  keyFrequency: Record<string, number>;
  valueAggregation: Record<string, string[]>; // Value -> Paths mapping
  typeDistribution: Record<string, number>; // Type -> Count mapping
}

export interface FavoriteKey {
  id: string;
  path: string;
  value: any;
  timestamp: number;
}

export type ViewMode = 'tree' | 'table' | 'analysis' | 'builder' | 'export';

export interface TableCandidate {
  path: string;
  rows: any[];
  headers: string[];
}

export interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  extension: string;
  color: string;
}
