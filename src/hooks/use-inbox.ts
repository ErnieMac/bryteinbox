import { useSyncExternalStore } from "react";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagingProvider, type ChatFilters } from "@/providers";
import { OrganiserStore, organiserStore } from "@/lib/organiser-store";

export const accountsQuery = () =>
  queryOptions({ queryKey: ["accounts"], queryFn: () => messagingProvider.listAccounts() });

export const chatsQuery = (filters: ChatFilters = {}) =>
  queryOptions({ queryKey: ["chats", filters], queryFn: () => messagingProvider.listChats(filters) });

export const messagesQuery = (chatId: string) =>
  queryOptions({ queryKey: ["messages", chatId], queryFn: () => messagingProvider.getMessages(chatId) });

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { chatId: string; text: string }) => messagingProvider.sendMessage(v.chatId, v.text),
    onSuccess: (_m, v) => {
      qc.invalidateQueries({ queryKey: ["messages", v.chatId] });
      qc.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => messagingProvider.markRead(chatId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chats"] }),
  });
}

const serverState = new OrganiserStore(null).getState();

/** Subscribes a component to tags, reminders and archive state. */
export function useOrganiser() {
  const state = useSyncExternalStore(
    (cb) => { const off = organiserStore.subscribe(cb); return () => { off(); }; },
    () => organiserStore.getState(),
    () => serverState,
  );
  return { state, store: organiserStore };
}
