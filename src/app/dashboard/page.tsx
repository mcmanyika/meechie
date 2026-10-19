"use client";

import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";
import { RequireAccess } from "@/components/shared/require-access";

export default function DashboardPage() {
  return (
    <RequireAccess permission="dashboard.view" feature="Overview">
      <ExecutiveDashboard />
    </RequireAccess>
  );
}
