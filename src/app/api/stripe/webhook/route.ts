import type Stripe from "stripe";
import { upsertPaymentNotice } from "@/lib/giving/store";
import { getStripe } from "@/lib/stripe/client";
import { noticeFromSession } from "@/lib/stripe/payment";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return Response.json({ error: "Stripe is not configured." }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      const full = await stripe.checkout.sessions.retrieve(session.id, { expand: ["payment_intent.latest_charge"] });
      const notice = noticeFromSession(full);
      if (notice.ok) await upsertPaymentNotice(notice.notice);
    } catch {
      /* acknowledge anyway so Stripe does not retry forever on demo store issues */
    }
  }
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const sessionId = typeof charge.metadata?.checkoutSessionId === "string" ? charge.metadata.checkoutSessionId : "";
    if (sessionId.startsWith("cs_")) {
      try {
        const full = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent.latest_charge"] });
        const notice = noticeFromSession(full);
        if (notice.ok) await upsertPaymentNotice(notice.notice);
      } catch {
        /* ignore */
      }
    }
  }
  return Response.json({ received: true });
}
