// The contract between the backend (src/lib, src/app/api) and the screens (src/app, src/components).
// Change a type here only after telling the other side.
//
// Everything a family creates lives on the phone (browser storage). The server keeps nothing:
// each API request carries the context it needs and gets an answer back.

import type { PatternId } from "@/lib/reading/patterns";

export type { PatternId };

// ---------------------------------------------------------------------------------------------
// Basics
// ---------------------------------------------------------------------------------------------

/** ISO 8601 timestamp, e.g. "2026-11-15T09:30:00.000Z". */
export type IsoDateTime = string;
/** Local calendar date, "YYYY-MM-DD". */
export type IsoDate = string;
/** Local time of day, "HH:MM" (24-hour). */
export type TimeOfDay = string;

export type GradeLevel = "preK" | "K" | 1 | 2 | 3 | 4;
export const GRADE_LEVELS: GradeLevel[] = ["preK", "K", 1, 2, 3, 4];

/** US school year: fall = Aug–Nov (beginning), winter = Dec–Feb (middle), spring = Mar–Jul (end). */
export type Season = "fall" | "winter" | "spring";

/** The four areas on Learn and Progress. */
export type Domain = "letters" | "reading" | "numbers" | "math";

/** Explorer = Pre-K, Builder = K–1, Reader = 2–4. Derived from the grade, never stored. */
export type ChildType = "explorer" | "builder" | "reader";

// ---------------------------------------------------------------------------------------------
// Children and settings
// ---------------------------------------------------------------------------------------------

export const MAX_CHILDREN = 3;

export type AvatarId = string;

export type Child = {
  id: string;
  firstName: string;
  grade: GradeLevel;
  avatar: AvatarId;
  /** Practice length; the plan can make weekdays and weekends different. */
  minutesPerDay: { weekday: number; weekend: number };
  createdAt: IsoDateTime;
};

export type Settings = {
  microphone: boolean;
  /** The assistant reads its replies aloud. */
  assistantVoice: boolean;
  /** Daily "Time to play" reminder (a calendar event), or null when off. */
  reminderTime: TimeOfDay | null;
  sounds: boolean;
};

// ---------------------------------------------------------------------------------------------
// The 1-minute checks
// ---------------------------------------------------------------------------------------------

/**
 * Which check a grade gets is in docs/BENCHMARKS.md:
 * passage = grades 1–4 reading, wordList = K reading, letterNaming = Pre-K–1,
 * numberNaming = Pre-K–K, mathFacts = grades 1–4.
 */
export type CheckKind = "passage" | "wordList" | "letterNaming" | "numberNaming" | "mathFacts";

export const CHECK_DOMAIN: Record<CheckKind, Domain> = {
  passage: "reading",
  wordList: "reading",
  letterNaming: "letters",
  numberNaming: "numbers",
  mathFacts: "math",
};

/** How the result was scored: the app listened, the parent marked by hand, or a recorded sample. */
export type CheckMode = "listen" | "manual" | "sample";

export type Verdict = "onTrack" | "practice" | "talkToTeacher";

export type MathOp = "+" | "-" | "×" | "÷";

/** The norm a result was compared with. */
export type NormUsed = {
  source: "published" | "estimate";
  /** e.g. "Hasbrouck & Tindal 2017", "DIBELS 8 LNF", "Rocket Math 2024", "ReadCheck estimate". */
  sourceName: string;
  grade: GradeLevel;
  season: Season;
  /** Minimum per-minute score for "On track". */
  onTrackMin: number;
  /** Minimum per-minute score for "Needs practice"; below it is "Talk to the teacher". */
  practiceMin: number;
  /** Percentile points for the bar, when the source gives them (passage only). */
  percentiles?: Partial<Record<10 | 25 | 50 | 75 | 90, number>>;
};

/** Where the child sits on the result bar. */
export type Placement =
  | { kind: "percentile"; band: "below10" | "10to25" | "25to50" | "50to75" | "75to90" | "above90" }
  | { kind: "band"; band: "red" | "yellow" | "green" | "blue" }
  /** No norm for this grade and season (e.g. K word list in the fall): show the number and growth only. */
  | { kind: "none" };

