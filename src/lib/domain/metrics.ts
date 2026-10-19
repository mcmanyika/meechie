import {
  addMonths,
  endOfMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import type { DemoDatabase, OrgEvent } from "@/types/models";

export interface ReportFilters {
  organizationId: string;
  start: Date;
  end: Date;
  programId?: string | null;
  eventId?: string | null;
  location?: string | null;
}

export interface ImpactMetrics {
  householdsServed: number;
  individualsServed: number;
  eventsCompleted: number;
  volunteerHours: number;
  donationsCents: number;
  expensesCents: number;
  suppliesDistributed: number;
  participationByProgram: { programId: string; name: string; participants: number }[];
}

/**
 * Derived metric rules:
 * - Individuals served: distinct members with a check-in attendance record in range.
 * - Households served: distinct households of those members.
 * - Volunteer hours: sum of service log hours in range. Assignments are not hours.
 * - Donations: sum of completed donation amounts in range. Pending and refunded are excluded.
 * - Expenses: sum of expense amounts in range.
 * - Supplies distributed: sum of distributed inventory movement quantities in range.
 * - Completed events: events with status completed whose start falls in range.
 * Manual program outcome narratives are never included in these figures.
 */
export function computeImpact(db: DemoDatabase, filters: ReportFilters): ImpactMetrics {
  const inRange = (iso: string) => {
    const date = parseISO(iso);
    return isWithinInterval(date, { start: filters.start, end: filters.end });
  };

  const events = db.events.filter((event) => event.organizationId === filters.organizationId);
  const eventById = new Map(events.map((event) => [event.id, event]));
  const matchesEvent = (eventId: string | null | undefined) => {
    if (!eventId) return !filters.eventId && !filters.programId && !filters.location;
    const event = eventById.get(eventId);
    if (!event) return false;
    if (filters.eventId && event.id !== filters.eventId) return false;
    if (filters.programId && event.programId !== filters.programId) return false;
    if (filters.location && event.city !== filters.location) return false;
    return true;
  };

  const scopedEvent = (event: OrgEvent) => {
    if (event.organizationId !== filters.organizationId) return false;
    if (filters.eventId && event.id !== filters.eventId) return false;
    if (filters.programId && event.programId !== filters.programId) return false;
    if (filters.location && event.city !== filters.location) return false;
    return true;
  };

  const attendance = db.attendance.filter(
    (record) =>
      record.organizationId === filters.organizationId &&
      inRange(record.checkedInAt) &&
      matchesEvent(record.eventId),
  );
  const memberIds = new Set(attendance.map((record) => record.memberId));
  const members = db.members.filter(
    (member) => member.organizationId === filters.organizationId && memberIds.has(member.id),
  );
  const households = new Set(members.map((member) => member.householdId));

  const hours = db.serviceLogs
    .filter(
      (log) =>
        log.organizationId === filters.organizationId &&
        inRange(log.date) &&
        (!log.eventId || matchesEvent(log.eventId)) &&
        (log.eventId || (!filters.eventId && !filters.programId && !filters.location)),
    )
    .reduce((sum, log) => sum + log.hours, 0);

  const donationsCents = db.donations
    .filter((donation) => {
      if (donation.organizationId !== filters.organizationId) return false;
      if (donation.status !== "completed") return false;
      if (!inRange(donation.date)) return false;
      if (filters.programId && donation.programId !== filters.programId) return false;
      if (filters.eventId || filters.location) return false;
      return true;
    })
    .reduce((sum, donation) => sum + donation.amountCents, 0);

  const expensesCents = db.expenses
    .filter((expense) => {
      if (expense.organizationId !== filters.organizationId) return false;
      if (!inRange(expense.date)) return false;
      if (filters.programId && expense.programId !== filters.programId) return false;
      if (filters.eventId && expense.eventId !== filters.eventId) return false;
      if (filters.location) {
        if (!expense.eventId) return false;
        return matchesEvent(expense.eventId);
      }
      return true;
    })
    .reduce((sum, expense) => sum + expense.amountCents, 0);

  const suppliesDistributed = db.inventoryMovements
    .filter(
      (movement) =>
        movement.organizationId === filters.organizationId &&
        movement.type === "distributed" &&
        inRange(movement.createdAt) &&
        (!movement.eventId ? !filters.eventId && !filters.programId && !filters.location : matchesEvent(movement.eventId)),
    )
    .reduce((sum, movement) => sum + movement.quantity, 0);

  const eventsCompleted = events.filter(
    (event) => event.status === "completed" && scopedEvent(event) && inRange(event.startAt),
  ).length;

  const programs = db.programs.filter((program) => program.organizationId === filters.organizationId);
  const participationByProgram = programs
    .filter((program) => !filters.programId || program.id === filters.programId)
    .map((program) => {
      const participants = new Set(
        attendance
          .filter((record) => eventById.get(record.eventId)?.programId === program.id)
          .map((record) => record.memberId),
      );
      return { programId: program.id, name: program.name, participants: participants.size };
    })
    .filter((row) => row.participants > 0);

  return {
    householdsServed: households.size,
    individualsServed: memberIds.size,
    eventsCompleted,
    volunteerHours: Math.round(hours * 100) / 100,
    donationsCents,
    expensesCents,
    suppliesDistributed,
    participationByProgram,
  };
}

export function monthBuckets(end: Date, count: number) {
  const start = startOfMonth(subMonths(end, count - 1));
  return Array.from({ length: count }, (_, index) => {
    const month = addMonths(start, index);
    return { start: startOfMonth(month), end: endOfMonth(month), label: month.toLocaleString("en-US", { month: "short" }) };
  });
}

export function stockOnHand(db: DemoDatabase, itemId: string) {
  return db.inventoryMovements
    .filter((movement) => movement.itemId === itemId)
    .reduce((sum, movement) => {
      if (movement.type === "received" || movement.type === "adjustment_in") return sum + movement.quantity;
      return sum - movement.quantity;
    }, 0);
}

export function activeRegistrationCount(db: DemoDatabase, eventId: string) {
  return db.registrations.filter(
    (registration) =>
      registration.eventId === eventId &&
      (registration.status === "registered" || registration.status === "checked_in"),
  ).length;
}

export function executiveSnapshot(db: DemoDatabase, organizationId: string, now = new Date()) {
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const inMonth = (iso: string) => isWithinInterval(parseISO(iso), { start: monthStart, end: monthEnd });
  const orgEvents = db.events.filter((event) => event.organizationId === organizationId);
  const servedMemberIds = new Set(
    db.attendance.filter((record) => record.organizationId === organizationId).map((record) => record.memberId),
  );
  const households = new Set(
    db.members
      .filter((member) => member.organizationId === organizationId && servedMemberIds.has(member.id))
      .map((member) => member.householdId),
  );
  return {
    donationsCents: db.donations
      .filter((donation) => donation.organizationId === organizationId && donation.status === "completed")
      .reduce((sum, donation) => sum + donation.amountCents, 0),
    familiesServed: households.size,
    activeVolunteers: db.volunteers.filter((volunteer) => volunteer.organizationId === organizationId && volunteer.status === "active").length,
    upcomingEvents: orgEvents.filter(
      (event) =>
        parseISO(event.startAt) > now &&
        (event.status === "published" || event.status === "registration_open" || event.status === "full"),
    ).length,
    activePrograms: db.programs.filter((program) => program.organizationId === organizationId && program.status === "active").length,
    monthlyExpensesCents: db.expenses
      .filter((expense) => expense.organizationId === organizationId && inMonth(expense.date))
      .reduce((sum, expense) => sum + expense.amountCents, 0),
  };
}

export function memberProgramIds(db: DemoDatabase, memberId: string) {
  const eventIds = new Set(
    db.registrations
      .filter((registration) => registration.memberId === memberId && registration.status !== "cancelled")
      .map((registration) => registration.eventId),
  );
  const programIds = new Set(
    db.events.filter((event) => eventIds.has(event.id)).map((event) => event.programId),
  );
  return [...programIds];
}
