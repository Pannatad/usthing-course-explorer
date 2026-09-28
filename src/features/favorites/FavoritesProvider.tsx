import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { normalizeSearch } from '@/data/search';

const storageKey = 'favorite-course-codes-v1';

type FavoritesContextValue = {
  codes: ReadonlySet<string>;
  ready: boolean;
  error: boolean;
  toggle: (code: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [codes, setCodes] = useState<ReadonlySet<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const codesRef = useRef<ReadonlySet<string>>(new Set());
  const writeQueue = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then((stored) => {
      if (!active) return;
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      const loaded = new Set(Array.isArray(parsed) ? parsed.filter((value): value is string =>
        typeof value === 'string' && /^[A-Z]+\d[\dA-Z-]*$/.test(value)) : []);
      codesRef.current = loaded;
      setCodes(loaded);
    }).catch(() => {
      if (active) setError(true);
    }).finally(() => {
      if (active) setReady(true);
    });
    return () => { active = false; };
  }, []);

  function toggle(code: string) {
    if (!ready) return;
    const key = normalizeSearch(code);
    const next = new Set(codesRef.current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    codesRef.current = next;
    setCodes(next);
    writeQueue.current = writeQueue.current.then(() => AsyncStorage.setItem(storageKey, JSON.stringify([...next]))).catch(() => {
      setError(true);
    });
  }

  return <FavoritesContext.Provider value={{ codes, ready, error, toggle }}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used inside FavoritesProvider');
  return context;
}
