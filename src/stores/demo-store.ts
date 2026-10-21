"use client";

import { create } from "zustand";
import { DEMO_ADMIN_USER_ID, MEECHIE_ORG_ID } from "@/config/constants";
import { demoRepository } from "@/lib/repositories/local";
import { createSeedDatabase } from "@/lib/demo/seed";
import { loadDatabase, loadSession, saveSession } from "@/lib/demo/storage";
import { createId } from "@/lib/ids";
import { hasPermission, type Permission } from "@/lib/permissions";
import {
  appendAudit,
  assignVolunteer,
  checkInAttendee,
  applyStripePayment,
  publishEvent,
  recordDonation,
  recordExpense,
  recordMovement,
  recordService,
  registerForEvent,
  removeAssignment,
  simulateCampaign,
  upsertMember,
  type Result,
  type StripePaymentNotice,
} from "@/lib/domain/workflows";
import { publishGivingProfile } from "@/lib/giving/publish-client";
import type {
  Announcement,
  AssistanceRequest,
  CommunityMember,
  DemoDatabase,
  DonateButton,
  Donation,
  Donor,
  Household,
  InventoryItem,
  MessageTemplate,
  Organization,
  OrgEvent,
  PlanId,
  Program,
  Sponsor,
  User,
  Volunteer,
  VolunteerInterest,
} from "@/types/models";

interface DemoStore {
  hydrated: boolean;
  db: DemoDatabase;
  userId: string | null;
  orgId: string | null;
  sidebarCollapsed: boolean;
  mobileNav: boolean;
  searchOpen: boolean;
  helpOpen: boolean;
  tourStep: number | null;
  hydrate: () => Promise<void>;
  resetDemo: () => Promise<void>;
  enterDemo: (userId?: string) => void;
  enterByEmail: (email: string) => Result<{ role: User["role"] }>;
  registerUser: (input: { name: string; email: string }) => Result<User>;
  exitDemo: () => void;
  setOrg: (orgId: string) => void;
  setUser: (userId: string) => void;
  setSidebarCollapsed: (value: boolean) => void;
  setMobileNav: (value: boolean) => void;
  setSearchOpen: (value: boolean) => void;
  setHelpOpen: (value: boolean) => void;
  setTourStep: (step: number | null) => void;
  saveMember: (member: CommunityMember, mode: "create" | "update") => Result<CommunityMember>;
  saveHousehold: (household: Household, mode: "create" | "update") => Result<Household>;
  saveProgram: (program: Program, mode: "create" | "update") => Result<Program>;
  saveEvent: (event: OrgEvent, mode: "create" | "update") => Result<OrgEvent>;
  setEventStatus: (eventId: string, status: OrgEvent["status"]) => Result<OrgEvent>;
  openRegistration: (eventId: string) => Result<true>;
  registerMember: (eventId: string, memberId: string, source: "admin" | "portal") => Result<true>;
  portalRegister: (input: { organizationId: string; eventId: string; firstName: string; lastName: string; email: string; phone: string; city: string; neighborhood: string; consentEmail: boolean }) => Result<true>;
  portalDonate: (input: { organizationId: string; name: string; email: string; amountCents: number; programId: string | null; type: Donation["type"]; method: Donation["method"] }) => Result<true>;
  applyVerifiedPayment: (notice: StripePaymentNotice) => Result<Donation>;
  reloadFromStorage: () => void;
  checkIn: (registrationId: string) => Result<true>;
  cancelRegistration: (registrationId: string) => Result<true>;
  saveVolunteer: (volunteer: Volunteer, mode: "create" | "update") => Result<Volunteer>;
  assign: (volunteerId: string, eventId: string, role: string) => Result<true>;
  unassign: (assignmentId: string) => Result<true>;
  logService: (input: { volunteerId: string; eventId: string | null; hours: number; date: string; notes: string }) => Result<true>;
  saveDonor: (donor: Donor, mode: "create" | "update") => Result<Donor>;
  saveDonation: (donation: Donation, mode: "create" | "update") => Result<Donation>;
  saveDonateButton: (button: DonateButton, mode: "create" | "update") => Result<DonateButton>;
  deleteDonateButton: (buttonId: string) => Result<true>;
  saveSponsor: (sponsor: Sponsor, mode: "create" | "update") => Result<Sponsor>;
  saveItem: (item: InventoryItem, mode: "create" | "update") => Result<InventoryItem>;
  moveStock: (input: { itemId: string; type: "received" | "distributed" | "adjustment_in" | "adjustment_out"; quantity: number; eventId: string | null; note: string }) => Result<true>;
  addExpense: (input: { amountCents: number; date: string; category: string; description: string; programId: string | null; eventId: string | null }) => Result<true>;
  saveAnnouncement: (announcement: Announcement) => Result<Announcement>;
  sendCampaign: (templateId: string, groupId: string) => Result<true>;
  saveTemplate: (template: MessageTemplate) => Result<MessageTemplate>;
  addNote: (memberId: string, body: string) => Result<true>;
  addAssistance: (input: Omit<AssistanceRequest, "id" | "createdAt" | "updatedAt" | "status">) => Result<AssistanceRequest>;
  setAssistanceStatus: (id: string, status: AssistanceRequest["status"]) => Result<true>;
  addInterest: (input: Omit<VolunteerInterest, "id" | "createdAt" | "updatedAt" | "status">) => Result<VolunteerInterest>;
  convertInterest: (id: string) => Result<true>;
  saveOrganization: (org: Organization) => Result<Organization>;
  setOrganizationStatus: (orgId: string, status: Organization["status"]) => Result<true>;
  createWorkspace: (input: { organization: Organization; admin: User; planId: PlanId }) => Result<Organization>;
  updatePlanPrice: (planId: PlanId, monthlyPriceCents: number | null) => Result<true>;
  saveReport: (input: { title: string; periodStart: string; periodEnd: string; programId: string | null; eventId: string | null; location: string | null }) => Result<true>;
}

