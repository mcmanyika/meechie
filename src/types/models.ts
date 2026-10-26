export type Role =
  | "platform_super_admin"
  | "organization_admin"
  | "program_manager"
  | "volunteer_coordinator"
  | "finance_manager"
  | "volunteer"
  | "community_member"
  | "sponsor";

export type OrgStatus = "active" | "suspended" | "trial";
export type AccountStatus = "pending" | "active";
export type PlanId = "starter" | "growth" | "enterprise";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export type MemberStatus = "active" | "inactive" | "waitlist";
export type Channel = "email" | "sms" | "whatsapp" | "phone";
export type ProgramStatus = "draft" | "planned" | "active" | "completed" | "archived";
export type EventStatus =
  | "draft"
  | "published"
  | "registration_open"
  | "full"
  | "completed"
  | "cancelled";
export type EventCategory =
  | "distribution"
  | "workshop"
  | "outreach"
  | "fundraiser"
  | "volunteer";
export type RegistrationStatus = "registered" | "cancelled" | "checked_in";
export type RegistrationSource = "admin" | "portal";
export type VolunteerStatus = "applicant" | "active" | "inactive";
export type SafeguardingStatus = "not_started" | "in_progress" | "verified" | "not_required";
export type AssignmentStatus = "assigned" | "removed";
export type DonorType = "individual" | "corporate" | "foundation";
export type DonationType = "one_time" | "recurring" | "corporate" | "in_kind";
export type DonationStatus = "pending" | "completed" | "refunded";
export type PaymentMethod = "card" | "ach" | "check" | "cash" | "in_kind";
export type SponsorTier = "community" | "supporting" | "impact" | "strategic";
export type SponsorStatus = "active" | "pending" | "expired";
export type MovementType = "received" | "distributed" | "adjustment_in" | "adjustment_out";
export type AssistanceStatus = "new" | "in_review" | "scheduled" | "closed";
export type InterestStatus = "new" | "contacted" | "converted";
export type CampaignChannel = "email" | "sms" | "whatsapp";
export type GroupRule = "all_members" | "volunteers" | "donors" | "event_registrants" | "sponsors";
export type TemplateKind =
  | "registration_confirmation"
  | "event_reminder"
  | "volunteer_assignment"
  | "donation_thanks"
  | "sponsor_ack"
  | "community_announcement";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type OutreachType = "canvass" | "neighborhood_visit" | "flyering" | "partnership" | "other";
export type OutreachStatus = "planned" | "completed" | "cancelled";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoText: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  email: string;
  phone: string;
  website: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  timezone: string;
  currency: string;
  status: OrgStatus;
  portalEnabled: boolean;
  portalWelcome: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  organizationId: string | null;
  name: string;
  email: string;
  role: Role;
  title: string;
  avatarInitials: string;
  accountStatus: AccountStatus;
  volunteerId?: string;
  sponsorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  monthlyPriceCents: number | null;
  seatLimit: number | null;
  features: string[];
  entitlements: Entitlement[];
}

export type Entitlement =
  | "community"
  | "programs"
  | "events"
  | "volunteers"
  | "donations"
  | "sponsors"
  | "inventory"
  | "communications"
  | "reports"
  | "advanced_reports"
  | "branding";

