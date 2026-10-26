import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_USER_ID, MEECHIE_ORG_ID } from "@/config/constants";
import { saveDatabase, loadDatabase } from "@/lib/demo/storage";
import { createSeedDatabase } from "@/lib/demo/seed";
import type { DemoDatabase, DonateButton, User } from "@/types/models";

function migrate(database: DemoDatabase): DemoDatabase {
  const needsButtons = !Array.isArray(database.donateButtons);
  const donations = database.donations.filter((donation) => !donation.reference.startsWith("SIM-"));
  const needsDonations = donations.length !== database.donations.length;
  let users = database.users.map((user) =>
    user.accountStatus === "pending" || user.accountStatus === "active"
      ? user
      : ({ ...user, accountStatus: "active" } satisfies User),
  );

  const adminEmail = DEMO_ADMIN_EMAIL.toLowerCase();
  const now = new Date().toISOString();
  const byEmail = users.find((user) => user.email.toLowerCase() === adminEmail);
  const byId = users.find((user) => user.id === DEMO_ADMIN_USER_ID);

  if (byEmail && byEmail.id !== DEMO_ADMIN_USER_ID) {
    users = users
      .filter((user) => user.id !== DEMO_ADMIN_USER_ID)
      .map((user) =>
        user.id === byEmail.id
          ? {
              ...user,
              role: "organization_admin" as const,
              title: "Executive director",
              accountStatus: "active" as const,
              organizationId: MEECHIE_ORG_ID,
              updatedAt: now,
            }
          : user,
      );
  } else if (byId && byId.email.toLowerCase() !== adminEmail) {
    users = users.map((user) =>
      user.id === DEMO_ADMIN_USER_ID
        ? {
            ...user,
            name: "Partson Manyika",
            email: DEMO_ADMIN_EMAIL,
            role: "organization_admin",
            title: "Executive director",
            avatarInitials: "PM",
            accountStatus: "active",
            organizationId: MEECHIE_ORG_ID,
            updatedAt: now,
          }
        : user.email.toLowerCase() === adminEmail
          ? { ...user, email: `${user.id}@replaced.local`, updatedAt: now }
          : user,
    );
  } else if (byEmail) {
    users = users.map((user) =>
      user.email.toLowerCase() === adminEmail
        ? {
            ...user,
            role: "organization_admin",
            title: "Executive director",
            accountStatus: "active",
            organizationId: MEECHIE_ORG_ID,
            updatedAt: now,
          }
        : user,
    );
  }

  const needsUsers =
    users.length !== database.users.length ||
    users.some((user, index) => {
      const prior = database.users[index];
      return (
        !prior ||
        user.id !== prior.id ||
        user.email !== prior.email ||
        user.role !== prior.role ||
        user.accountStatus !== prior.accountStatus ||
        user.name !== prior.name
      );
    });
  const needsTasks = !Array.isArray(database.tasks);
  const needsOutreach = !Array.isArray(database.outreachActivities);

  // Drop seed fixture inventory (`itm_meechie_001` …) left from earlier demo data.
  const inventoryItems = (database.inventoryItems ?? []).filter((item) => !item.id.startsWith("itm_meechie_"));
  const keptItemIds = new Set(inventoryItems.map((item) => item.id));
  const inventoryMovements = (database.inventoryMovements ?? []).filter(
    (movement) =>
      keptItemIds.has(movement.itemId) &&
      !movement.note.toLowerCase().includes("sample stock") &&
      !movement.note.toLowerCase().includes("sample distribution"),
  );
  const needsInventory =
    inventoryItems.length !== (database.inventoryItems?.length ?? 0) ||
    inventoryMovements.length !== (database.inventoryMovements?.length ?? 0);

  const rawButtons = needsButtons ? [] : (database.donateButtons ?? []);
  const donateButtons: DonateButton[] = rawButtons.map((button) => {
    const legacy = button as DonateButton & { programId?: string | null };
    if (Array.isArray(legacy.programIds)) {
      const { programId: _removed, ...rest } = legacy;
      return { ...rest, programIds: legacy.programIds };
    }
    return {
      ...legacy,
      programIds: legacy.programId ? [legacy.programId] : [],
    };
  });
  const needsButtonPrograms =
    !needsButtons &&
    donateButtons.some((button, index) => {
      const prior = rawButtons[index] as DonateButton & { programId?: string | null };
      return !Array.isArray(prior.programIds) || "programId" in prior;
    });

  if (
    !needsButtons &&
    !needsDonations &&
    !needsUsers &&
    !needsTasks &&
    !needsOutreach &&
    !needsInventory &&
    !needsButtonPrograms
  ) {
    return database;
  }

  const seededButton: DonateButton = {
    id: "btn_meechie_website",
    organizationId: MEECHIE_ORG_ID,
    label: "Donate",
    amounts: [25, 50, 100, 250],
    defaultAmount: 50,
    programIds: [],
    type: "one_time",
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...database,
    users,
    donateButtons: needsButtons ? [seededButton] : donateButtons,
    donations,
    tasks: needsTasks ? [] : database.tasks,
    outreachActivities: needsOutreach ? [] : database.outreachActivities,
    inventoryItems,
    inventoryMovements,
  };
}

/**
 * Local demo repository for The Meechie Project. Replace with Firebase (or
 * another backend) that satisfies the same async methods. localStorage is a
 * demo convenience, not a security boundary.
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
