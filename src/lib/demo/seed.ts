import { DEFAULT_PLANS } from "@/config/plans";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_USER_ID,
  MEECHIE_ORG_ID,
} from "@/config/constants";
import type {
  DemoDatabase,
  DonateButton,
  Organization,
  Program,
  User,
} from "@/types/models";

function iso(now: Date, dayOffset: number, hour = 10) {
  const date = new Date(now);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function meechiePrograms() {
  return [
    ["prog_meechie_madness", "Meechie's March Madness", "active", "Annual basketball tournament fundraiser that brings joy and entertainment into the community (300+ people touched)."],
    ["prog_meechie_summer", "Community Summer Bash", "active", "Free community block party with water games, foam party, live music, and merch giveaways (100+ people touched)."],
    ["prog_meechie_bts", "Back-to-School Meechie", "active", "School supplies and backpacks, free haircuts for kids, free food, and a Dallas Fire Department fire truck show (600+ people touched)."],
    ["prog_meechie_thanksgiving", "Thanksgiving Food Drive", "active", "Partnering with a local college to identify families and provide Thanksgiving groceries (~20 families)."],
    ["prog_meechie_christmas", "Christmas Giveaway", "active", "City of Dallas recreation center giveaway of toys and gift cards for local kids (200+ kids)."],
    ["prog_meechie_experience", "The Meechie Experience", "active", "Monthly after-school program at Timberglen Recreation Center: meal, activity, and a message of hope (35 kids per event)."],
  ].map(([id, name, status, summary]) => ({ id, name, status: status as Program["status"], summary }));
}

export function createSeedDatabase(now = new Date()): DemoDatabase {
  const stamped = iso(now, -30, 9);
  const meechie: Organization = {
    id: MEECHIE_ORG_ID,
    name: "The Meechie Project",
    slug: "meechie",
    logoText: "MP",
    description:
      "A Christian nonprofit in Dallas spreading the love and joy of God through community giveaways, programs, and events — resources for low-income areas, hope for youth, and education for the under-educated.",
    primaryColor: "#1DB954",
    secondaryColor: "#066CF4",
    email: "themeechieproject@gmail.com",
    phone: "(214) 406-5090",
    website: "https://themeechieproject.org",
    addressLine: "18616 Shadow Ridge Dr",
    city: "Dallas",
    state: "TX",
    postalCode: "75287",
    timezone: "America/Chicago",
    currency: "USD",
    status: "active",
    portalEnabled: true,
    portalWelcome:
      "Join an event, volunteer, or give. Our programs serve low-income families and youth across North Dallas — from Back-to-School Meechie to The Meechie Experience.",
    createdAt: stamped,
    updatedAt: stamped,
  };

  const admin: User = {
    id: DEMO_ADMIN_USER_ID,
    organizationId: MEECHIE_ORG_ID,
    name: "Partson Manyika",
    email: DEMO_ADMIN_EMAIL,
    role: "organization_admin",
    title: "Executive director",
    avatarInitials: "PM",
    accountStatus: "active",
    createdAt: stamped,
    updatedAt: stamped,
  };

  const programs: Program[] = meechiePrograms().map((program) => ({
    id: program.id,
    organizationId: MEECHIE_ORG_ID,
    name: program.name,
    description: program.summary,
    objectives: [
      "Serve families and youth in Dallas with joy-filled programs.",
      "Coordinate volunteers and supplies for scheduled activities.",
      "Record participation so impact reporting stays tied to activity.",
    ],
    status: program.status,
    coordinatorUserId: admin.id,
    budgetCents: 0,
    startDate: iso(now, -30, 8).slice(0, 10),
    endDate: iso(now, 335, 8).slice(0, 10),
    outcomes: [],
    createdAt: stamped,
    updatedAt: stamped,
  }));

  const database: DemoDatabase = {
    version: 1,
    seededAt: now.toISOString(),
    organizations: [meechie],
    users: [admin],
    plans: DEFAULT_PLANS.map((plan) => ({ ...plan, features: [...plan.features], entitlements: [...plan.entitlements] })),
    subscriptions: [
      {
        id: "sub_meechie",
        organizationId: MEECHIE_ORG_ID,
        planId: "enterprise",
        status: "active",
        seatLimit: null,
        monthlyPriceCents: null,
        startedAt: iso(now, -30, 9).slice(0, 10),
        renewsAt: iso(now, 335, 9).slice(0, 10),
        createdAt: stamped,
        updatedAt: stamped,
      },
    ],
    households: [],
    members: [],
    programs,
    events: [],
    registrations: [],
    attendance: [],
    volunteers: [],
    assignments: [],
    serviceLogs: [],
    donors: [],
    donations: [],
    donateButtons: [
      {
        id: "btn_meechie_website",
        organizationId: MEECHIE_ORG_ID,
        label: "Donate",
        amounts: [25, 50, 100, 250],
        defaultAmount: 50,
        programIds: [],
        type: "one_time",
        active: true,
        createdAt: stamped,
        updatedAt: stamped,
      } satisfies DonateButton,
    ],
    sponsors: [],
    inventoryItems: [],
    inventoryMovements: [],
    expenses: [],
    announcements: [],
    templates: [],
    groups: [],
    campaigns: [],
    assistanceRequests: [],
    volunteerInterests: [],
    notes: [],
    reports: [],
    tasks: [],
    outreachActivities: [],
    audit: [
      {
        id: "aud_seed",
        organizationId: MEECHIE_ORG_ID,
        actorName: admin.name,
        action: "workspace.ready",
        entityType: "organization",
        entityId: MEECHIE_ORG_ID,
        summary: "Clean The Meechie Project workspace ready.",
        createdAt: now.toISOString(),
      },
    ],
  };

  assertSeed(database);
  return database;
}

export function assertSeed(db: DemoDatabase) {
  if (db.organizations.length !== 1 || db.organizations[0]?.id !== MEECHIE_ORG_ID) {
    throw new Error("Seed must include only The Meechie Project.");
  }
  if (db.users.length !== 1 || db.users[0]?.email.toLowerCase() !== DEMO_ADMIN_EMAIL.toLowerCase()) {
    throw new Error("Seed must include only the primary admin user.");
  }
  if (db.programs.length !== 6) throw new Error(`Expected 6 programs, got ${db.programs.length}`);
  const emptyKeys: Array<keyof DemoDatabase> = [
    "households",
    "members",
    "events",
    "registrations",
    "attendance",
    "volunteers",
    "assignments",
    "serviceLogs",
    "donors",
    "donations",
    "sponsors",
    "inventoryItems",
    "inventoryMovements",
    "expenses",
    "announcements",
    "templates",
    "groups",
    "campaigns",
    "assistanceRequests",
    "volunteerInterests",
    "notes",
    "reports",
    "tasks",
    "outreachActivities",
  ];
  emptyKeys.forEach((key) => {
    const rows = db[key];
    if (!Array.isArray(rows) || rows.length !== 0) {
      throw new Error(`Seed ${String(key)} must be empty.`);
    }
  });
}
