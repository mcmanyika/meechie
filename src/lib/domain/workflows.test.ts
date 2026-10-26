import { describe, expect, it } from "vitest";
import { MEECHIE_ORG_ID } from "@/config/constants";
import { computeImpact, executiveSnapshot, stockOnHand } from "@/lib/domain/metrics";
import { createSeedDatabase } from "@/lib/demo/seed";
import { applyStripePayment, checkInAttendee, recordDonation, recordMovement, registerForEvent } from "@/lib/domain/workflows";
import type { CommunityMember, DemoDatabase, Household, InventoryItem, OrgEvent } from "@/types/models";

const empty = createSeedDatabase(new Date("2026-10-18T15:00:00.000Z"));

function withFixtures(base: DemoDatabase = empty): DemoDatabase {
  const stamped = "2026-10-01T12:00:00.000Z";
  const household: Household = {
    id: "hh_test_1",
    organizationId: MEECHIE_ORG_ID,
    name: "Test Household",
    city: "Dallas",
    neighborhood: "North Dallas",
    postalCode: "75287",
    createdAt: stamped,
    updatedAt: stamped,
  };
  const member: CommunityMember = {
    id: "mem_test_1",
    organizationId: MEECHIE_ORG_ID,
    householdId: household.id,
    firstName: "Amina",
    lastName: "Cole",
    email: "amina.cole@example.com",
    phone: "(214) 555-0100",
    city: "Dallas",
    isMinor: false,
    guardianMemberId: null,
    preferredChannel: "email",
    consentEmail: true,
    consentSms: false,
    consentWhatsapp: false,
    status: "active",
    registeredAt: stamped,
    createdAt: stamped,
    updatedAt: stamped,
  };
  const memberTwo: CommunityMember = {
    ...member,
    id: "mem_test_2",
    firstName: "Jamal",
    lastName: "Reed",
    email: "jamal.reed@example.com",
  };
  const programId = base.programs[0]?.id ?? "prog_meechie_bts";
  const event: OrgEvent = {
    id: "evt_test_open",
    organizationId: MEECHIE_ORG_ID,
    programId,
    name: "Test Event",
    description: "Fixture event for workflow tests.",
    category: "workshop",
    startAt: "2026-11-01T15:00:00.000Z",
    endAt: "2026-11-01T18:00:00.000Z",
    location: "Dallas",
    city: "Dallas",
    capacity: 2,
    registrationDeadline: "2026-10-31T15:00:00.000Z",
    coordinatorUserId: base.users[0]!.id,
    volunteersNeeded: 2,
    budgetCents: 10000,
    status: "registration_open",
    createdAt: stamped,
    updatedAt: stamped,
  };
  const fullEvent: OrgEvent = {
    ...event,
    id: "evt_test_full",
    name: "Full Event",
    capacity: 1,
    status: "full",
  };
  const item: InventoryItem = {
    id: "inv_test_1",
    organizationId: MEECHIE_ORG_ID,
    name: "Backpacks",
    category: "Supplies",
    reorderThreshold: 5,
    location: "Storage",
    programId: null,
    createdAt: stamped,
    updatedAt: stamped,
  };
  return {
    ...base,
    households: [household],
    members: [member, memberTwo],
    events: [event, fullEvent],
    registrations: [
      {
        id: "reg_test_full",
        organizationId: MEECHIE_ORG_ID,
        eventId: fullEvent.id,
        memberId: member.id,
        status: "registered",
        source: "admin",
        registeredAt: stamped,
        createdAt: stamped,
        updatedAt: stamped,
      },
    ],
    inventoryItems: [item],
    inventoryMovements: [
      {
        id: "mov_test_1",
        organizationId: MEECHIE_ORG_ID,
        itemId: item.id,
        type: "received",
        quantity: 10,
        eventId: null,
        note: "Initial stock",
        createdAt: stamped,
        updatedAt: stamped,
      },
    ],
    donors: [
      {
        id: "don_test_1",
        organizationId: MEECHIE_ORG_ID,
        name: "Test Donor",
        email: "donor@example.com",
        phone: "(214) 555-0199",
        type: "individual",
        city: "Dallas",
        createdAt: stamped,
        updatedAt: stamped,
      },
    ],
  };
}

describe("seed integrity", () => {
  it("starts with org, admin, programs, and no dummy records", () => {
    expect(empty.organizations).toHaveLength(1);
    expect(empty.organizations[0]?.id).toBe(MEECHIE_ORG_ID);
    expect(empty.users).toHaveLength(1);
    expect(empty.programs).toHaveLength(6);
    expect(empty.members).toHaveLength(0);
    expect(empty.events).toHaveLength(0);
    expect(empty.donors).toHaveLength(0);
  });
});

describe("impact metrics", () => {
  it("returns zeros on an empty workspace", () => {
    const metrics = computeImpact(empty, {
      organizationId: MEECHIE_ORG_ID,
      start: new Date("2025-01-01T00:00:00.000Z"),
      end: new Date("2027-01-01T00:00:00.000Z"),
    });
    expect(metrics.individualsServed).toBe(0);
    expect(metrics.householdsServed).toBe(0);
    expect(metrics.eventsCompleted).toBe(0);
    expect(metrics.volunteerHours).toBe(0);
    expect(metrics.donationsCents).toBe(0);
    expect(executiveSnapshot(empty, MEECHIE_ORG_ID, new Date("2026-10-18T15:00:00.000Z")).donationsCents).toBe(0);
  });
});

