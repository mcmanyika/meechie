import { DEFAULT_PLANS } from "@/config/plans";
import {
  CEDAR_ORG_ID,
  DEMO_ADMIN_USER_ID,
  GIVEAWAY_EVENT_ID,
  MEECHIE_ORG_ID,
  NORTHSIDE_ORG_ID,
  PLATFORM_ADMIN_USER_ID,
} from "@/config/constants";
import type {
  Announcement,
  AssistanceRequest,
  CommunityMember,
  DemoDatabase,
  DonateButton,
  Donation,
  Donor,
  EventRegistration,
  Expense,
  Household,
  InventoryItem,
  InventoryMovement,
  MessageTemplate,
  Organization,
  OrgEvent,
  Program,
  RecipientGroup,
  ServiceLog,
  Sponsor,
  Subscription,
  User,
  Volunteer,
  VolunteerAssignment,
} from "@/types/models";

const FIRST = ["Amina", "Andre", "Bianca", "Camila", "Darius", "Elena", "Felix", "Grace", "Hugo", "Imani", "Jamal", "Keisha", "Luis", "Maya", "Noah", "Olivia", "Priya", "Quinn", "Rosa", "Sam", "Tasha", "Victor", "Wendy", "Xavier", "Yara", "Zoe", "Chris", "Dana", "Miles", "Nina", "Omar", "Paige", "Renee", "Silas", "Tara", "Uma", "Vince", "Willa", "Yusuf", "Zola"];
const LAST = ["Adams", "Brooks", "Carter", "Diaz", "Edwards", "Foster", "Garcia", "Hayes", "Ibrahim", "Johnson", "Khan", "Lopez", "Mitchell", "Nguyen", "Owens", "Patel", "Reed", "Santos", "Thompson", "Vasquez", "Walker", "Young", "Bennett", "Coleman"];
const CHANNELS = ["email", "sms", "whatsapp", "phone"] as const;
const SKILLS = ["Greeting guests", "Spanish interpretation", "Food packing", "Youth mentoring", "Setup and teardown", "Data entry", "Photography", "First aid interest"];
const WINDOWS = ["Weekday mornings", "Weekday evenings", "Saturday mornings", "Sunday afternoons"];

interface TenantConfig {
  org: Organization;
  admin: User;
  extraUsers: User[];
  planId: Subscription["planId"];
  price: number | null;
  seats: number | null;
  households: number;
  members: number;
  volunteers: number;
  donors: number;
  sponsors: number;
  inventory: number;
  donations: number;
  programs: { id: string; name: string; status: Program["status"]; summary: string }[];
  events: {
    id: string;
    name: string;
    programId: string;
    status: OrgEvent["status"];
    day: number;
    capacity: number;
    regs: number;
    attended: number;
    category: OrgEvent["category"];
    location: string;
  }[];
}

function iso(now: Date, dayOffset: number, hour = 10) {
  const date = new Date(now);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function monthIso(now: Date, monthsAgo: number, day: number) {
  const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, Math.min(day, 27), 11, 0, 0);
  return date.toISOString();
}

function sizes(households: number, members: number) {
  const values = Array.from({ length: households }, () => 1);
  let remaining = members - households;
  let index = 0;
  while (remaining > 0) {
    if (values[index % households] < 5) {
      values[index % households] += 1;
      remaining -= 1;
    }
    index += 1;
  }
  return values;
}

function person(index: number) {
  const firstName = FIRST[index % FIRST.length];
  const lastName = LAST[Math.floor(index / FIRST.length) % LAST.length];
  return { firstName, lastName };
}

