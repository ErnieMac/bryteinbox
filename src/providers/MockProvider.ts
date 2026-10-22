import type { MessagingProvider } from "./MessagingProvider";
import type { Account, Chat, ChatFilters, Message, MessagePage, Participant, Platform } from "./types";
import { PLATFORMS } from "./types";

const PAGE_SIZE = 20;
const SELF: Participant = { id: "me", name: "You", isSelf: true };

const ACCOUNTS: Account[] = PLATFORMS.map((p) => ({
  id: `acc-${p}`,
  platform: p,
  displayName: { imessage: "iMessage", whatsapp: "WhatsApp", linkedin: "LinkedIn", instagram: "Instagram", telegram: "Telegram", slack: "Slack", x: "X" }[p],
  handle: p === "slack" ? "nestamedia.slack.com" : "@nestamedia",
  status: "connected",
}));

type Seed = { platform: Platform; title: string; people?: string[]; lines: [boolean, string][] };

// ~40 chats: business (leads, clients, team) and personal (friends, family, groups).
const SEEDS: Seed[] = [
  { platform: "linkedin", title: "Sarah Lim", lines: [[false, "Loved the demo. Our team lives in 5 inboxes."], [true, "Glad to hear it! Want a walkthrough?"], [false, "Can we lock in a call next Tuesday?"]] },
  { platform: "linkedin", title: "Daniel Okafor", lines: [[false, "Saw your post on creator tooling — are you hiring?"]] },
  { platform: "linkedin", title: "Hannah Weiss", lines: [[false, "We have budget for Q1. Could you send a proposal?"]] },
  { platform: "linkedin", title: "Raj Patel", lines: [[true, "Thanks for connecting, Raj."], [false, "Likewise! Keen to hear about your studio."]] },
  { platform: "linkedin", title: "Emily Carter", lines: [[false, "Following up on the sponsorship deck."]] },
  { platform: "linkedin", title: "Lucas Moreau", lines: [[false, "Would love a quick intro to your partnerships lead."]] },
  { platform: "x", title: "Priya Shah", lines: [[false, "Would love to chat about a pilot for our agency"]] },
  { platform: "x", title: "Ben Archer", lines: [[false, "Your thread on DMs was 🔥"], [true, "Appreciate it Ben!"]] },
  { platform: "x", title: "Nora Quinn", lines: [[false, "Are you open to a podcast appearance?"]] },
  { platform: "x", title: "Felix Grant", lines: [[false, "Is the beta still open?"]] },
  { platform: "x", title: "Chloe Martin", lines: [[true, "DMs open for the giveaway winners"], [false, "I think I won? 🙈"]] },
  { platform: "slack", title: "#launch-week", people: ["Jess Park", "Andre Ruiz", "Leo Tanaka"], lines: [[false, "Landing page is live 🚀"], [false, "beehiiv confirmed the cross-promo for Thursday 🎉"], [false, "Final email pass is waiting on you."]] },
  { platform: "slack", title: "#design", people: ["Jess Park", "Leo Tanaka"], lines: [[false, "New icon set dropped in Figma ✨"]] },
  { platform: "slack", title: "Andre Ruiz", lines: [[false, "Can you review the partner contract today?"]] },
  { platform: "slack", title: "#general", people: ["Jess Park", "Andre Ruiz", "Leo Tanaka", "Mia Chen"], lines: [[false, "Team lunch Friday — who's in?"], [true, "Me!"]] },
  { platform: "slack", title: "Leo Tanaka", lines: [[false, "Edit v3 is uploaded."]] },
  { platform: "slack", title: "#clients-acme", people: ["Andre Ruiz", "Marco Bellini"], lines: [[false, "Acme approved the storyboard."]] },
  { platform: "whatsapp", title: "Mum", lines: [[false, "Are you coming for dinner on Sunday? ❤️"]] },
  { platform: "whatsapp", title: "Tom Becker", lines: [[false, "Contract signed, sending over now"], [true, "Received, thanks Tom!"]] },
  { platform: "whatsapp", title: "Family 🏡", people: ["Mum", "Dad", "Ella"], lines: [[false, "Photos from the weekend!"], [false, "Grandma loved the flowers"]] },
  { platform: "whatsapp", title: "Football Sundays", people: ["Kofi", "Sam", "Jake", "Ade"], lines: [[false, "Pitch booked for 10am ⚽"], [false, "Who's bringing the bibs?"]] },
  { platform: "whatsapp", title: "Ama Mensah", lines: [[false, "Can we move the shoot to Thursday?"]] },
  { platform: "whatsapp", title: "Dad", lines: [[false, "Call me when you're free"]] },
  { platform: "whatsapp", title: "Lagos Trip 2026", people: ["Tolu", "Ngozi", "Femi"], lines: [[false, "Flights are cheaper on the 12th"]] },
  { platform: "imessage", title: "Marco · Acme Co", lines: [[false, "Invoice looks good, paying today."]] },
  { platform: "imessage", title: "Ella", lines: [[false, "Did you see the match last night??"]] },
  { platform: "imessage", title: "Jordan", lines: [[true, "Drinks Friday?"], [false, "Always 🍻"]] },
  { platform: "imessage", title: "Housemates", people: ["Jordan", "Riley", "Sam"], lines: [[false, "Bins go out tonight!"]] },
  { platform: "imessage", title: "Grace Ho", lines: [[false, "Thanks for the referral, they signed!"]] },
  { platform: "imessage", title: "Dentist", lines: [[false, "Reminder: appointment Tue 3pm. Reply Y to confirm."]] },
  { platform: "instagram", title: "Zara Styles", lines: [[false, "Love your reel! Collab?"]] },
  { platform: "instagram", title: "Coffee Lab", lines: [[false, "Your order is ready for pickup ☕"]] },
  { platform: "instagram", title: "Mia Chen", lines: [[false, "Omg that sunset pic 😍"]] },
  { platform: "instagram", title: "Brand Partnerships · Lumen", lines: [[false, "We'd like to send you our new camera to review."]] },
  { platform: "instagram", title: "Kai", lines: [[true, "Haha that meme"], [false, "😂😂"]] },
  { platform: "telegram", title: "Creator Founders", people: ["Alex", "Tara", "Omar", "Lena"], lines: [[false, "Anyone tried Unipile yet?"], [false, "Yes — solid API"]] },
  { platform: "telegram", title: "Omar Haddad", lines: [[false, "Sent you the investor list"]] },
  { platform: "telegram", title: "Crypto Alerts", people: ["Bot"], lines: [[false, "BTC +4.2% in 24h"]] },
  { platform: "telegram", title: "Lena Fischer", lines: [[false, "Can you share the pitch deck?"]] },
  { platform: "telegram", title: "Uni Friends", people: ["Chris", "Dami", "Yusuf"], lines: [[false, "Reunion in March?"]] },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function buildData(now = Date.UTC(2026, 9, 22, 12, 0)) {
  const chats: Chat[] = [];
  const messages = new Map<string, Message[]>();
  SEEDS.forEach((s, i) => {
    const id = `${s.platform}-${slug(s.title)}`;
    const names = s.people ?? [s.title];
    const people: Participant[] = names.map((n) => ({ id: `${id}:${slug(n)}`, name: n }));
    const end = now - i * 47 * 60_000; // spread chats over a few days
    const msgs: Message[] = s.lines.map(([mine, text], j) => ({
      id: `${id}-m${j}`,
      chatId: id,
      senderId: mine ? SELF.id : people[j % people.length].id,
      text,
      sentAt: new Date(end - (s.lines.length - 1 - j) * 6 * 60_000).toISOString(),
      isFromMe: mine,
    }));
    messages.set(id, msgs);
    const last = msgs[msgs.length - 1];
    chats.push({
      id,
      accountId: `acc-${s.platform}`,
      platform: s.platform,
      title: s.title,
      isGroup: names.length > 1,
      participants: [SELF, ...people],
      lastMessage: last,
      unreadCount: last.isFromMe || i % 3 === 2 ? 0 : 1 + (i % 2),
      updatedAt: last.sentAt,
    });
  });
  return { chats, messages };
}

export class MockProvider implements MessagingProvider {
  private chats: Chat[];
  private messages: Map<string, Message[]>;
  private seq = 0;

  constructor() {
    const d = buildData();
    this.chats = d.chats;
    this.messages = d.messages;
  }

  async listAccounts() {
    return ACCOUNTS.map((a) => ({ ...a }));
  }

  async listChats(filters: ChatFilters = {}) {
    const q = filters.search?.trim().toLowerCase();
    return this.chats
      .filter((c) => !filters.platforms?.length || filters.platforms.includes(c.platform))
      .filter((c) => !filters.unreadOnly || c.unreadCount > 0)
      .filter((c) => !filters.chatIds || filters.chatIds.includes(c.id))
      .filter((c) => {
        if (!q) return true;
        if (c.title.toLowerCase().includes(q)) return true;
        if (c.participants.some((p) => p.name.toLowerCase().includes(q))) return true;
        return (this.messages.get(c.id) ?? []).some((m) => m.text.toLowerCase().includes(q));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((c) => ({ ...c }));
  }

  async getMessages(chatId: string, cursor?: string | null): Promise<MessagePage> {
    const all = this.requireMessages(chatId);
    const end = cursor ? Number(cursor) : all.length;
    const start = Math.max(0, end - PAGE_SIZE);
    return { messages: all.slice(start, end), nextCursor: start > 0 ? String(start) : null };
  }

  async sendMessage(chatId: string, text: string) {
    const body = text.trim();
    if (!body) throw new Error("Message is empty");
    const all = this.requireMessages(chatId);
    const msg: Message = {
      id: `${chatId}-sent-${++this.seq}`,
      chatId,
      senderId: SELF.id,
      text: body,
      sentAt: new Date().toISOString(),
      isFromMe: true,
    };
    all.push(msg);
    const chat = this.chats.find((c) => c.id === chatId)!;
    chat.lastMessage = msg;
    chat.updatedAt = msg.sentAt;
    return msg;
  }

  async markRead(chatId: string) {
    const chat = this.chats.find((c) => c.id === chatId);
    if (!chat) throw new Error(`Unknown chat ${chatId}`);
    chat.unreadCount = 0;
  }

  private requireMessages(chatId: string) {
    const all = this.messages.get(chatId);
    if (!all) throw new Error(`Unknown chat ${chatId}`);
    return all;
  }
}
