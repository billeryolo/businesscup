import type { AppData, GradeLevel, Settings } from "@/lib/types";

export const DEFAULT_SETTINGS: Settings = {
  microphone: true,
  assistantVoice: true,
  reminderTime: null,
  sounds: true,
};

/** Starting practice length for a new child. */
export const DEFAULT_MINUTES: Record<GradeLevel, number> = { preK: 5, K: 10, 1: 10, 2: 10, 3: 10, 4: 10 };

export function emptyData(deviceId: string): AppData {
  return {
    version: 1,
    demo: false,
    onboardedAt: null,
    children: [],
    results: [],
    plans: [],
    sessions: [],
    diary: [],
    settings: { ...DEFAULT_SETTINGS },
    deviceId,
  };
}
