import type { Entitlement, Role } from "@/types/models";

export type Permission =
  | "dashboard.view"
  | "community.view"
  | "community.manage"
  | "programs.view"
  | "programs.manage"
  | "events.view"
  | "events.manage"
  | "events.checkin"
  | "volunteers.view"
  | "volunteers.manage"
  | "donations.view"
  | "donations.manage"
  | "sponsors.view"
  | "sponsors.manage"
  | "inventory.view"
  | "inventory.manage"
  | "communications.view"
  | "communications.manage"
  | "reports.view"
  | "reports.financial"
  | "settings.manage"
  | "platform.manage";

const ALL: Permission[] = [
  "dashboard.view",
  "community.view",
  "community.manage",
  "programs.view",
  "programs.manage",
  "events.view",
  "events.manage",
  "events.checkin",
  "volunteers.view",
  "volunteers.manage",
  "donations.view",
  "donations.manage",
  "sponsors.view",
  "sponsors.manage",
  "inventory.view",
  "inventory.manage",
  "communications.view",
  "communications.manage",
  "reports.view",
  "reports.financial",
  "settings.manage",
  "platform.manage",
];

export const PERMISSIONS: Record<Role, Permission[]> = {
  platform_super_admin: ALL,
  organization_admin: ALL.filter((permission) => permission !== "platform.manage"),
  program_manager: [
    "dashboard.view",
    "community.view",
    "community.manage",
    "programs.view",
    "programs.manage",
    "events.view",
    "events.manage",
    "events.checkin",
    "volunteers.view",
    "inventory.view",
    "inventory.manage",
    "communications.view",
    "communications.manage",
    "reports.view",
    "sponsors.view",
  ],
  volunteer_coordinator: [
    "dashboard.view",
    "community.view",
    "programs.view",
    "events.view",
    "events.manage",
    "events.checkin",
    "volunteers.view",
    "volunteers.manage",
    "inventory.view",
    "communications.view",
    "communications.manage",
  ],
  finance_manager: [
    "dashboard.view",
    "programs.view",
    "donations.view",
    "donations.manage",
    "sponsors.view",
    "sponsors.manage",
    "reports.view",
    "reports.financial",
  ],
  volunteer: ["dashboard.view", "events.view", "volunteers.view"],
  community_member: ["dashboard.view", "events.view", "programs.view"],
  sponsor: ["dashboard.view", "reports.view", "sponsors.view", "programs.view"],
};

export const ROLE_LABELS: Record<Role, string> = {
  platform_super_admin: "Platform Super Admin",
  organization_admin: "Organization Admin",
  program_manager: "Program Manager",
  volunteer_coordinator: "Volunteer Coordinator",
  finance_manager: "Finance Manager",
  volunteer: "Volunteer",
  community_member: "Community Member",
  sponsor: "Sponsor",
};

export function hasPermission(role: Role, permission: Permission) {
  return PERMISSIONS[role].includes(permission);
}

export function canSwitchOrganizations(role: Role) {
  return role === "platform_super_admin" || role === "organization_admin";
}

export const ENTITLEMENT_FOR_PERMISSION: Partial<Record<Permission, Entitlement>> = {
  "community.view": "community",
  "community.manage": "community",
  "programs.view": "programs",
  "programs.manage": "programs",
  "events.view": "events",
  "events.manage": "events",
  "events.checkin": "events",
  "volunteers.view": "volunteers",
  "volunteers.manage": "volunteers",
  "donations.view": "donations",
  "donations.manage": "donations",
  "sponsors.view": "sponsors",
  "sponsors.manage": "sponsors",
  "inventory.view": "inventory",
  "inventory.manage": "inventory",
  "communications.view": "communications",
  "communications.manage": "communications",
  "reports.view": "reports",
  "reports.financial": "reports",
};

export function entitlementAllows(entitlements: Entitlement[], permission: Permission) {
  const required = ENTITLEMENT_FOR_PERMISSION[permission];
  if (!required) return true;
  if (permission === "reports.financial" && !entitlements.includes("advanced_reports") && !entitlements.includes("donations")) {
    return entitlements.includes("reports");
  }
  return entitlements.includes(required);
}
