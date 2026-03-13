import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { fetchAlerts, fetchHistory } from '../utils/utils';
import type { AlertState, AlertHistoryEntry } from '../utils/types';
import { POLLING_INTERVAL_MS, HISTORY_POLLING_INTERVAL_MS } from '../utils/constants';

interface AlertContextType {
  alerts: AlertState;
  history: AlertHistoryEntry[];
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertState>({ active: false, title: 'Quiet', areas: [] });
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);

  useEffect(() => {
    const pollAlerts = async () => {
      const data = await fetchAlerts();
      if (data) setAlerts(data);
    };

    const pollHistory = async () => {
      const data = await fetchHistory();
      if (data) setHistory(data);
    };

    pollAlerts();
    pollHistory();

    const alertsInterval = setInterval(pollAlerts, POLLING_INTERVAL_MS);
    const historyInterval = setInterval(pollHistory, HISTORY_POLLING_INTERVAL_MS);

    return () => {
      clearInterval(alertsInterval);
      clearInterval(historyInterval);
    };
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, history }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlertContext() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlertContext must be used within an AlertProvider');
  }
  return context;
}
