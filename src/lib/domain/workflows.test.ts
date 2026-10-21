import { describe, expect, it } from "vitest";
import { MEECHIE_ORG_ID } from "@/config/constants";
import { computeImpact, executiveSnapshot, stockOnHand } from "@/lib/domain/metrics";
import { createSeedDatabase } from "@/lib/demo/seed";
import { applyStripePayment, checkInAttendee, recordDonation, recordMovement, registerForEvent } from "@/lib/domain/workflows";

const db = createSeedDatabase(new Date("2026-10-18T15:00:00.000Z"));

describe("seed integrity", () => {
  it("keeps Meechie counts as the only organization", () => {
    expect(db.organizations).toHaveLength(1);
    expect(db.organizations[0]?.id).toBe(MEECHIE_ORG_ID);
    expect(db.members.filter((member) => member.organizationId === MEECHIE_ORG_ID)).toHaveLength(150);
    expect(db.events.find((event) => event.name === "Back-to-School Meechie Giveaway")?.organizationId).toBe(MEECHIE_ORG_ID);
  });
});

describe("impact metrics", () => {
  it("derives households, hours, and completed gifts from records", () => {
    const metrics = computeImpact(db, {
      organizationId: MEECHIE_ORG_ID,
      start: new Date("2025-01-01T00:00:00.000Z"),
      end: new Date("2027-01-01T00:00:00.000Z"),
    });
    expect(metrics.individualsServed).toBe(80);
    expect(metrics.householdsServed).toBeGreaterThan(0);
    expect(metrics.householdsServed).toBeLessThanOrEqual(metrics.individualsServed);
    expect(metrics.eventsCompleted).toBe(9);
    expect(metrics.volunteerHours).toBeGreaterThan(0);
    expect(metrics.donationsCents).toBe(
      db.donations
        .filter((donation) => donation.organizationId === MEECHIE_ORG_ID && donation.status === "completed")
        .reduce((sum, donation) => sum + donation.amountCents, 0),
    );
    const meechie = executiveSnapshot(db, MEECHIE_ORG_ID, new Date("2026-10-18T15:00:00.000Z"));
    expect(meechie.donationsCents).toBe(0);
  });
});

describe("event registration", () => {
  const event = db.events.find((item) => item.id === "evt_meechie_giveaway")!;
  const registered = new Set(db.registrations.filter((item) => item.eventId === event.id).map((item) => item.memberId));
  const member = db.members.find((item) => item.organizationId === MEECHIE_ORG_ID && !registered.has(item.id))!;

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
    const full = db.events.find((item) => item.id === "evt_meechie_madness")!;
    const taken = new Set(db.registrations.filter((item) => item.eventId === full.id).map((item) => item.memberId));
    const next = db.members.find((item) => item.organizationId === MEECHIE_ORG_ID && !taken.has(item.id))!;
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
    const registration = db.registrations.find((item) => item.eventId === event.id)!;
    const first = checkInAttendee(db, { organizationId: MEECHIE_ORG_ID, registrationId: registration.id, actorName: "Test" });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.data.db.attendance.filter((item) => item.organizationId === MEECHIE_ORG_ID)).toHaveLength(81);
    const second = checkInAttendee(first.data.db, { organizationId: MEECHIE_ORG_ID, registrationId: registration.id, actorName: "Test" });
    expect(second.ok).toBe(false);
  });
});

describe("fundraising and inventory", () => {
  it("adds a completed donation to the organization total", () => {
    const before = executiveSnapshot(db, MEECHIE_ORG_ID).donationsCents;
    const donor = db.donors.find((item) => item.organizationId === MEECHIE_ORG_ID)!;
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
    const item = db.inventoryItems.find((row) => row.organizationId === MEECHIE_ORG_ID)!;
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
