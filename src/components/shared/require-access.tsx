"use client";

import { AccessDenied, PlanLock } from "@/components/shared/feedback";
import { useSession } from "@/hooks/use-org";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { Entitlement } from "@/types/models";

export function RequireAccess({
  permission,
  entitlement,
  feature,
  children,
}: {
  permission: Permission;
  entitlement?: Entitlement;
  feature: string;
  children: React.ReactNode;
}) {
  const { user, plan } = useSession();
  if (!user) return null;
  if (!hasPermission(user.role, permission)) return <AccessDenied />;
  if (entitlement && user.role !== "platform_super_admin" && !plan?.entitlements.includes(entitlement)) {
    return <PlanLock feature={feature} plan={entitlement === "reports" ? "Starter" : "Growth"} />;
  }
  return children;
}
