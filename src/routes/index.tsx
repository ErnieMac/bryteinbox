import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Inbox, ListFilter, Bell, Clock, UserPlus, Archive, BellOff, Image, Settings, MessageSquareHeart, Plus, EyeOff,
  Search, Info, MoreHorizontal, Pin, StickyNote, Hash, ChevronDown, Smile, List, Sparkles, Send, X as XIcon,
  Zap, Users, MessagesSquare, Paperclip, Wand2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { INITIAL_CONVOS, MEMBERS, PLATFORMS, TAGS, type Convo, type Platform, type Tag } from "@/lib/quicker-data";
import { Avatar, Kbd, PlatformBadge, TagPill } from "@/components/quicker/bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inbox · Quicker Chat" },
      { name: "description", content: "All your DMs from Slack, LinkedIn, WhatsApp, X and iMessage in one calm inbox." },
      { property: "og:title", content: "Quicker Chat — one inbox for every DM" },
      { property: "og:description", content: "Triage, tag and reply with AI drafts across every platform." },
    ],
  }),
  component: App,
});

type View = "inbox" | "triage" | "reminders" | "requests" | "archive" | "muted" | "media";
type Filter = { kind: "platform"; id: Platform } | { kind: "tag"; id: Tag } | null;

function App() {
  const [convos, setConvos] = useState<Convo[]>(INITIAL_CONVOS);
  const [activeId, setActiveId] = useState("launch");
  const [view, setView] = useState<View>("inbox");
  const [filter, setFilter] = useState<Filter>(null);
  const [focus, setFocus] = useState(false);
  const [query, setQuery] = useState("");
  const [switcher, setSwitcher] = useState(false);
  const [input, setInput] = useState("");
  const [draftDismissed, setDraftDismissed] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const visible = useMemo(() => {
    return convos.filter((c) => {
      if (view === "archive") return c.archived;
      if (c.archived) return false;
      if (view === "reminders") return c.group === "Reminders" || c.snoozed;
      if (view === "triage") return !c.tag;
      if (focus && !c.vip) return false;
      if (filter?.kind === "platform" && c.platform !== filter.id) return false;
      if (filter?.kind === "tag" && c.tag !== filter.id) return false;
      if (query && !(c.name + c.preview + c.messages.map((m) => m.text).join(" ")).toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [convos, view, filter, focus, query]);

  const active = (convos.find((c) => c.id === activeId) ?? convos[0])!;
  const showDraft = !draftDismissed[active.id] && !input;

  const update = (id: string, fn: (c: Convo) => Convo) => setConvos((cs) => cs.map((c) => (c.id === id ? fn(c) : c)));

  const open = (id: string) => {
    setActiveId(id);
    update(id, (c) => ({ ...c, unread: false }));
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    const id = active.id;
    const msgId = crypto.randomUUID();
    const now = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    update(id, (c) => ({ ...c, preview: `You: ${text}`, time: now, messages: [...c.messages, { id: msgId, from: "You", me: true, text, time: now }] }));
    setInput("");
    setDraftDismissed((d) => ({ ...d, [id]: true }));
    const undo = () => update(id, (c) => ({ ...c, messages: c.messages.filter((m) => m.id !== msgId) }));
    toast("Message sent", { description: "⌘Z to undo", action: { label: "Undo", onClick: undo } });
    (window as unknown as { __undo?: (() => void) | undefined }).__undo = undo;
    setTimeout(() => {
      const other = active.participants[0] ?? "";
      if (!other) return;
      update(id, (c) => ({
        ...c,
        preview: `${other.split(" ")[0]}: 🙌 Sounds good!`,
        messages: [...c.messages, { id: crypto.randomUUID(), from: other, text: "🙌 Sounds good!", time: now }],
      }));
    }, 2500);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).tagName === "INPUT";
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSwitcher((s) => !s); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !typing) {
        const u = (window as unknown as { __undo?: (() => void) | undefined }).__undo;
        if (u) { u(); (window as unknown as { __undo?: (() => void) | undefined }).__undo = undefined; toast("Send undone"); }
        return;
      }
      if (e.key === "Escape") setSwitcher(false);
      if (e.key === "Tab" && document.activeElement === inputRef.current && showDraft) {
        e.preventDefault(); setInput(active.draft); return;
      }
      if (typing) return;
      if (e.key === "j" || e.key === "k") {
        const i = visible.findIndex((c) => c.id === activeId);
        const next = visible[Math.max(0, Math.min(visible.length - 1, i + (e.key === "j" ? 1 : -1)))];
        if (next) open(next.id);
      }
      if (e.key === "e") archive(activeId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const archive = (id: string) => { update(id, (c) => ({ ...c, archived: !c.archived })); toast("Conversation archived", { action: { label: "Undo", onClick: () => update(id, (c) => ({ ...c, archived: false })) } }); };
  const snooze = (id: string) => { update(id, (c) => ({ ...c, snoozed: true, group: "Reminders" })); toast("Reminder set for tomorrow 9:00"); };
  const setTag = (id: string, tag: Tag) => update(id, (c) => ({ ...c, tag, suggested: undefined }));

  const navItems: { id: View; label: string; icon: typeof Inbox; count?: number }[] = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: convos.filter((c) => c.unread && !c.archived).length },
    { id: "triage", label: "Triage", icon: ListFilter, count: 2 },
    { id: "reminders", label: "Reminders", icon: Clock, count: 1 },
    { id: "requests", label: "Requests", icon: UserPlus, count: 37 },
    { id: "archive", label: "Archive", icon: Archive },
    { id: "muted", label: "Muted", icon: BellOff },
    { id: "media", label: "Media", icon: Image },
  ];

  const groups = (["Reminders", "Today", "Yesterday"] as const).map((g) => ({ g, items: visible.filter((c) => c.group === g) })).filter((x) => x.items.length);
  const heading = filter ? (filter.kind === "platform" ? PLATFORMS.find((p) => p.id === filter.id)!.label : filter.id) : navItems.find((n) => n.id === view)!.label;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-[13px]">
      <Toaster position="bottom-center" />
      {/* Rail */}
      <aside className="flex w-[220px] shrink-0 flex-col border-r bg-rail px-2.5 py-3">
        <div className="mb-4 flex items-center gap-2 px-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Zap className="h-4 w-4" fill="currentColor" /></div>
          <span className="font-serif text-xl">Quicker Chat</span>
        </div>
        <button onClick={() => setSwitcher(true)} className="mb-3 flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-muted-foreground">
          <Search className="h-3.5 w-3.5" /> Search all DMs <span className="ml-auto"><Kbd>⌘K</Kbd></span>
        </button>
        <nav className="space-y-0.5 overflow-y-auto">
          {navItems.map((n) => (
            <RailItem key={n.id} active={view === n.id && !filter} onClick={() => { setView(n.id); setFilter(null); }} icon={<n.icon className="h-4 w-4" />} label={n.label} count={n.count} accent={n.id === "inbox"} />
          ))}
          <SectionLabel>Platforms</SectionLabel>
          {PLATFORMS.map((p) => (
            <RailItem key={p.id} active={filter?.kind === "platform" && filter.id === p.id} onClick={() => { setView("inbox"); setFilter({ kind: "platform", id: p.id }); }} icon={<PlatformBadge p={p.id} size={16} className="ring-0" />} label={p.label} count={p.count} />
          ))}
          <SectionLabel>Tags</SectionLabel>
          {TAGS.map((t) => (
            <RailItem key={t.id} active={filter?.kind === "tag" && filter.id === t.id} onClick={() => { setView("inbox"); setFilter({ kind: "tag", id: t.id }); }} icon={<span className="mx-1 h-2.5 w-2.5 rounded-full" style={{ background: `oklch(0.65 0.14 ${t.hue})` }} />} label={t.id} count={t.count} />
          ))}
          <RailItem onClick={() => toast("New tag created")} icon={<Plus className="h-4 w-4" />} label="New tag" muted />
          <RailItem icon={<EyeOff className="h-4 w-4" />} label="Hidden" count={2} muted />
        </nav>
        <div className="mt-auto space-y-0.5 border-t pt-2">
          <Link to="/integrations" className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-accent"><Settings className="h-4 w-4" /> Settings</Link>
          <RailItem onClick={() => toast("Thanks for the feedback!")} icon={<MessageSquareHeart className="h-4 w-4" />} label="Send Feedback" />
        </div>
      </aside>

      {/* List */}
      <section className="flex w-[340px] shrink-0 flex-col border-r bg-pane">
        <header className="flex items-center gap-2 px-4 pb-2 pt-4">
          <h1 className="font-serif text-[28px] leading-none">{heading}</h1>
          <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            Focus
            <button onClick={() => setFocus(!focus)} className={cn("relative h-4 w-7 rounded-full transition", focus ? "bg-primary" : "bg-border")}>
              <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-card transition-all", focus ? "left-3.5" : "left-0.5")} />
            </button>
          </label>
          <button className="rounded-md p-1.5 hover:bg-accent" onClick={() => setFilter(null)}><ListFilter className="h-4 w-4" /></button>
        </header>
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search messages…" className="flex-1 bg-transparent outline-none" />
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 py-2">
          {["sarah", "design", "mum"].map((id) => { const c = convos.find((x) => x.id === id)!; return (
            <button key={id} onClick={() => open(id)} className="flex w-[84px] shrink-0 flex-col items-center gap-1 rounded-lg p-1.5 hover:bg-accent">
              <Avatar name={c.name} hue={c.hue} size={44} platform={c.platform} />
              <span className="w-full truncate text-[11px] font-medium">{c.name}</span>
              <span className="w-full truncate text-[10px] text-muted-foreground">{c.preview}</span>
            </button>); })}
        </div>
        <div className="flex-1 overflow-y-auto pb-4">
          {groups.length === 0 && <p className="p-6 text-center text-muted-foreground">Nothing here. Inbox zero ✨</p>}
          {groups.map(({ g, items }) => (
            <div key={g}>
              <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g}</div>
              {items.map((c) => (
                <button key={c.id} onClick={() => open(c.id)} className={cn("mx-2 flex w-[calc(100%-1rem)] gap-3 rounded-lg px-2.5 py-2.5 text-left", activeId === c.id ? "bg-card shadow-sm ring-1 ring-border" : "hover:bg-accent/60")}>
                  <Avatar name={c.name} hue={c.hue} platform={c.platform} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("truncate", c.unread ? "font-semibold" : "font-medium")}>{c.name}</span>
                      <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{c.time}</span>
                    </div>
                    <p className={cn("truncate text-[12px]", c.unread ? "text-foreground" : "text-muted-foreground")}>{c.preview}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {c.tag && <TagPill tag={c.tag} />}
                      {c.suggested && <TagPill tag={c.suggested} suggested onClick={() => setTag(c.id, c.suggested!)} />}
                      {c.unread && <span className="ml-auto h-2 w-2 rounded-full bg-unread" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Thread */}
      <main className="flex min-w-0 flex-1 flex-col bg-card">
        <header className="flex items-center gap-3 border-b px-5 py-3">
          <Avatar name={active.name} hue={active.hue} size={32} platform={active.platform} />
          <div className="min-w-0">
            <div className="font-semibold">{active.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{active.participants.join(", ")}</div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <IconBtn title="Remind me" onClick={() => snooze(active.id)}><Clock className="h-4 w-4" /></IconBtn>
            <IconBtn title="Archive (E)" onClick={() => archive(active.id)}><Archive className="h-4 w-4" /></IconBtn>
            <IconBtn title="Search" onClick={() => setSwitcher(true)}><Search className="h-4 w-4" /></IconBtn>
            <IconBtn title="Details"><Info className="h-4 w-4" /></IconBtn>
            <IconBtn title="More"><MoreHorizontal className="h-4 w-4" /></IconBtn>
          </div>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="text-center text-[11px] text-muted-foreground">Today</div>
          {active.messages.map((m, i) => {
            const grouped = i > 0 && active.messages[i - 1].from === m.from;
            const member = MEMBERS.find((x) => x.name === m.from);
            return (
              <div key={m.id} className={cn("flex gap-3", grouped && "-mt-3", m.me && "flex-row-reverse")}>
                <div className="w-9">{!grouped && <Avatar name={m.from} hue={m.me ? 45 : member?.hue ?? active.hue} />}</div>
                <div className={cn("max-w-[560px]", m.me && "text-right")}>
                  {!grouped && <div className="mb-0.5 flex items-baseline gap-2"><span className="font-semibold">{m.from}</span><span className="text-[11px] text-muted-foreground">{m.time}</span></div>}
                  <div className={cn("inline-block rounded-2xl px-3.5 py-2 text-left leading-relaxed", m.me ? "bg-primary text-primary-foreground" : "bg-muted")}>{m.text}</div>
                  {m.card === "promo" && (
                    <div className="mt-2 w-[380px] overflow-hidden rounded-xl border">
                      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/90 to-accent font-serif text-4xl text-primary-foreground">quicker.chat</div>
                      <div className="p-3"><div className="font-semibold">Quicker Chat — every DM, one inbox</div><div className="text-[12px] text-muted-foreground">quicker.chat · Slack, LinkedIn, WhatsApp, X & iMessage</div></div>
                    </div>
                  )}
                  {m.card === "beehiiv" && (
                    <div className="mt-2 flex w-[380px] items-center gap-3 rounded-xl border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent font-bold text-primary">bh</div>
                      <div><div className="font-semibold">Cross-promo brief · beehiiv</div><div className="text-[12px] text-muted-foreground">beehiiv.com/partners/quicker · PDF, 4 pages</div></div>
                    </div>
                  )}
                  {m.threadReplies && <div className="mt-1.5 flex items-center gap-2 text-[12px] font-medium text-primary"><MessagesSquare className="h-3.5 w-3.5" /> {m.threadReplies} replies <span className="font-normal text-muted-foreground">Last reply 12m ago</span></div>}
                  {m.reactions && <div className="mt-1.5 flex gap-1">{m.reactions.map((r) => <span key={r} className="rounded-full border bg-card px-2 py-0.5 text-[11px]">{r}</span>)}</div>}
                </div>
              </div>
            );
          })}
        </div>
        {/* Composer */}
        <div className="border-t px-5 py-3">
          <div className="rounded-xl border bg-background p-2.5 shadow-sm focus-within:ring-2 focus-within:ring-ring/40">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                rows={2}
                placeholder={showDraft ? "" : `Message ${active.name}`}
                className="w-full resize-none bg-transparent px-1 outline-none"
              />
              {showDraft && (
                <div className="pointer-events-none absolute inset-0 px-1 text-muted-foreground">
                  <Kbd>Tab</Kbd> <span className="italic">{active.draft}</span>
                </div>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1 text-muted-foreground">
              <IconBtn title="Emoji" onClick={() => setInput((v) => v + "🙂")}><Smile className="h-4 w-4" /></IconBtn>
              <IconBtn title="Bullets" onClick={() => setInput((v) => v + "\n• ")}><List className="h-4 w-4" /></IconBtn>
              <IconBtn title="Attach"><Paperclip className="h-4 w-4" /></IconBtn>
              <IconBtn title="Clean draft" onClick={() => setInput(active.draft)}><Wand2 className="h-4 w-4" /></IconBtn>
              <span className="ml-2 text-[11px]">{showDraft ? "Tab to accept · or start typing to edit" : "Enter to send"}</span>
              <span className="ml-auto flex items-center gap-1 text-[11px]"><Clock className="h-3 w-3" /> Delivers now</span>
              <button onClick={() => send(input || (showDraft ? active.draft : ""))} className="ml-2 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:bg-primary/90">
                <Send className="h-3.5 w-3.5" /> Send
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Inspector */}
      <aside className="hidden w-[280px] shrink-0 flex-col overflow-y-auto border-l bg-pane xl:flex">
        <div className="border-b p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-card px-2 py-1 font-semibold ring-1 ring-border">{active.name}</span>
            <span className="flex items-center gap-1 rounded-md bg-card px-2 py-1 text-[11px] ring-1 ring-border"><PlatformBadge p={active.platform} size={14} className="ring-0" />{PLATFORMS.find((p) => p.id === active.platform)!.label}</span>
          </div>
          <div className="mt-3 flex gap-1 text-muted-foreground">
            {[Bell, Pin, StickyNote, Hash, Settings].map((I, i) => <IconBtn key={i} onClick={() => toast("Updated")}><I className="h-4 w-4" /></IconBtn>)}
          </div>
        </div>
        <Section title="Members" icon={<Users className="h-3.5 w-3.5" />}>
          {(active.platform === "slack" ? MEMBERS : active.participants.map((n) => ({ name: n, role: "Contact", hue: active.hue }))).map((m) => (
            <div key={m.name} className="flex items-center gap-2.5 py-1"><Avatar name={m.name} hue={m.hue} size={26} /><div><div className="font-medium">{m.name}</div><div className="text-[11px] text-muted-foreground">{m.role}</div></div></div>
          ))}
        </Section>
        <Section title="Threads" icon={<MessagesSquare className="h-3.5 w-3.5" />}>
          {[["Graphic v2", "Leo: swapped the hero crop", "12m", 4], ["Email copy", "Jess: subject line ideas?", "1h", 2]].map(([t, p, time, n]) => (
            <div key={t as string} className="rounded-lg bg-card p-2 ring-1 ring-border"><div className="flex justify-between font-medium">{t}<span className="text-[11px] text-muted-foreground">{time}</span></div><div className="truncate text-[12px] text-muted-foreground">{p}</div><div className="text-[11px] text-primary">{n} replies</div></div>
          ))}
        </Section>
        <Section title="Media" icon={<Image className="h-3.5 w-3.5" />}>
          <div className="grid grid-cols-3 gap-1.5">{[20, 45, 200].map((h) => <div key={h} className="aspect-square rounded-md" style={{ background: `oklch(0.85 0.06 ${h})` }} />)}</div>
          <div className="mt-2 text-[12px] text-primary">quicker.chat · beehiiv.com/partners</div>
        </Section>
        <Section title="AI Summary" icon={<Sparkles className="h-3.5 w-3.5" />}>
          <ul className="list-disc space-y-1 pl-4 text-[12.5px]">
            <li>Landing page went live this morning.</li>
            <li>Graphic v2 posted, beehiiv cross-promo confirmed.</li>
            <li>Final email pass waits on you.</li>
          </ul>
        </Section>
        <Section title="Actions" icon={<Zap className="h-3.5 w-3.5" />}>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.slice(0, 4).map((t) => <button key={t.id} onClick={() => setTag(active.id, t.id)}><TagPill tag={t.id} /></button>)}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <button onClick={() => snooze(active.id)} className="rounded-md border bg-card py-1.5 hover:bg-accent">Remind me</button>
            <button onClick={() => archive(active.id)} className="rounded-md border bg-card py-1.5 hover:bg-accent">Archive</button>
          </div>
        </Section>
      </aside>

      {switcher && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 pt-28" onClick={() => setSwitcher(false)}>
          <div className="w-[520px] overflow-hidden rounded-xl border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b px-4 py-3"><Search className="h-4 w-4 text-muted-foreground" /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Jump to a conversation…" className="flex-1 bg-transparent text-sm outline-none" /><button onClick={() => setSwitcher(false)}><XIcon className="h-4 w-4" /></button></div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {convos.filter((c) => (c.name + c.preview).toLowerCase().includes(query.toLowerCase())).map((c) => (
                <button key={c.id} onClick={() => { open(c.id); setSwitcher(false); setQuery(""); }} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-accent">
                  <Avatar name={c.name} hue={c.hue} size={28} platform={c.platform} /><div className="min-w-0"><div className="font-medium">{c.name}</div><div className="truncate text-[12px] text-muted-foreground">{c.preview}</div></div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 border-t px-4 py-2 text-[11px] text-muted-foreground"><span><Kbd>J</Kbd>/<Kbd>K</Kbd> navigate</span><span><Kbd>E</Kbd> archive</span><span><Kbd>Tab</Kbd> accept draft</span><span><Kbd>⌘Z</Kbd> undo send</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

function RailItem({ icon, label, count, active, onClick, accent, muted }: { icon: React.ReactNode; label: string; count?: number; active?: boolean; onClick?: () => void; accent?: boolean; muted?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left", active ? "bg-card font-medium shadow-sm ring-1 ring-border" : "hover:bg-accent", muted && "text-muted-foreground")}>
      {icon}<span className="flex-1 truncate">{label}</span>
      {count != null && <span className={cn("rounded-full px-1.5 text-[11px]", accent ? "bg-unread text-primary-foreground" : "text-muted-foreground")}>{count}</span>}
    </button>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</div>;
}
function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
  return <button title={title} onClick={onClick} className="rounded-md p-1.5 hover:bg-accent">{children}</button>;
}
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [openS, setOpen] = useState(true);
  return (
    <div className="border-b px-4 py-3">
      <button onClick={() => setOpen(!openS)} className="flex w-full items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}{title}<ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition", !openS && "-rotate-90")} />
      </button>
      {openS && <div className="mt-2 space-y-1.5">{children}</div>}
    </div>
  );
}
