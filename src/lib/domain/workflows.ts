import { activeRegistrationCount, stockOnHand } from "@/lib/domain/metrics";
import { createId } from "@/lib/ids";
import type {
  Attendance,
  Campaign,
  CommunityMember,
  DemoDatabase,
  Donation,
  EventRegistration,
  Expense,
  InventoryMovement,
  OrgEvent,
  ServiceLog,
  VolunteerAssignment,
} from "@/types/models";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function nowIso() {
  return new Date().toISOString();
}

function touch<T extends { updatedAt: string }>(record: T, now: string): T {
  return { ...record, updatedAt: now };
}

export function assertOrgWritable(db: DemoDatabase, organizationId: string): Result<true> {
  const org = db.organizations.find((item) => item.id === organizationId);
  if (!org) return { ok: false, error: "Organization not found." };
  if (org.status === "suspended") {
    return { ok: false, error: "This organization is suspended. Records are read-only in the demo." };
  }
  return { ok: true, data: true };
}

export function registerForEvent(
  db: DemoDatabase,
  input: {
    organizationId: string;
    eventId: string;
    memberId: string;
    source: EventRegistration["source"];
    actorName: string;
  },
): Result<{ db: DemoDatabase; registration: EventRegistration }> {
  const writable = assertOrgWritable(db, input.organizationId);
  if (!writable.ok) return writable;

  const event = db.events.find((item) => item.id === input.eventId && item.organizationId === input.organizationId);
  if (!event) return { ok: false, error: "Event not found." };
  if (event.status === "cancelled" || event.status === "completed" || event.status === "draft") {
    return { ok: false, error: "Registration is not open for this event." };
  }
  if (event.status !== "registration_open" && event.status !== "full") {
    return { ok: false, error: "Publish registration before adding attendees." };
  }
  const member = db.members.find((item) => item.id === input.memberId && item.organizationId === input.organizationId);
  if (!member) return { ok: false, error: "Community member not found." };

  const duplicate = db.registrations.some(
    (registration) =>
      registration.eventId === event.id &&
      registration.memberId === member.id &&
      registration.status !== "cancelled",
  );
  if (duplicate) return { ok: false, error: "This person is already registered for the event." };

  const taken = activeRegistrationCount(db, event.id);
  if (taken >= event.capacity) return { ok: false, error: "This event is at capacity." };

  const now = nowIso();
  const registration: EventRegistration = {
    id: createId("reg"),
    organizationId: input.organizationId,
    eventId: event.id,
    memberId: member.id,
    status: "registered",
    registeredAt: now,
    source: input.source,
    createdAt: now,
    updatedAt: now,
  };

  const nextCount = taken + 1;
  const events = db.events.map((item) =>
    item.id === event.id ? touch({ ...item, status: nextCount >= item.capacity ? "full" : item.status }, now) : item,
  );

  return {
    ok: true,
    data: {
      registration,
      db: appendAudit(
        { ...db, registrations: [registration, ...db.registrations], events },
        input.organizationId,
        input.actorName,
        "registration.created",
        "registration",
        registration.id,
        `${member.firstName} ${member.lastName} registered for ${event.name}.`,
        now,
      ),
    },
  };
}

export function checkInAttendee(
  db: DemoDatabase,
  input: { organizationId: string; registrationId: string; actorName: string },
): Result<{ db: DemoDatabase; attendance: Attendance }> {
  const writable = assertOrgWritable(db, input.organizationId);
  if (!writable.ok) return writable;
  const registration = db.registrations.find(
    (item) => item.id === input.registrationId && item.organizationId === input.organizationId,
  );
  if (!registration) return { ok: false, error: "Registration not found." };
  if (registration.status === "cancelled") return { ok: false, error: "Cancelled registrations cannot be checked in." };

  const existing = db.attendance.find((item) => item.registrationId === registration.id);
  if (existing) return { ok: false, error: "This attendee is already checked in." };

  const now = nowIso();
  const attendance: Attendance = {
    id: createId("att"),
    organizationId: input.organizationId,
    eventId: registration.eventId,
    memberId: registration.memberId,
    registrationId: registration.id,
    checkedInAt: now,
    createdAt: now,
    updatedAt: now,
  };
  const registrations = db.registrations.map((item) =>
    item.id === registration.id ? touch({ ...item, status: "checked_in" as const }, now) : item,
  );
  const member = db.members.find((item) => item.id === registration.memberId);
  return {
    ok: true,
    data: {
      attendance,
      db: appendAudit(
        { ...db, attendance: [attendance, ...db.attendance], registrations },
        input.organizationId,
        input.actorName,
        "attendance.checked_in",
        "attendance",
        attendance.id,
        `${member ? `${member.firstName} ${member.lastName}` : "Attendee"} checked in.`,
        now,
      ),
    },
  };
}

