"use client";

import { useEffect } from "react";
import type { StripePaymentNotice } from "@/lib/domain/workflows";
import { useDemoStore } from "@/stores/demo-store";

export function StripeSync() {
  const hydrated = useDemoStore((state) => state.hydrated);
  const orgId = useDemoStore((state) => state.orgId);
  const donations = useDemoStore((state) => state.db.donations);
  const apply = useDemoStore((state) => state.applyVerifiedPayment);
  const signature = donations
    .filter((donation) => donation.reference.startsWith("cs_") && (donation.status === "pending" || donation.status === "completed"))
    .slice(0, 8)
    .map((donation) => `${donation.reference}:${donation.status}`)
    .join("|");

  useEffect(() => {
    if (!hydrated) return;
    let stopped = false;
    const pullInbox = async () => {
      const query = orgId ? `?organizationId=${encodeURIComponent(orgId)}` : "";
      const response = await fetch(`/api/stripe/inbox${query}`);
      if (!response.ok || stopped) return;
      const body = (await response.json()) as { notices?: StripePaymentNotice[] };
      for (const notice of body.notices ?? []) {
        if (stopped) return;
        apply(notice);
      }
    };
    const tickSessions = async () => {
      if (!signature) return;
      const rows = signature.split("|");
      for (const row of rows) {
        const reference = row.slice(0, row.lastIndexOf(":"));
        const status = row.slice(row.lastIndexOf(":") + 1);
        const response = await fetch(`/api/stripe/session?session_id=${encodeURIComponent(reference)}`);
        if (response.status === 503) return;
        if (!response.ok || stopped) continue;
        const notice = (await response.json()) as StripePaymentNotice;
        if (notice.status !== status) apply(notice);
      }
    };
    const tick = async () => {
      await pullInbox();
      await tickSessions();
    };
    const timer = window.setInterval(() => void tick(), 8000);
    void tick();
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [hydrated, signature, apply, orgId]);

  return null;
}
