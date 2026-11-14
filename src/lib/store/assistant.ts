"use client";

// The chat with the assistant, kept on this phone, one thread per child.

import { useMemo, useSyncExternalStore } from "react";
import type { ChatMessage } from "@/lib/assistant/chat";
import { createLocalStore } from "./local";

const KEEP = 40;
const store = createLocalStore<Record<string, ChatMessage[]>>("readcheck.assistant.v1", {});
const NONE: ChatMessage[] = [];

export const chatActions = {
  set(kidId: string, messages: ChatMessage[]) {
    store.write({ ...store.read(), [kidId]: messages.slice(-KEEP) });
  },
  clear(kidId: string) {
    const all = { ...store.read() };
    delete all[kidId];
    store.write(all);
  },
};

export function useChat(kidId: string | undefined): ChatMessage[] {
  const all = useSyncExternalStore(store.subscribe, store.read, () => null);
  return useMemo(() => (kidId && all?.[kidId]) || NONE, [all, kidId]);
}
