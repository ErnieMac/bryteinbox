import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Monitor, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/providers/auth';

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Messaging providers · BryteInbox" },
      { name: "description", content: "Beeper and Unipile connection requirements for your personal BryteInbox inbox." },
      { property: "og:title", content: "Messaging providers · BryteInbox" },
      { property: "og:description", content: "Prepare your Beeper and Unipile messaging connections." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Integrations,
});

function Integrations() {
  const { user } = useAuth();
  return (
    <div className="settings-page min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to inbox</Link>
        <h1 className="text-3xl font-semibold">Messaging providers</h1>
        <p className="mt-2 text-muted-foreground">No live messaging accounts are connected. The inbox still contains sample conversations.</p>
        <section className="mt-10 border-t pt-6"><h2 className="flex items-center gap-2 text-xl font-semibold"><Monitor size={20} /> Beeper</h2><p className="mt-3 text-muted-foreground">Requires Beeper Desktop running on your computer, an API token and a secure relay. Its local API is not reachable by this hosted app by default. Do not expose it directly to the internet.</p><a className="mt-3 inline-block text-sm underline" href="https://developers.beeper.com/desktop-api" target="_blank" rel="noreferrer">Beeper API documentation</a></section>
        <section className="mt-8 border-t pt-6"><h2 className="flex items-center gap-2 text-xl font-semibold"><Cloud size={20} /> Unipile</h2><p className="mt-3 text-muted-foreground">Requires a Unipile subscription, your API endpoint and a private API key. Account linking and message sync are not enabled yet.</p><a className="mt-3 inline-block text-sm underline" href="https://developer.unipile.com/docs/hosted-auth" target="_blank" rel="noreferrer">Unipile connection documentation</a></section>
        <Button variant="outline" className="mt-8" asChild><Link to={user ? '/account' : '/auth'}>{user ? 'Your account' : 'Sign in to your account'}</Link></Button>
      </div>
    </div>
  );
}
