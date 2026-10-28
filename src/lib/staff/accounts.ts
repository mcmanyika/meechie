import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { MEECHIE_ORG_ID } from "@/config/constants";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import { createId } from "@/lib/ids";
import type { User } from "@/types/models";

const COLLECTION = "staffAccounts";

function emailKey(email: string) {
  return email.trim().toLowerCase();
}

export async function upsertStaffAccount(user: User): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const key = emailKey(user.email);
  await setDoc(
    doc(db, COLLECTION, key),
    {
      ...user,
      email: key,
      organizationId: user.organizationId ?? MEECHIE_ORG_ID,
    },
    { merge: true },
  );
}

export async function getStaffAccountByEmail(email: string): Promise<User | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTION, emailKey(email)));
  if (!snap.exists()) return null;
  return snap.data() as User;
}

export async function listStaffAccounts(): Promise<User[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((item) => item.data() as User);
}

/** Merge remote staff accounts into the local users list (by email). */
export function mergeStaffUsers(local: User[], remote: User[]): User[] {
  const byEmail = new Map(local.map((user) => [emailKey(user.email), user]));
  for (const remoteUser of remote) {
    const key = emailKey(remoteUser.email);
    const existing = byEmail.get(key);
    if (!existing) {
      byEmail.set(key, { ...remoteUser, email: key });
      continue;
    }
    const preferRemote = (remoteUser.updatedAt ?? "") >= (existing.updatedAt ?? "");
    const winner = preferRemote ? remoteUser : existing;
    byEmail.set(key, {
      ...winner,
      id: existing.id || remoteUser.id,
      email: key,
      organizationId: winner.organizationId ?? MEECHIE_ORG_ID,
      createdAt: existing.createdAt || remoteUser.createdAt,
    });
  }
  return Array.from(byEmail.values());
}

export function buildPendingUser(input: { name: string; email: string; id?: string }): User {
  const now = new Date().toISOString();
  const name = input.name.trim() || input.email.split("@")[0] || "New user";
  return {
    id: input.id ?? createId("user"),
    organizationId: MEECHIE_ORG_ID,
    name,
    email: emailKey(input.email),
    role: "community_member",
    title: "Pending staff access",
    avatarInitials:
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "CM",
    accountStatus: "pending",
    createdAt: now,
    updatedAt: now,
  };
}
