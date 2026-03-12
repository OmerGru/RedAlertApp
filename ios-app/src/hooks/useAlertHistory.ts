import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertHistoryEntry } from '../utils/types';
import { HISTORY_ENDPOINT, HISTORY_POLLING_INTERVAL_MS } from '../utils/constants';

export function useAlertHistory(): AlertHistoryEntry[] {
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);

  useEffect(() => {
    const poll = async () => {
      try {
        const response = await axios.get<AlertHistoryEntry[]>(HISTORY_ENDPOINT);
        setHistory(response.data);
      } catch (error) {
        console.error('Error fetching alert history:', error);
      }
    };

    poll();
    const interval = setInterval(poll, HISTORY_POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return history;
}
