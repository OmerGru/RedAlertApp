import { useAlertContext } from '../context/AlertContext';
import type { AlertHistoryEntry } from '../utils/types';

export function useAlertHistory(): AlertHistoryEntry[] {
  const { history } = useAlertContext();
  return history;
}
