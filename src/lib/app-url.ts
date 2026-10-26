/**
 * Canonical public site origin for embed links and Stripe return URLs.
 * Prefer NEXT_PUBLIC_APP_URL in production so preview hosts do not leak into links.
 */
export function getAppUrl(fallbackOrigin?: string | null): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (fallbackOrigin) return fallbackOrigin.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.origin) return window.location.origin;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return vercel.startsWith("http") ? vercel.replace(/\/$/, "") : `https://${vercel}`;
  return "http://localhost:3000";
}
