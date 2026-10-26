import type { StripePaymentNotice } from "@/lib/domain/workflows";

export type PublicProgram = { id: string; name: string };

export type PublicDonateButton = {
  id: string;
  label: string;
  amounts: number[];
  defaultAmount: number;
  /** Empty = unrestricted. One or more = donor may designate among these programs. */
  programIds: string[];
  type: "one_time" | "recurring";
};

export type PublicGivingProfile = {
  organizationId: string;
  slug: string;
  name: string;
  logoText: string;
  primaryColor: string;
  currency: string;
  description: string;
  buttons: PublicDonateButton[];
  programs: PublicProgram[];
  updatedAt: string;
};

export type GivingStoreFile = {
  profiles: Record<string, PublicGivingProfile>;
  notices: Record<string, StripePaymentNotice>;
};
