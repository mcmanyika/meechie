"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  LifeBuoy,
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
import { MoodSwitcher } from "@/components/theme/mood-switcher";
import { cn } from "cn";

const PINNED_HREFS = new Set([
  "/dashboard",
  "/dashboard/community",
  "/dashboard/events",
  "/dashboard/donations",
  "/dashboard/reports",
]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useDemoStore((state) => state.hydrated);
  const { user } = useSession();
  const setSearchOpen = useDemoStore((state) => state.setSearchOpen);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setSearchOpen]);

  if (!hydrated || !user) return <AuthGate />;

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <TopBar />
      <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <CommandPalette />
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

function useAllowedNav() {
  const { user } = useSession();
  return useMemo(() => {
    if (!user) return [];
    return APP_NAV.map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(user.role, item.permission)),
    })).filter((group) => group.items.length > 0);
  }, [user]);
}

function TopBar() {
  const pathname = usePathname();
  const { organization, user, db } = useSession();
  const setUser = useDemoStore((state) => state.setUser);
  const setSearch = useDemoStore((state) => state.setSearchOpen);
  const setHelpOpen = useDemoStore((state) => state.setHelpOpen);
  const { theme, setTheme } = useTheme();
  const crumbs = useMemo(() => buildCrumbs(pathname, db, organization?.id ?? null), [pathname, db, organization?.id]);
  const personas = db.users.filter(
    (item) =>
      (item.organizationId === organization?.id || item.id === user?.id) &&
      (item.accountStatus ?? "active") === "active",
  );
  const groups = useAllowedNav();
  const pinned = useMemo(() => groups.flatMap((group) => group.items).filter((item) => PINNED_HREFS.has(item.href)), [groups]);
  const moreGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => !PINNED_HREFS.has(item.href)),
        }))
        .filter((group) => group.items.length > 0),
    [groups],
  );
  return (
    <header data-app-chrome className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-black text-[10px] font-semibold text-white">
            {organization?.logoText ?? "MP"}
          </span>
          <span className="hidden font-heading text-sm font-semibold tracking-tight sm:inline">
            {organization?.name ?? PRODUCT_NAME}
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-2 hidden items-center gap-0.5 lg:flex">
          {pinned.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive(pathname, item.href) && "bg-muted font-medium text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
          {moreGroups.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground"
                    aria-label="More navigation"
                  />
                }
              >
                More
                <ChevronDown className="size-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {moreGroups.map((group, index) => (
                  <DropdownMenuGroup key={group.label}>
                    {index > 0 ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                    {group.items.map((item) => (
                      <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                        <item.icon className="size-4" />
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setHelpOpen(true);
                  }}
                >
                  <LifeBuoy className="size-4" />
                  Help and support
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="outline"
            className="hidden h-9 gap-2 px-3 text-muted-foreground sm:inline-flex"
            onClick={() => setSearch(true)}
          >
            <Search className="size-4" />
            <span>Search</span>
            <kbd className="ml-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
          </Button>
          <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Search" onClick={() => setSearch(true)}>
            <Search />
          </Button>

          <MobileNav moreGroups={moreGroups} pinned={pinned} />

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
          <MoodSwitcher />
          <Button variant="ghost" size="icon" aria-label="Toggle color theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="dark:hidden" />
            <Moon className="hidden dark:block" />
          </Button>
          <UserMenu />
        </div>
      </div>
      <nav aria-label="Breadcrumb" className="hidden border-t border-border/60 px-3 py-1.5 text-xs text-muted-foreground sm:flex sm:px-4">
        {crumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex min-w-0 items-center gap-1">
            {index > 0 ? <span>/</span> : null}
            <Link href={crumb.href} className={cn("truncate", index === crumbs.length - 1 && "font-medium text-foreground")}>
              {crumb.label}
            </Link>
          </span>
        ))}
      </nav>
    </header>
  );
}

