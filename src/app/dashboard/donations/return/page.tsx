import { Suspense } from "react";
import { StripeReturn } from "@/components/donations/stripe-return";

export default function DonationReturnPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm">Confirming the Stripe payment…</p>}>
      <StripeReturn destination="/dashboard/donations" />
    </Suspense>
  );
}
