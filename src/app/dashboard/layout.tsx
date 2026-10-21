"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingBlock } from "@/components/shared/feedback";
import { useSession } from "@/hooks/use-org";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && user?.accountStatus === "pending") {
      router.replace("/pending");
    }
  }, [hydrated, user, router]);

  if (hydrated && user?.accountStatus === "pending") {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <LoadingBlock />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
