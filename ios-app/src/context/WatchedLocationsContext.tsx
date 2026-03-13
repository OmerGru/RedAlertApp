import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';

const STORAGE_KEY = '@watched_locations';

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  return AsyncStorage.getItem(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  AsyncStorage.setItem(key, value);
}

interface WatchedLocationsContextType {
  watched: Set<string>;
  toggle: (city: string) => void;
  setAll: (cities: string[]) => void;
}

const WatchedLocationsContext = createContext<WatchedLocationsContextType | undefined>(undefined);

export function WatchedLocationsProvider({ children }: { children: ReactNode }) {
  const [watched, setWatched] = useState<Set<string>>(new Set());

  useEffect(() => {
    storageGet(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setWatched(new Set(JSON.parse(raw) as string[])); } catch { }
      }
    });
  }, []);

  const toggle = useCallback((city: string) => {
    setWatched((prev) => {
      const next = new Set(prev);
      if (next.has(city)) { next.delete(city); } else { next.add(city); }
      storageSet(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const setAll = useCallback((cities: string[]) => {
    const next = new Set(cities);
    setWatched(next);
    storageSet(STORAGE_KEY, JSON.stringify([...next]));
  }, []);

  return (
    <WatchedLocationsContext.Provider value={{ watched, toggle, setAll }}>
      {children}
    </WatchedLocationsContext.Provider>
  );
}

export function useWatchedLocationsContext() {
  const context = useContext(WatchedLocationsContext);
  if (context === undefined) {
    throw new Error('useWatchedLocationsContext must be used within a WatchedLocationsProvider');
  }
  return context;
}
