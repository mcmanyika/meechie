import type Stripe from "stripe";
import type { StripePaymentNotice } from "@/lib/domain/workflows";

export function noticeFromSession(
  session: Stripe.Checkout.Session,
): { ok: true; notice: StripePaymentNotice } | { ok: false; error: string; status: number } {
  if (session.status === "open") return { ok: false, error: "This checkout is still open.", status: 409 };
  if (!session.status || session.status === "expired") return { ok: false, error: "This checkout expired.", status: 410 };
  const metadata = session.metadata ?? {};
  const organizationId = metadata.organizationId ?? "";
  const name = metadata.donorName ?? "";
  const email = metadata.donorEmail ?? session.customer_details?.email ?? session.customer_email ?? "";
  const type = metadata.donationType;
  const method = metadata.method;
  if (!organizationId || !name || !email || (type !== "one_time" && type !== "recurring" && type !== "corporate") || (method !== "card" && method !== "ach")) {
    return { ok: false, error: "This checkout is missing gift details.", status: 422 };
  }
  if (session.amount_total == null || !Number.isInteger(session.amount_total) || session.amount_total <= 0) {
    return { ok: false, error: "Stripe did not return an amount.", status: 422 };
  }
  const intent = session.payment_intent && typeof session.payment_intent === "object" ? session.payment_intent : null;
  const charge = intent?.latest_charge && typeof intent.latest_charge === "object" ? intent.latest_charge : null;
  const refunded = Boolean(charge?.refunded);
  const status = refunded ? "refunded" : session.payment_status === "paid" ? "completed" : "pending";
  return {
    ok: true,
    notice: {
      sessionId: session.id,
      organizationId,
      name,
      email,
      amountCents: session.amount_total,
      programId: metadata.programId || null,
      type,
      method,
      donorId: metadata.donorId || null,
      status,
    },
  };
}
