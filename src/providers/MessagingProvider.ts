import type { Account, Chat, ChatFilters, Message, MessagePage } from "./types";

/** The only way UI code may read or send messages. */
export interface MessagingProvider {
  listAccounts(): Promise<Account[]>;
  listChats(filters?: ChatFilters): Promise<Chat[]>;
  getMessages(chatId: string, cursor?: string | null): Promise<MessagePage>;
  sendMessage(chatId: string, text: string): Promise<Message>;
  markRead(chatId: string): Promise<void>;
}
