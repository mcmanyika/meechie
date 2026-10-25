"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_MOOD, MOOD_STORAGE_KEY, MOODS, isMoodId, type MoodId } from "@/config/moods";

type MoodContextValue = {
  mood: MoodId;
  setMood: (mood: MoodId) => void;
  moods: typeof MOODS;
};

const MoodContext = createContext<MoodContextValue | null>(null);

function applyMood(mood: MoodId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-mood", mood);
}

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMoodState] = useState<MoodId>(DEFAULT_MOOD);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MOOD_STORAGE_KEY);
      const next = isMoodId(stored) ? stored : DEFAULT_MOOD;
      setMoodState(next);
      applyMood(next);
    } catch {
      applyMood(DEFAULT_MOOD);
    }
  }, []);

  const setMood = useCallback((next: MoodId) => {
    setMoodState(next);
    applyMood(next);
    try {
      window.localStorage.setItem(MOOD_STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const value = useMemo(() => ({ mood, setMood, moods: MOODS }), [mood, setMood]);

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
}

export function useMood() {
  const context = useContext(MoodContext);
  if (!context) throw new Error("useMood must be used within MoodProvider");
  return context;
}
