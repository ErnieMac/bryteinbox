import type { MessagingProvider } from "./MessagingProvider";
import type { Account, Chat, ChatFilters, Message, MessagePage, Participant, Platform } from "./types";

export type BeeperConfig = { baseUrl: string; token: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
const NETWORK_MAP: [RegExp, Platform][] = [
  [/imessage|apple/i, "imessage"],
  [/whatsapp/i, "whatsapp"],
  [/linkedin/i, "linkedin"],
  [/instagram/i, "instagram"],
  [/telegram/i, "telegram"],
  [/slack/i, "slack"],
  [/twitter|^x$/i, "x"],
];

export function toPlatform(network: unknown): Platform {
  const n = String(network ?? "");
  for (const [re, p] of NETWORK_MAP) if (re.test(n)) return p;
  return "imessage";
}

const items = (r: any): any[] => (Array.isArray(r) ? r : r?.items ?? r?.data ?? r?.chats ?? r?.messages ?? r?.accounts ?? []);

/** Talks to Beeper Desktop's local API running on the user's own computer. */
export class BeeperProvider implements MessagingProvider {
  private accountPlatform = new Map<string, Platform>();
  constructor(private cfg: BeeperConfig) {}

  private async req(path: string, init?: RequestInit): Promise<any> {
    if (typeof window !== "undefined" && window.bryteDesktop) {
      const result = await window.bryteDesktop.beeperRequest({
        baseUrl: this.cfg.baseUrl, token: this.cfg.token, path,
        method: init?.method ?? "GET",
        ...(typeof init?.body === "string" ? { body: init.body } : {}),
      });
      if (result.status < 200 || result.status >= 300) throw new Error(`Beeper responded ${result.status}`);
      return result.body;
    }
    const res = await fetch(`${this.cfg.baseUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${this.cfg.token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`Beeper responded ${res.status}`);
    return res.status === 204 ? null : res.json();
  }

  async listAccounts(): Promise<Account[]> {
    const list = items(await this.req("/v1/accounts"));
    return list.map((a: any) => {
      const id = String(a.accountID ?? a.id);
      const platform = toPlatform(a.network ?? a.service ?? id);
      this.accountPlatform.set(id, platform);
      return {
        id, platform,
        displayName: a.network ?? platform,
        handle: a.user?.username ?? a.user?.fullName ?? a.user?.email ?? a.user?.phoneNumber ?? "",
        status: "connected" as const,
      };
    });
  }

  async listChats(filters: ChatFilters = {}): Promise<Chat[]> {
    if (!this.accountPlatform.size) await this.listAccounts().catch(() => []);
    const list = items(await this.req("/v1/chats?limit=100"));
    let chats: Chat[] = list.map((c: any) => this.toChat(c));
    if (filters.platforms?.length) chats = chats.filter((c) => filters.platforms!.includes(c.platform));
    if (filters.unreadOnly) chats = chats.filter((c) => c.unreadCount > 0);
    if (filters.chatIds) chats = chats.filter((c) => filters.chatIds!.includes(c.id));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      chats = chats.filter((c) => c.title.toLowerCase().includes(q) || c.lastMessage?.text.toLowerCase().includes(q));
    }
    return chats.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private toChat(c: any): Chat {
    const id = String(c.id ?? c.chatID);
    const accountId = String(c.accountID ?? "");
    const participants: Participant[] = items(c.participants).map((p: any) => ({
      id: String(p.id), name: p.fullName ?? p.username ?? "Unknown", handle: p.username, avatarUrl: p.imgURL, isSelf: !!p.isSelf,
    }));
    const updatedAt = c.lastActivity ?? c.timestamp ?? new Date(0).toISOString();
    const preview = c.preview ?? c.lastMessage;
    return {
      id, accountId,
      platform: this.accountPlatform.get(accountId) ?? toPlatform(c.network ?? accountId),
      title: c.title ?? participants.find((p) => !p.isSelf)?.name ?? "Chat",
      isGroup: c.type === "group",
      participants,
      ...(preview ? { lastMessage: this.toMessage(preview, id) } : {}),
      unreadCount: Number(c.unreadCount ?? 0),
      updatedAt,
    };
  }

  private toMessage(m: any, chatId: string): Message {
    return {
      id: String(m.id ?? m.messageID ?? `${chatId}-${m.timestamp}`),
      chatId: String(m.chatID ?? chatId),
      senderId: String(m.senderID ?? ""),
      text: m.text ?? "",
      sentAt: m.timestamp ?? new Date().toISOString(),
      isFromMe: !!(m.isSender ?? m.isFromMe),
    };
  }

  async getMessages(chatId: string, cursor?: string | null): Promise<MessagePage> {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}&direction=before` : "";
    const r = await this.req(`/v1/chats/${encodeURIComponent(chatId)}/messages${q}`);
    const messages = items(r).map((m: any) => this.toMessage(m, chatId)).sort((a, b) => a.sentAt.localeCompare(b.sentAt));
    return { messages, nextCursor: r?.hasMore ? (r.oldestCursor ?? messages[0]?.id ?? null) : null };
  }

  async sendMessage(chatId: string, text: string): Promise<Message> {
    const r = await this.req(`/v1/chats/${encodeURIComponent(chatId)}/messages`, { method: "POST", body: JSON.stringify({ text }) });
    return { id: String(r?.pendingMessageID ?? r?.id ?? Date.now()), chatId, senderId: "me", text, sentAt: new Date().toISOString(), isFromMe: true };
  }

  async markRead(): Promise<void> {
    // Beeper Desktop marks chats read when opened in the app; nothing to do here.
  }
}
