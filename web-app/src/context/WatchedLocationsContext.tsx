import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY = '@watched_locations';

interface WatchedLocationsContextType {
  watched: Set<string>;
  toggle: (city: string) => void;
  setAll: (cities: string[]) => void;
}

const WatchedLocationsContext = createContext<WatchedLocationsContextType | undefined>(undefined);

export function WatchedLocationsProvider({ children }: { children: ReactNode }) {
  const [watched, setWatched] = useState<Set<string>>(new Set());

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setWatched(new Set(JSON.parse(raw) as string[])); } catch { }
    }
  }, []);

  const toggle = useCallback((city: string) => {
    setWatched((prev) => {
      const next = new Set(prev);
      if (next.has(city)) { next.delete(city); } else { next.add(city); }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const setAll = useCallback((cities: string[]) => {
    const next = new Set(cities);
    setWatched(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
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
