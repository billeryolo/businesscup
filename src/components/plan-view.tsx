"use client";

import { useState } from "react";
import type { ParentSummary } from "@/lib/reading/summary";
import { Button, Card } from "@/components/ui";

/** The 4-week plan and the teacher note, shared by the check flow and the dashboard. */
export function PlanView({ summary }: { summary: ParentSummary }) {
  const [copied, setCopied] = useState(false);

  async function copyNote() {
    try {
      await navigator.clipboard.writeText(summary.teacherNote);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-brand bg-brand-soft">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-deep">Today</p>
        <p className="mt-2 text-lg">{summary.plan[0]?.daily}</p>
      </Card>

      <ol className="flex flex-col gap-3">
        {summary.plan.map((w) => (
          <li key={w.week}>
            <Card>
              <p className="text-sm font-semibold text-ink-soft">Week {w.week}</p>
              <p className="mt-1 font-bold">{w.goal}</p>
              <p className="mt-2 text-ink-soft">{w.daily}</p>
            </Card>
          </li>
        ))}
      </ol>

      <Card>
        <h2 className="text-xl font-bold">Note for the teacher</h2>
        <p className="mt-3 leading-relaxed">{summary.teacherNote}</p>
        <Button variant="secondary" className="mt-4" onClick={copyNote}>
          {copied ? "Copied" : "Copy the note"}
        </Button>
      </Card>
    </div>
  );
}
