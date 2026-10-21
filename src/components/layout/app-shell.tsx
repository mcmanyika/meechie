"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { PRODUCT_NAME } from "@/config/constants";
import { APP_NAV, type NavItem } from "@/config/navigation";
import { useSession } from "@/hooks/use-org";
import { ROLE_LABELS, hasPermission } from "@/lib/permissions";
import { formatRelative, titleCase } from "@/lib/format";
import { stockOnHand } from "@/lib/domain/metrics";
import { signOutAuth } from "@/lib/firebase/auth";
import { useDemoStore } from "@/stores/demo-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingBlock } from "@/components/shared/feedback";
import { cn } from "cn";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useDemoStore((state) => state.hydrated);
  const mobileNav = useDemoStore((state) => state.mobileNav);
  const setMobileNav = useDemoStore((state) => state.setMobileNav);
  const { user } = useSession();
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const sidebarExpanded = sidebarHovered;

  if (!hydrated || !user) return <AuthGate />;

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <div className="hidden w-[76px] shrink-0 md:block" aria-hidden="true" />
      <aside
        data-app-chrome
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden h-svh flex-col bg-sidebar text-sidebar-foreground transition-[width,box-shadow] duration-200 ease-out md:flex",
          sidebarExpanded ? "w-64 shadow-[8px_0_24px_rgba(0,0,0,0.18)]" : "w-[76px]",
        )}
      >
        <SidebarBody collapsed={!sidebarExpanded} onNavigate={() => undefined} />
      </aside>
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMobileNav(true)} />
        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="h-full w-[280px] bg-sidebar p-0 text-sidebar-foreground sm:max-w-xs">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarBody collapsed={false} onNavigate={() => setMobileNav(false)} />
        </SheetContent>
      </Sheet>
      <SearchDialog />
      <HelpSheet />
    </div>
  );
}

function AuthGate() {
  const hydrated = useDemoStore((state) => state.hydrated);
  const user = useDemoStore((state) => state.userId);
  const router = useRouter();
  useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, user, router]);
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <LoadingBlock />
      </div>
    );
  }
  return null;
}

function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  const { organization, allowed, user } = useSession();
  const setHelpOpen = useDemoStore((state) => state.setHelpOpen);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn("flex shrink-0 items-center gap-3 px-4 py-4", collapsed && "justify-center px-2")}>
        <div className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
          {organization?.logoText ?? "MP"}
        </div>
        {collapsed ? null : (
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-semibold">{organization?.name ?? PRODUCT_NAME}</p>
          </div>
        )}
      </div>
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Primary">
        {APP_NAV.map((group) => {
          const items = group.items.filter((item) => user && hasPermission(user.role, item.permission) && allowed(item.permission));
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              {collapsed ? null : <p className="px-2 pb-1 text-[11px] font-medium tracking-wide text-sidebar-foreground/45 uppercase">{group.label}</p>}
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.href}>
                    <NavLink item={item} active={isActive(pathname, item.href)} collapsed={collapsed} onNavigate={onNavigate} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="mt-auto shrink-0 space-y-1 border-t border-sidebar-border p-3">
        <button type="button" onClick={() => setHelpOpen(true)} className={navClass(false, collapsed)}>
          <LifeBuoy className="size-4 shrink-0" />
          {collapsed ? <span className="sr-only">Help and support</span> : "Help and support"}
        </button>
        <ProfileRow collapsed={collapsed} />
      </div>
    </div>
  );
}

