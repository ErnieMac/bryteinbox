import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { PlatformBadge } from "@/components/quicker/bits";
import { Button } from "@/components/ui/button";
import type { Platform } from "@/lib/quicker-data";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations & Connectors · Quicker Chat" },
      { name: "description", content: "Connect Slack, LinkedIn, WhatsApp, X and iMessage to Quicker Chat." },
      { property: "og:title", content: "Integrations & Connectors · Quicker Chat" },
      { property: "og:description", content: "Step-by-step guides to connect your real accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Integrations,
});

const GUIDES: { id: Platform; name: string; method: string; steps: string[] }[] = [
  { id: "slack", name: "Slack", method: "OAuth app + Events webhook", steps: ["Create an app at api.slack.com/apps", "Add scopes: channels:history, im:history, chat:write", "Set Event Subscriptions URL to your Quicker webhook", "Install to workspace and paste the bot token"] },
  { id: "linkedin", name: "LinkedIn", method: "Connector", steps: ["Open the LinkedIn connector", "Sign in and approve messaging access", "Pick which inboxes to sync"] },
  { id: "whatsapp", name: "WhatsApp", method: "WhatsApp Cloud API", steps: ["Create a Meta Business app", "Add the WhatsApp product and a phone number", "Generate a permanent access token", "Point the webhook to Quicker and verify"] },
  { id: "x", name: "X", method: "X API v2 (DM scope)", steps: ["Create a project at developer.x.com", "Enable OAuth 2.0 with dm.read and dm.write", "Authorize your account"] },
  { id: "imessage", name: "iMessage", method: "Mac helper app", steps: ["Install the Quicker Mac helper", "Grant Full Disk Access", "Keep your Mac online to relay messages"] },
];

function Integrations() {
  const [connected, setConnected] = useState<Record<string, boolean>>({ slack: true });
  const [openId, setOpenId] = useState<string | null>("whatsapp");
  return (
    <div className="settings-page min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to inbox</Link>
        <h1 className="text-3xl font-semibold">Integrations & Connectors</h1>
        <p className="mt-2 text-muted-foreground">Connect your real accounts. Each guide walks you through setup.</p>
        <div className="mt-8 space-y-3">
          {GUIDES.map((g) => (
            <div key={g.id} className="rounded-lg border bg-card">
              <div className="flex items-center gap-4 p-4">
                <PlatformBadge p={g.id} size={36} className="ring-0" />
                <Button variant="ghost" className="flex-1 text-left" onClick={() => setOpenId(openId === g.id ? null : g.id)}>
                  <div className="font-semibold">{g.name}</div>
                  <div className="text-sm text-muted-foreground">{g.method}</div>
                </Button>
                <Button variant="ghost" onClick={() => setConnected((c) => ({ ...c, [g.id]: !c[g.id] }))} className={connected[g.id] ? "flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm" : "rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"}>
                  {connected[g.id] ? <><Check className="h-4 w-4" /> Connected</> : "Connect"}
                </Button>
              </div>
              {openId === g.id && (
                <ol className="space-y-2 border-t px-6 py-4 text-sm">
                  {g.steps.map((s, i) => <li key={s} className="flex gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold">{i + 1}</span>{s}</li>)}
                </ol>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
