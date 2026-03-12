import axios from 'axios';
import { ALERTS_ENDPOINT, HISTORY_ENDPOINT } from './constants';
import { AlertState, AlertHistoryEntry } from './types';

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
