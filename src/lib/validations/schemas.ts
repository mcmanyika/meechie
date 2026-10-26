import { z } from "zod";

export const memberSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required.").max(40),
    lastName: z.string().trim().min(1, "Last name is required.").max(40),
    email: z.string().trim().email("Enter a valid email.").or(z.literal("")),
    phone: z.string().trim().max(30),
    householdId: z.string().min(1, "Choose a household."),
    city: z.string().trim().min(1, "City is required."),
    preferredChannel: z.enum(["email", "sms", "whatsapp", "phone"]),
    status: z.enum(["active", "inactive", "waitlist"]),
    isMinor: z.boolean(),
    guardianMemberId: z.string(),
    consentEmail: z.boolean(),
    consentSms: z.boolean(),
    consentWhatsapp: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.isMinor && !value.guardianMemberId) {
      ctx.addIssue({ code: "custom", path: ["guardianMemberId"], message: "Choose a guardian." });
    }
    if (!value.isMinor && value.preferredChannel === "email" && !value.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Email is required for this channel." });
    }
  });

export const householdSchema = z.object({
  name: z.string().trim().min(2, "Household name is required."),
  city: z.string().trim().min(1),
  neighborhood: z.string().trim().min(1),
  postalCode: z.string().trim().min(5).max(10),
});

export const programSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().min(10, "Add a short description."),
  objectives: z.string().trim().min(3, "Add at least one objective."),
  status: z.enum(["draft", "planned", "active", "completed", "archived"]),
  coordinatorUserId: z.string().min(1),
  budget: z.number().positive(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export const eventSchema = z
  .object({
    name: z.string().trim().min(3),
    description: z.string().trim().min(10),
    programId: z.string().min(1, "Choose a program."),
    category: z.enum(["distribution", "workshop", "outreach", "fundraiser", "volunteer"]),
    startAt: z.string().min(1),
    endAt: z.string().min(1),
    location: z.string().trim().min(2),
    city: z.string().trim().min(2),
    capacity: z.number().int().positive(),
    registrationDeadline: z.string().min(1),
    coordinatorUserId: z.string().min(1),
    volunteersNeeded: z.number().int().min(0),
    budget: z.number().min(0),
    status: z.enum(["draft", "published", "registration_open", "full", "completed", "cancelled"]),
  })
  .superRefine((value, ctx) => {
    if (new Date(value.endAt) <= new Date(value.startAt)) {
      ctx.addIssue({ code: "custom", path: ["endAt"], message: "End time must be after the start time." });
    }
  });

export const volunteerSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7),
  skills: z.string().trim().min(2, "List at least one skill."),
  interests: z.string().trim().min(2),
  availability: z.string().trim().min(2),
  status: z.enum(["applicant", "active", "inactive"]),
  safeguardingStatus: z.enum(["not_started", "in_progress", "verified", "not_required"]),
});

export const serviceSchema = z.object({
  volunteerId: z.string().min(1),
  eventId: z.string(),
  hours: z.number().positive().max(24),
  date: z.string().min(1),
  notes: z.string().trim().max(240),
});

export const donorSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7),
  type: z.enum(["individual", "corporate", "foundation"]),
  city: z.string().trim().min(2),
});

export const donationSchema = z.object({
  donorId: z.string().min(1, "Choose a donor."),
  amount: z.number().positive(),
  date: z.string().min(1),
  type: z.enum(["one_time", "recurring", "corporate", "in_kind"]),
  programId: z.string(),
  method: z.enum(["card", "ach", "check", "cash", "in_kind"]),
  reference: z.string().trim().max(200),
  status: z.enum(["pending", "completed", "refunded"]),
  inKindDescription: z.string().trim().max(160),
});

export const sponsorSchema = z.object({
  companyName: z.string().trim().min(2),
  contactName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7),
  tier: z.enum(["community", "supporting", "impact", "strategic"]),
  contribution: z.number().positive(),
  programIds: z.array(z.string()).min(1, "Select a program."),
  startDate: z.string().min(1),
  renewalDate: z.string().min(1),
  status: z.enum(["active", "pending", "expired"]),
});

export const inventorySchema = z.object({
  name: z.string().trim().min(2),
  category: z.string().trim().min(2),
  reorderThreshold: z.number().int().min(0),
  location: z.string().trim().min(2),
  programId: z.string(),
});

