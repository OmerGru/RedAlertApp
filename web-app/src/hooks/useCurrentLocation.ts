import { useState, useEffect } from 'react';

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
    if (!navigator.geolocation) {
      setState({ address: null, loading: false, error: 'Geolocation not supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=he`
          );
          const data = await response.json();
          const address = data.address?.city || data.address?.town || data.address?.village || data.address?.state || 'Unknown';
          setState({ address, loading: false, error: null });
        } catch {
          setState({ address: null, loading: false, error: 'Failed to get address' });
        }
      },
      () => {
        setState({ address: null, loading: false, error: 'Permission denied' });
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  return state;
}
