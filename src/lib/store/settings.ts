"use client";

// Choices for this phone, kept next to the family.

import { useSyncExternalStore } from "react";
import { createLocalStore } from "./local";

export type Settings = {
  /** Games read letters, words and stories out loud. */
  voice: boolean;
  /** "The app listens" in the reading check; off starts the check in "I'll mark it". */
  microphone: boolean;
  /** Daily practice reminder, "HH:MM", added to the parent's calendar. */
  reminderTime: string;
};

const DEFAULTS: Settings = { voice: true, microphone: true, reminderTime: "18:30" };
const store = createLocalStore<Settings>("readcheck.settings.v1", DEFAULTS, (parsed) => ({ ...DEFAULTS, ...(parsed as Partial<Settings>) }));

export const settingsActions = {
  set(patch: Partial<Settings>) {
    store.write({ ...store.read(), ...patch });
  },
  reset() {
    store.write(DEFAULTS);
  },
};

/** For code outside React, such as the voice itself. */
export const readSettings = () => store.read();

export function useSettings(): Settings {
  return useSyncExternalStore(store.subscribe, store.read, () => DEFAULTS);
}
