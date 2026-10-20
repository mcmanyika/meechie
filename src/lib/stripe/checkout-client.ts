export type CheckoutRequest = {
  organizationId: string;
  name: string;
  email: string;
  amountCents: number;
  programId: string | null;
  type: "one_time" | "recurring" | "corporate";
  method: "card" | "ach";
  donorId?: string | null;
  returnTo: "portal" | "dashboard" | "embed";
  orgSlug?: string;
};

export async function startStripeCheckout(input: CheckoutRequest) {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !body.url) throw new Error(body.error ?? "Stripe Checkout is unavailable.");
  window.location.assign(body.url);
}
