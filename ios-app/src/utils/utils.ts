import axios from 'axios';
import { ALERTS_ENDPOINT, HISTORY_ENDPOINT } from './constants';
import { AlertState, AlertHistoryEntry } from './types';
import { t } from './i18n';

export const fetchAlerts = async (): Promise<AlertState | null> => {
  try {
    const response = await axios.get<AlertState>(ALERTS_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return null;
  }
};

export const fetchHistory = async (): Promise<AlertHistoryEntry[] | null> => {
  try {
    const response = await axios.get<AlertHistoryEntry[]>(HISTORY_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error('Error fetching history:', error);
    return null;
  }
};

// @ts-ignore - Temporary ignore until TS re-index
export function timeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return t('history.formats.secondsAgo' as any, { n: diffSec });
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t('history.formats.minutesAgo' as any, { n: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  return t('history.formats.hoursAgo' as any, { h: diffHr, m: diffMin % 60 });
}
