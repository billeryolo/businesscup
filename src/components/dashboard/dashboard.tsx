"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearPending, readPending } from "@/lib/pending";
import type { Verdict } from "@/lib/reading/assess";
import { expectedWeeklyGrowth, type Grade, normsFor, type Season } from "@/lib/reading/norms";
import { passageById, pickPassage } from "@/lib/reading/passages";
import type { ParentSummary } from "@/lib/reading/summary";
import { ChildLimitError, saveReading } from "@/lib/save";
import { createClient } from "@/lib/supabase/client";
import { PlanView } from "@/components/plan-view";
import { ReminderButton } from "@/components/reminder-button";
import { Card, LinkButton } from "@/components/ui";
import { ORDINAL, VERDICT } from "@/components/verdict";
import { ProgressChart, shortDate } from "./progress-chart";

type Reading = {
  id: string;
  readAt: string;
  passageId: string;
  wcpm: number;
  accuracy: number;
  verdict: Verdict;
  mode: string;
  summary: ParentSummary | null;
};

type Child = { id: string; firstName: string; grade: number; readings: Reading[] };

type Props = {
  email: string;
  season: Season;
  trialPlan: string | null;
  childList: Child[];
};

type PendingStatus = "none" | "saving" | "saved" | "limit" | "error";

export function Dashboard({ email, season, trialPlan, childList }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingStatus>("none");
  const started = useRef(false);

  // A result taken before signing in is waiting on this device: save it to the account.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const result = readPending();
    if (!result) return;
    queueMicrotask(() => setPending("saving"));
    saveReading(createClient(), result)
      .then(() => {
        clearPending();
        setPending("saved");
        router.refresh();
      })
      .catch((error) => {
        if (error instanceof ChildLimitError) clearPending();
        setPending(error instanceof ChildLimitError ? "limit" : "error");
      });
  }, [router]);

  async function deleteReading(id: string) {
    if (!window.confirm("Delete this reading?")) return;
    await createClient().from("readings").delete().eq("id", id);
    router.refresh();
  }

  async function deleteChild(child: Child) {
    if (!window.confirm(`Delete ${child.firstName} and all of their readings? This can't be undone.`)) return;
    await createClient().from("children").delete().eq("id", child.id);
    router.refresh();
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your account and every result in it? This can't be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      window.alert("Your account couldn't be deleted right now. Please email us and we'll delete it by hand.");
      return;
    }
    clearPending();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">My children</h1>
        <p className="mt-1 text-ink-soft">{email}</p>
      </div>

      {pending !== "none" ? (
        <p role="status" className={`rounded-xl px-4 py-3 ${pending === "saving" || pending === "saved" ? "bg-brand-soft" : "bg-bad-soft"}`}>
          {
            {
              saving: "Saving the result from your check…",
              saved: "Your result is saved.",
              limit: "Your account already tracks 3 children, so the last result wasn't saved.",
              error: "The result from your check couldn't be saved. Reload the page to try again.",
            }[pending]
          }
        </p>
      ) : null}

      {trialPlan ? (
        <p className="rounded-xl bg-sun-soft px-4 py-3">
          You asked for the {trialPlan} plan. ReadBuddy is in beta, so everything is free for now and nothing has been charged.
        </p>
      ) : null}

      {childList.length === 0 && pending !== "saving" ? (
        <Card>
          <h2 className="text-xl font-bold">No results yet</h2>
          <p className="mt-2 text-ink-soft">Run a one-minute check and it will show up here.</p>
          <LinkButton href="/check" className="mt-4">
            Start a check
          </LinkButton>
        </Card>
      ) : null}

      {childList.map((child) => (
        <ChildCard key={child.id} child={child} season={season} onDeleteReading={deleteReading} onDeleteChild={() => deleteChild(child)} />
      ))}

      {childList.length > 0 && childList.length < 3 ? (
        <div>
          <LinkButton href="/check" variant="secondary">
            Check another child
          </LinkButton>
        </div>
      ) : null}

      <section className="mt-6 border-t-2 border-line pt-6 text-sm text-ink-soft">
        <h2 className="font-semibold text-ink">Your data</h2>
        <p className="mt-1">We store scores only: no audio and no transcript of what your child said.</p>
        <button type="button" onClick={deleteAccount} className="mt-3 font-semibold text-bad underline-offset-4 hover:underline">
          Delete my account and all results
        </button>
      </section>
    </div>
  );
}

