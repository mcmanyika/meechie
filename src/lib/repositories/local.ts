import { MEECHIE_ORG_ID } from "@/config/constants";
import { saveDatabase, loadDatabase } from "@/lib/demo/storage";
import { createSeedDatabase } from "@/lib/demo/seed";
import type { DemoDatabase, DonateButton } from "@/types/models";

function migrate(database: DemoDatabase): DemoDatabase {
  const needsButtons = !Array.isArray(database.donateButtons);
  const donations = database.donations.filter((donation) => !donation.reference.startsWith("SIM-"));
  const needsDonations = donations.length !== database.donations.length;
  if (!needsButtons && !needsDonations) return database;
  const now = new Date().toISOString();
  const seededButton: DonateButton = {
    id: "btn_meechie_website",
    organizationId: MEECHIE_ORG_ID,
    label: "Donate",
    amounts: [25, 50, 100, 250],
    defaultAmount: 50,
    programId: null,
    type: "one_time",
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...database,
    donateButtons: needsButtons ? [seededButton] : database.donateButtons,
    donations,
  };
}

/**
 * Local demo repository. Replace this module with a Firebase implementation
 * that satisfies the same async methods. Tenant isolation is the caller's
 * organizationId filter — localStorage is not a security boundary.
 */
export const demoRepository = {
  async load(): Promise<DemoDatabase> {
    const stored = loadDatabase();
    if (!stored) return createSeedDatabase();
    const next = migrate(stored);
    if (next !== stored) saveDatabase(next);
    return next;
  },
  async save(database: DemoDatabase): Promise<void> {
    saveDatabase(migrate(database));
  },
  async reset(): Promise<DemoDatabase> {
    const database = createSeedDatabase();
    saveDatabase(database);
    return database;
  },
};

export type DemoRepository = typeof demoRepository;
