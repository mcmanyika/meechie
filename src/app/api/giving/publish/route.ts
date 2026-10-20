import { z } from "zod";
import { upsertGivingProfile } from "@/lib/giving/store";

const publishSchema = z.object({
  organizationId: z.string().trim().min(1),
  slug: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  logoText: z.string().trim().min(1).max(8),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  currency: z.string().trim().min(3).max(3),
  description: z.string().trim().max(500),
  programs: z.array(z.object({ id: z.string(), name: z.string() })).max(50),
  buttons: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        label: z.string().trim().min(1).max(60),
        amounts: z.array(z.number().positive().max(1_000_000)).max(8),
        defaultAmount: z.number().positive().max(1_000_000),
        programId: z.string().nullable(),
        type: z.enum(["one_time", "recurring"]),
      }),
    )
    .max(20),
});

export async function POST(request: Request) {
  const parsed = publishSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the donate button details." }, { status: 400 });
  const input = parsed.data;
  await upsertGivingProfile({
    organizationId: input.organizationId,
    slug: input.slug.toLowerCase(),
    name: input.name,
    logoText: input.logoText,
    primaryColor: input.primaryColor,
    currency: input.currency,
    description: input.description,
    programs: input.programs,
    buttons: input.buttons,
    updatedAt: new Date().toISOString(),
  });
  return Response.json({ ok: true });
}
