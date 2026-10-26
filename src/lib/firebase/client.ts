"use client";

import { deleteApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getSharedFirebaseApp } from "@/lib/firebase/app";
import { readFirebaseConfig } from "@/lib/firebase/config";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let cachedApiKey: string | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  const config = readFirebaseConfig();
  if (!config) return null;
  if (app && cachedApiKey !== config.apiKey) {
    const previous = app;
    app = null;
    auth = null;
    cachedApiKey = null;
    void deleteApp(previous).catch(() => undefined);
  }
  if (!app) {
    app = getSharedFirebaseApp();
    cachedApiKey = config.apiKey;
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  auth ??= getAuth(firebaseApp);
  return auth;
}
