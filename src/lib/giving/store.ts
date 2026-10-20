import { promises as fs } from "fs";
import path from "path";
import type { StripePaymentNotice } from "@/lib/domain/workflows";
import type { GivingStoreFile, PublicGivingProfile } from "@/lib/giving/types";

export type { PublicDonateButton, PublicGivingProfile, PublicProgram } from "@/lib/giving/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "giving.json");

async function readStore(): Promise<GivingStoreFile> {
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

async function writeStore(store: GivingStoreFile) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function getGivingProfile(slug: string): Promise<PublicGivingProfile | null> {
  const store = await readStore();
  return store.profiles[slug.toLowerCase()] ?? null;
}

export async function upsertGivingProfile(profile: PublicGivingProfile) {
  const store = await readStore();
  store.profiles[profile.slug.toLowerCase()] = profile;
  await writeStore(store);
}

export async function upsertPaymentNotice(notice: StripePaymentNotice) {
  const store = await readStore();
  store.notices[notice.sessionId] = notice;
  const keys = Object.keys(store.notices);
  if (keys.length > 300) {
    for (const key of keys.slice(0, keys.length - 300)) delete store.notices[key];
  }
  await writeStore(store);
}

export async function listPaymentNotices(organizationId?: string): Promise<StripePaymentNotice[]> {
  const store = await readStore();
  const notices = Object.values(store.notices);
  const filtered = organizationId ? notices.filter((item) => item.organizationId === organizationId) : notices;
  return filtered.sort((a, b) => b.sessionId.localeCompare(a.sessionId)).slice(0, 100);
}
