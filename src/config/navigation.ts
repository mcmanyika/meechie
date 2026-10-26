import {
  Boxes,
  Building2,
  CalendarDays,
  CheckSquare,
  CircleDollarSign,
  HandCoins,
  HeartHandshake,
  LayoutDashboard,
  MapPin,
  PieChart,
  Settings,
  UserCog,
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
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const APP_NAV: NavGroup[] = [
  {
    label: "Home",
    items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard, permission: "dashboard.view" }],
  },
  {
    label: "Programs",
    items: [
      { href: "/dashboard/community", label: "Community", icon: Users, permission: "community.view", entitlement: "community" },
      { href: "/dashboard/outreach", label: "Outreach", icon: MapPin, permission: "outreach.view" },
      { href: "/dashboard/programs", label: "Programs", icon: Warehouse, permission: "programs.view", entitlement: "programs" },
      { href: "/dashboard/events", label: "Events", icon: CalendarDays, permission: "events.view", entitlement: "events" },
      { href: "/dashboard/volunteers", label: "Volunteers", icon: UsersRound, permission: "volunteers.view", entitlement: "volunteers" },
    ],
  },
  {
    label: "Fundraising",
    items: [
      { href: "/dashboard/fundraising", label: "Fundraising", icon: CircleDollarSign, permission: "donations.view", entitlement: "donations" },
      { href: "/dashboard/donations", label: "Donations", icon: HandCoins, permission: "donations.view", entitlement: "donations" },
      { href: "/dashboard/donors", label: "Donors", icon: HeartHandshake, permission: "donations.view", entitlement: "donations" },
      { href: "/dashboard/sponsors", label: "Sponsors", icon: Building2, permission: "sponsors.view", entitlement: "sponsors" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare, permission: "tasks.view" },
      { href: "/dashboard/inventory", label: "Inventory", icon: Boxes, permission: "inventory.view", entitlement: "inventory" },
      { href: "/dashboard/reports", label: "Impact Reports", icon: PieChart, permission: "reports.view", entitlement: "reports" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/dashboard/users", label: "Team access", icon: UserCog, permission: "settings.manage" },
      { href: "/dashboard/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
    ],
  },
];
