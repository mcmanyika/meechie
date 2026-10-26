import { promises as fs } from "fs";
import path from "path";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import type { StripePaymentNotice } from "@/lib/domain/workflows";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import type { GivingStoreFile, PublicGivingProfile } from "@/lib/giving/types";

export type { PublicDonateButton, PublicGivingProfile, PublicProgram } from "@/lib/giving/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "giving.json");
const PROFILE_COLLECTION = "givingProfiles";
const NOTICE_COLLECTION = "stripeNotices";

async function readFileStore(): Promise<GivingStoreFile> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as GivingStoreFile;
    return {
      profiles: parsed.profiles ?? {},
      notices: parsed.notices ?? {},
    };
  } catch {
    return { profiles: {}, notices: {} };
  }
}

async function writeFileStore(store: GivingStoreFile) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function getGivingProfile(slug: string): Promise<PublicGivingProfile | null> {
  const key = slug.toLowerCase();
  const db = getFirestoreDb();
  if (db) {
    const snap = await getDoc(doc(db, PROFILE_COLLECTION, key));
    if (snap.exists()) return snap.data() as PublicGivingProfile;
    return null;
  }
  const store = await readFileStore();
  return store.profiles[key] ?? null;
}

export async function upsertGivingProfile(profile: PublicGivingProfile) {
  const key = profile.slug.toLowerCase();
  const next = { ...profile, slug: key };
  const db = getFirestoreDb();
  if (db) {
    try {
      await setDoc(doc(db, PROFILE_COLLECTION, key), next);
      return;
    } catch {
      // Server/API calls are often unauthenticated; client publish writes Firestore instead.
    }
  }
  const store = await readFileStore();
  store.profiles[key] = next;
  await writeFileStore(store);
}

export async function upsertPaymentNotice(notice: StripePaymentNotice) {
  const db = getFirestoreDb();
  if (db) {
    try {
      await setDoc(doc(db, NOTICE_COLLECTION, notice.sessionId), notice);
      return;
    } catch {
      // Fall back to local file store when rules block the write.
    }
  }
  const store = await readFileStore();
  store.notices[notice.sessionId] = notice;
  const keys = Object.keys(store.notices);
  if (keys.length > 300) {
    for (const key of keys.slice(0, keys.length - 300)) delete store.notices[key];
  }
  await writeFileStore(store);
}

export async function listPaymentNotices(organizationId?: string): Promise<StripePaymentNotice[]> {
  const db = getFirestoreDb();
  if (db) {
    const snap = await getDocs(collection(db, NOTICE_COLLECTION));
    const notices = snap.docs.map((item) => item.data() as StripePaymentNotice);
    const filtered = organizationId ? notices.filter((item) => item.organizationId === organizationId) : notices;
    return filtered.sort((a, b) => b.sessionId.localeCompare(a.sessionId)).slice(0, 100);
  }
  const store = await readFileStore();
  const notices = Object.values(store.notices);
  const filtered = organizationId ? notices.filter((item) => item.organizationId === organizationId) : notices;
  return filtered.sort((a, b) => b.sessionId.localeCompare(a.sessionId)).slice(0, 100);
}

/** Dev helper: clear a profile from the file store (unused in production). */
export async function deleteGivingProfile(slug: string) {
  const key = slug.toLowerCase();
  const db = getFirestoreDb();
  if (db) {
    await deleteDoc(doc(db, PROFILE_COLLECTION, key));
    return;
  }
  const store = await readFileStore();
  delete store.profiles[key];
  await writeFileStore(store);
}
