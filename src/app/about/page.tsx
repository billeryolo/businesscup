import type { Metadata } from "next";
import Link from "next/link";
import { Card, LinkButton, Logo } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const STEPS = [
  { title: "Your child reads aloud for one minute", body: "A short story at their grade level. The app listens and follows along, word by word." },
  { title: "We compare it with national norms", body: "Words read correctly per minute, the same measure teachers use, against the 2017 national reading norms." },
  { title: "You get the reason and a plan", body: "The mistake pattern behind the score, what to do tonight, and a 10-minute daily plan." },
];

const FAQ = [
  {
    q: "Is this a dyslexia test?",
    a: "No. It is a reading fluency check, the same one-minute measure schools use for screening. It tells you whether your child is on track for their grade and which mistakes they make. If the result is low, it suggests talking to the teacher.",
  },
  {
    q: "How accurate is it?",
    a: "The score is counted the way teachers count it: words read correctly in one minute. Speech recognition can miss a word, so you see every word afterwards and can tap to fix any that were scored wrong. You can also score the reading yourself without the microphone.",
  },
  {
    q: "What happens to my child's voice?",
    a: "No audio is ever stored. With the microphone, your browser's own speech service turns the reading into words, and only the words are used for the score. You can also skip the microphone and score the reading yourself. With an account we keep the scores, never recordings.",
  },
  {
    q: "Which ages is it for?",
    a: "Children in 1st to 4th grade, roughly ages 6 to 10.",
  },
];

export const metadata: Metadata = { alternates: { canonical: "/about" } };

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
        <Logo />
        <div className="flex items-center gap-4">
          {isSupabaseConfigured ? (
            <Link href="/login" className="text-sm font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline">
              Sign in
            </Link>
          ) : null}
          <LinkButton href="/check" variant="secondary" className="min-h-10 px-4 text-sm">
            Start the check
          </LinkButton>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 pt-8 pb-16 md:grid-cols-[1.1fr_0.9fr] md:pt-16">
          <div>
            <p className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-deep">For parents of kids in grades 1–4</p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Your kid hates reading? It might not be laziness.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              In one minute, find out if your child reads at the pace typical for their grade, what is getting in the way, and what to do tonight.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <LinkButton href="/check">Start the free 1-minute check</LinkButton>
              <span className="text-sm text-ink-soft">No sign-up. Works in the browser.</span>
            </div>
          </div>

          <Card className="font-read">
            <p className="font-sans text-sm font-semibold text-ink-soft">2nd grade · fall</p>
            <p className="mt-3 text-xl leading-[2.2]">
              <span className="text-ink-soft">They found an old table in the </span>
              <span className="rounded-md bg-bad-soft px-1 text-bad underline decoration-bad decoration-2">garage</span>
              <span className="text-ink-soft">. They dragged it to the </span>
              <span className="marker">end</span> of the driveway.
            </p>
            <div className="mt-5 flex items-end gap-6 border-t-2 border-line pt-5 font-sans">
              <div>
                <p className="font-mono text-4xl font-semibold">41</p>
                <p className="text-sm text-ink-soft">words correct per minute</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-semibold">50</p>
                <p className="text-sm text-ink-soft">typical for the grade</p>
              </div>
            </div>
            <p className="mt-4 rounded-xl bg-warn-soft px-3 py-2 font-sans text-sm">Guesses from the first letter: &quot;garage&quot; read as &quot;garden&quot;.</p>
          </Card>
        </section>

        <section className="border-y-2 border-line bg-sheet">
          <div className="mx-auto w-full max-w-5xl px-4 py-16">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex flex-col gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand font-semibold text-white">{i + 1}</span>
                  <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
                  <p className="text-ink-soft">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-16">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">A measured result, not a guess</h2>
              <p className="mt-4 leading-relaxed text-ink-soft">
                Schools check reading fluency a few times a year and usually send home a number without a plan. ReadBuddy uses the same method: an unpracticed passage, one
                minute, words correct per minute, compared with the Hasbrouck &amp; Tindal 2017 national norms, built from almost 7 million scores. Children scoring 10 or more
                words below the typical score for their grade usually benefit from daily fluency practice.
              </p>
            </div>
            <Card>
              <h3 className="text-lg font-bold">The free check gives you</h3>
              <ul className="mt-3 flex flex-col gap-2 text-ink-soft">
                <li>Words correct per minute and accuracy</li>
                <li>Where that sits against the norms for the grade and season</li>
                <li>The main mistake pattern, with examples</li>
                <li>One thing to do tonight</li>
              </ul>
              <h3 className="mt-6 text-lg font-bold">The plan adds</h3>
              <ul className="mt-3 flex flex-col gap-2 text-ink-soft">
                <li>A 10-minute daily routine for 4 weeks</li>
                <li>A weekly re-check with a progress chart</li>
                <li>A note to share with the teacher</li>
              </ul>
              <p className="mt-6 text-sm text-ink-soft">7 days free, then $99 a year or $14.99 a month.</p>
            </Card>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 pb-16">
          <div className="grid items-center gap-8 rounded-2xl border-2 border-line bg-sheet p-6 sm:p-10 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-semibold text-brand-deep">Free practice mode</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">One big word at a time, or words in syllables</h2>
              <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
                For younger readers who lose their place: each word fills the screen, or long words are split into parts they can sound out. It can listen and move
                on when the word is read.
              </p>
              <LinkButton href="/practice" variant="secondary" className="mt-5">
                Try practice mode
              </LinkButton>
            </div>
            <p aria-hidden="true" className="hidden font-read text-7xl font-medium tracking-wide md:block">
              sun<span className="text-ink-faint">·</span>
              <span className="text-brand-deep">flow</span>
              <span className="text-ink-faint">·</span>ers
            </p>
          </div>
        </section>

        <section className="border-t-2 border-line bg-sheet">
          <div className="mx-auto w-full max-w-3xl px-4 py-16">
            <h2 className="text-3xl font-bold tracking-tight">Questions</h2>
            <dl className="mt-8 flex flex-col gap-6">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <dt className="font-bold">{f.q}</dt>
                  <dd className="mt-2 leading-relaxed text-ink-soft">{f.a}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-12">
              <LinkButton href="/check">Start the free 1-minute check</LinkButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:justify-between">
        <p>ReadBuddy is a reading fluency screening for parents. It is not a diagnosis and does not replace an evaluation by a specialist.</p>
        <nav className="flex shrink-0 gap-6">
          <Link href="/privacy" className="inline-flex min-h-11 items-center underline-offset-4 hover:text-ink hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center underline-offset-4 hover:text-ink hover:underline">
            Terms
          </Link>
        </nav>
      </footer>
    </div>
  );
}
