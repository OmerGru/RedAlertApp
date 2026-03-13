import { useAlertContext } from '../context/AlertContext';
import type { AlertState } from '../utils/types';

export function useAlerts(): AlertState {
  const { alerts } = useAlertContext();
  return alerts;
}
