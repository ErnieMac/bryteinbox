import type { MessagingProvider } from "./MessagingProvider";
import { BeeperProvider, type BeeperConfig } from "./BeeperProvider";

export type { MessagingProvider } from "./MessagingProvider";
export type { BeeperConfig } from "./BeeperProvider";
export * from "./types";

const KEY = "bryteinbox.beeper.v1";
export const DEFAULT_BEEPER_URL = "http://localhost:23373";

/** Beeper settings live only in this browser, on the user's own computer. */
export function readBeeperConfig(): BeeperConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return v?.token ? v : null;
  } catch { return null; }
}

export function saveBeeperConfig(cfg: BeeperConfig | null) {
  if (cfg) localStorage.setItem(KEY, JSON.stringify(cfg));
  else localStorage.removeItem(KEY);
}

export function testBeeper(cfg: BeeperConfig) {
  return new BeeperProvider(cfg).listAccounts();
}

/** Used before any account is connected: no chats, nothing to send to. */
const empty: MessagingProvider = {
  listAccounts: async () => [],
  listChats: async () => [],
  getMessages: async () => ({ messages: [], nextCursor: null }),
  sendMessage: async () => { throw new Error("Connect an account first"); },
  markRead: async () => {},
};

/** Uses Beeper when set up on this device, otherwise nothing. Unipile slots in here later. */
function current(): MessagingProvider {
  const cfg = readBeeperConfig();
  return cfg ? new BeeperProvider(cfg) : empty;
}

export const activeProviderName = (): "beeper" | "none" => (readBeeperConfig() ? "beeper" : "none");

export const messagingProvider: MessagingProvider = {
  listAccounts: () => current().listAccounts(),
  listChats: (f) => current().listChats(f),
  getMessages: (id, c) => current().getMessages(id, c),
  sendMessage: (id, t) => current().sendMessage(id, t),
  markRead: (id) => current().markRead(id),
};
