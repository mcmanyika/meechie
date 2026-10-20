import { listPaymentNotices } from "@/lib/giving/store";

export async function GET(request: Request) {
  const organizationId = new URL(request.url).searchParams.get("organizationId") ?? undefined;
  const notices = await listPaymentNotices(organizationId || undefined);
  return Response.json({ notices });
}
