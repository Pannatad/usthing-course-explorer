import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { normalizeSearch } from '@/data/search';

const storageKey = 'favorite-course-codes-v1';

export type FavoritesError = 'load' | 'save' | null;

type FavoritesContextValue = {
  codes: ReadonlySet<string>;
  /** True only after saved favorites loaded successfully; changes are blocked until then. */
  ready: boolean;
  error: FavoritesError;
  toggle: (code: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [codes, setCodes] = useState<ReadonlySet<string>>(new Set());
  const [status, setStatus] = useState<'loading' | 'ready' | 'loadFailed'>('loading');
  const [saveFailed, setSaveFailed] = useState(false);
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
      setStatus('ready');
    }).catch(() => {
      // Stay read-only: saving now would overwrite favorites we could not read.
      if (active) setStatus('loadFailed');
    });
    return () => { active = false; };
  }, []);

  function toggle(code: string) {
    if (status !== 'ready') return;
    const key = normalizeSearch(code);
    const next = new Set(codesRef.current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    codesRef.current = next;
    setCodes(next);
    writeQueue.current = writeQueue.current.then(() => AsyncStorage.setItem(storageKey, JSON.stringify([...next]))).catch(() => {
      setSaveFailed(true);
    });
  }

  const ready = status === 'ready';
  const error: FavoritesError = status === 'loadFailed' ? 'load' : saveFailed ? 'save' : null;
  return <FavoritesContext.Provider value={{ codes, ready, error, toggle }}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used inside FavoritesProvider');
  return context;
}
