"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny localStorage-backed store for guest data (shelf, progress, highlights,
 * preferences). Every store is versioned, syncs across tabs, and is safe when
 * storage is unavailable. Signed-in sync layers on top of this later.
 */
export type Store<T> = {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (cb: () => void) => () => void;
  initial: T;
};

export function createStore<T>(key: string, initial: T, version = 1): Store<T> {
  const storageKey = `lr:${key}:v${version}`;
  const listeners = new Set<() => void>();
  let cache: T = initial;
  let loaded = false;

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw)
        cache = {
          ...(typeof initial === "object" && !Array.isArray(initial) ? initial : {}),
          ...JSON.parse(raw),
        } as T;
      if (Array.isArray(initial) && raw) cache = JSON.parse(raw) as T;
    } catch {
      cache = initial;
    }
  }

  function emit() {
    listeners.forEach((l) => l());
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key !== storageKey) return;
      loaded = false;
      load();
      emit();
    });
  }

  return {
    initial,
    get() {
      load();
      return cache;
    },
    set(next) {
      load();
      cache = typeof next === "function" ? (next as (p: T) => T)(cache) : next;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(cache));
      } catch {
        /* storage full or blocked: keep the in-memory value for this session */
      }
      emit();
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.initial);
}
