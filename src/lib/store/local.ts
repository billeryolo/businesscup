"use client";

// One JSON value in localStorage, shaped for useSyncExternalStore: `read` returns the same object
// until the stored text changes, so React doesn't re-render in a loop.

export function createLocalStore<T>(key: string, empty: T, revive: (parsed: unknown) => T = (parsed) => parsed as T) {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cached = empty;

  function read(): T {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      // Private mode or blocked storage: the app still works for this visit.
      if (cachedRaw !== undefined) return cached;
    }
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    try {
      cached = raw ? revive(JSON.parse(raw)) : empty;
    } catch {
      cached = empty;
    }
    return cached;
  }

  function write(next: T) {
    cached = next;
    cachedRaw = JSON.stringify(next);
    try {
      window.localStorage.setItem(key, cachedRaw);
    } catch {
      // Keep the in-memory copy.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  }

  return { read, write, subscribe };
}