export interface Subscription {
  id: string;
  organizationId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  seatLimit: number | null;
  monthlyPriceCents: number | null;
  startedAt: string;
  renewsAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Household {
  id: string;
  organizationId: string;
  name: string;
  city: string;
  neighborhood: string;
  postalCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMember {
  id: string;
  organizationId: string;
  householdId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  city: string;
  isMinor: boolean;
  guardianMemberId: string | null;
  preferredChannel: Channel;
  consentEmail: boolean;
  consentSms: boolean;
  consentWhatsapp: boolean;
  status: MemberStatus;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramOutcome {
  id: string;
  label: string;
  narrative: string;
}

export interface Program {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  objectives: string[];
  status: ProgramStatus;
  coordinatorUserId: string;
  budgetCents: number;
  startDate: string;
  endDate: string;
  outcomes: ProgramOutcome[];
  createdAt: string;
  updatedAt: string;
}

export interface OrgEvent {
  id: string;
  organizationId: string;
  programId: string;
  name: string;
  description: string;
  category: EventCategory;
  startAt: string;
  endAt: string;
  location: string;
  city: string;
  capacity: number;
  registrationDeadline: string;
  coordinatorUserId: string;
  volunteersNeeded: number;
  budgetCents: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EventRegistration {
  id: string;
  organizationId: string;
  eventId: string;
  memberId: string;
  status: RegistrationStatus;
  registeredAt: string;
  source: RegistrationSource;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  organizationId: string;
  eventId: string;
  memberId: string;
  registrationId: string;
  checkedInAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Volunteer {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string[];
  interests: string[];
  availability: string[];
  status: VolunteerStatus;
  safeguardingStatus: SafeguardingStatus;
  safeguardingNote: string;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerAssignment {
  id: string;
  organizationId: string;
  volunteerId: string;
  eventId: string;
  role: string;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceLog {
  id: string;
  organizationId: string;
  volunteerId: string;
  eventId: string | null;
  hours: number;
  date: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Donor {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  type: DonorType;
  city: string;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: string;
  organizationId: string;
  donorId: string;
  amountCents: number;
  date: string;
  type: DonationType;
  programId: string | null;
  method: PaymentMethod;
  reference: string;
  status: DonationStatus;
  inKindDescription: string | null;
  sponsorId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Embeddable give button an organization can place on their own website. */
export interface DonateButton {
  id: string;
  organizationId: string;
  label: string;
  /** Preset dollar amounts shown on the public give page. Empty = custom only. */
  amounts: number[];
  defaultAmount: number;
  /** Programs this button may fund. Empty = unrestricted ("where need is greatest"). */
  programIds: string[];
  type: "one_time" | "recurring";
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sponsor {
  id: string;
  organizationId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  tier: SponsorTier;
  contributionCents: number;
  programIds: string[];
  startDate: string;
  renewalDate: string;
  status: SponsorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  reorderThreshold: number;
  location: string;
  programId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  organizationId: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  eventId: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  organizationId: string;
  amountCents: number;
  date: string;
  category: string;
  description: string;
  programId: string | null;
  eventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  organizationId: string;
  title: string;
  body: string;
  audience: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplate {
  id: string;
  organizationId: string;
  name: string;
  channel: CampaignChannel;
  subject: string;
  body: string;
  kind: TemplateKind;
  createdAt: string;
  updatedAt: string;
}

export interface RecipientGroup {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  rule: GroupRule;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  templateId: string;
  groupId: string;
  channel: CampaignChannel;
  recipientCount: number;
  skippedCount: number;
  sentAt: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssistanceRequest {
  id: string;
  organizationId: string;
  contactName: string;
  contactMethod: "email" | "phone";
  contactValue: string;
  neighborhood: string;
  requestType: string;
  message: string;
  status: AssistanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerInterest {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  interests: string;
  availability: string;
  status: InterestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MemberNote {
  id: string;
  organizationId: string;
  memberId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImpactReport {
  id: string;
  organizationId: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  programId: string | null;
  eventId: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  organizationId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt: string;
}

export interface StaffTask {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeUserId: string;
  createdByUserId: string;
  programId: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachActivity {
  id: string;
  organizationId: string;
  title: string;
  type: OutreachType;
  status: OutreachStatus;
  date: string;
  neighborhood: string;
  city: string;
  programId: string | null;
  leadUserId: string;
  volunteerIds: string[];
  householdsReached: number;
  individualsReached: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoDatabase {
  version: 1;
  seededAt: string;
  organizations: Organization[];
  users: User[];
  plans: PlanDefinition[];
  subscriptions: Subscription[];
  households: Household[];
  members: CommunityMember[];
  programs: Program[];
  events: OrgEvent[];
  registrations: EventRegistration[];
  attendance: Attendance[];
  volunteers: Volunteer[];
  assignments: VolunteerAssignment[];
  serviceLogs: ServiceLog[];
  donors: Donor[];
  donations: Donation[];
  donateButtons: DonateButton[];
  sponsors: Sponsor[];
  inventoryItems: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  expenses: Expense[];
  announcements: Announcement[];
  templates: MessageTemplate[];
  groups: RecipientGroup[];
  campaigns: Campaign[];
  assistanceRequests: AssistanceRequest[];
  volunteerInterests: VolunteerInterest[];
  notes: MemberNote[];
  reports: ImpactReport[];
  tasks: StaffTask[];
  outreachActivities: OutreachActivity[];
  audit: AuditEvent[];
}

export interface SessionState {
  userId: string | null;
  orgId: string | null;
  sidebarCollapsed: boolean;
  /** Notification keys the user has opened in the header bell. */
  seenNotificationIds: string[];
}
