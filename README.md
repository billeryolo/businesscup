# ReadBuddy

A one-minute reading check for parents of kids in grades 1–4. The child reads a grade-level
passage aloud; the app counts words correct per minute (WCPM), compares it with the
Hasbrouck & Tindal 2017 oral reading fluency norms, finds the mistake patterns, and gives the
parent a verdict, one thing to do tonight, and a 4-week plan. With an account, results are saved
and a weekly re-check with a new story builds a progress chart. The product plan is in
[`../docs/PLAN.md`](../docs/PLAN.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # scoring, passages, records
npm run build
```

Copy `.env.example` to `.env.local` for optional features:

- Supabase keys turn on accounts, saved results and the dashboard. Without them the free check
  works end to end and account features are hidden.
- `ANTHROPIC_API_KEY` lets Claude write the parent summary; otherwise the built-in rules do.

Speech recognition uses the browser's built-in service, which often mishears names, so a name
(a word capitalized mid-sentence) counts as read whatever was heard; the parent can still tap it
as wrong. The microphone mode works in Chrome, Edge and Safari, after the parent ticks the consent
box. Every browser can use "Score it myself" (the parent taps mistakes and the last word read) and
"Watch a demo recording" (a scripted reader, always labelled as a demo and never saved).

Practice mode (`/practice`) shows one big word at a time or words split into syllables. It is
never scored: both change the task, so the results wouldn't compare with the norms. It uses its own
stories, plus the story from the child's last check, so practice never spoils a future check.

## Deploy

Step by step, including the database: [`docs/SETUP.md`](docs/SETUP.md).

## How it works

| Piece | File |
|---|---|
| Norms table, seasons, percentile bands, the 10-words-below-median rule | `src/lib/reading/norms.ts` |
| Matching what was heard to the passage (misread, skipped, extra, not reached); names get leeway | `src/lib/reading/align.ts`, `src/lib/reading/text.ts` |
| WCPM, accuracy, parent corrections | `src/lib/reading/score.ts` |
| Mistake patterns and their parent-facing copy | `src/lib/reading/patterns.ts` |
| Verdict rules | `src/lib/reading/assess.ts` |
| Passages (12 original stories, readability-checked) and which one comes next | `src/lib/reading/passages.ts` |
| What gets stored per reading (scores, one letter per word, no audio) | `src/lib/reading/record.ts` |
| Rule-based summary and plan | `src/lib/reading/summary.ts` |
| Claude-written summary (the child's name never reaches the model) | `src/lib/ai/parent-summary.ts`, `src/app/api/summary/route.ts` |
| Browser speech recognition and the demo reader | `src/lib/speech/` |
| The check flow screens, consent, save prompts | `src/components/check/` |
| Accounts: sign-in links, session refresh, saving | `src/lib/supabase/`, `src/proxy.ts`, `src/app/auth/`, `src/lib/save.ts` |
| Interest test ("start free trial" clicks) | `src/app/api/interest/route.ts` |
| Dashboard and progress chart | `src/app/dashboard/`, `src/components/dashboard/` |
| Practice mode: one big word at a time, syllables, practice-only stories (never scored) | `src/app/practice/`, `src/components/practice/`, `src/lib/reading/syllables.ts` |
| Weekly calendar reminder, built on the device | `src/lib/calendar.ts`, `src/components/reminder-button.tsx` |
| Share preview image, icons, robots, sitemap | `src/app/opengraph-image.tsx`, `src/app/icon.svg`, `src/app/robots.ts`, `src/app/sitemap.ts` |
| Database schema and row-level security | `supabase/migrations/` |

The result is a screening, not a diagnosis; the copy and the AI instructions never name a
condition.
