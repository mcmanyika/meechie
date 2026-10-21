"use client";

import { AccessDenied } from "@/components/shared/feedback";
import { useSession } from "@/hooks/use-org";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { Entitlement } from "@/types/models";

export function RequireAccess({
  permission,
  feature: _feature,
  entitlement: _entitlement,
  children,
}: {
  permission: Permission;
  entitlement?: Entitlement;
  feature: string;
  children: React.ReactNode;
}) {
  const { user } = useSession();
  if (!user) return null;
  if (!hasPermission(user.role, permission)) return <AccessDenied />;
  return children;
}
