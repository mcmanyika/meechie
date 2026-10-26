import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { readFirebaseConfig } from "@/lib/firebase/config";

/** Shared Firebase app for browser and server (API routes). */
export function getSharedFirebaseApp(): FirebaseApp | null {
  const config = readFirebaseConfig();
  if (!config) return null;
  return getApps().length > 0 ? getApp() : initializeApp(config);
}