function MobileNav({ pinned, moreGroups }: { pinned: NavItem[]; moreGroups: { label: string; items: NavItem[] }[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const setHelpOpen = useDemoStore((state) => state.setHelpOpen);
  return (
    <>
      <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
        Menu
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[280px] sm:max-w-xs">
          <SheetHeader>
            <SheetTitle>Navigate</SheetTitle>
          </SheetHeader>
          <nav className="grid gap-5 px-4 pb-6" aria-label="Mobile">
            <div>
              <p className="pb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Pinned</p>
              <ul className="space-y-1">
                {pinned.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted",
                        isActive(pathname, item.href) && "bg-muted font-medium",
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {moreGroups.map((group) => (
              <div key={group.label}>
                <p className="pb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{group.label}</p>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted",
                          isActive(pathname, item.href) && "bg-muted font-medium",
                        )}
                      >
                        <item.icon className="size-4" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted"
              onClick={() => {
                setOpen(false);
                setHelpOpen(true);
              }}
            >
              <LifeBuoy className="size-4" />
              Help and support
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </>
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

function CommandPalette() {
  const open = useDemoStore((state) => state.searchOpen);
  const setOpen = useDemoStore((state) => state.setSearchOpen);
  const { db, orgId } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const groups = useAllowedNav();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const navResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groups
      .flatMap((group) => group.items.map((item) => ({ ...item, group: group.label, kind: "Go to" as const })))
      .filter((item) => !needle || item.label.toLowerCase().includes(needle) || item.group.toLowerCase().includes(needle));
  }, [groups, query]);

  const recordResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!orgId || needle.length < 2) return [];
    const members = db.members
      .filter((member) => member.organizationId === orgId && `${member.firstName} ${member.lastName} ${member.email ?? ""}`.toLowerCase().includes(needle))
      .slice(0, 5)
      .map((member) => ({ href: `/dashboard/community/${member.id}`, label: `${member.firstName} ${member.lastName}`, kind: "Community" as const, Icon: null as null }));
    const events = db.events
      .filter((event) => event.organizationId === orgId && event.name.toLowerCase().includes(needle))
      .slice(0, 4)
      .map((event) => ({ href: `/dashboard/events/${event.id}`, label: event.name, kind: "Event" as const, Icon: null as null }));
    const programs = db.programs
      .filter((program) => program.organizationId === orgId && program.name.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((program) => ({ href: `/dashboard/programs/${program.id}`, label: program.name, kind: "Program" as const, Icon: null as null }));
    const donors = db.donors
      .filter((donor) => donor.organizationId === orgId && donor.name.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((donor) => ({ href: "/dashboard/donors", label: donor.name, kind: "Donor" as const, Icon: null as null }));
    const volunteers = db.volunteers
      .filter((volunteer) => volunteer.organizationId === orgId && `${volunteer.firstName} ${volunteer.lastName}`.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((volunteer) => ({
        href: `/dashboard/volunteers/${volunteer.id}`,
        label: `${volunteer.firstName} ${volunteer.lastName}`,
        kind: "Volunteer" as const,
        Icon: null as null,
      }));
    return [...members, ...events, ...programs, ...donors, ...volunteers];
  }, [db, orgId, query]);

  const results = useMemo(() => {
    const nav = navResults.map((item) => ({
      href: item.href,
      label: item.label,
      kind: item.kind,
      Icon: item.icon,
    }));
    return [...nav, ...recordResults];
  }, [navResults, recordResults]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        return;
      }
      if (event.key === "Enter" && results[activeIndex]) {
        event.preventDefault();
        setOpen(false);
        router.push(results[activeIndex].href);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, results, activeIndex, router, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-black/40 px-4 pt-[12vh] backdrop-blur-[2px]" onClick={() => setOpen(false)}>
      <div
        className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border bg-popover shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Go to a page or search records…"
            aria-label="Command palette search"
            className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <kbd className="hidden rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">esc</kbd>
        </div>
        <ul className="max-h-[min(60vh,24rem)] overflow-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              {query.trim().length >= 2 ? "No matches." : "Type to filter pages, or search people and programs."}
            </li>
          ) : (
            results.map((result, index) => (
              <li key={`${result.kind}-${result.href}-${result.label}`}>
                <Link
                  href={result.href}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    index === activeIndex ? "bg-muted text-foreground" : "hover:bg-muted/70",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    {result.Icon ? <result.Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
                    <span className="truncate">{result.label}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{result.kind}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
        <div className="flex items-center gap-3 border-t px-3 py-2 text-[11px] text-muted-foreground">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto">esc close</span>
        </div>
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
          <p>
            Press <kbd className="rounded border px-1 font-mono text-[10px]">⌘K</kbd> /{" "}
            <kbd className="rounded border px-1 font-mono text-[10px]">Ctrl+K</kbd> anytime to jump pages or search records.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              void reset();
              setOpen(false);
            }}
          >
            Reset demo data
          </Button>
        </div>
      </SheetContent>
    </Sheet>
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
    tasks: "Tasks",
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
