import { saveDatabase, loadDatabase } from "@/lib/demo/storage";
import { createSeedDatabase } from "@/lib/demo/seed";
import type { DemoDatabase } from "@/types/models";

/**
 * Local demo repository. Replace this module with a Firebase implementation
 * that satisfies the same async methods. Tenant isolation is the caller's
 * organizationId filter — localStorage is not a security boundary.
 */
export const demoRepository = {
  async load(): Promise<DemoDatabase> {
    return loadDatabase() ?? createSeedDatabase();
  },
  async save(database: DemoDatabase): Promise<void> {
    saveDatabase(database);
  },
  async reset(): Promise<DemoDatabase> {
    const database = createSeedDatabase();
    saveDatabase(database);
    return database;
  },
};

export type DemoRepository = typeof demoRepository;
