"use client";

import { useSyncExternalStore } from "react";
import { emptyData, getStore } from "@/lib/store";
import type { AppData } from "@/lib/types";

const SERVER_SNAPSHOT: AppData = emptyData("server");

/**
 * Everything on the phone, re-rendering on every change:
 *   const data = useAppData();
 *   const store = getStore(); store.addChild(...)
 * The first render (server and hydration) sees empty data; the real data follows right after.
 */
export function useAppData(): AppData {
  const store = getStore();
  return useSyncExternalStore(store.subscribe, store.get, () => SERVER_SNAPSHOT);
}