export function assignVolunteer(
  db: DemoDatabase,
  input: { organizationId: string; volunteerId: string; eventId: string; role: string; actorName: string },
): Result<{ db: DemoDatabase; assignment: VolunteerAssignment }> {
  const writable = assertOrgWritable(db, input.organizationId);
  if (!writable.ok) return writable;
  const volunteer = db.volunteers.find((item) => item.id === input.volunteerId && item.organizationId === input.organizationId);
  const event = db.events.find((item) => item.id === input.eventId && item.organizationId === input.organizationId);
  if (!volunteer || !event) return { ok: false, error: "Volunteer or event not found." };
  const existing = db.assignments.find(
    (item) => item.volunteerId === volunteer.id && item.eventId === event.id && item.status === "assigned",
  );
  if (existing) return { ok: false, error: "This volunteer is already assigned to the event." };

  const now = nowIso();
  const assignment: VolunteerAssignment = {
    id: createId("asg"),
    organizationId: input.organizationId,
    volunteerId: volunteer.id,
    eventId: event.id,
    role: input.role,
    status: "assigned",
    createdAt: now,
    updatedAt: now,
  };
  return {
    ok: true,
    data: {
      assignment,
      db: appendAudit(
        { ...db, assignments: [assignment, ...db.assignments] },
        input.organizationId,
        input.actorName,
        "volunteer.assigned",
        "assignment",
        assignment.id,
        `${volunteer.firstName} ${volunteer.lastName} assigned to ${event.name}.`,
        now,
      ),
    },
  };
}

export function removeAssignment(
  db: DemoDatabase,
  input: { organizationId: string; assignmentId: string; actorName: string },
): Result<{ db: DemoDatabase }> {
  const writable = assertOrgWritable(db, input.organizationId);
  if (!writable.ok) return writable;
  const assignment = db.assignments.find((item) => item.id === input.assignmentId && item.organizationId === input.organizationId);
  if (!assignment || assignment.status === "removed") return { ok: false, error: "Assignment not found." };
  const now = nowIso();
  return {
    ok: true,
    data: {
      db: appendAudit(
        {
          ...db,
          assignments: db.assignments.map((item) =>
            item.id === assignment.id ? touch({ ...item, status: "removed" as const }, now) : item,
          ),
        },
        input.organizationId,
        input.actorName,
        "volunteer.unassigned",
        "assignment",
        assignment.id,
        "Volunteer assignment removed.",
        now,
      ),
    },
  };
}

export function recordService(
  db: DemoDatabase,
  input: Omit<ServiceLog, "id" | "createdAt" | "updatedAt"> & { actorName: string },
): Result<{ db: DemoDatabase; log: ServiceLog }> {
  const writable = assertOrgWritable(db, input.organizationId);
  if (!writable.ok) return writable;
  if (input.hours <= 0 || input.hours > 24) return { ok: false, error: "Enter hours between 0 and 24." };
  const volunteer = db.volunteers.find((item) => item.id === input.volunteerId && item.organizationId === input.organizationId);
  if (!volunteer) return { ok: false, error: "Volunteer not found." };
  const now = nowIso();
  const log: ServiceLog = {
    id: createId("svc"),
    organizationId: input.organizationId,
    volunteerId: input.volunteerId,
    eventId: input.eventId,
    hours: input.hours,
    date: input.date,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ok: true,
    data: {
      log,
      db: appendAudit(
        { ...db, serviceLogs: [log, ...db.serviceLogs] },
        input.organizationId,
        input.actorName,
        "service.recorded",
        "service",
        log.id,
        `${input.hours} hours recorded for ${volunteer.firstName} ${volunteer.lastName}.`,
        now,
      ),
    },
  };
}

