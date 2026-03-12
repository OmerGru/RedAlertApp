import axios from 'axios';
import { ALERTS_ENDPOINT } from './constants';
import { AlertState } from './types';

export const fetchAlerts = async (): Promise<AlertState | null> => {
  try {
    const response = await axios.get<AlertState>(ALERTS_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return null;
  }
};
