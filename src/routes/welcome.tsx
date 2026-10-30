import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Inbox, Laptop, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BeeperConnect } from "@/components/quicker/BeeperConnect";

export const Route = createFileRoute("/welcome")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Get started · BryteInbox" },
      { name: "description", content: "Connect your first messaging account to start using BryteInbox." },
      { property: "og:title", content: "Get started with BryteInbox" },
      { property: "og:description", content: "Connect your first account and bring every DM into one inbox." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Welcome,
});

const STEPS = ["Welcome", "Connect", "Done"];

function Welcome() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <ol className="mb-8 flex items-center justify-center gap-2 text-sm" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s} className={i <= step ? "font-medium text-foreground" : "text-muted-foreground"} aria-current={i === step ? "step" : undefined}>
              {i + 1}. {s}{i < STEPS.length - 1 && <span className="ml-2 text-muted-foreground">—</span>}
            </li>
          ))}
        </ol>
        {step === 0 && (
          <section className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Inbox size={28} /></div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">Welcome to BryteInbox</h1>
            <p className="mt-3 text-muted-foreground">One calm inbox for iMessage, WhatsApp, LinkedIn, Instagram, Telegram, Slack and X. Let's connect your first account.</p>
            <div className="mt-6 flex items-start gap-3 rounded-lg border bg-card p-4 text-left text-sm">
              <Laptop size={18} className="mt-0.5 shrink-0" />
              <p>You'll need <strong>Beeper Desktop</strong> installed and signed in on this computer. It's free at beeper.com.</p>
            </div>
            <Button className="mt-8" size="lg" onClick={() => setStep(1)}>Get started</Button>
          </section>
        )}
        {step === 1 && (
          <section>
            <h1 className="text-2xl font-semibold tracking-tight">Connect Beeper</h1>
            <p className="mt-2 text-muted-foreground">BryteInbox reads your chats from the Beeper app running on this computer.</p>
            <div className="-mt-6"><BeeperConnect onConnected={() => setStep(2)} /></div>
            <Button variant="ghost" className="mt-4" onClick={() => setStep(0)}>Back</Button>
          </section>
        )}
        {step === 2 && (
          <section className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check size={28} /></div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">You're connected</h1>
            <p className="mt-3 text-muted-foreground">Your chats are ready. You can add more accounts in Beeper anytime.</p>
            <Button className="mt-8" size="lg" onClick={() => navigate({ to: "/" })}>Go to inbox</Button>
          </section>
        )}
      </div>
    </main>
  );
}