export function recordDonation(
  db: DemoDatabase,
  input: Omit<Donation, "id" | "createdAt" | "updatedAt"> & { actorName: string },
): Result<{ db: DemoDatabase; donation: Donation }> {
  const writable = assertOrgWritable(db, input.organizationId);
  if (!writable.ok) return writable;
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    return { ok: false, error: "Enter a donation amount greater than zero." };
  }
  const donor = db.donors.find((item) => item.id === input.donorId && item.organizationId === input.organizationId);
  if (!donor) return { ok: false, error: "Donor not found." };
  const now = nowIso();
  const donation: Donation = {
    id: createId("don"),
    organizationId: input.organizationId,
    donorId: input.donorId,
    amountCents: input.amountCents,
    date: input.date,
    type: input.type,
    programId: input.programId,
    method: input.method,
    reference: input.reference,
    status: input.status,
    inKindDescription: input.inKindDescription,
    sponsorId: input.sponsorId,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ok: true,
    data: {
      donation,
      db: appendAudit(
        { ...db, donations: [donation, ...db.donations] },
        input.organizationId,
        input.actorName,
        "donation.recorded",
        "donation",
        donation.id,
        `Donation recorded for ${donor.name}.`,
        now,
      ),
    },
  };
}

export function recordMovement(
  db: DemoDatabase,
  input: Omit<InventoryMovement, "id" | "createdAt" | "updatedAt"> & { actorName: string },
): Result<{ db: DemoDatabase; movement: InventoryMovement }> {
  const writable = assertOrgWritable(db, input.organizationId);
  if (!writable.ok) return writable;
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    return { ok: false, error: "Quantity must be a positive whole number." };
  }
  const item = db.inventoryItems.find((record) => record.id === input.itemId && record.organizationId === input.organizationId);
  if (!item) return { ok: false, error: "Inventory item not found." };
  const onHand = stockOnHand(db, item.id);
  const outgoing = input.type === "distributed" || input.type === "adjustment_out";
  if (outgoing && input.quantity > onHand) {
    return { ok: false, error: `Only ${onHand} available. Stock cannot go below zero.` };
  }
  const now = nowIso();
  const movement: InventoryMovement = {
    id: createId("mov"),
    organizationId: input.organizationId,
    itemId: input.itemId,
    type: input.type,
    quantity: input.quantity,
    eventId: input.eventId,
    note: input.note,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ok: true,
    data: {
      movement,
      db: appendAudit(
        { ...db, inventoryMovements: [movement, ...db.inventoryMovements] },
        input.organizationId,
        input.actorName,
        "inventory.moved",
        "movement",
        movement.id,
        `${input.type.replaceAll("_", " ")} ${input.quantity} ${item.name}.`,
        now,
      ),
    },
  };
}

export function recordExpense(
  db: DemoDatabase,
  input: Omit<Expense, "id" | "createdAt" | "updatedAt"> & { actorName: string },
): Result<{ db: DemoDatabase; expense: Expense }> {
  const writable = assertOrgWritable(db, input.organizationId);
  if (!writable.ok) return writable;
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    return { ok: false, error: "Enter an expense amount greater than zero." };
  }
  const now = nowIso();
  const expense: Expense = { ...input, id: createId("exp"), createdAt: now, updatedAt: now };
  return {
    ok: true,
    data: {
      expense,
      db: appendAudit(
        { ...db, expenses: [expense, ...db.expenses] },
        input.organizationId,
        input.actorName,
        "expense.recorded",
        "expense",
        expense.id,
        input.description,
        now,
      ),
    },
  };
}

