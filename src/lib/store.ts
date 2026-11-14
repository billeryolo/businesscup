// Everything the family creates, kept on the phone in localStorage. No account, no server.
// Every change replaces the AppData object (never mutates it), so React can compare by reference.
// Screens use getStore() (or the useAppData hook in use-store.ts).

import { DEFAULT_MINUTES, DEFAULT_SETTINGS, emptyData } from "@/lib/defaults";
import { demoFamily } from "@/lib/demo";
import { newId } from "@/lib/ids";
import { applyChange, makePlan } from "@/lib/plan";
import { childStats, currentPlan, progressSeries } from "@/lib/stats";
import { type AppData, type Child, MAX_CHILDREN, type Store } from "@/lib/types";

export const STORAGE_KEY = "readcheck:data:v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export { DEFAULT_MINUTES, DEFAULT_SETTINGS, emptyData };

export class ChildLimitError extends Error {
  constructor() {
    super(`Up to ${MAX_CHILDREN} children.`);
  }
}

type StoreOptions = {
  /** null keeps data in memory only (server, tests, storage blocked). */
  storage?: StorageLike | null;
  now?: () => Date;
  /** Fixed device id instead of a random one (the server snapshot must not be random). */
  deviceId?: string;
};

function load(storage: StorageLike | null, deviceId?: string): AppData {
  if (!storage) return emptyData(deviceId ?? newId());
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed?.version === 1 && Array.isArray(parsed.children)) {
        return { ...emptyData(parsed.deviceId || newId()), ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
      }
    }
  } catch {
    // Corrupt or unreadable: start fresh rather than crash the app.
  }
  return emptyData(newId());
}

export function createStore({ storage = null, now = () => new Date(), deviceId }: StoreOptions = {}): Store {
  let data = load(storage, deviceId);
  const listeners = new Set<() => void>();

  const commit = (next: AppData) => {
    data = next;
    if (storage) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Quota or private mode: keep working in memory for this visit.
      }
    }
    listeners.forEach((l) => l());
  };

  const findChild = (id: string): Child => {
    const child = data.children.find((c) => c.id === id);
    if (!child) throw new Error(`No child ${id}`);
    return child;
  };

  const store: Store = {
    get: () => data,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    addChild({ firstName, grade, avatar }) {
      if (data.children.length >= MAX_CHILDREN) throw new ChildLimitError();
      const minutes = DEFAULT_MINUTES[grade];
      const child: Child = {
        id: newId(),
        firstName: firstName.trim() || "My child",
        grade,
        avatar,
        minutesPerDay: { weekday: minutes, weekend: minutes },
        createdAt: now().toISOString(),
      };
      commit({ ...data, children: [...data.children, child] });
      return child;
    },

    updateChild(id, patch) {
      const updated = { ...findChild(id), ...patch };
      if (patch.firstName !== undefined) updated.firstName = patch.firstName.trim() || updated.firstName;
      commit({ ...data, children: data.children.map((c) => (c.id === id ? updated : c)) });
      return updated;
    },

    deleteChild(id) {
      const keep = <T extends { childId: string }>(xs: T[]) => xs.filter((x) => x.childId !== id);
      commit({
        ...data,
        children: data.children.filter((c) => c.id !== id),
        results: keep(data.results),
        plans: keep(data.plans),
        sessions: keep(data.sessions),
        diary: keep(data.diary),
      });
    },

    saveResult(result) {
      findChild(result.childId);
      const others = data.results.filter((r) => r.id !== result.id);
      commit({ ...data, results: [...others, result] });
    },

    setResultText(resultId, text) {
      commit({ ...data, results: data.results.map((r) => (r.id === resultId ? { ...r, text } : r)) });
    },

    deleteResult(id) {
      commit({ ...data, results: data.results.filter((r) => r.id !== id) });
    },

    startPlan(resultId) {
      const result = data.results.find((r) => r.id === resultId);
      if (!result) throw new Error(`No result ${resultId}`);
      const plan = makePlan(findChild(result.childId), result, now());
      commit({ ...data, plans: [...data.plans.filter((p) => p.childId !== result.childId), plan] });
      return plan;
    },

    applyPlanChange(childId, change) {
      const before = currentPlan(data, childId);
      if (!before) throw new Error("This child has no plan yet");
      const childBefore = findChild(childId);
      const after = applyChange(before, change, now());
      commit({
        ...data,
        plans: data.plans.map((p) => (p.id === before.id ? after : p)),
        children: change.kind === "setMinutes"
          ? data.children.map((c) => (c.id === childId ? { ...c, minutesPerDay: { weekday: change.weekday, weekend: change.weekend } } : c))
          : data.children,
      });
      return {
        undo: () => {
          commit({
            ...data,
            plans: data.plans.map((p) => (p.id === before.id ? before : p)),
            children: data.children.map((c) => (c.id === childId ? { ...c, minutesPerDay: childBefore.minutesPerDay } : c)),
          });
        },
      };
    },

    logSession(session) {
      findChild(session.childId);
      const saved = { ...session, id: newId() };
      commit({ ...data, sessions: [...data.sessions, saved] });
      return saved;
    },

    addDiary(entry) {
      findChild(entry.childId);
      const saved = { ...entry, id: newId(), at: now().toISOString() };
      commit({ ...data, diary: [...data.diary, saved] });
      return saved;
    },

    updateSettings(patch) {
      const settings = { ...data.settings, ...patch };
      commit({ ...data, settings });
      return settings;
    },

    markOnboarded() {
      if (!data.onboardedAt) commit({ ...data, onboardedAt: now().toISOString() });
    },

    loadDemoFamily() {
      commit(demoFamily(now(), data.deviceId));
    },

    deleteAllData() {
      if (storage) {
        try {
          storage.removeItem(STORAGE_KEY);
        } catch {
          // Nothing to remove.
        }
      }
      commit(emptyData(newId()));
    },

    stats: (childId) => childStats(data, childId, now()),
    progress: (childId, domain) => progressSeries(data, childId, domain),
    currentPlan: (childId) => currentPlan(data, childId),
  };

  return store;
}

function browserStorage(): StorageLike | null {
  try {
    const s = window.localStorage;
    const probe = `${STORAGE_KEY}:probe`;
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

let instance: Store | null = null;
let serverInstance: Store | null = null;

/** The phone's store. On the server it's an empty, in-memory, read-only-in-practice store. */
export function getStore(): Store {
  if (typeof window === "undefined") {
    serverInstance ??= createStore({ deviceId: "server" });
    return serverInstance;
  }
  instance ??= createStore({ storage: browserStorage() });
  return instance;
}
