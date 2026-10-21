"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoadingBlock } from "@/components/shared/feedback";
import { Button } from "@/components/ui/button";
import { STAFF_ROLES } from "@/config/constants";
import { useSession } from "@/hooks/use-org";
import { signOutAuth } from "@/lib/firebase/auth";
import { useDemoStore } from "@/stores/demo-store";

export default function PendingAccessPage() {
  const { user, hydrated } = useSession();
  const exitDemo = useDemoStore((state) => state.exitDemo);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (user.accountStatus !== "pending") {
      const staff = STAFF_ROLES.includes(user.role as (typeof STAFF_ROLES)[number]);
      router.replace(staff ? "/dashboard" : "/portal");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user || user.accountStatus !== "pending") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <LoadingBlock />
      </div>
    );
  }

  return (
    <AuthShell
      title="Waiting for activation"
      description="Your account was created. An organization admin must activate it before you can open the staff dashboard."
      footer={
        <>
          Signed in as {user.email}.{" "}
          <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <div className="grid gap-4 text-sm text-muted-foreground">
        <p>
          Ask a The Meechie Project admin to open <span className="font-medium text-foreground">Settings</span> and
          activate <span className="font-medium text-foreground">{user.name}</span>.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={() => {
            void signOutAuth().finally(() => {
              exitDemo();
              router.push("/");
            });
          }}
        >
          Sign out
        </Button>
      </div>
    </AuthShell>
  );
}
