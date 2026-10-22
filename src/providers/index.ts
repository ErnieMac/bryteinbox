import type { MessagingProvider } from "./MessagingProvider";
import { MockProvider } from "./MockProvider";

export type { MessagingProvider } from "./MessagingProvider";
export * from "./types";

// Swap for BeeperProvider / UnipileProvider later; components only use this.
export const messagingProvider: MessagingProvider = new MockProvider({ latencyMs: 350 });