/** One item of a check, in the order it was shown. */
export type CheckItem =
  /** Passage or word list: one per passage word up to the last one attempted. */
  | { kind: "word"; index: number; text: string; status: "correct" | "misread" | "skipped"; heard?: string; t?: number }
  | { kind: "letter"; shown: string; correct: boolean }
  | { kind: "number"; shown: number; correct: boolean }
  | { kind: "fact"; a: number; op: MathOp; b: number; answer: number; given: number | null; correct: boolean; ms: number };

export type CheckResult = {
  id: string;
  childId: string;
  kind: CheckKind;
  domain: Domain;
  grade: GradeLevel;
  season: Season;
  mode: CheckMode;
  takenAt: IsoDateTime;
  /** Passage or word-list id; undefined for letters, numbers and math. */
  textId?: string;
  /** Seconds the score is based on (at most 60). */
  seconds: number;
  attempted: number;
  correct: number;
  errors: number;
  /** The big number: words, letters, numbers or sums correct per minute. */
  perMinute: number;
  /** correct / attempted, 0–1. */
  accuracy: number;
  /** null when there is no norm to judge by. */
  verdict: Verdict | null;
  norm: NormUsed | null;
  placement: Placement;
  /** "What we noticed" (reading only for now). */
  patterns: PatternId[];
  items: CheckItem[];
  /** Filled in after /api/result-text answers; null until then or when it failed. */
  text: ResultText | null;
};

/** Plain-language text for the result screen and the teacher, written by the AI or the rules. */
export type ResultText = {
  headline: string;
  noticed: string[];
  teacherNote: string;
  source: "ai" | "rules";
};

// ---------------------------------------------------------------------------------------------
// Plan, practice, stars and diary
// ---------------------------------------------------------------------------------------------

export type ActivityId = "hearLetter" | "bigWord" | "speedMath" | "story";

export type Activity = {
  id: ActivityId;
  domain: Domain;
  title: string;
  minutes: number;
  grades: GradeLevel[];
};

/** What a plan concentrates on: a mistake pattern from a check, or a skill a parent mentioned. */
export type Focus =
  | { kind: "pattern"; pattern: PatternId }
  | { kind: "skill"; label: string; activity: ActivityId };

export type PlanWeek = {
  /** 1–4 */
  week: number;
  goal: string;
  activities: ActivityId[];
};

export type Plan = {
  id: string;
  childId: string;
  /** The check the plan was made from, if any. */
  fromResultId: string | null;
  startsOn: IsoDate;
  minutesPerDay: { weekday: number; weekend: number };
  focus: Focus[];
  weeks: PlanWeek[];
  updatedAt: IsoDateTime;
};

/** A finished practice in kid mode, or minutes a parent reported to the assistant. */
export type PracticeSession = {
  id: string;
  childId: string;
  date: IsoDate;
  minutes: number;
  source: "app" | "parent";
  activities: { activity: ActivityId; right: number; wrong: number }[];
  stars: number;
};

/** A note the parent (or the child, via Buddy) told the assistant. Shown in Progress. */
export type DiaryEntry = {
  id: string;
  childId: string;
  at: IsoDateTime;
  text: string;
  by: "parent" | "child";
};

/** Derived numbers for Home and Progress; computed by the backend, never stored. */
export type ChildStats = {
  stars: number;
  streakDays: number;
  practicedToday: boolean;
  lastCheckAt: IsoDateTime | null;
  /** When the weekly check is due (7 days after the last one), or now if there was none. */
  nextCheckDue: IsoDate;
  minutesThisWeek: number;
};