function NavLink({ item, active, collapsed, onNavigate }: { item: NavItem; active: boolean; collapsed: boolean; onNavigate: () => void }) {
  const link = (
    <Link href={item.href} onClick={onNavigate} className={navClass(active, collapsed)} aria-current={active ? "page" : undefined}>
      <item.icon className="size-4 shrink-0" />
      {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
    </Link>
  );
  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function ProfileRow({ collapsed }: { collapsed: boolean }) {
  const user = useSession().user;
  const exitDemo = useDemoStore((state) => state.exitDemo);
  const router = useRouter();
  if (!user) return null;
  return (
    <button
      type="button"
      className={navClass(false, collapsed)}
      onClick={() => {
        void signOutAuth().finally(() => {
          exitDemo();
          router.push("/");
        });
      }}
    >
      <span className="grid size-6 place-items-center rounded-full bg-sidebar-accent text-[10px]">{user.avatarInitials}</span>
      {collapsed ? <span className="sr-only">Sign out</span> : <span className="min-w-0 truncate text-left">{user.name}</span>}
      {collapsed ? null : <LogOut className="ml-auto size-3.5 opacity-70" />}
    </button>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const { organization, user, db } = useSession();
  const setUser = useDemoStore((state) => state.setUser);
  const setSearch = useDemoStore((state) => state.setSearchOpen);
  const { theme, setTheme } = useTheme();
  const crumbs = useMemo(() => buildCrumbs(pathname, db, organization?.id ?? null), [pathname, db, organization?.id]);
  const personas = db.users.filter((item) => item.organizationId === organization?.id || item.id === user?.id);
  return (
    <header data-app-chrome className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur sm:px-4">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu} aria-label="Open navigation">
        <Menu />
      </Button>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 text-sm text-muted-foreground md:flex">
        {crumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex min-w-0 items-center gap-1">
            {index > 0 ? <span>/</span> : null}
            <Link href={crumb.href} className={cn("truncate", index === crumbs.length - 1 && "font-medium text-foreground")}>
              {crumb.label}
            </Link>
          </span>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="outline" className="hidden sm:inline-flex" onClick={() => setSearch(true)}>
          <Search />
          Search
        </Button>
        <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Search" onClick={() => setSearch(true)}>
          <Search />
        </Button>
        <label className="hidden items-center gap-2 text-xs text-muted-foreground xl:flex">
          Staff role
          <select
            aria-label="Staff role switcher"
            className="h-8 max-w-48 rounded-lg border bg-card px-2 text-sm text-foreground"
            value={user?.id ?? ""}
            onChange={(event) => setUser(event.target.value)}
          >
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.name} · {ROLE_LABELS[persona.role]}
              </option>
            ))}
          </select>
        </label>
        <Notifications />
        <Button variant="ghost" size="icon" aria-label="Toggle color theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <Sun className="dark:hidden" />
          <Moon className="hidden dark:block" />
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}

function Notifications() {
  const { db, orgId } = useSession();
  const items = useMemo(() => {
    if (!orgId) return [];
    const low = db.inventoryItems
      .filter((item) => item.organizationId === orgId && stockOnHand(db, item.id) <= item.reorderThreshold)
      .slice(0, 3)
      .map((item) => ({ id: item.id, title: `${item.name} is low`, detail: `${stockOnHand(db, item.id)} on hand`, href: "/dashboard/inventory" }));
    const requests = db.assistanceRequests
      .filter((request) => request.organizationId === orgId && request.status === "new")
      .slice(0, 2)
      .map((request) => ({ id: request.id, title: request.requestType, detail: request.neighborhood, href: "/dashboard/community" }));
    const audit = db.audit
      .filter((event) => event.organizationId === orgId)
      .slice(0, 4)
      .map((event) => ({ id: event.id, title: event.summary, detail: formatRelative(event.createdAt), href: "/dashboard" }));
    return [...low, ...requests, ...audit].slice(0, 8);
  }, [db, orgId]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Notifications" />}>
        <Bell />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.length === 0 ? <p className="px-2 py-3 text-sm text-muted-foreground">Nothing new in this workspace.</p> : null}
          {items.map((item) => (
            <DropdownMenuItem key={item.id} render={<Link href={item.href} />}>
              <span className="flex flex-col">
                <span className="text-sm">{item.title}</span>
                <span className="text-xs text-muted-foreground">{item.detail}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const { user } = useSession();
  const exitDemo = useDemoStore((state) => state.exitDemo);
  const router = useRouter();
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className="px-2" aria-label="Account menu" />}>
        <span className="grid size-6 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{user.avatarInitials}</span>
        <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {user.name}
            <span className="block text-xs font-normal text-muted-foreground">{ROLE_LABELS[user.role]}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/dashboard/settings" />}>Settings</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void signOutAuth().finally(() => {
                exitDemo();
                router.push("/");
              });
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SearchDialog() {
  const open = useDemoStore((state) => state.searchOpen);
  const setOpen = useDemoStore((state) => state.setSearchOpen);
  const { db, orgId } = useSession();
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!orgId || needle.length < 2) return [];
    const members = db.members
      .filter((member) => member.organizationId === orgId && `${member.firstName} ${member.lastName} ${member.email ?? ""}`.toLowerCase().includes(needle))
      .slice(0, 5)
      .map((member) => ({ href: `/dashboard/community/${member.id}`, label: `${member.firstName} ${member.lastName}`, kind: "Community" }));
    const events = db.events
      .filter((event) => event.organizationId === orgId && event.name.toLowerCase().includes(needle))
      .slice(0, 4)
      .map((event) => ({ href: `/dashboard/events/${event.id}`, label: event.name, kind: "Event" }));
    const programs = db.programs
      .filter((program) => program.organizationId === orgId && program.name.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((program) => ({ href: `/dashboard/programs/${program.id}`, label: program.name, kind: "Program" }));
    const donors = db.donors
      .filter((donor) => donor.organizationId === orgId && donor.name.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((donor) => ({ href: "/dashboard/donors", label: donor.name, kind: "Donor" }));
    const volunteers = db.volunteers
      .filter((volunteer) => volunteer.organizationId === orgId && `${volunteer.firstName} ${volunteer.lastName}`.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((volunteer) => ({ href: `/dashboard/volunteers/${volunteer.id}`, label: `${volunteer.firstName} ${volunteer.lastName}`, kind: "Volunteer" }));
    return [...members, ...events, ...programs, ...donors, ...volunteers];
  }, [db, orgId, query]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-black/30 px-4 pt-24" onClick={() => setOpen(false)}>
      <div className="mx-auto w-full max-w-xl rounded-xl border bg-popover p-3 shadow-lg" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Global search">
        <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search members, programs, events, donors, volunteers" aria-label="Search demo records" />
        <ul className="mt-2 max-h-80 overflow-auto">
          {results.map((result) => (
            <li key={result.href + result.label}>
              <Link href={result.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-muted">
                {result.label}
                <span className="text-xs text-muted-foreground">{result.kind}</span>
              </Link>
            </li>
          ))}
          {query.trim().length >= 2 && results.length === 0 ? <li className="px-2 py-6 text-sm text-muted-foreground">No matching demonstration records.</li> : null}
        </ul>
      </div>
    </div>
  );
}

function HelpSheet() {
  const open = useDemoStore((state) => state.helpOpen);
  const setOpen = useDemoStore((state) => state.setHelpOpen);
  const reset = useDemoStore((state) => state.resetDemo);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Help and support</SheetTitle>
        </SheetHeader>
        <div className="grid gap-3 px-4 text-sm text-muted-foreground">
          <p>This is a local demonstration. Nothing is emailed, charged, or stored outside this browser.</p>
          <Button
            variant="outline"
            onClick={() => {
              void reset();
              setOpen(false);
            }}
          >
            Reset demo data
          </Button>
          <p>Production authentication, billing, and messaging are described in the README roadmap.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function navClass(active: boolean, collapsed: boolean) {
  return cn(
    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    active && "bg-sidebar-accent text-sidebar-accent-foreground",
    collapsed && "justify-center",
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function buildCrumbs(pathname: string, db: ReturnType<typeof useSession>["db"], orgId: string | null) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [{ href: "/dashboard", label: "Overview" }];
  if (parts.length === 1) return crumbs;
  const labels: Record<string, string> = {
    community: "Community",
    programs: "Programs",
    events: "Events",
    volunteers: "Volunteers",
    donations: "Donations",
    donors: "Donors",
    sponsors: "Sponsors",
    inventory: "Inventory",
    communications: "Communications",
    reports: "Impact Reports",
    settings: "Settings",
    organizations: "Organizations",
    subscriptions: "Subscriptions",
    analytics: "Analytics",
    new: "New",
  };
  let href = "";
  parts.forEach((part, index) => {
    href += `/${part}`;
    if (index === 0) return;
    const named =
      db.events.find((event) => event.id === part)?.name ||
      db.members.find((member) => member.id === part && member.organizationId === orgId)?.firstName ||
      db.programs.find((program) => program.id === part)?.name ||
      db.volunteers.find((volunteer) => volunteer.id === part)?.firstName;
    crumbs.push({ href, label: named ? named : labels[part] ?? titleCase(part) });
  });
  return crumbs;
}
