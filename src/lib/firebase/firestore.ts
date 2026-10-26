import { getFirestore, type Firestore } from "firebase/firestore";
import { getSharedFirebaseApp } from "@/lib/firebase/app";

export function getFirestoreDb(): Firestore | null {
  const app = getSharedFirebaseApp();
  if (!app) return null;
  return getFirestore(app);
}