/** One line on the Progress chart. */
export type ProgressSeries = {
  childId: string;
  domain: Domain;
  unit: string;
  points: { at: IsoDateTime; value: number; resultId: string }[];
  /** The grade's "On track" minimum for each season, for the norm line. */
  norm: { season: Season; value: number; source: "published" | "estimate" }[];
  /** "If you keep this pace": a straight line from the last point, null with under 2 checks. */
  projection: { at: IsoDateTime; value: number }[] | null;
  /** e.g. "+6 words per minute in 3 weeks"; null with under 2 checks. */
  summary: string | null;
};

// ---------------------------------------------------------------------------------------------
// Everything on the phone
// ---------------------------------------------------------------------------------------------

export type AppData = {
  version: 1;
  /** True when filled by "Try with a demo family". */
  demo: boolean;
  onboardedAt: IsoDateTime | null;
  children: Child[];
  results: CheckResult[];
  plans: Plan[];
  sessions: PracticeSession[];
  diary: DiaryEntry[];
  settings: Settings;
  /** A random id made on first launch, sent as DEVICE_ID_HEADER for rate limiting only. */
  deviceId: string;
};

/**
 * The storage module the screens call. Implemented in src/lib/store.ts on top of localStorage.
 * Calls are synchronous; subscribe() fires after every change so screens can re-render.
 */
export interface Store {
  get(): AppData;
  subscribe(listener: () => void): () => void;

  addChild(input: Pick<Child, "firstName" | "grade" | "avatar">): Child;
  updateChild(id: string, patch: Partial<Pick<Child, "firstName" | "grade" | "avatar" | "minutesPerDay">>): Child;
  /** Also deletes the child's results, plans, sessions and diary. */
  deleteChild(id: string): void;

  saveResult(result: CheckResult): void;
  setResultText(resultId: string, text: ResultText): void;
  deleteResult(id: string): void;

  /** Makes a new 4-week plan from a result, replacing the child's current plan. */
  startPlan(resultId: string): Plan;
  applyPlanChange(childId: string, change: PlanChange): { undo: () => void };

  logSession(session: Omit<PracticeSession, "id">): PracticeSession;
  addDiary(entry: Omit<DiaryEntry, "id" | "at">): DiaryEntry;

  updateSettings(patch: Partial<Settings>): Settings;
  markOnboarded(): void;
  loadDemoFamily(): void;
  /** Clears the phone and returns the app to onboarding. */
  deleteAllData(): void;

  stats(childId: string): ChildStats;
  progress(childId: string, domain: Domain): ProgressSeries;
  currentPlan(childId: string): Plan | null;
}

// ---------------------------------------------------------------------------------------------
// API: shared
// ---------------------------------------------------------------------------------------------

export const DEVICE_ID_HEADER = "x-device-id";

/** Every route answers errors with this shape and a 4xx/5xx status. */
export type ApiError = { error: string };

/** What the server needs to know about a child. Built on the phone with toChildSnapshot(). */
export type ChildSnapshot = {
  firstName: string;
  grade: GradeLevel;
  type: ChildType;
  stats: ChildStats;
  /** Up to the last 5 results, newest first, without items. */
  recentResults: Omit<CheckResult, "items" | "childId">[];
  plan: Pick<Plan, "minutesPerDay" | "focus" | "weeks" | "startsOn"> | null;
  /** Up to the last 10 diary entries, newest first. */
  diary: Pick<DiaryEntry, "at" | "text" | "by">[];
};

// ---------------------------------------------------------------------------------------------
// API: POST /api/transcribe (reading check, "the app listens")
// ---------------------------------------------------------------------------------------------
// Request: multipart/form-data with
//   audio    the recording (webm/ogg/mp4/wav, at most 75 s)
//   textId   the passage or word list that was read
//   seconds  how long the child read (number)
// The audio is scored and deleted; nothing is kept.

/**
 * A word's result after both models. "check" means wav2vec2 and Whisper disagreed: the parent
 * confirms it on the review screen.
 */
export type HeardWord = {
  index: number;
  status: "correct" | "misread" | "skipped" | "unreached" | "check";
  /** What wav2vec2 heard, for misread and check words. */
  heard?: string;
  /** What Whisper heard, for check words. */
  heardSecond?: string;
  /** Seconds since the start. */
  t?: number;
};

