import { doc, setDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import type { PublicGivingProfile } from "@/lib/giving/types";
import type { DonateButton, Organization, Program } from "@/types/models";

function buildProfile(input: {
  organization: Organization;
  buttons: DonateButton[];
  programs: Program[];
}): PublicGivingProfile {
  const active = input.buttons.filter((button) => button.active && button.organizationId === input.organization.id);
  return {
    organizationId: input.organization.id,
    slug: input.organization.slug.toLowerCase(),
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
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Publishes the public give page. On Vercel, Firestore is required because the
 * local `.data` file store does not persist across serverless instances.
 */
export async function publishGivingProfile(input: {
  organization: Organization;
  buttons: DonateButton[];
  programs: Program[];
}) {
  const profile = buildProfile(input);
  const db = getFirestoreDb();
  if (db) {
    try {
      await setDoc(doc(db, "givingProfiles", profile.slug), profile);
    } catch {
      throw new Error(
        "Could not publish to Firestore. Sign in, then deploy firestore.rules so signed-in staff can write givingProfiles.",
      );
    }
  }

  const response = await fetch("/api/giving/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: profile.organizationId,
      slug: profile.slug,
      name: profile.name,
      logoText: profile.logoText,
      primaryColor: profile.primaryColor,
      currency: profile.currency,
      description: profile.description,
      programs: profile.programs,
      buttons: profile.buttons,
    }),
  });

  if (!db && !response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Could not publish donate buttons.");
  }
}
