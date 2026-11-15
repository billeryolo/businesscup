# ReadBuddy

**A 1-minute reading and math check that parents run at home, scored against national norms, with
a 4-week practice path and a one-page report for the teacher.** For children from Pre-K to grade 4.
No account: the family's data stays on the phone.

Live: <https://readbuddy-rho.vercel.app> → "Try with a demo family" shows a child with four weeks
of history.

## Why

88–92% of parents believe their child reads at grade level, while 40% of US 4th graders read below
NAEP Basic (2024). Schools screen a few times a year and send home a number without a plan; the
tools with real diagnostics are sold to schools, not parents. ReadBuddy gives the parent the same
kind of 1-minute screening a teacher uses, explains it in plain words, and turns it into practice
that works at home.

## What a family gets

1. **A 1-minute check.** The child reads an unpractised grade-level story aloud (grades 1–4),
   names letters (Pre-K, K) or answers math facts. ReadBuddy listens, counts words correct per
   minute and accuracy, and compares them with published benchmarks.
2. **An honest verdict.** On track / Needs practice / Talk to the teacher, with the mistake
   patterns it noticed (guessing from the first letter, skipping small words, losing the line…).
   Always a screening, never a diagnosis.
3. **A 4-week path.** From the latest check to a realistic goal: weekly aims follow typical growth
   for the grade (about 1.5 words a minute a week in grades 1–2), one short practice a day, a
   re-check every 7th day, check days added to the parent's calendar.
4. **Practice that matches the result.** Short games (Hear a letter, Big word, Speed math, an
   AI-written story about what the child loves) in ReadBuddy's own voice.
5. **A report for the teacher.** One page: scores against named benchmarks, growth, practice days
   and questions to ask. Print, save as PDF or share as text.
6. **A parent assistant** that answers from the child's real numbers, by text or voice, and acts:
   it saves notes to the child's diary, logs reading time, proposes a shorter or longer daily
   practice (Apply / Not now / Undo), shows a mini chart, opens the right game or the teacher
   report.
7. **Buddy, the child's assistant** in kid mode: stories, star counts and games, spoken aloud.
   Safe by design: a child's words never go to an AI, and Buddy can't change anything.
8. **ReadBuddy Plus:** the check and its result are free; the path, games, voice, progress,
   report and assistant are $99 a year or $14.99 a month after a 7-day free trial (nothing is
   charged during the beta).

## Why the results can be trusted

| Number | Source |
|---|---|
| Reading, grades 1–4: words correct per minute by grade and season | Hasbrouck & Tindal (2017) oral reading fluency norms |
| Letter naming, kindergarten | DIBELS 8 benchmark goals (University of Oregon, 2020) |
| Math facts, grades 1–4 | Rocket Math fact fluency benchmarks (2024) |
| Pre-K letters, K math | App goals, labelled as such (no published per-minute benchmark) |
| Weekly growth on the path | Fuchs et al. 1993, Deno et al. 2001 (via Christ et al. 2010) |

Every number and its caveats: [`docs/BENCHMARKS.md`](docs/BENCHMARKS.md).

**Listening.** "The app listens" records the minute and sends it to our speech service
([`speech/app.py`](speech/app.py), on Modal). Two models hear it: wav2vec2-large, which writes what
it hears and catches misreadings, and Whisper, which rarely flags a correct word. Words they agree
on are decided; words they disagree on are shown to the parent to confirm. On a test set of 6
recordings with 66 planted mistakes, this caught 89% of mistakes with 94% of flags correct and an
average words-a-minute error under 1 ([`speech/bakeoff/results.md`](speech/bakeoff/results.md)).
The test voices are synthetic and clearer than children, so real-world numbers will be lower. If
the service can't answer, the browser's own recognizer is used, and the parent can always mark the
reading by hand.

## How it's built

- **Next.js 16** web app (installable, phone-first), deployed on **Vercel**.
- **On the phone:** the family, checks and practice days live in `localStorage`
  ([`src/lib/store/`](src/lib/store/)). No account, no database.
- **Speech:** [`speech/app.py`](speech/app.py) on **Modal**: wav2vec2 + Whisper on a T4 GPU, and
  Kokoro text-to-speech for ReadBuddy's voice. Audio is used for one request and never stored.
- **AI:** DeepSeek writes stories, the parent summary and the assistant's answers; the child's name
  never reaches a model (a placeholder is swapped on our side). Built-in rules answer if it fails.

| Piece | Where |
|---|---|
| Scoring a reading: alignment, words correct per minute, mistake patterns, verdict | [`src/lib/reading/`](src/lib/reading/) |
| Letters and math checks, published goals | [`src/lib/checks/quick.ts`](src/lib/checks/quick.ts) |
| Two-model speech merge and the review step | [`src/lib/speech/merge.ts`](src/lib/speech/merge.ts), [`src/app/api/transcribe/route.ts`](src/app/api/transcribe/route.ts) |
| ReadBuddy's voice: pre-made clips, live voice, phone fallback | [`src/lib/speech/voice.ts`](src/lib/speech/voice.ts), [`src/app/api/speak/route.ts`](src/app/api/speak/route.ts) |
| 4-week path, streak, calendar | [`src/lib/roadmap.ts`](src/lib/roadmap.ts), [`src/components/home/roadmap.tsx`](src/components/home/roadmap.tsx) |
| Teacher report | [`src/lib/report.ts`](src/lib/report.ts), [`src/app/report/page.tsx`](src/app/report/page.tsx) |
| Assistant actions and diary; Buddy | [`src/lib/assistant/actions.ts`](src/lib/assistant/actions.ts), [`src/lib/store/diary.ts`](src/lib/store/diary.ts), [`src/lib/buddy.ts`](src/lib/buddy.ts) |
| Plans and free trial | [`src/lib/plus.ts`](src/lib/plus.ts), [`src/app/plans/page.tsx`](src/app/plans/page.tsx) |
| Progress over time | [`src/lib/progress/`](src/lib/progress/), [`src/lib/progress.ts`](src/lib/progress.ts) |
| AI: DeepSeek, Claude fallback, rules | [`src/lib/ai/`](src/lib/ai/) |
| API contract between screens and backend | [`src/lib/api/contract.ts`](src/lib/api/contract.ts) |
| Games | [`src/lib/games/`](src/lib/games/), [`src/components/games/`](src/components/games/) |

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 101 tests: scoring, norms, speech merge, path, report, games, contract
npm run build
```

Optional settings in `.env.local` (see [`.env.example`](.env.example)): `SPEECH_URL`,
`VOICE_URL`, `SPEECH_TOKEN` for the speech service ([`speech/README.md`](speech/README.md)),
`DEEPSEEK_API_KEY` for the AI. Without them everything still works: the browser listens, the
games use pre-made clips, built-in rules write the text. Deploying: [`docs/SETUP.md`](docs/SETUP.md).

## Privacy

No account and no database: the family lives on the phone. A recording is sent once to be scored
and deleted. The AI sees placeholders, never the child's name. Screening, not diagnosis: the copy
and the AI instructions never name a condition.

Business case and roadmap: [`docs/PITCH.md`](docs/PITCH.md).