describe("event registration", () => {
  const db = withFixtures();
  const event = db.events.find((item) => item.id === "evt_test_open")!;
  const member = db.members.find((item) => item.id === "mem_test_2")!;

  it("registers a member and blocks duplicates", () => {
    const first = registerForEvent(db, {
      organizationId: MEECHIE_ORG_ID,
      eventId: event.id,
      memberId: member.id,
      source: "portal",
      actorName: "Test",
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = registerForEvent(first.data.db, {
      organizationId: MEECHIE_ORG_ID,
      eventId: event.id,
      memberId: member.id,
      source: "admin",
      actorName: "Test",
    });
    expect(second.ok).toBe(false);
  });

  it("stops at capacity", () => {
    const full = db.events.find((item) => item.id === "evt_test_full")!;
    const next = db.members.find((item) => item.id === "mem_test_2")!;
    const result = registerForEvent(db, {
      organizationId: MEECHIE_ORG_ID,
      eventId: full.id,
      memberId: next.id,
      source: "admin",
      actorName: "Test",
    });
    expect(result.ok).toBe(false);
  });

  it("checks an attendee in once", () => {
    const registration = db.registrations.find((item) => item.eventId === "evt_test_full")!;
    const first = checkInAttendee(db, { organizationId: MEECHIE_ORG_ID, registrationId: registration.id, actorName: "Test" });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.data.db.attendance).toHaveLength(1);
    const second = checkInAttendee(first.data.db, { organizationId: MEECHIE_ORG_ID, registrationId: registration.id, actorName: "Test" });
    expect(second.ok).toBe(false);
  });
});

describe("fundraising and inventory", () => {
  const db = withFixtures();

  it("adds a completed donation to the organization total", () => {
    const before = executiveSnapshot(db, MEECHIE_ORG_ID).donationsCents;
    const donor = db.donors[0]!;
    const result = recordDonation(db, {
      organizationId: MEECHIE_ORG_ID,
      donorId: donor.id,
      amountCents: 10000,
      date: "2026-10-18T12:00:00.000Z",
      type: "one_time",
      programId: null,
      method: "card",
      reference: "SIM-TEST",
      status: "completed",
      inKindDescription: null,
      sponsorId: null,
      actorName: "Test",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(executiveSnapshot(result.data.db, MEECHIE_ORG_ID).donationsCents).toBe(before + 10000);
  });

  it("counts a verified Stripe gift once and waits to count a bank payment", () => {
    const before = executiveSnapshot(db, MEECHIE_ORG_ID).donationsCents;
    const paid = applyStripePayment(db, {
      sessionId: "cs_test_meechie_gift",
      organizationId: MEECHIE_ORG_ID,
      name: "Amina Cole",
      email: "amina.cole@example.com",
      amountCents: 12500,
      programId: null,
      type: "one_time",
      method: "card",
      donorId: null,
      status: "completed",
    });
    expect(paid.ok).toBe(true);
    if (!paid.ok) return;
    expect(executiveSnapshot(paid.data.db, MEECHIE_ORG_ID).donationsCents).toBe(before + 12500);
    const again = applyStripePayment(paid.data.db, {
      sessionId: "cs_test_meechie_gift",
      organizationId: MEECHIE_ORG_ID,
      name: "Amina Cole",
      email: "amina.cole@example.com",
      amountCents: 12500,
      programId: null,
      type: "one_time",
      method: "card",
      donorId: null,
      status: "completed",
    });
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.data.alreadyApplied).toBe(true);
    expect(executiveSnapshot(again.data.db, MEECHIE_ORG_ID).donationsCents).toBe(before + 12500);

    const pending = applyStripePayment(db, {
      sessionId: "cs_test_meechie_ach",
      organizationId: MEECHIE_ORG_ID,
      name: "Bank Donor",
      email: "bank.donor@example.com",
      amountCents: 5000,
      programId: null,
      type: "one_time",
      method: "ach",
      donorId: null,
      status: "pending",
    });
    expect(pending.ok).toBe(true);
    if (!pending.ok) return;
    expect(executiveSnapshot(pending.data.db, MEECHIE_ORG_ID).donationsCents).toBe(before);
    const settled = applyStripePayment(pending.data.db, {
      sessionId: "cs_test_meechie_ach",
      organizationId: MEECHIE_ORG_ID,
      name: "Bank Donor",
      email: "bank.donor@example.com",
      amountCents: 5000,
      programId: null,
      type: "one_time",
      method: "ach",
      donorId: null,
      status: "completed",
    });
    expect(settled.ok).toBe(true);
    if (!settled.ok) return;
    expect(executiveSnapshot(settled.data.db, MEECHIE_ORG_ID).donationsCents).toBe(before + 5000);
  });

  it("refuses to distribute more stock than the ledger holds", () => {
    const item = db.inventoryItems[0]!;
    const onHand = stockOnHand(db, item.id);
    const result = recordMovement(db, {
      organizationId: MEECHIE_ORG_ID,
      itemId: item.id,
      type: "distributed",
      quantity: onHand + 1,
      eventId: null,
      note: "Too many",
      actorName: "Test",
    });
    expect(result.ok).toBe(false);
  });
});
