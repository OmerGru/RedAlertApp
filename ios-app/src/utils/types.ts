export interface AlertState {
  active: boolean;
  title: string;
  areas: string[];
  timestamp?: number;
}

export interface AlertHistoryEntry {
  id: string;
  title: string;
  areas: string[];
  timestamp: number;
}
