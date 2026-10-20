"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { StripeReturn } from "@/components/donations/stripe-return";

export default function GiveReturnPage() {
  const params = useParams<{ slug: string }>();
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Confirming the Stripe payment…</p>}>
      <StripeReturn destination={`/give/${params.slug}`} />
    </Suspense>
  );
}