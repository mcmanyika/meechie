"use client";

import { useMemo } from "react";
import { STAFF_ROLES } from "@/config/constants";
import { canSwitchOrganizations, entitlementAllows, hasPermission, type Permission } from "@/lib/permissions";
import { useDemoStore } from "@/stores/demo-store";
import type { DemoDatabase, Entitlement } from "@/types/models";

export function useSession() {
  const db = useDemoStore((state) => state.db);
  const userId = useDemoStore((state) => state.userId);
  const orgId = useDemoStore((state) => state.orgId);
  const hydrated = useDemoStore((state) => state.hydrated);
  const user = db.users.find((item) => item.id === userId) ?? null;
  const organization = db.organizations.find((item) => item.id === orgId) ?? null;
  const subscription = db.subscriptions.find((item) => item.organizationId === orgId) ?? null;
  const plan = db.plans.find((item) => item.id === subscription?.planId) ?? null;
  const allowed = (permission: Permission) => {
    if (!user) return false;
    if (!hasPermission(user.role, permission)) return false;
    if (!plan) return true;
    if (user.role === "platform_super_admin") return true;
    return entitlementAllows(plan.entitlements, permission);
  };
  const organizations = db.organizations.filter((org) => {
    if (!user) return false;
    if (canSwitchOrganizations(user.role)) return user.role === "platform_super_admin" || org.status !== "suspended";
    return org.id === user.organizationId;
  });
  const seatsUsed = db.users.filter(
    (item) => item.organizationId === orgId && STAFF_ROLES.includes(item.role as (typeof STAFF_ROLES)[number]),
  ).length;
  return { db, user, organization, subscription, plan, hydrated, allowed, organizations, seatsUsed, orgId };
}

export function useOrgRows<K extends keyof DemoDatabase>(key: K) {
  const rows = useDemoStore((state) => state.db[key]);
  const orgId = useDemoStore((state) => state.orgId);
  return useMemo(() => {
    if (!orgId || !Array.isArray(rows)) return [] as unknown as Extract<DemoDatabase[K], readonly { organizationId: string }[]>;
    return (rows as { organizationId: string }[]).filter((row) => row.organizationId === orgId) as unknown as Extract<
      DemoDatabase[K],
      readonly { organizationId: string }[]
    >;
  }, [rows, orgId]);
}

export function useEntitled(entitlement: Entitlement) {
  const { plan, user } = useSession();
  if (!user) return false;
  if (user.role === "platform_super_admin") return true;
  return Boolean(plan?.entitlements.includes(entitlement));
}
