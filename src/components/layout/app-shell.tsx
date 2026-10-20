"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { DEMO_DISCLAIMER, PRODUCT_NAME } from "@/config/constants";
import { APP_NAV, PLATFORM_NAV, TOUR_STEPS, type NavItem } from "@/config/navigation";
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

export function AppShell({ children, variant = "workspace" }: { children: React.ReactNode; variant?: "workspace" | "platform" }) {
  const hydrated = useDemoStore((state) => state.hydrated);
  const collapsed = useDemoStore((state) => state.sidebarCollapsed);
  const setCollapsed = useDemoStore((state) => state.setSidebarCollapsed);
  const mobileNav = useDemoStore((state) => state.mobileNav);
  const setMobileNav = useDemoStore((state) => state.setMobileNav);
  const { user } = useSession();

  if (!hydrated || !user) return <AuthGate />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div data-app-chrome className="border-b bg-[#e7f4f1] px-4 py-2 text-center text-xs text-[#115e59] dark:bg-[#12352f] dark:text-[#ccfbf1]">
        {DEMO_DISCLAIMER}
      </div>
      <div className="flex min-h-[calc(100vh-33px)]">
        <aside
          data-app-chrome
          className={cn(
            "sticky top-0 hidden h-[calc(100vh-33px)] shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex",
            collapsed ? "w-[76px]" : "w-64",
          )}
        >
          <SidebarBody variant={variant} collapsed={collapsed} onNavigate={() => undefined} />
          <button
            type="button"
            className="m-3 inline-flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            {collapsed ? <span className="sr-only">Expand sidebar</span> : "Collapse"}
          </button>
        </aside>
        <div className="min-w-0 flex-1">
          <TopBar variant={variant} onMenu={() => setMobileNav(true)} />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-[280px] bg-sidebar p-0 text-sidebar-foreground sm:max-w-xs">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarBody variant={variant} collapsed={false} onNavigate={() => setMobileNav(false)} />
        </SheetContent>
      </Sheet>
      <Tour />
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

function SidebarBody({ variant, collapsed, onNavigate }: { variant: "workspace" | "platform"; collapsed: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  const { organization, allowed, user } = useSession();
  const setHelpOpen = useDemoStore((state) => state.setHelpOpen);
  const groups = variant === "platform" ? [{ label: "Platform", items: PLATFORM_NAV }] : APP_NAV;
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-3 px-4 py-4", collapsed && "justify-center px-2")}>
        <div className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
          {variant === "platform" ? "OS" : organization?.logoText ?? "OS"}
        </div>
        {collapsed ? null : (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{variant === "platform" ? PRODUCT_NAME : organization?.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{variant === "platform" ? "Platform admin" : organization?.city}</p>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Primary">
        {groups.map((group) => {
          const items = group.items.filter((item) => user && hasPermission(user.role, item.permission) && (variant === "platform" || allowed(item.permission)));
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
      <div className="space-y-1 border-t border-sidebar-border p-3">
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
    <Link href={item.href} data-tour={item.tour} onClick={onNavigate} className={navClass(active, collapsed)} aria-current={active ? "page" : undefined}>
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

function TopBar({ onMenu, variant }: { onMenu: () => void; variant: "workspace" | "platform" }) {
  const pathname = usePathname();
  const { organization, organizations, user, db } = useSession();
  const setOrg = useDemoStore((state) => state.setOrg);
  const setUser = useDemoStore((state) => state.setUser);
  const setSearch = useDemoStore((state) => state.setSearchOpen);
  const { theme, setTheme } = useTheme();
  const crumbs = useMemo(() => buildCrumbs(pathname, db, organization?.id ?? null), [pathname, db, organization?.id]);
  const personas = db.users.filter((item) => item.organizationId === organization?.id || item.role === "platform_super_admin" || item.id === user?.id);
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
        {variant === "workspace" ? (
          <label className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
            Organization
            <select
              aria-label="Organization switcher"
              className="h-8 max-w-44 rounded-lg border bg-card px-2 text-sm text-foreground"
              value={organization?.id ?? ""}
              onChange={(event) => setOrg(event.target.value)}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="hidden items-center gap-2 text-xs text-muted-foreground xl:flex">
          Demo role
          <select
            aria-label="Demo role switcher"
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

function Tour() {
  const step = useDemoStore((state) => state.tourStep);
  const setStep = useDemoStore((state) => state.setTourStep);
  const router = useRouter();
  if (step == null) return null;
  const current = TOUR_STEPS[step];
  if (!current) return null;
  return (
    <div data-app-chrome className="fixed right-4 bottom-4 z-40 w-[min(100%-2rem,22rem)] rounded-xl border bg-popover p-4 shadow-lg">
      <p className="text-xs text-muted-foreground">
        Product tour {step + 1} of {TOUR_STEPS.length}
      </p>
      <h2 className="mt-1 text-sm font-semibold">{current.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{current.body}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => setStep(null)}>
          Skip
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(current.href)}>
            Show
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (step === TOUR_STEPS.length - 1) {
                setStep(null);
                return;
              }
              const next = step + 1;
              setStep(next);
              router.push(TOUR_STEPS[next].href);
            }}
          >
            {step === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function HelpSheet() {
  const open = useDemoStore((state) => state.helpOpen);
  const setOpen = useDemoStore((state) => state.setHelpOpen);
  const setTour = useDemoStore((state) => state.setTourStep);
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
              setTour(0);
              setOpen(false);
            }}
          >
            Restart product tour
          </Button>
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
  if (href === "/dashboard" || href === "/platform") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function buildCrumbs(pathname: string, db: ReturnType<typeof useSession>["db"], orgId: string | null) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [{ href: parts[0] === "platform" ? "/platform" : "/dashboard", label: parts[0] === "platform" ? "Platform" : "Overview" }];
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
