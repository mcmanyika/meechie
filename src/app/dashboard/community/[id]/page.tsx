"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MemberDialog } from "@/components/community/member-dialog";
import { PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { memberProgramIds } from "@/lib/domain/metrics";
import { formatDate, formatDateTime, titleCase } from "@/lib/format";
import { useDemoStore } from "@/stores/demo-store";

export default function MemberProfilePage() {
  const params = useParams<{ id: string }>();
  const members = useOrgRows("members");
  const households = useOrgRows("households");
  const events = useOrgRows("events");
  const programs = useOrgRows("programs");
  const registrations = useOrgRows("registrations");
  const attendance = useOrgRows("attendance");
  const notes = useOrgRows("notes");
  const requests = useOrgRows("assistanceRequests");
  const { db, allowed } = useSession();
  const addNote = useDemoStore((state) => state.addNote);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const member = members.find((item) => item.id === params.id);
  if (!member) {
    return (
      <RequireAccess permission="community.view" entitlement="community" feature="Community">
        <p className="text-sm text-muted-foreground">That member is not in the selected organization.</p>
      </RequireAccess>
    );
  }
  const household = households.find((item) => item.id === member.householdId);
  const householdMembers = members.filter((item) => item.householdId === member.householdId);
  const guardian = members.find((item) => item.id === member.guardianMemberId);
  const memberRegs = registrations.filter((item) => item.memberId === member.id);
  const programIds = memberProgramIds(db, member.id);
  const memberNotes = notes.filter((note) => note.memberId === member.id);

  return (
    <RequireAccess permission="community.view" entitlement="community" feature="Community">
      <div className="grid gap-5">
        <PageHeader
          eyebrow={member.id}
          title={`${member.firstName} ${member.lastName}`}
          description={member.isMinor ? "Guardian-managed child record. Email and phone are not stored." : member.email ?? "No email on file"}
          actions={
            allowed("community.manage") ? (
              <Button variant="outline" onClick={() => setOpen(true)}>
                Edit member
              </Button>
            ) : null
          }
        />
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={member.status} />
          <StatusBadge value={member.preferredChannel} />
          {member.isMinor ? <StatusBadge value="minor" /> : null}
        </div>
        <Tabs defaultValue="overview">
          <TabsList className="flex h-auto w-full flex-wrap">
            {["overview", "household", "programs", "events", "assistance", "notes", "preferences"].map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {titleCase(tab)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Phone" value={member.phone ?? "Not collected"} />
              <Info label="City" value={member.city} />
              <Info label="Registered" value={formatDate(member.registeredAt)} />
              <Info label="Guardian" value={guardian ? `${guardian.firstName} ${guardian.lastName}` : "Not required"} />
            </dl>
          </TabsContent>
          <TabsContent value="household" className="pt-4">
            <p className="text-sm font-medium">{household?.name}</p>
            <p className="text-sm text-muted-foreground">
              {household?.neighborhood}, {household?.city} {household?.postalCode}
            </p>
            <ul className="mt-3 space-y-2">
              {householdMembers.map((person) => (
                <li key={person.id}>
                  <Link href={`/dashboard/community/${person.id}`} className="text-sm hover:underline">
                    {person.firstName} {person.lastName}
                  </Link>
                  {person.isMinor ? <span className="ml-2 text-xs text-muted-foreground">Child</span> : null}
                </li>
              ))}
            </ul>
          </TabsContent>
          <TabsContent value="programs" className="pt-4">
            <ul className="space-y-2">
              {programIds.length === 0 ? <li className="text-sm text-muted-foreground">No program participation yet.</li> : null}
              {programIds.map((id) => {
                const program = programs.find((item) => item.id === id);
                return (
                  <li key={id}>
                    <Link href={`/dashboard/programs/${id}`} className="text-sm hover:underline">
                      {program?.name ?? id}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </TabsContent>
          <TabsContent value="events" className="pt-4">
            <ul className="space-y-3">
              {memberRegs.length === 0 ? <li className="text-sm text-muted-foreground">No registrations.</li> : null}
              {memberRegs.map((registration) => {
                const event = events.find((item) => item.id === registration.eventId);
                const checked = attendance.find((item) => item.registrationId === registration.id);
                return (
                  <li key={registration.id} className="flex items-center justify-between gap-3 text-sm">
                    <Link href={`/dashboard/events/${registration.eventId}`} className="hover:underline">
                      {event?.name}
                    </Link>
                    <span className="text-muted-foreground">{checked ? `Checked in ${formatDateTime(checked.checkedInAt)}` : titleCase(registration.status)}</span>
                  </li>
                );
              })}
            </ul>
          </TabsContent>
          <TabsContent value="assistance" className="pt-4">
            <ul className="space-y-3">
              {requests.filter((request) => request.contactValue === member.email || request.contactValue === member.phone).length === 0 ? (
                <li className="text-sm text-muted-foreground">No portal assistance request matches this contact.</li>
              ) : null}
              {requests
                .filter((request) => request.contactValue === member.email || request.contactValue === member.phone)
                .map((request) => (
                  <li key={request.id} className="text-sm">
                    {request.requestType} · {request.neighborhood} · {titleCase(request.status)}
                  </li>
                ))}
            </ul>
          </TabsContent>
          <TabsContent value="notes" className="grid gap-3 pt-4">
            <ul className="space-y-3">
              {memberNotes.map((note) => (
                <li key={note.id} className="rounded-lg border p-3 text-sm">
                  <p>{note.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {note.authorName} · {formatDateTime(note.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
            {allowed("community.manage") ? (
              <form
                className="grid gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!draft.trim()) return;
                  const result = addNote(member.id, draft.trim());
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  setDraft("");
                  toast.success("Note saved.");
                }}
              >
                <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Staff note" aria-label="Staff note" />
                <Button type="submit" className="w-fit">
                  Add note
                </Button>
              </form>
            ) : null}
          </TabsContent>
          <TabsContent value="preferences" className="pt-4">
            <ul className="space-y-2 text-sm">
              <li>Preferred channel: {titleCase(member.preferredChannel)}</li>
              <li>Email consent: {member.consentEmail ? "Yes" : "No"}</li>
              <li>SMS consent: {member.consentSms ? "Yes" : "No"}</li>
              <li>WhatsApp consent: {member.consentWhatsapp ? "Yes" : "No"}</li>
            </ul>
          </TabsContent>
        </Tabs>
        <MemberDialog open={open} onOpenChange={setOpen} member={member} />
      </div>
    </RequireAccess>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
