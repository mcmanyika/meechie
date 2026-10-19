"use client";

import { AppShell } from "@/components/layout/app-shell";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <AppShell variant="platform">{children}</AppShell>;
}
