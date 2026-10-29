import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { readBeeperConfig } from "@/providers";
import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Inbox, Bell, Clock, Archive, Settings, MessageSquareHeart, Plus, Search, Info, Hash, ChevronDown, Smile, List, Sparkles,
  Send, X as XIcon, Users, MessagesSquare, PanelLeft, ArrowLeft, Globe, User, Tag as TagIcon, AlertCircle, RotateCw, Mail,
} from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, Kbd, PlatformBadge, PLATFORM_META, TagPill, hueFrom, platformMeta } from "@/components/quicker/bits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PLATFORMS, type Chat, type Message, type Platform } from "@/providers";
import { reminderPreset } from "@/lib/organiser-store";
import { accountsQuery, chatsQuery, messagesQuery, useMarkRead, useOrganiser, useSendMessage } from "@/hooks/use-inbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inbox · BryteInbox" },
      { name: "description", content: "One calm inbox for iMessage, WhatsApp, LinkedIn, Instagram, Telegram, Slack and X." },
      { property: "og:title", content: "BryteInbox — one inbox for every DM" },
      { property: "og:description", content: "Tag, remind and reply across every messaging platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type View = "inbox" | "unread" | "reminders" | "archived";
type Filter = { kind: "platform"; id: Platform } | { kind: "tag"; id: string } | null;
type PendingSend = { id: string; chatId: string; text: string };

const UNDO_MS = 5000;

function formatTime(iso: string) {
  const d = new Date(iso);
  const days = Math.floor((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (days <= 0) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}
function startOfDay(d: Date) { const c = new Date(d); c.setHours(0, 0, 0, 0); return c.getTime(); }
function dayLabel(iso: string) {
  const days = Math.floor((startOfDay(new Date()) - startOfDay(new Date(iso))) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
}
const otherPeople = (c: Chat) => c.participants.filter((p) => !p.isSelf);

function App() {
  const navigate = useNavigate();
  useEffect(() => { if (!readBeeperConfig()) navigate({ to: "/welcome", replace: true }); }, [navigate]);
  const { state: org, store } = useOrganiser();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<View>("inbox");
  const [filter, setFilter] = useState<Filter>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [navigationCollapsed, setNavigationCollapsed] = useState(false);
  const [mobileThread, setMobileThread] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [contextDrawerOpen, setContextDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [switcher, setSwitcher] = useState(false);
  const [switcherQuery, setSwitcherQuery] = useState("");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<PendingSend[]>([]);
  const [dismissedDraft, setDismissedDraft] = useState<Record<string, boolean>>({});
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const sendMutation = useSendMessage();
  const markRead = useMarkRead();

  const accounts = useQuery(accountsQuery());
  const allChats = useQuery(chatsQuery());
  const listFilters = useMemo(() => ({
    ...(filter?.kind === "platform" ? { platforms: [filter.id] } : {}),
    ...(query.trim() ? { search: query.trim() } : {}),
  }), [filter, query]);
  const chats = useQuery({ ...chatsQuery(listFilters), placeholderData: keepPreviousData });

  const tagsSorted = useMemo(() => [...org.tags].sort((a, b) => a.order - b.order), [org.tags]);
  const tagById = useMemo(() => new Map(org.tags.map((t) => [t.id, t])), [org.tags]);
  const archived = useMemo(() => new Set(org.archived), [org.archived]);

  const visible = useMemo(() => (chats.data ?? []).filter((c) => {
    if (view === "archived") return archived.has(c.id);
    if (archived.has(c.id)) return false;
    if (view === "unread" && c.unreadCount === 0) return false;
    if (view === "reminders" && !org.reminders[c.id]) return false;
    if (filter?.kind === "tag" && !(org.chatTags[c.id] ?? []).includes(filter.id)) return false;
    return true;
  }), [chats.data, view, filter, archived, org.reminders, org.chatTags]);

  const all = allChats.data ?? [];
  const active = all.find((c) => c.id === activeId) ?? null;

  // Pick the first chat once the list arrives.
  useEffect(() => { if (!activeId && visible[0]) setActiveId(visible[0].id); }, [activeId, visible]);

  const messages = useQuery({ ...messagesQuery(active?.id ?? ""), enabled: !!active });

  const activeTags = active ? (org.chatTags[active.id] ?? []).map((id) => tagById.get(id)).filter((t) => !!t) : [];
  const draftsOn = activeTags.some((t) => t.aiDrafts);
  const suggestion = active ? `Thanks ${otherPeople(active)[0]?.name.split(" ")[0] ?? "there"} — let me get back to you shortly.` : "";
  const showSuggestion = !!active && draftsOn && !dismissedDraft[active.id] && !input;

  const open = (id: string) => {
    setActiveId(id);
    setMobileThread(true);
    const c = all.find((x) => x.id === id);
    if (c && c.unreadCount > 0) markRead.mutate(id, { onError: () => toast.error("Couldn't mark as read") });
  };

  const send = (text: string) => {
    if (!active || !text.trim()) return;
    const p: PendingSend = { id: crypto.randomUUID(), chatId: active.id, text: text.trim() };
    setPending((ps) => [...ps, p]);
    setInput("");
    const timer = setTimeout(() => {
      timers.current.delete(p.id);
      sendMutation.mutate({ chatId: p.chatId, text: p.text }, {
        onSettled: () => setPending((ps) => ps.filter((x) => x.id !== p.id)),
        onError: (e) => toast.error("Message not sent", { description: e instanceof Error ? e.message : "Try again." }),
      });
    }, UNDO_MS);
    timers.current.set(p.id, timer);
    toast("Sending in 5 seconds", { description: "⌘Z to undo", duration: UNDO_MS, action: { label: "Undo", onClick: () => undoSend(p.id) } });
  };

  const undoSend = (id?: string) => {
    const target = id ?? [...timers.current.keys()].pop();
    if (!target) return;
    const t = timers.current.get(target);
    if (!t) return;
    clearTimeout(t);
    timers.current.delete(target);
    const p = pending.find((x) => x.id === target);
    setPending((ps) => ps.filter((x) => x.id !== target));
    if (p) setInput(p.text);
    toast("Send undone");
  };

  const archive = (id: string) => {
    if (store.isArchived(id)) { store.unarchive(id); toast("Moved back to inbox"); return; }
    store.archive(id);
    toast("Conversation archived", { action: { label: "Undo", onClick: () => store.unarchive(id) } });
  };
  const remind = (id: string, at: Date) => {
    store.setReminder(id, at);
    toast(`Reminder set for ${at.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}`);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === "TEXTAREA" || el.tagName === "INPUT";
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSwitcher((s) => !s); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !typing) { e.preventDefault(); undoSend(); return; }
      if (e.key === "Escape") { setSwitcher(false); setNavigationOpen(false); }
      if (typing || e.metaKey || e.ctrlKey) return;
      if (e.key === "j" || e.key === "k") {
        const i = visible.findIndex((c) => c.id === activeId);
        const next = visible[Math.max(0, Math.min(visible.length - 1, i + (e.key === "j" ? 1 : -1)))];
        if (next) setActiveId(next.id);
      }
      if (e.key === "Enter" && activeId) open(activeId);
      if (e.key === "r") { e.preventDefault(); inputRef.current?.focus(); }
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "e" && activeId) archive(activeId);
      if (e.key === "h" && activeId) remind(activeId, reminderPreset("tomorrow"));
      if (e.key === "t" && activeId) setTagMenuOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const unreadOf = (ids: (c: Chat) => boolean) => all.filter((c) => !archived.has(c.id) && c.unreadCount > 0 && ids(c)).length;
  const navItems: { id: View; label: string; icon: typeof Inbox; count?: number | undefined }[] = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: unreadOf(() => true) },
    { id: "unread", label: "Unread", icon: Mail },
    { id: "reminders", label: "Reminders", icon: Clock, count: Object.keys(org.reminders).length || undefined },
    { id: "archived", label: "Archived", icon: Archive },
  ];
  const connectedPlatforms = PLATFORMS.filter((p) => !accounts.data || accounts.data.some((a) => a.platform === p));

  const groups = useMemo(() => {
    const out: { g: string; items: Chat[] }[] = [];
    for (const c of visible) {
      const d = dayLabel(c.updatedAt);
      const g = d === "Today" || d === "Yesterday" ? d : "Earlier";
      const last = out[out.length - 1];
      if (last && last.g === g) last.items.push(c); else out.push({ g, items: [c] });
    }
    return out;
  }, [visible]);

  const heading = filter
    ? (filter.kind === "platform" ? PLATFORM_META[filter.id].label : tagById.get(filter.id)?.name)
    : navItems.find((n) => n.id === view)?.label;

  const thread = useMemo(() => {
    const msgs: (Message & { pending?: boolean })[] = [...(messages.data?.messages ?? [])];
    for (const p of pending) if (p.chatId === active?.id) msgs.push({ id: p.id, chatId: p.chatId, senderId: "me", text: p.text, sentAt: new Date().toISOString(), isFromMe: true, pending: true });
    return msgs;
  }, [messages.data, pending, active?.id]);

  const renderCustomerContext = (c: Chat) => {
    const people = otherPeople(c);
    const reminder = org.reminders[c.id];
    const account = accounts.data?.find((a) => a.id === c.accountId);
    return (<>
      <div className="contact-heading flex items-center gap-2 px-4 py-3">
        <Avatar name={c.title} hue={hueFrom(c.id)} size={28} />
        <span className="min-w-0 flex-1 truncate font-semibold">{c.title}</span>
        <Button variant="ghost" size="sm" aria-label="Close customer details" title="Close customer details" onClick={() => { setDetailsOpen(false); setContextDrawerOpen(false); }}><XIcon /> Close</Button>
      </div>
      <div className="context-key-actions grid grid-cols-2 gap-2 border-b p-3">
        <RemindMenu onPick={(d) => remind(c.id, d)} trigger={<Button variant="outline" size="sm"><Clock /> Remind me</Button>} />
        <Button variant="outline" size="sm" onClick={() => archive(c.id)}><Archive /> {archived.has(c.id) ? "Unarchive" : "Archive"}</Button>
      </div>
      <div className="context-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="contact-attributes">
          <div><Hash /><span>Channel</span><strong className="inline-flex items-center gap-1.5"><PlatformBadge p={c.platform} size={14} className="ring-0" focusable />{platformMeta(c.platform).label}</strong></div>
          <div><User /><span>Contact</span><strong>{c.isGroup ? `${people.length} people` : people[0]?.name}</strong></div>
          <div><Globe /><span>Account</span><strong>{account?.handle ?? "—"}</strong></div>
          <div><Clock /><span>Last activity</span><strong>{formatTime(c.updatedAt)}</strong></div>
          {reminder && <div><Bell /><span>Reminder</span><strong>{new Date(reminder.remindAt).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}</strong></div>}
        </div>
        {reminder && <div className="px-4 pb-3"><Button variant="ghost" size="sm" onClick={() => { store.clearReminder(c.id); toast("Reminder cleared"); }}>Clear reminder</Button></div>}
        <Section title="Tags" icon={<TagIcon className="h-3.5 w-3.5" />}>
          <div className="flex flex-wrap gap-1.5">
            {tagsSorted.map((t) => {
              const on = (org.chatTags[c.id] ?? []).includes(t.id);
              return <Button variant="ghost" size="sm" key={t.id} aria-pressed={on} className={cn(!on && "opacity-50")} onClick={() => store.toggleChatTag(c.id, t.id)}><TagPill name={t.name} color={t.color} /></Button>;
            })}
          </div>
        </Section>
        <Section title={c.isGroup ? "Members" : "Contact"} icon={<Users className="h-3.5 w-3.5" />}>
          {people.map((m) => (
            <div key={m.id} className="flex items-center gap-2.5 py-1"><Avatar name={m.name} hue={hueFrom(m.id)} size={26} /><div className="font-medium">{m.name}</div></div>
          ))}
        </Section>
      </div>
    </>);
  };

  return (
    <div className="workspace-canvas">
    <div className={cn("chat-workspace", navigationOpen && "navigation-open", mobileThread && "mobile-thread-open", !detailsOpen && "details-hidden", navigationCollapsed && "navigation-collapsed")}>
      <aside className="icon-rail" aria-label="Main navigation">
        <div className="rail-brand"><MessagesSquare size={19} /></div>
        <RailTip label="Toggle navigation"><Button variant="ghost" aria-label="Toggle navigation" aria-expanded={navigationOpen || !navigationCollapsed} onClick={() => { if (window.matchMedia("(max-width: 900px)").matches) setNavigationOpen((v) => !v); else setNavigationCollapsed((v) => !v); }}><PanelLeft /></Button></RailTip>
        <IconBtn title="Search conversations" active={switcher} onClick={() => setSwitcher(true)}><Search /></IconBtn>
        {navItems.map((n) => (
          <IconBtn key={n.id} title={n.label} active={view === n.id && !filter} onClick={() => { setView(n.id); setFilter(null); setMobileThread(false); setNavigationOpen(false); }}><n.icon /></IconBtn>
        ))}
        <div className="mt-auto" />
        <RailTip label="Settings"><Button asChild variant="ghost" size="icon" aria-label="Settings"><Link to="/settings"><Settings /></Link></Button></RailTip>
      </aside>

      <aside className="navigation-pane flex shrink-0 flex-col border-r bg-rail px-2.5 py-3">
        <div className="navigation-title">BryteInbox <IconBtn title="Collapse navigation" onClick={() => { setNavigationOpen(false); setNavigationCollapsed(true); }}><PanelLeft /></IconBtn></div>
        <Button variant="ghost" onClick={() => setSwitcher(true)} className="mb-3 flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-muted-foreground">
          <Search className="h-3.5 w-3.5" /> Search chat <span className="ml-auto"><Kbd>⌘K</Kbd></span>
        </Button>
        <nav className="space-y-0.5 overflow-y-auto">
          {navItems.map((n) => (
            <RailItem key={n.id} active={view === n.id && !filter} onClick={() => { setView(n.id); setFilter(null); }} icon={<n.icon className="h-4 w-4" />} label={n.label} count={n.count} accent={n.id === "inbox"} />
          ))}
          <SectionLabel>Platforms</SectionLabel>
          {connectedPlatforms.map((p) => (
            <RailItem key={p} active={filter?.kind === "platform" && filter.id === p} onClick={() => { setView("inbox"); setFilter({ kind: "platform", id: p }); }} icon={<PlatformBadge p={p} size={16} className="ring-0" decorative />} label={PLATFORM_META[p].label} count={unreadOf((c) => c.platform === p) || undefined} />
          ))}
          <SectionLabel>Tags</SectionLabel>
          {tagsSorted.map((t) => (
            <div key={t.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { const id = e.dataTransfer.getData("text/chat-id"); if (id && !store.tagsFor(id).includes(t.id)) { store.toggleChatTag(id, t.id); toast(`Tagged ${t.name}`); } }}>
              <RailItem active={filter?.kind === "tag" && filter.id === t.id} onClick={() => { setView("inbox"); setFilter({ kind: "tag", id: t.id }); }} icon={<span className="mx-1 h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />} label={t.name} count={unreadOf((c) => (org.chatTags[c.id] ?? []).includes(t.id)) || undefined} />
            </div>
          ))}
          <RailItem onClick={() => { const name = window.prompt("New tag name"); if (name?.trim()) { store.createTag(name, "#6366F1"); toast(`Tag “${name.trim()}” created`); } }} icon={<Plus className="h-4 w-4" />} label="New tag" muted />
        </nav>
        <div className="mt-auto space-y-0.5 border-t pt-2">
          <Link to="/settings" className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-accent"><Settings className="h-4 w-4" /> Settings</Link>
          <RailItem onClick={() => toast("Thanks for the feedback!")} icon={<MessageSquareHeart className="h-4 w-4" />} label="Send Feedback" />
        </div>
      </aside>

      <section className="conversation-pane flex shrink-0 flex-col border-r bg-pane">
        <header className="list-header flex items-center gap-2 px-4 pb-2 pt-4">
          <h1 className="min-w-0 truncate text-sm font-semibold leading-none">{heading}</h1>
          {chats.isFetching && !chats.isPending && <RotateCw className="ml-auto h-3.5 w-3.5 animate-spin text-muted-foreground" aria-label="Refreshing" />}
        </header>
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search all chats…  /" aria-label="Search all chats" className="flex-1 bg-transparent outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-4" aria-busy={chats.isPending}>
          {chats.isPending ? (
            <div className="space-y-1 px-2 pt-2" aria-label="Loading conversations">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="flex gap-2.5 px-2.5 py-2.5"><Skeleton className="h-9 w-9 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-4/5" /></div></div>
              ))}
            </div>
          ) : chats.isError ? (
            <ErrorState title="Couldn't load conversations" error={chats.error} onRetry={() => chats.refetch()} />
          ) : groups.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">{query ? `No chats match “${query}”.` : "Nothing here. Inbox zero ✨"}</p>
          ) : groups.map(({ g, items }) => (
            <div key={g}>
              <div className="px-4 pb-1 pt-3 text-xs font-semibold section-caption text-muted-foreground">{g}</div>
              {items.map((c) => {
                const tags = (org.chatTags[c.id] ?? []).map((id) => tagById.get(id)).filter((t) => !!t);
                const unread = c.unreadCount > 0;
                const preview = c.lastMessage ? `${c.lastMessage.isFromMe ? "You: " : ""}${c.lastMessage.text}` : "";
                return (
                  <Button variant="ghost" key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/chat-id", c.id)} onClick={() => open(c.id)} className={cn("conversation-row mx-2 flex w-[calc(100%-1rem)] gap-2.5 rounded-md px-2.5 py-2.5 text-left", activeId === c.id ? "bg-muted" : "hover:bg-accent/60")}>
                    <Avatar name={c.title} hue={hueFrom(c.id)} platform={c.platform} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("truncate", unread ? "font-semibold" : "font-medium")}>{c.title}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{formatTime(c.updatedAt)}</span>
                      </div>
                      <p className={cn("truncate text-sm", unread ? "text-foreground" : "text-muted-foreground")}>{preview}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        {tags.map((t) => <TagPill key={t.id} name={t.name} color={t.color} />)}
                        {org.reminders[c.id] && <Bell className="h-3 w-3 text-muted-foreground" aria-label="Reminder set" />}
                        {unread && <span className="ml-auto h-2 w-2 rounded-full bg-unread" aria-label={`${c.unreadCount} unread`} />}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <main className="thread-pane flex min-w-0 flex-1 flex-col bg-card">
        {!active ? (
          <div className="flex flex-1 items-center justify-center p-6 text-muted-foreground">
            {allChats.isError ? <ErrorState title="Couldn't load this chat" error={allChats.error} onRetry={() => allChats.refetch()} /> : allChats.isPending ? <Skeleton className="h-4 w-40" /> : "Select a conversation"}
          </div>
        ) : (<>
        <header className="thread-header border-b">
          <div className="thread-identity flex min-w-0 items-center gap-2">
            <IconBtn title="Back to conversations" onClick={() => setMobileThread(false)}><ArrowLeft className="mobile-back" /></IconBtn>
            <Avatar name={active.title} hue={hueFrom(active.id)} size={32} platform={active.platform} />
            <div className="min-w-0">
              <div className="truncate font-semibold">{active.title}</div>
              <div className="truncate text-xs text-muted-foreground">{otherPeople(active).map((p) => p.name).join(", ")}</div>
            </div>
          </div>
          <div className="thread-actions flex shrink-0 items-center gap-1">
            <TagMenu chat={active} tags={tagsSorted} selected={org.chatTags[active.id] ?? []} onToggle={(id) => store.toggleChatTag(active.id, id)} open={tagMenuOpen} onOpenChange={setTagMenuOpen} />
            <RemindMenu onPick={(d) => remind(active.id, d)} trigger={<Button variant="ghost" aria-label="Remind me (H)" title="Remind me (H)"><Clock className="h-4 w-4" /></Button>} />
            <IconBtn title={archived.has(active.id) ? "Unarchive (E)" : "Archive (E)"} onClick={() => archive(active.id)}><Archive className="h-4 w-4" /></IconBtn>
            <Button id="customer-context-toggle" variant="ghost" aria-label="Customer details" title="Open or close customer details" aria-controls={contextDrawerOpen ? "customer-context-drawer" : "customer-context"} onClick={() => { if (window.matchMedia("(max-width: 1199px)").matches) setContextDrawerOpen(true); else setDetailsOpen((v) => !v); }}><Info className="h-4 w-4" /></Button>
          </div>
        </header>
        <div className="message-stream flex-1 space-y-5 overflow-y-auto px-6 py-5" aria-busy={messages.isPending}>
          {messages.isPending ? (
            <div className="space-y-4" aria-label="Loading messages">
              {[60, 40, 70, 35].map((w, i) => <div key={i} className={cn("flex", i % 2 && "justify-end")}><Skeleton className="h-10 rounded-2xl" style={{ width: `${w}%` }} /></div>)}
            </div>
          ) : messages.isError ? (
            <ErrorState title="Couldn't load messages" error={messages.error} onRetry={() => messages.refetch()} />
          ) : thread.map((m, i) => {
            const prev = thread[i - 1];
            const newDay = !prev || dayLabel(prev.sentAt) !== dayLabel(m.sentAt);
            const grouped = !newDay && prev?.senderId === m.senderId;
            const sender = active.participants.find((p) => p.id === m.senderId);
            const name = m.isFromMe ? "You" : sender?.name ?? "Unknown";
            return (
              <div key={m.id}>
                {newDay && <div className="pb-4 text-center text-xs text-muted-foreground">{dayLabel(m.sentAt)}</div>}
                <div className={cn("flex gap-3", grouped && "-mt-3", m.isFromMe && "flex-row-reverse")}>
                  <div className="w-9">{!grouped && <Avatar name={name} hue={m.isFromMe ? 45 : hueFrom(m.senderId)} />}</div>
                  <div className={cn("message-content", m.isFromMe && "text-right")}>
                    {!grouped && <div className="mb-0.5 flex items-baseline gap-2"><span className="font-semibold">{name}</span><span className="text-xs text-muted-foreground">{formatTime(m.sentAt)}</span></div>}
                    <div className={cn("message-bubble inline-block px-3.5 py-2 text-left leading-relaxed", m.isFromMe ? "outgoing-bubble" : "bg-muted", m.pending && "opacity-60")}>{m.text}</div>
                    {m.pending && <div className="mt-1 text-xs text-muted-foreground">Sending… <button type="button" className="underline" onClick={() => undoSend(m.id)}>Undo</button></div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="composer-area px-5 py-3">
          {showSuggestion && (
            <div className="mb-2 rounded-lg border border-dashed bg-muted/50 p-3 text-muted-foreground">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold"><Sparkles className="h-3.5 w-3.5" /> Suggested reply</div>
              <p className="text-sm">{suggestion}</p>
              <div className="mt-2 flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setInput(suggestion)}>Use</Button>
                <Button variant="ghost" size="sm" onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => setDismissedDraft((d) => ({ ...d, [active.id]: true }))}>Dismiss</Button>
              </div>
            </div>
          )}
          <div className="composer-box rounded-lg border bg-card p-2.5 focus-within:ring-2 focus-within:ring-ring/40">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              rows={3}
              aria-label="Message"
              placeholder={`Message ${active.title}`}
              className="w-full resize-none bg-transparent px-1 outline-none"
            />
            <div className="mt-1 flex items-center gap-1 text-muted-foreground">
              <IconBtn title="Emoji" onClick={() => setInput((v) => v + "🙂")}><Smile className="h-4 w-4" /></IconBtn>
              <IconBtn title="Bullets" onClick={() => setInput((v) => v + "\n• ")}><List className="h-4 w-4" /></IconBtn>
              <span className="ml-auto" />
              <Button variant="ghost" disabled={!input.trim()} onClick={() => send(input)} className="ml-2 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:bg-primary/90">
                <Send className="h-3.5 w-3.5" /> Send
              </Button>
            </div>
          </div>
        </div>
        </>)}
      </main>

      <aside id="customer-context" aria-label="Customer context" className="inspector-pane flex shrink-0 flex-col border-l bg-pane">
        {active && renderCustomerContext(active)}
      </aside>

      <Sheet open={contextDrawerOpen} onOpenChange={setContextDrawerOpen}>
        <SheetContent id="customer-context-drawer" className="customer-context-drawer" overlayClassName="customer-context-backdrop" aria-describedby={undefined} onCloseAutoFocus={(e) => { e.preventDefault(); document.getElementById("customer-context-toggle")?.focus(); }}>
          <SheetTitle className="sr-only">Customer details</SheetTitle>
          {active && renderCustomerContext(active)}
        </SheetContent>
      </Sheet>

      {switcher && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 pt-28" onClick={() => setSwitcher(false)}>
          <div className="w-[520px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b px-4 py-3"><Search className="h-4 w-4 text-muted-foreground" /><input autoFocus value={switcherQuery} onChange={(e) => setSwitcherQuery(e.target.value)} placeholder="Jump to a conversation…" className="flex-1 bg-transparent text-sm outline-none" /><Button variant="ghost" onClick={() => setSwitcher(false)}><XIcon className="h-4 w-4" /></Button></div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {all.filter((c) => (c.title + (c.lastMessage?.text ?? "")).toLowerCase().includes(switcherQuery.toLowerCase())).map((c) => (
                <Button variant="ghost" key={c.id} onClick={() => { open(c.id); setSwitcher(false); setSwitcherQuery(""); }} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-accent">
                  <Avatar name={c.title} hue={hueFrom(c.id)} size={28} platform={c.platform} /><div className="min-w-0"><div className="truncate font-medium">{c.title}</div><div className="truncate text-sm text-muted-foreground">{c.lastMessage?.text}</div></div>
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 border-t px-4 py-2 text-xs text-muted-foreground"><span><Kbd>J</Kbd>/<Kbd>K</Kbd> navigate</span><span><Kbd>R</Kbd> reply</span><span><Kbd>E</Kbd> archive</span><span><Kbd>H</Kbd> remind</span><span><Kbd>T</Kbd> tag</span><span><Kbd>/</Kbd> search</span><span><Kbd>⌘Z</Kbd> undo send</span></div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

function ErrorState({ title, error, onRetry }: { title: string; error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 p-6 text-center">
      <AlertCircle className="h-5 w-5 text-destructive" />
      <div className="font-medium">{title}</div>
      <div className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Something went wrong."}</div>
      <Button variant="outline" size="sm" onClick={onRetry}><RotateCw /> Try again</Button>
    </div>
  );
}

function RemindMenu({ trigger, onPick }: { trigger: React.ReactElement; onPick: (d: Date) => void }) {
  const [custom, setCustom] = useState("");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Remind me</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onPick(reminderPreset("later-today"))}>Later today</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onPick(reminderPreset("tomorrow"))}>Tomorrow</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onPick(reminderPreset("next-week"))}>Next week</DropdownMenuItem>
        <DropdownMenuSeparator />
        <form className="flex gap-1 p-1.5" onSubmit={(e) => { e.preventDefault(); if (custom) onPick(new Date(custom)); }} onKeyDown={(e) => e.stopPropagation()}>
          <input type="datetime-local" aria-label="Custom reminder time" value={custom} onChange={(e) => setCustom(e.target.value)} className="min-w-0 flex-1 rounded border bg-card px-1.5 text-xs" />
          <Button type="submit" size="sm" variant="outline" disabled={!custom}>Set</Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TagMenu({ chat, tags, selected, onToggle, open, onOpenChange }: { chat: Chat; tags: { id: string; name: string; color: string }[]; selected: string[]; onToggle: (id: string) => void; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild><Button variant="ghost" aria-label={`Tag ${chat.title} (T)`} title="Tag (T)"><TagIcon className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Tags</DropdownMenuLabel>
        {tags.map((t) => (
          <DropdownMenuCheckboxItem key={t.id} checked={selected.includes(t.id)} onSelect={(e) => { e.preventDefault(); onToggle(t.id); }}>
            <span className="mr-2 h-2 w-2 rounded-full" style={{ background: t.color }} />{t.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RailItem({ icon, label, count, active, onClick, accent, muted }: { icon: React.ReactNode; label: string; count?: number | undefined; active?: boolean; onClick?: () => void; accent?: boolean; muted?: boolean }) {
  return (
    <Button variant="ghost" onClick={onClick} className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left", active ? "bg-card font-medium shadow-sm ring-1 ring-border" : "hover:bg-accent", muted && "text-muted-foreground")}>
      {icon}<span className="flex-1 truncate">{label}</span>
      {count != null && <span className={cn("rounded-full px-1.5 text-xs", accent ? "bg-unread text-primary-foreground" : "text-muted-foreground")}>{count}</span>}
    </Button>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 pb-1 pt-4 text-xs font-semibold section-caption text-muted-foreground">{children}</div>;
}
function IconBtn({ children, onClick, title, active }: { children: React.ReactNode; onClick?: () => void; title?: string; active?: boolean }) {
  return <RailTip label={title ?? ""}><Button variant="ghost" aria-label={title} aria-current={active ? "page" : undefined} onClick={onClick} className={cn("rounded-md p-1.5 hover:bg-accent", active && "rail-icon-active")}>{children}</Button></RailTip>;
}
function RailTip({ label, children }: { label: string; children: React.ReactElement }) {
  return <Tooltip><TooltipTrigger asChild>{children}</TooltipTrigger><TooltipContent side="right" sideOffset={8}>{label}</TooltipContent></Tooltip>;
}
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [openS, setOpen] = useState(true);
  return (
    <div className="border-b px-4 py-3">
      <Button variant="ghost" onClick={() => setOpen(!openS)} className="flex w-full items-center gap-1.5 text-xs font-semibold section-caption text-muted-foreground">
        {icon}{title}<ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition", !openS && "-rotate-90")} />
      </Button>
      {openS && <div className="mt-2 space-y-1.5">{children}</div>}
    </div>
  );
}