export function simulateCampaign(
  db: DemoDatabase,
  input: { organizationId: string; templateId: string; groupId: string; actorName: string },
): Result<{ db: DemoDatabase; campaign: Campaign }> {
  const writable = assertOrgWritable(db, input.organizationId);
  if (!writable.ok) return writable;
  const template = db.templates.find((item) => item.id === input.templateId && item.organizationId === input.organizationId);
  const group = db.groups.find((item) => item.id === input.groupId && item.organizationId === input.organizationId);
  if (!template || !group) return { ok: false, error: "Template or recipient group not found." };

  const members = db.members.filter((member) => member.organizationId === input.organizationId && member.status === "active");
  let recipients = members;
  if (group.rule === "volunteers") {
    const emails = new Set(db.volunteers.filter((volunteer) => volunteer.organizationId === input.organizationId).map((volunteer) => volunteer.email));
    recipients = members.filter((member) => member.email && emails.has(member.email));
  } else if (group.rule === "event_registrants") {
    const ids = new Set(db.registrations.filter((registration) => registration.organizationId === input.organizationId && registration.status !== "cancelled").map((registration) => registration.memberId));
    recipients = members.filter((member) => ids.has(member.id));
  } else if (group.rule === "donors" || group.rule === "sponsors") {
    recipients = [];
  }

  const channel = template.channel;
  const consented = recipients.filter((member) => {
    if (member.isMinor) return false;
    if (channel === "email") return member.consentEmail && Boolean(member.email);
    if (channel === "sms") return member.consentSms && Boolean(member.phone);
    return member.consentWhatsapp && Boolean(member.phone);
  });
  const externalCount =
    group.rule === "donors"
      ? db.donors.filter((donor) => donor.organizationId === input.organizationId).length
      : group.rule === "sponsors"
        ? db.sponsors.filter((sponsor) => sponsor.organizationId === input.organizationId && sponsor.status === "active").length
        : 0;
  const skipped = recipients.length - consented.length;
  const now = nowIso();
  const campaign: Campaign = {
    id: createId("cmp"),
    organizationId: input.organizationId,
    name: template.name,
    templateId: template.id,
    groupId: group.id,
    channel,
    recipientCount: consented.length + externalCount,
    skippedCount: skipped,
    sentAt: now,
    preview: `Simulated ${channel} send. No message left this browser.`,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ok: true,
    data: {
      campaign,
      db: appendAudit(
        { ...db, campaigns: [campaign, ...db.campaigns] },
        input.organizationId,
        input.actorName,
        "campaign.simulated",
        "campaign",
        campaign.id,
        `Simulated ${template.name} to ${campaign.recipientCount} recipients.`,
        now,
      ),
    },
  };
}

export function upsertMember(
  db: DemoDatabase,
  input: { member: CommunityMember; actorName: string; mode: "create" | "update" },
): Result<{ db: DemoDatabase; member: CommunityMember }> {
  const writable = assertOrgWritable(db, input.member.organizationId);
  if (!writable.ok) return writable;
  if (input.member.isMinor) {
    input.member.email = null;
    input.member.phone = null;
    if (!input.member.guardianMemberId) return { ok: false, error: "A child record needs a guardian in the household." };
  }
  const household = db.households.find((item) => item.id === input.member.householdId && item.organizationId === input.member.organizationId);
  if (!household) return { ok: false, error: "Household not found." };
  const now = nowIso();
  const member = touch(input.member, now);
  const members =
    input.mode === "create"
      ? [member, ...db.members]
      : db.members.map((item) => (item.id === member.id ? member : item));
  if (input.mode === "update" && !db.members.some((item) => item.id === member.id)) {
    return { ok: false, error: "Member not found." };
  }
  return {
    ok: true,
    data: {
      member,
      db: appendAudit(
        { ...db, members },
        member.organizationId,
        input.actorName,
        input.mode === "create" ? "member.created" : "member.updated",
        "member",
        member.id,
        `${member.firstName} ${member.lastName} ${input.mode === "create" ? "added" : "updated"}.`,
        now,
      ),
    },
  };
}

export function publishEvent(db: DemoDatabase, event: OrgEvent, actorName: string, openRegistration: boolean): Result<{ db: DemoDatabase }> {
  const writable = assertOrgWritable(db, event.organizationId);
  if (!writable.ok) return writable;
  const now = nowIso();
  const status = openRegistration ? (activeRegistrationCount(db, event.id) >= event.capacity ? "full" : "registration_open") : "published";
  return {
    ok: true,
    data: {
      db: appendAudit(
        {
          ...db,
          events: db.events.map((item) => (item.id === event.id ? touch({ ...item, status }, now) : item)),
        },
        event.organizationId,
        actorName,
        "event.published",
        "event",
        event.id,
        `${event.name} is now ${status.replaceAll("_", " ")}.`,
        now,
      ),
    },
  };
}

export function appendAudit(
  db: DemoDatabase,
  organizationId: string | null,
  actorName: string,
  action: string,
  entityType: string,
  entityId: string,
  summary: string,
  createdAt = nowIso(),
): DemoDatabase {
  return {
    ...db,
    audit: [
      {
        id: createId("aud"),
        organizationId,
        actorName,
        action,
        entityType,
        entityId,
        summary,
        createdAt,
      },
      ...db.audit,
    ].slice(0, 400),
  };
}

export type { CommunityMember };