export type TranscribeResponse = {
  words: HeardWord[];
  lastAttempted: number;
  /** Indices with status "check", for the review screen. */
  toReview: number[];
  ms: number;
};

// ---------------------------------------------------------------------------------------------
// API: POST /api/result-text
// ---------------------------------------------------------------------------------------------

export type ResultTextRequest = {
  child: Pick<ChildSnapshot, "firstName" | "grade">;
  result: Omit<CheckResult, "childId" | "text">;
};

export type ResultTextResponse = ResultText;

// ---------------------------------------------------------------------------------------------
// API: POST /api/assistant
// ---------------------------------------------------------------------------------------------

export type Speaker = { kind: "parent" } | { kind: "child"; childId: string };

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  /** Cards shown under an assistant message. */
  cards?: AssistantCard[];
  at: IsoDateTime;
};

/** A change to the plan the parent approves with Apply. */
export type PlanChange =
  | { kind: "setMinutes"; weekday: number; weekend: number }
  | { kind: "addFocus"; focus: Focus }
  | { kind: "removeFocus"; focus: Focus };

/** Where an "open" card leads. */
export type OpenTarget =
  | { kind: "activity"; activity: ActivityId; topic?: string }
  | { kind: "result"; resultId: string }
  | { kind: "check"; childId: string };

/**
 * Cards the assistant can attach to a reply. The phone applies anything that changes data:
 * "log" cards are saved right away (with Undo), "proposeChange" only after Apply.
 * Buddy (child speaker) can only return open, story, stars and cheer.
 */
export type AssistantCard =
  | { kind: "chart"; title: string; childId: string; domain: Domain }
  | { kind: "weekSummary"; childId: string; minutes: number; stars: number; change: string | null }
  | { kind: "open"; label: string; target: OpenTarget }
  | { kind: "proposeChange"; childId: string; description: string; change: PlanChange }
  | { kind: "logDiary"; childId: string; text: string }
  | { kind: "logMinutes"; childId: string; minutes: number; note: string }
  | { kind: "story"; story: Story }
  | { kind: "copyText"; label: string; text: string }
  | { kind: "stars"; childId: string; count: number }
  /** Buddy gives a bonus star and leaves a line for the parent on Home. */
  | { kind: "cheer"; childId: string; bonusStars: number; noteForParent: string };

export const CHILD_CARD_KINDS = ["open", "story", "stars", "cheer"] as const satisfies readonly AssistantCard["kind"][];

export type AssistantRequest = {
  speaker: Speaker;
  /** The last messages of this conversation (the server uses at most 10). */
  messages: Pick<ChatMessage, "role" | "text">[];
  /** The child being talked to or about. Required for a child speaker. */
  child: ChildSnapshot & { id: string };
  /** Other children's first names, so a parent can talk about any of them. */
  family: { id: string; firstName: string; grade: GradeLevel }[];
  today: IsoDate;
};

export type AssistantResponse = {
  reply: string;
  cards: AssistantCard[];
  /** The reply was written by the built-in fallback (no key, limit reached, or an error). */
  fallback: boolean;
  /** Child mode only: the message was steered away from an off-limits topic. */
  redirected?: boolean;
};

// ---------------------------------------------------------------------------------------------
// API: POST /api/story
// ---------------------------------------------------------------------------------------------

export type StoryQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
};

export type Story = {
  title: string;
  topic: string;
  /** Plain text, paragraphs separated by a blank line. */
  text: string;
  grade: GradeLevel;
  questions: StoryQuestion[];
  source: "ai" | "builtIn";
};

export type StoryRequest = {
  topic: string;
  grade: GradeLevel;
  firstName?: string;
};

export type StoryResponse = Story;

// ---------------------------------------------------------------------------------------------
// API: POST /api/interest ("Start 7 days free"; nothing is charged)
// ---------------------------------------------------------------------------------------------

export type InterestRequest = {
  plan: "yearly" | "monthly";
  children: number;
};

export type InterestResponse = { ok: true };
