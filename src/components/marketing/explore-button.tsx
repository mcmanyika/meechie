"use client";

import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { DEMO_ADMIN_USER_ID } from "@/config/constants";
import { useDemoStore } from "@/stores/demo-store";
import { cn } from "cn";

export function ExploreButton({ className, children = "Explore demo" }: { className?: string; children?: React.ReactNode }) {
  const enterDemo = useDemoStore((state) => state.enterDemo);
  const router = useRouter();
  return (
    <button
      type="button"
      className={cn(buttonVariants(), className)}
      onClick={() => {
        enterDemo(DEMO_ADMIN_USER_ID);
        router.push("/dashboard");
      }}
    >
      {children}
    </button>
  );
}
