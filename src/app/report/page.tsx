"use client";

// The one-page report for the teacher: print it, save it as a PDF, or share it as text.

import Link from "next/link";
import { useState } from "react";
import { reportText, teacherReport } from "@/lib/report";
import { useChecks } from "@/lib/store/checks";
import { useFamily } from "@/lib/store/family";

const VERDICT_TONE: Record<string, string> = { "On track": "bg-mint", "Needs practice": "bg-peach/70", "Talk to the teacher": "bg-candy/60" };

export default function ReportPage() {
  const { ready, active } = useFamily();
  const checks = useChecks(active?.id);
  const [shared, setShared] = useState<string | null>(null);

  if (!ready) return <div className="min-h-dvh bg-mist" />;
  if (!active) {
    return (
      <main className="mx-auto max-w-[680px] p-6 font-app text-night">
        <p>No child on this phone yet.</p>
        <Link href="/welcome" className="underline">Add a child</Link>
      </main>
    );
  }

  const report = teacherReport(active, checks, new Date());

  async function share() {
    const text = reportText(report);
    try {
      if (navigator.share) {
        await navigator.share({ title: `${report.childName}: at-home reading check`, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShared("Copied. Paste it into a message or email to the teacher.");
    } catch {
      // The share sheet was closed; nothing to do.
    }
  }

  return (
    <div className="min-h-dvh bg-lilac font-app text-night print:bg-white">
      <div className="mx-auto max-w-[680px] px-4 py-5 print:p-0">
        <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
          <Link href="/progress" className="flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold">
            ← Back
          </Link>
          <button type="button" onClick={() => window.print()} className="flex h-11 items-center rounded-full bg-night px-4 text-sm font-semibold text-white">
            Print or save as PDF
          </button>
          <button type="button" onClick={share} className="flex h-11 items-center rounded-full bg-lilac-soft px-4 text-sm font-semibold">
            Share as text
          </button>
          {shared ? <p className="w-full text-sm text-night-soft">{shared}</p> : null}
        </div>

        <article className="rounded-[28px] bg-white p-6 shadow-[0_6px_20px_rgba(27,20,51,0.06)] print:rounded-none print:p-0 print:shadow-none">
          <header className="border-b border-night/10 pb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-night-soft">At-home reading and math check · ReadBuddy</p>
            <h1 className="mt-1 text-[26px] font-semibold leading-tight">
              {report.childName} · {report.grade}
            </h1>
            <p className="text-sm text-night-soft">Prepared by the family on {report.madeOn}</p>
          </header>

          {report.areas.length === 0 ? (
            <p className="mt-5 text-[15px]">No checks yet. Do a 1-minute check first, then come back for the report.</p>
          ) : (
            report.areas.map((a) => (
              <section key={a.kind} className="mt-5 break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold">{a.title}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${VERDICT_TONE[a.latest.verdict] ?? "bg-mist"}`}>{a.latest.verdict}</span>
                </div>
                <p className="mt-1 text-[15px]">
                  <b className="text-xl">{a.latest.score}</b> {a.unit}, {a.latest.accuracyPercent}% correct, on {a.latest.date}.{" "}
                  Benchmark: <b>{a.benchmark.value}</b>.{a.change ? ` Change: ${a.change}.` : ""}
                </p>
                <p className="mt-1 text-xs text-night-soft">
                  {a.measure}. Benchmark: {a.benchmark.source}.
                </p>
                {a.history.length > 1 ? (
                  <table className="mt-2 w-full text-left text-sm">
                    <thead className="text-xs text-night-soft">
                      <tr>
                        <th className="py-1 font-medium">Date</th>
                        <th className="py-1 font-medium">Score</th>
                        <th className="py-1 font-medium">Correct</th>
                        <th className="py-1 font-medium">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.history.map((h) => (
                        <tr key={h.date + h.score} className="border-t border-night/5">
                          <td className="py-1">{h.date}</td>
                          <td className="py-1 tabular-nums">{h.score}</td>
                          <td className="py-1 tabular-nums">{h.accuracyPercent}%</td>
                          <td className="py-1">{h.verdict}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </section>
            ))
          )}

          <section className="mt-5 break-inside-avoid border-t border-night/10 pt-4">
            <h2 className="text-lg font-semibold">Practice at home</h2>
            <p className="mt-1 text-[15px]">
              {report.practice.daysLast4Weeks} days of practice in the last 4 weeks{report.practice.streak > 1 ? `, ${report.practice.streak} days in a row now` : ""}.
              {report.goal ? ` Current goal: ${report.goal}.` : ""}
            </p>
          </section>

          <section className="mt-5 break-inside-avoid">
            <h2 className="text-lg font-semibold">Questions for you</h2>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-[15px]">
              {report.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </section>

          <footer className="mt-6 border-t border-night/10 pt-3 text-xs leading-relaxed text-night-soft">
            A screening done at home by a parent with the ReadBuddy app, not a diagnosis. One-minute scores vary from day to day by several words, so trends over several checks matter more than a single number.
            Benchmarks are for comparison only; at-home conditions differ from a school test.
          </footer>
        </article>
      </div>
    </div>
  );
}
