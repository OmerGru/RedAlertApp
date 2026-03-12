import { useState, useEffect } from 'react';
import { fetchAlerts } from '../utils/utils';
import { AlertState } from '../utils/types';
import { POLLING_INTERVAL_MS } from '../utils/constants';

export function useAlerts() {
  const [alert, setAlert] = useState<AlertState>({ active: false, title: 'Quiet', areas: [] });

  useEffect(() => {
    const pollAlerts = async () => {
      const data = await fetchAlerts();
      if (data) setAlert(data);
    };

    pollAlerts();
    const interval = setInterval(pollAlerts, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return alert;
}
