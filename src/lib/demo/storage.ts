import { DB_STORAGE_KEY, SESSION_STORAGE_KEY } from "@/config/constants";
import type { DemoDatabase, SessionState } from "@/types/models";

export function loadDatabase(): DemoDatabase | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DB_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DemoDatabase;
    if (parsed.version !== 1 || !Array.isArray(parsed.organizations)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDatabase(database: DemoDatabase) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(database));
}

export function loadSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

export function saveSession(session: SessionState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}
