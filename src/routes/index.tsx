import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Inbox, ListFilter, Bell, Clock, UserPlus, Archive, BellOff, Image, Settings, MessageSquareHeart, Plus, EyeOff,
  Search, Info, MoreHorizontal, Pin, StickyNote, Hash, ChevronDown, Smile, List, Sparkles, Send, X as XIcon,
  Zap, Users, MessagesSquare, Paperclip, Wand2, PanelLeft, ArrowLeft, Pause, Check, ChevronRight, Mail, Phone, MapPin, Globe, User,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { INITIAL_CONVOS, MEMBERS, PLATFORMS, TAGS, type Convo, type Platform, type Tag } from "@/lib/quicker-data";
import { Avatar, Kbd, PlatformBadge, TagPill } from "@/components/quicker/bits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inbox · Quicker Chat" },
      { name: "description", content: "All your DMs from Slack, LinkedIn, WhatsApp, X and iMessage in one calm inbox." },
      { property: "og:title", content: "Quicker Chat — one inbox for every DM" },
      { property: "og:description", content: "Triage, tag and reply with AI drafts across every platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [mobileThread, setMobileThread] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
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

  const active = (convos.find((c) => c.id === activeId) ?? INITIAL_CONVOS[0] ?? { ...INITIAL_CONVOS[0], id: "", name: "", participants: [], messages: [], draft: "" } as Convo);
  const showDraft = !draftDismissed[active.id] && !input;

  const update = (id: string, fn: (c: Convo) => Convo) => setConvos((cs) => cs.map((c) => (c.id === id ? fn(c) : c)));

  const open = (id: string) => {
    setActiveId(id);
    setMobileThread(true);
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
  const heading = filter ? (filter.kind === "platform" ? PLATFORMS.find((p) => p.id === filter.id)?.label : filter.id) : navItems.find((n) => n.id === view)?.label;

  return (
    <div className="workspace-canvas">
    <div className={cn("chat-workspace", navigationOpen && "navigation-open", mobileThread && "mobile-thread-open", !detailsOpen && "details-hidden")}>
      <Toaster position="bottom-center" />
      <aside className="icon-rail">
        <div className="rail-brand"><MessagesSquare size={19} /></div>
        <IconBtn title="Toggle navigation" onClick={() => setNavigationOpen(v => !v)}><PanelLeft /></IconBtn>
        <IconBtn title="Search conversations" onClick={() => setSwitcher(true)}><Search /></IconBtn>
        <IconBtn title="Inbox" onClick={() => { setView("inbox"); setFilter(null); setMobileThread(false); }}><Inbox /></IconBtn>
        <IconBtn title="Reminders" onClick={() => { setView("reminders"); setFilter(null); }}><Clock /></IconBtn>
        <IconBtn title="Archive" onClick={() => { setView("archive"); setFilter(null); }}><Archive /></IconBtn>
        <div className="rail-current"><MessagesSquare size={15} /></div>
        <div className="mt-auto" />
        <Button asChild variant="ghost" size="icon" title="Settings"><Link to="/integrations"><Settings /></Link></Button>
        <Avatar name="Nestamedia Studios" hue={20} size={25} />
      </aside>
      {/* Rail */}
      <aside className="navigation-pane flex shrink-0 flex-col border-r bg-rail px-2.5 py-3">
        <div className="navigation-title">Chat <span>Quicker</span></div>
        <Button variant="ghost" onClick={() => setSwitcher(true)} className="mb-3 flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-muted-foreground">
          <Search className="h-3.5 w-3.5" /> Search chat <span className="ml-auto"><Kbd>⌘K</Kbd></span>
        </Button>
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
      <section className="conversation-pane flex shrink-0 flex-col border-r bg-pane">
        <header className="list-header flex items-center gap-2 px-4 pb-2 pt-4">
          <h1 className="text-sm font-semibold leading-none">{heading}</h1>
          <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            Focus
            <Button variant="ghost" onClick={() => setFocus(!focus)} className={cn("relative h-4 w-7 rounded-full transition", focus ? "bg-primary" : "bg-border")}>
              <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-card transition-all", focus ? "left-3.5" : "left-0.5")} />
            </Button>
          </label>
          <Button variant="ghost" className="rounded-md p-1.5 hover:bg-accent" onClick={() => setFilter(null)}><ListFilter className="h-4 w-4" /></Button>
        </header>
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search messages…" className="flex-1 bg-transparent outline-none" />
          </div>
        </div>
        <div className="list-filters">
          <Button variant="outline" size="sm" onClick={() => { setView("inbox"); setFilter(null); }}>Open <ChevronDown /></Button>
          <Button variant="outline" size="sm" onClick={() => setFocus(v => !v)}>{focus ? "Priority" : "All messages"}<ChevronDown /></Button>
        </div>
        <div className="flex-1 overflow-y-auto pb-4">
          {groups.length === 0 && <p className="p-6 text-center text-muted-foreground">Nothing here. Inbox zero ✨</p>}
          {groups.map(({ g, items }) => (
            <div key={g}>
              <div className="px-4 pb-1 pt-3 text-[11px] font-semibold section-caption text-muted-foreground">{g}</div>
              {items.map((c) => (
                <Button variant="ghost" key={c.id} onClick={() => open(c.id)} className={cn("conversation-row mx-2 flex w-[calc(100%-1rem)] gap-2.5 rounded-md px-2.5 py-2.5 text-left", activeId === c.id ? "bg-muted" : "hover:bg-accent/60")}>
                  <Avatar name={c.name} hue={c.hue} platform={c.platform} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("truncate", c.unread ? "font-semibold" : "font-medium")}>{c.name}</span>
                      <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{c.time}</span>
                    </div>
                    <p className={cn("truncate text-[12px]", c.unread ? "text-foreground" : "text-muted-foreground")}>{c.preview}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {c.tag && <TagPill tag={c.tag} />}
                      {c.suggested && <TagPill tag={c.suggested} suggested onClick={() => setTag(c.id, c.suggested ?? "Hot lead")} />}
                      {c.unread && <span className="ml-auto h-2 w-2 rounded-full bg-unread" />}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Thread */}
      <main className="thread-pane flex min-w-0 flex-1 flex-col bg-card">
        <header className="thread-header flex items-center gap-3 border-b px-5 py-3">
          <IconBtn title="Back to conversations" onClick={() => setMobileThread(false)}><ArrowLeft className="mobile-back" /></IconBtn>
          <Avatar name={active.name} hue={active.hue} size={32} platform={active.platform} />
          <div className="min-w-0">
            <div className="font-semibold">{active.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{active.participants.join(", ")}</div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="outline" size="sm" className="pause-control" onClick={() => snooze(active.id)}><Pause /> Pause</Button>
            <IconBtn title="Remind me" onClick={() => snooze(active.id)}><Clock className="h-4 w-4" /></IconBtn>
            <IconBtn title="Archive (E)" onClick={() => archive(active.id)}><Archive className="h-4 w-4" /></IconBtn>
            <IconBtn title="Search" onClick={() => setSwitcher(true)}><Search className="h-4 w-4" /></IconBtn>
            <IconBtn title="Details" onClick={() => setDetailsOpen(v => !v)}><Info className="h-4 w-4" /></IconBtn>
            <IconBtn title="More"><MoreHorizontal className="h-4 w-4" /></IconBtn>
          </div>
        </header>
        <div className="message-stream flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="text-center text-[11px] text-muted-foreground">Today</div>
          {active.messages.map((m, i) => {
            const grouped = i > 0 && active.messages[i - 1]?.from === m.from;
            const member = MEMBERS.find((x) => x.name === m.from);
            return (
              <div key={m.id} className={cn("flex gap-3", grouped && "-mt-3", m.me && "flex-row-reverse")}>
                <div className="w-9">{!grouped && <Avatar name={m.from} hue={m.me ? 45 : member?.hue ?? active.hue} />}</div>
                <div className={cn("message-content", m.me && "text-right")}>
                  {!grouped && <div className="mb-0.5 flex items-baseline gap-2"><span className="font-semibold">{m.from}</span><span className="text-[11px] text-muted-foreground">{m.time}</span></div>}
                  <div className={cn("message-bubble inline-block px-3.5 py-2 text-left leading-relaxed", m.me ? "outgoing-bubble" : "bg-muted")}>{m.text}</div>
                  {m.card === "promo" && (
                    <div className="link-preview mt-2 overflow-hidden rounded-lg border">
                      <div className="promo-preview flex h-28 items-center justify-center text-2xl font-semibold">quicker.chat</div>
                      <div className="p-3"><div className="font-semibold">Quicker Chat — every DM, one inbox</div><div className="text-[12px] text-muted-foreground">quicker.chat · Slack, LinkedIn, WhatsApp, X & iMessage</div></div>
                    </div>
                  )}
                  {m.card === "beehiiv" && (
                    <div className="link-preview mt-2 flex items-center gap-3 rounded-lg border p-3">
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
        <div className="composer-area px-5 py-3">
          <div className="composer-box rounded-lg border bg-card p-2.5 focus-within:ring-2 focus-within:ring-ring/40">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                rows={3}
                aria-label="Message"
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

              <span className="ml-auto" />
              <Button variant="ghost" onClick={() => send(input || (showDraft ? active.draft : ""))} className="ml-2 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:bg-primary/90">
                <Send className="h-3.5 w-3.5" /> Send
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Inspector */}
      <aside className="inspector-pane flex shrink-0 flex-col overflow-y-auto border-l bg-pane">
        <div className="contact-heading flex items-center gap-2 px-4 py-3">
          <Avatar name={active.name} hue={active.hue} size={28} />
          <span className="min-w-0 flex-1 truncate font-semibold">{active.name}</span>
          <IconBtn title="Contact options" onClick={() => toast("Contact details are read-only in this preview")}><MoreHorizontal /></IconBtn>
        </div>
        <div className="contact-attributes">
          <div><Hash /><span>Channel</span><strong>{PLATFORMS.find(p => p.id === active.platform)?.label}</strong></div>
          <div><User /><span>Contact</span><strong>{active.participants[0]}</strong></div>
          <div><Globe /><span>Workspace</span><strong>Nestamedia Studios</strong></div>
          <div><Clock /><span>Last activity</span><strong>{active.time}</strong></div>
        </div>
        <div className="contact-notes px-4 pb-4">
          <label htmlFor="contact-note" className="mb-2 block text-xs text-muted-foreground">Notes</label>
          <textarea id="contact-note" key={active.id} placeholder="Write a note …" className="w-full resize-none rounded-md border bg-muted/40 p-3 text-xs outline-none focus:border-ring" rows={3} />
          <div className="flex gap-1"><IconBtn title="Note attachment"><Paperclip /></IconBtn><IconBtn title="Note emoji"><Smile /></IconBtn></div>
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
            {TAGS.slice(0, 4).map((t) => <Button variant="ghost" key={t.id} onClick={() => setTag(active.id, t.id)}><TagPill tag={t.id} /></Button>)}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <Button variant="ghost" onClick={() => snooze(active.id)} className="rounded-md border bg-card py-1.5 hover:bg-accent">Remind me</Button>
            <Button variant="ghost" onClick={() => archive(active.id)} className="rounded-md border bg-card py-1.5 hover:bg-accent">Archive</Button>
          </div>
        </Section>
      </aside>

      {switcher && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 pt-28" onClick={() => setSwitcher(false)}>
          <div className="w-[520px] overflow-hidden rounded-xl border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b px-4 py-3"><Search className="h-4 w-4 text-muted-foreground" /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Jump to a conversation…" className="flex-1 bg-transparent text-sm outline-none" /><Button variant="ghost" onClick={() => setSwitcher(false)}><XIcon className="h-4 w-4" /></Button></div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {convos.filter((c) => (c.name + c.preview).toLowerCase().includes(query.toLowerCase())).map((c) => (
                <Button variant="ghost" key={c.id} onClick={() => { open(c.id); setSwitcher(false); setQuery(""); }} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-accent">
                  <Avatar name={c.name} hue={c.hue} size={28} platform={c.platform} /><div className="min-w-0"><div className="font-medium">{c.name}</div><div className="truncate text-[12px] text-muted-foreground">{c.preview}</div></div>
                </Button>
              ))}
            </div>
            <div className="flex gap-3 border-t px-4 py-2 text-[11px] text-muted-foreground"><span><Kbd>J</Kbd>/<Kbd>K</Kbd> navigate</span><span><Kbd>E</Kbd> archive</span><span><Kbd>Tab</Kbd> accept draft</span><span><Kbd>⌘Z</Kbd> undo send</span></div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

function RailItem({ icon, label, count, active, onClick, accent, muted }: { icon: React.ReactNode; label: string; count?: number | undefined; active?: boolean; onClick?: () => void; accent?: boolean; muted?: boolean }) {
  return (
    <Button variant="ghost" onClick={onClick} className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left", active ? "bg-card font-medium shadow-sm ring-1 ring-border" : "hover:bg-accent", muted && "text-muted-foreground")}>
      {icon}<span className="flex-1 truncate">{label}</span>
      {count != null && <span className={cn("rounded-full px-1.5 text-[11px]", accent ? "bg-unread text-primary-foreground" : "text-muted-foreground")}>{count}</span>}
    </Button>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 pb-1 pt-4 text-[11px] font-semibold section-caption text-muted-foreground">{children}</div>;
}
function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
  return <Button variant="ghost" aria-label={title} title={title} onClick={onClick} className="rounded-md p-1.5 hover:bg-accent">{children}</Button>;
}
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [openS, setOpen] = useState(true);
  return (
    <div className="border-b px-4 py-3">
      <Button variant="ghost" onClick={() => setOpen(!openS)} className="flex w-full items-center gap-1.5 text-[11px] font-semibold section-caption text-muted-foreground">
        {icon}{title}<ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition", !openS && "-rotate-90")} />
      </Button>
      {openS && <div className="mt-2 space-y-1.5">{children}</div>}
    </div>
  );
}
