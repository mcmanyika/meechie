import type { DonateButton, Organization, Program } from "@/types/models";

export async function publishGivingProfile(input: {
  organization: Organization;
  buttons: DonateButton[];
  programs: Program[];
}) {
  const active = input.buttons.filter((button) => button.active && button.organizationId === input.organization.id);
  const response = await fetch("/api/giving/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: input.organization.id,
      slug: input.organization.slug,
      name: input.organization.name,
      logoText: input.organization.logoText,
      primaryColor: input.organization.primaryColor,
      currency: input.organization.currency,
      description: input.organization.description.slice(0, 500),
      programs: input.programs
        .filter((program) => program.organizationId === input.organization.id)
        .map((program) => ({ id: program.id, name: program.name })),
      buttons: active.map((button) => ({
        id: button.id,
        label: button.label,
        amounts: button.amounts,
        defaultAmount: button.defaultAmount,
        programIds: button.programIds ?? [],
        type: button.type,
      })),
    }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Could not publish donate buttons.");
  }
}
