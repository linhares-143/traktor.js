"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AppStateContext = createContext(null);

const SELECTION_KEY = "gtm-app:selection";
const HISTORY_KEY = "gtm-app:history";
const LAST_RESULT_KEY = "gtm-app:last-result";

function readSession(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeSession(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sessionStorage indisponível (modo privado etc.); ignora silenciosamente.
  }
}

export function AppStateProvider({ children }) {
  const [selection, setSelectionState] = useState(null);
  const [history, setHistoryState] = useState([]);
  const [lastResult, setLastResultState] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSelectionState(readSession(SELECTION_KEY, null));
    setHistoryState(readSession(HISTORY_KEY, []));
    setLastResultState(readSession(LAST_RESULT_KEY, null));
    setHydrated(true);
  }, []);

  const setSelection = useCallback((value) => {
    setSelectionState(value);
    writeSession(SELECTION_KEY, value);
  }, []);

  const setLastResult = useCallback((value) => {
    setLastResultState(value);
    writeSession(LAST_RESULT_KEY, value);
  }, []);

  const addHistoryEntry = useCallback((entry) => {
    setHistoryState((prev) => {
      const next = [{ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }, ...prev];
      writeSession(HISTORY_KEY, next);
      return next;
    });
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        hydrated,
        selection,
        setSelection,
        history,
        addHistoryEntry,
        lastResult,
        setLastResult,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState precisa ser usado dentro de <AppStateProvider>.");
  }
  return ctx;
}
