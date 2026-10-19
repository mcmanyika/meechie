import { describe, expect, it } from "vitest";
import { MEECHIE_ORG_ID, NORTHSIDE_ORG_ID } from "@/config/constants";
import { computeImpact, executiveSnapshot, stockOnHand } from "@/lib/domain/metrics";
import { createSeedDatabase } from "@/lib/demo/seed";
import { checkInAttendee, recordDonation, recordMovement, registerForEvent } from "@/lib/domain/workflows";

const db = createSeedDatabase(new Date("2026-10-18T15:00:00.000Z"));

describe("seed integrity", () => {
  it("keeps Meechie counts and isolates a second tenant", () => {
    expect(db.members.filter((member) => member.organizationId === MEECHIE_ORG_ID)).toHaveLength(150);
    expect(db.registrations.filter((registration) => registration.organizationId === NORTHSIDE_ORG_ID)).toHaveLength(20);
    expect(db.events.find((event) => event.name === "Back-to-School Community Giveaway")?.organizationId).toBe(MEECHIE_ORG_ID);
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
    const north = executiveSnapshot(db, NORTHSIDE_ORG_ID, new Date("2026-10-18T15:00:00.000Z"));
    const meechie = executiveSnapshot(db, MEECHIE_ORG_ID, new Date("2026-10-18T15:00:00.000Z"));
    expect(north.donationsCents).not.toBe(meechie.donationsCents);
  });
});

describe("event registration", () => {
  const event = db.events.find((item) => item.id === "evt_meechie_giveaway")!;
  const registered = new Set(db.registrations.filter((item) => item.eventId === event.id).map((item) => item.memberId));
  const member = db.members.find((item) => item.organizationId === MEECHIE_ORG_ID && !registered.has(item.id))!;

  it("registers a member and blocks duplicates and other tenants", () => {
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
    const foreign = registerForEvent(db, {
      organizationId: NORTHSIDE_ORG_ID,
      eventId: event.id,
      memberId: member.id,
      source: "admin",
      actorName: "Test",
    });
    expect(foreign.ok).toBe(false);
  });

  it("stops at capacity", () => {
    const full = db.events.find((item) => item.id === "evt_meechie_stem")!;
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
      method: "card_sim",
      reference: "SIM-TEST",
      status: "completed",
      inKindDescription: null,
      sponsorId: null,
      actorName: "Test",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(executiveSnapshot(result.data.db, MEECHIE_ORG_ID).donationsCents).toBe(before + 10000);
    expect(executiveSnapshot(result.data.db, NORTHSIDE_ORG_ID).donationsCents).toBe(executiveSnapshot(db, NORTHSIDE_ORG_ID).donationsCents);
  });

  it("refuses to distribute more stock than the ledger holds", () => {
    const item = db.inventoryItems.find((record) => record.organizationId === MEECHIE_ORG_ID)!;
    const onHand = stockOnHand(db, item.id);
    const blocked = recordMovement(db, {
      organizationId: MEECHIE_ORG_ID,
      itemId: item.id,
      type: "distributed",
      quantity: onHand + 1,
      eventId: null,
      note: "too many",
      actorName: "Test",
    });
    expect(blocked.ok).toBe(false);
    const allowed = recordMovement(db, {
      organizationId: MEECHIE_ORG_ID,
      itemId: item.id,
      type: "distributed",
      quantity: 1,
      eventId: null,
      note: "one unit",
      actorName: "Test",
    });
    expect(allowed.ok).toBe(true);
    if (!allowed.ok) return;
    expect(stockOnHand(allowed.data.db, item.id)).toBe(onHand - 1);
  });
});
