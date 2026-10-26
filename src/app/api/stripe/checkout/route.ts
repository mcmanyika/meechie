import { z } from "zod";
import { getAppUrl } from "@/lib/app-url";
import { getStripe } from "@/lib/stripe/client";

const checkoutSchema = z.object({
  organizationId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  amountCents: z.number().int().min(50).max(100_000_000),
  programId: z.string().nullable(),
  type: z.enum(["one_time", "recurring", "corporate"]),
  method: z.enum(["card", "ach"]),
  donorId: z.string().nullable().optional(),
  returnTo: z.enum(["portal", "dashboard", "embed"]),
  orgSlug: z.string().trim().min(1).max(80).optional(),
});

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return Response.json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY to continue with card or bank checkout." }, { status: 503 });
  }
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the gift amount, name, and email." }, { status: 400 });
  const input = parsed.data;
  const origin = getAppUrl(new URL(request.url).origin);
  const slug = (input.orgSlug ?? "").toLowerCase();
  const returnPath =
    input.returnTo === "portal"
      ? "/portal/donate/return"
      : input.returnTo === "embed"
        ? `/give/${encodeURIComponent(slug)}/return`
        : "/dashboard/donations/return";
  const cancelPath =
    input.returnTo === "portal"
      ? "/portal/donate?canceled=1"
      : input.returnTo === "embed"
        ? `/give/${encodeURIComponent(slug)}?canceled=1`
        : "/dashboard/donations?canceled=1";
  if (input.returnTo === "embed" && !slug) {
    return Response.json({ error: "Embed checkout needs an organization slug." }, { status: 400 });
  }
  const metadata = {
    organizationId: input.organizationId,
    donorName: input.name,
    donorEmail: input.email,
    programId: input.programId ?? "",
    donationType: input.type,
    method: input.method,
    donorId: input.donorId ?? "",
    orgSlug: slug,
  };
  try {
    const session = await stripe.checkout.sessions.create({
      mode: input.type === "recurring" ? "subscription" : "payment",
      customer_email: input.email,
      allowed_payment_method_types: [input.method === "ach" ? "us_bank_account" : "card"],
      success_url: `${origin}${returnPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
      metadata,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: input.amountCents,
            product_data: { name: input.type === "recurring" ? "Monthly gift" : "Gift" },
            ...(input.type === "recurring" ? { recurring: { interval: "month" } } : {}),
          },
        },
      ],
    });
    if (!session.url) return Response.json({ error: "Stripe did not return a checkout link." }, { status: 502 });
    return Response.json({ url: session.url });
  } catch {
    return Response.json({ error: "Stripe could not start checkout." }, { status: 502 });
  }
}
