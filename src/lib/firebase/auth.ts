"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

export type AuthResult<T> = { ok: true; data: T } | { ok: false; error: string };

function mapAuthError(error: unknown): string {
  const raw = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
  const code = raw.toLowerCase();
  if (code.includes("email-already-in-use")) return "An account with this email already exists. Sign in instead.";
  if (code.includes("invalid-email")) return "Enter a valid email address.";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Email or password is incorrect.";
  }
  if (code.includes("weak-password")) return "Use a password with at least 8 characters.";
  if (code.includes("too-many-requests")) return "Too many attempts. Wait a moment and try again.";
  if (code.includes("network-request-failed")) return "Network error. Check your connection and try again.";
  if (code.includes("operation-not-allowed")) {
    return "Email and password sign-in is not enabled in Firebase Authentication.";
  }
  if (code.includes("api-key-not-valid") || code.includes("invalid-api-key")) {
    return "Firebase API key is invalid. Restart the dev server after updating NEXT_PUBLIC_FIREBASE_API_KEY.";
  }
  if (code.includes("configuration-not-found")) {
    return "Firebase Authentication is not set up for this project yet.";
  }
  return raw ? `Authentication failed (${raw.split(".")[0]}).` : "Authentication failed. Try again.";
}

export function isAuthConfigured() {
  return getFirebaseAuth() !== null;
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult<User>> {
  const auth = getFirebaseAuth();
  if (!auth) return { ok: false, error: "Authentication is not configured. Add Firebase web config to continue." };
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { ok: true, data: credential.user };
  } catch (error) {
    return { ok: false, error: mapAuthError(error) };
  }
}

export async function registerWithPassword(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthResult<User>> {
  const auth = getFirebaseAuth();
  if (!auth) return { ok: false, error: "Authentication is not configured. Add Firebase web config to continue." };
  try {
    const credential = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
    if (input.displayName.trim()) {
      await updateProfile(credential.user, { displayName: input.displayName.trim() });
    }
    return { ok: true, data: credential.user };
  } catch (error) {
    return { ok: false, error: mapAuthError(error) };
  }
}

export async function signOutAuth(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await firebaseSignOut(auth);
}
