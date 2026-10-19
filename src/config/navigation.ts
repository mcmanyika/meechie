import {
  BarChart3,
  Boxes,
  Building2,
  CalendarDays,
  HandCoins,
  HeartHandshake,
  LayoutDashboard,
  Megaphone,
  PieChart,
  Settings,
  Users,
  UsersRound,
  Warehouse,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";
import type { Entitlement } from "@/types/models";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: Permission;
  entitlement?: Entitlement;
  tour?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const APP_NAV: NavGroup[] = [
  {
    label: "Workspace",
    items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard, permission: "dashboard.view", tour: "dashboard" }],
  },
  {
    label: "Programs",
    items: [
      { href: "/dashboard/community", label: "Community", icon: Users, permission: "community.view", entitlement: "community", tour: "community" },
      { href: "/dashboard/programs", label: "Programs", icon: Warehouse, permission: "programs.view", entitlement: "programs" },
      { href: "/dashboard/events", label: "Events", icon: CalendarDays, permission: "events.view", entitlement: "events", tour: "events" },
      { href: "/dashboard/volunteers", label: "Volunteers", icon: UsersRound, permission: "volunteers.view", entitlement: "volunteers", tour: "volunteers" },
    ],
  },
  {
    label: "Fundraising",
    items: [
      { href: "/dashboard/donations", label: "Donations", icon: HandCoins, permission: "donations.view", entitlement: "donations", tour: "donations" },
      { href: "/dashboard/donors", label: "Donors", icon: HeartHandshake, permission: "donations.view", entitlement: "donations" },
      { href: "/dashboard/sponsors", label: "Sponsors", icon: Building2, permission: "sponsors.view", entitlement: "sponsors" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/inventory", label: "Inventory", icon: Boxes, permission: "inventory.view", entitlement: "inventory" },
      { href: "/dashboard/communications", label: "Communications", icon: Megaphone, permission: "communications.view", entitlement: "communications" },
      { href: "/dashboard/reports", label: "Impact Reports", icon: PieChart, permission: "reports.view", entitlement: "reports", tour: "reports" },
    ],
  },
  {
    label: "System",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings, permission: "settings.manage" }],
  },
];

export const PLATFORM_NAV: NavItem[] = [
  { href: "/platform", label: "Overview", icon: LayoutDashboard, permission: "platform.manage" },
  { href: "/platform/organizations", label: "Organizations", icon: Building2, permission: "platform.manage" },
  { href: "/platform/subscriptions", label: "Subscriptions", icon: BarChart3, permission: "platform.manage" },
  { href: "/platform/analytics", label: "Analytics", icon: PieChart, permission: "platform.manage" },
];

export const TOUR_STEPS = [
  {
    title: "Executive dashboard",
    body: "KPIs, charts, and activity all read from the same demonstration records. Adding a gift or registration changes these figures.",
    href: "/dashboard",
  },
  {
    title: "Community management",
    body: "Search the fictional directory, filter by status, and open a household profile. Children are stored with a guardian and without extra identifiers.",
    href: "/dashboard/community",
  },
  {
    title: "Event registration",
    body: "The Back-to-School Community Giveaway is the sample workflow: publish, register, assign a volunteer, check in, then review the summary.",
    href: "/dashboard/events/evt_meechie_giveaway",
  },
  {
    title: "Volunteer coordination",
    body: "Assignments and service hours stay on the volunteer record. Safeguarding statuses are staff notes, not proof of a background check.",
    href: "/dashboard/volunteers",
  },
  {
    title: "Donation management",
    body: "Gifts are simulated. Amounts are stored in cents, and completed gifts roll into fundraising totals. No card data is collected.",
    href: "/dashboard/donations",
  },
  {
    title: "Impact reporting",
    body: "Reports calculate households, attendance, hours, gifts, and supplies from records. Narrative outcomes stay labeled as unverified notes.",
    href: "/dashboard/reports",
  },
];
