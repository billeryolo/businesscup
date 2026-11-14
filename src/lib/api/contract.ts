// The API contract between the frontend and the backend. One file, one source of truth:
// - the backend validates every request body with these schemas and returns these shapes;
// - the frontend calls endpoints only through `src/lib/api/client.ts`, which uses the same schemas;
// - with NEXT_PUBLIC_API_MOCK=1 the client answers from `src/lib/api/mocks.ts`, so the
//   frontend works before the backend exists.
// Change this file only together (both developers agree), and bump CONTRACT_VERSION.

import { z } from "zod";

export const CONTRACT_VERSION = "1.0.0";

// ---------------------------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------------------------

export const Id = z.uuid();
export const IsoDateTime = z.iso.datetime({ offset: true });

/** -1 = Pre-K, 0 = kindergarten, 1–4 = school grades. */
export const Grade = z.number().int().min(-1).max(4);
export type Grade = z.infer<typeof Grade>;

/** Picked by the backend from the grade: -1 → explorer, 0–1 → builder, 2–4 → fluent. */
export const Archetype = z.enum(["explorer", "builder", "fluent"]);
export type Archetype = z.infer<typeof Archetype>;

export const Domain = z.enum(["letters", "reading", "numbers", "math"]);
export type Domain = z.infer<typeof Domain>;

export const Verdict = z.enum(["onTrack", "practice", "talkToTeacher"]);
export const Season = z.enum(["fall", "winter", "spring"]);
export const CheckMode = z.enum(["live", "manual", "demo"]);
export const Plan = z.enum(["yearly", "monthly"]);

export const MathFamily = z.enum(["add5", "add10", "sub10", "add20", "sub20", "mul", "div"]);
export type MathFamily = z.infer<typeof MathFamily>;

