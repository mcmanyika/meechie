"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { StripePaymentNotice } from "@/lib/domain/workflows";
import { useDemoStore } from "@/stores/demo-store";

export function StripeReturn({ destination }: { destination: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useDemoStore((state) => state.hydrated);
  const apply = useDemoStore((state) => state.applyVerifiedPayment);
  const started = useRef(false);

  useEffect(() => {
    if (!hydrated || started.current) return;
    const sessionId = params.get("session_id");
    if (!sessionId) {
      router.replace(destination);
      return;
    }
    started.current = true;
    void (async () => {
      const response = await fetch(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`);
      const body = (await response.json()) as StripePaymentNotice & { error?: string };
      if (!response.ok) {
        toast.error(body.error ?? "Stripe could not confirm this gift.");
        router.replace(destination);
        return;
      }
      const result = apply(body);
      if (!result.ok) toast.error(result.error);
      else if (body.status === "completed") toast.success("Gift recorded. Dashboard totals include it.");
      else if (body.status === "pending") toast.message("The bank payment is processing. The dashboard will include it when Stripe marks it paid.");
      else toast.success("Stripe updated this gift.");
      const successHome = destination.startsWith("/dashboard") ? "/dashboard" : destination;
      router.replace(body.status === "completed" && destination.startsWith("/dashboard") ? "/dashboard" : successHome);
    })();
  }, [apply, destination, hydrated, params, router]);

  return <p className="p-6 text-sm text-muted-foreground">Confirming the Stripe payment…</p>;
}