export const movementSchema = z.object({
  itemId: z.string().min(1),
  type: z.enum(["received", "distributed", "adjustment_in", "adjustment_out"]),
  quantity: z.number().int().positive(),
  eventId: z.string(),
  note: z.string().trim().max(180),
});

export const expenseSchema = z.object({
  amount: z.number().positive(),
  date: z.string().min(1),
  category: z.string().trim().min(2),
  description: z.string().trim().min(3),
  programId: z.string(),
  eventId: z.string(),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(3),
  body: z.string().trim().min(10),
  audience: z.string().trim().min(2),
});

export const portalRegistrationSchema = z.object({
  memberId: z.string().min(1, "Choose the household member who is attending."),
});

export const volunteerInterestSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7),
  interests: z.string().trim().min(2),
  availability: z.string().trim().min(2),
});

export const assistanceSchema = z.object({
  contactName: z.string().trim().min(2),
  contactMethod: z.enum(["email", "phone"]),
  contactValue: z.string().trim().min(5),
  neighborhood: z.string().trim().min(2),
  requestType: z.string().trim().min(2),
  message: z.string().trim().min(10).max(500),
});

export const donateSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  amount: z.number().positive(),
  type: z.enum(["one_time", "recurring", "corporate"]),
  programId: z.string(),
  method: z.enum(["card", "ach"]),
});

export const donateButtonSchema = z.object({
  label: z.string().trim().min(2).max(60),
  amounts: z.string().trim().min(1),
  defaultAmount: z.number().positive().max(1_000_000),
  programIds: z.array(z.string()),
  type: z.enum(["one_time", "recurring"]),
  active: z.boolean(),
});

export type DonateButtonFormValues = z.infer<typeof donateButtonSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerUserSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name."),
    email: z.string().trim().email("Enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const orgOnboardingSchema = z
  .object({
    name: z.string().trim().min(2, "Organization name is required."),
    city: z.string().trim().min(2, "City is required."),
    state: z.string().trim().min(2).max(2),
    description: z.string().trim().min(10, "Add a short description."),
    email: z.string().trim().email("Enter a valid organization email."),
    phone: z.string().trim().min(7, "Enter a phone number."),
    website: z.string().trim().url("Enter a full website URL."),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    adminName: z.string().trim().min(2, "Administrator name is required."),
    adminEmail: z.string().trim().email("Enter a valid administrator email."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
    planId: z.enum(["starter", "growth", "enterprise"]),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterUserFormValues = z.infer<typeof registerUserSchema>;

export const orgSettingsSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().min(10),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7),
  website: z.string().trim().url(),
  addressLine: z.string().trim().min(2),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  postalCode: z.string().trim().min(5),
  timezone: z.string().min(1),
  currency: z.string().length(3),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  portalEnabled: z.boolean(),
  portalWelcome: z.string().trim().min(10),
});

export const staffTaskSchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(120),
  description: z.string().trim().max(2000),
  status: z.enum(["todo", "in_progress", "blocked", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  assigneeUserId: z.string().min(1, "Choose an assignee."),
  programId: z.string(),
  dueDate: z.string(),
});

export const outreachActivitySchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(120),
  type: z.enum(["canvass", "neighborhood_visit", "flyering", "partnership", "other"]),
  status: z.enum(["planned", "completed", "cancelled"]),
  date: z.string().min(1, "Date is required."),
  neighborhood: z.string().trim().min(1, "Neighborhood is required.").max(80),
  city: z.string().trim().min(1, "City is required.").max(80),
  programId: z.string(),
  leadUserId: z.string().min(1, "Choose a lead."),
  volunteerIds: z.array(z.string()),
  householdsReached: z.number().int().min(0),
  individualsReached: z.number().int().min(0),
  notes: z.string().trim().max(2000),
});

export type MemberFormValues = z.infer<typeof memberSchema>;
export type ProgramFormValues = z.infer<typeof programSchema>;
export type EventFormValues = z.infer<typeof eventSchema>;
export type VolunteerFormValues = z.infer<typeof volunteerSchema>;
export type DonationFormValues = z.infer<typeof donationSchema>;
export type SponsorFormValues = z.infer<typeof sponsorSchema>;
export type DonorFormValues = z.infer<typeof donorSchema>;
export type InventoryFormValues = z.infer<typeof inventorySchema>;
export type MovementFormValues = z.infer<typeof movementSchema>;
export type StaffTaskFormValues = z.infer<typeof staffTaskSchema>;
export type OutreachActivityFormValues = z.infer<typeof outreachActivitySchema>;
