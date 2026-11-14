"use client";

import type { Assessment } from "@/lib/reading/assess";
import type { ParentSummary } from "@/lib/reading/summary";
import { Button, Card } from "@/components/ui";
import { ORDINAL, VERDICT } from "@/components/verdict";
import { NormBar } from "./norm-bar";
import { type AccountState, SaveProgress } from "./save-progress";

type Props = {
  childName: string;
  assessment: Assessment;
  summary: ParentSummary | null;
  account: AccountState;
  onUnlock: () => void;
  onRetry: () => void;
};

export function ResultStep({ childName, assessment: a, summary, account, onUnlock, onRetry }: Props) {
  const verdict = VERDICT[a.verdict];
  const when = a.norms.usedLaterSeason ? `the winter target for ${ORDINAL[a.grade]} grade` : `${ORDINAL[a.grade]} grade in the ${a.norms.season}`;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${verdict.cls}`}>{verdict.label}</span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          {summary ? summary.headline : <span className="block h-8 w-4/5 animate-pulse rounded-lg bg-line" />}
        </h1>

        <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <p className="font-mono text-6xl font-semibold tabular-nums">{a.score.wcpm}</p>
            <p className="text-sm text-ink-soft">words correct per minute</p>
          </div>
          <div>
            <p className="font-mono text-3xl font-semibold tabular-nums">{Math.round(a.score.accuracy * 100)}%</p>
            <p className="text-sm text-ink-soft">accuracy</p>
          </div>
          <div>
            <p className="font-mono text-3xl font-semibold tabular-nums">{a.norms.values[50]}</p>
            <p className="text-sm text-ink-soft">typical for {when}</p>
          </div>
        </div>

        <NormBar wcpm={a.score.wcpm} values={a.norms.values} childName={childName} />

        <p className="text-sm text-ink-soft">
          Compared with the national reading fluency norms (Hasbrouck &amp; Tindal, 2017) for {when}
          {a.norms.usedLaterSeason ? "; first graders are first measured in winter, so this shows the winter target" : ""}. Percentile band: {a.band}.
        </p>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">What this means</h2>
        {summary ? (
          <p className="mt-3 leading-relaxed">{summary.meaning}</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2" aria-label="Writing the summary">
            <span className="h-4 w-full animate-pulse rounded bg-line" />
            <span className="h-4 w-11/12 animate-pulse rounded bg-line" />
            <span className="h-4 w-2/3 animate-pulse rounded bg-line" />
          </div>
        )}
      </Card>

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {summary.focus.map((f) => (
            <Card key={f.title}>
              <h3 className="font-bold">{f.title}</h3>
              <p className="mt-2 text-ink-soft">{f.why}</p>
              <p className="mt-3 rounded-xl bg-brand-soft px-3 py-2 text-sm">
                <span className="font-semibold">Tonight: </span>
                {f.tonight}
              </p>
            </Card>
          ))}
        </div>
      ) : null}

      <SaveProgress account={account} childName={childName} />

      <Card className="relative overflow-hidden">
        <h2 className="text-xl font-bold">The 4-week plan</h2>
        <ol aria-hidden className="mt-4 flex select-none flex-col gap-3 blur-[5px]">
          {(summary?.plan ?? [1, 2, 3, 4].map((week) => ({ week, goal: "Ten minutes a day of focused practice", daily: "" }))).map((w) => (
            <li key={w.week} className="rounded-xl border-2 border-line px-4 py-3">
              Week {w.week}: {w.goal}
            </li>
          ))}
        </ol>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-sheet/40 p-6 text-center">
          <p className="max-w-sm font-semibold">10 minutes a day, matched to these mistakes, with a re-check every week.</p>
          <Button onClick={onUnlock}>Unlock the plan</Button>
        </div>
      </Card>

      <p className="text-sm text-ink-soft">
        This is a screening, not a diagnosis. For a firmer result the norms authors suggest averaging two readings of different passages; the plan includes the
        second reading.{" "}
        <button type="button" className="underline underline-offset-4 hover:text-ink" onClick={onRetry}>
          Start a new check
        </button>
      </p>
    </div>
  );
}
