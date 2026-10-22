// Normalised messaging types shared by every provider (Mock, Beeper, Unipile...).

export type Platform = "imessage" | "whatsapp" | "linkedin" | "instagram" | "telegram" | "slack" | "x";

export const PLATFORMS: Platform[] = ["imessage", "whatsapp", "linkedin", "instagram", "telegram", "slack", "x"];

export type Account = {
  id: string;
  platform: Platform;
  displayName: string;
  handle: string;
  status: "connected" | "disconnected" | "error";
};

export type Participant = {
  id: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  isSelf?: boolean;
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  sentAt: string; // ISO timestamp
  isFromMe: boolean;
};

export type Chat = {
  id: string;
  accountId: string;
  platform: Platform;
  title: string;
  isGroup: boolean;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string; // ISO timestamp
};

export type ChatFilters = {
  platforms?: Platform[];
  unreadOnly?: boolean;
  search?: string;
  chatIds?: string[];
};

export type MessagePage = {
  messages: Message[]; // oldest first
  nextCursor: string | null; // pass to load older messages
};