function sessionFrom(state: Pick<DemoStore, "userId" | "orgId" | "sidebarCollapsed" | "tourStep">) {
  saveSession({
    userId: state.userId,
    orgId: state.orgId,
    sidebarCollapsed: state.sidebarCollapsed,
    tourStep: state.tourStep,
  });
}

export const useDemoStore = create<DemoStore>((set, get) => {
  const commit = (db: DemoDatabase) => {
    void demoRepository.save(db);
    set({ db });
  };

  const fail = <T>(error: string): Result<T> => ({ ok: false, error });

  const actor = (permission: Permission): Result<{ name: string; orgId: string }> => {
    const { db, userId } = get();
    if (!userId) return fail("Sign in before changing records.");
    const user = db.users.find((item) => item.id === userId);
    const org = db.organizations.find((item) => item.id === MEECHIE_ORG_ID);
    if (!user || !org) return fail("Session is incomplete.");
    if (!hasPermission(user.role, permission)) return fail("Your role does not include that action.");
    return { ok: true, data: { name: user.name, orgId: org.id } };
  };

  const replace = <T extends { id: string }>(rows: T[], row: T, mode: "create" | "update") =>
    mode === "create" ? [row, ...rows] : rows.map((item) => (item.id === row.id ? row : item));

  return {
    hydrated: false,
    db: createSeedDatabase(),
    userId: null,
    orgId: null,
    sidebarCollapsed: false,
    mobileNav: false,
    searchOpen: false,
    helpOpen: false,
    tourStep: null,

    hydrate: async () => {
      const hadStoredDatabase = Boolean(loadDatabase());
      const db = await demoRepository.load();
      const session = loadSession();
      const current = get();
      const requestedUser = session?.userId ?? current.userId;
      const user = db.users.find((item) => item.id === requestedUser) ?? null;
      set({
        db,
        hydrated: true,
        userId: user?.id ?? null,
        orgId: user ? MEECHIE_ORG_ID : null,
        sidebarCollapsed: session?.sidebarCollapsed ?? current.sidebarCollapsed,
        tourStep: session?.tourStep ?? current.tourStep,
      });
      if (user) sessionFrom({ ...get(), userId: user.id, orgId: MEECHIE_ORG_ID });
      if (!hadStoredDatabase) void demoRepository.save(db);
    },

    resetDemo: async () => {
      const db = await demoRepository.reset();
      const userId = get().userId;
      const user = db.users.find((item) => item.id === userId);
      set({
        db,
        userId: user?.id ?? DEMO_ADMIN_USER_ID,
        orgId: user?.organizationId ?? MEECHIE_ORG_ID,
      });
      sessionFrom(get());
    },

    enterDemo: (userId = DEMO_ADMIN_USER_ID) => {
      const user = get().db.users.find((item) => item.id === userId) ?? get().db.users.find((item) => item.id === DEMO_ADMIN_USER_ID);
      if (!user) return;
      set({ userId: user.id, orgId: MEECHIE_ORG_ID, tourStep: 0 });
      sessionFrom(get());
    },

    enterByEmail: (email) => {
      const normalized = email.trim().toLowerCase();
      const user = get().db.users.find((item) => item.email.toLowerCase() === normalized);
      if (!user) return fail("No The Meechie Project account is linked to this email yet.");
      set({ userId: user.id, orgId: MEECHIE_ORG_ID, tourStep: user.id.startsWith("user_") ? 0 : null });
      sessionFrom(get());
      return { ok: true, data: { role: user.role } };
    },

    registerUser: (input) => {
      const email = input.email.trim().toLowerCase();
      if (get().db.users.some((item) => item.email.toLowerCase() === email)) {
        return fail("An account with this email already exists. Sign in instead.");
      }
      const now = new Date().toISOString();
      const name = input.name.trim();
      const user: User = {
        id: createId("user"),
        organizationId: MEECHIE_ORG_ID,
        name,
        email,
        role: "community_member",
        title: "Community member",
        avatarInitials: name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? "")
          .join("") || "CM",
        createdAt: now,
        updatedAt: now,
      };
      commit(
        appendAudit(
          { ...get().db, users: [user, ...get().db.users] },
          MEECHIE_ORG_ID,
          user.name,
          "user.registered",
          "user",
          user.id,
          `${user.name} created an account.`,
        ),
      );
      set({ userId: user.id, orgId: MEECHIE_ORG_ID, tourStep: null });
      sessionFrom(get());
      return { ok: true, data: user };
    },

    exitDemo: () => {
      set({ userId: null, orgId: null, tourStep: null, mobileNav: false });
      sessionFrom(get());
    },

    setOrg: (_orgId) => {
      set({ orgId: MEECHIE_ORG_ID });
      sessionFrom({ ...get(), orgId: MEECHIE_ORG_ID });
    },

    setUser: (userId) => {
      const user = get().db.users.find((item) => item.id === userId);
      if (!user) return;
      set({ userId: user.id, orgId: MEECHIE_ORG_ID });
      sessionFrom(get());
    },

    setSidebarCollapsed: (sidebarCollapsed) => {
      set({ sidebarCollapsed });
      sessionFrom(get());
    },
    setMobileNav: (mobileNav) => set({ mobileNav }),
    setSearchOpen: (searchOpen) => set({ searchOpen }),
    setHelpOpen: (helpOpen) => set({ helpOpen }),
    setTourStep: (tourStep) => {
      set({ tourStep });
      sessionFrom(get());
    },

    saveMember: (member, mode) => {
      const who = actor("community.manage");
      if (!who.ok) return who;
      const result = upsertMember(get().db, { member: { ...member, organizationId: who.data.orgId }, actorName: who.data.name, mode });
      if (!result.ok) return result;
      commit(result.data.db);
      return { ok: true, data: result.data.member };
    },

    saveHousehold: (household, mode) => {
      const who = actor("community.manage");
      if (!who.ok) return who;
      const now = new Date().toISOString();
      const next = { ...household, organizationId: who.data.orgId, updatedAt: now };
      commit(
        appendAudit(
          { ...get().db, households: replace(get().db.households, next, mode) },
          who.data.orgId,
          who.data.name,
          mode === "create" ? "household.created" : "household.updated",
          "household",
          next.id,
          next.name,
        ),
      );
      return { ok: true, data: next };
    },

    saveProgram: (program, mode) => {
      const who = actor("programs.manage");
      if (!who.ok) return who;
      const now = new Date().toISOString();
      const next = { ...program, organizationId: who.data.orgId, updatedAt: now };
      if (next.endDate < next.startDate) return fail("End date must be on or after the start date.");
      commit(
        appendAudit(
          { ...get().db, programs: replace(get().db.programs, next, mode) },
          who.data.orgId,
          who.data.name,
          "program.saved",
          "program",
          next.id,
          next.name,
        ),
      );
      return { ok: true, data: next };
    },

    saveEvent: (event, mode) => {
      const who = actor("events.manage");
      if (!who.ok) return who;
      const now = new Date().toISOString();
      const next = { ...event, organizationId: who.data.orgId, updatedAt: now };
      if (new Date(next.endAt) <= new Date(next.startAt)) return fail("End time must be after the start time.");
      commit(
        appendAudit(
          { ...get().db, events: replace(get().db.events, next, mode) },
          who.data.orgId,
          who.data.name,
          "event.saved",
          "event",
          next.id,
          next.name,
        ),
      );
      return { ok: true, data: next };
    },

    setEventStatus: (eventId, status) => {
      const who = actor("events.manage");
      if (!who.ok) return who;
      const event = get().db.events.find((item) => item.id === eventId && item.organizationId === who.data.orgId);
      if (!event) return fail("Event not found.");
      const now = new Date().toISOString();
      const next = { ...event, status, updatedAt: now };
      commit(
        appendAudit(
          { ...get().db, events: get().db.events.map((item) => (item.id === event.id ? next : item)) },
          who.data.orgId,
          who.data.name,
          "event.status",
          "event",
          event.id,
          `${event.name} marked ${status.replaceAll("_", " ")}.`,
        ),
      );
      return { ok: true, data: next };
    },

    openRegistration: (eventId) => {
      const who = actor("events.manage");
      if (!who.ok) return who;
      const event = get().db.events.find((item) => item.id === eventId && item.organizationId === who.data.orgId);
      if (!event) return fail("Event not found.");
      const result = publishEvent(get().db, event, who.data.name, true);
      if (!result.ok) return result;
      commit(result.data.db);
      return { ok: true, data: true };
    },

    registerMember: (eventId, memberId, source) => {
      const who = actor("events.manage");
      if (!who.ok) return who;
      const result = registerForEvent(get().db, {
        organizationId: who.data.orgId,
        eventId,
        memberId,
        source,
        actorName: who.data.name,
      });
      if (!result.ok) return result;
      commit(result.data.db);
      return { ok: true, data: true };
    },

    portalRegister: (input) => {
      const org = get().db.organizations.find((item) => item.id === input.organizationId);
      if (!org?.portalEnabled) return fail("Registration is closed for this portal.");
      const now = new Date().toISOString();
      let db = get().db;
      let member = db.members.find(
        (item) => item.organizationId === input.organizationId && item.email?.toLowerCase() === input.email.toLowerCase(),
      );
      if (!member) {
        const household: Household = {
          id: createId("hh"),
          organizationId: input.organizationId,
          name: `${input.lastName} Household`,
          city: input.city,
          neighborhood: input.neighborhood,
          postalCode: org.postalCode,
          createdAt: now,
          updatedAt: now,
        };
        member = {
          id: createId("mem"),
          organizationId: input.organizationId,
          householdId: household.id,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          city: input.city,
          isMinor: false,
          guardianMemberId: null,
          preferredChannel: "email",
          consentEmail: input.consentEmail,
          consentSms: false,
          consentWhatsapp: false,
          status: "active",
          registeredAt: now,
          createdAt: now,
          updatedAt: now,
        };
        db = { ...db, households: [household, ...db.households], members: [member, ...db.members] };
      }
      const result = registerForEvent(db, {
        organizationId: input.organizationId,
        eventId: input.eventId,
        memberId: member.id,
        source: "portal",
        actorName: "Community portal",
      });
      if (!result.ok) return result;
      commit(result.data.db);
      return { ok: true, data: true };
    },

    portalDonate: (input) => {
      if (input.method === "card" || input.method === "ach") return fail("Card and bank gifts are collected on Stripe Checkout.");
      const org = get().db.organizations.find((item) => item.id === input.organizationId);
      if (!org?.portalEnabled) return fail("Donations are closed for this portal.");
      const now = new Date().toISOString();
      let db = get().db;
      let donor = db.donors.find(
        (item) => item.organizationId === input.organizationId && item.email.toLowerCase() === input.email.toLowerCase(),
      );
      if (!donor) {
        donor = {
          id: createId("dnr"),
          organizationId: input.organizationId,
          name: input.name,
          email: input.email,
          phone: "(214) 555-0100",
          type: input.type === "corporate" ? "corporate" : "individual",
          city: org.city,
          createdAt: now,
          updatedAt: now,
        };
        db = { ...db, donors: [donor, ...db.donors] };
      }
      const result = recordDonation(db, {
        organizationId: input.organizationId,
        donorId: donor.id,
        amountCents: input.amountCents,
        date: now,
        type: input.type,
        programId: input.programId,
        method: input.method,
        reference: `SIM-PORTAL-${now.slice(0, 10)}`,
        status: "completed",
        inKindDescription: null,
        sponsorId: null,
        actorName: "Community portal",
      });
      if (!result.ok) return result;
      commit(result.data.db);
      return { ok: true, data: true };
    },

    applyVerifiedPayment: (notice) => {
      const result = applyStripePayment(get().db, notice);
      if (!result.ok) return result;
      if (!result.data.alreadyApplied) commit(result.data.db);
      return { ok: true, data: result.data.donation };
    },

    reloadFromStorage: () => {
      const stored = loadDatabase();
      if (stored) set({ db: stored });
    },

    checkIn: (registrationId) => {
      const who = actor("events.checkin");
      if (!who.ok) return who;
      const result = checkInAttendee(get().db, { organizationId: who.data.orgId, registrationId, actorName: who.data.name });
      if (!result.ok) return result;
      commit(result.data.db);
      return { ok: true, data: true };
    },

    cancelRegistration: (registrationId) => {
      const who = actor("events.manage");
      if (!who.ok) return who;
      const registration = get().db.registrations.find((item) => item.id === registrationId && item.organizationId === who.data.orgId);
      if (!registration) return fail("Registration not found.");
      const now = new Date().toISOString();
      const registrations = get().db.registrations.map((item) =>
        item.id === registration.id ? { ...item, status: "cancelled" as const, updatedAt: now } : item,
      );
      const event = get().db.events.find((item) => item.id === registration.eventId);
      const active = registrations.filter((item) => item.eventId === registration.eventId && item.status !== "cancelled").length;
      const events = get().db.events.map((item) =>
        item.id === registration.eventId && item.status === "full" && event && active < event.capacity
          ? { ...item, status: "registration_open" as const, updatedAt: now }
          : item,
      );
      commit(
        appendAudit(
          { ...get().db, registrations, events },
          who.data.orgId,
          who.data.name,
          "registration.cancelled",
          "registration",
          registration.id,
          "Registration cancelled.",
        ),
      );
      return { ok: true, data: true };
    },

    saveVolunteer: (volunteer, mode) => {
      const who = actor("volunteers.manage");
      if (!who.ok) return who;
      const now = new Date().toISOString();
      const next = { ...volunteer, organizationId: who.data.orgId, updatedAt: now };
      commit(
        appendAudit(
          { ...get().db, volunteers: replace(get().db.volunteers, next, mode) },
          who.data.orgId,
          who.data.name,
          "volunteer.saved",
          "volunteer",
          next.id,
          `${next.firstName} ${next.lastName}`,
        ),
      );
      return { ok: true, data: next };
    },

    assign: (volunteerId, eventId, role) => {
      const who = actor("volunteers.manage");
      if (!who.ok) return who;
      const result = assignVolunteer(get().db, { organizationId: who.data.orgId, volunteerId, eventId, role, actorName: who.data.name });
      if (!result.ok) return result;
      commit(result.data.db);
      return { ok: true, data: true };
    },

    unassign: (assignmentId) => {
      const who = actor("volunteers.manage");
      if (!who.ok) return who;
      const result = removeAssignment(get().db, { organizationId: who.data.orgId, assignmentId, actorName: who.data.name });
      if (!result.ok) return result;
      commit(result.data.db);
      return { ok: true, data: true };
    },

    logService: (input) => {
      const who = actor("volunteers.manage");
      if (!who.ok) return who;
      const result = recordService(get().db, { ...input, organizationId: who.data.orgId, actorName: who.data.name });
      if (!result.ok) return result;
      commit(result.data.db);
      return { ok: true, data: true };
    },

    saveDonor: (donor, mode) => {
      const who = actor("donations.manage");
      if (!who.ok) return who;
      const now = new Date().toISOString();
      const next = { ...donor, organizationId: who.data.orgId, updatedAt: now };
      commit(
        appendAudit(
          { ...get().db, donors: replace(get().db.donors, next, mode) },
          who.data.orgId,
          who.data.name,
          "donor.saved",
          "donor",
          next.id,
          next.name,
        ),
      );
      return { ok: true, data: next };
    },

    saveDonation: (donation, mode) => {
      const who = actor("donations.manage");
      if (!who.ok) return who;
      if (mode === "create") {
        if (donation.method === "card" || donation.method === "ach") return fail("Card and bank gifts are collected on Stripe Checkout.");
        const result = recordDonation(get().db, { ...donation, organizationId: who.data.orgId, actorName: who.data.name });
        if (!result.ok) return result;
        commit(result.data.db);
        return { ok: true, data: result.data.donation };
      }
      if (!Number.isInteger(donation.amountCents) || donation.amountCents <= 0) return fail("Enter a donation amount greater than zero.");
      const now = new Date().toISOString();
      const next = { ...donation, organizationId: who.data.orgId, updatedAt: now };
      commit(
        appendAudit(
          { ...get().db, donations: replace(get().db.donations, next, "update") },
          who.data.orgId,
          who.data.name,
          "donation.updated",
          "donation",
          next.id,
          "Donation updated.",
        ),
      );
      return { ok: true, data: next };
    },

    saveDonateButton: (button, mode) => {
      const who = actor("donations.manage");
      if (!who.ok) return who;
      if (!button.label.trim()) return fail("Add a button label.");
      if (!Number.isFinite(button.defaultAmount) || button.defaultAmount <= 0) return fail("Set a default gift amount.");
      const now = new Date().toISOString();
      const next: DonateButton = {
        ...button,
        id: mode === "create" ? createId("btn") : button.id,
        organizationId: who.data.orgId,
        label: button.label.trim(),
        amounts: button.amounts.filter((amount) => amount > 0).slice(0, 8),
        updatedAt: now,
        createdAt: mode === "create" ? now : button.createdAt,
      };
      const db = {
        ...get().db,
        donateButtons: replace(get().db.donateButtons ?? [], next, mode),
      };
      commit(
        appendAudit(db, who.data.orgId, who.data.name, "donate_button.saved", "donate_button", next.id, next.label),
      );
      const org = db.organizations.find((item) => item.id === who.data.orgId);
      if (org) {
        void publishGivingProfile({
          organization: org,
          buttons: db.donateButtons.filter((item) => item.organizationId === org.id),
          programs: db.programs,
        }).catch(() => undefined);
      }
      return { ok: true, data: next };
    },

    deleteDonateButton: (buttonId) => {
      const who = actor("donations.manage");
      if (!who.ok) return who;
      const existing = get().db.donateButtons.find((item) => item.id === buttonId && item.organizationId === who.data.orgId);
      if (!existing) return fail("Donate button not found.");
      const db = {
        ...get().db,
        donateButtons: get().db.donateButtons.filter((item) => item.id !== buttonId),
      };
      commit(appendAudit(db, who.data.orgId, who.data.name, "donate_button.deleted", "donate_button", buttonId, existing.label));
      const org = db.organizations.find((item) => item.id === who.data.orgId);
      if (org) {
        void publishGivingProfile({
          organization: org,
          buttons: db.donateButtons.filter((item) => item.organizationId === org.id),
          programs: db.programs,
        }).catch(() => undefined);
      }
      return { ok: true, data: true };
    },

    saveSponsor: (sponsor, mode) => {
      const who = actor("sponsors.manage");
      if (!who.ok) return who;
      if (sponsor.programIds.length === 0) return fail("Select at least one program.");
      const now = new Date().toISOString();
      const next = { ...sponsor, organizationId: who.data.orgId, updatedAt: now };
      commit(
        appendAudit(
          { ...get().db, sponsors: replace(get().db.sponsors, next, mode) },
          who.data.orgId,
          who.data.name,
          "sponsor.saved",
          "sponsor",
          next.id,
          next.companyName,
        ),
      );
      return { ok: true, data: next };
    },

    saveItem: (item, mode) => {
      const who = actor("inventory.manage");
      if (!who.ok) return who;
      const now = new Date().toISOString();
      const next = { ...item, organizationId: who.data.orgId, updatedAt: now };
      commit(
        appendAudit(
          { ...get().db, inventoryItems: replace(get().db.inventoryItems, next, mode) },
          who.data.orgId,
          who.data.name,
          "inventory.saved",
          "inventory",
          next.id,
          next.name,
        ),
      );
      return { ok: true, data: next };
    },

    moveStock: (input) => {
      const who = actor("inventory.manage");
      if (!who.ok) return who;
      const result = recordMovement(get().db, { ...input, organizationId: who.data.orgId, actorName: who.data.name });
      if (!result.ok) return result;
      commit(result.data.db);
      return { ok: true, data: true };
    },

    addExpense: (input) => {
      const who = actor("reports.financial");
      if (!who.ok) {
        const fallback = actor("programs.manage");
        if (!fallback.ok) return who;
        const result = recordExpense(get().db, { ...input, organizationId: fallback.data.orgId, actorName: fallback.data.name });
        if (!result.ok) return result;
        commit(result.data.db);
        return { ok: true, data: true };
      }
      const result = recordExpense(get().db, { ...input, organizationId: who.data.orgId, actorName: who.data.name });
      if (!result.ok) return result;
      commit(result.data.db);
      return { ok: true, data: true };
    },

    saveAnnouncement: (announcement) => {
      const who = actor("communications.manage");
      if (!who.ok) return who;
      const now = new Date().toISOString();
      const next = { ...announcement, organizationId: who.data.orgId, updatedAt: now };
      const exists = get().db.announcements.some((item) => item.id === next.id);
      commit(
        appendAudit(
          { ...get().db, announcements: replace(get().db.announcements, next, exists ? "update" : "create") },
          who.data.orgId,
          who.data.name,
          "announcement.saved",
          "announcement",
          next.id,
          next.title,
        ),
      );
      return { ok: true, data: next };
    },

    sendCampaign: (templateId, groupId) => {
      const who = actor("communications.manage");
      if (!who.ok) return who;
      const result = simulateCampaign(get().db, { organizationId: who.data.orgId, templateId, groupId, actorName: who.data.name });
      if (!result.ok) return result;
      commit(result.data.db);
      return { ok: true, data: true };
    },

    saveTemplate: (template) => {
      const who = actor("communications.manage");
      if (!who.ok) return who;
      const now = new Date().toISOString();
      const next = { ...template, organizationId: who.data.orgId, updatedAt: now };
      const exists = get().db.templates.some((item) => item.id === next.id);
      commit({ ...get().db, templates: replace(get().db.templates, next, exists ? "update" : "create") });
      return { ok: true, data: next };
    },

    addNote: (memberId, body) => {
      const who = actor("community.manage");
      if (!who.ok) return who;
      const now = new Date().toISOString();
      const note = {
        id: createId("note"),
        organizationId: who.data.orgId,
        memberId,
        authorName: who.data.name,
        body,
        createdAt: now,
        updatedAt: now,
      };
      commit({ ...get().db, notes: [note, ...get().db.notes] });
      return { ok: true, data: true };
    },

    addAssistance: (input) => {
      const orgId = input.organizationId;
      const org = get().db.organizations.find((item) => item.id === orgId);
      if (!org || !org.portalEnabled) return fail("The public portal is not accepting requests for this organization.");
      const now = new Date().toISOString();
      const request: AssistanceRequest = { ...input, id: createId("asr"), status: "new", createdAt: now, updatedAt: now };
      commit(
        appendAudit(
          { ...get().db, assistanceRequests: [request, ...get().db.assistanceRequests] },
          orgId,
          "Community portal",
          "assistance.created",
          "assistance",
          request.id,
          `${request.requestType} request from the public portal.`,
        ),
      );
      return { ok: true, data: request };
    },

    setAssistanceStatus: (id, status) => {
      const who = actor("community.manage");
      if (!who.ok) return who;
      const now = new Date().toISOString();
      commit({
        ...get().db,
        assistanceRequests: get().db.assistanceRequests.map((item) =>
          item.id === id && item.organizationId === who.data.orgId ? { ...item, status, updatedAt: now } : item,
        ),
      });
      return { ok: true, data: true };
    },

    addInterest: (input) => {
      const org = get().db.organizations.find((item) => item.id === input.organizationId);
      if (!org?.portalEnabled) return fail("Volunteer interest is closed for this portal.");
      const now = new Date().toISOString();
      const interest: VolunteerInterest = { ...input, id: createId("vin"), status: "new", createdAt: now, updatedAt: now };
      commit(
        appendAudit(
          { ...get().db, volunteerInterests: [interest, ...get().db.volunteerInterests] },
          input.organizationId,
          "Community portal",
          "interest.created",
          "interest",
          interest.id,
          `${interest.name} expressed interest in volunteering.`,
        ),
      );
      return { ok: true, data: interest };
    },

    convertInterest: (id) => {
      const who = actor("volunteers.manage");
      if (!who.ok) return who;
      const interest = get().db.volunteerInterests.find((item) => item.id === id && item.organizationId === who.data.orgId);
      if (!interest) return fail("Interest form not found.");
      const now = new Date().toISOString();
      const [firstName, ...rest] = interest.name.split(" ");
      const volunteer: Volunteer = {
        id: createId("vol"),
        organizationId: who.data.orgId,
        firstName: firstName || interest.name,
        lastName: rest.join(" ") || "Volunteer",
        email: interest.email,
        phone: interest.phone,
        skills: [interest.interests],
        interests: [interest.interests],
        availability: [interest.availability],
        status: "applicant",
        safeguardingStatus: "not_started",
        safeguardingNote: "Converted from a portal interest form. Screening has not been recorded.",
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      commit({
        ...get().db,
        volunteers: [volunteer, ...get().db.volunteers],
        volunteerInterests: get().db.volunteerInterests.map((item) =>
          item.id === interest.id ? { ...item, status: "converted" as const, updatedAt: now } : item,
        ),
      });
      return { ok: true, data: true };
    },

    saveOrganization: (org) => {
      const who = actor("settings.manage");
      if (!who.ok) return who;
      if (org.id !== MEECHIE_ORG_ID) return fail("This app is The Meechie Project only.");
      const now = new Date().toISOString();
      const next = { ...org, id: MEECHIE_ORG_ID, updatedAt: now };
      commit({ ...get().db, organizations: get().db.organizations.map((item) => (item.id === next.id ? next : item)) });
      return { ok: true, data: next };
    },

    setOrganizationStatus: (_orgId, _status) => fail("This app is The Meechie Project only."),

    createWorkspace: (_input) => fail("This app is The Meechie Project only. Create a staff account instead."),

    updatePlanPrice: (_planId, _monthlyPriceCents) => fail("This app is The Meechie Project only."),

    saveReport: (input) => {
      const who = actor("reports.view");
      if (!who.ok) return who;
      const now = new Date().toISOString();
      const report = { id: createId("rpt"), organizationId: who.data.orgId, ...input, createdAt: now, updatedAt: now };
      commit(
        appendAudit(
          { ...get().db, reports: [report, ...get().db.reports] },
          who.data.orgId,
          who.data.name,
          "report.saved",
          "report",
          report.id,
          input.title,
        ),
      );
      return { ok: true, data: true };
    },
  };
});
