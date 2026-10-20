import { getGivingProfile } from "@/lib/giving/store";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const profile = await getGivingProfile(slug);
  if (!profile || profile.buttons.length === 0) {
    return Response.json({ error: "No active donate buttons for this organization." }, { status: 404 });
  }
  return Response.json(profile);
}
