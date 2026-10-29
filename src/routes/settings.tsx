import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowDown, ArrowUp, Check, Pencil, Plus, Sparkles, Trash2, X as XIcon, Plug } from "lucide-react";
import { toast } from "sonner";
import { PlatformBadge, PLATFORM_META } from "@/components/quicker/bits";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { accountsQuery, useOrganiser } from "@/hooks/use-inbox";
import type { Tag } from "@/lib/organiser-store";
import { useAuth } from '@/providers/auth';
import { BeeperConnect } from "@/components/quicker/BeeperConnect";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · BryteInbox" },
      { name: "description", content: "Manage connected accounts, tags and AI suggested drafts in BryteInbox." },
      { property: "og:title", content: "Settings · BryteInbox" },
      { property: "og:description", content: "Manage connected accounts, tags and AI suggested drafts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

const TAG_COLORS = ["#F59E0B", "#3B82F6", "#10B981", "#EC4899", "#8B5CF6", "#EF4444", "#14B8A6", "#9CA3AF"];

function Settings() {
  const { user } = useAuth();
  return (
    <div className="settings-page min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to inbox
        </Link>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-muted-foreground">Connected accounts, tags and AI suggested drafts.</p>
        <BeeperConnect />
        <AccountsSection />
        <TagsSection />
      </div>
    </div>
  );
}

function AccountsSection() {
  const accounts = useQuery(accountsQuery());
  const [disconnected, setDisconnected] = useState<Record<string, boolean>>({});
  return (
    <section className="mt-10" aria-labelledby="accounts-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="accounts-heading" className="text-xl font-semibold">Connected accounts</h2>
        <Button variant="outline" size="sm" asChild>
          <Link to="/integrations"><Plug /> Setup guides</Link>
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Sample accounts for now — real connections come with the Beeper or Unipile provider.</p>
      <div className="mt-4 space-y-3">
        {accounts.isPending ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border bg-card p-4">
              <Skeleton className="h-9 w-9 rounded-md" />
              <div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>
            </div>
          ))
        ) : accounts.isError ? (
          <div role="alert" className="rounded-lg border bg-card p-4 text-sm">
            Couldn't load accounts. <button type="button" className="underline" onClick={() => accounts.refetch()}>Try again</button>
          </div>
        ) : (
          (accounts.data ?? []).map((a) => {
            const off = disconnected[a.id] || a.status !== "connected";
            return (
              <div key={a.id} className="flex items-center gap-4 rounded-lg border bg-card p-4">
                <PlatformBadge p={a.platform} size={36} className="ring-0" focusable />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{a.displayName}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {PLATFORM_META[a.platform].label} · {a.handle}
                  </div>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", off ? "bg-muted text-muted-foreground" : "bg-accent text-foreground")}>
                  {off ? "Disconnected" : "Connected"}
                </span>
                <Button
                  variant={off ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDisconnected((d) => ({ ...d, [a.id]: !off }));
                    toast(off ? `${a.displayName} reconnected (sample)` : `${a.displayName} disconnected (sample)`);
                  }}
                >
                  {off ? "Connect" : "Disconnect"}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function TagsSection() {
  const { state, store } = useOrganiser();
  const tags = [...state.tags].sort((a, b) => a.order - b.order);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]!);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const move = (id: string, dir: -1 | 1) => {
    const i = tags.findIndex((t) => t.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= tags.length) return;
    const ids = tags.map((t) => t.id);
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    store.reorderTags(ids);
  };

  const addTag = () => {
    const name = newName.trim();
    if (!name) return;
    store.createTag(name, newColor);
    setNewName("");
    toast(`Tag “${name}” created`);
  };

  const saveRename = (tag: Tag) => {
    const name = editName.trim();
    if (name && name !== tag.name) {
      store.updateTag(tag.id, { name });
      toast(`Tag renamed to “${name}”`);
    }
    setEditingId(null);
  };

  return (
    <section className="mt-10" aria-labelledby="tags-heading">
      <h2 id="tags-heading" className="text-xl font-semibold">Tags</h2>
      <p className="mt-1 text-sm text-muted-foreground">Create, rename, recolour and reorder tags. Order here matches the sidebar.</p>

      <div className="mt-4 space-y-2">
        {tags.map((t, i) => (
          <div key={t.id} className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: t.color }} aria-hidden />
              {editingId === t.id ? (
                <form className="flex min-w-0 flex-1 items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); saveRename(t); }}>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    aria-label={`Rename ${t.name}`}
                    className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                  <Button type="submit" size="sm" variant="ghost" aria-label="Save name"><Check className="h-4 w-4" /></Button>
                  <Button type="button" size="sm" variant="ghost" aria-label="Cancel rename" onClick={() => setEditingId(null)}><XIcon className="h-4 w-4" /></Button>
                </form>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate font-medium">{t.name}</span>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="sm" aria-label={`Move ${t.name} up`} disabled={i === 0} onClick={() => move(t.id, -1)}><ArrowUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label={`Move ${t.name} down`} disabled={i === tags.length - 1} onClick={() => move(t.id, 1)}><ArrowDown className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label={`Rename ${t.name}`} onClick={() => { setEditingId(t.id); setEditName(t.name); }}><Pencil className="h-4 w-4" /></Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${t.name}`}
                      onClick={() => { store.deleteTag(t.id); toast(`Tag “${t.name}” deleted`); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-5">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Set ${t.name} colour ${c}`}
                  aria-pressed={t.color === c}
                  onClick={() => store.updateTag(t.id, { color: c })}
                  className={cn("h-5 w-5 rounded-full transition", t.color === c ? "ring-2 ring-ring ring-offset-2 ring-offset-card" : "hover:scale-110")}
                  style={{ background: c }}
                />
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2.5 border-t pt-3 text-sm">
              <Switch
                checked={t.aiDrafts}
                onCheckedChange={(on) => {
                  store.updateTag(t.id, { aiDrafts: on });
                  toast(on ? `AI drafts on for ${t.name}` : `AI drafts off for ${t.name}`);
                }}
                aria-label={`AI suggested drafts for ${t.name}`}
              />
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              AI suggested drafts
              <span className="text-xs text-muted-foreground">— show a suggested reply in chats with this tag</span>
            </label>
          </div>
        ))}
      </div>

      <form
        className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-card p-3"
        onSubmit={(e) => { e.preventDefault(); addTag(); }}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New tag name"
          aria-label="New tag name"
          className="min-w-40 flex-1 rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="New tag colour">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={newColor === c}
              aria-label={`Colour ${c}`}
              onClick={() => setNewColor(c)}
              className={cn("h-5 w-5 rounded-full transition", newColor === c ? "ring-2 ring-ring ring-offset-2 ring-offset-card" : "hover:scale-110")}
              style={{ background: c }}
            />
          ))}
        </div>
        <Button type="submit" size="sm" disabled={!newName.trim()}><Plus /> Add tag</Button>
      </form>
    </section>
  );
}