export const ErrorCode = z.enum([
  "VALIDATION", // 400: body or query does not match the schema
  "UNAUTHENTICATED", // 401: needs a signed-in parent
  "FORBIDDEN", // 403: not this parent's child or check
  "NOT_FOUND", // 404
  "CHILD_LIMIT", // 409: already 3 children
  "TOO_SHORT", // 422: under 15 seconds or 10 words, ask for another try
  "RATE_LIMITED", // 429
  "INTERNAL", // 500
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

/** Every non-2xx response has this body. */
export const ApiError = z.object({ error: z.object({ code: ErrorCode, message: z.string() }) });
export type ApiError = z.infer<typeof ApiError>;

const Empty = z.object({});
const NoContent = z.null();

// ---------------------------------------------------------------------------------------------
// Family
// ---------------------------------------------------------------------------------------------

export const Child = z.object({
  id: Id,
  firstName: z.string().min(1).max(40),
  grade: Grade,
  archetype: Archetype,
  /** Domains shown for this archetype, in display order. */
  domains: z.array(Domain),
  /** Minutes in a daily session: explorer 5, builder 10, fluent 15. */
  sessionMinutes: z.number().int(),
  stars: z.number().int().min(0),
  streakDays: z.number().int().min(0),
  createdAt: IsoDateTime,
});
export type Child = z.infer<typeof Child>;

export const Me = z.object({
  /** null when nobody is signed in; the free check still works. */
  user: z.object({ id: Id, email: z.email() }).nullable(),
  consentVersion: z.string().nullable(),
  trialPlan: Plan.nullable(),
  children: z.array(Child),
});
export type Me = z.infer<typeof Me>;

export const NewChild = z.object({ firstName: z.string().trim().min(1).max(40), grade: Grade });
export const ChildPatch = NewChild.partial();

// ---------------------------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------------------------

export const ParentSummary = z.object({
  headline: z.string(),
  meaning: z.string(),
  focus: z.array(z.object({ title: z.string(), why: z.string(), tonight: z.string() })),
  plan: z.array(z.object({ week: z.number().int(), goal: z.string(), daily: z.string() })),
  teacherNote: z.string(),
  source: z.enum(["ai", "rules"]),
});
export type ParentSummary = z.infer<typeof ParentSummary>;

export const Pattern = z.object({
  id: z.string(),
  title: z.string(),
  seen: z.string(),
  tip: z.string(),
  examples: z.array(z.object({ word: z.string(), heard: z.string().optional() })),
});

export const Benchmark = z.object({
  /** 50th percentile for the grade and season. */
  median: z.number(),
  /** 25th percentile. */
  p25: z.number(),
  season: Season,
  /** e.g. "Hasbrouck & Tindal 2017". */
  source: z.string(),
});

const ReadingDetails = z.object({
  kind: z.literal("reading"),
  passageId: z.string(),
  passageTitle: z.string(),
  /** Every passage word up to the last one attempted, with how it was read. */
  words: z.array(z.object({ text: z.string(), status: z.enum(["correct", "misread", "skipped"]), heard: z.string().optional() })),
});

const MathDetails = z.object({
  kind: z.literal("math"),
  family: MathFamily,
  items: z.array(z.object({ factId: z.string(), prompt: z.string(), answer: z.number(), given: z.number().nullable(), correct: z.boolean(), responseMs: z.number().int() })),
});

const LettersDetails = z.object({
  kind: z.literal("letters"),
  items: z.array(z.object({ letter: z.string().length(1), correct: z.boolean() })),
});

export const CheckResult = z.object({
  /** null until the check is saved to an account. */
  id: Id.nullable(),
  childId: Id.nullable(),
  domain: Domain,
  takenAt: IsoDateTime,
  mode: CheckMode,
  grade: Grade,
  seconds: z.number().positive().max(60),
  measure: z.enum(["wcpm", "lettersPerMinute", "factsPerMinute"]),
  /** The headline number, in units of `measure`. */
  value: z.number().int().min(0),
  accuracy: z.number().min(0).max(1),
  /** null when there is no published norm for this domain and grade: show progress only. */
  benchmark: Benchmark.nullable(),
  band: z.string().nullable(),
  verdict: Verdict,
  patterns: z.array(Pattern),
  details: z.discriminatedUnion("kind", [ReadingDetails, MathDetails, LettersDetails]),
  /** Set for checks taken while signed out: send it to /api/checks/claim after sign-in. */
  claimToken: z.string().nullable(),
  summary: ParentSummary.nullable(),
});
export type CheckResult = z.infer<typeof CheckResult>;

export const CheckListItem = CheckResult.pick({ id: true, childId: true, domain: true, takenAt: true, mode: true, measure: true, value: true, accuracy: true, verdict: true });

export const DomainProgress = z.object({
  domain: Domain,
  status: z.enum(["notStarted", "onTrack", "practice", "talkToTeacher"]),
  measure: CheckResult.shape.measure.nullable(),
  /** Oldest first: one point per saved check. */
  points: z.array(z.object({ takenAt: IsoDateTime, value: z.number() })),
  /** Benchmark line for the current season, or null if none. */
  benchmark: Benchmark.nullable(),
  /** Expected growth per week at the median, for the dashed "on pace" line. */
  weeklyGrowth: z.number().nullable(),
  lastCheckId: Id.nullable(),
  nextCheckDue: IsoDateTime.nullable(),
});

export const Progress = z.object({ child: Child, domains: z.array(DomainProgress) });
export type Progress = z.infer<typeof Progress>;

// ---------------------------------------------------------------------------------------------
// Content and practice
// ---------------------------------------------------------------------------------------------

export const Passage = z.object({
  id: z.string(),
  title: z.string(),
  grade: Grade,
  /** Words as shown on screen, punctuation included; index = position in the passage. */
  words: z.array(z.object({ display: z.string(), name: z.boolean().optional() })),
  purpose: z.enum(["check", "practice"]),
});
export type Passage = z.infer<typeof Passage>;

export const MathFact = z.object({
  /** Stable id such as "add:7+5" so the backend can score without storing the form. */
  id: z.string(),
  prompt: z.string(),
  /** Present for practice; omitted for checks so answers are scored on the server. */
  answer: z.number().optional(),
});

export const LetterCard = z.object({
  letter: z.string().length(1),
  upper: z.string().length(1),
  /** Short audio-friendly sound hint, e.g. "/b/ as in ball". */
  sound: z.string(),
  example: z.string(),
});

export const ActivityKind = z.enum(["letterTap", "letterCheck", "bigWord", "syllables", "readAloud", "story", "countObjects", "mathFacts", "mathCheck", "readingCheck"]);

export const TodaySession = z.object({
  childId: Id,
  minutes: z.number().int(),
  activities: z.array(z.object({
    kind: ActivityKind,
    domain: Domain,
    skillId: z.string(),
    /** Plain words for the parent, e.g. "Adding within 10". */
    label: z.string(),
    minutes: z.number(),
    /** Query string to pass to the content endpoint for this activity. */
    params: z.record(z.string(), z.string()),
  })),
  /** A due weekly check, shown first when present. */
  dueCheck: z.object({ domain: Domain, kind: ActivityKind }).nullable(),
});

export const Attempt = z.object({
  kind: ActivityKind,
  skillId: z.string(),
  itemId: z.string(),
  correct: z.boolean(),
  responseMs: z.number().int().min(0).max(120_000),
  at: IsoDateTime,
});

export const Story = z.object({
  title: z.string(),
  words: Passage.shape.words,
  questions: z.array(z.object({ q: z.string(), choices: z.array(z.string()).length(3), answer: z.number().int().min(0).max(2) })),
  /** Words the checker found above the child's level in rejected drafts (for the demo). */
  rejectedWords: z.array(z.string()),
  source: z.enum(["ai", "library"]),
});

// ---------------------------------------------------------------------------------------------
// Check submissions (the backend scores; the frontend never computes a verdict)
// ---------------------------------------------------------------------------------------------

export const ReadingSubmission = z.object({
  childId: Id.nullable(),
  /** Used in the summary when signed out; never sent to an AI provider. */
  childName: z.string().max(40),
  grade: Grade,
  passageId: z.string(),
  mode: CheckMode,
  seconds: z.number().positive().max(60),
  /** What the recognizer heard, in order, with seconds since the start. Empty in manual mode. */
  spoken: z.array(z.object({ word: z.string().max(40), t: z.number().min(0).optional() })).max(600),
  /** Manual mode: index of the last word read. */
  lastWordIndex: z.number().int().min(-1).optional(),
  /** Word indices the parent tapped to flip right/wrong. */
  parentMarks: z.array(z.number().int().min(0)).max(600),
  /** Must be true for mode "live". */
  consent: z.boolean(),
});

export const MathSubmission = z.object({
  childId: Id.nullable(),
  childName: z.string().max(40),
  grade: Grade,
  family: MathFamily,
  seconds: z.number().positive().max(60),
  answers: z.array(z.object({ factId: z.string(), given: z.number().nullable(), responseMs: z.number().int().min(0) })).max(200),
});

export const LettersSubmission = z.object({
  childId: Id.nullable(),
  childName: z.string().max(40),
  seconds: z.number().positive().max(60),
  /** The parent taps each letter right or wrong as the child names it. */
  items: z.array(z.object({ letter: z.string().length(1), correct: z.boolean() })).max(100),
});

// ---------------------------------------------------------------------------------------------
// Endpoint registry
// ---------------------------------------------------------------------------------------------

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export type Endpoint = {
  method: Method;
  /** `:name` segments are path params. */
  path: string;
  auth: "public" | "parent";
  query: z.ZodType;
  body: z.ZodType | null;
  response: z.ZodType;
  /** Which requirement(s) need it. */
  fr: string[];
};

const e = <T extends Endpoint>(x: T) => x;

export const endpoints = {
  // Accounts
  sendMagicLink: e({ method: "POST", path: "/api/auth/magic-link", auth: "public", query: Empty, body: z.object({ email: z.email(), next: z.string().startsWith("/").optional() }), response: NoContent, fr: ["FR-01"] }),
  me: e({ method: "GET", path: "/api/me", auth: "public", query: Empty, body: null, response: Me, fr: ["FR-01", "FR-02"] }),
  giveConsent: e({ method: "POST", path: "/api/me/consent", auth: "parent", query: Empty, body: z.object({ version: z.string() }), response: NoContent, fr: ["FR-04"] }),
  deleteAccount: e({ method: "DELETE", path: "/api/me", auth: "parent", query: Empty, body: null, response: NoContent, fr: ["FR-05"] }),

  // Children
  listChildren: e({ method: "GET", path: "/api/children", auth: "parent", query: Empty, body: null, response: z.array(Child), fr: ["FR-02"] }),
  addChild: e({ method: "POST", path: "/api/children", auth: "parent", query: Empty, body: NewChild, response: Child, fr: ["FR-02", "FR-03"] }),
  updateChild: e({ method: "PATCH", path: "/api/children/:childId", auth: "parent", query: Empty, body: ChildPatch, response: Child, fr: ["FR-03"] }),
  deleteChild: e({ method: "DELETE", path: "/api/children/:childId", auth: "parent", query: Empty, body: null, response: NoContent, fr: ["FR-05"] }),
  progress: e({ method: "GET", path: "/api/children/:childId/progress", auth: "parent", query: Empty, body: null, response: Progress, fr: ["FR-20", "FR-21"] }),
  todaySession: e({ method: "GET", path: "/api/children/:childId/today", auth: "parent", query: Empty, body: null, response: TodaySession, fr: ["FR-10"] }),
  logAttempts: e({ method: "POST", path: "/api/children/:childId/attempts", auth: "parent", query: Empty, body: z.object({ attempts: z.array(Attempt).min(1).max(200) }), response: z.object({ stars: z.number().int(), streakDays: z.number().int(), starsEarned: z.number().int() }), fr: ["FR-11", "FR-15"] }),

  // Content
  passage: e({ method: "GET", path: "/api/content/passage", auth: "public", query: z.object({ grade: z.coerce.number().pipe(Grade), purpose: z.enum(["check", "practice"]), childId: Id.optional() }), body: null, response: Passage, fr: ["FR-12", "FR-30"] }),
  letters: e({ method: "GET", path: "/api/content/letters", auth: "public", query: z.object({ set: z.enum(["all", "upper", "lower", "missed"]).default("all"), childId: Id.optional() }), body: null, response: z.array(LetterCard), fr: ["FR-11", "FR-32"] }),
  mathFacts: e({ method: "GET", path: "/api/content/math-facts", auth: "public", query: z.object({ family: MathFamily, purpose: z.enum(["practice", "check"]), count: z.coerce.number().int().min(1).max(60).default(20), childId: Id.optional() }), body: null, response: z.array(MathFact), fr: ["FR-13", "FR-31"] }),
  generateStory: e({ method: "POST", path: "/api/ai/story", auth: "parent", query: Empty, body: z.object({ childId: Id, interest: z.string().trim().min(2).max(40), pattern: z.string().max(20).optional() }), response: Story, fr: ["FR-14"] }),

  // Checks
  previewReading: e({ method: "POST", path: "/api/checks/reading/preview", auth: "public", query: Empty, body: ReadingSubmission, response: CheckResult, fr: ["FR-30"] }),
  submitReading: e({ method: "POST", path: "/api/checks/reading", auth: "public", query: Empty, body: ReadingSubmission, response: CheckResult, fr: ["FR-30", "FR-33"] }),
  submitMath: e({ method: "POST", path: "/api/checks/math", auth: "public", query: Empty, body: MathSubmission, response: CheckResult, fr: ["FR-31", "FR-33"] }),
  submitLetters: e({ method: "POST", path: "/api/checks/letters", auth: "public", query: Empty, body: LettersSubmission, response: CheckResult, fr: ["FR-32", "FR-33"] }),
  claimCheck: e({ method: "POST", path: "/api/checks/claim", auth: "parent", query: Empty, body: z.object({ claimToken: z.string(), childId: Id.nullable(), childName: z.string().max(40) }), response: CheckResult, fr: ["FR-34"] }),
  listChecks: e({ method: "GET", path: "/api/checks", auth: "parent", query: z.object({ childId: Id, domain: Domain.optional() }), body: null, response: z.array(CheckListItem), fr: ["FR-21"] }),
  getCheck: e({ method: "GET", path: "/api/checks/:checkId", auth: "parent", query: Empty, body: null, response: CheckResult, fr: ["FR-22"] }),
  deleteCheck: e({ method: "DELETE", path: "/api/checks/:checkId", auth: "parent", query: Empty, body: null, response: NoContent, fr: ["FR-22"] }),
  summary: e({ method: "POST", path: "/api/summary", auth: "public", query: Empty, body: z.union([z.object({ checkId: Id }), z.object({ claimToken: z.string(), childName: z.string().max(40) })]), response: ParentSummary, fr: ["FR-40"] }),

  // Business
  trialInterest: e({ method: "POST", path: "/api/interest", auth: "public", query: Empty, body: z.object({ plan: Plan, grade: Grade.nullable(), verdict: Verdict.nullable() }), response: NoContent, fr: ["FR-50"] }),
} as const;

export type EndpointName = keyof typeof endpoints;
export type Req<N extends EndpointName> = (typeof endpoints)[N]["body"] extends z.ZodType ? z.input<NonNullable<(typeof endpoints)[N]["body"]>> : undefined;
export type Query<N extends EndpointName> = z.input<(typeof endpoints)[N]["query"]>;
export type Res<N extends EndpointName> = z.output<(typeof endpoints)[N]["response"]>;

/** Page routes owned by the frontend. The backend redirects only to these. */
export const pages = {
  home: "/",
  login: "/login",
  freeCheck: "/check",
  freeMathCheck: "/check/math",
  family: "/dashboard",
  addChild: "/children/new",
  child: "/children/:childId",
  checkResult: "/children/:childId/checks/:checkId",
  play: "/play/:childId",
  playActivity: "/play/:childId/:kind",
  settings: "/settings",
  privacy: "/privacy",
  terms: "/terms",
} as const;