function buildTenant(config: TenantConfig, now: Date) {
  const orgId = config.org.id;
  const createdAt = iso(now, -400, 9);
  const households: Household[] = [];
  const members: CommunityMember[] = [];
  const counts = sizes(config.households, config.members);
  let memberIndex = 0;
  const places = [
    ["Dallas", "Oak Cliff", "75208"],
    ["Dallas", "Pleasant Grove", "75217"],
    ["Dallas", "South Dallas", "75215"],
    ["Dallas", "Fair Park", "75223"],
    ["Lancaster", "Lancaster", "75146"],
    ["DeSoto", "DeSoto", "75115"],
    ["Duncanville", "Duncanville", "75116"],
    ["Cedar Hill", "Cedar Hill", "75104"],
  ];
  if (orgId === NORTHSIDE_ORG_ID) places.unshift(["Fort Worth", "Northside", "76106"]);
  if (orgId === CEDAR_ORG_ID) places.unshift(["Austin", "East Austin", "78702"]);

  counts.forEach((count, householdIndex) => {
    const place = places[householdIndex % places.length];
    const anchor = person(memberIndex + householdIndex * 3);
    const householdId = `hh_${config.org.slug}_${String(householdIndex + 1).padStart(3, "0")}`;
    households.push({
      id: householdId,
      organizationId: orgId,
      name: `${anchor.lastName} Household ${householdIndex + 1}`,
      city: place[0],
      neighborhood: place[1],
      postalCode: place[2],
      createdAt,
      updatedAt: createdAt,
    });
    const ids: string[] = [];
    for (let slot = 0; slot < count; slot += 1) {
      const id = `mem_${config.org.slug}_${String(memberIndex + 1).padStart(3, "0")}`;
      ids.push(id);
      memberIndex += 1;
    }
    ids.forEach((id, slot) => {
      const identity = person(memberIndex + slot * 7);
      const isMinor = count >= 3 && slot === count - 1;
      const channel = CHANNELS[(memberIndex + slot) % CHANNELS.length];
      const registeredAt = monthIso(now, (memberIndex + slot) % 10, 4 + (slot % 20));
      members.push({
        id,
        organizationId: orgId,
        householdId,
        firstName: identity.firstName,
        lastName: anchor.lastName,
        email: isMinor ? null : `${identity.firstName}.${anchor.lastName}.${memberIndex}${slot}@example.com`.toLowerCase(),
        phone: isMinor ? null : `(214) 555-01${String((memberIndex + slot) % 100).padStart(2, "0")}`,
        city: place[0],
        isMinor,
        guardianMemberId: isMinor ? ids[0] : null,
        preferredChannel: isMinor ? "phone" : channel,
        consentEmail: !isMinor && channel !== "phone",
        consentSms: !isMinor && (channel === "sms" || slot % 2 === 0),
        consentWhatsapp: !isMinor && channel === "whatsapp",
        status: memberIndex % 19 === 0 ? "inactive" : memberIndex % 29 === 0 ? "waitlist" : "active",
        registeredAt,
        createdAt: registeredAt,
        updatedAt: registeredAt,
      });
    });
  });

  const programs: Program[] = config.programs.map((program, index) => ({
    id: program.id,
    organizationId: orgId,
    name: program.name,
    description: program.summary,
    objectives: [
      "Reach households in the organization's service area.",
      "Coordinate volunteers and supplies for scheduled activities.",
      "Record participation so impact reporting stays tied to activity.",
    ],
    status: program.status,
    coordinatorUserId: config.admin.id,
    budgetCents: 1800000 + index * 250000,
    startDate: iso(now, -180, 8).slice(0, 10),
    endDate: iso(now, 160, 8).slice(0, 10),
    outcomes: [
      {
        id: `${program.id}_outcome`,
        label: "Participant feedback",
        narrative: "Staff may enter qualitative notes here. This text is a sample claim and is not a verified metric.",
      },
    ],
    createdAt,
    updatedAt: createdAt,
  }));

  const events: OrgEvent[] = config.events.map((event) => {
    const startAt = iso(now, event.day, 10);
    const end = new Date(startAt);
    end.setHours(end.getHours() + 3);
    const deadline = new Date(startAt);
    deadline.setDate(deadline.getDate() - 1);
    return {
      id: event.id,
      organizationId: orgId,
      programId: event.programId,
      name: event.name,
      description: `${event.name} is a fictional demonstration activity for ${config.org.name}.`,
      category: event.category,
      startAt,
      endAt: end.toISOString(),
      location: event.location,
      city: config.org.city,
      capacity: event.capacity,
      registrationDeadline: deadline.toISOString(),
      coordinatorUserId: config.extraUsers[0]?.id ?? config.admin.id,
      volunteersNeeded: 8,
      budgetCents: 75000 + event.capacity * 100,
      status: event.status,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const registrations: EventRegistration[] = [];
  const attendance: DemoDatabase["attendance"] = [];
  let cursor = 0;
  config.events.forEach((event) => {
    const used = new Set<string>();
    for (let index = 0; index < event.regs; index += 1) {
      let member = members[cursor % members.length];
      while (used.has(member.id)) {
        cursor += 1;
        member = members[cursor % members.length];
      }
      used.add(member.id);
      cursor += 1;
      const eventRecord = events.find((item) => item.id === event.id)!;
      const registeredAt = iso(now, event.day - 12, 9);
      const registration: EventRegistration = {
        id: `reg_${event.id}_${index + 1}`,
        organizationId: orgId,
        eventId: event.id,
        memberId: member.id,
        status: index < event.attended ? "checked_in" : "registered",
        registeredAt,
        source: "admin",
        createdAt: registeredAt,
        updatedAt: registeredAt,
      };
      registrations.push(registration);
      if (index < event.attended) {
        attendance.push({
          id: `att_${event.id}_${index + 1}`,
          organizationId: orgId,
          eventId: event.id,
          memberId: member.id,
          registrationId: registration.id,
          checkedInAt: eventRecord.startAt,
          createdAt: eventRecord.startAt,
          updatedAt: eventRecord.startAt,
        });
      }
    }
  });

  const volunteers: Volunteer[] = Array.from({ length: config.volunteers }, (_, index) => {
    const identity = index === 0 && orgId === MEECHIE_ORG_ID ? { firstName: "Sam", lastName: "Rivera" } : person(index + 80);
    const joinedAt = monthIso(now, index % 8, 6);
    const safeguarding = (["not_started", "in_progress", "verified", "not_required"] as const)[index % 4];
    return {
      id: `vol_${config.org.slug}_${String(index + 1).padStart(3, "0")}`,
      organizationId: orgId,
      firstName: identity.firstName,
      lastName: identity.lastName,
      email: `${identity.firstName}.${identity.lastName}.vol${index}@example.com`.toLowerCase(),
      phone: `(214) 555-01${String(20 + (index % 70)).padStart(2, "0")}`,
      skills: [SKILLS[index % SKILLS.length], SKILLS[(index + 3) % SKILLS.length]],
      interests: [config.programs[index % config.programs.length].name],
      availability: [WINDOWS[index % WINDOWS.length]],
      status: index % 11 === 0 ? "applicant" : index % 13 === 0 ? "inactive" : "active",
      safeguardingStatus: safeguarding,
      safeguardingNote: "Recorded by staff in this demo. A verified status here is not evidence that a background check occurred.",
      joinedAt,
      createdAt: joinedAt,
      updatedAt: joinedAt,
    };
  });

  const assignments: VolunteerAssignment[] = [];
  const serviceLogs: ServiceLog[] = [];
  const assignableEvents = events.filter((event) => event.status !== "draft" && event.status !== "cancelled");
  volunteers.slice(0, Math.min(volunteers.length, 18)).forEach((volunteer, index) => {
    const event = assignableEvents[index % assignableEvents.length];
    const assignedAt = iso(now, -30, 8);
    assignments.push({
      id: `asg_${volunteer.id}`,
      organizationId: orgId,
      volunteerId: volunteer.id,
      eventId: event.id,
      role: index % 3 === 0 ? "Team lead" : "Event support",
      status: "assigned",
      createdAt: assignedAt,
      updatedAt: assignedAt,
    });
    if (event.status === "completed") {
      serviceLogs.push({
        id: `svc_${volunteer.id}`,
        organizationId: orgId,
        volunteerId: volunteer.id,
        eventId: event.id,
        hours: 3 + (index % 3),
        date: event.startAt,
        notes: "Sample service entry generated for the demonstration.",
        createdAt: event.startAt,
        updatedAt: event.startAt,
      });
    }
  });

  const donors: Donor[] = Array.from({ length: config.donors }, (_, index) => {
    const identity = person(index + 120);
    return {
      id: `dnr_${config.org.slug}_${String(index + 1).padStart(3, "0")}`,
      organizationId: orgId,
      name: index % 4 === 0 ? `${identity.lastName} Family Fund` : `${identity.firstName} ${identity.lastName}`,
      email: `donor.${identity.firstName}.${index}@example.com`.toLowerCase(),
      phone: `(214) 555-01${String(30 + index).padStart(2, "0")}`,
      type: index % 4 === 0 ? "foundation" : index % 3 === 0 ? "corporate" : "individual",
      city: config.org.city,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const sponsorNames = ["Oak & Elm Credit Union", "Bluebonnet Logistics", "Trinity Market Co-op", "Magnolia Dental Group", "Redbird Print Studio", "Lakewood Family Foods", "Southside Builders", "Prairie Light Energy"];
  const tiers = ["community", "supporting", "impact", "strategic"] as const;
  const sponsors: Sponsor[] = Array.from({ length: config.sponsors }, (_, index) => ({
    id: `spo_${config.org.slug}_${String(index + 1).padStart(3, "0")}`,
    organizationId: orgId,
    companyName: sponsorNames[index % sponsorNames.length],
    contactName: index === 0 && orgId === MEECHIE_ORG_ID ? "Elena Brooks" : person(index + 140).firstName + " " + person(index + 150).lastName,
    email: `sponsor${index}@example.com`,
    phone: `(214) 555-01${String(40 + index).padStart(2, "0")}`,
    tier: tiers[index % tiers.length],
    contributionCents: [250000, 750000, 1500000, 3000000][index % 4],
    programIds: [programs[index % programs.length].id],
    startDate: iso(now, -200, 9).slice(0, 10),
    renewalDate: iso(now, index % 3 === 0 ? 20 : 120, 9).slice(0, 10),
    status: index === config.sponsors - 1 && config.sponsors > 2 ? "pending" : "active",
    createdAt,
    updatedAt: createdAt,
  }));

  const donationTypes = ["one_time", "recurring", "corporate", "in_kind"] as const;
  const donations: Donation[] = Array.from({ length: config.donations }, (_, index) => {
    const status = index % 17 === 0 ? "pending" : index % 23 === 0 ? "refunded" : "completed";
    const type = donationTypes[index % donationTypes.length];
    return {
      id: `don_${config.org.slug}_${String(index + 1).padStart(3, "0")}`,
      organizationId: orgId,
      donorId: donors[index % donors.length].id,
      amountCents: type === "in_kind" ? 4500 + index * 125 : 2500 + (index % 9) * 5000,
      date: monthIso(now, index % 8, 3 + (index % 20)),
      type,
      programId: programs[index % programs.length].id,
      method: type === "in_kind" ? "in_kind" : index % 2 === 0 ? "card" : "check",
      reference: `SIM-${config.org.slug.toUpperCase()}-${index + 1000}`,
      status,
      inKindDescription: type === "in_kind" ? "Estimated value of donated supplies. No goods were transferred." : null,
      sponsorId: type === "corporate" ? sponsors[index % sponsors.length]?.id ?? null : null,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const catalog = [
    ["Backpacks", "School supplies"],
    ["Notebooks", "School supplies"],
    ["Pencil packs", "School supplies"],
    ["Crayons", "School supplies"],
    ["Folders", "School supplies"],
    ["Calculators", "School supplies"],
    ["Food packages", "Food"],
    ["Rice bags", "Food"],
    ["Canned meals", "Food"],
    ["Produce boxes", "Food"],
    ["Jackets", "Clothing"],
    ["Kids clothing sets", "Clothing"],
    ["Shoes", "Clothing"],
    ["Infant clothing", "Clothing"],
    ["Toys", "Toys"],
    ["Children's books", "Toys"],
    ["Hygiene kits", "Hygiene"],
    ["Diaper packs", "Hygiene"],
    ["Toothpaste", "Hygiene"],
    ["Blankets", "Hygiene"],
  ];
  const inventoryItems: InventoryItem[] = catalog.slice(0, config.inventory).map(([name, category], index) => ({
    id: `itm_${config.org.slug}_${String(index + 1).padStart(3, "0")}`,
    organizationId: orgId,
    name,
    category,
    reorderThreshold: index > config.inventory - 4 ? 10 : 20,
    location: index % 2 === 0 ? "Main storeroom" : "Annex shelves",
    programId: programs[index % programs.length].id,
    createdAt,
    updatedAt: createdAt,
  }));
  const completedEvent = events.find((event) => event.status === "completed") ?? null;
  const inventoryMovements: InventoryMovement[] = inventoryItems.flatMap((item, index) => {
    const received: InventoryMovement = {
      id: `mov_${item.id}_in`,
      organizationId: orgId,
      itemId: item.id,
      type: "received",
      quantity: index > config.inventory - 4 ? 8 : 80 + index * 3,
      eventId: null,
      note: "Opening sample stock.",
      createdAt: iso(now, -90, 9),
      updatedAt: iso(now, -90, 9),
    };
    if (index > config.inventory - 4 || !completedEvent) return [received];
    const distributed: InventoryMovement = {
      id: `mov_${item.id}_out`,
      organizationId: orgId,
      itemId: item.id,
      type: "distributed",
      quantity: 12,
      eventId: completedEvent.id,
      note: "Sample distribution linked to a completed event.",
      createdAt: completedEvent.startAt,
      updatedAt: completedEvent.startAt,
    };
    return [received, distributed];
  });

  const expenses: Expense[] = programs.slice(0, 4).flatMap((program, programIndex) =>
    [0, 2, 5].map((monthsAgo, expenseIndex) => ({
      id: `exp_${program.id}_${expenseIndex}`,
      organizationId: orgId,
      amountCents: 12500 + programIndex * 4000 + expenseIndex * 2500,
      date: monthIso(now, monthsAgo, 8 + expenseIndex),
      category: expenseIndex === 0 ? "Supplies" : expenseIndex === 1 ? "Venue" : "Transport",
      description: `${program.name} sample expense`,
      programId: program.id,
      eventId: events.find((event) => event.programId === program.id)?.id ?? null,
      createdAt,
      updatedAt: createdAt,
    })),
  );

  const announcements: Announcement[] = [
    {
      id: `ann_${config.org.slug}_1`,
      organizationId: orgId,
      title: "Sample data only",
      body: "Figures in this workspace are generated for demonstration and are not operational records.",
      audience: "Staff",
      publishedAt: iso(now, -2, 9),
      createdAt: iso(now, -2, 9),
      updatedAt: iso(now, -2, 9),
    },
    {
      id: `ann_${config.org.slug}_2`,
      organizationId: orgId,
      title: "Registration window",
      body: "The Back-to-School Community Giveaway registration flow is available in the demo when this organization includes that event.",
      audience: "Program team",
      publishedAt: iso(now, -1, 9),
      createdAt: iso(now, -1, 9),
      updatedAt: iso(now, -1, 9),
    },
  ];

  const templates: MessageTemplate[] = [
    ["registration_confirmation", "Event registration confirmation", "email", "You are registered", "This confirms a demonstration registration. No email is sent."],
    ["event_reminder", "Event reminder", "sms", "Reminder", "Demo reminder for an upcoming activity. No SMS is sent."],
    ["volunteer_assignment", "Volunteer assignment", "email", "Assignment update", "Demo notice that a volunteer was assigned. No email is sent."],
    ["donation_thanks", "Donation thank-you", "email", "Thank you", "Demo thank-you for a simulated gift. No email is sent."],
    ["sponsor_ack", "Sponsor acknowledgment", "email", "Partnership note", "Demo acknowledgment for a sample sponsor. No email is sent."],
    ["community_announcement", "Community announcement", "whatsapp", "Update", "Demo community update. No WhatsApp message is sent."],
  ].map(([kind, name, channel, subject, body], index) => ({
    id: `tpl_${config.org.slug}_${index + 1}`,
    organizationId: orgId,
    name,
    channel: channel as MessageTemplate["channel"],
    subject,
    body,
    kind: kind as MessageTemplate["kind"],
    createdAt,
    updatedAt: createdAt,
  }));

  const groups: RecipientGroup[] = [
    ["all_members", "Active community members", "Members marked active.", "all_members"],
    ["volunteers", "Volunteers", "People on the volunteer roster.", "volunteers"],
    ["donors", "Donors", "Donor records for this organization.", "donors"],
    ["event_registrants", "Event registrants", "Members with a current registration.", "event_registrants"],
    ["sponsors", "Sponsors", "Active sponsor contacts.", "sponsors"],
  ].map(([, name, description, rule], index) => ({
    id: `grp_${config.org.slug}_${index + 1}`,
    organizationId: orgId,
    name,
    description,
    rule: rule as RecipientGroup["rule"],
    createdAt,
    updatedAt: createdAt,
  }));

  const assistance: AssistanceRequest[] = [0, 1, 2].map((index) => ({
    id: `asr_${config.org.slug}_${index + 1}`,
    organizationId: orgId,
    contactName: person(200 + index).firstName + " " + person(210 + index).lastName,
    contactMethod: index % 2 === 0 ? "email" : "phone",
    contactValue: index % 2 === 0 ? `assist${index}@example.com` : `(214) 555-018${index}`,
    neighborhood: places[index % places.length][1],
    requestType: ["Food assistance", "School supplies", "Program information"][index],
    message: "Sample request submitted for the demonstration. It does not describe a real household.",
    status: (["new", "in_review", "scheduled"] as const)[index],
    createdAt: iso(now, -index - 1, 14),
    updatedAt: iso(now, -index - 1, 14),
  }));

  return {
    households,
    members,
    programs,
    events,
    registrations,
    attendance,
    volunteers,
    assignments,
    serviceLogs,
    donors,
    donations,
    sponsors,
    inventoryItems,
    inventoryMovements,
    expenses,
    announcements,
    templates,
    groups,
    assistance,
  };
}

function meechiePrograms() {
  return [
    ["prog_meechie_bts", "Back-to-School Support", "active", "Seasonal supplies and family resource events."],
    ["prog_meechie_food", "Community Food Assistance", "active", "Grocery and meal support activities."],
    ["prog_meechie_youth", "Youth Empowerment", "active", "Mentoring and learning sessions for youth."],
    ["prog_meechie_holiday", "Holiday Giving", "planned", "Seasonal distribution planned for the demonstration calendar."],
    ["prog_meechie_outreach", "Family Outreach", "active", "Neighborhood outreach and family workshops."],
    ["prog_meechie_wellness", "Community Wellness Access", "completed", "A completed sample program retained for reporting."],
  ].map(([id, name, status, summary]) => ({ id, name, status: status as Program["status"], summary }));
}

function organization(partial: Organization): Organization {
  return partial;
}

export function createSeedDatabase(now = new Date()): DemoDatabase {
  const stamped = iso(now, -420, 9);
  const meechie = organization({
    id: MEECHIE_ORG_ID,
    name: "The Meechie Project",
    slug: "meechie",
    logoText: "MP",
    description: "Demonstration workspace for a Dallas community nonprofit. People, gifts, and outcomes in this workspace are fictional.",
    primaryColor: "#1D4ED8",
    secondaryColor: "#0F766E",
    email: "hello@example.org",
    phone: "(214) 555-0100",
    website: "https://example.org/the-meechie-project",
    addressLine: "1400 Community Way",
    city: "Dallas",
    state: "TX",
    postalCode: "75215",
    timezone: "America/Chicago",
    currency: "USD",
    status: "active",
    portalEnabled: true,
    portalWelcome: "Find an activity, offer your time, or ask about community resources. This public page uses fictional demonstration records.",
    createdAt: stamped,
    updatedAt: stamped,
  });
  const northside = organization({
    id: NORTHSIDE_ORG_ID,
    name: "Northside Family Alliance",
    slug: "northside",
    logoText: "NF",
    description: "A second fictional nonprofit used to demonstrate tenant isolation.",
    primaryColor: "#047857",
    secondaryColor: "#B45309",
    email: "northside@example.org",
    phone: "(817) 555-0144",
    website: "https://example.org/northside-family-alliance",
    addressLine: "88 Alliance Avenue",
    city: "Fort Worth",
    state: "TX",
    postalCode: "76106",
    timezone: "America/Chicago",
    currency: "USD",
    status: "active",
    portalEnabled: true,
    portalWelcome: "Northside Family Alliance public preview. All records are fictional.",
    createdAt: stamped,
    updatedAt: stamped,
  });
  const cedar = organization({
    id: CEDAR_ORG_ID,
    name: "Cedar & Co. Community Lab",
    slug: "cedar",
    logoText: "CC",
    description: "A fictional organization shown as suspended in the platform directory.",
    primaryColor: "#7C3AED",
    secondaryColor: "#0F172A",
    email: "cedar@example.org",
    phone: "(512) 555-0166",
    website: "https://example.org/cedar-community-lab",
    addressLine: "12 Lab Street",
    city: "Austin",
    state: "TX",
    postalCode: "78702",
    timezone: "America/Chicago",
    currency: "USD",
    status: "suspended",
    portalEnabled: false,
    portalWelcome: "This portal is turned off while the organization is suspended.",
    createdAt: stamped,
    updatedAt: stamped,
  });

  const users: User[] = [
    { id: PLATFORM_ADMIN_USER_ID, organizationId: null, name: "Avery Quinn", email: "avery.quinn@example.com", role: "platform_super_admin", title: "Platform super admin", avatarInitials: "AQ", createdAt: stamped, updatedAt: stamped },
    { id: DEMO_ADMIN_USER_ID, organizationId: MEECHIE_ORG_ID, name: "Jordan Hale", email: "jordan.hale@example.com", role: "organization_admin", title: "Executive director", avatarInitials: "JH", createdAt: stamped, updatedAt: stamped },
    { id: "user_maya", organizationId: MEECHIE_ORG_ID, name: "Maya Okonkwo", email: "maya.okonkwo@example.com", role: "program_manager", title: "Program manager", avatarInitials: "MO", createdAt: stamped, updatedAt: stamped },
    { id: "user_chris", organizationId: MEECHIE_ORG_ID, name: "Chris Delgado", email: "chris.delgado@example.com", role: "volunteer_coordinator", title: "Volunteer coordinator", avatarInitials: "CD", createdAt: stamped, updatedAt: stamped },
    { id: "user_priya", organizationId: MEECHIE_ORG_ID, name: "Priya Shah", email: "priya.shah@example.com", role: "finance_manager", title: "Finance manager", avatarInitials: "PS", createdAt: stamped, updatedAt: stamped },
    { id: "user_sam", organizationId: MEECHIE_ORG_ID, name: "Sam Rivera", email: "sam.rivera@example.com", role: "volunteer", title: "Volunteer", avatarInitials: "SR", volunteerId: "vol_meechie_001", createdAt: stamped, updatedAt: stamped },
    { id: "user_elena", organizationId: MEECHIE_ORG_ID, name: "Elena Brooks", email: "elena.brooks@example.com", role: "sponsor", title: "Sponsor contact", avatarInitials: "EB", sponsorId: "spo_meechie_001", createdAt: stamped, updatedAt: stamped },
    { id: "user_member", organizationId: MEECHIE_ORG_ID, name: "Rosa Santos", email: "rosa.santos@example.com", role: "community_member", title: "Community member", avatarInitials: "RS", createdAt: stamped, updatedAt: stamped },
    { id: "user_dana", organizationId: NORTHSIDE_ORG_ID, name: "Dana Brooks", email: "dana.brooks@example.com", role: "organization_admin", title: "Director", avatarInitials: "DB", createdAt: stamped, updatedAt: stamped },
    { id: "user_cedar", organizationId: CEDAR_ORG_ID, name: "Miles Bennett", email: "miles.bennett@example.com", role: "organization_admin", title: "Director", avatarInitials: "MB", createdAt: stamped, updatedAt: stamped },
  ];

  const programs = meechiePrograms();
  const p = Object.fromEntries(programs.map((program) => [program.id, program.id]));
  const meechieTenant = buildTenant(
    {
      org: meechie,
      admin: users[1],
      extraUsers: users.slice(2, 5),
      planId: "enterprise",
      price: null,
      seats: null,
      households: 65,
      members: 150,
      volunteers: 35,
      donors: 12,
      sponsors: 8,
      inventory: 20,
      donations: 0,
      programs,
      events: [
        { id: GIVEAWAY_EVENT_ID, name: "Back-to-School Community Giveaway", programId: p.prog_meechie_bts, status: "registration_open", day: 18, capacity: 120, regs: 8, attended: 0, category: "distribution", location: "Community Hall, 1400 Community Way" },
        { id: "evt_meechie_pantry", name: "Saturday Family Food Pantry", programId: p.prog_meechie_food, status: "registration_open", day: 8, capacity: 80, regs: 6, attended: 0, category: "distribution", location: "Fellowship Room" },
        { id: "evt_meechie_stem", name: "Teen STEM Saturday", programId: p.prog_meechie_youth, status: "full", day: 12, capacity: 6, regs: 6, attended: 0, category: "workshop", location: "Learning Lab" },
        { id: "evt_meechie_mentor", name: "Youth Mentoring Circle", programId: p.prog_meechie_youth, status: "published", day: 26, capacity: 24, regs: 0, attended: 0, category: "workshop", location: "Learning Lab" },
        { id: "evt_meechie_plan", name: "Holiday Toy Planning Night", programId: p.prog_meechie_holiday, status: "draft", day: 40, capacity: 20, regs: 0, attended: 0, category: "outreach", location: "Conference Room" },
        { id: "evt_meechie_sponsor", name: "Sponsor Appreciation Breakfast", programId: p.prog_meechie_outreach, status: "cancelled", day: -24, capacity: 40, regs: 0, attended: 0, category: "fundraiser", location: "Community Hall" },
        { id: "evt_meechie_health", name: "Community Health Resource Fair", programId: p.prog_meechie_wellness, status: "completed", day: -70, capacity: 100, regs: 12, attended: 12, category: "outreach", location: "Community Hall" },
        { id: "evt_meechie_preview", name: "Spring School Supply Preview", programId: p.prog_meechie_bts, status: "completed", day: -56, capacity: 80, regs: 11, attended: 11, category: "distribution", location: "Community Hall" },
        { id: "evt_meechie_orientation", name: "Volunteer Orientation", programId: p.prog_meechie_outreach, status: "completed", day: -48, capacity: 40, regs: 10, attended: 10, category: "volunteer", location: "Conference Room" },
        { id: "evt_meechie_walk", name: "Oak Cliff Outreach Walk", programId: p.prog_meechie_outreach, status: "completed", day: -36, capacity: 60, regs: 10, attended: 10, category: "outreach", location: "Oak Cliff Trailhead" },
        { id: "evt_meechie_meals", name: "Summer Meal Kickoff", programId: p.prog_meechie_food, status: "completed", day: -27, capacity: 90, regs: 9, attended: 9, category: "distribution", location: "Fellowship Room" },
        { id: "evt_meechie_finance", name: "Family Finance Workshop", programId: p.prog_meechie_outreach, status: "completed", day: -18, capacity: 30, regs: 8, attended: 8, category: "workshop", location: "Learning Lab" },
        { id: "evt_meechie_coats", name: "Coat Distribution Day", programId: p.prog_meechie_holiday, status: "completed", day: -14, capacity: 70, regs: 8, attended: 8, category: "distribution", location: "Community Hall" },
        { id: "evt_meechie_grocery", name: "Senior Grocery Delivery", programId: p.prog_meechie_food, status: "completed", day: -9, capacity: 25, regs: 7, attended: 7, category: "distribution", location: "Annex" },
        { id: "evt_meechie_cleanup", name: "Neighborhood Cleanup", programId: p.prog_meechie_outreach, status: "completed", day: -4, capacity: 40, regs: 5, attended: 5, category: "volunteer", location: "South Dallas block" },
      ],
    },
    now,
  );

  const northPrograms = [
    { id: "prog_north_food", name: "Pantry Partners", status: "active" as const, summary: "Food support for the Fort Worth sample tenant." },
    { id: "prog_north_youth", name: "After-School Studio", status: "active" as const, summary: "Youth activities for the Fort Worth sample tenant." },
    { id: "prog_north_family", name: "Family Navigation", status: "planned" as const, summary: "A planned sample program." },
  ];
  const northTenant = buildTenant(
    {
      org: northside,
      admin: users.find((user) => user.id === "user_dana")!,
      extraUsers: [],
      planId: "growth",
      price: 14900,
      seats: 15,
      households: 12,
      members: 28,
      volunteers: 8,
      donors: 4,
      sponsors: 2,
      inventory: 6,
      donations: 0,
      programs: northPrograms,
      events: [
        { id: "evt_north_pantry", name: "Weeknight Pantry", programId: "prog_north_food", status: "registration_open", day: 10, capacity: 40, regs: 8, attended: 0, category: "distribution", location: "Alliance Hall" },
        { id: "evt_north_studio", name: "Studio Open House", programId: "prog_north_youth", status: "published", day: 21, capacity: 30, regs: 0, attended: 0, category: "workshop", location: "Studio Room" },
        { id: "evt_north_fair", name: "Spring Resource Fair", programId: "prog_north_family", status: "completed", day: -30, capacity: 50, regs: 12, attended: 12, category: "outreach", location: "Alliance Hall" },
        { id: "evt_north_draft", name: "Budget Draft Session", programId: "prog_north_family", status: "draft", day: 33, capacity: 12, regs: 0, attended: 0, category: "workshop", location: "Office" },
      ],
    },
    now,
  );

  const cedarTenant = buildTenant(
    {
      org: cedar,
      admin: users.find((user) => user.id === "user_cedar")!,
      extraUsers: [],
      planId: "starter",
      price: 4900,
      seats: 3,
      households: 4,
      members: 10,
      volunteers: 3,
      donors: 2,
      sponsors: 1,
      inventory: 3,
      donations: 0,
      programs: [{ id: "prog_cedar_main", name: "Neighborhood Hours", status: "active", summary: "The only sample program on a suspended tenant." }],
      events: [
        { id: "evt_cedar_past", name: "Open Hours", programId: "prog_cedar_main", status: "completed", day: -15, capacity: 20, regs: 6, attended: 4, category: "outreach", location: "Lab Street" },
        { id: "evt_cedar_next", name: "Planning Circle", programId: "prog_cedar_main", status: "draft", day: 14, capacity: 12, regs: 0, attended: 0, category: "workshop", location: "Lab Street" },
      ],
    },
    now,
  );

  const subscriptions: Subscription[] = [
    { id: "sub_meechie", organizationId: MEECHIE_ORG_ID, planId: "enterprise", status: "active", seatLimit: null, monthlyPriceCents: null, startedAt: iso(now, -200, 9).slice(0, 10), renewsAt: iso(now, 165, 9).slice(0, 10), createdAt: stamped, updatedAt: stamped },
    { id: "sub_northside", organizationId: NORTHSIDE_ORG_ID, planId: "growth", status: "active", seatLimit: 15, monthlyPriceCents: 14900, startedAt: iso(now, -120, 9).slice(0, 10), renewsAt: iso(now, 20, 9).slice(0, 10), createdAt: stamped, updatedAt: stamped },
    { id: "sub_cedar", organizationId: CEDAR_ORG_ID, planId: "starter", status: "past_due", seatLimit: 3, monthlyPriceCents: 4900, startedAt: iso(now, -90, 9).slice(0, 10), renewsAt: iso(now, -10, 9).slice(0, 10), createdAt: stamped, updatedAt: stamped },
  ];

  const parts = [meechieTenant, northTenant, cedarTenant];
  const database: DemoDatabase = {
    version: 1,
    seededAt: now.toISOString(),
    organizations: [meechie, northside, cedar],
    users,
    plans: DEFAULT_PLANS.map((plan) => ({ ...plan, features: [...plan.features], entitlements: [...plan.entitlements] })),
    subscriptions,
    households: parts.flatMap((part) => part.households),
    members: parts.flatMap((part) => part.members),
    programs: parts.flatMap((part) => part.programs),
    events: parts.flatMap((part) => part.events),
    registrations: parts.flatMap((part) => part.registrations),
    attendance: parts.flatMap((part) => part.attendance),
    volunteers: parts.flatMap((part) => part.volunteers),
    assignments: parts.flatMap((part) => part.assignments),
    serviceLogs: parts.flatMap((part) => part.serviceLogs),
    donors: parts.flatMap((part) => part.donors),
    donations: parts.flatMap((part) => part.donations),
    donateButtons: [
      {
        id: "btn_meechie_website",
        organizationId: MEECHIE_ORG_ID,
        label: "Donate",
        amounts: [25, 50, 100, 250],
        defaultAmount: 50,
        programId: null,
        type: "one_time",
        active: true,
        createdAt: stamped,
        updatedAt: stamped,
      } satisfies DonateButton,
    ],
    sponsors: parts.flatMap((part) => part.sponsors),
    inventoryItems: parts.flatMap((part) => part.inventoryItems),
    inventoryMovements: parts.flatMap((part) => part.inventoryMovements),
    expenses: parts.flatMap((part) => part.expenses),
    announcements: parts.flatMap((part) => part.announcements),
    templates: parts.flatMap((part) => part.templates),
    groups: parts.flatMap((part) => part.groups),
    campaigns: [
      {
        id: "cmp_meechie_seed",
        organizationId: MEECHIE_ORG_ID,
        name: "Event reminder",
        templateId: "tpl_meechie_2",
        groupId: "grp_meechie_4",
        channel: "sms",
        recipientCount: 18,
        skippedCount: 4,
        sentAt: iso(now, -3, 15),
        preview: "Simulated SMS. No message left this browser.",
        createdAt: iso(now, -3, 15),
        updatedAt: iso(now, -3, 15),
      },
    ],
    assistanceRequests: parts.flatMap((part) => part.assistance),
    volunteerInterests: [
      {
        id: "vin_meechie_1",
        organizationId: MEECHIE_ORG_ID,
        name: "Quinn Foster",
        email: "quinn.foster@example.com",
        phone: "(214) 555-0177",
        interests: "Food packing",
        availability: "Saturday mornings",
        status: "new",
        createdAt: iso(now, -2, 16),
        updatedAt: iso(now, -2, 16),
      },
    ],
    notes: [
      {
        id: "note_meechie_1",
        organizationId: MEECHIE_ORG_ID,
        memberId: meechieTenant.members[0].id,
        authorName: "Maya Okonkwo",
        body: "Sample staff note. Do not store sensitive health or government identifiers here.",
        createdAt: iso(now, -5, 11),
        updatedAt: iso(now, -5, 11),
      },
    ],
    reports: [],
    audit: [
      {
        id: "aud_seed",
        organizationId: MEECHIE_ORG_ID,
        actorName: "Jordan Hale",
        action: "demo.seeded",
        entityType: "organization",
        entityId: MEECHIE_ORG_ID,
        summary: "Demonstration workspace loaded with fictional records.",
        createdAt: now.toISOString(),
      },
    ],
  };

  assertSeed(database);
  return database;
}

export function assertSeed(db: DemoDatabase) {
  const meechie = (rows: { organizationId: string }[]) => rows.filter((row) => row.organizationId === MEECHIE_ORG_ID);
  const expectations: [string, number, number][] = [
    ["members", meechie(db.members).length, 150],
    ["households", meechie(db.households).length, 65],
    ["volunteers", meechie(db.volunteers).length, 35],
    ["donors", meechie(db.donors).length, 12],
    ["sponsors", meechie(db.sponsors).length, 8],
    ["programs", meechie(db.programs).length, 6],
    ["events", meechie(db.events).length, 15],
    ["donations", meechie(db.donations).length, 0],
    ["inventory", meechie(db.inventoryItems).length, 20],
    ["registrations", meechie(db.registrations).length, 100],
    ["attendance", meechie(db.attendance).length, 80],
  ];
  expectations.forEach(([label, actual, expected]) => {
    if (actual !== expected) throw new Error(`Seed count mismatch for ${label}: ${actual} !== ${expected}`);
  });

  const memberIds = new Set(db.members.map((member) => member.id));
  const eventIds = new Set(db.events.map((event) => event.id));
  const donorIds = new Set(db.donors.map((donor) => donor.id));
  const volunteerIds = new Set(db.volunteers.map((volunteer) => volunteer.id));
  db.registrations.forEach((registration) => {
    if (!eventIds.has(registration.eventId) || !memberIds.has(registration.memberId)) {
      throw new Error(`Broken registration ${registration.id}`);
    }
  });
  db.attendance.forEach((record) => {
    const registration = db.registrations.find((item) => item.id === record.registrationId);
    if (!registration || registration.memberId !== record.memberId || registration.eventId !== record.eventId) {
      throw new Error(`Broken attendance ${record.id}`);
    }
  });
  db.donations.forEach((donation) => {
    if (!donorIds.has(donation.donorId)) throw new Error(`Broken donation ${donation.id}`);
  });
  db.assignments.forEach((assignment) => {
    if (!volunteerIds.has(assignment.volunteerId) || !eventIds.has(assignment.eventId)) {
      throw new Error(`Broken assignment ${assignment.id}`);
    }
  });
  const activeKey = new Set<string>();
  db.registrations.forEach((registration) => {
    if (registration.status === "cancelled") return;
    const key = `${registration.eventId}:${registration.memberId}`;
    if (activeKey.has(key)) throw new Error(`Duplicate registration ${key}`);
    activeKey.add(key);
  });
}
