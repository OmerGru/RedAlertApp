import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationState {
  address: string | null;
  loading: boolean;
  error: string | null;
}

export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({
    address: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setState({ address: null, loading: false, error: 'Permission denied' });
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (geocode.length > 0) {
          const place = geocode[0];
          const address = place.city || place.region || place.name || 'Unknown';
          setState({ address, loading: false, error: null });
        } else {
          setState({ address: null, loading: false, error: 'No address found' });
        }
      } catch (err) {
        setState({ address: null, loading: false, error: 'Failed to get location' });
      }
    })();
  }, []);

  return state;
}
