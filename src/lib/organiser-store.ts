// Local organiser state (tags, reminders, archive). Stored in localStorage behind
// this module so it can move to a database later without touching components.

export type Tag = { id: string; name: string; color: string; order: number; aiDrafts: boolean };
export type Reminder = { chatId: string; remindAt: string };

export type OrganiserState = {
  tags: Tag[];
  chatTags: Record<string, string[]>; // chatId -> tagIds
  reminders: Record<string, Reminder>; // chatId -> reminder
  archived: string[]; // chatIds
};

const KEY = "brytechat.organiser.v1";

const DEFAULT_TAGS: Tag[] = [
  { id: "leads", name: "Leads", color: "#F59E0B", order: 0, aiDrafts: false },
  { id: "clients", name: "Clients", color: "#3B82F6", order: 1, aiDrafts: false },
  { id: "team", name: "Team", color: "#10B981", order: 2, aiDrafts: false },
  { id: "personal", name: "Personal", color: "#EC4899", order: 3, aiDrafts: false },
  { id: "noise", name: "Noise", color: "#9CA3AF", order: 4, aiDrafts: false },
];

const empty = (): OrganiserState => ({ tags: DEFAULT_TAGS.map((t) => ({ ...t })), chatTags: {}, reminders: {}, archived: [] });

type Listener = (s: OrganiserState) => void;

export class OrganiserStore {
  private state: OrganiserState;
  private listeners = new Set<Listener>();

  constructor(private storage: Storage | null = typeof window !== "undefined" ? window.localStorage : null) {
    this.state = this.load();
  }

  getState() {
    return this.state;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // Tags
  createTag(name: string, color: string) {
    const clean = name.trim();
    if (!clean) throw new Error("Tag name is required");
    const tag: Tag = { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, name: clean, color, order: this.state.tags.length, aiDrafts: false };
    this.set({ tags: [...this.state.tags, tag] });
    return tag;
  }
  updateTag(id: string, patch: Partial<Pick<Tag, "name" | "color" | "aiDrafts">>) {
    this.set({ tags: this.state.tags.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  }
  deleteTag(id: string) {
    const chatTags = Object.fromEntries(Object.entries(this.state.chatTags).map(([c, ids]) => [c, ids.filter((t) => t !== id)]));
    this.set({ tags: this.reindex(this.state.tags.filter((t) => t.id !== id)), chatTags });
  }
  reorderTags(orderedIds: string[]) {
    const byId = new Map(this.state.tags.map((t) => [t.id, t]));
    const ordered = orderedIds.map((id) => byId.get(id)).filter((t): t is Tag => !!t);
    const rest = this.state.tags.filter((t) => !orderedIds.includes(t.id));
    this.set({ tags: this.reindex([...ordered, ...rest]) });
  }
  sortedTags() {
    return [...this.state.tags].sort((a, b) => a.order - b.order);
  }

  // Chat tagging
  tagsFor(chatId: string) {
    return this.state.chatTags[chatId] ?? [];
  }
  setChatTags(chatId: string, tagIds: string[]) {
    this.set({ chatTags: { ...this.state.chatTags, [chatId]: [...new Set(tagIds)] } });
  }
  toggleChatTag(chatId: string, tagId: string) {
    const cur = this.tagsFor(chatId);
    this.setChatTags(chatId, cur.includes(tagId) ? cur.filter((t) => t !== tagId) : [...cur, tagId]);
  }
  chatsWithTag(tagId: string) {
    return Object.keys(this.state.chatTags).filter((c) => (this.state.chatTags[c] ?? []).includes(tagId));
  }

  // Reminders
  setReminder(chatId: string, remindAt: Date) {
    this.set({ reminders: { ...this.state.reminders, [chatId]: { chatId, remindAt: remindAt.toISOString() } } });
  }
  clearReminder(chatId: string) {
    const { [chatId]: _, ...rest } = this.state.reminders;
    this.set({ reminders: rest });
  }

  // Archive
  isArchived(chatId: string) {
    return this.state.archived.includes(chatId);
  }
  archive(chatId: string) {
    if (!this.isArchived(chatId)) this.set({ archived: [...this.state.archived, chatId] });
  }
  unarchive(chatId: string) {
    this.set({ archived: this.state.archived.filter((c) => c !== chatId) });
  }

  private reindex(tags: Tag[]) {
    return tags.map((t, i) => ({ ...t, order: i }));
  }
  private set(patch: Partial<OrganiserState>) {
    this.state = { ...this.state, ...patch };
    this.storage?.setItem(KEY, JSON.stringify(this.state));
    this.listeners.forEach((l) => l(this.state));
  }
  private load(): OrganiserState {
    try {
      const raw = this.storage?.getItem(KEY);
      if (raw) return { ...empty(), ...JSON.parse(raw) };
    } catch {
      /* corrupted storage: fall back to defaults */
    }
    return empty();
  }
}

/** Preset times for "Remind me". */
export function reminderPreset(preset: "later-today" | "tomorrow" | "next-week", now = new Date()) {
  const d = new Date(now);
  if (preset === "later-today") d.setHours(d.getHours() + 3, 0, 0, 0);
  if (preset === "tomorrow") { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); }
  if (preset === "next-week") { d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); d.setHours(9, 0, 0, 0); }
  return d;
}

export const organiserStore = new OrganiserStore();
