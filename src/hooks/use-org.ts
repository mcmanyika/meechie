"use client";

import { useMemo } from "react";
import { MEECHIE_ORG_ID, STAFF_ROLES } from "@/config/constants";
import { hasPermission, type Permission } from "@/lib/permissions";
import { useDemoStore } from "@/stores/demo-store";
import type { DemoDatabase, Entitlement } from "@/types/models";

export function useSession() {
  const db = useDemoStore((state) => state.db);
  const userId = useDemoStore((state) => state.userId);
  const hydrated = useDemoStore((state) => state.hydrated);
  const user = db.users.find((item) => item.id === userId) ?? null;
  const organization = db.organizations.find((item) => item.id === MEECHIE_ORG_ID) ?? db.organizations[0] ?? null;
  const orgId = organization?.id ?? MEECHIE_ORG_ID;
  const subscription = db.subscriptions.find((item) => item.organizationId === orgId) ?? null;
  const plan = db.plans.find((item) => item.id === subscription?.planId) ?? db.plans.find((item) => item.id === "enterprise") ?? null;
  const allowed = (permission: Permission) => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };
  const seatsUsed = db.users.filter(
    (item) => item.organizationId === orgId && STAFF_ROLES.includes(item.role as (typeof STAFF_ROLES)[number]),
  ).length;
  return {
    db,
    user,
    organization,
    subscription,
    plan,
    hydrated,
    allowed,
    organizations: organization ? [organization] : [],
    seatsUsed,
    orgId,
  };
}

export function useOrgRows<K extends keyof DemoDatabase>(key: K) {
  const rows = useDemoStore((state) => state.db[key]);
  const orgId = useDemoStore((state) => state.orgId) ?? MEECHIE_ORG_ID;
  return useMemo(() => {
    if (!orgId || !Array.isArray(rows)) return [] as unknown as Extract<DemoDatabase[K], readonly { organizationId: string }[]>;
    return (rows as { organizationId: string }[]).filter((row) => row.organizationId === orgId) as unknown as Extract<
      DemoDatabase[K],
      readonly { organizationId: string }[]
    >;
  }, [rows, orgId]);
}

export function useEntitled(_entitlement: Entitlement) {
  const { user } = useSession();
  return Boolean(user);
}
