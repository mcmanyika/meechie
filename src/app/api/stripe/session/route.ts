import { upsertPaymentNotice } from "@/lib/giving/store";
import { getStripe } from "@/lib/stripe/client";
import { noticeFromSession } from "@/lib/stripe/payment";

export async function GET(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return Response.json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY to continue with card or bank checkout." }, { status: 503 });
  }
  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return Response.json({ error: "Stripe session is missing." }, { status: 400 });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent.latest_charge"] });
    const notice = noticeFromSession(session);
    if (!notice.ok) return Response.json({ error: notice.error }, { status: notice.status });
    await upsertPaymentNotice(notice.notice);
    return Response.json(notice.notice);
  } catch {
    return Response.json({ error: "Stripe could not confirm this checkout." }, { status: 502 });
  }
}