function ChildCard({
  child,
  season,
  onDeleteReading,
  onDeleteChild,
}: {
  child: Child;
  season: Season;
  onDeleteReading: (id: string) => void;
  onDeleteChild: () => void;
}) {
  const grade = child.grade as Grade;
  const norms = normsFor(grade, season);
  const latest = child.readings[child.readings.length - 1];
  const history = [...child.readings].reverse().map((r) => r.passageId);
  const next = pickPassage(grade, history);
  const normLabel = norms.usedLaterSeason ? `the winter target for ${ORDINAL[grade]} grade` : `${ORDINAL[grade]} grade in the ${norms.season}`;
  const latestSummary = [...child.readings].reverse().find((r) => r.summary)?.summary ?? null;

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{child.firstName}</h2>
          <p className="text-ink-soft">{ORDINAL[grade]} grade</p>
        </div>
        {latest ? <span className={`rounded-full px-3 py-1 text-sm font-semibold ${VERDICT[latest.verdict].cls}`}>{VERDICT[latest.verdict].label}</span> : null}
      </div>

      {child.readings.length >= 2 ? <ProgressSummary readings={child.readings} grade={grade} /> : null}

      {latest ? (
        <ProgressChart points={child.readings.map((r) => ({ id: r.id, wcpm: r.wcpm, readAt: r.readAt }))} norms={norms.values} normLabel={normLabel} />
      ) : (
        <p className="text-ink-soft">No readings yet.</p>
      )}

      <div className="flex flex-col gap-2 rounded-xl bg-brand-soft p-4 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Next check: <span className="font-semibold">{next.title}</span>, a new story for {child.firstName}.
        </p>
        <LinkButton href={`/check?child=${child.id}`}>Start this week&apos;s check</LinkButton>
      </div>
      <div className="-mt-3 flex flex-wrap items-start gap-x-6">
        <ReminderButton childName={child.firstName} childId={child.id} />
        <Link
          href={`/practice?grade=${grade}${latest ? `&story=${latest.passageId}` : ""}`}
          className="inline-flex min-h-11 items-center font-semibold text-brand-deep underline-offset-4 hover:underline"
        >
          Practice: big words and syllables
        </Link>
      </div>

      {child.readings.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-ink-soft">
              <tr>
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Story</th>
                <th className="py-2 pr-3 font-medium">Words/min</th>
                <th className="py-2 pr-3 font-medium">Accuracy</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {[...child.readings].reverse().map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="py-2 pr-3 whitespace-nowrap">{shortDate(r.readAt)}</td>
                  <td className="py-2 pr-3">
                    {passageById(r.passageId)?.title ?? r.passageId}
                    {r.mode === "manual" ? <span className="ml-1 text-ink-soft">(scored by you)</span> : null}
                  </td>
                  <td className="py-2 pr-3 font-mono tabular-nums">{r.wcpm}</td>
                  <td className="py-2 pr-3 font-mono tabular-nums">{Math.round(r.accuracy * 100)}%</td>
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => onDeleteReading(r.id)} className="text-ink-soft underline-offset-4 hover:text-bad hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {latestSummary ? (
        <details className="group">
          <summary className="cursor-pointer font-semibold text-brand-deep">The plan from the latest check</summary>
          <div className="mt-4">
            <PlanView summary={latestSummary} />
          </div>
        </details>
      ) : null}

      <div>
        <button type="button" onClick={onDeleteChild} className="text-sm text-ink-soft underline-offset-4 hover:text-bad hover:underline">
          Remove {child.firstName}
        </button>
      </div>
    </Card>
  );
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Change since the first check, the steadier two-check average, and typical growth for the grade. */
function ProgressSummary({ readings, grade }: { readings: Reading[]; grade: Grade }) {
  const first = readings[0];
  const latest = readings[readings.length - 1];
  const previous = readings[readings.length - 2];
  const change = latest.wcpm - first.wcpm;
  const average = Math.round((latest.wcpm + previous.wcpm) / 2);
  const weeks = Math.max(0, (Date.parse(latest.readAt) - Date.parse(first.readAt)) / WEEK_MS);
  const typical = expectedWeeklyGrowth(grade);
  const stats = [
    { value: `${change > 0 ? "+" : ""}${change}`, label: `words/min since ${shortDate(first.readAt)}`, good: change > 0 },
    { value: average, label: "average of the last 2 checks", good: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border-2 border-line px-3 py-3">
            <p className={`font-mono text-2xl font-semibold tabular-nums ${s.good ? "text-good" : ""}`}>{s.value}</p>
            <p className="text-sm text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-ink-soft">
        A typical {ORDINAL[grade]} grader gains about {typical.toFixed(1)} words per minute a week
        {weeks >= 2 ? `, so about ${Math.round(typical * weeks)} over these ${Math.round(weeks)} weeks` : ""}. One reading can be off by a few words, so
        the two-check average is the steadier number.
      </p>
    </div>
  );
}
