"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { formatDateTime, titleCase } from "@/lib/format";
import { createId } from "@/lib/ids";
import { useDemoStore } from "@/stores/demo-store";

export default function CommunicationsPage() {
  const templates = useOrgRows("templates");
  const groups = useOrgRows("groups");
  const campaigns = useOrgRows("campaigns");
  const announcements = useOrgRows("announcements");
  const members = useOrgRows("members");
  const { allowed, orgId } = useSession();
  const sendCampaign = useDemoStore((state) => state.sendCampaign);
  const saveAnnouncement = useDemoStore((state) => state.saveAnnouncement);
  const saveTemplate = useDemoStore((state) => state.saveTemplate);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const optedOut = members.filter((member) => !member.consentEmail && !member.consentSms && !member.consentWhatsapp).length;
  return (
    <RequireAccess permission="communications.view" entitlement="communications" feature="Communications">
      <div className="grid gap-5">
        <PageHeader title="Communications" description="Messages are simulated in this browser. Consent is checked before a demo send is logged." />
        <p className="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
          Future providers: email delivery, Twilio SMS, and WhatsApp Business. {optedOut} active-looking records have no channel consent and would be skipped.
        </p>
        <Tabs defaultValue="announcements">
          <TabsList className="flex h-auto flex-wrap">
            {["announcements", "templates", "groups", "campaigns", "preferences"].map((tab) => <TabsTrigger key={tab} value={tab}>{titleCase(tab)}</TabsTrigger>)}
          </TabsList>
          <TabsContent value="announcements" className="grid gap-3 pt-4">
            <ul className="space-y-3">
              {announcements.map((item) => (
                <li key={item.id} className="rounded-xl border bg-card p-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.audience} · {formatDateTime(item.publishedAt)}</p>
                </li>
              ))}
            </ul>
            {allowed("communications.manage") ? (
              <form className="grid gap-2 rounded-xl border bg-card p-4" onSubmit={(event) => {
                event.preventDefault();
                if (!orgId) return;
                const now = new Date().toISOString();
                const result = saveAnnouncement({ id: createId("ann"), organizationId: orgId, title, body, audience: "Staff", publishedAt: now, createdAt: now, updatedAt: now });
                if (!result.ok) { toast.error(result.error); return; }
                setTitle(""); setBody("");
                toast.success("Announcement posted.");
              }}>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" aria-label="Announcement title" />
                <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Message" aria-label="Announcement body" />
                <Button type="submit" className="w-fit">Post announcement</Button>
              </form>
            ) : null}
          </TabsContent>
          <TabsContent value="templates" className="grid gap-3 pt-4">
            {templates.map((template) => (
              <article key={template.id} className="rounded-xl border bg-card p-4 text-sm">
                <p className="font-medium">{template.name}</p>
                <p className="text-xs text-muted-foreground">{titleCase(template.channel)} · {template.subject}</p>
                <p className="mt-2 text-muted-foreground">{template.body}</p>
                {allowed("communications.manage") ? <Button className="mt-2" variant="outline" size="sm" onClick={() => {
                  const result = saveTemplate({ ...template, body: template.body });
                  if (!result.ok) toast.error(result.error); else toast.success("Template kept.");
                }}>Save template</Button> : null}
              </article>
            ))}
          </TabsContent>
          <TabsContent value="groups" className="grid gap-2 pt-4">
            {groups.map((group) => (
              <article key={group.id} className="rounded-xl border bg-card p-4 text-sm">
                <p className="font-medium">{group.name}</p>
                <p className="text-muted-foreground">{group.description}</p>
              </article>
            ))}
          </TabsContent>
          <TabsContent value="campaigns" className="grid gap-3 pt-4">
            {allowed("communications.manage") ? (
              <form className="flex flex-wrap gap-2" onSubmit={(event) => {
                event.preventDefault();
                const result = sendCampaign(templateId, groupId);
                if (!result.ok) toast.error(result.error);
                else toast.success("Simulated send added to the activity log.");
              }}>
                <select aria-label="Template" className="h-8 rounded-lg border bg-card px-2 text-sm" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                  {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
                </select>
                <select aria-label="Recipient group" className="h-8 rounded-lg border bg-card px-2 text-sm" value={groupId} onChange={(event) => setGroupId(event.target.value)}>
                  {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
                <Button type="submit">Simulate send</Button>
              </form>
            ) : null}
            <ul className="space-y-2 text-sm">
              {campaigns.map((campaign) => (
                <li key={campaign.id} className="rounded-xl border bg-card p-3">
                  {campaign.name} · {campaign.recipientCount} recipients · {campaign.skippedCount} skipped · {campaign.preview}
                </li>
              ))}
            </ul>
          </TabsContent>
          <TabsContent value="preferences" className="pt-4 text-sm text-muted-foreground">
            <p>Email, SMS, and WhatsApp each require a matching consent flag and a contact value. Child records are excluded. Unsubscribe is represented by turning consent off on the member profile.</p>
          </TabsContent>
        </Tabs>
      </div>
    </RequireAccess>
  );
}
